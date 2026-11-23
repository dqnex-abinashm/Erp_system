// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ChevronDown, SlidersHorizontal, GripVertical } from 'lucide-react';

// const mockInvoices = [
//   {
//     id: 1,
//     date: '25/06/2026',
//     invoice: 'INV-00001',
//     orderNo: 'SL-00001',
//     customerName: 'CLIMAMAX PVT LTD',
//     status: 'PAID',
//     dueDate: '25/07/2026',
//     amount: 53900,
//     balanceDue: 0,
//   },
//   {
//     id: 2,
//     date: '20/06/2026',
//     invoice: 'INV-00002',
//     orderNo: 'SL-00002',
//     customerName: 'NEXUS TECHNOLOGIES',
//     status: 'UNPAID',
//     dueDate: '20/07/2026',
//     amount: 12500,
//     balanceDue: 12500,
//   },
//   {
//     id: 3,
//     date: '15/06/2026',
//     invoice: 'INV-00003',
//     orderNo: 'SL-00003',
//     customerName: 'APEX INDUSTRIES',
//     status: 'DRAFT',
//     dueDate: '15/07/2026',
//     amount: 68400,
//     balanceDue: 68400,
//   },
//   {
//     id: 4,
//     date: '10/06/2026',
//     invoice: 'INV-00004',
//     orderNo: 'SL-00004',
//     customerName: 'SUNRISE PRIVATE LIMITED',
//     status: 'PARTIALLY PAID',
//     dueDate: '10/07/2026',
//     amount: 30000,
//     balanceDue: 10000,
//   },
// ];

// const ALL_COLUMNS = [
//   { key: 'date', label: 'Date' },
//   { key: 'invoice', label: 'Invoice' },
//   { key: 'orderNo', label: 'Reference' },
//   { key: 'customer', label: 'Customer Name' },
//   { key: 'amount', label: 'Amount' },
//   { key: 'balanceDue', label: 'Balance Due' },
//   { key: 'dueDate', label: 'Due Date' },
//   { key: 'status', label: 'Status' },
// ];

// // Design: Balance Due unchecked by default
// const DEFAULT_COLUMNS = ALL_COLUMNS.map((c) => ({
//   key: c.key,
//   visible: c.key !== 'balanceDue',
// }));

// const STORAGE_KEY = 'invoiceTableColumns';

// const loadColumns = () => {
//   try {
//     const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
//     const valid =
//       Array.isArray(saved) &&
//       saved.length === ALL_COLUMNS.length &&
//       saved.every((s) => ALL_COLUMNS.some((c) => c.key === s.key));
//     if (valid) return saved;
//   } catch (e) {
//     /* ignore */
//   }
//   return DEFAULT_COLUMNS;
// };

// const labelOf = (key) => ALL_COLUMNS.find((c) => c.key === key)?.label || key;

// const normalize = (s) =>
//   String(s || '').toLowerCase().replace(/[\s_-]+/g, '');

// // dd/mm/yyyy -> Date
// const parseDate = (str) => {
//   const [d, m, y] = String(str || '').split('/').map(Number);
//   return d && m && y ? new Date(y, m - 1, d) : null;
// };

// const isOverdue = (inv) => {
//   const due = parseDate(inv.dueDate);
//   return !!due && due < new Date() && inv.balanceDue > 0 && normalize(inv.status) !== 'draft';
// };

// const formatINR = (n) =>
//   '₹' +
//   Number(n || 0).toLocaleString('en-IN', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

// const statusLabel = (s) => {
//   const n = normalize(s);
//   if (n === 'paid') return 'Paid';
//   if (n === 'unpaid') return 'Un Paid';
//   if (n === 'partiallypaid' || n === 'parietallypaid') return 'Partially Paid';
//   if (n === 'draft') return 'Draft';
//   return s;
// };

// const statusStyle = (s) => {
//   const n = normalize(s);
//   if (n === 'paid') return 'bg-[#dcfce7] text-[#16a34a]';
//   if (n === 'unpaid') return 'bg-[#fee2e2] text-[#ef4444]';
//   if (n === 'partiallypaid' || n === 'parietallypaid') return 'bg-[#ffedd5] text-[#c2410c]';
//   return 'bg-gray-100 text-gray-500';
// };

// const InvoicesTable = ({ statusFilter = '' }) => {
//   const navigate = useNavigate();
//   const btnRef = useRef(null);

//   const [selectedIds, setSelectedIds] = useState([]);
//   const [page, setPage] = useState(1);
//   const [limit] = useState(10);

