import { useParams } from 'react-router-dom';
import InvoicePrintPage from '../components/invoice/InvoicePrintPage';

export default function SalePrintInvoice() {
  const { id } = useParams();
  return <InvoicePrintPage type="sale" />;
}
SalePrintInvoice.displayName = 'SalePrintInvoice';
