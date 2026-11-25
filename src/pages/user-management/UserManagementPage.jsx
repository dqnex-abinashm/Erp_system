import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Filter, MoreHorizontal, Edit2, X, ChevronDown, Check } from 'lucide-react';

const DEPARTMENTS = [
  'Sales',
  'Purchase',
  'Operation',
  'Production',
  'Accounts'
];

const ASSIGNABLE_ROLES = [
  'Sales Manager',
  'Purchase Manager',
  'Floor Manager',
  'Operator',
  'Accountant'
];

const initialUsers = [
  { 
    id: 1, 
    name: 'R. Sharma', 
    email: 'r.sharma@corrmill.com', 
    role: 'Floor Manager', 
    department: 'Operation', 
    plant: 'Unit 2', 
    lastLogin: 'Today, 09:12', 
    status: 'Active' 
  },
  { 
    id: 2, 
    name: 'Sagarika Sethy', 
    email: 'sagarika@gmail.com', 
    role: 'Sales Manager', 
    department: 'Sales', 
    plant: 'Unit 1', 
    lastLogin: 'Today, 10:30', 
    status: 'Active' 
  },
  { 
    id: 3, 
    name: 'Susant Rout', 
    email: 'susant.rout@corrmill.com', 
    role: 'Purchase Manager', 
    department: 'Purchase', 
    plant: 'Unit 2', 
    lastLogin: 'Yesterday, 16:45', 
    status: 'Active' 
  },
  { 
    id: 4, 
    name: 'Abinash Patri', 
    email: 'abinash.p@corrmill.com', 
    role: 'Operator', 
    department: 'Production', 
    plant: 'Unit 2', 
    lastLogin: '21 Nov, 14:10', 
    status: 'Active' 
  },
  { 
    id: 5, 
    name: 'Priyanka Das', 
    email: 'priyanka.acc@corrmill.com', 
    role: 'Accountant', 
    department: 'Accounts', 
    plant: 'Unit 1', 
    lastLogin: '20 Nov, 11:25', 
    status: 'Active' 
  }
];

const defaultForm = {
  name: '',
  employeeId: '',
  phone: '',
  email: '',
  department: 'Sales',
  plant: 'Unit-2',
  shift: 'Shift-A',
  roles: ['Sales Manager'],
  status: 'Active'
};

