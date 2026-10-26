import { formatDate } from '../../utils/format';

/**
 * Bordered party (customer/supplier) and invoice information block.
 *
 * Optional empty fields are hidden gracefully - no literal "null" or
 * "undefined" values and no unnecessary empty labels.
 */
export default function InvoicePartyDetails({ type, party, invoice }) {
  const isSale = type === 'sale';
  const partyLabel = isSale ? 'Customer' : 'Supplier';
  const numberLabel = isSale ? 'Invoice No' : 'Purchase No';
  const dateLabel = isSale ? 'Invoice Date' : 'Purchase Date';

  const partyName = party?.name || invoice?.party_name || '';
  const partyAddress = party?.address || '';
  const partyPhone = party?.phone || party?.alternate_phone || '';
  const invoiceNumber = invoice?.invoice_number || invoice?.id || '';
  const invoiceDate = invoice?.invoice_date || (isSale ? invoice?.sale_date : invoice?.purchase_date) || '';

  const showName = partyName !== '';
  const showAddress = partyAddress !== '';
  const showPhone = partyPhone !== '';
  const showNumber = invoiceNumber !== '';
  const showDate = invoiceDate !== '';

  const rows = [];
  if (showName || showNumber) {
    rows.push([
      { label: partyLabel, value: partyName },
      { label: numberLabel, value: invoiceNumber },
    ]);
  }
  if (showAddress || showDate) {
    rows.push([
      { label: 'Address', value: showAddress ? partyAddress : '' },
      { label: dateLabel, value: showDate ? formatDate(invoiceDate) : '' },
    ]);
  }
  if (showPhone) {
    rows.push([{ label: 'Phone', value: partyPhone }, { label: '', value: '' }]);
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <table className="invoice-party-table">
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} className={cell.label ? 'label' : 'value'}>
                {cell.value !== '' && (
                  <>
                    {cell.label && <span className="label-text">{cell.label}:</span>}
                    <span className="value-text">{cell.value}</span>
                  </>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
