<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

/**
 * Read-only invoice print endpoints.
 *
 * Aggregates the saved sale/purchase record, its line items, the related
 * customer or supplier details and the General Settings display configuration
 * into a single payload for the print templates. No client-supplied value is
 * treated as authoritative: totals come from the server-calculated record.
 */
final class InvoicePrintController
{
    public function showSale(Request $request, array $params = []): void
    {
        Auth::requireUser();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Sale invoice not found');
        }

        $pdo = Database::connection();
        $sale = $this->fetchSale($pdo, $id);
        if ($sale === null) {
            Response::notFound('Sale invoice not found');
        }

        $items = $this->parseItems($sale['items'] ?? null);
        $party = $this->fetchParty($pdo, 'customers', $sale['customer_code'] ?? null, $sale['customer_name'] ?? null);
        $settings = $this->settingsMap($pdo);

        $totals = $this->computeTotals($items, (float) ($sale['total_amount'] ?? 0));

        Response::ok([
            'type' => 'sale',
            'invoice' => array_merge($sale, [
                'items' => $items,
                'invoice_number' => $sale['id'],
                'invoice_date' => $sale['sale_date'] ?? null,
                'party_name' => $sale['customer_name'] ?? null,
                'party_code' => $sale['customer_code'] ?? null,
            ]),
            'party' => $party,
            'items' => $items,
            'totals' => $totals,
            'settings' => $settings,
        ], 'Sale invoice data loaded');
    }

    public function showPurchase(Request $request, array $params = []): void
    {
        Auth::requireUser();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Purchase invoice not found');
        }

        $pdo = Database::connection();
        $purchase = $this->fetchPurchase($pdo, $id);
        if ($purchase === null) {
            Response::notFound('Purchase invoice not found');
        }

        $items = $this->parseItems($purchase['items'] ?? null);
        $party = $this->fetchParty($pdo, 'suppliers', $purchase['supplier_code'] ?? null, $purchase['supplier_name'] ?? null);
        $settings = $this->settingsMap($pdo);

        $totals = $this->computeTotals($items, (float) ($purchase['total_amount'] ?? 0));

        Response::ok([
            'type' => 'purchase',
            'invoice' => array_merge($purchase, [
                'items' => $items,
                'invoice_number' => $purchase['id'],
                'invoice_date' => $purchase['purchase_date'] ?? null,
                'party_name' => $purchase['supplier_name'] ?? null,
                'party_code' => $purchase['supplier_code'] ?? null,
            ]),
            'party' => $party,
            'items' => $items,
            'totals' => $totals,
            'settings' => $settings,
        ], 'Purchase invoice data loaded');
    }

    private function fetchSale(PDO $pdo, int $id): ?array
    {
        $statement = $pdo->prepare('SELECT * FROM sales WHERE id = :id LIMIT 1');
        $statement->execute([':id' => $id]);
        $row = $statement->fetch(\PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    private function fetchPurchase(PDO $pdo, int $id): ?array
    {
        $statement = $pdo->prepare('SELECT * FROM purchases WHERE id = :id LIMIT 1');
        $statement->execute([':id' => $id]);
        $row = $statement->fetch(\PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /**
     * Parse the JSON line items stored on the record, falling back to the
     * denormalised single-item columns when the JSON column is empty.
     *
     * @return array<array<string, mixed>>
     */
    private function parseItems(?string $itemsJson): array
    {
        $parsed = [];
        if (is_string($itemsJson) && trim($itemsJson) !== '') {
            $decoded = json_decode($itemsJson, true);
            if (is_array($decoded)) {
                $parsed = $decoded;
            }
        }

        $normalised = [];
        foreach ($parsed as $item) {
            if (!is_array($item)) {
                continue;
            }
            $quantity = $this->toFloat($item['quantity'] ?? 0);
            $unitPrice = $this->toFloat($item['unit_price'] ?? $item['price'] ?? 0);
            $lineTotal = $this->toFloat(
                $item['line_total'] ?? $item['total'] ?? ($quantity * $unitPrice)
            );
            $normalised[] = [
                'item_id' => $item['item_id'] ?? $item['id'] ?? null,
                'item_name' => $item['item_name'] ?? $item['name'] ?? '',
                'item_unit' => $item['item_unit'] ?? $item['unit'] ?? '',
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'line_total' => $lineTotal,
                'discount_percent' => $this->toFloat($item['discount_percent'] ?? 0),
            ];
        }

        return $normalised;
    }

    private function fetchParty(PDO $pdo, string $table, ?string $code, ?string $name): array
    {
        $party = [
            'name' => $name ?? '',
            'code' => $code ?? '',
            'address' => null,
            'phone' => null,
            'alternate_phone' => null,
        ];

        if ($code !== '' && $code !== null) {
            $statement = $pdo->prepare(
                "SELECT name, phone, alternate_phone, address FROM {$table} WHERE code = :code LIMIT 1"
            );
            $statement->execute([':code' => $code]);
            $row = $statement->fetch(\PDO::FETCH_ASSOC);
            if (is_array($row)) {
                $party['name'] = $row['name'] ?? $name ?? '';
                $party['phone'] = $row['phone'] ?? null;
                $party['alternate_phone'] = $row['alternate_phone'] ?? null;
                $party['address'] = $row['address'] ?? null;
            }
        }

        return $party;
    }

    /**
     * Load all settings into a flat key => value map. Terms and conditions
     * (group "terms") are collected into a single array under one key.
     */
    private function settingsMap(PDO $pdo): array
    {
        $statement = $pdo->query('SELECT setting_key, setting_value, setting_group FROM settings');
        $rows = $statement->fetchAll(\PDO::FETCH_ASSOC) ?? [];

        $map = [];
        $terms = [];
        foreach ($rows as $row) {
            $key = $row['setting_key'];
            $value = $row['setting_value'] ?? '';
            $group = $row['setting_group'] ?? 'general';
            if ($group === 'terms') {
                $terms[] = $value;
            } else {
                $map[$key] = $value;
            }
        }
        if ($terms !== []) {
            $map['terms_and_conditions'] = $terms;
        }

        return $map;
    }

    /**
     * Compute display totals from server-calculated data.
     *
     * The grand total is the server-calculated total_amount (source of truth).
     * The subtotal is the sum of the saved line totals. Any difference between
     * the two is presented as additional charges or discount only when it is
     * non-zero; otherwise those rows are omitted by the template.
     *
     * @return array{subtotal: float, discount: float, additional_charges: float, grand_total: float}
     */
    private function computeTotals(array $items, float $grandTotal): array
    {
        $subtotal = 0.0;
        foreach ($items as $item) {
            $subtotal += (float) ($item['line_total'] ?? 0);
        }

        $difference = $grandTotal - $subtotal;
        $additionalCharges = $difference > 0 ? $difference : 0.0;
        $discount = $difference < 0 ? -$difference : 0.0;

        return [
            'subtotal' => (float) round($subtotal, 2),
            'discount' => (float) round($discount, 2),
            'additional_charges' => (float) round($additionalCharges, 2),
            'grand_total' => (float) round($grandTotal, 2),
        ];
    }

    private function toFloat(mixed $value): float
    {
        $result = is_numeric($value) ? (float) $value : 0.0;
        return is_nan($result) || is_infinite($result) ? 0.0 : $result;
    }
}
