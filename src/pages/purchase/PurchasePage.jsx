import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, MoreHorizontal, ChevronDown, SlidersHorizontal, GripVertical } from 'lucide-react';
import { getAllPurchaseOrders } from '../../services/purchaseOrderlistApi';
import { getAllBills } from '../../services/billlistApi';

const tabs = ['Expenses', 'Procurement', 'Purchase Order', 'Bills', 'Payment'];

const procurements = [
  { id: 'PR-00001', date: '25/06/2026', prNo: 'PR-00001', vendorName: 'CENTURY PULP & PAPER', material: 'Kraft Paper', quantity: '5,000 Kg', amount: '₹45,000.00', status: 'Pending' },
  { id: 'PR-00002', date: '20/06/2026', prNo: 'PR-00002', vendorName: 'GLOBAL SUPPLIES INC', material: 'Corrugated Sheet', quantity: '2,500 Kg', amount: '₹12,500.00', status: 'Approved' },
  { id: 'PR-00003', date: '15/06/2026', prNo: 'PR-00003', vendorName: 'TECHHARDWARE LTD', material: 'Duplex Board', quantity: '1,200 Kg', amount: '₹0.00', status: 'Draft' },
];

const expenses = [
  { id: 'EXP-00001', date: '25/06/2026', expensesAccount: 'Job Costing', reference: 'EXP-101', vendorName: 'CENTURY PULP & PAPER', paidThrough: 'Undeposited Funds', customerName: 'CENTURY PULP & PAPER', status: 'Billable', amount: '₹45,000.00' },
  { id: 'EXP-00002', date: '20/06/2026', expensesAccount: 'Logistics', reference: 'EXP-102', vendorName: 'GLOBAL SUPPLIES INC', paidThrough: 'Petty Cash', customerName: 'GLOBAL SUPPLIES INC', status: 'Non-Billable', amount: '₹12,500.00' },
  { id: 'EXP-00003', date: '15/06/2026', expensesAccount: 'IT Supplies', reference: 'EXP-103', vendorName: 'TECHHARDWARE LTD', paidThrough: 'Bank Transfer', customerName: 'TECHHARDWARE LTD', status: 'Billable', amount: '₹0.00' },
];

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-[#ffe4d6] text-[#c2410c]',
  CONFIRMED: 'bg-blue-100 text-blue-600',
  APPROVED: 'bg-blue-100 text-blue-600',
  RECEIVED: 'bg-green-100 text-green-600',
  BILLED: 'bg-purple-100 text-purple-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

// ---------- Per-tab configuration ----------
const CONFIG = {
  Bills: {
    noun: 'bill(s)',
    filters: ['Draft', 'Pending Approval', 'Partially Paid', 'Paid', 'Overdue'],
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'bill', label: 'Bill' },
      { key: 'reference', label: 'Reference Number' },
      { key: 'vendor', label: 'Vendor Name' },
      { key: 'amount', label: 'Amount' },
      { key: 'balanceDue', label: 'Balance Due', hidden: true },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'status', label: 'Status' },
    ],
  },
  'Purchase Order': {
    noun: 'purchase order(s)',
    filters: ['Draft', 'Pending Approval', 'Approved', 'Partially Received', 'Fully Received', 'Cancelled'],
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'po', label: 'Purchase Order' },
      { key: 'reference', label: 'Reference' },
      { key: 'vendor', label: 'Vendor Name' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'amount', label: 'Amount', hidden: true },
      { key: 'status', label: 'Status' },
      { key: 'billed', label: 'Billed' },
      { key: 'deliveryDate', label: 'Delivery Date' },
    ],
  },
  Procurement: {
    noun: 'record(s)',
    // Procurement dropdown switches between procurement sections
    filters: ['Purchase Requisition', 'Purchase Order', 'Goods Receipt', 'Supplier Invoices', 'Purchase Return', 'Report'],
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'prNo', label: 'PR No' },
      { key: 'vendor', label: 'Vendor Name' },
      { key: 'material', label: 'Material' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'amount', label: 'Amount', hidden: true },
      { key: 'status', label: 'Status' },
    ],
  },
};

