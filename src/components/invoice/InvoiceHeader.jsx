import { useState } from 'react';

/**
 * Company header rendered from General Settings.
 *
 * Only enabled and populated fields are displayed. When no logo or header
 * image is configured the header falls back to clean text - no broken image
 * or empty placeholder is ever shown.
 */
export default function InvoiceHeader({ settings }) {
  const {
    company_name,
    company_name_visible = '1',
    company_slogan,
    slogan_visible = '1',
    company_logo_path,
    logo_visible = '1',
    header_image_path,
    mobile_number,
    whatsapp_number,
    company_address,
    email_address,
    website,
    contact_details_visible = '1',
    invoice_header_visible = '1',
  } = settings || {};

  const [imageFailed, setImageFailed] = useState(false);

  const showHeader = invoice_header_visible !== '0';
  const showName = company_name_visible !== '0' && company_name;
  const showSlogan = slogan_visible !== '0' && company_slogan;
  const showLogo = logo_visible !== '0' && company_logo_path && !imageFailed;
  const showHeaderImage = header_image_path && !imageFailed;
  const showContact = contact_details_visible !== '0';

  if (!showHeader) {
    return null;
  }

  const contactParts = [];
  if (mobile_number) contactParts.push(<span key="phone">Phone {mobile_number}</span>);
  if (whatsapp_number) contactParts.push(<span key="whatsapp">WhatsApp {whatsapp_number}</span>);
  if (company_address) contactParts.push(<span key="address">{company_address}</span>);
  if (email_address) contactParts.push(<span key="email">Email {email_address}</span>);
  if (website) contactParts.push(<span key="website">Web {website}</span>);

  return (
    <div className="invoice-header no-print-on-screen">
      {showHeaderImage && (
        <img
          src={header_image_path}
          alt=""
          className="invoice-header-image"
          onError={() => setImageFailed(true)}
        />
      )}
      {showLogo && (
        <img
          src={company_logo_path}
          alt="Company logo"
          className="invoice-logo"
          onError={() => setImageFailed(true)}
        />
      )}
      {showName && <h1 className="invoice-company">{company_name}</h1>}
      {showSlogan && <p className="invoice-slogan">{company_slogan}</p>}
      {(showLogo || showHeaderImage || showName || showSlogan) && (
        <hr className="invoice-separator" />
      )}
      {showContact && contactParts.length > 0 && (
        <div className="invoice-contact">{contactParts}</div>
      )}
    </div>
  );
}
