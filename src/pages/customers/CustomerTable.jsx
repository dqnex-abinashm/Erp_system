import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, SlidersHorizontal, GripVertical } from 'lucide-react';

const ALL_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'gst', label: 'GST' },
  { key: 'contact', label: 'Primary Contact' },
  { key: 'email', label: 'E-Mail' },
  { key: 'phone', label: 'Phone' },
  { key: 'receivable', label: 'Receivable' },
  { key: 'status', label: 'Status' },
];

const DEFAULT_COLUMNS = ALL_COLUMNS.map((c) => ({
  key: c.key,
  visible: c.key !== 'receivable',
}));

const STORAGE_KEY = 'customerTableColumns';

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

const CustomerTable = ({
  customers,
  selectedIds,
  onToggleSelectAll,
  onToggleSelect,
  searchQuery,
  fill = false,
}) => {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const [columns, setColumns] = useState(loadColumns);
  const [draft, setDraft] = useState(columns);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [dragIndex, setDragIndex] = useState(null);

  const allSelected =
    customers.length > 0 && selectedIds.length === customers.length;

  const visibleColumns = columns.filter((c) => c.visible);

  // ---------- Manage Column popover ----------
  const openPanel = () => {
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left });
    setDraft(columns);
    setOpen(true);
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
    // keep at least one column visible
    const next = draft.some((c) => c.visible) ? draft : columns;
    setColumns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setOpen(false);
  };

  const handleReset = () => setDraft(DEFAULT_COLUMNS);

  // ---------- Cells ----------
  const renderCell = (key, c) => {
    switch (key) {
      case 'name':
        return (
          <td key={key} className="py-3 px-4 text-blue-600 font-medium hover:underline whitespace-nowrap">
            {c.displayName || '—'}
          </td>
        );
      case 'gst':
        return (
          <td key={key} className="py-3 px-4 text-[#1a233a] font-medium whitespace-nowrap">
            {c.gstin || '—'}
          </td>
        );
      case 'contact':
        return (
          <td key={key} className="py-3 px-4 text-[#1a233a] font-medium whitespace-nowrap">
            {c.primaryContact || '—'}
          </td>
        );
      case 'email':
        return (
          <td key={key} className="py-3 px-4 text-[#1a233a] font-medium whitespace-nowrap">
            {c.email || '—'}
          </td>
        );
      case 'phone':
        return (
          <td key={key} className="py-3 px-4 text-[#1a233a] font-medium whitespace-nowrap">
            {c.phone || '—'}
          </td>
        );
      case 'receivable':
        return (
          <td key={key} className="py-3 px-4 text-[#1a233a] font-medium whitespace-nowrap">
            {Number(c.receivable || 0).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </td>
        );
      case 'status':
        return (
          <td key={key} className="py-3 px-4 text-[#1a233a] font-medium whitespace-nowrap">
            {c.status === 'ACTIVE' ? (
              <span className="bg-[#dcfce7] text-[#10b981] px-2 py-0.5 rounded-full font-medium text-[11px]">Active</span>
            ) : (
              <span className="bg-[#fee2e2] text-[#ef4444] px-2 py-0.5 rounded-full font-medium text-[11px]">Inactive</span>
            )}
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`w-full overflow-x-auto ${fill ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
      <div className={`w-full ${fill ? 'h-full' : ''}`}>
        <table className={`w-full text-left border-collapse ${fill ? 'h-full' : ''}`}>
          <thead>
            <tr className="bg-[#f4f6f8] border-b border-gray-200 text-sm">
              <th className="py-3 pl-4 pr-4 font-bold text-[#6b778c] w-24">
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                  />
                </div>
              </th>

              {visibleColumns.map((col) => (
                <th key={col.key} className="py-3 px-4 font-bold text-[#6b778c] whitespace-nowrap">
                  {col.key === 'status' ? (
                    <div className="flex items-center gap-1 cursor-pointer">
                      Status <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    labelOf(col.key)
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <tr
                  key={customer.customerId}
                  onClick={() => navigate(`/customers/${customer.customerId}`)}
                  className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-[13px] cursor-pointer ${selectedIds.includes(customer.customerId) ? 'bg-blue-50/50' : ''
                    }`}
                >
                  <td className="py-3 pl-4 pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      <span className="w-4" />
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        checked={selectedIds.includes(customer.customerId)}
                        onChange={() => onToggleSelect(customer.customerId)}
                      />
                    </div>
                  </td>
                  {visibleColumns.map((col) => renderCell(col.key, customer))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="py-8 text-center text-gray-500 text-[13px]">
                  No customers found {searchQuery ? `matching "${searchQuery}"` : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Manage Column popover ---------- */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
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
                onClick={() => setOpen(false)}
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
    </div>
  );
};

export default CustomerTable;