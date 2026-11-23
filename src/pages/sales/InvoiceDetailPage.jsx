import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  MoreHorizontal,
  Search,
  Edit,
  Send,
  Printer,
  ChevronDown,
  FileText,
  PackagePlus,
  Factory,
  Package,
  Truck,
  Receipt,
  PackageCheck,
  HandCoins,
  X,
  ZoomIn,
  ZoomOut,
  Hexagon,
  Box
} from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api/v1';

// Your company details, shown at the top of the printed invoice.
// Fill these in (leave a value empty to hide that line).
const COMPANY = {
  name: 'CORRNEX',
  tagline: '',
  address: '',
  gstin: ''
};

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
const formatINR = (n) =>
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatQty = (n) =>
  Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const STATUS_META = {
  PAID: { label: 'Paid', cls: 'bg-[#dcfce7] text-[#16a34a]' },
  UNPAID: { label: 'Unpaid', cls: 'bg-[#ffecd6] text-[#ff7a59]' },
  PARTIALLY_PAID: { label: 'Partially Paid', cls: 'bg-[#ffedd5] text-[#c2410c]' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' }
};

const statusMeta = (s) =>
  STATUS_META[String(s || '').toUpperCase()] || {
    label: s || 'N/A',
    cls: 'bg-gray-100 text-gray-500'
  };

const specLine = (item) =>
  [
    item.box_type,
    item.paper_type,
    item.box_size,
    item.ply ? `${item.ply} Ply` : null,
    item.bf ? `${Number(item.bf)} BF` : null
  ]
    .filter(Boolean)
    .join(', ');

const itemName = (item) =>
  item.box_description || item.box_spec || 'Corrugated Box';

// Print rules: when printing, hide the whole app and show only the invoice sheet.
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 10mm; }
  html, body { background: #fff !important; }
  body > *:not(#invoice-print-portal) { display: none !important; }
  #invoice-print-portal .no-print { display: none !important; }
  #invoice-print-portal .print-overlay {
    position: static !important; inset: auto !important; overflow: visible !important;
    background: transparent !important; padding: 0 !important;
  }
  #invoice-print-portal .print-sheet {
    zoom: 1 !important; box-shadow: none !important; border: none !important;
    border-radius: 0 !important; max-width: none !important; min-height: 0 !important;
    margin: 0 !important; padding: 0 !important;
  }
  #invoice-print-portal * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

// ---------------------------------------------------------------
// The printable invoice (what the Print button shows)
// ---------------------------------------------------------------
const InvoiceDocument = ({ invoice, items, paymentTerms }) => {
  const discount = Number(invoice.discount_amount) || 0;
  const paid = Number(invoice.amount_paid) || 0;
  const gstRate = Number(invoice.gst_rate) || 0;
  const status = statusMeta(invoice.payment_status);

  return (
    <div>
      {/* Document Header */}
      <div className="flex justify-between items-start border-b border-gray-100 pb-8 mb-8">
        <div className="flex items-start">
          <div className="w-14 h-14 rounded-2xl bg-[#3b82f6] text-white flex items-center justify-center mr-4 shadow-sm flex-shrink-0">
            <Hexagon className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e293b] mb-1 tracking-tight">{COMPANY.name}</h1>
            {COMPANY.tagline && <p className="text-gray-500 text-xs mb-3">{COMPANY.tagline}</p>}
            {COMPANY.address && (
              <p className="text-gray-500 text-xs leading-relaxed max-w-[220px] mb-2 whitespace-pre-line">
                {COMPANY.address}
              </p>
            )}
            {COMPANY.gstin && (
              <p className="text-xs font-bold text-[#1e293b]">
                GSTIN: <span className="text-gray-500 font-medium">{COMPANY.gstin}</span>
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-[11px] font-bold text-[#1e293b] mb-2 tracking-wider">TAX INVOICE</h2>
          <p className="text-2xl font-bold text-[#3b82f6] mb-3">{invoice.invoice_number}</p>
          <p className="text-gray-500 text-xs font-medium">
            {invoice.invoice_date_display}
            {invoice.sales_order_number ? ` • Ref: ${invoice.sales_order_number}` : ''}
          </p>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div className="flex justify-between items-start pb-8 mb-4">
        <div className="w-1/2 pr-8">
          <h3 className="text-[11px] font-bold text-[#3b82f6] uppercase tracking-wider mb-3">BILL TO</h3>
          <p className="text-sm font-bold text-[#1e293b] mb-1">{invoice.customer_name}</p>
          <p className="text-xs text-gray-600 leading-relaxed max-w-[250px] mb-3">
            {invoice.billing_address || 'N/A'}
          </p>
          {invoice.customer_gstin && (
            <p className="text-xs font-bold text-[#1e293b]">
              GSTIN: <span className="text-gray-500 font-medium">{invoice.customer_gstin}</span>
            </p>
          )}
        </div>
        <div className="w-1/2 pl-4">
          <h3 className="text-[11px] font-bold text-[#3b82f6] uppercase tracking-wider mb-3">SHIP TO</h3>
          <p className="text-sm font-bold text-[#1e293b] mb-1">{invoice.customer_name}</p>
          <p className="text-xs text-gray-600 leading-relaxed max-w-[250px] mb-3">
            {invoice.shipping_address || 'N/A'}
          </p>
          {invoice.customer_gstin && (
            <p className="text-xs font-bold text-[#1e293b]">
              GSTIN: <span className="text-gray-500 font-medium">{invoice.customer_gstin}</span>
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="py-4 px-4 text-[11px] font-bold text-[#1e293b] uppercase tracking-wider w-[55%] rounded-l-md">ITEM DESCRIPTION</th>
              <th className="py-4 px-4 text-[11px] font-bold text-[#1e293b] uppercase tracking-wider text-center">QUANTITY</th>
              <th className="py-4 px-4 text-[11px] font-bold text-[#1e293b] uppercase tracking-wider text-right">RATE</th>
              <th className="py-4 px-4 text-[11px] font-bold text-[#1e293b] uppercase tracking-wider text-right rounded-r-md">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.invoice_item_id} className="border-b border-gray-100">
                <td className="py-5 px-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center mr-4 flex-shrink-0">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1e293b] mb-1">{itemName(item)}</p>
                      {specLine(item) && (
                        <p className="text-[10px] text-gray-500 font-medium">{specLine(item)}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-5 px-4 text-center text-xs text-gray-700 font-medium whitespace-nowrap">
                  {formatQty(item.quantity)} Boxes
                </td>
                <td className="py-5 px-4 text-right text-xs text-gray-700 whitespace-nowrap">
                  ₹ {formatINR(item.unit_rate)}
                </td>
                <td className="py-5 px-4 text-right text-xs font-bold text-[#1e293b] whitespace-nowrap">
                  ₹ {formatINR(item.item_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-[300px] space-y-4 pt-4">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="text-[#1e293b] font-bold">₹ {formatINR(invoice.item_total)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#f43f5e] font-medium">Discount</span>
              <span className="text-[#f43f5e] font-bold">(-) ₹ {formatINR(discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-500 font-medium">GST{gstRate ? ` (${gstRate}%)` : ''}</span>
            <span className="text-[#1e293b] font-bold">₹ {formatINR(invoice.gst_amount)}</span>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[15px] font-bold text-[#1e293b]">Total (INR)</span>
            <span className="text-[15px] font-bold text-[#1e293b]">₹ {formatINR(invoice.total_amount)}</span>
          </div>
          {paid > 0 && (
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-gray-500 font-medium">Amount Paid</span>
              <span className="text-[#16a34a] font-bold">₹ {formatINR(paid)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-500 font-medium">Balance Due</span>
            <span className="text-[#1e293b] font-bold">₹ {formatINR(invoice.balance_amount)}</span>
          </div>
        </div>
      </div>

      {/* Payment details */}
      <div className="bg-[#f0f9ff] rounded-xl p-6 border border-[#dcedf8]">
        <h3 className="text-[14px] font-bold text-[#1e293b] mb-4">Payment Details</h3>
        <div className="grid grid-cols-[180px_1fr] gap-y-3 text-[12px]">
          <div className="text-gray-400">Payment Status</div>
          <div>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${status.cls}`}>{status.label}</span>
          </div>
          <div className="text-gray-400">Payment Terms</div>
          <div className="text-[#1e293b]">{paymentTerms}</div>
          <div className="text-gray-400">PO Number</div>
          <div className="text-[#1e293b]">{invoice.po_number || 'N/A'}</div>
          {invoice.customer_email && (
            <>
              <div className="text-gray-400">Email</div>
              <div className="text-[#1e293b]">{invoice.customer_email}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
const InvoiceDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [allInvoices, setAllInvoices] = useState([]);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const listRes = await fetch(`${API_BASE_URL}/invoices`);
        const listData = listRes.ok ? await listRes.json() : [];
        setAllInvoices(listData);

        if (id) {
          const detailRes = await fetch(`${API_BASE_URL}/invoices/${id}`);
          setActiveInvoice(detailRes.ok ? await detailRes.json() : null);
        } else if (listData.length > 0) {
          navigate(`/sales/invoices/${listData[0].id}`, { replace: true });
        }
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // Close the print preview with Escape
  useEffect(() => {
    if (!isPrintOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsPrintOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPrintOpen]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading invoice details...</div>;
  }

  if (!activeInvoice) {
    return <div className="p-8 text-center text-gray-500 font-medium">Invoice not found.</div>;
  }

  const tabs = [
    { name: 'Quotes', path: '/sales/quotes' },
    { name: 'Sales Orders', path: '/sales/orders' },
    { name: 'Invoices', path: '/sales/invoices' },
    { name: 'Payments', path: '/sales/payments' }
  ];

  const steps = [
    { name: 'Quote', icon: PackagePlus, status: 'completed' },
    { name: 'Sales Order', icon: FileText, status: 'completed' },
    { name: 'Production', icon: Factory, status: 'completed' },
    { name: 'Package', icon: Package, status: 'completed' },
    { name: 'Ship', icon: Truck, status: 'completed' },
    { name: 'Invoice', icon: Receipt, status: 'active' },
    { name: 'Delivered', icon: PackageCheck, status: 'upcoming' },
    { name: 'Payment', icon: HandCoins, status: 'upcoming' }
  ];

  // ---------- derived values ----------
  const items = activeInvoice.items || [];
  const firstItem = items[0] || {};
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const status = statusMeta(activeInvoice.payment_status);
  const discount = Number(activeInvoice.discount_amount) || 0;
  const gstRate = Number(activeInvoice.gst_rate) || 0;

  const days = Number(activeInvoice.payment_days);
  const paymentTerms =
    (days > 0 ? `Net ${days}` : 'Due On Receipt') +
    (activeInvoice.due_date_display ? ` (Due ${activeInvoice.due_date_display})` : '');

  const orderDate =
    activeInvoice.order_date_display || activeInvoice.invoice_date_display || 'N/A';

  const detailRows = [
    ['Invoice Number', activeInvoice.invoice_number],
    ['Sales Order Number', activeInvoice.sales_order_number || 'N/A'],
    [
      'Payment Status',
      <span key="ps" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>
        {status.label}
      </span>
    ],
    ['Payment Terms', paymentTerms],
    ['Order Date', orderDate]
  ];

  const visibleInvoices = allInvoices.filter((inv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(inv.invoice || '').toLowerCase().includes(q) ||
      String(inv.customerName || '').toLowerCase().includes(q) ||
      String(inv.orderNo || '').toLowerCase().includes(q)
    );
  });

  const handlePrint = () => {
    const previousTitle = document.title;
    // The browser uses the page title as the default PDF file name.
    document.title = activeInvoice.invoice_number;
    window.print();
    document.title = previousTitle;
  };

  return (
    <main className="flex-1 overflow-y-hidden bg-[#f8f9fb] flex flex-col relative p-1.5 gap-1.5">

      {/* Sub Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm shrink-0 px-8">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-1 px-4 py-2 text-[13px] border-b-2 transition-colors whitespace-nowrap ${tab.name === 'Invoices'
                ? 'text-black font-bold border-black'
                : 'text-gray-500 font-medium border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5">

        {/* Top Banner with Stepper */}
        <div className="bg-white px-6 py-2 rounded-xl shadow-sm flex-shrink-0">
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block w-fit mb-1">
            Invoice
          </h2>

          <div className="flex items-start w-full min-w-[700px] overflow-x-auto hide-scrollbar pb-0 px-2">
            {steps.map((step, index) => {
              const Icon = step.icon;

              let textClass = '';
              let iconBgClass = '';
              let iconTextClass = '';
              let lineClass = 'bg-gray-200';

              if (step.status === 'completed') {
                textClass = 'text-green-600 font-semibold';
                iconBgClass = 'bg-green-400';
                iconTextClass = 'text-white';
                if (index < steps.length - 1 && steps[index + 1].status === 'active') {
                  lineClass = 'bg-gradient-to-r from-green-400 to-[#d54a88]';
                } else {
                  lineClass = 'bg-green-400';
                }
              } else if (step.status === 'active') {
                textClass = 'text-gray-900 font-semibold';
                iconBgClass = 'bg-gradient-to-br from-[#ff7a59] via-[#d54a88] to-[#402de8] shadow-md';
                iconTextClass = 'text-white';
              } else {
                textClass = 'text-gray-500 font-semibold';
                iconBgClass = 'bg-white border-2 border-gray-200';
                iconTextClass = 'text-gray-400';
              }

              return (
                <React.Fragment key={step.name}>
                  <div className="flex flex-col items-center shrink-0 w-[90px]">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center mb-1 ${iconBgClass} ${iconTextClass}`}>
                      <Icon className="w-3.5 h-3.5" strokeWidth={step.status === 'active' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] text-center ${textClass}`}>
                      {step.name}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex-1 flex items-start pt-[15px] -mx-[25px]">
                      <div className={`h-[2px] w-full ${lineClass}`}></div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Master Detail View Area */}
        <div className="flex-1 flex gap-1.5 overflow-hidden min-h-0">

          {/* Left Master List */}
          <div className="w-[270px] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-shrink-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1 cursor-pointer">
                  <h3 className="text-[15px] font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block w-fit">All Invoices</h3>
                  <ChevronDown className="w-5 h-5 text-[#8b5cf6]" />
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => navigate('/sales/invoices/new')} className="w-7 h-7 bg-gray-900 hover:bg-black text-white rounded-full flex items-center justify-center shadow-sm transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button className="w-7 h-7 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full flex items-center justify-center transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, product or item..."
                  className="w-full bg-[#f4f6f8] border-none rounded-md pl-9 pr-3 py-2.5 text-[12px] font-medium text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-200 placeholder-gray-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
              {visibleInvoices.map((inv) => {
                const isActive = String(inv.id) === String(id);
                return (
                  <div
                    key={inv.id}
                    onClick={() => navigate(`/sales/invoices/${inv.id}`)}
                    className={`rounded-2xl px-3 py-2 cursor-pointer transition-all shadow-sm mb-2.5 ${isActive
                      ? 'bg-gradient-to-br from-[#ffede1] via-[#fae8f8] to-[#efdfff] border border-transparent hover:shadow-md'
                      : 'bg-white hover:shadow-md hover:bg-gradient-to-br hover:from-[#ffede1] hover:via-[#fae8f8] hover:to-[#efdfff] hover:border-transparent border border-gray-100'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[12px] font-medium text-[#374151]">{inv.invoice}</span>
                      <span className="text-[9px] text-gray-400 font-medium tracking-wide">{inv.date}</span>
                    </div>
                    <h3 className="text-[11px] font-bold text-[#111827] mb-1 uppercase leading-snug truncate">
                      {inv.customerName}
                    </h3>
                    <div className="text-right">
                      <span className="text-[14px] font-bold text-[#111827]">₹{formatINR(inv.amount)}</span>
                    </div>
                  </div>
                );
              })}
              {visibleInvoices.length === 0 && (
                <p className="text-center text-[12px] text-gray-400 py-6">No invoices found.</p>
              )}
            </div>
          </div>

          {/* Right Detail View */}
          <div className="flex-1 flex flex-col gap-1.5 overflow-hidden min-h-0">

            {/* Detail Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block w-fit">
                  {activeInvoice.invoice_number}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="w-8 h-8 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full flex items-center justify-center text-gray-600 transition-colors shadow-sm">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button className="w-8 h-8 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full flex items-center justify-center text-gray-600 transition-colors shadow-sm">
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsPrintOpen(true)}
                  title="Print / view invoice"
                  className="w-8 h-8 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full flex items-center justify-center text-gray-600 transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button className="flex items-center px-4 py-1.5 bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] hover:opacity-90 text-white rounded-full text-xs font-bold transition-opacity shadow-sm">
                  Record Payment
                </button>
                <button className="w-8 h-8 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full flex items-center justify-center text-gray-600 transition-colors shadow-sm">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-2 pr-1">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 min-h-full space-y-4">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

                  {/* Customer Profile Card */}
                  <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">Customer Profile</h3>
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff7a59] via-[#d54a88] to-[#402de8] text-white flex items-center justify-center text-sm font-bold shadow-sm mr-3 flex-shrink-0">
                          {activeInvoice.customer_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-gray-900">{activeInvoice.customer_name}</h4>
                          <p className="text-[11px] font-semibold text-gray-400">
                            {activeInvoice.customer_code || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-start">
                          <span className="text-[12px] font-medium text-gray-400 w-32">GSTIN</span>
                          <span className="text-[12px] font-bold text-gray-900 flex-1">{activeInvoice.customer_gstin || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-[12px] font-medium text-gray-400 w-32">Point Of Contact</span>
                          <span className="text-[12px] font-bold text-gray-900 flex-1">{activeInvoice.customer_poc || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-[12px] font-medium text-gray-400 w-32">Email</span>
                          <span className="text-[12px] font-bold text-gray-900 flex-1 break-all">{activeInvoice.customer_email || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-[12px] font-medium text-gray-400 w-32">Phone No</span>
                          <span className="text-[12px] font-bold text-gray-900 flex-1">{activeInvoice.customer_phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">Details</h3>
                    </div>
                    <div className="p-4 flex-1">
                      <div className="space-y-1.5">
                        {detailRows.map(([label, value]) => (
                          <div key={label} className="flex items-start items-center">
                            <span className="text-[12px] font-medium text-gray-400 w-36">{label}</span>
                            {typeof value === 'string' ? (
                              <span className="text-[12px] font-bold text-gray-900 flex-1">{value}</span>
                            ) : (
                              <span className="flex-1">{value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Address Details */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 px-4 py-3">
                      <h3 className="text-[14px] font-bold text-gray-500 mb-2">Billing Address</h3>
                      <div className="text-[12px] text-gray-900 font-medium leading-relaxed">
                        {activeInvoice.billing_address || 'No Billing Address'}
                      </div>
                    </div>
                    <div className="hidden md:block w-px bg-gray-100 my-3"></div>
                    <div className="flex-1 px-4 py-3">
                      <h3 className="text-[14px] font-bold text-gray-500 mb-2">Shipping Address</h3>
                      <div className="text-[12px] text-gray-900 font-medium leading-relaxed">
                        {activeInvoice.shipping_address || 'No Shipping Address'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Specification */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">
                      Product Specification
                    </h3>
                  </div>

                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                    {[
                      ['Paper Type', firstItem.paper_type || 'N/A'],
                      ['Box Type', firstItem.box_type || 'N/A'],
                      ['Size', firstItem.box_size || 'N/A'],
                      ['Ply', firstItem.ply ? `${firstItem.ply} Ply` : 'N/A'],
                      ['BF', firstItem.bf ? Number(firstItem.bf) : 'N/A']
                    ].map(([label, value]) => (
                      <div key={label} className="bg-[#f8f9fc] p-3.5 rounded-2xl">
                        <div className="text-[12px] text-gray-500 font-normal mb-1">{label}</div>
                        <div className="text-[14px] font-semibold text-gray-900">{value}</div>
                      </div>
                    ))}
                    <div className="bg-[#f8f9fc] p-3.5 rounded-2xl">
                      <div className="text-[12px] text-gray-500 font-normal mb-1">Quantity</div>
                      <div className="text-[14px] font-semibold text-gray-900">
                        {formatQty(totalQty)}{' '}
                        <span className="text-[11px] font-normal text-gray-500">Boxes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation / Items Table */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">Calculation</h3>
                  </div>
                  <div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f8f9fb] border-b border-gray-100">
                          <th className="py-2.5 px-5 text-[11px] font-medium text-gray-500 w-1/2">Items</th>
                          <th className="py-2.5 px-5 text-[11px] font-medium text-gray-500 text-center">Invoiced Quantity</th>
                          <th className="py-2.5 px-5 text-[11px] font-medium text-gray-500 text-right">Unit Rate (INR)</th>
                          <th className="py-2.5 px-5 text-[11px] font-medium text-gray-500 text-right">Amount Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.invoice_item_id} className="border-b border-gray-50">
                            <td className="py-4 px-5">
                              <div className="text-[13px] font-bold text-gray-900">{itemName(item)}</div>
                              {specLine(item) && (
                                <div className="text-[11px] text-gray-400 font-medium mt-0.5">{specLine(item)}</div>
                              )}
                            </td>
                            <td className="py-4 px-5 text-[13px] font-bold text-gray-900 text-center">{formatQty(item.quantity)}</td>
                            <td className="py-4 px-5 text-[13px] font-bold text-gray-900 text-right">{formatINR(item.unit_rate)}</td>
                            <td className="py-4 px-5 text-[13px] font-bold text-gray-900 text-right">{formatINR(item.item_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Section */}
                  <div className="flex justify-end p-5">
                    <div className="w-72">
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[12px] font-bold text-gray-900">Sub Total</span>
                        <span className="text-[13px] font-bold text-gray-900">{formatINR(activeInvoice.item_total)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-[11px] text-rose-500 font-medium">Discount :</span>
                          <span className="text-[11px] text-rose-500 font-medium">(-) {formatINR(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[11px] text-gray-500 font-medium">GST{gstRate ? ` (${gstRate}%)` : ''} :</span>
                        <span className="text-[11px] text-gray-500 font-medium">{formatINR(activeInvoice.gst_amount)}</span>
                      </div>

                      <div className="flex justify-between items-center py-3 border-t border-dashed border-gray-200">
                        <span className="text-[13px] font-bold text-[#ff7a59]">Total Payable</span>
                        <span className="text-[16px] font-bold bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block w-fit">₹{formatINR(activeInvoice.total_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[11px] text-gray-500 font-medium">Balance Due :</span>
                        <span className="text-[11px] text-gray-900 font-bold">₹{formatINR(activeInvoice.balance_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Print / invoice preview */}
      {isPrintOpen &&
        createPortal(
          <div id="invoice-print-portal">
            <style>{PRINT_CSS}</style>
            <div className="print-overlay fixed inset-0 z-[100] bg-black/50 overflow-y-auto p-6">

              {/* Toolbar (not printed) */}
              <div className="no-print w-full max-w-[850px] mx-auto mb-3 flex items-center justify-between">
                <span className="text-white text-sm font-semibold">{activeInvoice.invoice_number}</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#eef2f6] rounded-full px-2 py-1 shadow-sm border border-gray-200/60">
                    <button
                      onClick={() => setZoom((z) => Math.max(50, z - 10))}
                      className="p-2 text-gray-600 hover:text-[#1a233a] hover:bg-white rounded-full transition-colors"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="px-2 text-xs font-semibold text-gray-600 w-12 text-center">{zoom}%</span>
                    <button
                      onClick={() => setZoom((z) => Math.min(150, z + 10))}
                      className="p-2 text-gray-600 hover:text-[#1a233a] hover:bg-white rounded-full transition-colors"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] hover:opacity-90 text-white rounded-full text-xs font-bold transition-opacity shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Print / Save as PDF
                  </button>
                  <button
                    onClick={() => setIsPrintOpen(false)}
                    title="Close"
                    className="w-8 h-8 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-700 shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Invoice sheet */}
              <div
                className="print-sheet w-full max-w-[850px] mx-auto bg-white rounded-xl shadow-lg border border-[#cbd5e1] min-h-[1100px] p-12 mb-8"
                style={{ zoom: zoom / 100 }}
              >
                <InvoiceDocument invoice={activeInvoice} items={items} paymentTerms={paymentTerms} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
};

export default InvoiceDetailPage;