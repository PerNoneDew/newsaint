import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users, FileText, ClipboardList, Package,
  TrendingUp, Activity, AlertTriangle, CheckCircle,
  Stethoscope, Pill, CalendarDays, Download,
} from 'lucide-react';
import { ExpenseCategory, RequestType } from '../../types';

const categoryLabels: Record<ExpenseCategory, string> = {
  medicines: 'Medicines',
  equipment: 'Equipment',
  supplies: 'Supplies',
  services: 'Services',
  other: 'Other',
};

const requestTypeLabels: Record<RequestType, string> = {
  medical: 'Medical',
  dental: 'Dental',
  medicine: 'Medicine',
};

const catColors: Record<ExpenseCategory, string> = {
  medicines: 'bg-teal-400',
  equipment: 'bg-sky-400',
  supplies: 'bg-amber-400',
  services: 'bg-rose-400',
  other: 'bg-slate-400',
};

const statusColors: Record<string, string> = {
  approved: 'bg-emerald-400',
  processing: 'bg-sky-400',
  pending: 'bg-amber-400',
  rejected: 'bg-rose-400',
};

const roleBarColors: Record<string, string> = {
  admin: 'bg-teal-400',
  health_officer: 'bg-sky-400',
  student: 'bg-teal-400',
  staff: 'bg-amber-400',
  faculty: 'bg-violet-400',
  employee: 'bg-rose-400',
};

