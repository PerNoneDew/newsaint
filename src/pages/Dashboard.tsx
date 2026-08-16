import { Users, FileText, ClipboardList, Package, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StatsCard from '../components/ui/StatsCard';
import Badge, { statusVariant } from '../components/ui/Badge';
import { Page } from '../types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { currentUser } = useAuth();
  const { users, healthRecords, requests, inventory, expenses, notifications } = useData();
  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isOfficer = currentUser.role === 'health_officer';
  const isStudent = currentUser.role === 'student';
  const isStaff = currentUser.role === 'staff';
  const isFaculty = currentUser.role === 'faculty';
  const isEmployee = currentUser.role === 'employee';
  const isRegularUser = isStudent || isStaff || isFaculty || isEmployee;

  const lowStockItems = inventory.filter((m) => m.quantity <= m.minStock);
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const unreadNotifs = notifications.filter(
    (n) => !n.read && (n.recipientRoles.includes(currentUser.role) || n.recipientIds?.includes(currentUser.id))
  ).length;

  const myRequests = requests.filter((r) => r.userId === currentUser.id);
  const myRecord = healthRecords.find((r) => r.userId === currentUser.id);

  const dailyRequests = requests.filter((r) => {
    const today = new Date().toISOString().slice(0, 10);
    return r.submittedAt === today || r.updatedAt === today;
  });

  const recentRequests = (isRegularUser ? myRequests : requests).slice(0, 5);

  const activityFeed = [
    { text: 'Medical certificate issued to John Dela Cruz', time: '2 hours ago', type: 'success' },
    { text: 'New health request submitted by Jane Bautista', time: '4 hours ago', type: 'info' },
    { text: 'Salbutamol inhaler stock running low', time: '5 hours ago', type: 'warning' },
    { text: 'Q4 health clearance reminder sent to all users', time: '1 day ago', type: 'info' },
    { text: 'Expense OR-2024-004 recorded: Lab testing', time: '2 days ago', type: 'neutral' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-teal-100 text-sm font-medium">Welcome back,</p>
            <h2 className="text-2xl font-bold mt-0.5">{currentUser.name}</h2>
            <p className="text-teal-100 text-sm mt-1">{currentUser.department || 'HEALTH SYS SFCG'}</p>
          </div>
          <div className="text-right text-sm text-teal-100">
            <p className="font-medium">{new Date().toLocaleDateString('en-PH', { weekday: 'long' })}</p>
            <p>{new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            {unreadNotifs > 0 && (
              <span className="mt-1 inline-block bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                {unreadNotifs} unread alert{unreadNotifs > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Admin stats — 2.1–2.4 */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Users" value={users.filter((u) => u.status === 'active').length} subtitle="Active accounts" icon={Users} color="teal" trend={{ value: 8, label: 'this month' }} />
          <StatsCard title="Health Records" value={healthRecords.filter((r) => !r.archived).length} subtitle="Total on file" icon={FileText} color="sky" />
          <StatsCard title="Pending Requests" value={pendingRequests.length} subtitle="Awaiting review" icon={ClipboardList} color="amber" />
          <StatsCard title="Low Stock Items" value={lowStockItems.length} subtitle="Need restocking" icon={Package} color="rose" />
        </div>
      )}

      {/* Health officer stats — 2.6–2.8 */}
      {isOfficer && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Daily Requests" value={dailyRequests.length} subtitle="Today's activity" icon={ClipboardList} color="teal" />
          <StatsCard title="Patient Records" value={healthRecords.filter((r) => !r.archived).length} subtitle="Total patients" icon={Users} color="sky" />
          <StatsCard title="Low Stock Alerts" value={lowStockItems.length} subtitle="Medicines to reorder" icon={Package} color="rose" />
          <StatsCard title="Pending Reviews" value={pendingRequests.length} subtitle="Need attention" icon={Clock} color="amber" />
        </div>
      )}

      {/* Student/Staff/Faculty/Employee stats */}
      {isRegularUser && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatsCard title="My Health Record" value={myRecord ? 1 : 0} subtitle={myRecord ? `Last checkup: ${myRecord.lastCheckup}` : 'Visit clinic to create'} icon={FileText} color="teal" />
          <StatsCard title="My Requests" value={myRequests.length} subtitle="Total submitted" icon={ClipboardList} color="sky" />
          <StatsCard title="Pending" value={myRequests.filter((r) => r.status === 'pending' || r.status === 'processing').length} subtitle="Awaiting review" icon={Clock} color="amber" />
          <StatsCard title="Approved" value={myRequests.filter((r) => r.status === 'approved' || r.status === 'released').length} subtitle="Completed" icon={CheckCircle} color="emerald" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Requests */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              {isEmployee || isStudent || isStaff ? 'My Recent Requests' : 'Recent Requests'}
            </h3>
            <button onClick={() => onNavigate('requests')} className="text-teal-500 hover:text-teal-600 text-sm font-medium">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentRequests.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">No requests found.</div>
            ) : recentRequests.map((req) => (
              <div key={req.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {req.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    {!isRegularUser && (
                      <span className="text-slate-400 font-normal"> · {req.userName}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{req.description}</p>
                  {req.remarks && (
                    <p className="text-xs text-teal-600 mt-0.5 truncate">Remarks: {req.remarks}</p>
                  )}
                </div>
                <div className="ml-4 shrink-0">
                  <Badge label={req.status.charAt(0).toUpperCase() + req.status.slice(1)} variant={statusVariant(req.status)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Low Stock Alerts — admin/officer */}
          {(isAdmin || isOfficer) && lowStockItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm">
              <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                <h3 className="font-semibold text-slate-800 text-sm">Low Stock Alerts</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                      <p className="text-xs text-amber-600">{item.quantity} {item.unit} remaining</p>
                    </div>
                    <span className="ml-2 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium border border-amber-100">Low</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-3">
                <button onClick={() => onNavigate('inventory')} className="text-teal-500 hover:text-teal-600 text-xs font-medium">Manage inventory →</button>
              </div>
            </div>
          )}

          {/* Financial Summary — admin/officer */}
          {(isAdmin || isOfficer) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <TrendingUp size={15} className="text-teal-500" />
                <h3 className="font-semibold text-slate-800 text-sm">Financial Summary</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Expenses</span>
                  <span className="font-semibold text-slate-800">₱{totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Liquidated</span>
                  <span className="font-semibold text-emerald-600">₱{expenses.filter((e) => e.status === 'liquidated').reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pending</span>
                  <span className="font-semibold text-amber-600">₱{expenses.filter((e) => e.status === 'recorded').reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full"
                      style={{ width: `${(expenses.filter((e) => e.status === 'liquidated').reduce((s, e) => s + e.amount, 0) / totalExpenses) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {Math.round((expenses.filter((e) => e.status === 'liquidated').reduce((s, e) => s + e.amount, 0) / totalExpenses) * 100)}% liquidated
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Health Summary — student/staff/faculty/employee */}
          {isRegularUser && myRecord && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">My Health Summary</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Blood Type</span><span className="font-semibold text-slate-700">{myRecord.bloodType}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Allergies</span><span className="font-semibold text-slate-700 text-right max-w-[140px] truncate">{myRecord.allergies.length > 0 ? myRecord.allergies.join(', ') : 'None'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Conditions</span><span className="font-semibold text-slate-700 text-right max-w-[140px] truncate">{myRecord.conditions.length > 0 ? myRecord.conditions.join(', ') : 'None'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Last Checkup</span><span className="font-semibold text-slate-700">{myRecord.lastCheckup}</span></div>
              </div>
              <div className="px-5 pb-4">
                <button onClick={() => onNavigate('health-records')} className="text-teal-500 hover:text-teal-600 text-xs font-medium">View full record →</button>
              </div>
            </div>
          )}

          {/* Recent Activity feed */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Recent Activity</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {activityFeed.slice(0, 4).map((item, i) => (
                <div key={i} className="px-5 py-3">
                  <p className="text-xs text-slate-600 leading-relaxed">{item.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
