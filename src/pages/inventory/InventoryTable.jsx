import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Loader2, SlidersHorizontal, GripVertical } from 'lucide-react';
import { getInventoryItems } from '../../services/inventoryItemListApi';

const ALL_COLUMNS = [
  { key: 'itemName', label: 'Item Name' },
  { key: 'availableFull', label: 'Available Full' },
  { key: 'fullWeight', label: 'Full Weight' },
  { key: 'availablePartial', label: 'Available Partial' },
  { key: 'partialWeight', label: 'Partial Weight' },
  { key: 'availableWeight', label: 'Available Weight' },
  { key: 'value', label: 'Value' },
  { key: 'lastModifiedBy', label: 'Last Modified By' },
  { key: 'lastModifiedTime', label: 'Last Modified Time' },
];

const DEFAULT_COLUMNS = ALL_COLUMNS.map((c) => ({
  key: c.key,
  visible: c.key !== 'availableWeight',
}));

const STORAGE_KEY = 'inventoryTableColumns';

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
const normalize = (s) => String(s || '').toLowerCase().replace(/[\s_-]+/g, '');

const InventoryTable = ({ selectedCategory = '' }) => {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const [expandedRows, setExpandedRows] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [columns, setColumns] = useState(loadColumns);
  const [draft, setDraft] = useState(columns);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [dragIndex, setDragIndex] = useState(null);

  const visibleColumns = columns.filter((c) => c.visible);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await getInventoryItems();
        if (response.success) setItems(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedCategory]);

  // Change the field names here if your API uses different ones
  const matchesCategory = (item) => {
    if (!selectedCategory) return true;
    if (selectedCategory === 'Low Stock Item') {
      const stock = Number(item.openingStock || 0);
      const reorder = Number(item.reorderLevel || 0);
      return reorder > 0 && stock <= reorder;
    }
    const cat = item.category ?? item.itemCategory ?? item.itemType ?? item.itemGroup;
    return normalize(cat) === normalize(selectedCategory);
  };

  const visibleItems = items.filter(matchesCategory);

  const allSelected =
    visibleItems.length > 0 &&
    visibleItems.every((i) => selectedIds.includes(i.invItemId));

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !visibleItems.some((i) => i.invItemId === id))
        : [...new Set([...prev, ...visibleItems.map((i) => i.invItemId)])]
    );

  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleRow = (id) =>
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-red-500 font-medium">
        Error loading items: {error}
      </div>
    );
  }

  const cell = 'py-3 px-6 text-[#1a233a] font-medium whitespace-nowrap';

  return (
    <div className="flex-1 overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f4f6f8] border-b border-gray-200 text-[13px]">
            <th className="py-3 pl-4 pr-2 w-[72px]">
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
                  className="rounded border-gray-300 text-blue-600 cursor-pointer"
                />
              </div>
            </th>
            {visibleColumns.map((col) => (
              <th key={col.key} className="py-3 px-6 font-bold text-[#6b778c] whitespace-nowrap">
                {labelOf(col.key)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {visibleItems.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length + 1} className="py-8 text-center text-gray-500">
                No inventory items found{selectedCategory ? ` in "${selectedCategory}"` : ''}.
              </td>
            </tr>
          ) : (
            visibleItems.map((item) => {
              const isExpanded = expandedRows.includes(item.invItemId);

              let itemValue = '0.00';
              if (item.openingStock && item.openingStockRate) {
                itemValue = (Number(item.openingStock) * Number(item.openingStockRate)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              } else if (item.purPrice) {
                itemValue = Number(item.purPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }

              const weight = `${Number(item.openingStock || 0)} ${item.unit || ''}`;
              const pres = {
                id: item.invItemId,
                itemName: `${item.itemName} (${item.itemCode})`,
                availableFull: '-',
                fullWeight: '-',
                availablePartial: '-',
                partialWeight: '-',
                availableWeight: weight,
                value: itemValue,
                breakdown: [
                  { id: `${item.invItemId}-1`, plant: 'Bangalore', availableFull: '-', availablePartial: '-', availableWeight: weight, value: itemValue },
                ],
              };

              return (
                <React.Fragment key={pres.id}>
                  <tr
                    className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-[13px] ${
                      selectedIds.includes(pres.id) ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="py-3 pl-4 pr-2 w-[72px]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleRow(pres.id)}
                          className="w-4 h-4 shrink-0 text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(pres.id)}
                          onChange={() => toggleSelect(pres.id)}
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </div>
                    </td>

                    {visibleColumns.map((col) => {
                      switch (col.key) {
                        case 'itemName':
                          return (
                            <td
                              key={col.key}
                              className={`${cell} text-blue-500 cursor-pointer hover:underline`}
                              onClick={() => navigate(`/inventory/${pres.id}`)}
                            >
                              {pres.itemName}
                            </td>
                          );
                        case 'lastModifiedBy':
                        case 'lastModifiedTime':
                          return <td key={col.key} className={cell}>-</td>;
                        default:
                          return <td key={col.key} className={cell}>{pres[col.key]}</td>;
                      }
                    })}
                  </tr>

                  {isExpanded && (
                    <tr className="bg-white">
                      <td colSpan={visibleColumns.length + 1} className="px-8 py-4 border-b border-gray-100">
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-white px-5 py-4 border-b border-gray-200">
                            <h4 className="text-[14px] font-bold text-gray-500">Plant-Wise Breakdown</h4>
                          </div>
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-[#f9fafb] text-[12px] border-b border-gray-100">
                                {['Plant', 'Available Full', 'Available Partial', 'Available Weight', 'Value'].map((h) => (
                                  <th key={h} className="py-3 px-6 font-bold text-[#6b778c] w-[20%]">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {pres.breakdown.map((p) => (
                                <tr key={p.id} className="text-[13px]">
                                  <td className="py-4 px-6 text-[#1a233a] font-medium">{p.plant}</td>
                                  <td className="py-4 px-6 text-[#1a233a] font-medium">{p.availableFull}</td>
                                  <td className="py-4 px-6 text-[#1a233a] font-medium">{p.availablePartial}</td>
                                  <td className="py-4 px-6 text-[#1a233a] font-medium">{p.availableWeight}</td>
                                  <td className="py-4 px-6 text-[#1a233a] font-medium">{p.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
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

export default InventoryTable;