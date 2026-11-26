import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Filter, MoreHorizontal, Edit2, X, ChevronDown, Trash2 } from 'lucide-react';
import { userManagementApi } from '../../services/userManagementApi';

const DEFAULT_DEPARTMENTS = ['Sales', 'Purchase', 'Operation', 'Production', 'Accounts'];
const DEFAULT_PLANTS = ['Unit-1', 'Unit-2', 'Unit-3'];
const DEFAULT_SHIFTS = ['Shift-A', 'Shift-B', 'Shift-C'];
const DEFAULT_ROLES = ['Sales Manager', 'Purchase Manager', 'Floor Manager', 'Operator', 'Accountant'];

const defaultForm = {
  firstName: '',
  lastName: '',
  username: '',
  employeeId: '',
  phone: '',
  email: '',
  password: '',
  gender: '',
  designation: '',
  department: 'Sales',
  plant: 'Unit-2',
  shift: 'Shift-A',
  roles: ['Sales Manager'],
  status: 'Active',
};

function formatLastLogin(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const UserManagementPage = () => {
  const { searchQuery } = useOutletContext() || { searchQuery: '' };
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({
    departments: DEFAULT_DEPARTMENTS.map((name, idx) => ({ id: idx + 1, name })),
    plants: DEFAULT_PLANTS.map((name, idx) => ({ id: idx + 1, name })),
    shifts: DEFAULT_SHIFTS.map((name, idx) => ({ id: idx + 1, name })),
    roles: DEFAULT_ROLES.map((name, idx) => ({ id: idx + 1, name })),
  });
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [activeTab, setActiveTab] = useState('User');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [metaData, usersData, rolesData] = await Promise.all([
        userManagementApi.getMeta(),
        userManagementApi.getUsers(),
        userManagementApi.getRoles(),
      ]);
      if (metaData) setMeta(metaData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRolesList(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to load users from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const assignableRoles = useMemo(() => {
    const dbNames = (meta.roles || []).map((r) => r.name);
    const filtered = DEFAULT_ROLES.filter((r) => dbNames.length === 0 || dbNames.includes(r));
    const extras = dbNames.filter((r) => !filtered.includes(r));
    return [...filtered, ...extras];
  }, [meta.roles]);

  const filteredUsers = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.username, u.employeeId, u.department, u.plant, u.role]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  const handleOpenNew = () => {
    setEditingUserId(null);
    setFormError('');
    setFormData(defaultForm);
    setShowDrawer(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUserId(user.id);
    setFormError('');
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      employeeId: user.employeeId || '',
      phone: user.mobile || user.phone || '',
      email: user.email || '',
      password: '',
      gender: user.gender || '',
      designation: user.designation || '',
      department: user.department || 'Sales',
      plant: user.plant || 'Unit-2',
      shift: user.shift || 'Shift-A',
      roles: Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : ['Sales Manager'],
      status: user.status || (user.isActive ? 'Active' : 'Inactive'),
    });
    setShowDrawer(true);
  };

  const handleRoleToggle = (roleName) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(roleName);
      const roles = exists ? prev.roles.filter((r) => r !== roleName) : [...prev.roles, roleName];
      return { ...prev, roles };
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('First Name and Last Name are required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email ID is required.');
      return;
    }
    if (formData.roles.length === 0) {
      setFormError('Please select at least one role.');
      return;
    }

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim() || undefined,
      employeeId: formData.employeeId.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      password: formData.password.trim() || undefined,
      gender: formData.gender || undefined,
      designation: formData.designation.trim(),
      department: formData.department,
      plant: formData.plant,
      shift: formData.shift,
      roles: formData.roles,
      status: formData.status,
      isActive: formData.status === 'Active',
    };

    setSaving(true);
    try {
      if (editingUserId) {
        const updated = await userManagementApi.updateUser(editingUserId, payload);
        setUsers((prev) => prev.map((u) => (u.id === editingUserId ? updated : u)));
      } else {
        const created = await userManagementApi.createUser(payload);
        setUsers((prev) => [created, ...prev]);
      }
      setShowDrawer(false);
      setFormData(defaultForm);
      setEditingUserId(null);
      userManagementApi.getRoles().then(setRolesList).catch(() => {});
    } catch (err) {
      setFormError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete user "${user.name}" (${user.email})?`)) return;
    try {
      await userManagementApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      userManagementApi.getRoles().then(setRolesList).catch(() => {});
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete user');
    }
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

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'User' && (
        <>
          {/* Header (Matching Supply Chain & Sales header card) */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm shrink-0 px-8 py-3 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent">
              All users
            </h2>
            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleOpenNew}
                className="bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] hover:opacity-90 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center transition-opacity shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
                New
              </button>
              <button
                onClick={loadData}
                title="Refresh"
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

          {/* Table Card */}
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
                    <th className="px-6 py-3.5">Shift</th>
                    <th className="px-6 py-3.5">Last Login</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-gray-400 text-xs">
                        Loading users from database...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-gray-400 text-xs">
                        No users found. Click "+ New" to create a user.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-3.5 text-center">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer" />
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-gray-800 text-[13px]">
                            {user.name}
                            {user.employeeId ? (
                              <span className="ml-2 text-[10px] font-mono text-gray-400">({user.employeeId})</span>
                            ) : null}
                          </div>
                          <div className="text-[11px] font-medium text-blue-500 mt-0.5">{user.email}</div>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600 font-semibold text-[13px]">
                          {user.department || '—'}
                        </td>
                        <td className="px-6 py-3.5 text-gray-800 font-medium text-[13px]">
                          {user.plant || '—'}
                        </td>
                        <td className="px-6 py-3.5 text-gray-600 text-[13px]">
                          {user.shift || '—'}
                        </td>
                        <td className="px-6 py-3.5 text-gray-800 text-[13px] font-medium">
                          {formatLastLogin(user.lastLogin)}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              user.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
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
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(user)}
                              title="Edit User"
                              className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              title="Delete User"
                              className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-white text-xs text-gray-500 flex justify-between items-center shrink-0">
              <span>Showing {filteredUsers.length} user(s)</span>
            </div>
          </div>
        </>
      )}

      {activeTab === 'Roles & Permissions' && (
        <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-8 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent">
              Roles & Permissions
            </h2>
            <span className="text-xs text-gray-500 font-medium">{rolesList.length} Active Roles</span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#f8f9fb] border-b border-gray-200">
                <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-8 py-3.5">Role Code</th>
                  <th className="px-6 py-3.5">Role Name</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5 text-center">Assigned Users</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {rolesList.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-8 py-3.5 font-mono text-xs text-gray-600">{role.code}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        {role.name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 text-[13px]">{role.description}</td>
                    <td className="px-6 py-3.5 text-center font-semibold text-gray-800 text-[13px]">
                      {role.userCount}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New / Edit User Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowDrawer(false)}
          />

          <div className="relative w-full max-w-[500px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right z-10">
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] bg-clip-text text-transparent">
                {editingUserId ? 'Edit User' : 'New User'}
              </h2>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-5">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium">
                    {formError}
                  </div>
                )}

                {/* First Name & Last Name (Split per schema NOT NULL requirement) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="First name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Last name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                    />
                  </div>
                </div>

                {/* Employee ID & Username */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="e.g. EMP-0002"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Auto if empty"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                    />
                  </div>
                </div>

                {/* Email ID & Phone Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@company.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Phone Number
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

                {/* Gender & Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] appearance-none bg-white transition-colors cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      {editingUserId ? 'New Password' : 'Password'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUserId ? 'Leave blank to keep' : 'Default: Welcome@123'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                    />
                  </div>
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
                        {(meta.departments || []).map((dept) => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name}
                          </option>
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
                        {(meta.plants || []).map((plant) => (
                          <option key={plant.id} value={plant.name}>
                            {plant.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Default Shift & Designation */}
                <div className="grid grid-cols-2 gap-3">
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
                        {(meta.shifts || []).map((shift) => (
                          <option key={shift.id} value={shift.name}>
                            {shift.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Executive"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1a233a] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                    />
                  </div>
                </div>

                {/* Assign Role */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Assign Role
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {assignableRoles.map((role) => {
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
                  disabled={saving}
                  className="bg-gradient-to-r from-[#ff7a59] via-[#d54a88] to-[#402de8] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs px-6 py-2 rounded-full shadow-sm transition-opacity cursor-pointer"
                >
                  {saving ? 'Saving...' : editingUserId ? 'Update User' : 'Save User'}
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
