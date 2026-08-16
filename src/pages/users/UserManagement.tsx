import { useState } from 'react';
import { UserPlus, Search, CreditCard as Edit2, UserCheck, UserX, Shield, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { User, UserRole } from '../../types';
import Badge, { statusVariant, roleLabel } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

type FormData = Omit<User, 'id' | 'createdAt'>;

const emptyForm: FormData = { name: '', email: '', role: 'student', department: '', studentId: '', employeeId: '', facultyId: '', adminId: '', officerId: '', status: 'active' };

export default function UserManagement() {
  const { users } = useData();
  const { registerUser, updateUser, toggleUserStatus } = useAuth();
  const { runWithFeedback } = useFeedback();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetMsg, setResetMsg] = useState('');
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openAdd = () => { setEditUser(null); setForm(emptyForm); setPassword(''); setShowPassword(false); setShowModal(true); };
  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, department: u.department, studentId: u.studentId, employeeId: u.employeeId, facultyId: u.facultyId, adminId: u.adminId, officerId: u.officerId, status: u.status });
    setPassword('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (!editUser && !password.trim()) return;
    const isEdit = !!editUser;
    const ok = await runWithFeedback(
      async () => {
        if (editUser) {
          await updateUser(editUser.id, { ...form }, password.trim() || undefined);
        } else {
          const newUser: User = { ...form, id: `u${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
          await registerUser(newUser, password.trim());
        }
      },
      {
        loadingTitle: isEdit ? 'Saving changes…' : 'Creating account…',
        successTitle: isEdit ? 'User updated' : 'Account created',
        successMessage: isEdit ? `${form.name}'s details have been saved.` : `${form.name} can now sign in.`,
        autoCloseMs: 1800,
      },
    );
    if (ok) setShowModal(false);
  };

  const handleToggleStatus = async (id: string) => {
    const target = users.find((u) => u.id === id);
    const activating = target?.status === 'inactive';
    const ok = await runWithFeedback(
      () => toggleUserStatus(id),
      {
        loadingTitle: activating ? 'Activating account…' : 'Deactivating account…',
        successTitle: activating ? 'Account activated' : 'Account deactivated',
        successMessage: activating ? `${target?.name} can sign in again.` : `${target?.name} can no longer sign in.`,
        autoCloseMs: 1800,
      },
    );
    if (ok) {
      setShowToggleConfirm(false);
      setToggleTarget(null);
    }
  };

  const openToggleConfirm = (u: User) => {
    setToggleTarget(u);
    setShowToggleConfirm(true);
  };

  const openRoleModal = (u: User) => { setRoleTarget(u); setSelectedRole(u.role); setShowRoleModal(true); };
  const saveRole = async () => {
    if (!roleTarget) return;
    const ok = await runWithFeedback(
      () => updateUser(roleTarget.id, { role: selectedRole }),
      { loadingTitle: 'Updating role…', successTitle: 'Role updated', successMessage: `${roleTarget.name} is now ${selectedRole.replace('_', ' ')}.`, autoCloseMs: 1800 },
    );
    if (ok) setShowRoleModal(false);
  };

  const openResetModal = (u: User) => { setResetTarget(u); setResetMsg(''); setShowResetModal(true); };
  const handleResetPassword = async () => {
    if (!resetTarget) return;
    const tempPw = `tmp${Math.random().toString(36).slice(2, 8)}`;
    const ok = await runWithFeedback(
      () => updateUser(resetTarget.id, {}, tempPw),
      { loadingTitle: 'Resetting password…', successTitle: 'Password reset', successMessage: `Temporary password for ${resetTarget.name}: ${tempPw}`, autoCloseMs: 0 },
    );
    if (ok) setResetMsg(`Password for ${resetTarget.name} has been reset. Temporary password: ${tempPw}`);
  };

  const roleCounts = {
    admin: users.filter((u) => u.role === 'admin').length,
    health_officer: users.filter((u) => u.role === 'health_officer').length,
    student: users.filter((u) => u.role === 'student').length,
    staff: users.filter((u) => u.role === 'staff').length,
    faculty: users.filter((u) => u.role === 'faculty').length,
    employee: users.filter((u) => u.role === 'employee').length,
  };

  return (
    <div className="space-y-5">
      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {(['admin', 'health_officer', 'student', 'staff', 'faculty', 'employee'] as const).map((r) => (
          <button key={r} onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}
            className={`bg-white rounded-xl p-4 border text-left transition-all ${roleFilter === r ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-100 hover:border-teal-200'}`}>
            <p className="text-2xl font-bold text-slate-800">{roleCounts[r]}</p>
            <p className="text-xs text-slate-500 mt-0.5">{roleLabel(r)}s</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="health_officer">Health Officer</option>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="faculty">Faculty</option>
              <option value="employee">Employee</option>
            </select>
            <button onClick={openAdd} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              <UserPlus size={15} />
              <span className="hidden sm:inline">Add User</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">College</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <span className="text-teal-600 font-semibold text-sm">{u.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{u.name}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><Badge label={roleLabel(u.role)} variant={statusVariant(u.role)} /></td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-500">{u.department || '—'}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-xs text-slate-400">{u.studentId || u.facultyId || u.employeeId || u.adminId || u.officerId || '—'}</td>
                  <td className="px-5 py-3.5"><Badge label={u.status === 'active' ? 'Active' : 'Inactive'} variant={statusVariant(u.status)} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit User"><Edit2 size={14} /></button>
                      <button onClick={() => openRoleModal(u)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Change Role"><Shield size={14} /></button>
                      <button onClick={() => openResetModal(u)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Reset Password"><KeyRound size={14} /></button>
                      <button onClick={() => openToggleConfirm(u)} className={`p-1.5 rounded-lg transition-colors ${u.status === 'active' ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}>
                        {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No users found.</div>}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit User Account' : 'Register New User'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Enter full name" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="email@gmail.com" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
                {editUser && <span className="text-slate-400 font-normal ml-1">(leave unchanged to keep current)</span>}
                {!editUser && <span className="text-rose-500 ml-1">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder={editUser ? 'Enter new password to change' : 'Set login password'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {!editUser && (
                <p className="text-xs text-slate-400 mt-1">This will be the user's login password.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="admin">Admin</option>
                <option value="health_officer">Health Officer</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="faculty">Faculty</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">College</label>
              <input value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. College of Engineering" />
            </div>
            {form.role === 'admin' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin ID</label>
                <input value={form.adminId || ''} onChange={(e) => setForm({ ...form, adminId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. ADM-2024-001" />
              </div>
            )}
            {form.role === 'health_officer' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Health Officer ID</label>
                <input value={form.officerId || ''} onChange={(e) => setForm({ ...form, officerId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. HOF-2024-001" />
              </div>
            )}
            {form.role === 'student' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                <input value={form.studentId || ''} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. STU-2024-001" />
              </div>
            )}
            {form.role === 'faculty' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Faculty ID</label>
                <input value={form.facultyId || ''} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. FAC-2024-001" />
              </div>
            )}
            {form.role === 'employee' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                <input value={form.employeeId || ''} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. EMP-2024-001" />
              </div>
            )}
            {form.role === 'staff' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Staff ID</label>
                <input value={form.employeeId || ''} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. STF-2024-001" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">{editUser ? 'Save Changes' : 'Register User'}</button>
          </div>
        </div>
      </Modal>

      {/* Assign Role Modal */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="Assign User Role" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Update role for <strong>{roleTarget?.name}</strong></p>
          <div className="grid grid-cols-2 gap-2">
            {(['admin', 'health_officer', 'student', 'staff', 'faculty', 'employee'] as UserRole[]).map((r) => (
              <button key={r} onClick={() => setSelectedRole(r)}
                className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${selectedRole === r ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:border-teal-200'}`}>
                {roleLabel(r)}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={saveRole} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">Save Role</button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetModal} onClose={() => { setShowResetModal(false); setResetMsg(''); }} title="Reset User Password" size="sm">
        <div className="space-y-4">
          {resetMsg ? (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-sm text-teal-700">{resetMsg}</div>
          ) : (
            <p className="text-sm text-slate-600">
              Reset password for <strong>{resetTarget?.name}</strong>?<br />
              <span className="text-slate-400">A temporary password will be generated.</span>
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => { setShowResetModal(false); setResetMsg(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              {resetMsg ? 'Close' : 'Cancel'}
            </button>
            {!resetMsg && (
              <button onClick={handleResetPassword} className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors">Reset Password</button>
            )}
          </div>
        </div>
      </Modal>

      {/* Toggle Status Confirmation Modal */}
      <ConfirmModal
        isOpen={showToggleConfirm}
        onClose={() => { setShowToggleConfirm(false); setToggleTarget(null); }}
        onConfirm={() => toggleTarget && handleToggleStatus(toggleTarget.id)}
        title={toggleTarget?.status === 'active' ? 'Deactivate User Account' : 'Activate User Account'}
        message={toggleTarget?.status === 'active'
          ? `Are you sure you want to deactivate ${toggleTarget?.name}? They will no longer be able to access the system.`
          : `Are you sure you want to reactivate ${toggleTarget?.name}? They will regain access to the system.`
        }
        confirmLabel={toggleTarget?.status === 'active' ? 'Deactivate' : 'Activate'}
        type={toggleTarget?.status === 'active' ? 'danger' : 'success'}
        details={toggleTarget?.status === 'active' ? [
          'User will be logged out immediately',
          'User cannot log in until reactivated',
          'All user data will be preserved'
        ] : [
          'User will regain system access',
          'Previous permissions will be restored'
        ]}
      />
    </div>
  );
}
