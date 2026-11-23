import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Building2,
  Factory,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  MoreHorizontal,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Check,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Briefcase,
  Layers,
  ArrowUpDown,
  MoreVertical,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

// ======================================================
// SHARED DESIGN TOKENS (Matching Supply Chain, Sales & Dashboard)
// ======================================================
const GRADIENT_BG = 'bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8]';
const GRADIENT_TEXT = `${GRADIENT_BG} bg-clip-text text-transparent`;
const CARD = 'bg-white border border-gray-200 rounded-xl shadow-sm';
const INPUT_STYLE =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] placeholder:text-gray-400 bg-white focus:outline-none focus:border-[#8b5cf6] transition-colors';

// Initial Demo Dataset
const initialUsers = [
  {
    id: 1,
    name: 'R. Sharma',
    email: 'admin@gmail.com',
    role: 'Administrator',
    department: 'IT & Systems',
    plant: 'Unit-2',
    shift: 'General',
    phone: '+91 98765 43210',
    lastLogin: 'Today, 09:12 AM',
    status: 'Active',
    avatarBg: 'from-orange-500 to-amber-500',
  },
  {
    id: 2,
    name: 'Sagarika Sethy',
    email: 'sagarika@gmail.com',
    role: 'Sales Manager',
    department: 'Sales & Marketing',
    plant: 'Unit-1',
    shift: 'Shift-A',
    phone: '+91 84745 46665',
    lastLogin: 'Yesterday, 04:30 PM',
    status: 'Active',
    avatarBg: 'from-pink-500 to-rose-500',
  },
  {
    id: 3,
    name: 'Susant Rout',
    email: 'susant.rout@corrmill.com',
    role: 'Plant Manager',
    department: 'Production & Planning',
    plant: 'Unit-2',
    shift: 'General',
    phone: '+91 98349 83983',
    lastLogin: 'Today, 08:45 AM',
    status: 'Active',
    avatarBg: 'from-blue-500 to-indigo-500',
  },
  {
    id: 4,
    name: 'Abinash Patri',
    email: 'abinash.p@corrmill.com',
    role: 'Production Supervisor',
    department: 'Production & Planning',
    plant: 'Unit-2',
    shift: 'Shift-B',
    phone: '+91 94380 12345',
    lastLogin: '21 Nov, 11:20 AM',
    status: 'Active',
    avatarBg: 'from-purple-500 to-violet-500',
  },
  {
    id: 5,
    name: 'Priyanka Das',
    email: 'priyanka.qa@corrmill.com',
    role: 'QC Inspector',
    department: 'Quality Assurance',
    plant: 'Unit-1',
    shift: 'Shift-A',
    phone: '+91 91234 56789',
    lastLogin: '20 Nov, 03:15 PM',
    status: 'Active',
    avatarBg: 'from-emerald-500 to-teal-500',
  },
  {
    id: 6,
    name: 'Rajesh Mohanty',
    email: 'rajesh.inv@corrmill.com',
    role: 'Store Keeper',
    department: 'Inventory & Stores',
    plant: 'Unit-3',
    shift: 'Shift-A',
    phone: '+91 98111 22334',
    lastLogin: '19 Nov, 05:40 PM',
    status: 'Active',
    avatarBg: 'from-amber-500 to-yellow-500',
  },
  {
    id: 7,
    name: 'Bikash Kumar',
    email: 'bikash.logistics@corrmill.com',
    role: 'Logistics Officer',
    department: 'Supply Chain',
    plant: 'Unit-1',
    shift: 'General',
    phone: '+91 97777 88990',
    lastLogin: '18 Nov, 10:10 AM',
    status: 'Inactive',
    avatarBg: 'from-gray-500 to-slate-600',
  },
];

const STATUS_FILTERS = [
  'All Users',
  'Active Users',
  'Inactive Users',
  'Administrator',
  'Plant Manager',
  'Production Supervisor',
  'Sales Manager',
  'QC Inspector',
  'Store Keeper',
];

const ROLES_LIST = [
  'Administrator',
  'Plant Manager',
  'Production Supervisor',
  'Sales Manager',
  'QC Inspector',
  'Store Keeper',
  'Machine Operator',
  'Logistics Officer',
];

const DEPARTMENTS = [
  'IT & Systems',
  'Production & Planning',
  'Sales & Marketing',
  'Quality Assurance',
  'Inventory & Stores',
  'Supply Chain',
];

const PLANTS = ['Unit-1', 'Unit-2', 'Unit-3'];

const ROLE_PERMISSIONS_MATRIX = [
  { module: 'Dashboard & Analytics', admin: true, manager: true, supervisor: true, operator: false, store: false },
  { module: 'Customer & Accounts', admin: true, manager: true, supervisor: false, operator: false, store: false },
  { module: 'Quotes & Estimation', admin: true, manager: true, supervisor: false, operator: false, store: false },
  { module: 'Sales Orders & Invoices', admin: true, manager: true, supervisor: false, operator: false, store: false },
  { module: 'Production & Job Cards', admin: true, manager: true, supervisor: true, operator: true, store: false },
  { module: 'Machine & Maintenance', admin: true, manager: true, supervisor: true, operator: true, store: false },
  { module: 'Inventory & Roll Stock', admin: true, manager: true, supervisor: true, operator: false, store: true },
  { module: 'Purchase & Bills', admin: true, manager: true, supervisor: false, operator: false, store: true },
  { module: 'Supply Chain & Shipping', admin: true, manager: true, supervisor: true, operator: false, store: true },
  { module: 'User Management & Roles', admin: true, manager: false, supervisor: false, operator: false, store: false },
];

const UserManagementPage = () => {
  // Outlet context from Header
  const { searchQuery: headerSearch } = useOutletContext() || { searchQuery: '' };

  const [users, setUsers] = useState(initialUsers);
  const [activeTab, setActiveTab] = useState('Users');
  const [statusFilter, setStatusFilter] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [plantFilter, setPlantFilter] = useState('');

  // Selected checkbox rows
  const [selectedIds, setSelectedIds] = useState([]);

  // Drawer modal state
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form states for New / Edit User
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Administrator',
    department: 'IT & Systems',
    plant: 'Unit-1',
    shift: 'General',
    phone: '',
    status: 'Active',
  });

  // Combine header search + local search
  const effectiveSearch = (searchTerm || headerSearch || '').toLowerCase().trim();

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status / Role dropdown filter
      if (statusFilter === 'Active Users' && u.status !== 'Active') return false;
      if (statusFilter === 'Inactive Users' && u.status !== 'Inactive') return false;
      if (
        statusFilter &&
        statusFilter !== 'All Users' &&
        statusFilter !== 'Active Users' &&
        statusFilter !== 'Inactive Users' &&
        u.role !== statusFilter
      ) {
        return false;
      }

      // Department filter
      if (departmentFilter && u.department !== departmentFilter) return false;

      // Plant filter
      if (plantFilter && u.plant !== plantFilter) return false;

      // Search term
      if (effectiveSearch) {
        const matchesName = u.name.toLowerCase().includes(effectiveSearch);
        const matchesEmail = u.email.toLowerCase().includes(effectiveSearch);
        const matchesRole = u.role.toLowerCase().includes(effectiveSearch);
        const matchesDept = u.department.toLowerCase().includes(effectiveSearch);
        const matchesPlant = u.plant.toLowerCase().includes(effectiveSearch);
        if (!matchesName && !matchesEmail && !matchesRole && !matchesDept && !matchesPlant) {
          return false;
        }
      }

      return true;
    });
  }, [users, statusFilter, departmentFilter, plantFilter, effectiveSearch]);

  // Open drawer for Create or Edit
  const handleOpenDrawer = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        department: userToEdit.department,
        plant: userToEdit.plant,
        shift: userToEdit.shift || 'General',
        phone: userToEdit.phone || '',
        status: userToEdit.status,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'Administrator',
        department: 'IT & Systems',
        plant: 'Unit-1',
        shift: 'General',
        phone: '',
        status: 'Active',
      });
    }
    setShowDrawer(true);
  };

  // Submit Drawer Form
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in Full Name and Email Address');
      return;
    }

    if (editingUser) {
      // Update
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u))
      );
    } else {
      // Create new
      const newUser = {
        id: Date.now(),
        ...formData,
        lastLogin: 'Never logged in',
        avatarBg: 'from-blue-600 to-purple-600',
      };
      setUsers((prev) => [newUser, ...prev]);
    }
    setShowDrawer(false);
  };

  // Delete User
  const handleDeleteUser = (id) => {
    if (window.confirm('Are you sure you want to delete this user account?')) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Select all / toggle single
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Metrics summary
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.status === 'Active').length;
  const departmentCount = new Set(users.map((u) => u.department)).size;
  const plantCount = new Set(users.map((u) => u.plant)).size;

  // Helper for role pill styling
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Administrator':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Plant Manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Production Supervisor':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Sales Manager':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'QC Inspector':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Store Keeper':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <main className="flex-1 min-h-0 overflow-hidden bg-[#f4f7f9] flex flex-col relative p-1.5 gap-1.5 font-sans">
      {/* ====================================================== */}
      {/* 1. SUB-NAVIGATION TABS (Matching Supply Chain & Sales) */}
      {/* ====================================================== */}
      <div className={`${CARD} shrink-0 px-8`}>
        <nav className="flex space-x-1">
          {['Users', 'Roles & Permissions', 'Audit Logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-4 py-2 text-[13px] border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'text-black font-bold border-black'
                  : 'text-gray-500 font-medium border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* ====================================================== */}
      {/* 2. HEADER CARD (Dropdown filter + Action buttons)       */}
      {/* ====================================================== */}
      <div className={`${CARD} shrink-0 px-8 py-3 flex items-center justify-between`}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center space-x-1"
          >
            <h2 className={`text-xl font-bold tracking-tight ${GRADIENT_TEXT} inline-block w-fit`}>
              {statusFilter || 'All Users'}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-[#8b5cf6] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-2 z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 max-h-72 overflow-y-auto custom-scrollbar">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatusFilter(s === 'All Users' ? '' : s);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] text-[#1a233a] transition-colors ${
                      (statusFilter === s || (!statusFilter && s === 'All Users'))
                        ? 'bg-gradient-to-r from-[#fdf0ee] to-[#eeecfd] font-semibold text-black'
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

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => handleOpenDrawer()}
            className={`${GRADIENT_BG} hover:opacity-90 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center transition-opacity shadow-sm cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
            New User
          </button>

          <button
            title="More Options"
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* 3. KPI / METRIC SUMMARY CARDS (Like Dashboard)          */}
      {/* ====================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 shrink-0">
        {/* Metric 1 */}
        <div className={`${CARD} p-4 flex items-center justify-between`}>
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Total Users
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalUsersCount}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              +2 active this month
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff7a59]/15 to-[#d54a88]/15 flex items-center justify-center text-[#ff7a59]">
            <Users className="w-5 h-5" strokeWidth={2.2} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className={`${CARD} p-4 flex items-center justify-between`}>
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Active Accounts
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1">{activeUsersCount}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {Math.round((activeUsersCount / totalUsersCount) * 100)}% verified
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" strokeWidth={2.2} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className={`${CARD} p-4 flex items-center justify-between`}>
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Departments
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1">{departmentCount}</div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">
              Multi-dept assigned
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d54a88]/15 to-[#402de8]/15 flex items-center justify-center text-[#402de8]">
            <Building2 className="w-5 h-5" strokeWidth={2.2} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className={`${CARD} p-4 flex items-center justify-between`}>
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Plant Units
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1">{plantCount} Plants</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
              Unit-1, Unit-2, Unit-3
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 flex items-center justify-center text-blue-600">
            <Factory className="w-5 h-5" strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* 4. MAIN WORKSPACE / TABS CONTENT                       */}
      {/* ====================================================== */}
      {activeTab === 'Users' && (
        <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {/* Table Controls Toolbar */}
          <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
            {/* Search Box */}
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, email or role..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-lg text-xs text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              {/* Department Dropdown */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#8b5cf6] cursor-pointer"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Plant Dropdown */}
              <select
                value={plantFilter}
                onChange={(e) => setPlantFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#8b5cf6] cursor-pointer"
              >
                <option value="">All Plants</option>
                {PLANTS.map((plant) => (
                  <option key={plant} value={plant}>
                    {plant}
                  </option>
                ))}
              </select>

              {(departmentFilter || plantFilter || statusFilter || searchTerm) && (
                <button
                  onClick={() => {
                    setDepartmentFilter('');
                    setPlantFilter('');
                    setStatusFilter('');
                    setSearchTerm('');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 bg-[#f8f9fb] z-10 border-b border-gray-200">
                <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredUsers.length > 0 &&
                        selectedIds.length === filteredUsers.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-3">User & Contact</th>
                  <th className="px-5 py-3 text-center">Assigned Role</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3 text-center">Plant Unit</th>
                  <th className="px-5 py-3 text-center">Default Shift</th>
                  <th className="px-5 py-3">Last Active</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-10 h-10 text-gray-300 mb-2 stroke-1" />
                        <div className="text-sm font-semibold text-gray-600">No users found</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Try adjusting your search criteria or filter options
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedIds.includes(user.id);
                    const initials = user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-gray-50/80 transition-colors group ${
                          isSelected ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-5 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>

                        {/* User & Contact */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                                user.avatarBg || 'from-blue-600 to-indigo-600'
                              } text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0`}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-[#1a233a] text-[13px] group-hover:text-blue-600 transition-colors">
                                {user.name}
                              </div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                <span>{user.email}</span>
                                {user.phone && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span>{user.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Role */}
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadgeStyle(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="px-5 py-3.5 font-medium text-gray-700">
                          {user.department}
                        </td>

                        {/* Plant */}
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold text-[11px]">
                            {user.plant}
                          </span>
                        </td>

                        {/* Shift */}
                        <td className="px-5 py-3.5 text-center text-gray-600 font-medium">
                          {user.shift || 'General'}
                        </td>

                        {/* Last Login */}
                        <td className="px-5 py-3.5 text-gray-500 font-medium text-[11px]">
                          {user.lastLogin}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                user.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}
                            />
                            {user.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenDrawer(user)}
                              title="Edit User"
                              className="w-7 h-7 rounded-lg hover:bg-gray-200/70 text-gray-600 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete User"
                              className="w-7 h-7 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-2.5 border-t border-gray-100 bg-white text-xs text-gray-500 flex justify-between items-center shrink-0">
            <div>
              Showing <span className="font-semibold text-gray-800">{filteredUsers.length}</span>{' '}
              of <span className="font-semibold text-gray-800">{users.length}</span> total users
              {selectedIds.length > 0 && (
                <span className="ml-3 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="px-2.5 py-1 border border-gray-200 rounded-md text-xs text-gray-400 disabled:opacity-50 cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-gray-700">1</span>
              <button
                disabled
                className="px-2.5 py-1 border border-gray-200 rounded-md text-xs text-gray-400 disabled:opacity-50 cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* ROLES & PERMISSIONS TAB                                */}
      {/* ====================================================== */}
      {activeTab === 'Roles & Permissions' && (
        <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden p-6 custom-scrollbar overflow-y-auto">
          <div className="flex items-center justify-between pb-5 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-[#1a233a]">
                Role-Based Access Control (RBAC) Matrix
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage read, write, and approval privileges across corrugation & ERP functional modules
              </p>
            </div>
            <button
              onClick={() => alert('Custom Role creation window opened')}
              className={`${GRADIENT_BG} text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm hover:opacity-90 cursor-pointer flex items-center gap-1`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Role
            </button>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-5">
            {[
              { role: 'Administrator', count: 1, desc: 'Full unrestricted system & plant control' },
              { role: 'Plant Manager', count: 1, desc: 'Production targets, machines & order sign-offs' },
              { role: 'Production Supervisor', count: 1, desc: 'Corrugator scheduling, shifts & job cards' },
              { role: 'Sales Manager', count: 1, desc: 'Customer accounts, quotes & tax invoicing' },
              { role: 'QC Inspector', count: 1, desc: 'Bursting factor, GSM checks & lab testing' },
              { role: 'Store Keeper', count: 1, desc: 'Roll paper stock, GRN & scrap monitoring' },
            ].map((rc) => (
              <div
                key={rc.role}
                className="p-4 border border-gray-200 rounded-xl hover:border-[#8b5cf6] transition-colors bg-gradient-to-b from-gray-50/50 to-white"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeStyle(
                      rc.role
                    )}`}
                  >
                    {rc.role}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">{rc.count} User(s)</span>
                </div>
                <p className="text-xs text-gray-600 mt-2.5 line-clamp-2">{rc.desc}</p>
              </div>
            ))}
          </div>

          {/* Permission Matrix Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fb] border-b border-gray-200">
                <tr className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">
                  <th className="px-5 py-3">ERP Functional Module</th>
                  <th className="px-4 py-3 text-center">Administrator</th>
                  <th className="px-4 py-3 text-center">Plant Manager</th>
                  <th className="px-4 py-3 text-center">Supervisor</th>
                  <th className="px-4 py-3 text-center">Operator</th>
                  <th className="px-4 py-3 text-center">Store Keeper</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ROLE_PERMISSIONS_MATRIX.map((m) => (
                  <tr key={m.module} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3 font-semibold text-[#1a233a]">{m.module}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center font-bold">
                        ✓
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.manager ? (
                        <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="text-gray-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.supervisor ? (
                        <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="text-gray-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.operator ? (
                        <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="text-gray-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.store ? (
                        <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="text-gray-300 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* AUDIT LOGS TAB                                         */}
      {/* ====================================================== */}
      {activeTab === 'Audit Logs' && (
        <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden p-6 custom-scrollbar overflow-y-auto">
          <div className="pb-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-[#1a233a]">Security & Access Activity Logs</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live audit trace of login sessions, role assignments, and permission changes
            </p>
          </div>

          <div className="divide-y divide-gray-100 text-xs mt-3">
            {[
              { action: 'Admin Login Successful (OTP Verified)', user: 'R. Sharma (admin@gmail.com)', ip: '192.168.1.104', time: '10 mins ago' },
              { action: 'Customer Quotation Created (QT-202611-002)', user: 'Sagarika Sethy', ip: '192.168.1.112', time: '42 mins ago' },
              { action: 'Corrugator Job Card Scheduled (JOB-4892)', user: 'Abinash Patri', ip: '192.168.1.108', time: '2 hours ago' },
              { action: 'Tax Invoice Generated (INV-00009)', user: 'Sagarika Sethy', ip: '192.168.1.112', time: 'Yesterday' },
              { action: 'Roll Stock Inventory Adjusted (+1,450 KG)', user: 'Rajesh Mohanty', ip: '192.168.1.115', time: '2 days ago' },
            ].map((log, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between hover:bg-gray-50/70 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a233a] text-[13px]">{log.action}</div>
                    <div className="text-gray-500 text-[11px] mt-0.5">
                      By <span className="font-medium text-gray-700">{log.user}</span> • IP: {log.ip}
                    </div>
                  </div>
                </div>
                <div className="text-gray-400 font-medium text-[11px]">{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* 5. SLIDE-OVER DRAWER (New User / Edit User)            */}
      {/* ====================================================== */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowDrawer(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-[520px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right z-10">
            {/* Drawer Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h2 className={`text-xl font-extrabold tracking-tight ${GRADIENT_TEXT}`}>
                  {editingUser ? 'Edit User Profile' : 'Create New User'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingUser
                    ? 'Update employee permissions and credentials'
                    : 'Add a new employee to the ERP system with plant roles'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSaveUser} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className={INPUT_STYLE}
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Official Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. ramesh@corrmill.com"
                    className={INPUT_STYLE}
                  />
                </div>

                {/* Phone & Shift */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Default Shift
                    </label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      className={INPUT_STYLE}
                    >
                      <option value="General">General Shift</option>
                      <option value="Shift-A">Shift-A (06:00 - 14:00)</option>
                      <option value="Shift-B">Shift-B (14:00 - 22:00)</option>
                      <option value="Shift-C">Shift-C (22:00 - 06:00)</option>
                    </select>
                  </div>
                </div>

                {/* Department & Plant */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className={INPUT_STYLE}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Plant Unit
                    </label>
                    <select
                      value={formData.plant}
                      onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                      className={INPUT_STYLE}
                    >
                      {PLANTS.map((plant) => (
                        <option key={plant} value={plant}>
                          {plant}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Role Assignment */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Designation / Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES_LIST.map((role) => {
                      const isSelected = formData.role === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData({ ...formData, role })}
                          className={`px-3 py-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[#8b5cf6] bg-purple-50 text-[#8b5cf6] font-bold shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className="truncate">{role}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account Status Toggle */}
                <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#1a233a]">Account Status</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Permits authentication and access to ERP modules
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        status: formData.status === 'Active' ? 'Inactive' : 'Active',
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      formData.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.status === 'Active' ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-gray-100 bg-white flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="px-5 py-2 border border-gray-200 text-gray-600 font-bold text-xs rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${GRADIENT_BG} hover:opacity-90 text-white font-bold text-xs px-6 py-2 rounded-full shadow-sm transition-opacity cursor-pointer`}
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default UserManagementPage;
