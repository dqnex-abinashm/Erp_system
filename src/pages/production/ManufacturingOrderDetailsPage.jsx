import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  MoreHorizontal,
  Search,
  Edit,
  Send,
  Printer,
  ChevronDown,
  FileText,
  PackagePlus,
  ShoppingCart,
  Factory,
  Package,
  Truck,
  Receipt,
  Check,
  CheckCircle,
  CreditCard,
  PackageCheck,
  HandCoins,
  ArrowRightLeft,
  Calendar,
  CalendarDays,
  Clock,
  Eye
} from 'lucide-react';

import {
  getManufacturingOrderById,
  getManufacturingOrders,
} from '../../services/manufacturingOrderDetailsApi';

const ManufacturingOrderDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();


  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [detailResult, listResult] = await Promise.all([
          getManufacturingOrderById(id),
          getManufacturingOrders({ limit: 100, offset: 0 }),
        ]);

        if (!cancelled) {
          setOrder(detailResult);
          setOrders(Array.isArray(listResult) ? listResult : []);
        }
      } catch (err) {
        console.error('Failed to load manufacturing order:', err);

        if (!cancelled) {
          setError(
            err.message || 'Unable to load manufacturing order details.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id) {
      loadData();
    } else {
      setError('Manufacturing Order ID is missing.');
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const customer = order?.customer_profile || {};
  const details = order?.details || {};
  const product = order?.product_specification || {};
  const paper = order?.paper_details || {};
  const weight = order?.box_weight_details || {};
  const board = order?.board_details || {};
  const schedule = order?.production_schedule || {};
  const items = Array.isArray(order?.items) ? order.items : [];

  const valueOrDash = (value) =>
    value !== undefined && value !== null && value !== ''
      ? value
      : '—';

  const formatDate = (value) => {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const customerName =
    customer.name ||
    customer.raw?.display_name ||
    customer.raw?.company_name ||
    '—';

  const initials = customerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || '—';

  const visibleOrders = orders.filter((item) => {
    const search = searchTerm.trim().toLowerCase();

    return [
      item.manufacturing_order_number,
      item.manufacturing_order_id,
      item.customer?.display_name,
      item.customer?.company_name,
      item.customer?.customer_name,
      item.customer_code,
      item.sales_order_number,
    ].some((value) =>
      String(value ?? '').toLowerCase().includes(search)
    );
  });

  const tabs = ['Manufacturing Order', 'Job Cards'];
  const [activeTab, setActiveTab] = useState('Manufacturing Order');

  const steps = [
    { name: 'Quote', icon: PackagePlus, status: 'completed' },
    { name: 'Sales order', icon: FileText, status: 'completed' },
    { name: 'Production', icon: Factory, status: 'active' },
    { name: 'Package', icon: Package, status: 'pending' },
    { name: 'Ship', icon: Truck, status: 'pending' },
    { name: 'Invoice', icon: Receipt, status: 'pending' },
    { name: 'Delivered', icon: PackageCheck, status: 'pending' },
    { name: 'Payment', icon: HandCoins, status: 'pending' },
  ];

  return (
    <main className="flex-1 overflow-hidden bg-[#f4f7fb] flex flex-col relative p-1.5 gap-1.5">
      {loading && (
        <div className="m-4 rounded-xl bg-white p-6 text-sm text-gray-500">
          Loading manufacturing order details...
        </div>
      )}

      {!loading && error && (
        <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      {/* Sub Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm shrink-0 px-8">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'Job Cards') navigate('/production', { state: { tab: 'Job Cards' } });
              }}
              className={`flex items-center gap-1 px-4 py-2 text-[13px] border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab
                  ? 'border-[#1a233a] text-[#1a233a] font-bold'
                  : 'border-transparent text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Wrapper */}
      <div
        className={`flex-1 flex flex-col gap-1.5 min-h-0 ${loading || error ? 'hidden' : ''
          }`}
      >

        {/* Top Banner with Stepper */}
        {/* Top Banner with Stepper */}
        <div className="bg-white px-6 py-2 rounded-xl shadow-sm flex-shrink-0">
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block w-fit mb-1">
            Manufacturing Orders
          </h2>

          <div className="flex items-start w-full min-w-[700px] overflow-x-auto hide-scrollbar pb-0 px-2">
            {steps.map((step, index) => {
              const Icon = step.status === 'completed' ? Check : step.icon;

              let textClass = "";
              let iconBgClass = "";
              let iconTextClass = "";
              let lineClass = "bg-gray-200";

              if (step.status === 'completed') {
                textClass = "text-green-600 font-bold";
                iconBgClass = "bg-green-400 ring-4 ring-green-100";
                iconTextClass = "text-white";
                if (index < steps.length - 1 && steps[index + 1].status === 'active') {
                  lineClass = "bg-gradient-to-r from-green-400 to-rose-400";
                } else {
                  lineClass = "bg-green-400";
                }
              } else if (step.status === 'active') {
                textClass = "text-gray-900 font-bold";
                iconBgClass = "bg-gradient-to-br from-[#ff7a59] via-[#d54a88] to-[#402de8] ring-4 ring-pink-50";
                iconTextClass = "text-white";
                lineClass = "bg-gray-200";
              } else {
                textClass = "text-gray-500 font-medium";
                iconBgClass = "bg-white border-2 border-gray-200";
                iconTextClass = "text-gray-400";
                lineClass = "bg-gray-200";
              }

              return (
                <React.Fragment key={step.name}>
                  <div className="flex flex-col items-center shrink-0 w-[90px]">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${iconBgClass} ${iconTextClass}`}>
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <span className={`mt-2 text-[11px] font-medium text-center ${textClass}`}>
                      {step.name}
                    </span>
                  </div>

                  {/* Connecting Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 flex items-start pt-[15px] -mx-[25px]">
                      <div className={`h-[2px] w-full ${lineClass}`}></div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Split View Content */}
        <div className="flex-1 flex overflow-hidden gap-1.5 mt-1.5">

          {/* Left Sidebar (MO List) */}
          <div className="w-[270px] bg-white rounded-2xl border border-gray-200 flex flex-col flex-shrink-0 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1 cursor-pointer">
                  <h3 className="text-[16px] font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent">
                    All MO
                  </h3>
                  <ChevronDown className="w-5 h-5 text-[#8b5cf6]" />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/production/manufacturing/new')}
                    className="w-7 h-7 bg-gray-900 hover:bg-black text-white rounded-full flex items-center justify-center shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full flex items-center justify-center transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search customer, product or item..."
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg pl-8 pr-2 py-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/30 text-[#1a2337] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {/* Active Card */}


              {visibleOrders.map((item) => {
                const isActive =
                  String(item.manufacturing_order_id) === String(id) ||
                  String(item.manufacturing_order_number) === String(id);

                const name =
                  item.customer?.display_name ||
                  item.customer?.company_name ||
                  item.customer?.customer_name ||
                  item.customer_code ||
                  '—';

                return (
                  <div
                    key={item.manufacturing_order_id}
                    onClick={() =>
                      navigate(`/production/manufacturing/${item.manufacturing_order_id}`)
                    }
                    className={`rounded-xl px-3 py-3 cursor-pointer transition-all shadow-sm border mb-2.5 ${isActive
                      ? 'bg-gradient-to-br from-[#fdf0f4] to-[#f4f2ff] border-[#c4b5fd]'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[13px] font-extrabold text-[#111827]">
                        {valueOrDash(item.manufacturing_order_number)}
                      </span>

                      <span className="text-[9px] text-gray-400">
                        {formatDate(item.order_date)}
                      </span>
                    </div>

                    <h3 className="text-[10px] font-bold text-gray-700 mb-2 uppercase truncate">
                      {name}
                    </h3>

                    <div className="flex justify-end mt-1">
                      <span className="text-[11px] font-semibold text-gray-500">
                        {Number(item.total_quantity || 0).toLocaleString('en-IN')} Boxes
                      </span>
                    </div>
                  </div>
                );
              })}

              {visibleOrders.length === 0 && (
                <p className="p-3 text-xs text-gray-400">
                  No manufacturing orders found.
                </p>
              )}
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col gap-1.5 overflow-hidden min-h-0">
            {/* Detail Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <h2 className="text-[22px] font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent">
                  {valueOrDash(order?.manufacturing_order_number)}
                </h2>
                {valueOrDash(details.status || order?.status)}
              </div>
              <div className="flex items-center space-x-3">
                <button className="w-9 h-9 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full flex items-center justify-center text-gray-600 transition-colors shadow-sm">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full flex items-center justify-center text-gray-600 transition-colors shadow-sm">
                  <Send className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full flex items-center justify-center text-gray-600 transition-colors shadow-sm">
                  <Printer className="w-4 h-4" />
                </button>
                <button className="flex items-center px-5 py-2 bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] hover:opacity-90 text-white rounded-full text-[13px] font-semibold transition-opacity shadow-sm">
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Convert to Package
                </button>
                <button className="w-9 h-9 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full flex items-center justify-center text-gray-600 transition-colors shadow-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Details Containers */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-2 pr-1">
              <div className="space-y-2 min-h-full">

                {activeTab === 'Manufacturing Order' ? (
                  <>
                    {/* Top Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                      {/* Customer Profile Box */}
                      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-50">
                          <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">
                            Customer Profile
                          </h3>
                        </div>

                        <div className="p-5 flex-1">
                          <div className="flex items-center mb-6 pb-6 border-b border-gray-50">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff7a59] via-[#d54a88] to-[#402de8] text-white flex items-center justify-center text-[15px] font-bold shadow-sm mr-4 flex-shrink-0">
                              {initials}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-[16px] font-bold text-gray-900">
                                {customerName}
                              </h4>
                              <p className="text-[12px] font-medium text-gray-400 mt-0.5">
                                {valueOrDash(
                                  customer.code ||
                                  customer.raw?.customer_code ||
                                  order?.customer_code
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4 px-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[13px] font-medium text-gray-400">
                                GSTIN
                              </span>
                              <span className="text-[13px] font-bold text-[#111827]">
                                {valueOrDash(
                                  customer.gstin ||
                                  customer.raw?.gstin ||
                                  customer.raw?.GSTIN
                                )}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[13px] font-medium text-gray-400">
                                Point Of Contact
                              </span>
                              <span className="text-[13px] font-bold text-[#111827]">
                                {valueOrDash(
                                  customer.point_of_contact ||
                                  customer.raw?.primary_contact_name ||
                                  customer.raw?.contact_person ||
                                  customer.raw?.primary_first_name ||
                                  customer.raw?.poc ||
                                  order?.sales_order?.poc ||
                                  order?.sales_order?.point_of_contact
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[13px] font-medium text-gray-400">
                                Email
                              </span>
                              <span className="text-[13px] font-bold text-[#111827] break-all text-right">
                                {valueOrDash(
                                  customer.email ||
                                  customer.raw?.email
                                )}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[13px] font-medium text-gray-400">
                                Phone No
                              </span>
                              <span className="text-[13px] font-bold text-[#111827]">
                                {valueOrDash(
                                  customer.phone ||
                                  customer.raw?.primary_phone
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>


                      {/* Details Box */}
                      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-50">
                          <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">
                            Details
                          </h3>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-center">
                          <div className="space-y-4 px-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-medium text-gray-400">Manufacturing Order Number</span>
                              <span className="text-[13px] font-bold text-[#111827]">
                                {valueOrDash(order?.manufacturing_order_number)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-medium text-gray-400">Order Date</span>
                              <span className="text-[13px] font-bold text-[#111827]">{formatDate(order?.order_date)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-medium text-gray-400">Expected Shipment</span>
                              <span className="text-[13px] font-bold text-[#111827]">18/11/2026</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-medium text-gray-400">
                                Manufacturing Start Time
                              </span>
                              <span className="text-[13px] font-bold text-[#111827]">
                                {valueOrDash(
                                  details.manufacturing_start_time ??
                                  order?.manufacturing_start_time
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-medium text-gray-400">
                                Manufacturing End Time
                              </span>
                              <span className="text-[13px] font-bold text-[#111827]">
                                {valueOrDash(
                                  details.manufacturing_end_time ??
                                  order?.manufacturing_end_time
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Product Specification Box */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
                      <div className="px-5 py-4 border-b border-gray-50">
                        <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">
                          Product Specification
                        </h3>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          <div className="bg-[#f0f6ff] rounded-lg p-3.5 flex flex-col justify-center border border-gray-50">
                            <span className="text-[10px] font-medium text-gray-400 mb-1">Paper Type</span>
                            <span className="text-[14px] font-extrabold text-gray-900">{valueOrDash(product?.paper_type)}</span>
                          </div>
                          <div className="bg-[#f0f6ff] rounded-lg p-3.5 flex flex-col justify-center border border-gray-50">
                            <span className="text-[10px] font-medium text-gray-400 mb-1">Box Type</span>
                            <span className="text-[14px] font-extrabold text-gray-900">{valueOrDash(product?.box_type)}</span>
                          </div>
                          <div className="bg-[#f0f6ff] rounded-lg p-3.5 flex flex-col justify-center border border-gray-50">
                            <span className="text-[10px] font-medium text-gray-400 mb-1">Size</span>
                            <span className="text-[14px] font-extrabold text-gray-900">{valueOrDash(product?.box_size || [product?.length, product?.width, product?.height].filter(v => v != null && v !== '').join(' × '))}</span>
                          </div>
                          <div className="bg-[#f0f6ff] rounded-lg p-3.5 flex flex-col justify-center border border-gray-50">
                            <span className="text-[10px] font-medium text-gray-400 mb-1">Ply</span>
                            <span className="text-[14px] font-extrabold text-gray-900">{valueOrDash(product?.ply)}<span className="text-[10px] font-semibold text-gray-500">Ply</span></span>
                          </div>
                          <div className="bg-[#f0f6ff] rounded-lg p-3.5 flex flex-col justify-center border border-gray-50">
                            <span className="text-[10px] font-medium text-gray-400 mb-1">BF</span>
                            <span className="text-[14px] font-extrabold text-gray-900">{valueOrDash(product?.bf)}</span>
                          </div>
                          <div className="bg-[#f0f6ff] rounded-lg p-3.5 flex flex-col justify-center border border-gray-50">
                            <span className="text-[10px] font-medium text-gray-400 mb-1">Quantity</span>
                            <span className="text-[14px] font-extrabold text-gray-900">{valueOrDash(product?.quantity)} <span className="text-[10px] font-semibold text-gray-500">Boxes</span></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Grid (Paper Details & Box Weight) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                      {/* Paper Details */}
                      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-50">
                          <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">
                            Paper Details
                          </h3>
                        </div>
                        <div className="p-5">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-[#f0f6ff] rounded-lg p-4 flex flex-col justify-center border border-gray-50">
                              <span className="text-[11px] font-medium text-gray-400 mb-1">Top Paper</span>
                              <span className="text-[15px] font-extrabold text-gray-900">{valueOrDash(paper?.top_paper_gsm)}</span>
                            </div>
                            <div className="bg-[#f0f6ff] rounded-lg p-4 flex flex-col justify-center border border-gray-50">
                              <span className="text-[11px] font-medium text-gray-400 mb-1">Liner</span>
                              <span className="text-[15px] font-extrabold text-gray-900">{valueOrDash(paper?.liner_gsm)}</span>
                            </div>
                            <div className="bg-[#f0f6ff] rounded-lg p-4 flex flex-col justify-center border border-gray-50">
                              <span className="text-[11px] font-medium text-gray-400 mb-1">Flute</span>
                              <span className="text-[15px] font-extrabold text-gray-900">{valueOrDash(paper?.flute_gsm)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Box Weight */}
                      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-50">
                          <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">
                            Box Weight
                          </h3>
                        </div>
                        <div className="p-5">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#f0f6ff] rounded-lg p-4 flex flex-col justify-center border border-gray-50">
                              <span className="text-[11px] font-medium text-gray-400 mb-1">Box Weight</span>
                              <span className="text-[15px] font-extrabold text-gray-900">
                                {valueOrDash(weight?.box_weight)}
                              </span>
                            </div>
                            <div className="bg-[#f0f6ff] rounded-lg p-4 flex flex-col justify-center border border-gray-50">
                              <span className="text-[11px] font-medium text-gray-400 mb-1">Total Weight</span>
                              <span className="text-[15px] font-extrabold text-gray-900">
                                {valueOrDash(weight?.total_weight)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Board Details */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col mt-2">
                      <div className="px-5 py-4 border-b border-gray-50">
                        <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">
                          Board Details
                        </h3>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Board Size */}
                          <div className="bg-[#fffcf5] rounded-lg p-4 flex flex-col justify-center border border-[#ffedd5]">
                            <span className="text-[11px] font-medium text-gray-500 mb-1">
                              Board Size
                            </span>
                            <span className="text-[15px] font-extrabold text-gray-900">
                              {valueOrDash(board?.board_size)}
                            </span>
                          </div>

                          {/* Number of Two Ply */}
                          <div className="bg-[#fffcf5] rounded-lg p-4 flex flex-col justify-center border border-[#ffedd5]">
                            <span className="text-[11px] font-medium text-gray-500 mb-1">
                              No. Of Plies
                            </span>
                            <span className="text-[15px] font-extrabold text-gray-900">
                              {valueOrDash(board?.two_ply_number)}
                            </span>
                          </div>

                          {/* Number of Top Paper */}
                          <div className="bg-[#fffcf5] rounded-lg p-4 flex flex-col justify-center border border-[#ffedd5]">
                            <span className="text-[11px] font-medium text-gray-500 mb-1">
                              No. Of Papers
                            </span>
                            <span className="text-[15px] font-extrabold text-gray-900">
                              {valueOrDash(board?.top_paper_number)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Component Section */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
                      <div className="px-5 py-4 border-b border-gray-50">
                        <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">
                          Component
                        </h3>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                          {/* Input Material */}
                          <div className="border border-gray-100 rounded-xl overflow-hidden flex flex-col h-full min-h-[218px]">
                            <div className="flex items-center p-3.5 bg-white">
                              <span className="text-[13px] font-bold text-gray-900 ml-1">
                                Input Material
                              </span>
                            </div>
                            <div className="w-full overflow-x-auto">
                              <table className="w-full table-fixed text-left border-collapse">
                                <thead className="bg-[#f9f9f9] border-y border-gray-100">
                                  <tr>
                                    <th className="w-[42%] px-5 py-3.5 text-[11px] font-medium text-gray-400">
                                      Item Name
                                    </th>
                                    <th className="w-[26%] px-3 py-3.5 text-[11px] font-medium text-gray-400">
                                      Required Quantity
                                    </th>
                                    <th className="w-[22%] px-3 py-3.5 text-[11px] font-medium text-gray-400">
                                      Consumed Quantity
                                    </th>
                                    <th className="w-[10%] px-3 py-3.5 text-[11px] font-medium text-gray-400">
                                      Unit
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b border-gray-100">
                                    <td className="px-5 py-4 text-[12px] text-gray-700 break-words">
                                      NS-127CMS-175GSM-18BF
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-gray-700">
                                      200
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-gray-700">
                                      0
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-gray-700">
                                      KG
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Output Material */}
                          <div className="border border-gray-100 rounded-xl overflow-hidden flex flex-col h-full min-h-[218px]">
                            <div className="flex items-center p-3.5 bg-white">
                              <span className="text-[13px] font-bold text-gray-900 ml-1">
                                Output Material
                              </span>
                            </div>
                            <div className="w-full overflow-x-auto">
                              <table className="w-full table-fixed text-left border-collapse">
                                <thead className="bg-[#f9f9f9] border-y border-gray-100">
                                  <tr>
                                    <th className="w-[32%] px-5 py-3.5 text-[11px] font-medium text-gray-400">
                                      Item Name
                                    </th>
                                    <th className="w-[27%] px-3 py-3.5 text-[11px] font-medium text-gray-400">
                                      Required Quantity
                                    </th>
                                    <th className="w-[27%] px-3 py-3.5 text-[11px] font-medium text-gray-400">
                                      Completed Quantity
                                    </th>
                                    <th className="w-[14%] px-3 py-3.5 text-[11px] font-medium text-gray-400">
                                      Unit
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b border-gray-100">
                                    <td className="px-5 py-4 text-[12px] text-gray-700 break-words">
                                      UN-NS-L-5P-11/22/35
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-gray-700">
                                      1,000
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-gray-700">
                                      0
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-gray-700">
                                      Pieces
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Production Schedule */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col mb-4 mt-4">
                      <div className="px-5 py-4 border-b border-gray-50">
                        <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">
                          Production Schedule
                        </h3>
                      </div>
                      <div className="py-8 relative w-full flex justify-between px-4">
                        {/* Connecting line */}
                        <div className="absolute top-[3rem] left-[20%] right-[20%] h-[1px] bg-gray-300 z-[0]"></div>

                        <div className="flex flex-col items-center relative z-10 flex-1">
                          <div className="h-8 flex items-center justify-center bg-white px-4 mb-3">
                            <div className="w-[30px] h-[30px] rounded-full bg-[#75c977] flex items-center justify-center">
                              <CalendarDays className="w-4 h-4 text-white" strokeWidth={2} />
                            </div>
                          </div>
                          <span className="text-[14px] font-medium text-gray-900 mb-1">
                            Work Start Time
                          </span>
                          <span className="text-[13px] font-medium text-[#2f9247] mb-1">
                            {valueOrDash(schedule?.start_time)}
                          </span>
                          {/* <span className="text-[11px] font-medium text-gray-500">06:34 pm IST</span> */}
                        </div>

                        <div className="flex flex-col items-center relative z-10 flex-1">
                          <div className="h-8 flex items-center justify-center bg-white px-4 mb-3">
                            <div className="w-[30px] h-[30px] rounded-full bg-[#fbbc19] flex items-center justify-center">
                              <Clock className="w-4 h-4 text-white" strokeWidth={2} />
                            </div>
                          </div>
                          <span className="text-[14px] font-medium text-gray-900 mb-1">Estimate Time</span>
                          <span className="text-[13px] font-medium text-[#d39f15] mb-1">10.00</span>
                        </div>

                        <div className="flex flex-col items-center relative z-10 flex-1">
                          <div className="h-8 flex items-center justify-center bg-white px-4 mb-3">
                            <div className="w-[30px] h-[30px] rounded-full bg-[#f26c6d] flex items-center justify-center">
                              <CalendarDays className="w-4 h-4 text-white" strokeWidth={2} />
                            </div>
                          </div>
                          <span className="text-[14px] font-medium text-gray-900 mb-1">
                            Work End Time
                          </span>
                          <span className="text-[13px] font-medium text-[#c44344] mb-1">
                            {valueOrDash(schedule?.end_time)}
                          </span>
                          {/* <span className="text-[11px] font-medium text-gray-500">06:34 pm IST</span> */}
                        </div>
                      </div>
                    </div>

                    {/* Job Card */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col mb-4">
                      <div className="px-5 py-4 border-b border-gray-50">
                        <h3 className="text-[15px] font-bold tracking-wide bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block">
                          Job Card
                        </h3>
                      </div>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[750px]">
                          <thead>
                            <tr className="bg-[#fbfbfb] border-b border-gray-100">
                              <th className="px-5 py-3 text-[11px] font-bold text-gray-500 tracking-wide">Job Card Type</th>
                              <th className="px-5 py-3 text-[11px] font-bold text-gray-500 tracking-wide">Job Card No.</th>
                              <th className="px-5 py-3 text-[11px] font-bold text-gray-500 tracking-wide">Department</th>
                              <th className="px-5 py-3 text-[11px] font-bold text-gray-500 tracking-wide">Status</th>
                              <th className="px-5 py-3 text-[11px] font-bold text-gray-500 tracking-wide">Start Date</th>
                              <th className="px-5 py-3 text-[11px] font-bold text-gray-500 tracking-wide">EST. End Date</th>
                              <th className="px-5 py-3 text-[11px] font-bold text-gray-500 tracking-wide">Progress</th>
                              <th className="px-5 py-3 text-[11px] font-bold text-gray-500 tracking-wide text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">Corrugator Job Card</td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">CJC-2026-0912</td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">Corrugation</td>
                              <td className="px-5 py-3.5">
                                <span className="bg-[#dcfce7] text-[#16a34a] text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block">Released</span>
                              </td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">25 Jul 2025</td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">28 Jul 2025</td>
                              <td className="px-5 py-3.5 text-[12px] font-extrabold text-[#1a233a]">92%</td>
                              <td className="px-5 py-3.5 text-center">
                                <button onClick={() => navigate('/production/job-card/CJC-2026-0912')} className="text-[#8b5cf6] hover:text-[#7c3aed] transition-colors inline-block">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">Downstream Job Card</td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">DJC-2026-1548</td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">Die Cutting</td>
                              <td className="px-5 py-3.5">
                                <span className="bg-[#ffedd5] text-[#ea580c] text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block">Pending</span>
                              </td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">27 Jul 2025</td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">29 Jul 2025</td>
                              <td className="px-5 py-3.5 text-[12px] font-extrabold text-[#1a233a]">43%</td>
                              <td className="px-5 py-3.5 text-center">
                                <button onClick={() => navigate('/production/job-card/DJC-2026-1548')} className="text-[#8b5cf6] hover:text-[#7c3aed] transition-colors inline-block">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">QC Inspection Card</td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">QC-2026-2210</td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">Quality Control</td>
                              <td className="px-5 py-3.5">
                                <span className="bg-[#dcfce7] text-[#16a34a] text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block">Released</span>
                              </td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">28 Jul 2025</td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-gray-500">31 Jul 2025</td>
                              <td className="px-5 py-3.5 text-[12px] font-extrabold text-[#1a233a]">98%</td>
                              <td className="px-5 py-3.5 text-center">
                                <button onClick={() => navigate('/production/job-card/QC-2026-2210')} className="text-[#8b5cf6] hover:text-[#7c3aed] transition-colors inline-block">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col p-8 text-center text-gray-500">
                    Content for Job Cards will go here
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ManufacturingOrderDetailsPage;