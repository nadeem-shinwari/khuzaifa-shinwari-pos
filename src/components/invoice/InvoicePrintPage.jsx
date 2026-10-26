import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../../services/api';
import { formatDate } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { Alert, LoadingState } from '../../components/ui/Alert';
import InvoiceHeader from './InvoiceHeader';
import InvoicePartyDetails from './InvoicePartyDetails';
import InvoiceItemsTable from './InvoiceItemsTable';
import InvoiceTotals from './InvoiceTotals';
import AmountInWords from './AmountInWords';
import InvoiceFooter from './InvoiceFooter';

const TITLES = { sale: 'SALE INVOICE', purchase: 'PURCHASE INVOICE' };

/**
 * Shared sale/purchase invoice print page.
 *
 * Loads the saved invoice (header, line items, party, totals and display
 * settings) from the API, then triggers window.print() only once the data has
 * finished loading. Never prints while loading.
 */
export default function InvoicePrintPage({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const printed = useRef(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await apiGet(`${type}s/${id}/print`);
        if (active) setData(payload?.data ?? payload);
      } catch (caught) {
        if (active) setError(caught.message || 'Unable to load invoice.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [type, id]);

  // Print automatically once the invoice data has loaded (and only once).
  useEffect(() => {
    if (!printed.current && !loading && data) {
      printed.current = true;
      window.print();
    }
  }, [data, loading]);

  if (loading) {
    return (
      <div className="invoice-page" style={{ padding: 40, textAlign: 'center' }}>
        <LoadingState label="Loading invoice..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-page" style={{ padding: 40, textAlign: 'center' }}>
        <Alert variant="error" title="Unable to load invoice">{error}</Alert>
        <div className="invoice-print-bar" style={{ justifyContent: 'center', marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  const { invoice, items, totals, settings } = data;
  const currency = settings?.currency || 'PKR';
  const visible = (key, def = '1') => (settings?.[key] !== undefined ? settings[key] : def);

  return (
    <div className="invoice-page">
      <div className="invoice-print-bar no-print">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            const path = type === 'sale' ? `/sales/${id}/invoice` : `/purchases/${id}/invoice`;
            navigate(path);
          }}
        >
          Back to invoice
        </Button>
        <Button type="button" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      <InvoiceHeader settings={settings} />

      <div className="invoice-title-row">
        <div>
          <h2 className="invoice-title">{TITLES[type]}</h2>
        </div>
        <div className="invoice-meta">
          {invoice?.invoice_number != null && (
            <div>#{invoice.invoice_number}</div>
          )}
          {invoice?.invoice_date && <div>{formatDate(invoice.invoice_date)}</div>}
        </div>
      </div>

      <InvoicePartyDetails type={type} party={data.party} invoice={invoice} />

      <div className="invoice-break">
        <InvoiceItemsTable items={items} currency={currency} />
      </div>

      <div className="invoice-break" style={{ marginLeft: 'auto', marginTop: 6 }}>
        <InvoiceTotals totals={totals} currency={currency} />
      </div>

      <AmountInWords
        amount={totals?.grand_total ?? invoice?.total_amount ?? 0}
        currency={currency}
        visible={visible('amount_in_words_visible')}
      />

      <InvoiceFooter settings={settings} />

      <div className="invoice-footer-note no-print">
        Generated from the saved invoice record. Company details, terms and
        totals are taken from General Settings and the saved sale/purchase record.
      </div>
    </div>
  );
}
