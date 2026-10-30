import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Settings, PlusCircle } from 'lucide-react';
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
  carrierOptions,
} from './Supplychain';

const CreateShipmentPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer: 'Ms. Priya Das',
    salesOrder: 'SO-00001',
    packageSlipNo: 'Pack-Slip-001',
    shipmentOrder: '17/10/2026',
    shipDate: '17/10/2026',
    carrier: '',
    trackingNumber: '',
    trackingUrl: '',
    shippingCharges: '',
    alreadyDelivered: false,
    sendNotification: false,
    note: '',
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const goBack = () => navigate('/supply-chain', { state: { tab: 'Shipment' } });

  const handleSave = () => {
    console.log('Save shipment', form);
    goBack();
  };
  const handleSaveDraft = () => console.log('Save draft shipment', form);

  return (
    <PageLayout
      activeTab="Shipment"
      steps={['Shipment Creation', 'Shipment Listed']}
      footer={<PageFooter onSaveDraft={handleSaveDraft} onCancel={goBack} onSave={handleSave} />}
    >
      {/* only this middle area scrolls vertically */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[#1a233a]">New Shipment</h2>

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
              <SelectField
                value={form.salesOrder}
                onChange={v => update('salesOrder', v)}
                options={salesOrderOptions}
                placeholder="Select Sales Order"
              />
              <button type="button" className="flex items-center gap-1 text-[11px] text-blue-500 w-fit">
                <PlusCircle className="w-3 h-3" /> Add Sales Order
              </button>
            </Field>
          </div>
        </FormSection>

        {/* ---------- Shipment Details ---------- */}
        <FormSection title="Shipment Details">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Field label="Package Slip No" required>
              <IconInput
                icon={Settings}
                value={form.packageSlipNo}
                onChange={e => update('packageSlipNo', e.target.value)}
              />
            </Field>

            <Field label="Shipment Order" required>
              <IconInput
                icon={Calendar}
                value={form.shipmentOrder}
                onChange={e => update('shipmentOrder', e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </Field>

            <Field label="Ship date" required>
              <IconInput
                icon={Settings}
                value={form.shipDate}
                onChange={e => update('shipDate', e.target.value)}
                placeholder="DD/MM/YYYY"
              />
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

            <Field label="Tracking URL" required>
              <IconInput
                value={form.trackingUrl}
                onChange={e => update('trackingUrl', e.target.value)}
                placeholder="Enter tracking URL"
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

        {/* ---------- Note ---------- */}
        <NoteSection title="Note" value={form.note} onChange={v => update('note', v)} />
      </div>
    </PageLayout>
  );
};

export default CreateShipmentPage;