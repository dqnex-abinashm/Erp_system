import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  MoreHorizontal,
  MoreVertical,
  ChevronDown,
  Pencil,
  Printer,
  Send,
  Search,
} from 'lucide-react';
import {
  CARD,
  GRADIENT_BG,
  GRADIENT_TEXT,
  GradientButton,
  RoundIconButton,
  StatusBadge,
  PageLayout,
  WorkflowStepper,
  shipmentDetailsData,
} from './Supplychain';

const detailTabs = ['Overview', 'Package', 'Associate Sales Order'];

// ---------- small local helpers ----------
const InfoCard = ({ title, children, action }) => (
  <div className="border border-sky-100 rounded-xl p-4 bg-white relative">
    {action}
    <h3 className={`text-[17px] font-semibold mb-3 inline-block ${GRADIENT_TEXT}`}>{title}</h3>
    {children}
  </div>
);

const InfoRow = ({ label, value, valueClass = 'text-[#1a233a]' }) => (
  <div className="grid grid-cols-2 py-1.5 text-[13px]">
    <span className="text-gray-500">{label}</span>
    <span className={`font-semibold ${valueClass}`}>{value}</span>
  </div>
);

const initials = name =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

const ShipmentDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [search, setSearch] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState('Overview');

  const selected = shipmentDetailsData.find(s => s.id === id) || shipmentDetailsData[0];

  const listItems = shipmentDetailsData.filter(s =>
    `${s.customerName} ${s.salesOrder}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout activeTab="Shipment" stepper={<WorkflowStepper current="Ship" />}>
      {/* ================= LEFT: shipment list (fixed) ================= */}
      <aside className={`${CARD} w-[270px] shrink-0 flex flex-col p-4 gap-3 min-h-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center cursor-pointer">
            <h2 className={`text-lg font-bold ${GRADIENT_TEXT}`}>All Shipment</h2>
            <ChevronDown className="w-4 h-4 text-[#8b5cf6] ml-1" />
          </div>
          <div className="flex items-center gap-2">
            <RoundIconButton icon={Plus} dark onClick={() => navigate('/supply-chain/shipments/new')} />
            <RoundIconButton icon={MoreHorizontal} />
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, product or item..."
            className="bg-transparent text-[11px] w-full focus:outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {listItems.map(s => {
            const active = s.id === selected.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => navigate(`/supply-chain/shipments/${s.id}`, { replace: true })}
                className={`text-left rounded-xl border p-3 transition-colors ${active
                  ? 'bg-gradient-to-r from-[#fde8e8] to-[#e8e4fb] border-[#ff7a59]/50'
                  : 'bg-[#f8fcff] border-pink-100 hover:border-pink-200'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[14px] font-semibold text-[#1a233a]">{s.customerName}</span>
                  <span className="text-[12px] font-bold text-[#1a233a]">{s.amount}</span>
                </div>
                <div className="text-[11px] text-[#1a233a] mt-1">{s.cardLabel}</div>
                <div className="flex items-center justify-between mt-2 min-h-[18px]">
                  <span>{!active && <StatusBadge status={s.status} />}</span>
                  <span className="text-[10px] text-gray-500">{s.salesOrder}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ================= RIGHT: details (header + tabs fixed, body scrolls) ================= */}
      <section className="flex-1 min-w-0 min-h-0 flex flex-col gap-1.5">
        {/* header */}
        <div className={`${CARD} shrink-0 px-6 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-xl font-bold ${GRADIENT_TEXT}`}>Shipment# {selected.number}</h2>
            <StatusBadge status={selected.status} size="md" className="bg-blue-50 text-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <RoundIconButton icon={Pencil} title="Edit" />
            <RoundIconButton icon={Printer} title="Print" />
            <RoundIconButton icon={Send} title="Send" />
            <GradientButton className="px-4">Mark As Shipped</GradientButton>
            <RoundIconButton icon={MoreVertical} />
          </div>
        </div>

        <div className={`${CARD} flex-1 min-h-0 flex flex-col`}>
          {/* inner tabs */}
          <div className="shrink-0 border-b border-gray-200 px-4">
            <nav className="flex space-x-1">
              {detailTabs.map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveDetailTab(tab)}
                  className={`px-4 py-2 text-[13px] border-b-2 transition-colors whitespace-nowrap
                    ${activeDetailTab === tab
                      ? 'border-black text-black font-bold'
                      : 'border-transparent text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* scrolling body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
            {activeDetailTab === 'Overview' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard title="Customer Profile">
                    <div className="border-t border-gray-200 pt-3 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${GRADIENT_BG} text-white text-[13px] font-bold flex items-center justify-center`}>
                        {initials(selected.profile.company)}
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold text-[#1a233a]">{selected.profile.company}</div>
                        <div className="text-[10px] text-gray-500">{selected.profile.code}</div>
                      </div>
                    </div>
                    <div className="mt-2 pl-[52px]">
                      <InfoRow label="GSTIN" value={selected.profile.gstin} />
                      <InfoRow label="Point Of Contact" value={selected.profile.contact} />
                    </div>
                  </InfoCard>

                  <InfoCard title="Details">
                    <div className="border-t border-gray-200 pt-2">
                      <InfoRow label="Package Number" value={selected.packageNumber} />
                      <InfoRow label="Package Date" value={selected.packageDate} />
                      <InfoRow label="Status" value={selected.status} valueClass="text-blue-600" />
                      <InfoRow label="Total Quantity" value={selected.totalQuantity} />
                      <InfoRow label="Sales Order" value={selected.salesOrder} />
                    </div>
                  </InfoCard>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InfoCard title="Shipment Details">
                    <InfoRow label="Date of Shipment" value={selected.shipmentDate} />
                    <InfoRow label="Carrier" value={selected.carrier} />
                    <InfoRow label="Tracking Status" value={selected.trackingStatus} valueClass="text-blue-600" />
                    <InfoRow label="Shipment Rate" value={selected.shipmentRate} />
                  </InfoCard>

                  <InfoCard
                    title="Notes"
                    action={
                      <button
                        type="button"
                        className="absolute top-3 right-3 w-6 h-6 border border-gray-200 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    }
                  >
                    <div className="bg-gray-100 rounded-lg p-4 text-[13px] text-[#1a233a] whitespace-pre-line min-h-[90px]">
                      {selected.note}
                    </div>
                  </InfoCard>
                </div>

                {/* Shipment order document preview */}
                <div className="relative border border-gray-200 rounded-xl bg-white overflow-hidden p-8 shrink-0">
                  <div className="absolute top-4 -left-8 w-32 -rotate-45 bg-[#2f80ed] text-white text-[10px] text-center py-0.5">
                    {selected.status}
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="text-[12px] text-[#1a233a] leading-5">
                      <div className="text-[15px] font-bold">{selected.company.name}</div>
                      <div>{selected.company.state}</div>
                      <div>{selected.company.country}</div>
                      <div>{selected.company.phone}</div>
                      <div>{selected.company.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[26px] font-extrabold text-[#0f1b3d] tracking-tight">SHIPMENT ORDER</div>
                      <div className="text-[12px] font-semibold text-gray-500">Shipment Order# Trial</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 mt-5 pt-5 flex items-start justify-between">
                    <div className="text-[12px] text-[#1a233a] leading-5">
                      <div className="font-bold">Ship To</div>
                      <div className="font-semibold text-blue-600">{selected.shipTo.name}</div>
                      {selected.shipTo.lines.map(line => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                    <div className="text-[12px] grid grid-cols-[auto_auto] gap-x-10 gap-y-1">
                      <span className="text-gray-500">Sales Order #</span>
                      <span className="font-bold text-right">{selected.salesOrder}</span>
                      <span className="text-gray-500">Order Date</span>
                      <span className="font-bold text-right">{selected.orderDate}</span>
                    </div>
                  </div>

                  <table className="w-full mt-6 border border-[#dbe4f5] rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-[#eaf0fb] text-[12px] text-[#4a5a7a]">
                        <th className="px-3 py-2 text-left font-semibold w-12">#</th>
                        <th className="px-3 py-2 text-left font-semibold">Item & Description</th>
                        <th className="px-3 py-2 text-right font-semibold">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, i) => (
                        <tr key={item.description} className="text-[12px] text-[#1a233a]">
                          <td className="px-3 py-2.5">{i + 1}</td>
                          <td className="px-3 py-2.5">{item.description}</td>
                          <td className="px-3 py-2.5 text-right">{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-5 text-[12px] text-[#1a233a]">
                    <div className="font-bold">Notes</div>
                    <div className="whitespace-pre-line">{selected.note.replace('\n', ' ')}</div>
                  </div>
                </div>
              </>
            )}

            {/* Package and Associate Sales Order tabs: no design shared yet, simple placeholders */}
            {activeDetailTab === 'Package' && (
              <InfoCard title="Package">
                <InfoRow label="Package Number" value={selected.packageNumber} />
                <InfoRow label="Package Date" value={selected.packageDate} />
                <InfoRow label="Total Quantity" value={selected.totalQuantity} />
              </InfoCard>
            )}

            {activeDetailTab === 'Associate Sales Order' && (
              <InfoCard title="Associate Sales Order">
                <InfoRow label="Sales Order#" value={selected.salesOrder} />
                <InfoRow label="Order Date" value={selected.orderDate} />
                <InfoRow label="Customer" value={selected.customerName} />
              </InfoCard>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ShipmentDetailsPage;