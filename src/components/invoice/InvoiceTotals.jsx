import { formatCurrency } from '../../utils/format';

/**
 * Invoice totals block. Grand total is the server-calculated value (source of
 * truth). Discount and additional charges rows are shown only when non-zero.
 */
export default function InvoiceTotals({ totals, currency = 'PKR' }) {
  const {
    subtotal = 0,
    discount = 0,
    additional_charges = 0,
    grand_total = 0,
  } = totals || {};

  const rows = [
    { label: 'Subtotal', value: subtotal, bold: false },
  ];
  if (discount > 0) {
    rows.push({ label: 'Discount', value: -discount, bold: false });
  }
  if (additional_charges > 0) {
    rows.push({ label: 'Additional charges', value: additional_charges, bold: false });
  }
  rows.push({ label: 'Grand total', value: grand_total, bold: true });

  return (
    <table className="invoice-items invoice-break" style={{ width: 'auto', marginLeft: 'auto', border: 'none' }}>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} style={{ border: 'none', background: row.bold ? '#eef6f6' : 'transparent' }}>
            <td
              style={{
                border: 'none',
                padding: '3px 6px',
                textAlign: 'right',
                fontWeight: row.bold ? 700 : 400,
                fontSize: row.bold ? 7.8 : 7.4,
                color: row.bold ? '#1a1a1a' : '#333',
              }}
              colSpan={4}
            >
              {row.label}
            </td>
            <td
              className="amount-cell"
              style={{
                border: row.bold ? '1.2pt solid #216666' : '0.75pt solid #2a7f7f',
                padding: '3px 6px',
                textAlign: 'right',
                fontWeight: row.bold ? 700 : 400,
                fontSize: row.bold ? 7.8 : 7.4,
                color: row.bold ? '#1a1a1a' : '#333',
                background: row.bold ? '#eef6f6' : 'transparent',
              }}
            >
              {formatCurrency(row.value, currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
