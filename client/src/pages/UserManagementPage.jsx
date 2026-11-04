import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Edit2,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Mail,
  Building,
} from 'lucide-react';
import { userService } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime, getRoleBadgeClass } from '../utils/formatters';

const UserManagementPage = () => {
  const { user: currentUser, canManageUsers } = useAuth();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'Lab Analyst',
    department: 'Analytical Chemistry',
    isActive: true,
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roles = [
    'All',
    'Admin',
    'Lab Manager',
    'Lab Analyst',
    'Quality Manager',
    'Production Staff',
    'Viewer',
  ];

  const departments = [
    'System Administration & IT',
    'Laboratory Operations & Safety',
    'Analytical Chemistry',
    'Microbiology Testing Lab',
    'Quality Assurance & Compliance',
    'Food Manufacturing & Packaging',
    'External Auditing & Oversight',
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        role: selectedRole !== 'All' ? selectedRole : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        limit: 50,
      };
      const res = await userService.getUsers(params);
      if (res.success) {
        setUsers(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers()) {
      fetchUsers();
    }
  }, [searchTerm, selectedRole, selectedStatus]);

  if (!canManageUsers()) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-lg mx-auto space-y-3">
        <Shield className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Admin Privileges Required</h2>
        <p className="text-xs text-slate-500">
          Access to user account management and role-based permissions is strictly restricted to System Administrators.
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'Lab Analyst',
      department: 'Analytical Chemistry',
      isActive: true,
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (userItem) => {
    setEditingUser(userItem);
    setFormData({
      username: userItem.username,
      email: userItem.email,
      password: '', // Blank unless resetting
      fullName: userItem.fullName,
      role: userItem.role,
      department: userItem.department || 'Laboratory Operations',
      isActive: userItem.isActive,
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setFormError('Full name and email are mandatory.');
      return;
    }

    if (!editingUser && (!formData.username.trim() || !formData.password)) {
      setFormError('Username and password are required for new accounts.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      if (editingUser) {
        const payload = {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          isActive: formData.isActive,
        };
        if (formData.password.trim().length > 0) {
          payload.password = formData.password.trim();
        }
        await userService.updateUser(editingUser._id, payload);
        setFormSuccess(`User ${editingUser.username} updated successfully.`);
      } else {
        await userService.createUser(formData);
        setFormSuccess(`User ${formData.username} created successfully.`);
      }

      fetchUsers();
      setTimeout(() => setShowModal(false), 800);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error processing user record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userItem) => {
    try {
      await userService.updateUser(userItem._id, {
        isActive: !userItem.isActive,
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling user status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-600" />
            User Management & Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision user accounts, configure 6-tier role-based permissions, and manage active directory security.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm shadow-purple-600/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by full name, username, email, or department..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                Role: {r}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="All">Status: All</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role & Permissions</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No users match search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {u.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            @{u.username} &bull; {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClass(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{u.department}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Deactivated
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                      {u.lastLogin ? formatDateTime(u.lastLogin) : 'Never logged in'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Edit User Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                              u.isActive
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingUser ? `Edit User: @${editingUser.username}` : 'Provision New User'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Assign role permissions and account credentials
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. jdoe"
                    disabled={!!editingUser}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jdoe@foodlab.lims"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={editingUser?.username === 'admin'}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100"
                  >
                    {roles.filter((r) => r !== 'All').map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingUser ? 'Reset Password (leave empty to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Enter new password if resetting...' : '••••••••••••'}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {editingUser && editingUser.username !== 'admin' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="userActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300"
                  />
                  <label htmlFor="userActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Account is Active (Uncheck to deactivate access)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Update Account' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