const UserManagementPage = () => {
  // eslint-disable-next-line no-unused-vars
  const { searchQuery } = useOutletContext() || { searchQuery: '' };
  const [users, setUsers] = useState(initialUsers);
  const [activeTab, setActiveTab] = useState('User');
  const [showDrawer, setShowDrawer] = useState(false);
  const [formData, setFormData] = useState(defaultForm);

  const handleRoleToggle = (role) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(role);
      const roles = exists
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter full name');
      return;
    }

    const newUser = {
      id: Date.now(),
      name: formData.name.trim(),
      email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@corrmill.com`,
      role: formData.roles.length > 0 ? formData.roles.join(', ') : 'Operator',
      department: formData.department,
      plant: formData.plant,
      lastLogin: 'Just now',
      status: formData.status
    };

    setUsers((prev) => [newUser, ...prev]);
    setFormData(defaultForm);
    setShowDrawer(false);
  };

  return (
    <main className="flex-1 min-h-0 overflow-hidden bg-[#f4f7f9] flex flex-col relative p-1.5 gap-1.5 font-sans">
      
      {/* Sub Navigation (Matching Supply Chain & Sales tab container) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm shrink-0 px-8">
        <nav className="flex space-x-1">
          {['User', 'Roles & Permissions'].map((tab) => (
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

      {activeTab === 'User' && (
        <>
          {/* Header (Matching Supply Chain & Sales header card) */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm shrink-0 px-8 py-3 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent">
              All users
            </h2>
            <div className="flex items-center space-x-2.5">
              <button 
                onClick={() => {
                  setFormData(defaultForm);
                  setShowDrawer(true);
                }}
                className="bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] hover:opacity-90 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center transition-opacity shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
                New
              </button>
              <button 
                title="Filter"
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <Filter className="w-4 h-4" strokeWidth={2} />
              </button>
              <button 
                title="More"
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Table Card (Matching Sales & Supply Chain table card) */}
          <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="sticky top-0 bg-[#f8f9fb] z-10 border-b border-gray-200">
                  <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5 w-12 text-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer" />
                    </th>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5 text-center">Role</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Plant</th>
                    <th className="px-6 py-3.5">Last Login</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-3.5 text-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer" />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-gray-800 text-[13px]">{user.name}</div>
                        <div className="text-[11px] font-medium text-blue-500 mt-0.5">{user.email}</div>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 font-semibold text-[13px]">
                        {user.department}
                      </td>
                      <td className="px-6 py-3.5 text-gray-800 font-medium text-[13px]">
                        {user.plant}
                      </td>
                      <td className="px-6 py-3.5 text-gray-800 text-[13px] font-medium">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-white text-xs text-gray-500 flex justify-between items-center shrink-0">
              <span>Showing {users.length} user(s)</span>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'Roles & Permissions' && (
        <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-center text-gray-500">
          <h2 className="text-xl font-medium">Roles & Permissions - Coming Soon</h2>
        </div>
      )}

      {/* New User Drawer (With requested Departments & Roles) */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowDrawer(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-[500px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right z-10">
            {/* Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent">
                New User
              </h2>
              <button 
                type="button"
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
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
                    placeholder="Enter full name" 
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors" 
                  />
                </div>

                {/* Employee ID & Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="e.g. EMP-0001" 
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number" 
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors" 
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email ID
                  </label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address" 
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors" 
                  />
                </div>

                {/* Department & Plant */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Department
                    </label>
                    <div className="relative">
                      <select 
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] appearance-none bg-white transition-colors cursor-pointer"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Plant
                    </label>
                    <div className="relative">
                      <select 
                        value={formData.plant}
                        onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] appearance-none bg-white transition-colors cursor-pointer"
                      >
                        <option value="Unit-1">Unit-1</option>
                        <option value="Unit-2">Unit-2</option>
                        <option value="Unit-3">Unit-3</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Shift */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Default Shift
                  </label>
                  <div className="relative">
                    <select 
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] appearance-none bg-white transition-colors cursor-pointer"
                    >
                      <option value="Shift-A">Shift-A</option>
                      <option value="Shift-B">Shift-B</option>
                      <option value="Shift-C">Shift-C</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Assign Role (Requested: Sales Manager, Purchase Manager, Floor Manager, Operator, Accountant) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Assign Role
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {ASSIGNABLE_ROLES.map((role) => {
                      const isChecked = formData.roles.includes(role);
                      return (
                        <label 
                          key={role} 
                          className={`flex items-center justify-between border rounded-lg px-3 py-2.5 cursor-pointer transition-all bg-white ${
                            isChecked
                              ? 'border-[#8b5cf6] bg-purple-50/40 text-[#8b5cf6] font-semibold'
                              : 'border-gray-200 hover:border-[#8b5cf6] text-gray-700'
                          }`}
                        >
                          <span className="text-[12px]">{role}</span>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleRoleToggle(role)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer" 
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Account Active */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-xs font-bold text-[#1a233a]">Account Active</span>
                    <div className="text-[11px] text-gray-400">Allow login access</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        status: prev.status === 'Active' ? 'Inactive' : 'Active',
                      }))
                    }
                    className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none cursor-pointer ${
                      formData.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.status === 'Active' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

              </div>

              {/* Footer */}
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
                  className="bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] hover:opacity-90 text-white font-bold text-xs px-6 py-2 rounded-full shadow-sm transition-opacity cursor-pointer"
                >
                  Save User
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
