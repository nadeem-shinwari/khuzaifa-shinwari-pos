import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
// src/services/api.js
/**
* Thin HTTP client for the JSON API.
*
* Every backend endpoint answers with the same envelope:
*   { success: boolean, message: string, data: mixed, errors?: object }
*
* The frontend only ever uses relative "/api" URLs so the built bundle stays
* static and can be hosted next to the PHP application.
*/
var API_BASE = "/api/v1";
/** Error thrown for any non 2xx response or a failed envelope. */
var ApiError = class extends Error {
	constructor(message, { status = 0, errors = null } = {}) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.errors = errors;
	}
};
var csrfToken = null;
/**
* Build an absolute URL for an API path.
*
* The path is always relative to /api/v1 so the bundle stays origin agnostic.
*/
function buildUrl(path, query) {
	const url = new URL(`${API_BASE}/${String(path).replace(/^\/+/, "")}`, window.location.origin);
	if (query) {
		for (const [key, value] of Object.entries(query)) if (value !== void 0 && value !== null && value !== "") url.searchParams.set(key, String(value));
	}
	return url;
}
/** Read a cookie value by name. */
function readCookie(name) {
	const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
	return match ? decodeURIComponent(match[2]) : "";
}
/**
* Fetch a CSRF token once and cache it for later state changing requests.
*/
async function getCsrfToken(force = false) {
	if (!force && csrfToken) return csrfToken;
	const response = await fetch(buildUrl("system/csrf"), {
		headers: { Accept: "application/json" },
		credentials: "same-origin"
	});
	const payload = await response.json().catch(() => null);
	if (!response.ok || !payload?.success) throw new ApiError(payload?.message || "Unable to obtain a CSRF token", { status: response.status });
	csrfToken = payload.data?.token ?? readCookie("csrf_token");
	return csrfToken;
}
/** Forget the cached CSRF token (used after a session change). */
function resetCsrfToken() {
	csrfToken = null;
}
/** Store a CSRF token returned by the API (used after login/logout). */
function setCsrfToken(token) {
	csrfToken = token || null;
}
/**
* Perform an API request and unwrap the envelope.
*
* @param {string} path   Path relative to /api/v1, e.g. "system/health"
* @param {object} [options]
* @param {string} [options.method]
* @param {object} [options.body]     JSON body
* @param {object} [options.query]    Query string parameters
* @param {boolean} [options.csrf]    Send the CSRF token (default: state changing verbs)
*/
async function apiRequest(path, options = {}) {
	const { method = "GET", body, query, csrf } = options;
	const url = buildUrl(path, query);
	const headers = { Accept: "application/json" };
	const verb = method.toUpperCase();
	const needsCsrf = csrf ?? ![
		"GET",
		"HEAD",
		"OPTIONS"
	].includes(verb);
	if (body !== void 0) headers["Content-Type"] = "application/json";
	if (needsCsrf) {
		const token = await getCsrfToken();
		if (token) headers["X-CSRF-Token"] = token;
	}
	const response = await fetch(url.toString(), {
		method: verb,
		headers,
		credentials: "same-origin",
		body: body === void 0 ? void 0 : JSON.stringify(body)
	});
	const payload = await response.json().catch(() => null);
	if (!response.ok) throw new ApiError(payload?.message || `Request failed with status ${response.status}`, {
		status: response.status,
		errors: payload?.errors ?? null
	});
	if (!payload?.success) throw new ApiError(payload?.message || "Request failed", {
		status: response.status,
		errors: payload?.errors ?? null
	});
	return payload.data;
}
/** Convenience wrapper for GET requests. */
function apiGet(path, query) {
	return apiRequest(path, {
		method: "GET",
		query
	});
}
/** Convenience wrapper for POST requests. */
function apiPost(path, body) {
	return apiRequest(path, {
		method: "POST",
		body
	});
}
// src/services/auth.js
/**
* Authentication helpers that talk to the session based backend auth API.
*
* The backend never returns a token to store in localStorage: the session
* cookie is the only credential and CSRF tokens are kept in memory.
*/
/** Restore the signed in user (and refresh the CSRF token) on page load. */
async function fetchCurrentUser() {
	const payload = await apiGet("auth/me");
	if (payload?.csrf_token) setCsrfToken(payload.csrf_token);
	return payload?.user ?? null;
}
/** Sign in with an email and password. */
async function signIn(credentials) {
	const payload = await apiPost("auth/login", {
		email: credentials.email,
		password: credentials.password
	});
	if (payload?.csrf_token) setCsrfToken(payload.csrf_token);
	return payload?.user ?? null;
}
/** End the current session. */
async function signOut() {
	try {
		await apiRequest("auth/logout", {
			method: "POST",
			csrf: true
		});
	} finally {
		resetCsrfToken();
	}
}
// src/context/AuthContext.jsx
var AuthContext = createContext(null);
/**
* Provides the signed in user to the whole application and restores the
* session from the backend on first load.
*/
function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		let cancelled = false;
		fetchCurrentUser().then((resolved) => {
			if (!cancelled) setUser(resolved);
		}).catch(() => {
			if (!cancelled) setUser(null);
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	const signIn$1 = useCallback(async (credentials) => {
		const resolved = await signIn(credentials);
		setUser(resolved);
		return resolved;
	}, []);
	const signOut$1 = useCallback(async () => {
		await signOut();
		setUser(null);
	}, []);
	const value = useMemo(() => ({
		user,
		loading,
		isAuthenticated: user !== null,
		signIn: signIn$1,
		signOut: signOut$1
	}), [
		user,
		loading,
		signIn$1,
		signOut$1
	]);
	return /* @__PURE__ */ jsx(AuthContext.Provider, {
		value,
		children
	});
}
// src/utils/format.js
/**
* Formatting helpers shared by the whole application.
*/
var DEFAULT_CURRENCY = "PKR";
/**
* Format an amount as a currency string.
*
* @param {number|string} value
* @param {string} [currency]
*/
function formatCurrency(value, currency = DEFAULT_CURRENCY) {
	const amount = Number(value);
	if (!Number.isFinite(amount)) return "—";
	try {
		return new Intl.NumberFormat("en-PK", {
			style: "currency",
			currency,
			maximumFractionDigits: 2,
			minimumFractionDigits: 2
		}).format(amount);
	} catch {
		return `${currency} ${amount.toFixed(2)}`;
	}
}
/** Format an ISO date string as a readable date. */
function formatDate(value) {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat("en-PK", {
		year: "numeric",
		month: "short",
		day: "numeric"
	}).format(date);
}
/** Build a class name from a list of conditional values. */
function cx(...values) {
	return values.filter(Boolean).join(" ");
}
// src/components/ui/Button.jsx
var variants$1 = {
	primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600",
	secondary: "bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 focus-visible:outline-ink-400",
	ghost: "text-ink-600 hover:bg-ink-100 focus-visible:outline-ink-400",
	danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600"
};
var sizes = {
	sm: "h-8 px-3 text-xs",
	md: "h-10 px-4 text-sm"
};
/**
* A button with the variants used across the app.
*/
function Button({ variant = "primary", size = "md", className, type = "button", ...props }) {
	return /* @__PURE__ */ jsx("button", {
		type,
		className: cx("inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors", "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2", "disabled:cursor-not-allowed disabled:opacity-60", variants$1[variant] ?? variants$1.primary, sizes[size] ?? sizes.md, className),
		...props
	});
}
// src/components/ui/Alert.jsx
var variants = {
	info: {
		wrapper: "border-brand-200 bg-brand-50 text-brand-900",
		icon: "text-brand-600",
		Icon: Info
	},
	success: {
		wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900",
		icon: "text-emerald-600",
		Icon: CircleCheck
	},
	warning: {
		wrapper: "border-amber-200 bg-amber-50 text-amber-900",
		icon: "text-amber-600",
		Icon: TriangleAlert
	},
	error: {
		wrapper: "border-red-200 bg-red-50 text-red-900",
		icon: "text-red-600",
		Icon: CircleAlert
	}
};
/**
* An inline status banner.
*/
function Alert({ variant = "info", title, children, className }) {
	const config = variants[variant] ?? variants.info;
	const { Icon } = config;
	return /* @__PURE__ */ jsxs("div", {
		role: "status",
		className: cx("flex gap-3 rounded-lg border px-4 py-3 text-sm", config.wrapper, className),
		children: [/* @__PURE__ */ jsx(Icon, {
			className: cx("mt-0.5 size-5 shrink-0", config.icon),
			"aria-hidden": "true"
		}), /* @__PURE__ */ jsxs("div", {
			className: "min-w-0",
			children: [title && /* @__PURE__ */ jsx("p", {
				className: "font-semibold",
				children: title
			}), children && /* @__PURE__ */ jsx("div", {
				className: cx(title && "mt-0.5", "break-words"),
				children
			})]
		})]
	});
}
/**
* A centred loading indicator with an optional label.
*/
function LoadingState({ label = "Loading…" }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center justify-center gap-2 py-10 text-sm text-ink-500",
		children: [/* @__PURE__ */ jsx(LoaderCircle, {
			className: "size-4 animate-spin",
			"aria-hidden": "true"
		}), /* @__PURE__ */ jsx("span", { children: label })]
	});
}
// src/components/invoice/InvoiceHeader.jsx
/**
* Company header rendered from General Settings.
*
* Only enabled and populated fields are displayed. When no logo or header
* image is configured the header falls back to clean text - no broken image
* or empty placeholder is ever shown.
*/
function InvoiceHeader({ settings }) {
	const { company_name, company_name_visible = "1", company_slogan, slogan_visible = "1", company_logo_path, logo_visible = "1", header_image_path, mobile_number, whatsapp_number, company_address, email_address, website, contact_details_visible = "1", invoice_header_visible = "1" } = settings || {};
	const [imageFailed, setImageFailed] = useState(false);
	const showHeader = invoice_header_visible !== "0";
	const showName = company_name_visible !== "0" && company_name;
	const showSlogan = slogan_visible !== "0" && company_slogan;
	const showLogo = logo_visible !== "0" && company_logo_path && !imageFailed;
	const showHeaderImage = header_image_path && !imageFailed;
	const showContact = contact_details_visible !== "0";
	if (!showHeader) return null;
	const contactParts = [];
	if (mobile_number) contactParts.push(/* @__PURE__ */ jsxs("span", { children: ["Phone ", mobile_number] }, "phone"));
	if (whatsapp_number) contactParts.push(/* @__PURE__ */ jsxs("span", { children: ["WhatsApp ", whatsapp_number] }, "whatsapp"));
	if (company_address) contactParts.push(/* @__PURE__ */ jsx("span", { children: company_address }, "address"));
	if (email_address) contactParts.push(/* @__PURE__ */ jsxs("span", { children: ["Email ", email_address] }, "email"));
	if (website) contactParts.push(/* @__PURE__ */ jsxs("span", { children: ["Web ", website] }, "website"));
	return /* @__PURE__ */ jsxs("div", {
		className: "invoice-header no-print-on-screen",
		children: [
			showHeaderImage && /* @__PURE__ */ jsx("img", {
				src: header_image_path,
				alt: "",
				className: "invoice-header-image",
				onError: () => setImageFailed(true)
			}),
			showLogo && /* @__PURE__ */ jsx("img", {
				src: company_logo_path,
				alt: "Company logo",
				className: "invoice-logo",
				onError: () => setImageFailed(true)
			}),
			showName && /* @__PURE__ */ jsx("h1", {
				className: "invoice-company",
				children: company_name
			}),
			showSlogan && /* @__PURE__ */ jsx("p", {
				className: "invoice-slogan",
				children: company_slogan
			}),
			(showLogo || showHeaderImage || showName || showSlogan) && /* @__PURE__ */ jsx("hr", { className: "invoice-separator" }),
			showContact && contactParts.length > 0 && /* @__PURE__ */ jsx("div", {
				className: "invoice-contact",
				children: contactParts
			})
		]
	});
}
// src/components/invoice/InvoicePartyDetails.jsx
/**
* Bordered party (customer/supplier) and invoice information block.
*
* Optional empty fields are hidden gracefully - no literal "null" or
* "undefined" values and no unnecessary empty labels.
*/
function InvoicePartyDetails({ type, party, invoice }) {
	const isSale = type === "sale";
	const partyLabel = isSale ? "Customer" : "Supplier";
	const numberLabel = isSale ? "Invoice No" : "Purchase No";
	const dateLabel = isSale ? "Invoice Date" : "Purchase Date";
	const partyName = party?.name || invoice?.party_name || "";
	const partyAddress = party?.address || "";
	const partyPhone = party?.phone || party?.alternate_phone || "";
	const invoiceNumber = invoice?.invoice_number || invoice?.id || "";
	const invoiceDate = invoice?.invoice_date || (isSale ? invoice?.sale_date : invoice?.purchase_date) || "";
	const showName = partyName !== "";
	const showAddress = partyAddress !== "";
	const showPhone = partyPhone !== "";
	const showNumber = invoiceNumber !== "";
	const showDate = invoiceDate !== "";
	const rows = [];
	if (showName || showNumber) rows.push([{
		label: partyLabel,
		value: partyName
	}, {
		label: numberLabel,
		value: invoiceNumber
	}]);
	if (showAddress || showDate) rows.push([{
		label: "Address",
		value: showAddress ? partyAddress : ""
	}, {
		label: dateLabel,
		value: showDate ? formatDate(invoiceDate) : ""
	}]);
	if (showPhone) rows.push([{
		label: "Phone",
		value: partyPhone
	}, {
		label: "",
		value: ""
	}]);
	if (rows.length === 0) return null;
	return /* @__PURE__ */ jsx("table", {
		className: "invoice-party-table",
		children: /* @__PURE__ */ jsx("tbody", { children: rows.map((row, ri) => /* @__PURE__ */ jsx("tr", { children: row.map((cell, ci) => /* @__PURE__ */ jsxs("td", {
			className: cell.label ? "label" : "value",
			children: [cell.label && /* @__PURE__ */ jsxs("span", {
				className: "label-text",
				children: [cell.label, ":"]
			}), cell.value !== "" ? /* @__PURE__ */ jsx("span", {
				className: "value-text",
				children: cell.value
			}) : null]
		}, ci)) }, ri)) })
	});
}
// src/components/invoice/InvoiceItemsTable.jsx
/**
* Itemised invoice table.
*
* Columns: serial number, description, quantity, rate, amount. Line amounts
* come from the saved line items (server-calculated). The unit of measure is
* appended to the description when available.
*/
function InvoiceItemsTable({ items = [], currency = "PKR" }) {
	items.some((item) => Number(item.discount_percent || 0) > 0);
	return /* @__PURE__ */ jsxs("table", {
		className: "invoice-items invoice-break",
		children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
			/* @__PURE__ */ jsx("th", {
				className: "serial",
				children: "#"
			}),
			/* @__PURE__ */ jsx("th", { children: "Description" }),
			/* @__PURE__ */ jsx("th", {
				className: "qty",
				children: "Qty"
			}),
			/* @__PURE__ */ jsx("th", {
				className: "rate",
				children: "Rate"
			}),
			/* @__PURE__ */ jsx("th", {
				className: "amount",
				children: "Amount"
			})
		] }) }), /* @__PURE__ */ jsx("tbody", { children: items.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
			colSpan: 5,
			className: "value",
			style: {
				textAlign: "center",
				color: "#666"
			},
			children: "No line items."
		}) }) : items.map((item, index) => {
			const description = item.item_unit ? `${item.item_name} (${item.item_unit})` : item.item_name;
			return /* @__PURE__ */ jsxs("tr", { children: [
				/* @__PURE__ */ jsx("td", {
					className: "serial",
					children: index + 1
				}),
				/* @__PURE__ */ jsx("td", { children: description || "—" }),
				/* @__PURE__ */ jsx("td", {
					className: "qty",
					children: item.quantity
				}),
				/* @__PURE__ */ jsx("td", {
					className: "rate",
					children: formatCurrency(item.unit_price, currency)
				}),
				/* @__PURE__ */ jsx("td", {
					className: "amount",
					children: formatCurrency(item.line_total, currency)
				})
			] }, item.item_id ?? index);
		}) })]
	});
}
// src/components/invoice/InvoiceTotals.jsx
/**
* Invoice totals block. Grand total is the server-calculated value (source of
* truth). Discount and additional charges rows are shown only when non-zero.
*/
function InvoiceTotals({ totals, currency = "PKR" }) {
	const { subtotal = 0, discount = 0, additional_charges = 0, grand_total = 0 } = totals || {};
	const rows = [{
		label: "Subtotal",
		value: subtotal,
		bold: false
	}];
	if (discount > 0) rows.push({
		label: "Discount",
		value: -discount,
		bold: false
	});
	if (additional_charges > 0) rows.push({
		label: "Additional charges",
		value: additional_charges,
		bold: false
	});
	rows.push({
		label: "Grand total",
		value: grand_total,
		bold: true
	});
	return /* @__PURE__ */ jsx("table", {
		className: "invoice-items invoice-break",
		style: {
			width: "auto",
			marginLeft: "auto",
			border: "none"
		},
		children: /* @__PURE__ */ jsx("tbody", { children: rows.map((row, index) => /* @__PURE__ */ jsxs("tr", {
			style: {
				border: "none",
				background: row.bold ? "#eef6f6" : "transparent"
			},
			children: [/* @__PURE__ */ jsx("td", {
				style: {
					border: "none",
					padding: "3px 6px",
					textAlign: "right",
					fontWeight: row.bold ? 700 : 400,
					fontSize: row.bold ? 7.8 : 7.4,
					color: row.bold ? "#1a1a1a" : "#333"
				},
				colSpan: 4,
				children: row.label
			}), /* @__PURE__ */ jsx("td", {
				className: "amount-cell",
				style: {
					border: row.bold ? "1.2pt solid #216666" : "0.75pt solid #2a7f7f",
					padding: "3px 6px",
					textAlign: "right",
					fontWeight: row.bold ? 700 : 400,
					fontSize: row.bold ? 7.8 : 7.4,
					color: row.bold ? "#1a1a1a" : "#333",
					background: row.bold ? "#eef6f6" : "transparent"
				},
				children: formatCurrency(row.value, currency)
			})]
		}, index)) })
	});
}
// src/utils/numberToWords.js
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
var SMALL = [
	"",
	"One",
	"Two",
	"Three",
	"Four",
	"Five",
	"Six",
	"Seven",
	"Eight",
	"Nine",
	"Ten",
	"Eleven",
	"Twelve",
	"Thirteen",
	"Fourteen",
	"Fifteen",
	"Sixteen",
	"Seventeen",
	"Eighteen",
	"Nineteen"
];
var TENS = [
	"",
	"",
	"Twenty",
	"Thirty",
	"Forty",
	"Fifty",
	"Sixty",
	"Seventy",
	"Eighty",
	"Ninety"
];
var GROUP_NAMES = [
	"",
	"Thousand",
	"Million",
	"Billion"
];
/** Convert an integer in the range 0-999 to words. */
function convertChunk(n) {
	let out = "";
	const hundreds = Math.floor(n / 100);
	const rest = n % 100;
	if (hundreds > 0) out += SMALL[hundreds] + " Hundred";
	if (rest > 0) {
		if (out !== "") out += " ";
		if (rest < 20) out += SMALL[rest];
		else {
			const ten = Math.floor(rest / 10);
			const one = rest % 10;
			out += TENS[ten];
			if (one > 0) out += " " + SMALL[one];
		}
	}
	return out;
}
/** Convert a non-negative integer to words. */
function convertInteger(n) {
	if (n === 0) return "Zero";
	const groups = [];
	let num = n;
	while (num > 0) {
		groups.push(num % 1e3);
		num = Math.floor(num / 1e3);
	}
	let out = "";
	for (let i = groups.length - 1; i >= 0; i -= 1) {
		const chunk = convertChunk(groups[i]);
		if (chunk !== "") {
			if (out !== "") out += " ";
			out += chunk;
			if (GROUP_NAMES[i]) out += " " + GROUP_NAMES[i];
		}
	}
	return out;
}
/**
* Convert an amount to English words.
*
* @returns {string} e.g. "One Thousand Two Hundred Fifty Rupees Only"
*/
function amountToWords(amount, { currency = "PKR", unit = "Rupees", fractionalUnit = "Paise", only = "Only" } = {}) {
	const value = Number(amount);
	if (!Number.isFinite(value)) return "";
	const abs = Math.abs(value);
	const major = Math.floor(abs);
	const minor = Math.round((abs - major) * 100);
	const parts = [];
	if (major > 0) parts.push(`${convertInteger(major)} ${unit}`);
	else if (minor === 0) parts.push(`Zero ${unit}`);
	if (minor > 0) parts.push(`${convertInteger(minor)} ${fractionalUnit}`);
	if (parts.length === 0) parts.push(`Zero ${unit}`);
	let result = parts.length > 1 ? parts.join(" and ") : parts[0];
	if (value < 0) result = `Minus ${result}`;
	return `${result} ${only}`;
}
// src/components/invoice/AmountInWords.jsx
/**
* "Rupees in words" line below the item table.
*
* Hidden when the administrator disables amount-in-words in General Settings.
*/
function AmountInWords({ amount, currency = "PKR", visible = "1" }) {
	if (visible === "0") return null;
	const value = Number(amount);
	if (!Number.isFinite(value) || value <= 0) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "invoice-amount-in-words invoice-break",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "label",
				children: "Rupees in words:"
			}),
			" ",
			amountToWords(value, {
				currency,
				unit: currency === "PKR" ? "Rupees" : currency,
				fractionalUnit: currency === "PKR" ? "Paise" : "cents"
			})
		]
	});
}
// src/components/invoice/InvoiceFooter.jsx
/**
* Invoice footer: terms and conditions (lower-left) and the authorised
* signature area (lower-right). Both are driven by General Settings and are
* hidden when not configured.
*/
function InvoiceFooter({ settings }) {
	const { footer_visible = "1", signature_visible = "1", signature_label = "Authorized Signature", authorized_name = "", authorized_designation = "", footer_message = "" } = settings || {};
	const terms = settings?.terms_and_conditions || [];
	const showFooter = footer_visible !== "0";
	const showSignature = signature_visible !== "0";
	const showTerms = showFooter && terms.length > 0;
	const showMessage = showFooter && footer_message !== "";
	if (!showTerms && !showSignature && !showMessage) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "invoice-footer",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "invoice-terms",
			children: [showTerms && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
				className: "terms-title",
				children: "Terms and conditions"
			}), /* @__PURE__ */ jsx("ul", { children: terms.map((term, index) => /* @__PURE__ */ jsx("li", { children: term }, index)) })] }), showMessage && /* @__PURE__ */ jsx("div", {
				style: {
					marginTop: 6,
					fontSize: 7.2,
					color: "#555"
				},
				children: footer_message
			})]
		}), showSignature && /* @__PURE__ */ jsxs("div", {
			className: "invoice-signature",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "sig-label",
					children: signature_label
				}),
				/* @__PURE__ */ jsx("div", {
					className: "sig-line",
					children: "Signature"
				}),
				authorized_name && /* @__PURE__ */ jsxs("div", {
					className: "sig-name",
					children: [
						authorized_name,
						authorized_designation && /* @__PURE__ */ jsx("br", {}),
						authorized_designation
					]
				})
			]
		})]
	});
}
// src/components/invoice/InvoicePrintPage.jsx
var TITLES = {
	sale: "SALE INVOICE",
	purchase: "PURCHASE INVOICE"
};
/**
* Shared sale/purchase invoice print page.
*
* Loads the saved invoice (header, line items, party, totals and display
* settings) from the API, then triggers window.print() only once the data has
* finished loading. Never prints while loading.
*/
function InvoicePrintPage({ type }) {
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
				if (active) setError(caught.message || "Unable to load invoice.");
			} finally {
				if (active) setLoading(false);
			}
		}
		load();
		return () => {
			active = false;
		};
	}, [type, id]);
	useEffect(() => {
		if (!printed.current && !loading && data) {
			printed.current = true;
			window.print();
		}
	}, [data, loading]);
	if (loading) return /* @__PURE__ */ jsx("div", {
		className: "invoice-page",
		style: {
			padding: 40,
			textAlign: "center"
		},
		children: /* @__PURE__ */ jsx(LoadingState, { label: "Loading invoice..." })
	});
	if (error) return /* @__PURE__ */ jsxs("div", {
		className: "invoice-page",
		style: {
			padding: 40,
			textAlign: "center"
		},
		children: [/* @__PURE__ */ jsx(Alert, {
			variant: "error",
			title: "Unable to load invoice",
			children: error
		}), /* @__PURE__ */ jsx("div", {
			className: "invoice-print-bar",
			style: {
				justifyContent: "center",
				marginTop: 12
			},
			children: /* @__PURE__ */ jsx(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => navigate(-1),
				children: "Back"
			})
		})]
	});
	const { invoice, items, totals, settings } = data;
	const currency = settings?.currency || "PKR";
	const visible = (key, def = "1") => settings?.[key] !== void 0 ? settings[key] : def;
	return /* @__PURE__ */ jsxs("div", {
		className: "invoice-page",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "invoice-print-bar no-print",
				children: [/* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "secondary",
					size: "sm",
					onClick: () => {
						const path = type === "sale" ? `/sales/${id}/invoice` : `/purchases/${id}/invoice`;
						navigate(path);
					},
					children: "Back to invoice"
				}), /* @__PURE__ */ jsx(Button, {
					type: "button",
					onClick: () => window.print(),
					children: "Print"
				})]
			}),
			/* @__PURE__ */ jsx(InvoiceHeader, { settings }),
			/* @__PURE__ */ jsxs("div", {
				className: "invoice-title-row",
				children: [/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h2", {
					className: "invoice-title",
					children: TITLES[type]
				}) }), /* @__PURE__ */ jsxs("div", {
					className: "invoice-meta",
					children: [invoice?.invoice_number != null && /* @__PURE__ */ jsxs("div", { children: ["#", invoice.invoice_number] }), invoice?.invoice_date && /* @__PURE__ */ jsx("div", { children: formatDate(invoice.invoice_date) })]
				})]
			}),
			/* @__PURE__ */ jsx(InvoicePartyDetails, {
				type,
				party: data.party,
				invoice
			}),
			/* @__PURE__ */ jsx("div", {
				className: "invoice-break",
				children: /* @__PURE__ */ jsx(InvoiceItemsTable, {
					items,
					currency
				})
			}),
			/* @__PURE__ */ jsx("div", {
				className: "invoice-break",
				style: {
					marginLeft: "auto",
					marginTop: 6
				},
				children: /* @__PURE__ */ jsx(InvoiceTotals, {
					totals,
					currency
				})
			}),
			/* @__PURE__ */ jsx(AmountInWords, {
				amount: totals?.grand_total ?? invoice?.total_amount ?? 0,
				currency,
				visible: visible("amount_in_words_visible")
			}),
			/* @__PURE__ */ jsx(InvoiceFooter, { settings }),
			/* @__PURE__ */ jsx("div", {
				className: "invoice-footer-note no-print",
				children: "Generated from the saved invoice record. Company details, terms and totals are taken from General Settings and the saved sale/purchase record."
			})
		]
	});
}
// src/pages/SalePrintInvoice.jsx
function SalePrintInvoice() {
	const { id } = useParams();
	return /* @__PURE__ */ jsx(InvoicePrintPage, { type: "sale" });
}
SalePrintInvoice.displayName = "SalePrintInvoice";
// src/pages/PurchasePrintInvoice.jsx
function PurchasePrintInvoice() {
	return /* @__PURE__ */ jsx(InvoicePrintPage, { type: "purchase" });
}
PurchasePrintInvoice.displayName = "PurchasePrintInvoice";
// scripts/render-print.jsx
/** Temporary render smoke check for the invoice print pages. */
var routes = [{
	path: "/sales/2/print",
	element: /* @__PURE__ */ jsx(SalePrintInvoice, {})
}, {
	path: "/purchases/1/print",
	element: /* @__PURE__ */ jsx(PurchasePrintInvoice, {})
}];
var failures = 0;
for (const route of routes) try {
	const markup = renderToStaticMarkup(/* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(MemoryRouter, {
		initialEntries: [route.path],
		children: /* @__PURE__ */ jsxs(Routes, { children: [/* @__PURE__ */ jsx(Route, {
			path: "sales/:id/print",
			element: /* @__PURE__ */ jsx(SalePrintInvoice, {})
		}), /* @__PURE__ */ jsx(Route, {
			path: "purchases/:id/print",
			element: /* @__PURE__ */ jsx(PurchasePrintInvoice, {})
		})] })
	}) }));
	const text = markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
	console.log(`OK  ${route.path} -> ${markup.length} bytes`);
	console.log(`    text: ${text.slice(0, 200)}`);
} catch (error) {
	failures += 1;
	console.error(`FAIL ${route.path} -> ${error.message}`);
	console.error(error.stack);
}
if (failures > 0) {
	console.error(`\n${failures} route(s) failed to render.`);
	process.exit(1);
}
console.log("\nAll print routes rendered successfully.");
export {};
