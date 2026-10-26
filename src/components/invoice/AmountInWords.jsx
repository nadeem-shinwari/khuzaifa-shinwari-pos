import { amountToWords } from '../../utils/numberToWords';

/**
 * "Rupees in words" line below the item table.
 *
 * Hidden when the administrator disables amount-in-words in General Settings.
 */
export default function AmountInWords({ amount, currency = 'PKR', visible = '1' }) {
  if (visible === '0') {
    return null;
  }
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  const unit = currency === 'PKR' ? 'Rupees' : currency;
  const fractionalUnit = currency === 'PKR' ? 'Paise' : 'cents';

  return (
    <div className="invoice-amount-in-words invoice-break">
      <span className="label">Rupees in words:</span>{' '}
      {amountToWords(value, { currency, unit, fractionalUnit })}
    </div>
  );
}
