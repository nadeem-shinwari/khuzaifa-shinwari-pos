import { formatCurrency } from '../../utils/format';

/**
 * Itemised invoice table.
 *
 * Columns: serial number, description, quantity, rate, amount. Line amounts
 * come from the saved line items (server-calculated). The unit of measure is
 * appended to the description when available.
 */
export default function InvoiceItemsTable({ items = [], currency = 'PKR' }) {
  const hasDiscount = items.some((item) => Number(item.discount_percent || 0) > 0);

  return (
    <table className="invoice-items invoice-break">
      <thead>
        <tr>
          <th className="serial">#</th>
          <th>Description</th>
          <th className="qty">Qty</th>
          <th className="rate">Rate</th>
          <th className="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={5} className="value" style={{ textAlign: 'center', color: '#666' }}>
              No line items.
            </td>
          </tr>
        ) : (
          items.map((item, index) => {
            const description = item.item_unit
              ? `${item.item_name} (${item.item_unit})`
              : item.item_name;
            return (
              <tr key={item.item_id ?? index}>
                <td className="serial">{index + 1}</td>
                <td>{description || '—'}</td>
                <td className="qty">{item.quantity}</td>
                <td className="rate">{formatCurrency(item.unit_price, currency)}</td>
                <td className="amount">{formatCurrency(item.line_total, currency)}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
