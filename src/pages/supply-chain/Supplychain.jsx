import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Package,
  ListChecks,
  GripVertical,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Plus,
  MoreVertical,
  SlidersHorizontal,
  Search,
  Check,
  FileText,
  PackagePlus,
  Factory,
  Truck,
  Receipt,
  PackageCheck,
  HandCoins,
} from 'lucide-react';

import { getPackages } from '../../services/packageListApi';
import { getShipments } from '../../services/shipmentListApi';
// ======================================================
// SHARED COMPONENTS (also imported by the other 4 supply chain pages)
// ======================================================
// ======================================================
// SHARED STYLES (same tokens as ProductionPage)
// ======================================================
export const GRADIENT_BG = 'bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8]';
export const GRADIENT_TEXT = `${GRADIENT_BG} bg-clip-text text-transparent`;
export const CARD = 'bg-white border border-gray-200 rounded-xl shadow-sm';
export const INPUT =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] placeholder:text-gray-400 bg-white focus:outline-none focus:border-[#8b5cf6]';

export const tabs = ['Packages', 'Shipment'];

// ======================================================
// BUTTONS
// ======================================================
export const GradientButton = ({ children, icon: Icon, onClick, className = '', type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    className={`${GRADIENT_BG} hover:opacity-90 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center justify-center transition-opacity shadow-sm whitespace-nowrap ${className}`}
  >
    {Icon && <Icon className="w-3 h-3 mr-1" strokeWidth={2.5} />}
    {children}
  </button>
);

export const RoundIconButton = ({ icon: Icon, onClick, dark = false, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${dark
      ? 'bg-black hover:bg-gray-800 text-white'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`}
  >
    <Icon className="w-4 h-4" strokeWidth={2} />
  </button>
);

// ======================================================
// STATUS BADGE
// ======================================================
const STATUS_STYLES = {
  'In Transit': 'bg-blue-50 text-blue-600',
  Shipped: 'bg-green-50 text-green-600',
  Delivered: 'bg-green-50 text-green-600',
  Packed: 'bg-green-50 text-green-600',
  Dispatched: 'bg-green-50 text-green-600',
  Pending: 'bg-orange-50 text-orange-600',
  'Pending Dispatch': 'bg-orange-50 text-orange-600',
  'In Progress': 'bg-yellow-50 text-yellow-700',
  'Ready For Dispatch': 'bg-blue-50 text-blue-600',
  'Ready For Pickup': 'bg-blue-50 text-blue-600',
  Delayed: 'bg-orange-50 text-orange-600',
  Damaged: 'bg-red-50 text-red-600',
  Returned: 'bg-red-50 text-red-600',
  Cancelled: 'bg-red-50 text-red-600',
};

// `className` (optional) replaces the default colours, e.g. the blue "Shipped" on the shipment details page.
export const StatusBadge = ({ status, className, size = 'sm' }) => (
  <span
    className={`inline-block rounded-full font-medium whitespace-nowrap ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-0.5 text-[11px]'
      } ${className || STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}
  >
    {status}
  </span>
);

// ======================================================
// TOP TABS  (Packages | Shipment)
// ======================================================
export const SubTabs = ({ active, onChange }) => (
  <div className={`${CARD} shrink-0 px-8`}>
    <nav className="flex space-x-1">
      {tabs.map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`flex items-center gap-1 px-4 py-2 text-[13px] border-b-2 transition-colors whitespace-nowrap
            ${active === tab
              ? 'border-black text-black font-bold'
              : 'border-transparent text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  </div>
);

// ======================================================
// STEPPER (Creation -> Listed)
// ======================================================
export const Stepper = ({ steps }) => (
  <div className={`${CARD} shrink-0 px-8 py-3 flex justify-end`}>
    <div className="flex items-start mr-16">
      <div className="flex flex-col items-center w-32">
        <div className={`w-12 h-12 rounded-full ${GRADIENT_BG} flex items-center justify-center shadow-md`}>
          <Package className="w-6 h-6 text-white" strokeWidth={1.8} />
        </div>
        <span className="mt-1.5 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{steps[0]}</span>
      </div>

      <div className="w-32 h-[2px] mt-6 -mx-4 bg-gradient-to-r from-[#8b3dd8] to-[#ff3b30]" />

      <div className="flex flex-col items-center w-32">
        <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
          <ListChecks className="w-6 h-6 text-gray-400" strokeWidth={1.8} />
        </div>
        <span className="mt-1.5 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{steps[1]}</span>
      </div>
    </div>
  </div>
);

// ======================================================
// WORKFLOW STEPPER (copied from ManufacturingOrderDetailsPage: same sizes, icons and colours)
// Quote -> Sales order -> Production -> Package -> Ship -> Invoice -> Delivered -> Payment
// Steps before `current` = green tick, `current` = gradient highlight, rest = grey.
// Usage: <WorkflowStepper current="Package" />
// ======================================================
export const WORKFLOW_STEPS = [
  { name: 'Quote', icon: PackagePlus },
  { name: 'Sales order', icon: FileText },
  { name: 'Production', icon: Factory },
  { name: 'Package', icon: Package },
  { name: 'Ship', icon: Truck },
  { name: 'Invoice', icon: Receipt },
  { name: 'Delivered', icon: PackageCheck },
  { name: 'Payment', icon: HandCoins },
];

export const WorkflowStepper = ({ current }) => {
  const currentIndex = Math.max(
    0,
    WORKFLOW_STEPS.findIndex(s => s.name.toLowerCase() === String(current).toLowerCase())
  );

  return (
    <div className="bg-white px-6 py-4 md:px-8 md:py-5 flex flex-col items-start border border-gray-200 rounded-2xl shadow-sm shrink-0">
      <div className="flex items-center w-full relative px-4 sm:px-6 z-0">
        {/* Connecting line (grey track + green part for completed steps) */}
        <div className="absolute top-5 left-8 right-8 sm:left-10 sm:right-10 h-[2px] bg-gray-200 z-[-1]"></div>
        <div
          className="absolute top-5 left-8 sm:left-10 h-[2px] bg-[#86efac] z-[-1]"
          style={{ width: `calc((100% - 5rem) * ${currentIndex} / ${WORKFLOW_STEPS.length - 1})` }}
        ></div>

        <div className="flex items-start justify-between w-full">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;

            return (
              <div key={step.name} className="flex flex-col items-center px-1 sm:px-2 relative w-[50px] sm:w-[60px]">
                <div className="h-10 flex items-center justify-center mb-1 w-full">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center relative z-10 ${isCompleted
                    ? 'bg-[#bbf7d0]'
                    : isActive
                      ? 'bg-gradient-to-br from-[#ff7a59] via-[#d54a88] to-[#402de8] text-white shadow-md'
                      : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}>
                    {isCompleted ? (
                      <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#22c55e] flex items-center justify-center">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                  </div>
                </div>
                <span className={`text-[9px] sm:text-[11px] font-semibold text-center leading-tight ${isCompleted ? 'text-[#16a34a]' : isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const CreationStepper = ({ title, current }) => {
  const currentIndex = Math.max(
    0,
    WORKFLOW_STEPS.findIndex(s => s.name.toLowerCase() === String(current).toLowerCase())
  );

  return (
    <div className="bg-white px-6 py-2 rounded-xl border border-gray-200 shadow-sm shrink-0">
      <h2 className="text-[20px] font-bold tracking-tight bg-gradient-to-r from-[#ff6b6b] via-[#9333ea] to-[#4338ca] bg-clip-text text-transparent inline-block mb-1">
        {title}
      </h2>

      <div className="flex items-center w-full relative px-6 z-0">
        {/* grey base line */}
        <div className="absolute top-4 left-10 right-10 h-[2px] bg-gray-200 z-[-1]"></div>
        {/* gradient line up to the current step */}
        <div
          className="absolute top-4 left-10 h-[2px] bg-gradient-to-r from-[#ff6b6b] via-[#9333ea] to-[#4338ca] z-[-1]"
          style={{ width: `calc((100% - 5rem) * ${currentIndex} / ${WORKFLOW_STEPS.length - 1})` }}
        ></div>

        <div className="flex items-center justify-between w-full">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentIndex;
            const isDone = index < currentIndex;
            return (
              <div key={step.name} className="flex flex-col items-center px-2 relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 relative z-10 ${isActive
                      ? 'bg-gradient-to-br from-[#ff6b6b] via-[#9333ea] to-[#4338ca] text-white shadow-md'
                      : isDone
                        ? 'bg-white border-2 border-[#9333ea] text-[#9333ea]'
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ======================================================
// PAGE LAYOUT  (tabs + stepper + body + optional fixed footer)
// The body (children) decides what scrolls.
// ======================================================
// `stepper` (optional) replaces the default 2-step Stepper, e.g. <WorkflowStepper current="Package" />
export const PageLayout = ({ activeTab, steps, stepper, footer, children }) => {
  const navigate = useNavigate();

  return (
    <main className="flex-1 h-full min-h-0 overflow-hidden bg-[#f4f7f9] flex flex-col relative p-1.5 gap-1.5">
      <SubTabs
        active={activeTab}
        onChange={tab => navigate('/supply-chain', { state: { tab } })}
      />
      {stepper || <Stepper steps={steps} />}
      <div className="flex-1 min-h-0 flex gap-1.5">{children}</div>
      {footer}
    </main>
  );
};

export const PageFooter = ({ onSaveDraft, onCancel, onSave }) => (
  <div className={`${CARD} shrink-0 px-8 py-3 flex items-center justify-end gap-3`}>
    <button
      type="button"
      onClick={onSaveDraft}
      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-[13px] font-medium flex items-center transition-colors"
    >
      <Bookmark className="w-4 h-4 mr-1.5" strokeWidth={2} />
      Save Draft
    </button>
    <button
      type="button"
      onClick={onCancel}
      className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
    >
      Cancel
    </button>
    <GradientButton onClick={onSave} className="px-7 py-2 text-[13px]">
      Save
    </GradientButton>
  </div>
);

// ======================================================
// FORM HELPERS
// ======================================================
export const FormSection = ({ title, children, action }) => (
  <section className="border border-gray-200 rounded-xl bg-white">
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
      <h3 className="text-[15px] font-semibold text-[#1a233a]">{title}</h3>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

export const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[13px] font-semibold text-[#1a233a]">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// Native select with a chevron on the right
export const SelectField = ({ value, onChange, options, placeholder = 'Select', className = '' }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`${INPUT} appearance-none pr-9 cursor-pointer ${value ? '' : 'text-gray-400'}`}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// Text input with an icon on the right
export const IconInput = ({ icon: Icon, className = '', ...props }) => (
  <div className="relative">
    <input {...props} className={`${INPUT} pr-9 ${className}`} />
    {Icon && <Icon className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />}
  </div>
);

export const NoteSection = ({ title, value, onChange }) => (
  <FormSection title={title}>
    <textarea
      maxLength={500}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`${INPUT} resize-none h-28`}
    />
    <div className="text-right text-[11px] text-gray-400 mt-1">{value.length}/500</div>
  </FormSection>
);

// ======================================================
// MANAGE COLUMN POPUP
// columns: [{ key, label, visible }]  -> onSave(newColumns)
// ======================================================
export const ManageColumnPopup = ({ columns, defaultColumns, onSave, onCancel }) => {
  const [items, setItems] = useState(columns);
  const [dragIndex, setDragIndex] = useState(null);

  const toggle = key =>
    setItems(prev => prev.map(c => (c.key === key ? { ...c, visible: !c.visible } : c)));

  const handleDrop = index => {
    if (dragIndex === null || dragIndex === index) return;
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  return (
    <div className="absolute left-2 top-11 z-30 w-[250px] bg-white border border-gray-200 rounded-xl shadow-xl p-3">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <span className="text-[13px] font-bold text-[#1a233a]">Manage Column</span>
        <button
          type="button"
          onClick={() => setItems(defaultColumns)}
          className={`text-[12px] font-bold ${GRADIENT_TEXT}`}
        >
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-[320px] overflow-y-auto">
        {items.map((col, index) => (
          <div
            key={col.key}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#f7f5fd] cursor-grab"
          >
            <GripVertical className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="checkbox"
              checked={col.visible}
              onChange={() => toggle(col.key)}
              className="accent-[#7c3aed] cursor-pointer"
            />
            <span className="text-[12px] text-[#1a233a]">{col.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 mt-3">
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-md text-[12px] font-medium"
        >
          Cancel
        </button>
        <GradientButton onClick={() => onSave(items)} className="rounded-md px-4 py-1">
          Save
        </GradientButton>
      </div>
    </div>
  );
};

// ======================================================
// DATA (comes from the API - empty until it is connected)
// ======================================================
export const packagesData = [];

export const shipmentsData = [];

// status filters (fixed lists, not dummy records)
export const packageStatusFilters = [
  'in Progress',
  'Packed',
  'Shipped',
  'In Transit',
  'Delivered',
  'Cancelled',
];

export const shipmentStatusFilters = [
  'Shipped',
  'In Transit',
  'Delivered',
  'Cancelled',
];

// ---------- dropdown options for create pages ----------
export const customerOptions = [];
export const salesOrderOptions = [];
export const carrierOptions = [];
export const packageTypeOptions = ['Box', 'Pallet', 'Bundle', 'Crate'];

export const initialPackageItems = [];

// ---------- details pages ----------
export const packageDetailsData = [];

export const shipmentDetailsData = [];

// ======================================================
// SUPPLY CHAIN LIST PAGE (Packages + Shipment)
// ======================================================
// ======================================================
// COLUMN DEFINITIONS
// label  = text shown in "Manage Column" popup
// header = text shown in table header
// ======================================================
const PACKAGE_COLUMNS = [
  { key: 'packageDate', label: 'Package Date', header: 'Package Date' },
  { key: 'packageNo', label: 'Package#', header: 'Package#' },
  { key: 'salesOrder', label: 'Sales Order#', header: 'Sales Order#' },
  { key: 'deliveryChallan', label: 'Delivery Challan', header: 'Delivery Challan' },
  { key: 'status', label: 'Status', header: 'Status' },
  { key: 'shipmentDate', label: 'Shipment Date', header: 'Shipment Date' },
  { key: 'customerName', label: 'Customer Name', header: 'Customer Name' },
  { key: 'quantity', label: 'Quantity', header: 'Quantity', align: 'right' },
];

const SHIPMENT_COLUMNS = [
  { key: 'shipmentDate', label: 'Shipping Date', header: 'Shipment Date' },
  { key: 'shipmentOrder', label: 'Shipment Order', header: 'Shipment Order#' },
  { key: 'packageNo', label: 'Package', header: 'Package#' },
  { key: 'salesOrder', label: 'Sales Order', header: 'Sales Order#' },
  { key: 'carrier', label: 'Carrier', header: 'Carrier' },
  { key: 'tracking', label: 'Tracking', header: 'Tracking#' },
  { key: 'deliveryChallan', label: 'Delivery Challan', header: 'Delivery Challan#' },
  { key: 'trackingStatus', label: 'Tracking Status', header: 'Tracking Status' },
  { key: 'customerName', label: 'Customer Name', header: 'Customer Name' },
  { key: 'quantity', label: 'Quantity', header: 'Quantity' },
  { key: 'shippingCost', label: 'Shipping Cost', header: 'Shipping Cost' },
];

const toColumnState = defs => defs.map(({ key, label }) => ({ key, label, visible: true }));

const LINK_KEYS = ['packageNo', 'shipmentOrder'];

const renderCell = (key, row) => {
  if (LINK_KEYS.includes(key)) {
    return (
      <span className="text-blue-500 hover:underline cursor-pointer font-medium">
        {row[key]}
      </span>
    );
  }
  if (key === 'status') return <StatusBadge status={row.status} size="md" />;
  return row[key];
};

const SupplyChainPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'Packages');
  const [selectedRows, setSelectedRows] = useState([]);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // dropdown (All Package / All Shipment) filter
  const [filterOpen, setFilterOpen] = useState(false);
  const [packageFilter, setPackageFilter] = useState(null);
  const [shipmentFilter, setShipmentFilter] = useState(null);

  // manage column popup
  const [manageOpen, setManageOpen] = useState(false);
  const [packageCols, setPackageCols] = useState(toColumnState(PACKAGE_COLUMNS));
  const [shipmentCols, setShipmentCols] = useState(toColumnState(SHIPMENT_COLUMNS));


  // packages from the API
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    getPackages()
      .then(setPackages)
      .catch(err => console.error(err.message));
  }, []);

  // shipments from the API (Shipment tab)
  const [shipmentRows, setShipmentRows] = useState([]);

  useEffect(() => {
    getShipments()
      .then(setShipmentRows)
      .catch(err => console.error(err.message));
  }, []);

  const isPackages = activeTab === 'Packages';

  // everything that differs between the two tabs
  const defs = isPackages ? PACKAGE_COLUMNS : SHIPMENT_COLUMNS;
  const cols = isPackages ? packageCols : shipmentCols;
  const setCols = isPackages ? setPackageCols : setShipmentCols;
  const filterList = isPackages ? packageStatusFilters : shipmentStatusFilters;
  const activeFilter = isPackages ? packageFilter : shipmentFilter;
  const setActiveFilter = isPackages ? setPackageFilter : setShipmentFilter;
  const statusKey = isPackages ? 'status' : 'trackingStatus';
  const allRows = isPackages ? packages : shipmentRows;
  const rows = activeFilter ? allRows.filter(r => r[statusKey] === activeFilter) : allRows;
  const visibleCols = cols
    .filter(c => c.visible)
    .map(c => defs.find(d => d.key === c.key));

  // pagination (frontend only for now - move to backend limit/offset when API is connected)
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = rows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const fill = pageRows.length >= rowsPerPage;

  const handleTabChange = tab => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedRows([]);
    setFilterOpen(false);
    setManageOpen(false);
  };

  const toggleRow = id =>
    setSelectedRows(prev => (prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]));

  const allSelected = pageRows.length > 0 && pageRows.every(r => selectedRows.includes(r.id));
  const toggleAll = () => setSelectedRows(allSelected ? [] : pageRows.map(r => r.id));

  const goToNew = () =>
    navigate(isPackages ? '/supply-chain/packages/new' : '/supply-chain/shipments/new');

  const goToDetails = id =>
    navigate(isPackages ? `/supply-chain/packages/${id}` : `/supply-chain/shipments/${id}`);

  // choosing the already-selected filter again goes back to "All"
  const pickFilter = value => {
    setActiveFilter(activeFilter === value ? null : value);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  return (
    <main className="flex-1 min-h-0 overflow-hidden bg-[#f4f7f9] flex flex-col relative p-1.5 gap-1.5">

      {/* Sub Navigation */}
      <SubTabs active={activeTab} onChange={handleTabChange} />

      {/* Header */}
      <div className={`${CARD} shrink-0 px-8 py-3 flex items-center justify-between`}>
        <div className="relative">
          <div
            className="flex items-center space-x-1 cursor-pointer"
            onClick={() => setFilterOpen(o => !o)}
          >
            <h2 className={`text-xl font-bold tracking-tight inline-block w-fit ${GRADIENT_TEXT}`}>
              {activeFilter || (isPackages ? 'All Package' : 'All Shipment')}
            </h2>
            {filterOpen
              ? <ChevronUp className="w-5 h-5 text-[#8b5cf6]" />
              : <ChevronDown className="w-5 h-5 text-[#8b5cf6]" />}
          </div>

          {filterOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setFilterOpen(false)} />
              <div className="absolute left-0 top-full mt-2 z-30 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-2">
                {filterList.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => pickFilter(item)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] text-[#1a233a] transition-colors
                      hover:bg-gradient-to-r hover:from-[#fdecec] hover:to-[#e9e6fb]
                      ${activeFilter === item ? 'bg-gradient-to-r from-[#fdecec] to-[#e9e6fb]' : ''}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <GradientButton icon={Plus} onClick={goToNew}>New</GradientButton>
          <RoundIconButton icon={MoreVertical} />
        </div>
      </div>

      {/* Table Area */}
      <div className={`${CARD} relative flex flex-col ${fill ? 'flex-1 min-h-0' : ''}`}>
        {manageOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setManageOpen(false)} />
            <ManageColumnPopup
              key={activeTab}
              columns={cols}
              defaultColumns={toColumnState(defs)}
              onCancel={() => setManageOpen(false)}
              onSave={newCols => {
                setCols(newCols);
                setManageOpen(false);
              }}
            />
          </>
        )}

        {/* horizontal scroll: scroll right to see all columns */}
        <div className={`overflow-x-auto rounded-t-xl ${fill ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
          <table className={`w-full min-w-max ${fill ? 'h-full' : ''}`}>
            <thead>
              <tr className="border-b border-gray-200 bg-[#f8f9fa] sticky top-0 z-10">
                <th className="w-10 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setManageOpen(o => !o)}
                    className="text-gray-400 hover:text-gray-700 flex items-center"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </th>
                <th className="w-10 px-2 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                {visibleCols.map(col => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-sm font-bold text-[#6b778c] whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                  >
                    {col.header}
                  </th>
                ))}
                <th className="w-10 px-4 py-3">
                  <Search className="w-4 h-4 text-gray-400" />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length + 3} className="px-4 py-8 text-center text-gray-500">
                    {isPackages ? 'No packages found.' : 'No shipments found.'}
                  </td>
                </tr>
              ) : (
                pageRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => goToDetails(row.id)}
                    className={`border-b border-gray-100 transition-colors cursor-pointer
                      ${selectedRows.includes(row.id)
                        ? 'bg-blue-50'
                        : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-[#fcfcfc]'
                      }`}
                  >
                    <td className="w-10 px-3 py-2.5" />
                    <td className="px-2 py-2.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    {visibleCols.map(col => (
                      <td
                        key={col.key}
                        className={`px-4 py-2.5 text-[13px] text-[#1a233a] font-medium whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                      >
                        {renderCell(col.key, row)}
                      </td>
                    ))}
                    <td className="w-10 px-4 py-2.5" />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalRows > 0 && (
          <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-gray-200 bg-white text-xs text-gray-500 shrink-0 rounded-b-xl">
            <span>
              Showing {pageRows.length} of {totalRows} {isPackages ? 'package(s)' : 'shipment(s)'}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="whitespace-nowrap">
                  Page {safePage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default SupplyChainPage;