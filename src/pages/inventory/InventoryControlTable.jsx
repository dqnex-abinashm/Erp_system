import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, GripVertical } from 'lucide-react';
import { getInventoryControls } from '../../services/inventoryControlListApi';

const ALL_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'reason', label: 'Reason' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'referenceNumber', label: 'Reference Number' },
  { key: 'type', label: 'Type' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'createdTime', label: 'Created Time' },
  { key: 'lastModifiedBy', label: 'Last Modified By' },
  { key: 'lastModifiedTime', label: 'Last Modified Time' },
];

// Design: Type unchecked by default
const DEFAULT_COLUMNS = ALL_COLUMNS.map((c) => ({
  key: c.key,
  visible: c.key !== 'type',
}));

const STORAGE_KEY = 'inventoryControlTableColumns';

const loadColumns = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (
      Array.isArray(saved) &&
      saved.length === ALL_COLUMNS.length &&
      saved.every((s) => ALL_COLUMNS.some((c) => c.key === s.key))
    ) {
      return saved;
    }
  } catch {
    /* use defaults */
  }
  return DEFAULT_COLUMNS;
};

const labelOf = (key) => ALL_COLUMNS.find((c) => c.key === key)?.label || key;
const normalize = (s) => String(s || '').toLowerCase().replace(/[\s_/-]+/g, '');

const InventoryControlTable = ({ selectedType = '' }) => {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const [columns, setColumns] = useState(loadColumns);
  const [draft, setDraft] = useState(columns);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [dragIndex, setDragIndex] = useState(null);

  const visibleColumns = columns.filter((c) => c.visible);

  useEffect(() => {
    const fetchControls = async () => {
      try {
        const response = await getInventoryControls();
        setControls(response.data || []);
      } catch (error) {
        console.error('Failed to fetch inventory controls', error);
      } finally {
        setLoading(false);
      }
    };
    fetchControls();
  }, []);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedType]);

  // Matches the item's "type" field against the dropdown choice.
  // e.g. "Inventory Adjustment" matches "Stock Adjustment" via the last word.
  const matchesType = (item) => {
    if (!selectedType) return true;
    const t = normalize(item.type);
    const s = normalize(selectedType);
    if (t === s) return true;
    const key = selectedType.split(' ').pop().toLowerCase(); // adjustment, transfer, count...
    return t.includes(normalize(key));
  };

  const visibleRows = controls.filter(matchesType);

  // ---------- Select all ----------
  const allSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selectedIds.includes(r.id));

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !visibleRows.some((r) => r.id === id))
        : [...new Set([...prev, ...visibleRows.map((r) => r.id)])]
    );

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // ---------- Manage Column ----------
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
    setColumns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPanelOpen(false);
  };

  const handleReset = () => setDraft(DEFAULT_COLUMNS);

  const cell = 'py-2 px-4 text-[#1a233a] font-medium whitespace-nowrap';

  const renderCell = (key, item) => {
    switch (key) {
      case 'date':
        return (
          <td key={key} className={cell}>
            {new Date(item.date || item.createdAt).toLocaleDateString()}
          </td>
        );
      case 'reason':
        return (
          <td
            key={key}
            className="py-2 px-4 text-blue-500 font-medium cursor-pointer hover:underline whitespace-nowrap"
            onClick={() => navigate(`/inventory/control/${item.id}`)}
          >
            {item.reason}
          </td>
        );
      case 'description':
        return (
          <td key={key} className="py-2 px-4 text-[#1a233a] font-medium leading-relaxed min-w-[300px]">
            {item.description || '-'}
          </td>
        );
      case 'status':
        return (
          <td key={key} className="py-2 px-4 whitespace-nowrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {item.status}
            </span>
          </td>
        );
      case 'referenceNumber':
        return <td key={key} className={cell}>{item.referenceNumber}</td>;
      case 'type':
        return <td key={key} className={cell}>{item.type}</td>;
      case 'createdBy':
        return <td key={key} className={cell}>Admin</td>;
      case 'createdTime':
        return (
          <td key={key} className={cell}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </td>
        );
      case 'lastModifiedBy':
      case 'lastModifiedTime':
        return <td key={key} className={cell}>-</td>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 text-sm">Loading data...</div>;
  }

  return (
    <div className="flex-1 overflow-x-auto w-full">
      <table className="w-full text-left border-collapse min-w-[1200px]">
        <thead>
          <tr className="bg-[#f9fafb] border-b border-gray-200 text-[13px]">
            <th className="py-2 pl-4 pr-2 w-[72px]">
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
            {visibleColumns.map((col) => (
              <th key={col.key} className="py-2 px-4 font-bold text-[#6b778c] whitespace-nowrap">
                {labelOf(col.key)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length + 1} className="py-8 text-center text-gray-500 text-sm">
                No inventory controls found{selectedType ? ` for "${selectedType}"` : ''}.
              </td>
            </tr>
          ) : (
            visibleRows.map((item) => (
              <tr
                key={item.id}
                className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-[13px] ${
                  selectedIds.includes(item.id) ? 'bg-blue-50/50' : ''
                }`}
              >
                <td className="py-2 pl-4 pr-2 w-[72px]">
                  <div className="flex items-center gap-3">
                    <span className="w-4 shrink-0" />
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </td>
                {visibleColumns.map((col) => renderCell(col.key, item))}
              </tr>
            ))
          )}
        </tbody>
      </table>

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
    </div>
  );
};

export default InventoryControlTable;