//   const [columns, setColumns] = useState(loadColumns);
//   const [draft, setDraft] = useState(columns);
//   const [open, setOpen] = useState(false);
//   const [pos, setPos] = useState({ top: 0, left: 0 });
//   const [dragIndex, setDragIndex] = useState(null);

//   useEffect(() => {
//     setPage(1);
//     setSelectedIds([]);
//   }, [statusFilter]);

//   // ---------- Filter + pagination ----------
//   const matches = (inv) => {
//     const f = normalize(statusFilter);
//     if (f === 'overdue') return isOverdue(inv);
//     if (f === 'parietallypaid') return normalize(inv.status) === 'partiallypaid';
//     return normalize(inv.status) === f;
//   };

//   const filtered = statusFilter ? mockInvoices.filter(matches) : mockInvoices;

//   const totalRecords = filtered.length;
//   const totalPages = Math.ceil(totalRecords / limit);
//   const startIndex = (page - 1) * limit;
//   const paginated = filtered.slice(startIndex, startIndex + limit);

//   // ---------- Select all (current page) ----------
//   const pageIds = paginated.map((i) => i.id);
//   const allSelected =
//     pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

//   const toggleSelectAll = () =>
//     setSelectedIds((prev) =>
//       allSelected
//         ? prev.filter((id) => !pageIds.includes(id))
//         : [...new Set([...prev, ...pageIds])]
//     );

//   const toggleSelect = (id) =>
//     setSelectedIds((prev) =>
//       prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//     );

//   // ---------- Manage Column ----------
//   const visibleColumns = columns.filter((c) => c.visible);

//   const openPanel = () => {
//     const rect = btnRef.current.getBoundingClientRect();
//     setPos({ top: rect.bottom + 8, left: rect.left });
//     setDraft(columns);
//     setOpen(true);
//   };

//   const toggleDraft = (key) =>
//     setDraft((prev) =>
//       prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
//     );

//   const handleDrop = (dropIndex) => {
//     if (dragIndex === null || dragIndex === dropIndex) return;
//     setDraft((prev) => {
//       const next = [...prev];
//       const [moved] = next.splice(dragIndex, 1);
//       next.splice(dropIndex, 0, moved);
//       return next;
//     });
//     setDragIndex(null);
//   };

//   const handleSave = () => {
//     const next = draft.some((c) => c.visible) ? draft : columns;
//     setColumns(next);
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
//     setOpen(false);
//   };

//   const handleReset = () => setDraft(DEFAULT_COLUMNS);

//   const cell = 'py-3 px-3 text-[#1a233a] font-medium';

//   const renderCell = (key, inv) => {
//     switch (key) {
//       case 'date':
//         return <td key={key} className={cell}>{inv.date}</td>;
//       case 'invoice':
//         return (
//           <td
//             key={key}
//             className="py-3 px-3 text-blue-600 font-medium cursor-pointer hover:underline whitespace-nowrap"
//             onClick={() => navigate(`/sales/invoices/${inv.id}`)}
//           >
//             {inv.invoice}
//           </td>
//         );
//       case 'orderNo':
//         return <td key={key} className={cell}>{inv.orderNo}</td>;
//       case 'customer':
//         return (
//           <td key={key} className={`${cell} max-w-[200px] truncate`} title={inv.customerName}>
//             {inv.customerName}
//           </td>
//         );
//       case 'amount':
//         return <td key={key} className={cell}>{formatINR(inv.amount)}</td>;
//       case 'balanceDue':
//         return <td key={key} className={cell}>{formatINR(inv.balanceDue)}</td>;
//       case 'dueDate':
//         return <td key={key} className={cell}>{inv.dueDate}</td>;
//       case 'status':
//         return (
//           <td key={key} className="py-3 px-3">
//             <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${statusStyle(inv.status)}`}>
//               {statusLabel(inv.status)}
//             </span>
//           </td>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="flex flex-col">
//       <div className="overflow-x-auto w-full">
//         <table className="w-full text-left border-collapse whitespace-nowrap">
//           <thead>
//             <tr className="bg-[#f4f6f8] border-b border-gray-200 text-sm">
//               <th className="py-3 pl-4 pr-3 font-bold text-[#6b778c] w-24">
//                 <div className="flex items-center gap-3">
//                   <button
//                     ref={btnRef}
//                     type="button"
//                     onClick={openPanel}
//                     title="Manage columns"
//                     className="text-gray-400 hover:text-gray-700"
//                   >
//                     <SlidersHorizontal className="w-4 h-4" />
//                   </button>
//                   <input
//                     type="checkbox"
//                     checked={allSelected}
//                     onChange={toggleSelectAll}
//                     className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
//                   />
//                 </div>
//               </th>

