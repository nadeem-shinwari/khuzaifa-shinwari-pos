/**
 * Invoice footer: terms and conditions (lower-left) and the authorised
 * signature area (lower-right). Both are driven by General Settings and are
 * hidden when not configured.
 */
export default function InvoiceFooter({ settings }) {
  const {
    footer_visible = '1',
    signature_visible = '1',
    signature_label = 'Authorized Signature',
    authorized_name = '',
    authorized_designation = '',
    footer_message = '',
  } = settings || {};

  const terms = settings?.terms_and_conditions || [];
  const showFooter = footer_visible !== '0';
  const showSignature = signature_visible !== '0';
  const showTerms = showFooter && terms.length > 0;
  const showMessage = showFooter && footer_message !== '';

  if (!showTerms && !showSignature && !showMessage) {
    return null;
  }

  return (
    <div className="invoice-footer">
      <div className="invoice-terms">
        {showTerms && (
          <>
            <div className="terms-title">Terms and conditions</div>
            <ul>
              {terms.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
          </>
        )}
        {showMessage && <div style={{ marginTop: 6, fontSize: 7.2, color: '#555' }}>{footer_message}</div>}
      </div>

      {showSignature && (
        <div className="invoice-signature">
          <div className="sig-label">{signature_label}</div>
          <div className="sig-line">Signature</div>
          {authorized_name && (
            <div className="sig-name">
              {authorized_name}
              {authorized_designation && <br />}
              {authorized_designation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