export default function Reports() {
  const { currentUser } = useAuth();
  const { users, healthRecords, requests, inventory, expenses } = useData();
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isOfficer = currentUser.role === 'health_officer';

  const activeUsers = users.filter((u) => u.status === 'active').length;
  const totalRequests = requests.length;
  const approvedRequests = requests.filter((r) => r.status === 'approved' || r.status === 'released').length;
  const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
  const lowStockCount = inventory.filter((m) => m.quantity <= m.minStock).length;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const liquidatedExpenses = expenses.filter((e) => e.status === 'liquidated').reduce((s, e) => s + e.amount, 0);

  // Shared: requests by type & status
  const requestsByType = (Object.keys(requestTypeLabels) as RequestType[]).map((type) => ({
    type,
    label: requestTypeLabels[type],
    count: requests.filter((r) => r.type === type).length,
  })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  const maxRequestCount = Math.max(...requestsByType.map((r) => r.count), 1);

  const requestsByStatus = ['pending', 'processing', 'approved', 'rejected'].map((status) => ({
    status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    count: requests.filter((r) => r.status === status).length,
  }));
  const maxStatusCount = Math.max(...requestsByStatus.map((r) => r.count), 1);

  // Admin-only
  const expensesByCategory = (Object.keys(categoryLabels) as ExpenseCategory[]).map((cat) => ({
    cat,
    label: categoryLabels[cat],
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((e) => e.total > 0).sort((a, b) => b.total - a.total);
  const maxExpense = Math.max(...expensesByCategory.map((e) => e.total), 1);

  const usersByRole = ['admin', 'health_officer', 'student', 'staff', 'faculty', 'employee'].map((role) => ({
    role,
    label: role === 'health_officer' ? 'Health Officer' : role.charAt(0).toUpperCase() + role.slice(1),
    count: users.filter((u) => u.role === role).length,
  }));
  const maxRoleCount = Math.max(...usersByRole.map((r) => r.count), 1);

  // Health officer: consultation report data (9.5)
  const consultationRequests = requests.filter((r) => r.type === 'medical');
  const consultByStatus = ['pending', 'processing', 'approved', 'rejected', 'released'].map((s) => ({
    status: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
    count: consultationRequests.filter((r) => r.status === s).length,
  })).filter((s) => s.count > 0);
  const consultByRole = ['student', 'staff', 'faculty', 'employee'].map((role) => ({
    role,
    label: role.charAt(0).toUpperCase() + role.slice(1),
    count: consultationRequests.filter((r) => {
      const u = users.find((u) => u.id === r.userId);
      return u?.role === role;
    }).length,
  })).filter((r) => r.count > 0);

  // Health officer: medicine report data (9.6)
  const today = new Date();
  const ninetyDays = new Date(today); ninetyDays.setDate(today.getDate() + 90);
  const expiredMeds = inventory.filter((m) => new Date(m.expiryDate) < today);
  const expiringMeds = inventory.filter((m) => new Date(m.expiryDate) >= today && new Date(m.expiryDate) <= ninetyDays);
  const lowStockMeds = inventory.filter((m) => m.quantity <= m.minStock);
  const medicinesByCategory = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'other'].map((cat) => ({
    cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: inventory.filter((m) => m.category === cat).length,
  })).filter((c) => c.count > 0);
  const maxMedCat = Math.max(...medicinesByCategory.map((c) => c.count), 1);

  // Health officer: daily service report data (9.7)
  const todayStr = today.toISOString().slice(0, 10);
  const todayRequests = requests.filter((r) => r.submittedAt?.slice(0, 10) === todayStr);
  const recentRequests = requests.slice(0, 10);
  const activeRecords = healthRecords.filter((r) => !('archived' in r && (r as { archived?: boolean }).archived));

  // Blood type distribution (shared)
  const bloodTypeMap: Record<string, number> = {};
  healthRecords.forEach((r) => { bloodTypeMap[r.bloodType] = (bloodTypeMap[r.bloodType] || 0) + 1; });
  const bloodTypeDist = Object.entries(bloodTypeMap).sort((a, b) => b[1] - a[1]);
  const maxBT = Math.max(...bloodTypeDist.map((b) => b[1]), 1);
  const topMedicines = [...inventory].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  const printConsultReport = () => { setShowConsultModal(true); };
  const printMedReport = () => { setShowMedModal(true); };
  const printDailyReport = () => { setShowDailyModal(true); };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Users', value: activeUsers, sub: `of ${users.length} total`, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Health Records', value: activeRecords.length, sub: `of ${healthRecords.length} total`, icon: FileText, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Approval Rate', value: `${approvalRate}%`, sub: `${approvedRequests} approved`, icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Low Stock Items', value: lowStockCount, sub: `of ${inventory.length} items`, icon: Package, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <div className={`p-2.5 ${bg} rounded-xl`}><Icon size={18} className={color} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Health Officer: Report generation buttons (9.5-9.7) */}
      {isOfficer && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Consultation Report', sub: 'Breakdown by type, status, and user role', icon: Stethoscope, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', btnColor: 'bg-teal-500 hover:bg-teal-600', action: printConsultReport },
            { label: 'Medicine Report', sub: 'Stock levels, expiry, and category analysis', icon: Pill, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', btnColor: 'bg-sky-500 hover:bg-sky-600', action: printMedReport },
            { label: 'Daily Service Report', sub: "Today's service activity and patient summary", icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', btnColor: 'bg-emerald-500 hover:bg-emerald-600', action: printDailyReport },
          ].map(({ label, sub, icon: Icon, color, bg, border, btnColor, action }) => (
            <div key={label} className={`bg-white rounded-2xl p-5 border ${border} shadow-sm flex flex-col gap-3`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 ${bg} rounded-xl`}><Icon size={18} className={color} /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
              </div>
              <button onClick={action} className={`mt-auto flex items-center justify-center gap-2 ${btnColor} text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors`}>
                <Download size={14} /> Generate Report
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Shared: requests charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList size={16} className="text-teal-500" />
            <h3 className="font-semibold text-slate-800">Requests by Type</h3>
          </div>
          {requestsByType.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No request data.</p>
          ) : (
            <div className="space-y-3">
              {requestsByType.map(({ type, label, count }) => (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{label}</span>
                    <span className="font-bold text-slate-800">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-teal-400 h-2 rounded-full transition-all" style={{ width: `${(count / maxRequestCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-sky-500" />
            <h3 className="font-semibold text-slate-800">Requests by Status</h3>
          </div>
          <div className="space-y-3">
            {requestsByStatus.map(({ status, label, count }) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">{label}</span>
                  <span className="font-bold text-slate-800">{count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`${statusColors[status]} h-2 rounded-full transition-all`} style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health officer: additional analytics */}
      {isOfficer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileText size={16} className="text-rose-500" />
              <h3 className="font-semibold text-slate-800">Blood Type Distribution</h3>
            </div>
            {bloodTypeDist.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No health record data.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {bloodTypeDist.map(([bt, count]) => (
                  <div key={bt} className="text-center">
                    <div className="relative mx-auto mb-2" style={{ width: 56, height: 56 }}>
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f43f5e" strokeWidth="4"
                          strokeDasharray={`${(count / maxBT) * 100} 100`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-700">{count}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">{bt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Package size={16} className="text-teal-500" />
              <h3 className="font-semibold text-slate-800">Top Medicine Stock</h3>
            </div>
            <div className="space-y-3">
              {topMedicines.map((m) => {
                const isLow = m.quantity <= m.minStock;
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className={`shrink-0 p-1.5 rounded-lg ${isLow ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                      {isLow ? <AlertTriangle size={12} className="text-rose-500" /> : <CheckCircle size={12} className="text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs font-medium text-slate-700 truncate">{m.name}</span>
                        <span className={`text-xs font-bold ${isLow ? 'text-rose-500' : 'text-slate-700'}`}>{m.quantity}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className={`${isLow ? 'bg-rose-400' : 'bg-emerald-400'} h-1.5 rounded-full`}
                          style={{ width: `${Math.min((m.quantity / (m.minStock * 5)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Admin-only charts */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={16} className="text-emerald-500" />
                <h3 className="font-semibold text-slate-800">Expenses by Category</h3>
              </div>
              {expensesByCategory.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No expense data.</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {expensesByCategory.map(({ cat, label, total }) => (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600 font-medium">{label}</span>
                          <span className="font-bold text-slate-800">₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className={`${catColors[cat]} h-2 rounded-full transition-all`} style={{ width: `${(total / maxExpense) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between text-sm">
                    <span className="text-slate-500">Liquidation Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${totalExpenses > 0 ? (liquidatedExpenses / totalExpenses) * 100 : 0}%` }} />
                      </div>
                      <span className="font-bold text-teal-600">{totalExpenses > 0 ? Math.round((liquidatedExpenses / totalExpenses) * 100) : 0}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Users size={16} className="text-amber-500" />
                <h3 className="font-semibold text-slate-800">Users by Role</h3>
              </div>
              <div className="space-y-3">
                {usersByRole.map(({ role, label, count }) => (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 font-medium">{label}</span>
                      <span className="font-bold text-slate-800">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${roleBarColors[role] ?? 'bg-amber-400'} h-2 rounded-full transition-all`} style={{ width: `${(count / maxRoleCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <FileText size={16} className="text-rose-500" />
                <h3 className="font-semibold text-slate-800">Blood Type Distribution</h3>
              </div>
              {bloodTypeDist.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No health record data.</p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {bloodTypeDist.map(([bt, count]) => (
                    <div key={bt} className="text-center">
                      <div className="relative mx-auto mb-2" style={{ width: 56, height: 56 }}>
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f43f5e" strokeWidth="4"
                            strokeDasharray={`${(count / maxBT) * 100} 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-700">{count}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">{bt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Package size={16} className="text-teal-500" />
                <h3 className="font-semibold text-slate-800">Top Medicine Stock</h3>
              </div>
              <div className="space-y-3">
                {topMedicines.map((m) => {
                  const isLow = m.quantity <= m.minStock;
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className={`shrink-0 p-1.5 rounded-lg ${isLow ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                        {isLow ? <AlertTriangle size={12} className="text-rose-500" /> : <CheckCircle size={12} className="text-emerald-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-xs font-medium text-slate-700 truncate">{m.name}</span>
                          <span className={`text-xs font-bold ${isLow ? 'text-rose-500' : 'text-slate-700'}`}>{m.quantity}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className={`${isLow ? 'bg-rose-400' : 'bg-emerald-400'} h-1.5 rounded-full`}
                            style={{ width: `${Math.min((m.quantity / (m.minStock * 5)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-teal-500" />
              <h3 className="font-semibold text-slate-800">Financial Overview</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Total Budget Used</p>
                <p className="text-2xl font-bold text-slate-800">₱{totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Liquidated</p>
                <p className="text-2xl font-bold text-emerald-600">₱{liquidatedExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Pending Liquidation</p>
                <p className="text-2xl font-bold text-amber-600">₱{(totalExpenses - liquidatedExpenses).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Liquidation Progress</span>
                <span>{totalExpenses > 0 ? Math.round((liquidatedExpenses / totalExpenses) * 100) : 0}% complete</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-gradient-to-r from-teal-400 to-teal-500 h-3 rounded-full transition-all shadow-sm shadow-teal-200"
                  style={{ width: `${totalExpenses > 0 ? (liquidatedExpenses / totalExpenses) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* 9.5 Consultation Report Modal */}
      {showConsultModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConsultModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-xl"><Stethoscope size={16} className="text-teal-500" /></div>
                <div>
                  <h3 className="font-semibold text-slate-800">Consultation Report</h3>
                  <p className="text-xs text-slate-400">Generated {todayStr}</p>
                </div>
              </div>
              <button onClick={() => setShowConsultModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-teal-700">{consultationRequests.length}</p>
                <p className="text-xs text-teal-600 mt-0.5">Total Consultations</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{consultationRequests.filter((r) => r.status === 'approved' || r.status === 'released').length}</p>
                <p className="text-xs text-emerald-600 mt-0.5">Completed</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">By Status</h4>
              {consultByStatus.length === 0 ? <p className="text-slate-400 text-xs">No data.</p> : (
                <div className="space-y-2">
                  {consultByStatus.map(({ status, label, count }) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-28 bg-slate-100 rounded-full h-1.5">
                          <div className={`${statusColors[status] ?? 'bg-slate-400'} h-1.5 rounded-full`}
                            style={{ width: `${(count / Math.max(consultByStatus.reduce((s, c) => s + c.count, 0), 1)) * 100}%` }} />
                        </div>
                        <span className="font-bold text-slate-800 w-5 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">By User Category</h4>
              {consultByRole.length === 0 ? <p className="text-slate-400 text-xs">No data.</p> : (
                <div className="space-y-2">
                  {consultByRole.map(({ role, label, count }) => (
                    <div key={role} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-28 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-teal-400 h-1.5 rounded-full"
                            style={{ width: `${(count / Math.max(consultByRole.reduce((s, c) => s + c.count, 0), 1)) * 100}%` }} />
                        </div>
                        <span className="font-bold text-slate-800 w-5 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Consultations</h4>
              <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                {consultationRequests.slice(0, 5).map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-700">{r.userName}</p>
                      <p className="text-slate-400">{r.submittedAt?.slice(0, 10)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] ? 'text-white' : 'bg-slate-100 text-slate-600'} text-xs`}
                      style={{ background: r.status === 'approved' || r.status === 'released' ? '#10b981' : r.status === 'pending' ? '#f59e0b' : r.status === 'rejected' ? '#f43f5e' : '#38bdf8', color: '#fff' }}>
                      {r.status}
                    </span>
                  </div>
                ))}
                {consultationRequests.length === 0 && <div className="px-4 py-6 text-center text-xs text-slate-400">No consultations found.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9.6 Medicine Report Modal */}
      {showMedModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMedModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 rounded-xl"><Pill size={16} className="text-sky-500" /></div>
                <div>
                  <h3 className="font-semibold text-slate-800">Medicine Inventory Report</h3>
                  <p className="text-xs text-slate-400">Generated {todayStr}</p>
                </div>
              </div>
              <button onClick={() => setShowMedModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Items', value: inventory.length, bg: 'bg-sky-50', text: 'text-sky-700' },
                { label: 'Low Stock', value: lowStockMeds.length, bg: 'bg-amber-50', text: 'text-amber-700' },
                { label: 'Expired', value: expiredMeds.length, bg: 'bg-rose-50', text: 'text-rose-700' },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <p className={`text-2xl font-bold ${text}`}>{value}</p>
                  <p className={`text-xs ${text} opacity-75 mt-0.5`}>{label}</p>
                </div>
              ))}
            </div>

            {expiringMeds.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-700 mb-2">Expiring Within 90 Days ({expiringMeds.length})</p>
                <div className="space-y-1">
                  {expiringMeds.slice(0, 4).map((m) => (
                    <div key={m.id} className="flex justify-between text-xs text-amber-700">
                      <span>{m.name}</span>
                      <span className="font-medium">{m.expiryDate}</span>
                    </div>
                  ))}
                  {expiringMeds.length > 4 && <p className="text-xs text-amber-500">+{expiringMeds.length - 4} more</p>}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">By Category</h4>
              <div className="space-y-2">
                {medicinesByCategory.map(({ cat, label, count }) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-sky-400 h-1.5 rounded-full" style={{ width: `${(count / maxMedCat) * 100}%` }} />
                      </div>
                      <span className="font-bold text-slate-800 w-5 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Low Stock Items</h4>
              <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                {lowStockMeds.slice(0, 6).map((m) => (
                  <div key={m.id} className="px-4 py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-700">{m.name}</p>
                      <p className="text-slate-400">{m.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-600">{m.quantity} left</p>
                      <p className="text-slate-400">min: {m.minStock}</p>
                    </div>
                  </div>
                ))}
                {lowStockMeds.length === 0 && <div className="px-4 py-6 text-center text-xs text-slate-400">All items sufficiently stocked.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9.7 Daily Service Report Modal */}
      {showDailyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDailyModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-xl"><CalendarDays size={16} className="text-emerald-500" /></div>
                <div>
                  <h3 className="font-semibold text-slate-800">Daily Service Report</h3>
                  <p className="text-xs text-slate-400">{todayStr}</p>
                </div>
              </div>
              <button onClick={() => setShowDailyModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Today's Requests", value: todayRequests.length, bg: 'bg-emerald-50', text: 'text-emerald-700' },
                { label: 'Active Records', value: activeRecords.length, bg: 'bg-sky-50', text: 'text-sky-700' },
                { label: 'Pending Reviews', value: requests.filter((r) => r.status === 'pending').length, bg: 'bg-amber-50', text: 'text-amber-700' },
                { label: 'Released Today', value: requests.filter((r) => r.status === 'released').length, bg: 'bg-teal-50', text: 'text-teal-700' },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${text}`}>{value}</p>
                  <p className={`text-xs ${text} opacity-75 mt-0.5`}>{label}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Service Activity</h4>
              <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                {recentRequests.slice(0, 8).map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-700">{r.userName}</p>
                      <p className="text-slate-400">{requestTypeLabels[r.type as RequestType] ?? r.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: r.status === 'approved' || r.status === 'released' ? '#d1fae5' : r.status === 'pending' ? '#fef3c7' : r.status === 'rejected' ? '#fee2e2' : '#e0f2fe',
                          color: r.status === 'approved' || r.status === 'released' ? '#065f46' : r.status === 'pending' ? '#92400e' : r.status === 'rejected' ? '#9f1239' : '#0c4a6e',
                        }}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
                {recentRequests.length === 0 && <div className="px-4 py-6 text-center text-xs text-slate-400">No service activity found.</div>}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1.5">
              <p className="font-medium text-slate-700 mb-2">Summary</p>
              <div className="flex justify-between"><span>Total Requests (All Time)</span><span className="font-semibold text-slate-700">{requests.length}</span></div>
              <div className="flex justify-between"><span>Approval Rate</span><span className="font-semibold text-emerald-600">{approvalRate}%</span></div>
              <div className="flex justify-between"><span>Health Records</span><span className="font-semibold text-slate-700">{healthRecords.length}</span></div>
              <div className="flex justify-between"><span>Active Patients</span><span className="font-semibold text-slate-700">{activeRecords.length}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
