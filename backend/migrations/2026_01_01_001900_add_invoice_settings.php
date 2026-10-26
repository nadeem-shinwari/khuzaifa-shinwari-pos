<?php

declare(strict_types=1);

/**
 * Seeds default invoice display settings into the existing settings table.
 *
 * Settings are stored as key/value pairs, so no schema change is required.
 * The migration is idempotent: existing rows are never overwritten, so an
 * administrator can freely customise values through the General Settings page
 * without the migration resetting them on later runs.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $now = date('Y-m-d H:i:s');

        $defaults = [
            // Company identity
            ['company_slogan', '', 'general'],
            ['company_logo_path', '', 'general'],
            ['header_image_path', '', 'general'],
            // Contact details
            ['email_address', '', 'general'],
            ['website', '', 'general'],
            // Currency and display behaviour
            ['currency', 'PKR', 'general'],
            ['invoice_header_visible', '1', 'general'],
            ['company_name_visible', '1', 'general'],
            ['logo_visible', '1', 'general'],
            ['slogan_visible', '1', 'general'],
            ['contact_details_visible', '1', 'general'],
            // Amount in words
            ['amount_in_words_visible', '1', 'general'],
            // Footer
            ['footer_visible', '1', 'general'],
            ['signature_visible', '1', 'general'],
            ['signature_label', 'Authorized Signature', 'general'],
            ['authorized_name', '', 'general'],
            ['authorized_designation', '', 'general'],
            ['footer_message', '', 'general'],
        ];

        foreach ($defaults as [$key, $value, $group]) {
            $statement = $pdo->prepare(
                'INSERT INTO settings (setting_key, setting_value, setting_group, updated_at)
                 SELECT :key, :value, :group, :updated_at
                 FROM DUAL
                 WHERE NOT EXISTS (
                     SELECT 1 FROM settings WHERE setting_key = :key_check LIMIT 1
                 )'
            );
            $statement->execute([
                ':key' => $key,
                ':value' => $value,
                ':group' => $group,
                ':updated_at' => $now,
                ':key_check' => $key,
            ]);
        }

        // Default terms and conditions (group "terms"), one row per term.
        $terms = [
            'Goods once sold will not be taken back or exchanged.',
            'Payment is due within the agreed credit period.',
            'All disputes are subject to Quetta jurisdiction.',
        ];
        foreach ($terms as $index => $text) {
            $key = 'term_' . ($index + 1);
            $statement = $pdo->prepare(
                'INSERT INTO settings (setting_key, setting_value, setting_group, updated_at)
                 SELECT :key, :value, :group, :updated_at
                 FROM DUAL
                 WHERE NOT EXISTS (
                     SELECT 1 FROM settings WHERE setting_key = :key_check LIMIT 1
                 )'
            );
            $statement->execute([
                ':key' => $key,
                ':value' => $text,
                ':group' => 'terms',
                ':updated_at' => $now,
                ':key_check' => $key,
            ]);
        }
    }

    public function down(PDO $pdo, string $driver): void
    {
        // Intentionally empty: do not remove administrator-managed settings.
    }
};
