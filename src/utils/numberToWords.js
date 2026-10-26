/**
 * Converts a numeric amount into English words suitable for invoices.
 *
 * The conversion is a deterministic, dependency-free algorithm (no regular
 * expression based guesswork) so it stays reliable for whole and fractional
 * currency amounts.
 *
 * Defaults assume Pakistani Rupees: 1250 -> "One Thousand Two Hundred Fifty
 * Rupees Only", 1250.50 -> "One Thousand Two Hundred Fifty Rupees and Fifty
 * Paise Only".
 *
 * @param {number|string} amount
 * @param {object} [options]
 * @param {string} [options.currency='PKR']
 * @param {string} [options.unit='Rupees']         singular major unit name
 * @param {string} [options.fractionalUnit='Paise'] singular minor unit name
 * @param {string} [options.only='Only']
 * @returns {string}
 */
const SMALL = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

const GROUP_NAMES = ['', 'Thousand', 'Million', 'Billion'];

/** Convert an integer in the range 0-999 to words. */
function convertChunk(n) {
  let out = '';
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) {
    out += SMALL[hundreds] + ' Hundred';
  }
  if (rest > 0) {
    if (out !== '') out += ' ';
    if (rest < 20) {
      out += SMALL[rest];
    } else {
      const ten = Math.floor(rest / 10);
      const one = rest % 10;
      out += TENS[ten];
      if (one > 0) {
        out += ' ' + SMALL[one];
      }
    }
  }
  return out;
}

/** Convert a non-negative integer to words. */
function convertInteger(n) {
  if (n === 0) {
    return 'Zero';
  }
  const groups = [];
  let num = n;
  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }
  let out = '';
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    const chunk = convertChunk(groups[i]);
    if (chunk !== '') {
      if (out !== '') out += ' ';
      out += chunk;
      if (GROUP_NAMES[i]) {
        out += ' ' + GROUP_NAMES[i];
      }
    }
  }
  return out;
}

/**
 * Convert an amount to English words.
 *
 * @returns {string} e.g. "One Thousand Two Hundred Fifty Rupees Only"
 */
export function amountToWords(
  amount,
  {
    currency = 'PKR',
    unit = 'Rupees',
    fractionalUnit = 'Paise',
    only = 'Only',
  } = {},
) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return '';
  }

  const abs = Math.abs(value);
  const major = Math.floor(abs);
  const minor = Math.round((abs - major) * 100);

  const parts = [];
  if (major > 0) {
    parts.push(`${convertInteger(major)} ${unit}`);
  } else if (minor === 0) {
    parts.push(`Zero ${unit}`);
  }
  if (minor > 0) {
    parts.push(`${convertInteger(minor)} ${fractionalUnit}`);
  }
  if (parts.length === 0) {
    parts.push(`Zero ${unit}`);
  }

  let result = parts.length > 1 ? parts.join(' and ') : parts[0];
  if (value < 0) {
    result = `Minus ${result}`;
  }
  return `${result} ${only}`;
}

export default { amountToWords, convertInteger };
