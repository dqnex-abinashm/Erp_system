import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Settings, PlusCircle, Trash2, ChevronDown, X } from 'lucide-react';
import {
  INPUT,
  PageLayout,
  PageFooter,
  FormSection,
  Field,
  SelectField,
  IconInput,
  NoteSection,
  CreationStepper,
  packageTypeOptions,
  initialPackageItems,
} from './Supplychain';

import { createPackage, toISODate } from '../../services/createPackageApi';
import { getCustomerLookup, getSalesOrderLookup, getPackableItems } from '../../services/packageLookupApi';

// input + unit label inside one bordered box (Total Weight / Total Quantity)
const UnitInput = ({ value, onChange, unit = 'Kg' }) => (
  <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden focus-within:border-[#8b5cf6]">
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="flex-1 min-w-0 px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none"
    />
    <span className="px-3 py-2 text-[12px] text-gray-500 border-l border-gray-200 flex items-center gap-1">
      {unit}
      <ChevronDown className="w-3 h-3" />
    </span>
  </div>
);

// ---------- date field: type a date OR click the calendar icon to pick one ----------
// value is kept as DD/MM/YYYY (same as before); the hidden native date input gives the full calendar popup
const toISO = v => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};
const fromISO = v => {
  if (!v) return '';
  const [y, m, d] = v.split('-');
  return `${d}/${m}/${y}`;
};

