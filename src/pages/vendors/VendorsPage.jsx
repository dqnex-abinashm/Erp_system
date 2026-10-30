import React, { useState, useEffect, useRef } from 'react';
import { Plus, MoreHorizontal, ChevronDown, SlidersHorizontal, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getVendors } from '../../services/vendorlistApi';

const STATUS_FILTERS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'On Hold', value: 'ON_HOLD' },
];

const ALL_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'gst', label: 'GST' },
  { key: 'contact', label: 'Primary Contact' },
  { key: 'company', label: 'Company Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'payables', label: 'Payables(BCY)' },
  { key: 'status', label: 'Status' },
];

// Design: Phone Number unchecked by default
const DEFAULT_COLUMNS = ALL_COLUMNS.map((c) => ({
  key: c.key,
  visible: c.key !== 'phone',
}));

const STORAGE_KEY = 'vendorTableColumns';

const loadColumns = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const valid =
      Array.isArray(saved) &&
      saved.length === ALL_COLUMNS.length &&
      saved.every((s) => ALL_COLUMNS.some((c) => c.key === s.key));
    if (valid) return saved;
  } catch (e) {
    /* ignore */
  }
  return DEFAULT_COLUMNS;
};

const labelOf = (key) => ALL_COLUMNS.find((c) => c.key === key)?.label || key;

const statusLabel = (s) =>
  STATUS_FILTERS.find((f) => f.value === String(s || '').toUpperCase())?.label || s || '—';

const statusStyle = (s) => {
  switch (String(s || '').toUpperCase()) {
    case 'ACTIVE':
      return 'bg-[#dcfce7] text-[#16a34a]';
    case 'INACTIVE':
      return 'bg-[#fee2e2] text-[#ef4444]';
    case 'ON_HOLD':
      return 'bg-[#ffedd5] text-[#c2410c]';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

const VendorsPage = () => {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  });

  const [statusFilter, setStatusFilter] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [columns, setColumns] = useState(loadColumns);
  const [draft, setDraft] = useState(columns);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [dragIndex, setDragIndex] = useState(null);

  // Filter change: back to page 1
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [statusFilter]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await getVendors({ page, limit, status: statusFilter });
        setVendors(response.data || []);
        setPagination(
          response.pagination || { page, limit, totalRecords: 0, totalPages: 0 }
        );
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [page, limit, statusFilter]);

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };
  const handleNextPage = () => {
    if (page < pagination.totalPages) setPage(page + 1);
  };

  const getId = (v) => v.vendorId || v.id;

  // ---------- Select all (current page) ----------
  const pageIds = vendors.map(getId);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])]
    );

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // ---------- Manage Column ----------
  const visibleColumns = columns.filter((c) => c.visible);

  const openPanel = () => {
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left });
    setDraft(columns);
    setPanelOpen(true);
  };

  const toggleDraft = (key) =>
    setDraft((prev) =>
      prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );

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
    setColumns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPanelOpen(false);
  };

  const handleReset = () => setDraft(DEFAULT_COLUMNS);

  const cell = 'px-4 py-2 text-[13px] text-[#1a233a] font-medium';

  const renderCell = (key, vendor) => {
    switch (key) {
      case 'name':
        return (
          <td
            key={key}
            onClick={() => navigate(`/vendors/${getId(vendor)}`)}
            className="px-4 py-2.5 text-[13px] text-blue-600 font-medium cursor-pointer hover:underline"
          >
            {vendor.displayName || vendor.name || '-'}
          </td>
        );
      case 'gst':
        return <td key={key} className={cell}>{vendor.gstin || vendor.gst || '-'}</td>;
      case 'contact':
        return <td key={key} className={cell}>{vendor.primaryContact || '-'}</td>;
      case 'company':
        return <td key={key} className={cell}>{vendor.companyName || '-'}</td>;
      case 'email':
        return <td key={key} className={cell}>{vendor.email || '-'}</td>;
      case 'phone':
        return <td key={key} className={cell}>{vendor.phone || '-'}</td>;
      case 'payables':
        return (
          <td key={key} className={cell}>
            {vendor.payable !== undefined
              ? `₹${Number(vendor.payable).toFixed(2)}`
              : vendor.payables || '₹0.00'}
          </td>
        );
      case 'status':
        return (
          <td key={key} className="px-4 py-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${statusStyle(vendor.status)}`}>
              {statusLabel(vendor.status)}
            </span>
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 min-h-0 h-full overflow-hidden bg-[#f4f7f9] flex flex-col relative p-1.5 gap-1.5">

      {/* Page Toolbar */}
      <div className="flex items-center justify-between px-8 py-3 bg-white border border-gray-200 rounded-xl shadow-sm shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center space-x-1"
          >
            <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8]">
              {STATUS_FILTERS.find((f) => f.value === statusFilter)?.label || 'All Vendors'}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-[#8b5cf6] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-2 z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(statusFilter === f.value ? '' : f.value);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] text-[#1a233a] ${
                      statusFilter === f.value
                        ? 'bg-gradient-to-r from-[#fdf0ee] to-[#eeecfd]'
                        : 'hover:bg-gray-50'
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
          <button
            onClick={() => navigate('/vendors/new')}
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

      {/* Table Area */}
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${
          vendors.length === limit ? 'flex-1 min-h-0' : 'shrink-0'
        }`}
      >
        <div className="overflow-x-auto overflow-y-hidden w-full flex-1 min-h-0">
          <table className="w-full text-left border-collapse whitespace-nowrap table-auto">
            <thead>
              <tr className="h-12 bg-[#f8f9fa] border-b border-gray-200">
                <th className="px-4 py-2 w-24">
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </th>
                {visibleColumns.map((col) => (
                  <th key={col.key} className="px-4 py-2 text-[13px] font-bold text-[#6b778c]">
                    {labelOf(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-4 py-8 text-center text-gray-500">
                    Loading vendors...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-4 py-8 text-center text-gray-500">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor, idx) => (
                  <tr
                    key={getId(vendor)}
                    className={`h-[48px] border-b border-gray-100 transition-colors ${
                      selectedIds.includes(getId(vendor))
                        ? 'bg-blue-50/50'
                        : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-[#fcfcfc]'
                    } hover:bg-gray-50`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="w-4" />
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(getId(vendor))}
                          onChange={() => toggleSelect(getId(vendor))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </td>
                    {visibleColumns.map((col) => renderCell(col.key, vendor))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-6 py-2 border-t border-gray-200 bg-white text-sm shrink-0">
          <div className="text-sm text-[#64748b]">
            Showing {vendors.length} of {pagination.totalRecords || 0} vendor(s)
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={page === 1}
                className="px-4 py-1.5 border border-gray-200 rounded-md text-sm text-[#64748b] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-[#334155] whitespace-nowrap">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={page >= pagination.totalPages}
                className="px-4 py-1.5 border border-gray-300 rounded-md text-sm text-[#334155] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
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
                  <span className="text-[12px] text-[#1a233a]">{labelOf(col.key)}</span>
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

export default VendorsPage;