//               {visibleColumns.map((col) => (
//                 <th key={col.key} className="py-3 px-3 font-bold text-[#6b778c]">
//                   {col.key === 'status' ? (
//                     <div className="flex items-center gap-1">
//                       Status <ChevronDown className="w-3.5 h-3.5" />
//                     </div>
//                   ) : (
//                     labelOf(col.key)
//                   )}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {paginated.length > 0 ? (
//               paginated.map((inv) => (
//                 <tr
//                   key={inv.id}
//                   className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-[13px] ${
//                     selectedIds.includes(inv.id) ? 'bg-blue-50/50' : ''
//                   }`}
//                 >
//                   <td className="py-3 pl-4 pr-3">
//                     <div className="flex items-center gap-3">
//                       <span className="w-4" />
//                       <input
//                         type="checkbox"
//                         checked={selectedIds.includes(inv.id)}
//                         onChange={() => toggleSelect(inv.id)}
//                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
//                       />
//                     </div>
//                   </td>
//                   {visibleColumns.map((col) => renderCell(col.key, inv))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   colSpan={visibleColumns.length + 1}
//                   className="py-8 text-center text-gray-500 text-[13px]"
//                 >
//                   No invoices found{statusFilter ? ` with status "${statusFilter}"` : ''}.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Footer */}
//       <div className="shrink-0 px-6 py-3 border-t border-gray-200 bg-white text-xs text-gray-500 flex justify-between items-center gap-3">
//         <span>
//           Showing {paginated.length} of {totalRecords} invoice(s)
//         </span>

//         {totalPages > 1 && (
//           <div className="flex items-center gap-2">
//             <button
//               type="button"
//               onClick={() => page > 1 && setPage((p) => p - 1)}
//               disabled={page === 1}
//               className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
//             >
//               Previous
//             </button>
//             <span className="whitespace-nowrap">
//               Page {page} of {totalPages}
//             </span>
//             <button
//               type="button"
//               onClick={() => page < totalPages && setPage((p) => p + 1)}
//               disabled={page >= totalPages}
//               className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
//             >
//               Next
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Manage Column popover */}
//       {open && (
//         <>
//           <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
//           <div
//             className="fixed z-50 w-[250px] bg-white rounded-xl shadow-xl border border-gray-100 p-3"
//             style={{ top: pos.top, left: pos.left }}
//           >
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-[14px] font-medium text-[#1a233a]">Manage Column</span>
//               <button
//                 type="button"
//                 onClick={handleReset}
//                 className="text-[12px] font-bold bg-gradient-to-r from-[#ff7a59] to-[#402de8] bg-clip-text text-transparent"
//               >
//                 Reset
//               </button>
//             </div>

//             <div className="space-y-1.5">
//               {draft.map((col, index) => (
//                 <div
//                   key={col.key}
//                   draggable
//                   onDragStart={() => setDragIndex(index)}
//                   onDragOver={(e) => e.preventDefault()}
//                   onDrop={() => handleDrop(index)}
//                   className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-gradient-to-r from-[#fdf0ee] to-[#f1effd] cursor-grab"
//                 >
//                   <GripVertical className="w-3.5 h-3.5 text-gray-400" />
//                   <input
//                     type="checkbox"
//                     checked={col.visible}
//                     onChange={() => toggleDraft(col.key)}
//                     className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
//                   />
//                   <span className="text-[12px] text-[#1a233a]">{labelOf(col.key)}</span>
//                 </div>
//               ))}
//             </div>

//             <div className="flex justify-end gap-2 mt-3">
//               <button
//                 type="button"
//                 onClick={() => setOpen(false)}
//                 className="px-4 py-1 text-[12px] border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={handleSave}
//                 className="px-5 py-1 text-[12px] font-bold text-white rounded-md bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8]"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default InvoicesTable;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, SlidersHorizontal, GripVertical } from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api/v1';

const ALL_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'orderNo', label: 'Reference' },
  { key: 'customer', label: 'Customer Name' },
  { key: 'amount', label: 'Amount' },
  { key: 'balanceDue', label: 'Balance Due' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'status', label: 'Status' },
];