const DateInput = ({ value, onChange, placeholder = 'DD/MM/YYYY' }) => {
  const pickerRef = useRef(null);

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.focus();
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT} pr-10`}
      />
      <button
        type="button"
        onClick={openPicker}
        title="Pick a date"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[#7c3aed]"
      >
        <Calendar className="w-4 h-4" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        value={toISO(value)}
        onChange={e => onChange(fromISO(e.target.value))}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute right-2 bottom-0 w-0 h-0 opacity-0 pointer-events-none"
      />
    </div>
  );
};

// converts one API item into a row of the Item Table
const toItemRow = i => ({
  id: i.salesOrderItemId,
  salesOrderItemId: i.salesOrderItemId,
  salesOrder: i.salesOrderNumber,
  itemCode: i.itemCode,
  name: i.itemName,
  description: i.itemDescription,
  orderDate: fromISO(i.itemOrderDate),
  ordered: i.orderedQuantity,
  remaining: i.remainingQuantity,
  quantityToPack: i.remainingQuantity,
  unitWeight: i.unitWeight,
  totalWeight: +(i.remainingQuantity * i.unitWeight).toFixed(4),
});

// Item Table column headings (in order). Checkbox column comes first and Action column last.
const ITEM_HEADERS = [
  "Sale's Order",
  'Item And Description',
  'Order Date',
  'Order Quantity',
  'Packed Quantity',
  'Total Weight',
  'Action',
];

const CreatePackagePage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerId: '',
    salesOrders: [], // [{ salesOrderId, salesOrderNumber }]
    slipNo: '',
    date: '',
    packageType: '',
    length: '',
    width: '',
    height: '',
    dimUnit: 'cm',
    totalWeight: '',
    totalQuantity: '',
    note: '',
  });
  const [items, setItems] = useState(initialPackageItems);
  const [selectedItems, setSelectedItems] = useState([]);
  const [soOpen, setSoOpen] = useState(false);

  // data coming from the API
  const [customers, setCustomers] = useState([]);
  const [soOptions, setSoOptions] = useState([]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // load customers once
  useEffect(() => {
    getCustomerLookup()
      .then(setCustomers)
      .catch(err => alert(err.message));
  }, []);

  // load the items of the selected sales orders into the Item Table
  const loadItems = async (customerId, salesOrders) => {
    if (salesOrders.length === 0) {
      setItems([]);
      setSelectedItems([]);
      return;
    }
    try {
      const data = await getPackableItems(customerId, salesOrders.map(s => s.salesOrderId));
      setItems(data.map(toItemRow));
      setSelectedItems([]);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCustomerChange = async customerId => {
    setForm(prev => ({ ...prev, customerId, salesOrders: [] }));
    setItems([]);
    setSelectedItems([]);
    setSoOptions([]);
    if (!customerId) return;
    try {
      setSoOptions(await getSalesOrderLookup(customerId));
    } catch (err) {
      alert(err.message);
    }
  };

  const availableSalesOrders = soOptions.filter(
    so => !form.salesOrders.some(s => s.salesOrderId === so.salesOrderId)
  );

  const addSalesOrder = so => {
    const next = [...form.salesOrders, so];
    update('salesOrders', next);
    setSoOpen(false);
    loadItems(form.customerId, next);
  };
  const removeSalesOrder = salesOrderId => {
    const next = form.salesOrders.filter(s => s.salesOrderId !== salesOrderId);
    update('salesOrders', next);
    loadItems(form.customerId, next);
  };

  // packed quantity can never be more than what is left on the sales order
  const updateItemQty = (id, qty) =>
    setItems(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const q = qty === '' ? '' : Math.min(Math.max(Number(qty), 0), i.remaining);
        return {
          ...i,
          quantityToPack: q,
          totalWeight: q === '' ? '' : +(q * i.unitWeight).toFixed(4),
        };
      })
    );
  const removeItem = id => setItems(prev => prev.filter(i => i.id !== id));
  const toggleItem = id =>
    setSelectedItems(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  const allItemsSelected = items.length > 0 && items.every(i => selectedItems.includes(i.id));

  const handleBulkAction = value => {
    if (value === 'delete') {
      setItems(prev => prev.filter(i => !selectedItems.includes(i.id)));
      setSelectedItems([]);
    }
  };

  const goBack = () => navigate('/supply-chain', { state: { tab: 'Packages' } });

  const buildPayload = status => ({
    status,
    customerId: form.customerId,
    packageSlipNumber: form.slipNo,
    packageDate: toISODate(form.date),
    packageType: form.packageType,
    dimensionLength: form.length,
    dimensionWidth: form.width,
    dimensionHeight: form.height,
    dimensionUnit: form.dimUnit,
    totalWeight: form.totalWeight,
    weightUnit: 'Kg',
    totalQuantity: form.totalQuantity,
    quantityUnit: 'Pieces',
    remarks: form.note,
    items: items.map(i => ({
      salesOrderItemId: i.salesOrderItemId,
      itemCode: i.itemCode,
      itemName: i.name,
      itemDescription: i.description,
      itemOrderDate: toISODate(i.orderDate),
      totalQuantity: i.ordered,
      packQuantity: i.quantityToPack,
      packWeight: i.totalWeight,
    })),
  });

  const submit = async status => {
    try {
      await createPackage(buildPayload(status));
      if (status === 'PACKED') goBack();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = () => submit('PACKED');
  const handleSaveDraft = () => submit('DRAFT');
  return (
    <PageLayout
      activeTab="Packages"
      stepper={<CreationStepper title="Package Creation" current="Package" />}
      footer={<PageFooter onSaveDraft={handleSaveDraft} onCancel={goBack} onSave={handleSave} />}
    >
      {/* only this middle area scrolls vertically */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[#1a233a]">New Package</h2>

        {/* ---------- Customer & Sales Order ---------- */}
        {/* ---------- Customer & Sales Order ---------- */}
        <FormSection title="Customer & Sales Order">
          <div className="grid grid-cols-2 gap-6">
            <Field label="Customer Name" required>
              <div className="relative">
                <select
                  value={form.customerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className={`${INPUT} appearance-none pr-9 cursor-pointer ${form.customerId ? '' : 'text-gray-400'}`}
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.customerName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </Field>

            <Field label="Sales Order" required>
              <div className="relative">
                <div
                  onClick={() => setSoOpen(o => !o)}
                  className={`${INPUT} flex items-center gap-2 flex-wrap min-h-[38px] cursor-pointer pr-9`}
                >
                  {form.salesOrders.map(so => (
                    <span
                      key={so.salesOrderId}
                      className="bg-gray-100 text-[12px] px-2 py-0.5 rounded flex items-center gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      {so.salesOrderNumber}
                      <button type="button" onClick={() => removeSalesOrder(so.salesOrderId)}>
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </span>
                  ))}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />

                {soOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setSoOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-1 max-h-60 overflow-y-auto">
                      {!form.customerId ? (
                        <div className="px-3 py-2 text-[12px] text-gray-500">Select a customer first</div>
                      ) : availableSalesOrders.length === 0 ? (
                        <div className="px-3 py-2 text-[12px] text-gray-500">No sales orders left to pack</div>
                      ) : (
                        availableSalesOrders.map(so => (
                          <button
                            key={so.salesOrderId}
                            type="button"
                            onClick={() => addSalesOrder(so)}
                            className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-50 rounded"
                          >
                            {so.salesOrderNumber}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSoOpen(true)}
                className="flex items-center gap-1 text-[11px] text-blue-500 w-fit"
              >
                <PlusCircle className="w-3 h-3" /> Add Sales Order
              </button>
            </Field>
          </div>
        </FormSection>

        {/* ---------- Package Details ---------- */}
        <FormSection title="Package Details">
          <div className="grid grid-cols-3 gap-x-6 gap-y-5">
            <Field label="Package Slip No" required>
              <IconInput
                icon={Settings}
                value={form.slipNo}
                onChange={e => update('slipNo', e.target.value)}
              />
            </Field>

            <Field label="Date" required>
              <DateInput value={form.date} onChange={v => update('date', v)} />
            </Field>

            <Field label="Package Type" required>
              <SelectField
                value={form.packageType}
                onChange={v => update('packageType', v)}
                options={packageTypeOptions}
                placeholder="Select Package Type"
              />
            </Field>

            <Field label="Dimensions (Length X Width X Height)">
              <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden focus-within:border-[#8b5cf6]">
                <input
                  type="number"
                  value={form.length}
                  onChange={e => update('length', e.target.value)}
                  className="w-full min-w-0 px-3 py-2 text-[13px] focus:outline-none"
                />
                <span className="text-gray-400">/</span>
                <input
                  type="number"
                  value={form.width}
                  onChange={e => update('width', e.target.value)}
                  className="w-full min-w-0 px-3 py-2 text-[13px] focus:outline-none"
                />
                <span className="text-gray-400">/</span>
                <input
                  type="number"
                  value={form.height}
                  onChange={e => update('height', e.target.value)}
                  className="w-full min-w-0 px-3 py-2 text-[13px] focus:outline-none"
                />
                <span className="px-3 py-2 text-[12px] text-gray-500 border-l border-gray-200 flex items-center gap-1">
                  {form.dimUnit}
                  <ChevronDown className="w-3 h-3" />
                </span>
              </div>
            </Field>

            <Field label="Total Weight" required>
              <UnitInput value={form.totalWeight} onChange={v => update('totalWeight', v)} unit="Kg" />
            </Field>

            <Field label="Total Quantity" required>
              <UnitInput value={form.totalQuantity} onChange={v => update('totalQuantity', v)} unit="Pieces" />
            </Field>
          </div>
        </FormSection>

        {/* ---------- Item Table ---------- */}
        <FormSection
          title="Item Table"
          action={
            <div className="relative">
              <select
                value=""
                onChange={e => handleBulkAction(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-[13px] text-gray-600 bg-white cursor-pointer focus:outline-none"
              >
                <option value="">Bulk Action</option>
                <option value="delete">Delete Selected</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          }
        >
          <div className="overflow-x-auto -m-5">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8f9fa]">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allItemsSelected}
                      onChange={() =>
                        setSelectedItems(allItemsSelected ? [] : items.map(i => i.id))
                      }
                      className="rounded border-gray-300 cursor-pointer"
                    />
                  </th>
                  {ITEM_HEADERS.map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[13px] font-bold text-[#6b778c] whitespace-nowrap ${i < 2 ? 'text-left' : 'text-center'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={ITEM_HEADERS.length + 1} className="px-4 py-6 text-center text-[13px] text-gray-500">
                      No items.
                    </td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItem(item.id)}
                          className="rounded border-gray-300 cursor-pointer"
                        />
                      </td>
                      {/* Sale's Order */}
                      <td className="px-4 py-3 text-[13px] text-left font-medium text-[#1a233a] whitespace-nowrap">
                        {item.salesOrder}
                      </td>
                      {/* Item And Description */}
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold text-[#1a233a]">{item.name}</div>
                        <div className="text-[12px] text-gray-500">{item.description}</div>
                      </td>
                      {/* Order Date */}
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a] whitespace-nowrap">
                        {item.orderDate || '-'}
                      </td>
                      {/* Order Quantity */}
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a]">
                        {item.ordered}
                      </td>
                      {/* Packed Quantity (editable) */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <input
                          type="number"
                          value={item.quantityToPack}
                          onChange={e => updateItemQty(item.id, e.target.value)}
                          className="w-16 text-center border border-gray-200 rounded px-1 py-1 text-[13px] font-medium focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <span className="text-[11px] text-gray-500 ml-1">Pcs</span>
                      </td>
                      {/* Total Weight */}
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a] whitespace-nowrap">
                        {item.totalWeight || '-'}
                      </td>
                      {/* Action */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 text-red-500 inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </FormSection>

        {/* ---------- Internal Note ---------- */}
        <NoteSection title="Internal Note" value={form.note} onChange={v => update('note', v)} />
      </div>
    </PageLayout>
  );
};

export default CreatePackagePage;