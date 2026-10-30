import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, SlidersHorizontal, GripVertical } from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api/v1';

const ALL_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'quoteNo', label: 'Quote Number' },
  { key: 'customer', label: 'Customer Name' },
  { key: 'boxSpec', label: 'Box Specification' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
];

const DEFAULT_COLUMNS = ALL_COLUMNS.map((c) => ({ key: c.key, visible: true }));
const STORAGE_KEY = 'quoteTableColumns';

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

// "Pending Approval", "pending_approval", "PENDING-APPROVAL" all match
const normalize = (s) =>
  String(s || '').toLowerCase().replace(/[\s_-]+/g, '');

const statusStyle = (status) => {
  switch (normalize(status)) {
    case 'accepted':
    case 'approval':
    case 'approved':
      return 'bg-[#dcfce7] text-[#16a34a]';
    case 'decline':
    case 'declined':
    case 'expired':
      return 'bg-[#fee2e2] text-[#ef4444]';
    case 'sent':
    case 'invoice':
    case 'invoiced':
      return 'bg-[#dbeafe] text-[#2563eb]';
    default:
      return 'bg-[#ffedd5] text-[#c2410c]';
  }
};

const QuotesTable = ({ statusFilter = '' }) => {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [columns, setColumns] = useState(loadColumns);
  const [draft, setDraft] = useState(columns);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_BASE_URL}/quotes`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch quotes');
        }

        setQuotes(data.success && Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error('Failed to fetch quotes:', error);
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  // Back to page 1 when the filter changes
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [statusFilter]);

  // ---------- Filter + pagination ----------
  const filteredQuotes = statusFilter
    ? quotes.filter((q) => normalize(q.status) === normalize(statusFilter)) // <- change q.status if your field is named differently
    : quotes;

  const totalRecords = filteredQuotes.length;
  const totalPages = Math.ceil(totalRecords / limit);
  const startIndex = (page - 1) * limit;
  const paginatedQuotes = filteredQuotes.slice(startIndex, startIndex + limit);
  // ---------- Select all (current page) ----------
  const pageIds = paginatedQuotes.map((q) => q.id);
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

  const handlePreviousPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  // ---------- Manage Column ----------
  const visibleColumns = columns.filter((c) => c.visible);

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
    const next = draft.some((c) => c.visible) ? draft : columns;
    setColumns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setOpen(false);
  };

  const handleReset = () => setDraft(DEFAULT_COLUMNS);

  const cellClass = 'py-3 px-3 text-[#1a233a] font-medium';

  const renderCell = (key, quote) => {
    switch (key) {
      case 'date':
        return <td key={key} className={cellClass}>{quote.date}</td>;
      case 'quoteNo':
        return (
          <td
            key={key}
            className="py-3 px-3 text-blue-600 font-medium cursor-pointer hover:underline"
            onClick={() => navigate(`/sales/quotes/${quote.id}`)}
          >
            {quote.quoteNo}
          </td>
        );
      case 'customer':
        return <td key={key} className={cellClass}>{quote.customerName || 'N/A'}</td>;
      case 'boxSpec':
        return <td key={key} className={cellClass}>{quote.boxSpec || 'N/A'}</td>;
      case 'quantity':
        return <td key={key} className={cellClass}>{quote.quantity || 0}</td>;
      case 'amount':
        return <td key={key} className={cellClass}>{quote.amount || '0.00'}</td>;
      case 'status':
        return (
          <td key={key} className="py-3 px-3">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${statusStyle(quote.status)}`}>
              {quote.status || 'Draft'}
            </span>
          </td>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500 font-medium">
        Loading quotes...
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500 font-medium">
        No quotes found. Create a new quote to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="quotes-table w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#f4f6f8] border-b border-gray-200 text-sm">
              <th className="py-3 pl-4 pr-3 font-bold text-[#6b778c] w-24">
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
                <th key={col.key} className="py-3 px-3 font-bold text-[#6b778c]">
                  {col.key === 'status' ? (
                    <div className="flex items-center gap-1">
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
            {paginatedQuotes.length > 0 ? (
              paginatedQuotes.map((quote) => (
                <tr
                  key={quote.id}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-[13px]"
                >
                  <td className="py-3 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <span className="w-4" />
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(quote.id)}
                        onChange={() => toggleSelect(quote.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </div>
                  </td>
                  {visibleColumns.map((col) => renderCell(col.key, quote))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1}
                  className="py-8 text-center text-gray-500 text-[13px]"
                >
                  No quotes found{statusFilter ? ` with status "${statusFilter}"` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-gray-200 bg-white text-xs text-gray-500 shrink-0">
        <span>
          Showing {paginatedQuotes.length} of {totalRecords} quote(s)
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span className="whitespace-nowrap">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Manage Column popover */}
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

export default QuotesTable;