const defaultColumns = (tab) =>
  CONFIG[tab].columns.map((c) => ({ key: c.key, visible: !c.hidden }));

const loadColumns = (tab) => {
  try {
    const saved = JSON.parse(localStorage.getItem(`purchaseCols_${tab}`));
    const keys = CONFIG[tab].columns.map((c) => c.key);
    const valid =
      Array.isArray(saved) &&
      saved.length === keys.length &&
      saved.every((s) => keys.includes(s.key));
    if (valid) return saved;
  } catch (e) {
    /* ignore */
  }
  return defaultColumns(tab);
};

const labelOf = (tab, key) =>
  CONFIG[tab].columns.find((c) => c.key === key)?.label || key;

const normalize = (s) => String(s || '').toLowerCase().replace(/[\s_-]+/g, '');

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '');
const inr = (n) =>
  '₹' +
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const billStatusStyle = (s) => {
  const n = normalize(s);
  if (n === 'paid') return 'bg-[#dcfce7] text-[#16a34a]';
  if (n === 'draft') return 'bg-gray-100 text-gray-600';
  if (n === 'partiallypaid') return 'bg-[#ffedd5] text-[#c2410c]';
  return 'bg-[#ffe8e8] text-[#ff6b6b]';
};

const billOverdue = (b) => {
  const due = b.due_date ? new Date(b.due_date) : null;
  const balance = Number(b.balance_amount ?? b.balance_due ?? 0);
  const n = normalize(b.status);
  return !!due && due < new Date() && balance > 0 && n !== 'paid' && n !== 'draft';
};

const PurchasePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const btnRef = useRef(null);

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Purchase Order');
  const [selectedIds, setSelectedIds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [filters, setFilters] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  const [columnsByTab, setColumnsByTab] = useState(() => ({
    Bills: loadColumns('Bills'),
    'Purchase Order': loadColumns('Purchase Order'),
    Procurement: loadColumns('Procurement'),
  }));
  const [draft, setDraft] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [dragIndex, setDragIndex] = useState(null);

  const isConfigTab = !!CONFIG[activeTab];
  const statusFilter = filters[activeTab] || '';

  // ---------- Data ----------
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        setLoading(true);
        const result = await getAllPurchaseOrders();
        if (result.success) setOrders(result.data);
      } catch (error) {
        console.error('Failed to fetch Purchase Orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    if (activeTab !== 'Bills') return;
    const fetchBills = async () => {
      try {
        setLoading(true);
        const result = await getAllBills();
        setBills(result.success ? result.data || [] : []);
      } catch (error) {
        console.error('Failed to fetch Bills:', error);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, [activeTab]);

  // Reset page, selection and menu on tab / filter change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    setMenuOpen(false);
  }, [activeTab, statusFilter]);

  // ---------- Filtering ----------
  const filterRows = () => {
    if (activeTab === 'Bills') {
      if (!statusFilter) return bills;
      const f = normalize(statusFilter);
      if (f === 'overdue') return bills.filter(billOverdue);
      if (f === 'pendingapproval') return bills.filter((b) => ['pendingapproval', 'pending'].includes(normalize(b.status)));
      return bills.filter((b) => normalize(b.status) === f);
    }
    if (activeTab === 'Purchase Order') {
      if (!statusFilter) return orders;
      const f = normalize(statusFilter);
      return orders.filter((o) => {
        const s = normalize(o.delivery_status);
        if (f === 'pendingapproval') return s === 'pendingapproval' || s === 'pending';
        if (f === 'fullyreceived') return s === 'fullyreceived' || s === 'received';
        if (f === 'approved') return s === 'approved' || s === 'confirmed';
        return s === f;
      });
    }
    if (activeTab === 'Procurement') {
      // Only the Purchase Requisition section has data for now
      const view = statusFilter || 'Purchase Requisition';
      return view === 'Purchase Requisition' ? procurements : [];
    }
    return [];
  };

  const rows = filterRows();
  const totalRecords = rows.length;
  const totalPages = Math.ceil(totalRecords / limit);
  const startIndex = (page - 1) * limit;
  const pagedRows = rows.slice(startIndex, startIndex + limit);

  const getId = (r) =>
    activeTab === 'Bills' ? r.bill_id : activeTab === 'Purchase Order' ? r.purchase_order_id : r.id;

  // ---------- Selection ----------
  const pageIds = pagedRows.map(getId);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]
    );
  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // ---------- Manage Column ----------
  const columns = columnsByTab[activeTab] || [];
  const visibleColumns = columns.filter((c) => c.visible);

  const openPanel = () => {
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left });
    setDraft(columns);
    setPanelOpen(true);
  };
  const toggleDraft = (key) =>
    setDraft((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
  const handleDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    setDraft((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
  };
  const handleSave = () => {
    const next = draft.some((c) => c.visible) ? draft : columns;
    setColumnsByTab((prev) => ({ ...prev, [activeTab]: next }));
    localStorage.setItem(`purchaseCols_${activeTab}`, JSON.stringify(next));
    setPanelOpen(false);
  };
  const handleReset = () => setDraft(defaultColumns(activeTab));

  // ---------- Cells ----------
  const cell = 'py-2.5 px-2 text-[13px] text-[#1a233a] font-medium whitespace-nowrap';

  const renderCell = (key, r) => {
    if (activeTab === 'Bills') {
      switch (key) {
        case 'date': return <td key={key} className={cell}>{fmtDate(r.bill_date)}</td>;
        case 'bill': return <td key={key} className="py-3 px-2 whitespace-nowrap"><span className="text-blue-500 hover:underline font-medium">{r.bill_number || r.bill_code || ''}</span></td>;
        case 'reference': return <td key={key} className={cell}>{r.reference || ''}</td>;
        case 'vendor': return <td key={key} className={cell}>{r.vendor_name || r.vendor_code || 'Unknown Vendor'}</td>;
        case 'amount': return <td key={key} className={cell}>{inr(r.grand_total ?? r.total_amount)}</td>;
        case 'balanceDue': return <td key={key} className={cell}>{inr(r.balance_amount ?? r.balance_due)}</td>;
        case 'dueDate': return <td key={key} className={cell}>{fmtDate(r.due_date)}</td>;
        case 'status': return <td key={key} className="py-3 px-2 whitespace-nowrap"><span className={`px-3 py-1 rounded-full text-[11px] font-medium ${billStatusStyle(r.status)}`}>{r.status || 'Draft'}</span></td>;
        default: return null;
      }
    }
    if (activeTab === 'Purchase Order') {
      switch (key) {
        case 'date': return <td key={key} className={cell}>{fmtDate(r.po_date)}</td>;
        case 'po': return <td key={key} className="py-2.5 px-2 whitespace-nowrap"><span className="text-blue-500 hover:underline font-medium">{r.purchase_order_number}</span></td>;
        case 'reference': return <td key={key} className={cell}>{r.pr_number || ''}</td>;
        case 'vendor': return <td key={key} className={cell}>{r.vendor_name || r.vendor_code || 'Unknown Vendor'}</td>;
        case 'quantity': return <td key={key} className={cell}>{r.total_quantity ?? '—'}</td>;
        case 'amount': return <td key={key} className={cell}>{inr(r.estimated_total)}</td>;
        case 'status': return <td key={key} className="py-2.5 px-2"><span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-medium ${statusColors[String(r.delivery_status || '').toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>{r.delivery_status}</span></td>;
        case 'billed': return <td key={key} className={cell}>{r.billed_status || '---'}</td>;
        case 'deliveryDate': return <td key={key} className={cell}>{fmtDate(r.delivery_date) || '—'}</td>;
        default: return null;
      }
    }
    // Procurement
    switch (key) {
      case 'date': return <td key={key} className={cell}>{r.date}</td>;
      case 'prNo': return <td key={key} className="py-3 px-2 whitespace-nowrap"><span className="text-blue-500 hover:underline font-medium">{r.prNo}</span></td>;
      case 'vendor': return <td key={key} className={cell}>{r.vendorName}</td>;
      case 'material': return <td key={key} className={cell}>{r.material}</td>;
      case 'quantity': return <td key={key} className={cell}>{r.quantity}</td>;
      case 'amount': return <td key={key} className={cell}>{r.amount}</td>;
      case 'status': return <td key={key} className="py-3 px-2"><span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-medium ${statusColors[String(r.status || '').toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>;
      default: return null;
    }
  };

  const rowClick = (r) => {
    if (activeTab === 'Bills') navigate(`/purchase/bill/${r.bill_id}`);
    else if (activeTab === 'Purchase Order') navigate(`/purchase/order/${r.purchase_order_id}`);
    else navigate('/purchase/procurement/1');
  };

  const defaultTitle =
    activeTab === 'Procurement'
      ? 'Procurement'
      : `All ${activeTab}${activeTab === 'Purchase Order' || activeTab === 'Payment' ? 's' : ''}`;

  const headerTitle = isConfigTab && statusFilter ? statusFilter : defaultTitle;

  return (
    <main className="flex-1 overflow-y-auto bg-[#f4f7f9] flex flex-col relative p-1.5 gap-1.5">

      {/* Sub Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm shrink-0 px-8">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-4 py-2 text-[13px] border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                  ? 'text-[#1a233a] font-bold border-[#1a233a]'
                  : 'text-gray-500 font-medium border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm shrink-0 px-8 py-3 flex items-center justify-between">
        <div className="relative">
          <button
            type="button"
            onClick={() => isConfigTab && setMenuOpen((o) => !o)}
            className="flex items-center gap-1"
          >
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent">
              {headerTitle}
            </h2>
            <ChevronDown className={`w-5 h-5 text-[#8b5cf6] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && isConfigTab && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-2 z-50 w-60 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                {CONFIG[activeTab].filters.map((f) => {
                  const selected =
                    statusFilter === f ||
                    (activeTab === 'Procurement' && !statusFilter && f === 'Purchase Requisition');
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, [activeTab]: statusFilter === f ? '' : f }));
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[13px] text-[#1a233a] ${selected ? 'bg-gradient-to-r from-[#fdf0ee] to-[#eeecfd]' : 'hover:bg-gray-50'
                        }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (activeTab === 'Expenses') navigate('/purchase/expense/new');
              else if (activeTab === 'Bills') navigate('/purchase/bill/new');
              else if (activeTab === 'Procurement') navigate('/purchase/procurement/new');
              else navigate('/purchase/new');
            }}
            className="bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] hover:opacity-90 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center transition-opacity shadow-sm"
          >
            <Plus className="w-3 h-3 mr-1" strokeWidth={2.5} />
            New
          </button>
          <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors">
            <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col shrink-0">
        <div className="overflow-x-auto w-full">

          {/* ---------- Expenses (unchanged) ---------- */}
          {activeTab === 'Expenses' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fc] border-b border-gray-100 text-[13px]">
                  <th className="py-2.5 pl-4 pr-3 w-16 text-center">
                    <input type="checkbox" className="rounded border-gray-300 w-3.5 h-3.5" onChange={() => { }} />
                  </th>
                  {['Date', 'Expenses Account', 'Reference#', 'Vendor Name', 'Paid Through', 'Customer Name', 'Status', 'Amount'].map((h) => (
                    <th key={h} className="py-2.5 px-2 font-bold text-[#6b778c] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => e.expensesAccount === 'Job Costing' && navigate('/purchase/expense/1')}
                    className="border-b border-gray-100 hover:bg-gray-50/50 text-[13px] cursor-pointer"
                  >
                    <td className="py-2.5 pl-4 pr-3 text-center" onClick={(ev) => ev.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => toggleSelect(e.id)} className="rounded border-gray-300 w-3.5 h-3.5" />
                    </td>
                    <td className="py-2.5 px-2 font-medium">{e.date}</td>
                    <td className="py-2.5 px-2"><span className="text-blue-500 font-medium">{e.expensesAccount}</span></td>
                    <td className="py-2.5 px-2 font-medium">{e.reference}</td>
                    <td className="py-2.5 px-2 font-medium">{e.vendorName}</td>
                    <td className="py-2.5 px-2 font-medium">{e.paidThrough}</td>
                    <td className="py-2.5 px-2 font-medium">{e.customerName}</td>
                    <td className="py-2.5 px-2 font-medium">{e.status}</td>
                    <td className="py-2.5 px-2 font-medium">{e.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ---------- Bills / Purchase Order / Procurement ---------- */}
          {isConfigTab && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fc] border-b border-gray-100 text-[13px]">
                  <th className="py-2.5 pl-4 pr-3 w-24">
                    <div className="flex items-center gap-3">
                      <button
                        ref={btnRef}
                        type="button"
                        onClick={openPanel}
                        title="Manage columns"
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </div>
                  </th>
                  {visibleColumns.map((col) => (
                    <th key={col.key} className="py-2.5 px-2 font-bold text-[#6b778c] whitespace-nowrap">
                      {col.key === 'status' ? (
                        <div className="flex items-center gap-1">
                          Status <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        labelOf(activeTab, col.key)
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => (
                  <tr
                    key={getId(r)}
                    onClick={() => rowClick(r)}
                    className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-[13px] cursor-pointer ${selectedIds.includes(getId(r)) ? 'bg-blue-50/50' : 'bg-white'
                      }`}
                  >
                    <td className="py-2.5 pl-4 pr-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <span className="w-4" />
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(getId(r))}
                          onChange={() => toggleSelect(getId(r))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </div>
                    </td>
                    {visibleColumns.map((col) => renderCell(col.key, r))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {isConfigTab && pagedRows.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-[14px]">
                {activeTab === 'Procurement' && statusFilter && statusFilter !== 'Purchase Requisition'
                  ? `${statusFilter} is not available yet`
                  : `No ${CONFIG[activeTab].noun.replace('(s)', 's')} found${statusFilter ? ` for "${statusFilter}"` : ''}`}
              </p>
            </div>
          )}

          {activeTab === 'Payment' && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-[14px]">No payments found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {isConfigTab && totalRecords > 0 && (
          <div className="flex items-center justify-between px-6 py-2 border-t border-gray-200 bg-white shrink-0">
            <div className="text-[13px] text-gray-500">
              Showing {pagedRows.length} of {totalRecords} {CONFIG[activeTab].noun}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => page > 1 && setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-[13px] border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-[13px] text-gray-600 whitespace-nowrap">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => page < totalPages && setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-[13px] border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manage Column popover */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPanelOpen(false)} />
          <div
            className="fixed z-50 w-[250px] bg-white rounded-xl shadow-xl border border-gray-100 p-3"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-medium text-[#1a233a]">Manage Column</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[12px] font-bold bg-gradient-to-r from-[#ff7a59] to-[#402de8] bg-clip-text text-transparent"
              >
                Reset
              </button>
            </div>

            <div className="space-y-1.5">
              {draft.map((col, index) => (
                <div
                  key={col.key}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-gradient-to-r from-[#fdf0ee] to-[#f1effd] cursor-grab"
                >
                  <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => toggleDraft(col.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[12px] text-[#1a233a]">{labelOf(activeTab, col.key)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="px-4 py-1 text-[12px] border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-1 text-[12px] font-bold text-white rounded-md bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8]"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default PurchasePage;