import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, Filter, MoreHorizontal, ChevronDown, Edit,
  SlidersHorizontal, GripVertical,
} from 'lucide-react';
import { getManufacturingOrderList } from '../../services/manufacturingOrderListApi';

const tabs = ['Manufacturing Order', 'Job Cards'];

const corrugatorJobData = [
  { id: 'JC-001', jobCardNo: 'CJC-2026-0912', jobCardType: 'Corrugator Job Card', reference: 'REF-000001', startDate: '25/07/2025', endDate: '28/07/2025', time: '13.56', status: 'Released' },
  { id: 'JC-002', jobCardNo: 'DJC-2026-1548', jobCardType: 'Downstream Job Card', reference: 'REF-000022', startDate: '27/07/2025', endDate: '29/07/2025', time: '15.56', status: 'Pending' },
  { id: 'JC-003', jobCardNo: 'QC-2026-2210', jobCardType: 'QC Inspection Card', reference: 'REF-000002', startDate: '28/07/2025', endDate: '31/07/2025', time: '14.26', status: 'Released' },
];

// ---------- Per-tab configuration ----------
const CONFIG = {
  'Manufacturing Order': {
    title: 'All Manufacturing Orders',
    storage: 'productionMoColumns',
    columns: [
      { key: 'quoteNo', label: 'Quote No' },
      { key: 'moNumber', label: 'Manufacturing Order' },
      { key: 'salesOrder', label: 'Sales Order' },
      { key: 'customer', label: 'Customer' },
      { key: 'order', label: 'Order' },
      { key: 'quantity', label: 'Quantity', hidden: true },
      { key: 'estimateTime', label: 'Estimate Time' },
      { key: 'priority', label: 'Priority' },
      { key: 'dispatchDate', label: 'Dispatch Date' },
      { key: 'status', label: 'Status' },
    ],
    // value = status sent to the backend
    filters: [
      { label: 'Draft', value: 'DRAFT' },
      { label: 'Planned', value: 'PLANNED' },
      { label: 'In Production', value: 'IN_PROGRESS' },
      { label: 'On Hold', value: 'ON_HOLD' },
      { label: 'Completed', value: 'COMPLETED' },
      { label: 'Cancelled', value: 'CANCELLED' },
    ],
  },
  'Job Cards': {
    title: 'All Job Cards',
    storage: 'productionJobColumns',
    columns: [
      { key: 'jobCardNo', label: 'Job Card No' },
      { key: 'jobCardType', label: 'Job Card Type' },
      { key: 'reference', label: 'Reference No' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'endDate', label: 'End Date' },
      { key: 'time', label: 'Estimate Time', hidden: true },
      { key: 'status', label: 'Status' },
      { key: 'progress', label: 'Progress' },
      { key: 'action', label: 'Action' },
    ],
    filters: ['Pending', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].map((l) => ({ label: l, value: l })),
  },
};

const defaultColumns = (tab) =>
  CONFIG[tab].columns.map((c) => ({ key: c.key, visible: !c.hidden }));

const loadColumns = (tab) => {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG[tab].storage));
    const keys = CONFIG[tab].columns.map((c) => c.key);
    if (Array.isArray(saved) && saved.length === keys.length && saved.every((s) => keys.includes(s.key))) {
      return saved;
    }
  } catch {
    /* use defaults */
  }
  return defaultColumns(tab);
};

const labelOf = (tab, key) => CONFIG[tab].columns.find((c) => c.key === key)?.label || key;
const normalize = (s) => String(s || '').toLowerCase().replace(/[\s_-]+/g, '');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

