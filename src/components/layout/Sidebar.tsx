import { LayoutDashboard, Users, FileText, ClipboardList, Package, Banknote, Bell, BarChart3, LogOut, ChevronRight, History, HardDrive, FilePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Page } from '../../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'health_officer', 'student', 'staff', 'faculty', 'employee'] },
  { id: 'users', label: 'User Management', icon: Users, roles: ['admin'] },
  { id: 'health-records', label: 'Health Records', icon: FileText, roles: ['admin', 'health_officer', 'student', 'staff', 'faculty', 'employee'] },
  { id: 'health-form', label: 'Health Form', icon: FilePlus, roles: ['admin', 'health_officer', 'student', 'staff', 'faculty', 'employee'] },
  { id: 'requests', label: 'Patient Services', icon: ClipboardList, roles: ['admin', 'health_officer', 'student', 'staff', 'faculty', 'employee'] },
  { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'health_officer'] },
  { id: 'liquidation', label: 'Liquidation', icon: Banknote, roles: ['admin', 'health_officer'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'health_officer', 'student', 'staff', 'faculty', 'employee'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'health_officer'] },
  { id: 'audit-trail', label: 'Audit Trail', icon: History, roles: ['admin'] },
  { id: 'backup-recovery', label: 'Backup & Recovery', icon: HardDrive, roles: ['admin'] },
];

const roleColors: Record<string, string> = {
  admin: 'bg-teal-400/20 text-teal-200',
  health_officer: 'bg-sky-400/20 text-sky-200',
  student: 'bg-slate-400/20 text-slate-300',
  staff: 'bg-amber-400/20 text-amber-200',
  faculty: 'bg-violet-400/20 text-violet-200',
  employee: 'bg-rose-400/20 text-rose-200',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  health_officer: 'Health Officer',
  student: 'Student',
  staff: 'Staff',
  faculty: 'Faculty',
  employee: 'Employee',
};

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(currentUser.role));

  return (
    <aside className="w-64 shrink-0 bg-slate-900 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-auto shrink-0" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">HEALTH SYS SFCG</p>
            <p className="text-slate-400 text-xs">St. Francis College Health System</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
            <span className="text-teal-300 font-bold text-sm">{currentUser.name.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentUser.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleColors[currentUser.role] ?? 'bg-slate-400/20 text-slate-300'}`}>
              {roleLabels[currentUser.role] ?? currentUser.role}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-teal-200" />}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-slate-600 text-center">
            {currentUser.role === 'admin' && (currentUser as any).adminId ? `ID: ${(currentUser as any).adminId}` :
             currentUser.role === 'health_officer' && (currentUser as any).officerId ? `ID: ${(currentUser as any).officerId}` :
             currentUser.role === 'student' && (currentUser as any).studentId ? `ID: ${(currentUser as any).studentId}` :
             currentUser.role === 'faculty' && (currentUser as any).facultyId ? `ID: ${(currentUser as any).facultyId}` :
             (currentUser as any).employeeId ? `ID: ${(currentUser as any).employeeId}` :
             currentUser.department ?? ''}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