// Design: Balance Due unchecked by default
const DEFAULT_COLUMNS = ALL_COLUMNS.map((c) => ({
  key: c.key,
  visible: c.key !== 'balanceDue',
}));

const STORAGE_KEY = 'invoiceTableColumns';

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

const normalize = (s) =>
  String(s || '').toLowerCase().replace(/[\s_-]+/g, '');

// dd/mm/yyyy -> Date
const parseDate = (str) => {
  const [d, m, y] = String(str || '').split('/').map(Number);
  return d && m && y ? new Date(y, m - 1, d) : null;
};

const isOverdue = (inv) => {
  const due = parseDate(inv.dueDate);
  return !!due && due < new Date() && inv.balanceDue > 0 && normalize(inv.status) !== 'draft';
};

const formatINR = (n) =>
  '₹' +
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const statusLabel = (s) => {
  const n = normalize(s);
  if (n === 'paid') return 'Paid';
  if (n === 'unpaid') return 'Un Paid';
  if (n === 'partiallypaid' || n === 'parietallypaid') return 'Partially Paid';
  if (n === 'draft') return 'Draft';
  return s;
};

const statusStyle = (s) => {
  const n = normalize(s);
  if (n === 'paid') return 'bg-[#dcfce7] text-[#16a34a]';
  if (n === 'unpaid') return 'bg-[#fee2e2] text-[#ef4444]';
  if (n === 'partiallypaid' || n === 'parietallypaid') return 'bg-[#ffedd5] text-[#c2410c]';
  return 'bg-gray-100 text-gray-500';
};

const InvoicesTable = ({ statusFilter = '' }) => {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const [invoices, setInvoices] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [columns, setColumns] = useState(loadColumns);
  const [draft, setDraft] = useState(columns);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [statusFilter]);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/invoices`);
        if (res.ok) setInvoices(await res.json());
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
      }
    };
    loadInvoices();
  }, []);

  // ---------- Filter + pagination ----------
  const matches = (inv) => {
    const f = normalize(statusFilter);
    if (f === 'overdue') return isOverdue(inv);
    if (f === 'parietallypaid') return normalize(inv.status) === 'partiallypaid';
    return normalize(inv.status) === f;
  };

  const filtered = statusFilter ? invoices.filter(matches) : invoices;

  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / limit);
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  // ---------- Select all (current page) ----------
  const pageIds = paginated.map((i) => i.id);
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

  const cell = 'py-3 px-3 text-[#1a233a] font-medium';

  const renderCell = (key, inv) => {
    switch (key) {
      case 'date':
        return <td key={key} className={cell}>{inv.date}</td>;
      case 'invoice':
        return (
          <td
            key={key}
            className="py-3 px-3 text-blue-600 font-medium cursor-pointer hover:underline whitespace-nowrap"
            onClick={() => navigate(`/sales/invoices/${inv.id}`)}
          >
            {inv.invoice}
          </td>
        );
      case 'orderNo':
        return <td key={key} className={cell}>{inv.orderNo}</td>;
      case 'customer':
        return (
          <td key={key} className={`${cell} max-w-[200px] truncate`} title={inv.customerName}>
            {inv.customerName}
          </td>
        );
      case 'amount':
        return <td key={key} className={cell}>{formatINR(inv.amount)}</td>;
      case 'balanceDue':
        return <td key={key} className={cell}>{formatINR(inv.balanceDue)}</td>;
      case 'dueDate':
        return <td key={key} className={cell}>{inv.dueDate}</td>;
      case 'status':
        return (
          <td key={key} className="py-3 px-3">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${statusStyle(inv.status)}`}>
              {statusLabel(inv.status)}
            </span>
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
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
            {paginated.length > 0 ? (
              paginated.map((inv) => (
                <tr
                  key={inv.id}
                  className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-[13px] ${
                    selectedIds.includes(inv.id) ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <td className="py-3 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <span className="w-4" />
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </div>
                  </td>
                  {visibleColumns.map((col) => renderCell(col.key, inv))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1}
                  className="py-8 text-center text-gray-500 text-[13px]"
                >
                  No invoices found{statusFilter ? ` with status "${statusFilter}"` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-3 border-t border-gray-200 bg-white text-xs text-gray-500 flex justify-between items-center gap-3">
        <span>
          Showing {paginated.length} of {totalRecords} invoice(s)
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => page > 1 && setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="whitespace-nowrap">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => page < totalPages && setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
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

export default InvoicesTable;