const moStatusStyle = (s) => {
  switch (String(s || '').toUpperCase()) {
    case 'COMPLETED': return 'bg-[#dcfce7] text-[#16a34a]';
    case 'CANCELLED': return 'bg-[#fee2e2] text-[#ef4444]';
    case 'IN_PROGRESS':
    case 'RELEASED': return 'bg-[#dbeafe] text-[#2563eb]';
    case 'PLANNED': return 'bg-[#ede9fe] text-[#7c3aed]';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const moStatusLabel = (s) =>
  ({ DRAFT: 'Draft', PLANNED: 'Planned', RELEASED: 'Released', IN_PROGRESS: 'In Production', COMPLETED: 'Completed', CANCELLED: 'Cancelled', ON_HOLD: 'On Hold' }[String(s || '').toUpperCase()] || s || '—');

const ProductionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const btnRef = useRef(null);

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'Manufacturing Order');
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  const [mfgOrdersData, setMfgOrdersData] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  const [columnsByTab, setColumnsByTab] = useState(() => ({
    'Manufacturing Order': loadColumns('Manufacturing Order'),
    'Job Cards': loadColumns('Job Cards'),
  }));
  const [draft, setDraft] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [dragIndex, setDragIndex] = useState(null);

  const cfg = CONFIG[activeTab];
  const activeFilter = filters[activeTab] || ''; // stored as the filter "value"
  const activeFilterLabel = cfg.filters.find((f) => f.value === activeFilter)?.label || '';

  // Tab change: reset selection and menu
  useEffect(() => {
    setSelectedIds([]);
    setMenuOpen(false);
  }, [activeTab]);

  // ---------- Manufacturing orders (server-side paging + status filter) ----------
  const moStatus = filters['Manufacturing Order'] || '';

  useEffect(() => {
    if (activeTab !== 'Manufacturing Order') return;

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoadingOrders(true);
        setOrdersError('');

        const result = await getManufacturingOrderList({
          status: moStatus,
          limit: rowsPerPage,
          offset: (currentPage - 1) * rowsPerPage,
          signal: controller.signal,
        });

        setMfgOrdersData(Array.isArray(result.data) ? result.data : []);
        setTotalOrders(Number(result.total) || 0);
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Failed to load manufacturing orders:', error);
        setOrdersError(error.message || 'Unable to load manufacturing orders.');
        setMfgOrdersData([]);
        setTotalOrders(0);
      } finally {
        if (!controller.signal.aborted) setLoadingOrders(false);
      }
    };

    load();
    return () => controller.abort();
  }, [activeTab, currentPage, rowsPerPage, moStatus]);

  const getManufacturingOrderRow = (order) => {
    const firstItem = order.items?.[0] || order.product_specification || {};
    const customer = order.customer || {};

    const customerName =
      customer.display_name || customer.customer_name || customer.company_name ||
      customer.organization_name || customer.name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
      order.customer_code || '—';

    const ply = firstItem.ply ?? firstItem.ply_type ?? firstItem.Ply_Type;
    const length = firstItem.length ?? firstItem.board_length_cm;
    const width = firstItem.width ?? firstItem.board_width_cm;
    const quantity = order.item_summary?.total_quantity ?? order.total_quantity ?? 0;
    const salesOrder = order.sales_order || {};

    return {
      id: order.manufacturing_order_id,
      quoteNo: salesOrder.quote_number || salesOrder.quote_no || salesOrder.quoteNumber || '—',
      moNumber: order.manufacturing_order_number || '—',
      salesOrder: order.sales_order_number || salesOrder.sales_order_number || '—',
      customer: customerName,
      order:
        ply != null || length != null || width != null
          ? `${ply != null ? `${ply} Ply` : ''}${length != null || width != null ? '-' : ''}${length ?? ''}${length != null && width != null ? ' X ' : ''}${width ?? ''}`
          : firstItem.box_description || firstItem.box_spec || '—',
      quantity: `${Number(quantity).toLocaleString('en-IN')} Boxes`,
      estimateTime: `${Number(order.estimated_hours || 0).toLocaleString('en-IN')} Hrs`,
      priority: order.priority || '—',
      dispatchDate: fmtDate(order.expected_shipment_date),
      status: order.status,
    };
  };

  // ---------- Job cards (sample data, filtered in the browser) ----------
  const jobFilter = filters['Job Cards'] || '';
  const jobRows = jobFilter
    ? corrugatorJobData.filter((j) => normalize(j.status) === normalize(jobFilter))
    : corrugatorJobData;

  // ---------- Selection ----------
  const rows = activeTab === 'Manufacturing Order' ? mfgOrdersData : jobRows;
  const getId = (r) => (activeTab === 'Manufacturing Order' ? r.manufacturing_order_id : r.id);
  const pageIds = rows.map(getId);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]
    );
  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // ---------- Filter dropdown ----------
  const pickFilter = (value) => {
    setFilters((prev) => ({ ...prev, [activeTab]: activeFilter === value ? '' : value }));
    setCurrentPage(1);
    setSelectedIds([]);
    setMenuOpen(false);
  };

  // ---------- Manage Column ----------
  const columns = columnsByTab[activeTab];
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
    localStorage.setItem(cfg.storage, JSON.stringify(next));
    setPanelOpen(false);
  };
  const handleReset = () => setDraft(defaultColumns(activeTab));

  // ---------- Cells ----------
  const cell = 'px-4 py-2.5 text-[13px] text-[#1a233a] font-medium whitespace-nowrap';

  const renderMoCell = (key, item) => {
    switch (key) {
      case 'quoteNo': return <td key={key} className={cell}>{item.quoteNo}</td>;
      case 'moNumber':
        return <td key={key} className="px-4 py-2.5"><span className="text-[13px] text-blue-500 hover:underline font-medium whitespace-nowrap">{item.moNumber}</span></td>;
      case 'salesOrder': return <td key={key} className={cell}>{item.salesOrder}</td>;
      case 'customer': return <td key={key} className="px-4 py-2.5 text-[13px] text-[#1a233a] font-medium w-48">{item.customer}</td>;
      case 'order': return <td key={key} className={cell}>{item.order}</td>;
      case 'quantity': return <td key={key} className={cell}>{item.quantity}</td>;
      case 'estimateTime': return <td key={key} className={cell}>{item.estimateTime}</td>;
      case 'priority': return <td key={key} className={cell}>{item.priority}</td>;
      case 'dispatchDate': return <td key={key} className={cell}>{item.dispatchDate}</td>;
      case 'status':
        return (
          <td key={key} className="px-4 py-2.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${moStatusStyle(item.status)}`}>
              {moStatusLabel(item.status)}
            </span>
          </td>
        );
      default: return null;
    }
  };

  const renderJobCell = (key, item) => {
    switch (key) {
      case 'jobCardNo':
        return <td key={key} className="px-4 py-2.5"><span className="text-[13px] text-blue-500 hover:underline font-medium whitespace-nowrap">{item.jobCardNo}</span></td>;
      case 'jobCardType': return <td key={key} className={cell}>{item.jobCardType}</td>;
      case 'reference': return <td key={key} className={`${cell} uppercase`}>{item.reference}</td>;
      case 'startDate': return <td key={key} className={cell}>{item.startDate}</td>;
      case 'endDate': return <td key={key} className={cell}>{item.endDate}</td>;
      case 'time': return <td key={key} className={cell}>{item.time}</td>;
      case 'status':
        return (
          <td key={key} className="px-4 py-2.5">
            <span className={`px-2 py-0.5 rounded-full text-[12px] font-medium whitespace-nowrap ${item.status === 'Released' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#ffedd5] text-[#c2410c]'}`}>
              {item.status}
            </span>
          </td>
        );
      case 'progress': return <td key={key} className={cell}>—</td>;
      case 'action':
        return (
          <td key={key} className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => navigate(`/production/job-card/${item.id}`)} className="text-[13px] text-blue-500 hover:underline font-medium">
              View
            </button>
          </td>
        );
      default: return null;
    }
  };

  const totalPages = Math.ceil(totalOrders / rowsPerPage);

  const headerCell = (
    <th className="w-[72px] px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          ref={btnRef}
          type="button"
          onClick={openPanel}
          title="Manage columns"
          className="w-4 h-4 shrink-0 text-gray-400 hover:text-gray-700"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>
    </th>
  );

  const rowCheckbox = (id) => (
    <td className="w-[72px] px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3">
        <span className="w-4 shrink-0" />
        <input
          type="checkbox"
          checked={selectedIds.includes(id)}
          onChange={() => toggleSelect(id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>
    </td>
  );

  return (
    <main className="flex-1 overflow-y-auto bg-[#f4f7f9] flex flex-col relative p-1.5 gap-1.5">

      {/* Sub Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm shrink-0 px-8">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-4 py-2 text-[13px] border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-black text-black font-bold'
                  : 'border-transparent text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300'
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
          <button type="button" onClick={() => setMenuOpen((o) => !o)} className="flex items-center space-x-1">
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent">
              {activeFilterLabel || cfg.title}
            </h2>
            <ChevronDown className={`w-5 h-5 text-[#8b5cf6] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-2 z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                {cfg.filters.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => pickFilter(f.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] text-[#1a233a] ${
                      activeFilter === f.value ? 'bg-gradient-to-r from-[#fdf0ee] to-[#eeecfd]' : 'hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button className="bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] hover:opacity-90 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center transition-opacity shadow-sm">
            {activeTab === 'Manufacturing Order' ? (
              <><Edit className="w-3 h-3 mr-1" strokeWidth={2.5} />Edit</>
            ) : (
              <><Plus className="w-3 h-3 mr-1" strokeWidth={2.5} />New</>
            )}
          </button>
          <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors">
            <Filter className="w-4 h-4" strokeWidth={2} />
          </button>
          <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors">
            <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">

        {activeTab === 'Manufacturing Order' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8f9fa]">
                  {headerCell}
                  {visibleColumns.map((c) => (
                    <th key={c.key} className="px-4 py-3 text-left text-[13px] font-bold text-[#6b778c] whitespace-nowrap">
                      {labelOf(activeTab, c.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingOrders ? (
                  <tr><td colSpan={visibleColumns.length + 1} className="px-4 py-8 text-center text-gray-500">Loading manufacturing orders...</td></tr>
                ) : ordersError ? (
                  <tr><td colSpan={visibleColumns.length + 1} className="px-4 py-8 text-center text-red-500">{ordersError}</td></tr>
                ) : mfgOrdersData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} className="px-4 py-8 text-center text-gray-500">
                      No manufacturing orders found{activeFilterLabel ? ` for "${activeFilterLabel}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  mfgOrdersData.map((order, idx) => {
                    const item = getManufacturingOrderRow(order);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/production/manufacturing/${item.id}`)}
                        className={`border-b border-gray-100 transition-colors cursor-pointer ${
                          selectedIds.includes(item.id) ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfcfc]'
                        }`}
                      >
                        {rowCheckbox(item.id)}
                        {visibleColumns.map((c) => renderMoCell(c.key, item))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Job Cards' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8f9fa]">
                  {headerCell}
                  {visibleColumns.map((c) => (
                    <th key={c.key} className="px-4 py-3 text-left text-[13px] font-bold text-[#6b778c] whitespace-nowrap">
                      {labelOf(activeTab, c.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} className="px-4 py-8 text-center text-gray-500">
                      No job cards found{activeFilterLabel ? ` for "${activeFilterLabel}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  jobRows.map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/production/job-card/${item.id}`)}
                      className={`border-b border-gray-100 transition-colors cursor-pointer ${
                        selectedIds.includes(item.id) ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfcfc]'
                      }`}
                    >
                      {rowCheckbox(item.id)}
                      {visibleColumns.map((c) => renderJobCell(c.key, item))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: Manufacturing Order */}
        {activeTab === 'Manufacturing Order' && !loadingOrders && !ordersError && totalOrders > 0 && (
          <div className="flex items-center justify-between px-6 py-2.5 border-t border-gray-200 bg-white shrink-0">
            <div className="text-[13px] text-gray-500">
              Showing {mfgOrdersData.length} of {totalOrders} manufacturing order(s)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-[13px] border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-[13px] text-gray-600 whitespace-nowrap">Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-[13px] border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer: Job Cards */}
        {activeTab === 'Job Cards' && jobRows.length > 0 && (
          <div className="flex items-center justify-between px-6 py-2.5 border-t border-gray-200 bg-white shrink-0">
            <div className="text-[13px] text-gray-500">
              Showing {jobRows.length} of {jobRows.length} job card(s)
            </div>
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
                    className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5 cursor-pointer"
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

export default ProductionPage;