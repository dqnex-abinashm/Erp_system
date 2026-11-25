import React, { useState, useEffect, useMemo } from 'react';

import { Mail, ChevronDown, Bookmark, Globe, Check, UploadCloud, Copy, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCustomer, updateCustomer } from '../../services/createcustomerApi';
import { getCustomerDetails } from '../../services/customerDetailsApi';

/* ───────────────────────── Validation ───────────────────────── */

const RE = {
  // letters/digits and . _ % + - only (so "/" or "//" are rejected), no "..", valid domain
  email: /^(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
  // optional http(s)://, domain with a TLD, optional port and path
  website: /^(https?:\/\/)?([A-Za-z0-9-]+\.)+[A-Za-z]{2,}(:\d+)?(\/\S*)?$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  gstin: /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  msme: /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/,
  pin: /^[1-9]\d{5}$/,
  amount: /^-?\d+(\.\d{1,2})?$/,
  account: /^\d{9,18}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
};

const blank = (v) => !String(v ?? '').trim();
// A row is "empty" if every user-typed field is blank (country selectors are ignored)
const rowIsEmpty = (row) => Object.entries(row).every(([k, v]) => k.endsWith('_country') || blank(v));

// ── Countries: dial code + allowed digit count of the national number ──
// (min/max = digits after the country code; edit this table to add/adjust countries)
const COUNTRIES = [
  { name: 'India', iso: 'IN', dial: '+91', min: 10, max: 10, pattern: /^[1-9]\d{9}$/ },
  { name: 'United States', iso: 'US', dial: '+1', min: 10, max: 10 },
  { name: 'Canada', iso: 'CA', dial: '+1', min: 10, max: 10 },
  { name: 'United Kingdom', iso: 'GB', dial: '+44', min: 9, max: 10 },
  { name: 'United Arab Emirates', iso: 'AE', dial: '+971', min: 9, max: 9 },
  { name: 'Saudi Arabia', iso: 'SA', dial: '+966', min: 9, max: 9 },
  { name: 'Qatar', iso: 'QA', dial: '+974', min: 8, max: 8 },
  { name: 'Kuwait', iso: 'KW', dial: '+965', min: 8, max: 8 },
  { name: 'Singapore', iso: 'SG', dial: '+65', min: 8, max: 8 },
  { name: 'Malaysia', iso: 'MY', dial: '+60', min: 9, max: 10 },
  { name: 'Australia', iso: 'AU', dial: '+61', min: 9, max: 9 },
  { name: 'Germany', iso: 'DE', dial: '+49', min: 10, max: 11 },
  { name: 'France', iso: 'FR', dial: '+33', min: 9, max: 9 },
  { name: 'China', iso: 'CN', dial: '+86', min: 11, max: 11 },
  { name: 'Japan', iso: 'JP', dial: '+81', min: 10, max: 10 },
  { name: 'Bangladesh', iso: 'BD', dial: '+880', min: 10, max: 10 },
  { name: 'Nepal', iso: 'NP', dial: '+977', min: 10, max: 10 },
  { name: 'Sri Lanka', iso: 'LK', dial: '+94', min: 9, max: 9 },
];

const getCountry = (name) => COUNTRIES.find((c) => c.name === name) || COUNTRIES[0];
const countryFromDial = (dial) => {
  const d = String(dial ?? '').replace('+', '');
  return (COUNTRIES.find((c) => c.dial.slice(1) === d) || COUNTRIES[0]).name;
};
const digitsRange = (c) => (c.min === c.max ? `${c.max}` : `${c.min}–${c.max}`);

// Returns an error message, or '' if the number is valid for the country
const phoneError = (num, countryName) => {
  const c = getCountry(countryName);
  const v = String(num ?? '');
  const ok = /^\d+$/.test(v) && (c.pattern ? c.pattern.test(v) : v.length >= c.min && v.length <= c.max);
  return ok ? '' : `Enter a valid ${digitsRange(c)}-digit number${c.name === 'India' ? '' : ` for ${c.name}`}`;
};

// ── Postal code format per country (pattern = validation, strip = characters not allowed while typing) ──
const digitsPostal = (n, example, label) => ({
  pattern: new RegExp(`^\\d{${n}}$`),
  strip: /[^0-9]/g,
  max: n,
  numeric: true,
  example,
  hint: `${n}-digit ${label}`,
});
const alnumStrip = /[^A-Za-z0-9 ]/g;
const POSTAL = {
  India: { ...digitsPostal(6, '560001', 'PIN code'), pattern: /^[1-9]\d{5}$/ },
  'United States': digitsPostal(5, '90210', 'ZIP code'),
  Canada: { pattern: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/, strip: alnumStrip, max: 7, example: 'K1A 0B1', hint: 'Canadian postal code' },
  'United Kingdom': { pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/, strip: alnumStrip, max: 8, example: 'SW1A 1AA', hint: 'UK postcode' },
  'United Arab Emirates': { pattern: /^[A-Za-z0-9 -]{1,10}$/, strip: /[^A-Za-z0-9 -]/g, max: 10, example: '00000', hint: 'postal code (optional)', optional: true },
  'Saudi Arabia': digitsPostal(5, '12211', 'postal code'),
  Qatar: { pattern: /^[A-Za-z0-9 -]{1,10}$/, strip: /[^A-Za-z0-9 -]/g, max: 10, example: '00000', hint: 'postal code (optional)', optional: true },
  Kuwait: digitsPostal(5, '13001', 'postal code'),
  Singapore: digitsPostal(6, '018956', 'postal code'),
  Malaysia: digitsPostal(5, '50450', 'postcode'),
  Australia: digitsPostal(4, '2000', 'postcode'),
  Germany: digitsPostal(5, '10115', 'postal code (PLZ)'),
  France: digitsPostal(5, '75001', 'postal code'),
  China: digitsPostal(6, '100000', 'postal code'),
  Japan: { pattern: /^\d{3}-?\d{4}$/, strip: /[^0-9-]/g, max: 8, example: '100-0001', hint: '7-digit postal code' },
  Bangladesh: digitsPostal(4, '1207', 'postal code'),
  Nepal: digitsPostal(5, '44600', 'postal code'),
  'Sri Lanka': digitsPostal(5, '10100', 'postal code'),
};
const getPostal = (countryName) => POSTAL[countryName] || POSTAL.India;
const zipFor = (countryName, v) => {
  const p = getPostal(countryName);
  return v.replace(p.strip, '').slice(0, p.max).toUpperCase();
};
const zipError = (zip, countryName) => {
  const p = getPostal(countryName);
  return p.pattern.test(String(zip ?? '').trim()) ? '' : `Enter a valid ${p.hint} (e.g. ${p.example})`;
};

// ── Name / address rules ──
const MAX_NAME_LEN = 20;        // first & last name
const MAX_ADDRESS_WORDS = 20;   // Address line 1
const NAME_RE = /^[A-Za-z]+$/;                      // letters only
const FULLNAME_RE = /^[A-Za-z]+(?: [A-Za-z]+)*$/;   // letters, single spaces between words
const wordCount = (v) => String(v ?? '').trim().split(/\s+/).filter(Boolean).length;
const lettersSpaces = (v) => v.replace(/[^A-Za-z ]/g, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ');

// Names that may also contain a dot (.) – e.g. "Md.", "A.K. Sharma"
const NAME_DOT_RE = /^[A-Za-z]+(?:\.[A-Za-z]*)*$/;
const FULLNAME_DOT_RE = /^[A-Za-z]+(?:\.[A-Za-z]*)*(?: [A-Za-z]+(?:\.[A-Za-z]*)*)*$/;
const lettersDot = (v) => v.replace(/[^A-Za-z.]/g, '').replace(/^\.+/, '').replace(/\.{2,}/g, '.');
const lettersSpacesDot = (v) => v
  .replace(/[^A-Za-z. ]/g, '')
  .replace(/\s{2,}/g, ' ')
  .replace(/\.{2,}/g, '.')
  .replace(/(^|\s)\.+/g, '$1');

// ── Amount helpers (Indian grouping: 10,00,000) ──
const cleanAmount = (v) => {
  let s = v.replace(/[^0-9.-]/g, '');
  const neg = s.startsWith('-');
  s = s.replace(/-/g, '');
  const [i, ...rest] = s.split('.');
  const dec = rest.join('').slice(0, 2);
  return `${neg ? '-' : ''}${i}${rest.length ? `.${dec}` : ''}`;
};
const formatIN = (raw) => {
  const s = String(raw ?? '');
  if (!/^-?\d+(\.\d*)?$/.test(s)) return s;
  const neg = s.startsWith('-');
  const [i, d] = s.replace('-', '').split('.');
  const last3 = i.slice(-3);
  const rest = i.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${neg ? '-' : ''}${grouped}${d !== undefined ? `.${d}` : ''}`;
};
const limitWords = (v, max) => {
  const words = v.trim().split(/\s+/).filter(Boolean);
  return words.length > max ? words.slice(0, max).join(' ') : v;
};

const validateAll = ({ formData: f, billingAddress, shippingAddress, contactPersons, bankDetails }) => {
  const e = {};
  const req = (key, value, msg) => {
    if (blank(value)) {
      e[key] = msg;
      return true;
    }
    return false;
  };

  // ── Main section ──
  [
    ['primary_contact_first_name', 'First name', FULLNAME_DOT_RE, 'Only letters, dot (.) and single spaces are allowed'],
    ['primary_contact_last_name', 'Last name', NAME_RE, 'Only letters are allowed'],
  ].forEach(([key, label, re, msg]) => {
    const v = f[key].trim();
    if (!v) e[key] = `${label} is required`;
    else if (!re.test(v)) e[key] = msg;
    else if (v.length > MAX_NAME_LEN) e[key] = `Maximum ${MAX_NAME_LEN} characters`;
  });

  if (!req('display_name', f.display_name, 'Display name is required') && f.display_name.trim().length < 2) {
    e.display_name = 'Display name must be at least 2 characters';
  }

  if (f.customer_type === 'Business') {
    req('company_name', f.company_name, 'Company name is required for business customers');
  }

  // Website is optional – validated only when something is entered
  if (!blank(f.website) && !RE.website.test(f.website.trim())) {
    e.website = 'Enter a valid website (e.g. https://www.example.com)';
  }

  if (!req('primary_number', f.primary_number, 'Primary number is required')) {
    const m = phoneError(f.primary_number, f.primary_country);
    if (m) e.primary_number = m;
  }

  if (!blank(f.secondary_number)) {
    const m = phoneError(f.secondary_number, f.secondary_country);
    if (m) e.secondary_number = m;
    else if (f.secondary_number === f.primary_number && f.secondary_country === f.primary_country) {
      e.secondary_number = 'Must differ from the primary number';
    }
  }

  if (!req('email_address', f.email_address, 'Email address is required') && !RE.email.test(f.email_address.trim())) {
    e.email_address = 'Enter a valid email address';
  }

  if (!req('pan', f.pan, 'PAN is required') && !RE.pan.test(f.pan)) {
    e.pan = 'Invalid PAN (format: ABCDE1234F)';
  }

  if (!blank(f.gstin)) {
    if (!RE.gstin.test(f.gstin)) e.gstin = 'Invalid GSTIN (15 characters, e.g. 29ABCDE1234F1Z5)';
    else if (RE.pan.test(f.pan) && f.gstin.slice(2, 12) !== f.pan) e.gstin = 'GSTIN does not match the PAN entered';
  }

  if (!blank(f.msme) && !RE.msme.test(f.msme)) {
    e.msme = 'Invalid Udyam number (format: UDYAM-KA-00-0000000)';
  }

  // ── Other details ──
  req('sales_region', f.sales_region, 'Select a sales region');
  req('currency', f.currency, 'Select a currency');
  req('payment_terms', f.payment_terms, 'Select payment terms');
  if (!req('opening_balance', f.opening_balance, 'Opening balance is required') && !RE.amount.test(f.opening_balance.trim())) {
    e.opening_balance = 'Enter a valid amount (up to 2 decimals)';
  }

  // ── Addresses ──
  [['billing', billingAddress], ['shipping', shippingAddress]].forEach(([prefix, a]) => {
    if (!req(`${prefix}.attention`, a.attention, 'Attention is required') && !FULLNAME_DOT_RE.test(a.attention.trim())) {
      e[`${prefix}.attention`] = 'Only letters, spaces and dot (.) are allowed';
    }
    req(`${prefix}.country_region`, a.country_region, 'Country is required');
    if (!req(`${prefix}.street_1`, a.street_1, 'Address is required') && wordCount(a.street_1) > MAX_ADDRESS_WORDS) {
      e[`${prefix}.street_1`] = `Maximum ${MAX_ADDRESS_WORDS} words allowed`;
    }
    [['city', 'City'], ['district', 'District'], ['state', 'State']].forEach(([n, label]) => {
      if (!req(`${prefix}.${n}`, a[n], `${label} is required`) && !FULLNAME_RE.test(a[n].trim())) {
        e[`${prefix}.${n}`] = 'Only letters are allowed';
      }
    });
    if (getPostal(a.country_region).optional && blank(a.zip_code)) {
      // this country has no postal codes – leave it optional
    } else if (!req(`${prefix}.zip_code`, a.zip_code, 'Zip code is required')) {
      const m = zipError(a.zip_code, a.country_region);
      if (m) e[`${prefix}.zip_code`] = m;
    }
    if (!req(`${prefix}.phone`, a.phone, 'Phone is required')) {
      const m = phoneError(a.phone, a.country_region);
      if (m) e[`${prefix}.phone`] = m;
    }
  });

  // ── Contact persons (optional rows; a started row must be valid) ──
  contactPersons.forEach((c, i) => {
    if (rowIsEmpty(c)) return;
    if (!req(`contacts.${i}.name`, c.name, 'Name is required') && !FULLNAME_DOT_RE.test(c.name.trim())) {
      e[`contacts.${i}.name`] = 'Only letters, spaces and dot (.) are allowed';
    }
    if (!blank(c.email) && !RE.email.test(c.email.trim())) e[`contacts.${i}.email`] = 'Enter a valid email address';
    if (!blank(c.mobile_number)) {
      const m = phoneError(c.mobile_number, c.mobile_country);
      if (m) e[`contacts.${i}.mobile_number`] = m;
    }
  });

  // ── Bank details (optional rows; a started row must be complete) ──
  bankDetails.forEach((b, i) => {
    if (rowIsEmpty(b)) return;
    if (!req(`bank.${i}.bank_name`, b.bank_name, 'Bank name is required') && !FULLNAME_RE.test(b.bank_name.trim())) {
      e[`bank.${i}.bank_name`] = 'Only letters and spaces are allowed';
    }
    if (!req(`bank.${i}.account_holder`, b.account_holder, 'Account holder is required') && !FULLNAME_DOT_RE.test(b.account_holder.trim())) {
      e[`bank.${i}.account_holder`] = 'Only letters, spaces and dot (.) are allowed';
    }
    if (!req(`bank.${i}.account_number`, b.account_number, 'Account number is required') && !RE.account.test(b.account_number)) {
      e[`bank.${i}.account_number`] = 'Account number must be 9–18 digits';
    }
    if (!req(`bank.${i}.ifsc_code`, b.ifsc_code, 'IFSC code is required') && !RE.ifsc.test(b.ifsc_code)) {
      e[`bank.${i}.ifsc_code`] = 'Invalid IFSC (format: ABCD0123456)';
    }
  });

  return e;
};

const OTHER_DETAIL_KEYS = ['sales_region', 'currency', 'opening_balance', 'payment_terms'];

// Which tab a field lives on (null = the always-visible top section)
const tabOf = (key) => {
  if (key.startsWith('billing.') || key.startsWith('shipping.')) return 'Address';
  if (key.startsWith('contacts.')) return 'Contact Directory';
  if (key.startsWith('bank.')) return 'Bank Details';
  if (OTHER_DETAIL_KEYS.includes(key)) return 'Other Details';
  return null;
};

const TAB_RANK = { null: 0, 'Other Details': 1, Address: 2, 'Contact Directory': 3, 'Bank Details': 4 };

const tabs = ['Other Details', 'Address', 'Contact Directory', 'Bank Details'];

const IN_MAIN = 'flex-1 min-w-0 border rounded-md px-3 py-2 text-[13px] focus:outline-none bg-white shadow-sm';
const IN_TAB = 'w-full border rounded-md px-3 py-2 text-sm text-[#1a233a] focus:outline-none bg-white shadow-sm';

const emptyAddress = {
  attention: '',
  country_region: 'India',
  street_1: '',
  street_2: '',
  city: '',
  district: '',
  state: '',
  zip_code: '',
  phone: '',
  fax: ''
};

const emptyBank = { bank_name: '', account_holder: '', account_number: '', ifsc_code: '' };
const emptyContact = { name: '', email: '', mobile_country: 'India', mobile_number: '', designation: '' };

/* ───────────────────────── Component ───────────────────────── */

const CreateCustomerPage = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const isEditMode = Boolean(customerId);
  const [activeTab, setActiveTab] = useState('Other Details');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);   // final save attempted
  const [attempted, setAttempted] = useState(false);   // any Save / Save & Next clicked
  const [touched, setTouched] = useState({});
  const [balanceFocused, setBalanceFocused] = useState(false);

  const [formData, setFormData] = useState({
    customer_type: 'Business',

    primary_contact_salutation: '',
    primary_contact_first_name: '',
    primary_contact_last_name: '',

    display_name: '',
    company_name: '',
    website: '',

    primary_country: 'India',
    primary_number: '',
    secondary_country: 'India',
    secondary_number: '',
    email_address: '',

    pan: '',
    gstin: '',
    msme: '',

    sales_region: '',
    currency: '',
    opening_balance: '0.00',
    payment_terms: ''
  });

  const [billingAddress, setBillingAddress] = useState({ ...emptyAddress });
  const [shippingAddress, setShippingAddress] = useState({ ...emptyAddress });
  const [bankDetails, setBankDetails] = useState([{ ...emptyBank }]);
  const [contactPersons, setContactPersons] = useState([{ ...emptyContact }]);

  useEffect(() => {
    if (!isEditMode) return;

    const s = (v) => (v === null || v === undefined ? '' : String(v));

    const toAddress = (a) => ({
      attention: s(a?.attention),
      country_region: s(a?.country) || 'India',
      street_1: s(a?.street1),
      street_2: s(a?.street2),
      city: s(a?.city),
      district: s(a?.district),
      state: s(a?.state),
      zip_code: s(a?.zipCode),
      phone: s(a?.phone),
      fax: s(a?.fax)
    });

    const loadCustomer = async () => {
      try {
        const result = await getCustomerDetails(customerId);
        const d = result.data || {};
        const c = d.customer || {};

        setFormData({
          customer_type: c.customerType || 'Business',
          primary_contact_salutation: s(c.primaryContactPrefix),
          primary_contact_first_name: s(c.primaryContactFirstName),
          primary_contact_last_name: s(c.primaryContactLastName),
          display_name: s(c.displayName),
          company_name: s(c.companyName),
          website: s(c.website),
          primary_country: countryFromDial(c.primaryCountryCode),
          primary_number: s(c.primaryPhone),
          secondary_country: countryFromDial(c.secondaryCountryCode),
          secondary_number: s(c.secondaryPhone),
          email_address: s(c.email),
          pan: s(c.pan),
          gstin: s(c.gstin),
          msme: s(c.msme),
          sales_region: s(c.salesRegionId),
          currency: s(c.currencyCode),
          opening_balance: s(c.openingBalance) || '0.00',
          payment_terms: s(c.paymentTermsId)
        });

        setBillingAddress(toAddress(d.addresses?.billing));
        setShippingAddress(toAddress(d.addresses?.shipping));

        if (Array.isArray(d.contacts) && d.contacts.length > 0) {
          setContactPersons(d.contacts.map((ct) => ({
            name: s(ct.contactName),
            email: s(ct.emailAddress),
            mobile_country: countryFromDial(ct.mobileCountryCode),
            mobile_number: s(ct.mobileNumber),
            designation: s(ct.designation)
          })));
        }

        if (Array.isArray(d.banks) && d.banks.length > 0) {
          setBankDetails(d.banks.map((b) => ({
            bank_name: s(b.bankName),
            account_holder: s(b.accountHolder),
            account_number: s(b.accountNumber),
            ifsc_code: s(b.ifscCode)
          })));
        }
      } catch (err) {
        console.error('Error loading customer:', err);
        alert(err.message || 'Failed to load customer for editing');
      }
    };

    loadCustomer();
  }, [customerId, isEditMode]);

  /* ── Validation state ── */

  const allErrors = useMemo(
    () => validateAll({ formData, billingAddress, shippingAddress, contactPersons, bankDetails }),
    [formData, billingAddress, shippingAddress, contactPersons, bankDetails]
  );

  const errorCount = Object.keys(allErrors).length;
  const hasErr = (k) => Boolean(allErrors[k]) && (submitted || touched[k]);
  const cls = (k, base) => `${base} ${hasErr(k) ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`;
  const fp = (k) => ({
    'data-field': k,
    onBlur: () => setTouched((t) => (t[k] ? t : { ...t, [k]: true })),
  });
  // Inline error (normal flow) – used inside stacked fields
  const err = (k) => (hasErr(k) ? <p className="absolute left-0 top-full mt-0.5 text-[11px] leading-[14px] text-red-500">{allErrors[k]}</p> : null);
  // Absolutely positioned error – used under label/input rows (row must be `relative`)
  const errRow = (k) => (hasErr(k)
    ? <p className="absolute left-36 top-full mt-0.5 text-[11px] leading-[14px] text-red-500">{allErrors[k]}</p>
    : null);

  const tabHasError = (tab) => Object.keys(allErrors).some((k) => tabOf(k) === tab && hasErr(k));
  const visibleErrorCount = Object.keys(allErrors).filter((k) => hasErr(k)).length;

  /* ── Change handlers ── */

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (['pan', 'gstin', 'msme'].includes(name)) value = value.toUpperCase().replace(/\s/g, '');
    if (name === 'primary_contact_first_name') value = lettersSpacesDot(value).slice(0, MAX_NAME_LEN);
    if (name === 'primary_contact_last_name') value = value.replace(/[^A-Za-z]/g, '').slice(0, MAX_NAME_LEN);
    if (name === 'email_address') value = value.replace(/[^A-Za-z0-9._%+@-]/g, '');   // no "/" or spaces
    if (name === 'website') value = value.replace(/\s/g, '');
    if (name === 'opening_balance') value = cleanAmount(value);
    if (name === 'primary_number' || name === 'secondary_number') value = value.replace(/\D/g, '');
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // trim the number to the digit limit of the selected country
      if (name === 'primary_number') next.primary_number = value.slice(0, getCountry(prev.primary_country).max);
      if (name === 'secondary_number') next.secondary_number = value.slice(0, getCountry(prev.secondary_country).max);
      if (name === 'primary_country') next.primary_number = prev.primary_number.slice(0, getCountry(value).max);
      if (name === 'secondary_country') next.secondary_number = prev.secondary_number.slice(0, getCountry(value).max);
      return next;
    });
  };

  const handleAddressChange = (type, e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'attention') value = lettersSpacesDot(value);
    if (['city', 'district', 'state'].includes(name)) value = lettersSpaces(value);
    if (name === 'street_1') value = limitWords(value, MAX_ADDRESS_WORDS);
    if (name === 'fax') value = value.replace(/[^0-9+\-\s()]/g, '').slice(0, 15);

    const setter = type === 'billing' ? setBillingAddress : setShippingAddress;
    setter((prev) => {
      const next = { ...prev, [name]: value };
      // phone follows the selected country: digits only, limited to that country's length
      if (name === 'country_region') {
        next.phone = prev.phone.slice(0, getCountry(value).max);
        next.zip_code = zipFor(value, prev.zip_code);
      }
      if (name === 'phone') next.phone = value.replace(/\D/g, '').slice(0, getCountry(prev.country_region).max);
      if (name === 'zip_code') next.zip_code = zipFor(prev.country_region, value);
      return next;
    });
  };

  const handleBankDetailChange = (index, e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'account_number') value = value.replace(/\D/g, '').slice(0, 18);
    if (name === 'account_holder') value = lettersSpacesDot(value);
    if (name === 'bank_name') value = lettersSpaces(value);
    if (name === 'ifsc_code') value = value.toUpperCase().replace(/\s/g, '').slice(0, 11);
    setBankDetails((currentDetails) => currentDetails.map((details, i) => (
      i === index ? { ...details, [name]: value } : details
    )));
  };

  const addBankDetails = () => setBankDetails((cur) => [...cur, { ...emptyBank }]);

  // "touched" flags are keyed by row index, so reset them for a section when a row is removed
  const clearTouched = (prefix) => setTouched((t) => Object.fromEntries(Object.entries(t).filter(([key]) => !key.startsWith(prefix))));

  const removeBankDetails = (index) => {
    setBankDetails((cur) => (cur.length > 1 ? cur.filter((_, i) => i !== index) : cur));
    clearTouched('bank.');
  };

  const handleContactPersonChange = (index, e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'mobile_number') value = value.replace(/\D/g, '');
    if (name === 'name') value = lettersSpacesDot(value);
    if (name === 'email') value = value.replace(/[^A-Za-z0-9._%+@-]/g, '');   // no "/" or spaces
    setContactPersons((cur) => cur.map((contact, i) => {
      if (i !== index) return contact;
      const next = { ...contact, [name]: value };
      if (name === 'mobile_number') next.mobile_number = value.slice(0, getCountry(contact.mobile_country).max);
      if (name === 'mobile_country') next.mobile_number = contact.mobile_number.slice(0, getCountry(value).max);
      return next;
    }));
  };

  const addContactPerson = () => setContactPersons((cur) => [...cur, { ...emptyContact }]);

  const removeContactPerson = (index) => {
    setContactPersons((cur) => (cur.length > 1 ? cur.filter((_, i) => i !== index) : cur));
    clearTouched('contacts.');
  };

  /* ── Submit ── */

  const focusFirstError = (errors) => {
    // Pick the earliest error: top section first, then tabs in order
    let firstKey = null;
    let bestRank = Infinity;
    Object.keys(errors).forEach((k) => {
      const rank = TAB_RANK[tabOf(k)];
      if (rank < bestRank) {
        bestRank = rank;
        firstKey = k;
      }
    });
    if (!firstKey) return;

    const tab = tabOf(firstKey);
    if (tab) setActiveTab(tab);

    setTimeout(() => {
      const el = document.querySelector(`[data-field="${firstKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
    }, 60);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttempted(true);

    const stepIndex = tabs.indexOf(activeTab);
    const isLastStep = stepIndex === tabs.length - 1;

    // Save & Next: validate the top section + current tab, then move to the next tab
    if (!isLastStep) {
      const scoped = Object.fromEntries(
        Object.entries(allErrors).filter(([k]) => {
          const t = tabOf(k);
          return t === null || t === activeTab;
        })
      );
      const keys = Object.keys(scoped);
      if (keys.length > 0) {
        setTouched((prev) => ({ ...prev, ...Object.fromEntries(keys.map((k) => [k, true])) }));
        focusFirstError(scoped);
        return;
      }
      setActiveTab(tabs[stepIndex + 1]);
      setTimeout(() => {
        document.getElementById('form-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return;
    }

    // Last tab (Bank Details): validate everything and actually save
    setSubmitted(true);

    if (errorCount > 0) {
      focusFirstError(allErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const toApiAddress = (a) => ({
        attention: a.attention.trim(),
        country: a.country_region,
        street1: a.street_1.trim(),
        street2: a.street_2.trim(),
        city: a.city.trim(),
        district: a.district.trim(),
        state: a.state.trim(),
        zipCode: a.zip_code.trim(),
        phone: a.phone.trim(),
        fax: a.fax.trim(),
      });

      const payload = {
        customerType: formData.customer_type,
        primaryContactPrefix: formData.primary_contact_salutation,
        primaryContactFirstName: formData.primary_contact_first_name.trim(),
        primaryContactLastName: formData.primary_contact_last_name.trim(),
        displayName: formData.display_name.trim(),
        companyName: formData.company_name.trim(),
        website: formData.website.trim(),
        emailAddress: formData.email_address.trim(),
        primaryCountryCode: getCountry(formData.primary_country).dial,
        primaryNumber: formData.primary_number,
        secondaryCountryCode: formData.secondary_number ? getCountry(formData.secondary_country).dial : '',
        secondaryNumber: formData.secondary_number,
        pan: formData.pan,
        gstin: formData.gstin,
        msme: formData.msme,
        salesRegionId: formData.sales_region,
        currencyCode: formData.currency,
        openingBalance: formData.opening_balance.trim(),
        paymentTermsId: formData.payment_terms,
        billingAddress: toApiAddress(billingAddress),
        shippingAddress: toApiAddress(shippingAddress),
        bankDetails: bankDetails
          .filter((bank) => !rowIsEmpty(bank))
          .map((bank) => ({
            bankName: bank.bank_name.trim(),
            accountHolder: bank.account_holder.trim(),
            accountNumber: bank.account_number,
            ifscCode: bank.ifsc_code,
          })),
        contacts: contactPersons
          .filter((contact) => !rowIsEmpty(contact))
          .map((contact) => ({
            name: contact.name.trim(),
            emailAddress: contact.email.trim(),
            mobileCountryCode: contact.mobile_number ? getCountry(contact.mobile_country).dial : '',
            mobileNumber: contact.mobile_number,
            designation: contact.designation.trim(),
          })),
      };

      if (isEditMode) {
        await updateCustomer(customerId, payload);
      } else {
        await createCustomer(payload);
      }
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving customer:', error);
      alert(error.message || `Failed to ${isEditMode ? 'update' : 'create'} customer`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Address block (shared by billing & shipping) ── */

  const renderAddress = (type, addr) => {
    const k = (n) => `${type}.${n}`;
    const postal = getPostal(addr.country_region);
    const label = (text, required) => (
      <label className="text-[13px] font-bold text-[#1a233a] mb-1">
        {text} {required && <span className="text-red-500">*</span>}
      </label>
    );
    const field = (name, text, required, extra = {}) => (
      <div className="flex flex-col relative">
        {label(text, required)}
        <input
          type="text"
          name={name}
          value={addr[name]}
          onChange={(e) => handleAddressChange(type, e)}
          className={cls(k(name), IN_TAB)}
          {...extra}
          {...fp(k(name))}
        />
        {err(k(name))}
      </div>
    );

    return (
      <div className="space-y-5">
        {field('attention', 'Attention', true)}

        <div className="flex flex-col relative">
          {label('Country / Region', true)}
          <div className="relative">
            <select
              name="country_region"
              value={addr.country_region}
              onChange={(e) => handleAddressChange(type, e)}
              className={`${cls(k('country_region'), IN_TAB)} appearance-none`}
              {...fp(k('country_region'))}
            >
              {COUNTRIES.map((x) => (
                <option key={x.name} value={x.name}>{x.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {err(k('country_region'))}
        </div>

        <div className="flex flex-col relative">
          <div className="relative flex flex-col">
            {label('Address', true)}
            <textarea
              name="street_1"
              value={addr.street_1}
              onChange={(e) => handleAddressChange(type, e)}
              rows="2"
              className={`${cls(k('street_1'), IN_TAB)} resize-none`}
              placeholder="Street 1"
              {...fp(k('street_1'))}
            ></textarea>
            {err(k('street_1'))}
          </div>
          <p className="mt-1 text-[11px] text-gray-400 text-right">{wordCount(addr.street_1)}/{MAX_ADDRESS_WORDS} words</p>
          <textarea
            name="street_2"
            value={addr.street_2}
            onChange={(e) => handleAddressChange(type, e)}
            rows="2"
            className={`${cls(k('street_2'), IN_TAB)} resize-none mt-3`}
            placeholder="Street 2"
          ></textarea>
        </div>

        {field('city', 'City', true)}
        {field('district', 'District', true)}
        {field('state', 'State', true)}
        {field('zip_code', 'Zip Code', !postal.optional, { placeholder: `${postal.hint}, e.g. ${postal.example}`, maxLength: postal.max, inputMode: postal.numeric ? 'numeric' : undefined })}
        <div className="flex flex-col relative">
          {label('Phone', true)}
          {phoneField({
            k: k('phone'),
            numberName: 'phone',
            country: addr.country_region,   // code + digit limit follow the selected country
            value: addr.phone,
            onNumberChange: (e) => handleAddressChange(type, e),
            locked: true,
          })}
          {err(k('phone'))}
        </div>
        {field('fax', 'Fax', false)}
      </div>
    );
  };

  /* ── Phone input with country code (select, or locked prefix when country comes from elsewhere) ── */

  const phoneField = ({ k, id, numberName, countryFieldName, country, value, onNumberChange, onCountryChange, locked = false }) => {
    const c = getCountry(country);
    return (
      <div className={`flex w-full min-w-0 border rounded-md bg-white shadow-sm overflow-hidden ${hasErr(k) ? 'border-red-400' : 'border-gray-200 focus-within:border-blue-500'}`}>
        <div className="relative shrink-0 flex items-center gap-1 border-r border-gray-200 bg-gray-50 px-3 text-[13px] text-gray-600" title={c.name}>
          <span>{locked ? c.dial : `${c.iso} ${c.dial}`}</span>
          {!locked && <ChevronDown className="w-3 h-3 text-gray-400" />}
          {!locked && (
            <select
              name={countryFieldName}
              value={country}
              onChange={onCountryChange}
              aria-label="Country code"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              {COUNTRIES.map((x) => (
                <option key={x.name} value={x.name}>{x.name} ({x.dial})</option>
              ))}
            </select>
          )}
        </div>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          name={numberName}
          value={value}
          onChange={onNumberChange}
          maxLength={c.max}
          placeholder={`Enter ${digitsRange(c)}-digit number`}
          className="flex-1 min-w-0 px-3 py-2 text-[13px] text-[#1a233a] bg-transparent focus:outline-none placeholder-gray-400"
          {...fp(k)}
        />
      </div>
    );
  };

  const labelCls = 'w-36 text-[13px] font-bold text-[#1a233a] shrink-0';

  return (
    <main className="flex-1 overflow-y-auto bg-[#f4f7f9] flex flex-col relative p-1.5 gap-1.5">

      {/* Top Banner with Stepper */}
      <div className="bg-white px-6 py-2 md:px-8 md:py-2 flex items-center justify-between border border-gray-200 rounded-2xl shadow-sm shrink-0">
        <h2 className="text-[20px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8]">
          {isEditMode ? 'Edit Customer Profile' : 'Create New Customer Profile'}
        </h2>

        <div className="flex items-start mr-4 w-72">
          {/* Step 1 */}
          <div className="flex flex-col items-center flex-shrink-0 w-24">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff3b30] to-[#b82db8] text-white flex items-center justify-center shadow-md relative z-10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v15l-3.5-2.5L12 21l-3.5-2.5L5 21V6z" />
                <line x1="8" y1="10" x2="15" y2="10" />
                <line x1="8" y1="14" x2="12" y2="14" />
              </svg>
            </div>
            <span className="text-[12px] font-semibold text-gray-700 mt-2 whitespace-nowrap">Create Customer</span>
          </div>

          {/* Connecting line */}
          <div className="flex-1 h-[2px] bg-gradient-to-r from-[#b82db8] to-[#ff3b30] mt-5 -mx-8 z-0"></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center flex-shrink-0 w-24">
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 flex items-center justify-center shadow-sm relative z-10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
                <line x1="4" y1="11" x2="20" y2="11" />
                <line x1="12" y1="6" x2="12" y2="11" />
                <line x1="7" y1="15" x2="11" y2="15" />
                <line x1="7" y1="18" x2="13" y2="18" />
              </svg>
            </div>
            <span className="text-[12px] font-medium text-gray-500 mt-2 whitespace-nowrap">Customer Onboarded</span>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-5 pb-24 md:px-8 md:pt-6">
          <form id="customer-form" className="max-w-6xl" onSubmit={handleSubmit} noValidate>

            {attempted && visibleErrorCount > 0 && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
                Please fix {visibleErrorCount} {visibleErrorCount === 1 ? 'error' : 'errors'} before continuing.
                {' '}Tabs with problems are marked with a red dot.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

              {/* Left Column */}
              <div className="space-y-5 min-w-0">
                {/* Customer Type */}
                <div className="flex items-center">
                  <label className={labelCls}>Customer Type <span className="text-red-500">*</span></label>
                  <div className="flex items-center space-x-6">
                    {['Business', 'Individual'].map((type) => (
                      <label key={type} className="flex items-center cursor-pointer text-[15px] text-[#1a233a] font-medium">
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full mr-2.5 transition-all ${formData.customer_type === type ? 'bg-gradient-to-br from-[#ff3b30] to-[#b82db8]' : 'border border-gray-300'}`}>
                          {formData.customer_type === type && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <input
                          type="radio"
                          className="hidden"
                          checked={formData.customer_type === type}
                          onChange={() => setFormData((prev) => ({ ...prev, customer_type: type }))}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Primary Contact */}
                <div className="flex items-start min-w-0 relative">
                  <label className={`${labelCls} mt-2.5`}>Primary Contact <span className="text-red-500">*</span></label>
                  <div className="flex-1 flex items-center space-x-3 min-w-0">
                    <div className="relative w-12 shrink-0">
                      <select
                        name="primary_contact_salutation"
                        value={formData.primary_contact_salutation}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-1 py-2 text-[13px] text-gray-600 focus:outline-none focus:border-blue-500 appearance-none bg-white shadow-sm text-center"
                      >
                        <option value=""></option>
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                      </select>
                      <ChevronDown className="absolute right-1 top-2.5 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input type="text" placeholder="First Name" maxLength={MAX_NAME_LEN} className={`w-full ${cls('primary_contact_first_name', IN_MAIN)} placeholder-gray-400`} name="primary_contact_first_name" value={formData.primary_contact_first_name} onChange={handleChange} {...fp('primary_contact_first_name')} />
                      {err('primary_contact_first_name')}
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input type="text" placeholder="Last Name" maxLength={MAX_NAME_LEN} className={`w-full ${cls('primary_contact_last_name', IN_MAIN)} placeholder-gray-400`} name="primary_contact_last_name" value={formData.primary_contact_last_name} onChange={handleChange} {...fp('primary_contact_last_name')} />
                      {err('primary_contact_last_name')}
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div className="flex items-center relative min-w-0">
                  <label className={labelCls}>Display Name <span className="text-red-500">*</span></label>
                  <input type="text" className={cls('display_name', IN_MAIN)} name="display_name" value={formData.display_name} onChange={handleChange} {...fp('display_name')} />
                  {blank(formData.display_name) && !hasErr('display_name') && (
                    <span className="absolute right-2 top-1.5 bg-[#fce8e8] text-[#d9534f] text-[10px] px-2 py-0.5 rounded-full font-semibold">Required</span>
                  )}
                  {errRow('display_name')}
                </div>

                {/* Website */}
                <div className="flex items-center min-w-0 relative">
                  <label className={labelCls}>Website</label>
                  <div className="relative flex-1 min-w-0">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Globe className="w-4 h-4 text-gray-400" />
                    </span>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.example.com"
                      className={`w-full min-w-0 ${cls('website', 'border rounded-md pl-9 pr-3 py-2 text-[13px] focus:outline-none placeholder-gray-400 bg-white shadow-sm')}`}
                      {...fp('website')}
                    />
                  </div>
                  {errRow('website')}
                </div>

                {/* Primary Number */}
                <div className="flex items-center min-w-0 relative">
                  <label className={labelCls}>Primary Number <span className="text-red-500">*</span></label>
                  <div className="flex-1 min-w-0">
                    {phoneField({
                      k: 'primary_number',
                      numberName: 'primary_number',
                      countryFieldName: 'primary_country',
                      country: formData.primary_country,
                      value: formData.primary_number,
                      onNumberChange: handleChange,
                      onCountryChange: handleChange,
                    })}
                  </div>
                  {errRow('primary_number')}
                </div>

                {/* PAN */}
                <div className="flex items-center min-w-0 relative">
                  <label className={labelCls}>PAN <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="pan"
                    value={formData.pan}
                    onChange={handleChange}
                    maxLength={10}
                    className={`${cls('pan', IN_MAIN)} uppercase`}
                    placeholder="ABCDE1234F"
                    {...fp('pan')}
                  />
                  {errRow('pan')}
                </div>

                {/* MSME (optional) */}
                <div className="flex items-center min-w-0 relative">
                  <label className={labelCls}>MSME</label>
                  <input
                    type="text"
                    name="msme"
                    value={formData.msme}
                    onChange={handleChange}
                    maxLength={19}
                    placeholder="UDYAM-KA-00-0000000"
                    className={`${cls('msme', IN_MAIN)} uppercase`}
                    {...fp('msme')}
                  />
                  {errRow('msme')}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5 min-w-0">
                {/* Spacer for Customer Type row to align grids */}
                <div className="hidden md:block h-[24px]"></div>

                {/* Spacer for Primary Contact row to align grids (shifted down by 1 field) */}
                <div className="hidden md:block h-[38px]"></div>

                {/* Company Name */}
                <div className="flex items-center min-w-0 relative">
                  <label className={labelCls}>
                    Company Name {formData.customer_type === 'Business' && <span className="text-red-500">*</span>}
                  </label>
                  <input type="text" className={cls('company_name', IN_MAIN)} name="company_name" value={formData.company_name} onChange={handleChange} {...fp('company_name')} />
                  {errRow('company_name')}
                </div>

                {/* Email Address */}
                <div className="flex items-center min-w-0 relative">
                  <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
                  <div className="relative flex-1 min-w-0">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </span>
                    <input type="email" className={`w-full min-w-0 ${cls('email_address', 'border rounded-md pl-9 pr-3 py-2 text-[13px] focus:outline-none bg-white shadow-sm')}`} name="email_address" value={formData.email_address} onChange={handleChange} {...fp('email_address')} />
                  </div>
                  {errRow('email_address')}
                </div>

                {/* Secondary Number (optional) */}
                <div className="flex items-center min-w-0 relative">
                  <label className={labelCls}>Secondary Number</label>
                  <div className="flex-1 min-w-0">
                    {phoneField({
                      k: 'secondary_number',
                      numberName: 'secondary_number',
                      countryFieldName: 'secondary_country',
                      country: formData.secondary_country,
                      value: formData.secondary_number,
                      onNumberChange: handleChange,
                      onCountryChange: handleChange,
                    })}
                  </div>
                  {errRow('secondary_number')}
                </div>

                {/* GSTIN (optional) */}
                <div className="flex items-center min-w-0 relative">
                  <label className={labelCls}>GSTIN</label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    maxLength={15}
                    className={`${cls('gstin', IN_MAIN)} uppercase`}
                    placeholder="22AAAAA0000A1Z5"
                    {...fp('gstin')}
                  />
                  {errRow('gstin')}
                </div>
              </div>

            </div>

            <div className="pt-8">
              <div id="form-tabs" className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-[14px] font-medium transition-colors relative ${activeTab === tab
                        ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8]'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {tab}
                      {tabHasError(tab) && (
                        <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-middle"></span>
                      )}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8]"></div>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="py-6">

                {/* === OTHER DETAILS TAB === */}
                {activeTab === 'Other Details' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <div className="space-y-5 min-w-0 md:pr-4">
                      {[
                        { name: 'sales_region', label: 'Sales Region', options: ['North', 'South', 'East', 'West'] },
                        { name: 'currency', label: 'Currency', options: ['INR', 'USD', 'EUR'] },
                      ].map(({ name, label, options }) => (
                        <div key={name} className="flex items-center min-w-0 relative">
                          <label className="text-[13px] font-bold text-[#1a233a] w-36 shrink-0">
                            {label} <span className="text-red-500">*</span>
                          </label>
                          <div className="flex-1 relative">
                            <select
                              name={name}
                              value={formData[name]}
                              onChange={handleChange}
                              className={`w-full ${cls(name, 'border rounded-md px-3 py-2 text-[13px] focus:outline-none appearance-none bg-white shadow-sm')}`}
                              {...fp(name)}
                            >
                              <option value="">Select</option>
                              {options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                          {errRow(name)}
                        </div>
                      ))}

                      <div className="flex items-center min-w-0 relative">
                        <label className="text-[13px] font-bold text-[#1a233a] w-36 shrink-0">
                          Opening Balance <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          name="opening_balance"
                          value={balanceFocused ? formData.opening_balance : formatIN(formData.opening_balance)}
                          onChange={handleChange}
                          className={cls('opening_balance', IN_MAIN)}
                          {...fp('opening_balance')}
                          onFocus={(e) => { setBalanceFocused(true); e.target.select(); }}
                          onBlur={() => { setBalanceFocused(false); fp('opening_balance').onBlur(); }}
                        />
                        {errRow('opening_balance')}
                      </div>

                      <div className="flex items-center min-w-0 relative">
                        <label className="text-[13px] font-bold text-[#1a233a] w-36 shrink-0">
                          Payment Terms <span className="text-red-500">*</span>
                        </label>
                        <div className="flex-1 relative">
                          <select
                            name="payment_terms"
                            value={formData.payment_terms}
                            onChange={handleChange}
                            className={`w-full ${cls('payment_terms', 'border rounded-md px-3 py-2 text-[13px] focus:outline-none appearance-none bg-white shadow-sm')}`}
                            {...fp('payment_terms')}
                          >
                            <option value="">Select</option>
                            <option value="Net 15">Net 15</option>
                            <option value="Net 30">Net 30</option>
                            <option value="Net 60">Net 60</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {errRow('payment_terms')}
                      </div>

                      <div className="flex items-start pt-2">
                        <label className="text-[13px] font-bold text-[#1a233a] w-36 shrink-0 pt-2">
                          Documents
                        </label>
                        <div className="flex-1">
                          <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                            <UploadCloud className="w-6 h-6 text-gray-500 mb-2" strokeWidth={2} />
                            <p className="text-[12px] font-medium text-[#1a233a]">click to upload or drag and drop</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* === ADDRESS TAB === */}
                {activeTab === 'Address' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1a233a] mb-5">Billing Address</h3>
                      {renderAddress('billing', billingAddress)}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-5">
                        <h3 className="text-[15px] font-bold text-[#1a233a]">Shipping Address</h3>
                        <button
                          type="button"
                          onClick={() => setShippingAddress({ ...billingAddress })}
                          className="text-[12px] font-semibold text-blue-600 flex items-center hover:underline"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy billing address
                        </button>
                      </div>
                      {renderAddress('shipping', shippingAddress)}
                    </div>
                  </div>
                )}

                {/* === CONTACT DIRECTORY TAB === */}
                {activeTab === 'Contact Directory' && (
                  <div className="max-w-4xl space-y-6">
                    <div className="space-y-6">
                      {contactPersons.map((contact, index) => {
                        const k = (n) => `contacts.${index}.${n}`;
                        return (
                          <div key={`contact-person-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            <div className="md:col-span-2 flex items-center justify-between border-b border-gray-100 pb-2">
                              <h3 className="text-[13px] font-bold text-[#1a233a]">Contact Person {index + 1}</h3>
                              {contactPersons.length > 1 && (
                                <button type="button" onClick={() => removeContactPerson(index)} className="flex items-center gap-1 text-[12px] font-semibold text-red-500 hover:text-red-600 hover:underline">
                                  <Trash2 className="w-3.5 h-3.5" />Delete
                                </button>
                              )}
                            </div>

                            <div className="flex flex-col relative">
                              <label htmlFor={`contact-name-${index}`} className="text-[13px] font-bold text-[#1a233a] mb-1">Name</label>
                              <input id={`contact-name-${index}`} type="text" name="name" value={contact.name} onChange={(e) => handleContactPersonChange(index, e)} className={cls(k('name'), IN_TAB)} placeholder="Contact Person Name" {...fp(k('name'))} />
                              {err(k('name'))}
                            </div>
                            <div className="flex flex-col relative">
                              <label htmlFor={`contact-email-${index}`} className="text-[13px] font-bold text-[#1a233a] mb-1">Email Address</label>
                              <input id={`contact-email-${index}`} type="email" name="email" value={contact.email} onChange={(e) => handleContactPersonChange(index, e)} className={cls(k('email'), IN_TAB)} placeholder="Email Address" {...fp(k('email'))} />
                              {err(k('email'))}
                            </div>
                            <div className="flex flex-col relative">
                              <label htmlFor={`contact-mobile-${index}`} className="text-[13px] font-bold text-[#1a233a] mb-1">Mobile Number</label>
                              {phoneField({
                                k: k('mobile_number'),
                                id: `contact-mobile-${index}`,
                                numberName: 'mobile_number',
                                countryFieldName: 'mobile_country',
                                country: contact.mobile_country,
                                value: contact.mobile_number,
                                onNumberChange: (e) => handleContactPersonChange(index, e),
                                onCountryChange: (e) => handleContactPersonChange(index, e),
                              })}
                              {err(k('mobile_number'))}
                            </div>
                            <div className="flex flex-col relative">
                              <label htmlFor={`contact-designation-${index}`} className="text-[13px] font-bold text-[#1a233a] mb-1">Designation</label>
                              <input id={`contact-designation-${index}`} type="text" name="designation" value={contact.designation} onChange={(e) => handleContactPersonChange(index, e)} className={cls(k('designation'), IN_TAB)} placeholder="Designation" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-2">
                      <button type="button" onClick={addContactPerson} className="text-blue-600 hover:text-blue-700 text-[13px] font-semibold flex items-center gap-1.5 transition-colors hover:underline">
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Add Contact Person
                      </button>
                    </div>
                  </div>
                )}

                {/* === BANK DETAILS TAB === */}
                {activeTab === 'Bank Details' && (
                  <div className="max-w-4xl">
                    <div className="mb-6">
                      <h3 className="text-[15px] font-bold text-[#1a233a]">Bank Details</h3>
                      <p className="text-[12px] text-gray-500 mt-1">Add the customer&apos;s primary bank account information.</p>
                    </div>

                    <div className="space-y-6">
                      {bankDetails.map((details, index) => {
                        const k = (n) => `bank.${index}.${n}`;
                        const fields = [
                          { name: 'bank_name', label: 'Bank Name', id: 'bank-name', ph: 'Enter bank name' },
                          { name: 'account_holder', label: 'Account Holder', id: 'account-holder', ph: 'Enter account holder name' },
                          { name: 'account_number', label: 'Account No', id: 'account-number', ph: 'Enter account number', numeric: true },
                          { name: 'ifsc_code', label: 'IFSC Code', id: 'ifsc-code', ph: 'ABCD0123456', upper: true },
                        ];
                        return (
                          <div key={`bank-details-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            <div className="md:col-span-2 flex items-center justify-between border-b border-gray-100 pb-2">
                              <h4 className="text-[13px] font-bold text-[#1a233a]">Bank Account {index + 1}</h4>
                              {bankDetails.length > 1 && (
                                <button type="button" onClick={() => removeBankDetails(index)} className="flex items-center gap-1 text-[12px] font-semibold text-red-500 hover:text-red-600 hover:underline">
                                  <Trash2 className="w-3.5 h-3.5" />Delete
                                </button>
                              )}
                            </div>

                            {fields.map((fd) => (
                              <div key={fd.name} className="flex flex-col relative">
                                <label htmlFor={`${fd.id}-${index}`} className="text-[13px] font-bold text-[#1a233a] mb-1">
                                  {fd.label} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  id={`${fd.id}-${index}`}
                                  type="text"
                                  name={fd.name}
                                  value={details[fd.name]}
                                  onChange={(e) => handleBankDetailChange(index, e)}
                                  placeholder={fd.ph}
                                  inputMode={fd.numeric ? 'numeric' : undefined}
                                  maxLength={fd.name === 'ifsc_code' ? 11 : undefined}
                                  className={`${cls(k(fd.name), IN_TAB)} placeholder-gray-400 ${fd.upper ? 'uppercase' : ''}`}
                                  {...fp(k(fd.name))}
                                />
                                {err(k(fd.name))}
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      <button type="button" onClick={addBankDetails} className="text-blue-600 hover:text-blue-700 text-[13px] font-semibold flex items-center gap-1.5 transition-colors hover:underline">
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Add Bank Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* ── Fixed Footer ── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-8 py-3 flex justify-end items-center gap-3 z-20">
        <button
          type="button"
          onClick={() => navigate(isEditMode ? `/customers/${customerId}` : '/customers')}
          className="px-4 py-1.5 rounded-lg border border-gray-300 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
        >
          Cancel
        </button>
        <button type="button" className="px-4 py-1.5 rounded-lg bg-gray-100 text-[13px] font-semibold text-gray-700 hover:bg-gray-200 transition-colors flex items-center shadow-sm">
          <Bookmark className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
          Save Draft
        </button>
        <button
          type="submit"
          form="customer-form"
          disabled={isSubmitting}
          className="px-6 py-1.5 rounded-lg bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] text-white text-[13px] font-bold shadow-sm hover:opacity-90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Saving...'
            : activeTab !== tabs[tabs.length - 1]
              ? 'Save & Next'
              : isEditMode ? 'Update' : 'Save'}
        </button>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-112.5 min-h-100 flex flex-col items-center relative overflow-hidden animate-in fade-in zoom-in duration-300">

            {/* Green Curved Header */}
            <div className="absolute top-0 left-0 w-full h-40 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[150%] h-70 bg-[#22c55e] rounded-b-[50%]"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center w-full px-8 pt-21.25 pb-8">

              {/* Checkmark Circle */}
              <div className="w-18 h-18 bg-white rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.1)] mb-6">
                <div className="w-12 h-12 bg-[#22c55e] rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" strokeWidth={4} />
                </div>
              </div>

              {/* Text Content */}
              <h3 className="text-[22px] font-bold text-[#22c55e] text-center mb-4 leading-snug">
                Customer Profile<br />Successfully {isEditMode ? 'Updated' : 'Created'}.
              </h3>

              <p className="text-[10px] font-bold text-gray-400 mb-6 tracking-wide">
                *Redirect in 3 Sec*
              </p>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(isEditMode ? `/customers/${customerId}` : '/customers');
                }}
                className="px-10 py-1.5 border-2 border-[#22c55e] text-[#22c55e] rounded-[10px] font-bold text-sm hover:bg-green-50 transition-colors bg-white shadow-sm"
              >
                Okay
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
};

export default CreateCustomerPage;