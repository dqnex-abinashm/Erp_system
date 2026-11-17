import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Settings, ChevronDown } from 'lucide-react';
import {
  INPUT,
  PageLayout,
  PageFooter,
  FormSection,
  Field,
  IconInput,
  NoteSection,
  CreationStepper,
  carrierOptions,
} from './Supplychain';
import { createShipment, toISODate } from '../../services/createShipmentApi';
import { getCustomerLookup } from '../../services/packageLookupApi';
import { getShippablePackages } from '../../services/shipmentLookupApi';
import { getPackageDetails } from '../../services/packageDetailsApi';

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

// Item Table column headings (in order)
const ITEM_HEADERS = [
  "Sale's Order",
  'Item And Description',
  'Order Date',
  'Order Quantity',
  'Packed Quantity',
  'Total Weight',
];

const CreateShipmentPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerId: '',
    packageId: '',
    shipmentOrder: '',
    shipDate: '',
    carrier: '',
    trackingNumber: '',
    trackingUrl: '',
    shippingCharges: '',
    alreadyDelivered: false,
    sendNotification: false,
    note: '',
  });

  // dropdown data from the API
  const [customers, setCustomers] = useState([]);
  const [packageOptions, setPackageOptions] = useState([]);

  // items of the selected package (read only: the whole package is shipped)
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // customers
  useEffect(() => {
    getCustomerLookup()
      .then(setCustomers)
      .catch(err => alert(err.message));
  }, []);

  // when a customer is picked, load that customer's packed packages
  const handleCustomerChange = async customerId => {
    setForm(prev => ({ ...prev, customerId, packageId: '' }));
    setPackageOptions([]);
    setItems([]);

    if (!customerId) return;

    try {
      const list = await getShippablePackages(customerId);
      setPackageOptions(list);
    } catch (err) {
      alert(err.message);
    }
  };

  // when a package slip is picked, load the items inside that package
  const handlePackageChange = async packageId => {
    update('packageId', packageId);
    setItems([]);

    if (!packageId) return;

    setItemsLoading(true);
    try {
      const data = await getPackageDetails(packageId);
      setItems(data.salesOrders);
    } catch (err) {
      alert(err.message);
    } finally {
      setItemsLoading(false);
    }
  };

  const goBack = () => navigate('/supply-chain', { state: { tab: 'Shipment' } });

  const buildPayload = status => ({
    status,
    customerId: form.customerId,
    packageId: form.packageId,
    shipDate: toISODate(form.shipDate),
    carrier: form.carrier,
    trackingNumber: form.trackingNumber,
    trackingUrl: form.trackingUrl,
    shippingCharges: form.shippingCharges,
    isDelivered: form.alreadyDelivered,
    sendStatusNotification: form.sendNotification,
    remarks: form.note,
  });

  const submit = async status => {
    try {
      await createShipment(buildPayload(status));
      goBack();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = () => submit('SHIPPED');
  const handleSaveDraft = () => submit('DRAFT');

  return (
    <PageLayout
      activeTab="Shipment"
      stepper={<CreationStepper title="Shipment Creation" current="Ship" />}
      footer={<PageFooter onSaveDraft={handleSaveDraft} onCancel={goBack} onSave={handleSave} />}
    >
      {/* only this middle area scrolls vertically */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[#1a233a]">New Shipment</h2>

        {/* ---------- Customer & Sales Order ---------- */}
        <FormSection title="Customer & Sales Order">
          <div className="grid grid-cols-2 gap-6">
            {/* Customer Name (from customers) */}
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

            {/* Package Slip No (packed packages of the chosen customer) */}
            <Field label="Package Slip No" required>
              <div className="relative">
                <select
                  value={form.packageId}
                  onChange={e => handlePackageChange(e.target.value)}
                  disabled={!form.customerId}
                  className={`${INPUT} appearance-none pr-9 cursor-pointer ${form.packageId ? '' : 'text-gray-400'}`}
                >
                  <option value="">
                    {!form.customerId
                      ? 'Select customer first'
                      : packageOptions.length === 0
                        ? 'No packed packages for this customer'
                        : 'Select Package Slip No'}
                  </option>
                  {packageOptions.map(p => (
                    <option key={p.packageId} value={p.packageId}>
                      {p.packageSlipNumber} ({p.packageNumber})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </Field>
          </div>
        </FormSection>

        {/* ---------- Shipment Details ---------- */}
        <FormSection title="Shipment Details">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Field label="Shipment Order" required>
              <IconInput
                value={form.shipmentOrder}
                onChange={e => update('shipmentOrder', e.target.value)}
                placeholder=""
              />
            </Field>

            {/* Ship date - calendar icon opens a date picker */}
            <Field label="Ship date" required>
              <DateInput value={form.shipDate} onChange={v => update('shipDate', v)} />
            </Field>

            <Field label="Carrier" required>
              {/* select from list OR type a new carrier */}
              <IconInput
                list="carrier-options"
                value={form.carrier}
                onChange={e => update('carrier', e.target.value)}
                placeholder="Select or type to add"
              />
              <datalist id="carrier-options">
                {carrierOptions.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>

            <Field label="Tracking Number" required>
              <IconInput
                icon={Settings}
                value={form.trackingNumber}
                onChange={e => update('trackingNumber', e.target.value)}
                placeholder="Enter tracking Number"
              />
            </Field>

            <Field label="Shipping Charges (if any)">
              <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden focus-within:border-[#8b5cf6]">
                <span className="px-3 py-2 text-[12px] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center gap-1.5">
                  INR <Settings className="w-3.5 h-3.5 text-gray-500" />
                </span>
                <input
                  type="number"
                  value={form.shippingCharges}
                  onChange={e => update('shippingCharges', e.target.value)}
                  className={`${INPUT} border-0 rounded-none focus:border-0`}
                />
              </div>
            </Field>

            <Field label="Tracking URL" required>
              <IconInput
                value={form.trackingUrl}
                onChange={e => update('trackingUrl', e.target.value)}
                placeholder="Enter tracking URL"
              />
            </Field>
          </div>
        </FormSection>

        {/* ---------- Additional Option ---------- */}
        <FormSection title="Additional Option">
          <div className="grid grid-cols-2 gap-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.alreadyDelivered}
                onChange={e => update('alreadyDelivered', e.target.checked)}
                className="mt-0.5 accent-[#7c3aed]"
              />
              <span>
                <span className="block text-[13px] font-semibold text-[#1a233a]">Shipment Already Delivered</span>
                <span className="block text-[11px] text-gray-500">Mark If This Shipment Has Been Delivered To The Customer</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendNotification}
                onChange={e => update('sendNotification', e.target.checked)}
                className="mt-0.5 accent-[#7c3aed]"
              />
              <span>
                <span className="block text-[13px] font-semibold text-[#1a233a]">Send Status Notification</span>
                <span className="block text-[11px] text-gray-500">Notify Customer About The Shipment Details</span>
              </span>
            </label>
          </div>
        </FormSection>

        {/* ---------- Item Table (items of the selected package) ---------- */}
        <FormSection title="Item Table">
          <div className="overflow-x-auto -m-5">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8f9fa]">
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
                    <td colSpan={ITEM_HEADERS.length} className="px-4 py-6 text-center text-[13px] text-gray-500">
                      {itemsLoading
                        ? 'Loading items...'
                        : form.packageId
                          ? 'No items.'
                          : 'Select a package slip to see its items.'}
                    </td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100">
                      {/* Sale's Order */}
                      <td className="px-4 py-3 text-[13px] text-left font-medium text-[#1a233a] whitespace-nowrap">
                        {item.salesOrderNo}
                      </td>
                      {/* Item And Description */}
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold text-[#1a233a]">{item.item}</div>
                        <div className="text-[12px] text-gray-500">{item.itemDescription}</div>
                      </td>
                      {/* Order Date */}
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a] whitespace-nowrap">
                        {item.orderDate || '-'}
                      </td>
                      {/* Order Quantity */}
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a]">
                        {item.orderedQuantity}
                      </td>
                      {/* Packed Quantity */}
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a] whitespace-nowrap">
                        {item.quantity} <span className="text-[11px] text-gray-500">{item.unit}</span>
                      </td>
                      {/* Total Weight */}
                      <td className="px-4 py-3 text-[13px] text-center font-medium text-[#1a233a] whitespace-nowrap">
                        {item.totalWeight || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </FormSection>

        {/* ---------- Note ---------- */}
        <NoteSection title="Note" value={form.note} onChange={v => update('note', v)} />
      </div>
    </PageLayout>
  );
};

export default CreateShipmentPage;