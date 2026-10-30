import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, ChevronDown } from 'lucide-react';
import SalesTable from './SalesTable';

const STATUS_FILTERS = [
  'Draft',
  'Confirm',
  'Overdue',
  'Parietally Invoice',
  'Invoice',
  'To Be Ship',
  'Shipped',
  'Closed',
];

const SalesPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const tabs = [
    { name: 'Quotes', path: '/sales/quotes' },
    { name: 'Sales Orders', path: '/sales/orders' },
    { name: 'Invoices', path: '/sales/invoices' },
    { name: 'Payments', path: '/sales/payments' }
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#f4f7f9] flex flex-col relative p-1.5 gap-1.5">

      {/* Sub Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm shrink-0 px-8">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-1 px-4 py-2 text-[13px] border-b-2 transition-colors whitespace-nowrap ${tab.name === 'Sales Orders'
                ? 'text-black font-bold border-black'
                : 'text-gray-500 font-medium border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm shrink-0 px-8 py-3 flex items-center justify-between">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center space-x-1"
          >
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent inline-block w-fit">
              {statusFilter || 'All Sale Orders'}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-[#8b5cf6] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-2 z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatusFilter(statusFilter === s ? '' : s);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] text-[#1a233a] ${statusFilter === s
                        ? 'bg-gradient-to-r from-[#fdf0ee] to-[#eeecfd]'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors">
            <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <SalesTable statusFilter={statusFilter} />
      </div>

    </main>
  );
};

export default SalesPage;
