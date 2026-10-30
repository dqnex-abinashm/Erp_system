import React, { useState } from 'react';
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
  customerOptions,
  salesOrderOptions,
  packageTypeOptions,
  initialPackageItems,
} from './Supplychain';

// input + unit select inside one bordered box (Net Weight / Gross Weight)
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

const CreatePackagePage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer: 'Ms. Priya Das',
    salesOrders: ['SO-00001'],
    slipNo: 'Pack-Slip-001',
    date: '17/10/2026',
    packageType: '',
    length: '',
    width: '',
    height: '',
    dimUnit: 'cm',
    netWeight: '',
    // NOTE: design shows a 2nd "Package Type" label here (probably "Gross Weight").
    // Kept as in the design for now - change the label below when confirmed.
    grossWeight: '',
    note: '',
  });
  const [items, setItems] = useState(initialPackageItems);
  const [selectedItems, setSelectedItems] = useState([]);
  const [soOpen, setSoOpen] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const availableSalesOrders = salesOrderOptions.filter(so => !form.salesOrders.includes(so));

  const addSalesOrder = so => {
    update('salesOrders', [...form.salesOrders, so]);
    setSoOpen(false);
  };
  const removeSalesOrder = so =>
    update('salesOrders', form.salesOrders.filter(s => s !== so));

  const updateItemQty = (id, qty) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, quantityToPack: qty } : i)));
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

  const handleSave = () => {
    console.log('Save package', { ...form, items });
    goBack();
  };
  const handleSaveDraft = () => console.log('Save draft package', { ...form, items });

  return (
    <PageLayout
      activeTab="Packages"
      steps={['Package Creation', 'Package Listed']}
      footer={<PageFooter onSaveDraft={handleSaveDraft} onCancel={goBack} onSave={handleSave} />}
    >
      {/* only this middle area scrolls vertically */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[#1a233a]">New Package</h2>

        {/* ---------- Customer & Sales Order ---------- */}
        <FormSection title="Customer & Sales Order">
          <div className="grid grid-cols-2 gap-6">
            <Field label="Customer Name" required>
              <SelectField
                value={form.customer}
                onChange={v => update('customer', v)}
                options={customerOptions}
                placeholder="Select Customer"
              />
            </Field>

            <Field label="Sales Order" required>
              <div className="relative">
                <div
                  onClick={() => setSoOpen(o => !o)}
                  className={`${INPUT} flex items-center gap-2 flex-wrap min-h-[38px] cursor-pointer pr-9`}
                >
                  {form.salesOrders.map(so => (
                    <span
                      key={so}
                      className="bg-gray-100 text-[12px] px-2 py-0.5 rounded flex items-center gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      {so}
                      <button type="button" onClick={() => removeSalesOrder(so)}>
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </span>
                  ))}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />

                {soOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setSoOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-1">
                      {availableSalesOrders.length === 0 ? (
                        <div className="px-3 py-2 text-[12px] text-gray-500">No more sales orders</div>
                      ) : (
                        availableSalesOrders.map(so => (
                          <button
                            key={so}
                            type="button"
                            onClick={() => addSalesOrder(so)}
                            className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-50 rounded"
                          >
                            {so}
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
              <IconInput
                icon={Calendar}
                value={form.date}
                onChange={e => update('date', e.target.value)}
                placeholder="DD/MM/YYYY"
              />
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

            <Field label="Net Weight" required>
              <UnitInput value={form.netWeight} onChange={v => update('netWeight', v)} />
            </Field>

            <Field label="Package Type" required>
              <UnitInput value={form.grossWeight} onChange={v => update('grossWeight', v)} />
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
                  {['Items & Description', 'Sales Order#', 'Ordered', 'Packed', 'Quantity To Pack', 'Stock On Hand', 'Unit', 'Action'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[13px] font-bold text-[#6b778c] whitespace-nowrap ${i === 0 ? 'text-left' : 'text-center'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-[13px] text-gray-500">
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
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold text-[#1a233a]">{item.name}</div>
                        <div className="text-[12px] text-gray-500">{item.description}</div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a]">{item.salesOrder}</td>
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a]">{item.ordered}</td>
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a]">{item.packed}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <input
                          type="number"
                          value={item.quantityToPack}
                          onChange={e => updateItemQty(item.id, e.target.value)}
                          className="w-16 text-center border border-gray-200 rounded px-1 py-1 text-[13px] font-medium focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <span className="text-[11px] text-gray-500 ml-1">Pcs</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a] whitespace-nowrap">
                        {item.stockOnHand} <span className="text-[11px] text-gray-500">Pcs</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a]">{item.unit}</td>
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