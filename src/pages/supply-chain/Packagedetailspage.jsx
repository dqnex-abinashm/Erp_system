import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  MoreHorizontal,
  MoreVertical,
  ChevronDown,
  ChevronUp,
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
} from './Supplychain';
import { getPackages } from '../../services/packageListApi';
import { getPackageDetails } from '../../services/packageDetailsApi';

// ---------- small local helpers ----------
const InfoCard = ({ title, children }) => (
  <div className="border border-sky-100 rounded-xl p-4 bg-white">
    {title && <h3 className={`text-[17px] font-semibold mb-3 inline-block ${GRADIENT_TEXT}`}>{title}</h3>}
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
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

const PackageDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [search, setSearch] = useState('');
  const [soOpen, setSoOpen] = useState(true);
  const [specOpen, setSpecOpen] = useState(true);
  const [remarks, setRemarks] = useState('');

  // data from the API
  const [packages, setPackages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // left list
  useEffect(() => {
    getPackages()
      .then(setPackages)
      .catch(err => console.error(err.message));
  }, []);

  // selected package
  useEffect(() => {
    let ignore = false;
    setLoading(true);

    getPackageDetails(id)
      .then(data => {
        if (ignore) return;
        setSelected(data);
        setRemarks(data.remarks || '');
      })
      .catch(err => {
        console.error(err.message);
        if (!ignore) setSelected(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const listItems = packages.filter(p =>
    `${p.customerName} ${p.packageNo}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout activeTab="Packages" stepper={<WorkflowStepper current="Package" />}>
      {/* ================= LEFT: package list (fixed) ================= */}
      <aside className={`${CARD} w-[270px] shrink-0 flex flex-col p-4 gap-3 min-h-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center cursor-pointer">
            <h2 className={`text-lg font-bold ${GRADIENT_TEXT}`}>All Package</h2>
            <ChevronDown className="w-4 h-4 text-[#8b5cf6] ml-1" />
          </div>
          <div className="flex items-center gap-2">
            <RoundIconButton icon={Plus} dark onClick={() => navigate('/supply-chain/packages/new')} />
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
          {listItems.map(p => {
            const active = String(p.id) === String(id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/supply-chain/packages/${p.id}`, { replace: true })}
                className={`text-left rounded-xl border p-3 transition-colors ${active
                  ? 'bg-gradient-to-r from-[#fde8e8] to-[#e8e4fb] border-[#ff7a59]/50'
                  : 'bg-[#f8fcff] border-pink-100 hover:border-pink-200'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[14px] font-semibold text-[#1a233a]">Package# {p.packageNo}</span>
                  <span className="text-[10px] text-gray-500">{p.packageDate}</span>
                </div>
                <div className="text-[11px] text-[#1a233a] mt-1">{p.customerName}</div>
                <div className="flex items-center justify-between mt-2 min-h-[18px]">
                  <span>{!active && <StatusBadge status={p.status} />}</span>
                  <span className="text-[12px] font-bold text-[#1a233a]">{p.quantity}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ================= RIGHT: details (header fixed, body scrolls) ================= */}
      {!selected ? (
        <section className="flex-1 min-w-0 min-h-0 flex flex-col">
          <div className={`${CARD} flex-1 flex items-center justify-center text-[14px] text-gray-500`}>
            {loading ? 'Loading package...' : 'Package not found.'}
          </div>
        </section>
      ) : (
        <section className="flex-1 min-w-0 min-h-0 flex flex-col gap-1.5">
          {/* header */}
          <div className={`${CARD} shrink-0 px-6 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <h2 className={`text-xl font-bold ${GRADIENT_TEXT}`}>Package# {selected.packageNumber}</h2>
              <StatusBadge status={selected.status} size="md" />
            </div>
            <div className="flex items-center gap-2">
              <RoundIconButton icon={Pencil} title="Edit" />
              <RoundIconButton icon={Printer} title="Print" />
              <RoundIconButton icon={Send} title="Send" />
              <GradientButton className="px-4">Convert To Shipped</GradientButton>
              <RoundIconButton icon={MoreVertical} />
            </div>
          </div>

          {/* scrolling body */}
          <div className={`${CARD} flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3`}>
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

              <InfoCard title="Package Information">
                <div className="border-t border-gray-200 pt-2">
                  <InfoRow label="Sales Order Number" value={selected.salesOrderNumbers} />
                  <InfoRow label="Sales Order Date" value={selected.salesOrderDate} />
                  <InfoRow label="Expected Shipment Date" value={selected.expectedShipmentDate} />
                  <InfoRow label="Packaging Status" value={selected.packagingStatus} valueClass="text-blue-600" />
                  <InfoRow label="Total Quantity" value={selected.totalQuantity} />
                </div>
              </InfoCard>
            </div>

            {/* Billing & Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm border border-[#eef2f6] flex flex-col lg:flex-row">
              <div className="flex-1 p-6">
                <h5 className="text-[15px] font-semibold text-gray-500 mb-4">Billing Address</h5>
                <div className="text-[13px] text-[#1a233a] font-medium leading-relaxed">
                  <div>{selected.billing.name}</div>
                  {selected.billing.lines.map(line => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="w-auto mx-6 lg:mx-0 lg:w-[2px] h-[1px] lg:h-auto bg-pink-200/60 lg:my-6 rounded-full"></div>

              <div className="flex-1 p-6">
                <h5 className="text-[15px] font-semibold text-gray-500 mb-4">Shipping Address</h5>
                <div className="text-[13px] text-[#1a233a] font-medium leading-relaxed">
                  <div>{selected.shipping.name}</div>
                  {selected.shipping.lines.map(line => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sales Order Details (collapsible) */}
            {/* Package Specification (collapsible) */}
            <div className="border border-sky-100 rounded-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className={`text-[17px] font-semibold ${GRADIENT_TEXT}`}>Package Specification</h3>
                <button type="button" onClick={() => setSpecOpen(o => !o)} className="text-gray-500">
                  {specOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              {specOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="bg-[#f8f9fa]">
                        {['Package Slip', 'Package Type', 'Date', 'Dimension', 'Total Weight'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[13px] font-bold text-[#6b778c] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.packageSpecs.map(spec => (
                        <tr key={spec.slip} className="border-t border-gray-100">
                          <td className="px-4 py-3 text-[13px] font-semibold text-[#1a233a] whitespace-nowrap">{spec.slip}</td>
                          <td className="px-4 py-3 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{spec.type}</td>
                          <td className="px-4 py-3 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{spec.date}</td>
                          <td className="px-4 py-3 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{spec.dimension}</td>
                          <td className="px-4 py-3 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{spec.totalWeight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sales Order Details (collapsible) */}
            <div className="border border-sky-100 rounded-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className={`text-[17px] font-semibold ${GRADIENT_TEXT}`}>Sales Order Details</h3>
                <button type="button" onClick={() => setSoOpen(o => !o)} className="text-gray-500">
                  {soOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              {soOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="bg-[#f8f9fa]">
                        {['Sales Order', 'Item Details', 'Order Date', 'Total Weight', 'Total Quantity', 'Unit'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[13px] font-bold text-[#6b778c] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.salesOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-[13px] text-gray-500">
                            No items.
                          </td>
                        </tr>
                      ) : (
                        selected.salesOrders.map(so => (
                          <tr key={so.id} className="border-t border-gray-100">
                            <td className="px-4 py-3 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{so.salesOrderNo}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-[13px] font-semibold text-[#1a233a]">{so.item}</div>
                              {so.itemDescription && (
                                <div className="text-[12px] text-gray-500">{so.itemDescription}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{so.orderDate}</td>
                            <td className="px-4 py-3 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{so.totalWeight}</td>
                            <td className="px-4 py-3 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{so.quantity}</td>
                            <td className="px-4 py-3 text-[13px] font-medium text-[#1a233a] whitespace-nowrap">{so.unit}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Remarks & Note */}
            <div className="border border-sky-100 rounded-xl p-4">
              <h3 className={`text-[17px] font-semibold mb-2 inline-block ${GRADIENT_TEXT}`}>Remarks & Note</h3>
              <div className="border-t border-gray-200 pt-3">
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full h-24 border border-gray-200 rounded-lg p-3 text-[13px] resize-none focus:outline-none focus:border-[#8b5cf6]"
                />
                <p className="text-[11px] text-gray-400 mt-2">It Will Not Be Shown In PDF</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
};

export default PackageDetailsPage;