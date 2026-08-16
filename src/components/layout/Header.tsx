import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Page } from '../../types';

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  users: 'User Management',
  'health-records': 'Health Records',
  'health-form': 'Health Record Form',
  requests: 'Request Management',
  inventory: 'Inventory Management',
  liquidation: 'Liquidation Tracking',
  notifications: 'Notifications',
  reports: 'Reports',
  'audit-trail': 'Audit Trail',
  'backup-recovery': 'Backup & Recovery',
};

const pageSubtitles: Record<Page, string> = {
  dashboard: 'Overview of your health management system',
  users: 'Manage users, roles, and access permissions',
  'health-records': 'View and manage patient health records',
  'health-form': 'Submit and review student health record forms',
  requests: 'Submit and track health service requests',
  inventory: 'Monitor medicine stock and supplies',
  liquidation: 'Track expenses and generate liquidation reports',
  notifications: 'Manage system alerts and notifications',
  reports: 'Generate and view analytical reports',
  'audit-trail': 'View login history, user activities, and record changes',
  'backup-recovery': 'Manage database backups and restoration',
};

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { currentUser } = useAuth();
  const { notifications } = useData();

  if (!currentUser) return null;

  const unreadCount = notifications.filter(
    (n) => !n.read && (n.recipientRoles.includes(currentUser.role) || n.recipientIds?.includes(currentUser.id))
  ).length;

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{pageTitles[currentPage]}</h1>
        <p className="text-sm text-slate-400 mt-0.5">{pageSubtitles[currentPage]}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent w-48 transition-all focus:w-64"
          />
        </div>
        <button
          onClick={() => onNavigate('notifications')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm shadow-teal-200">
          <span className="text-white font-bold text-sm">{currentUser.name.charAt(0)}</span>
        </div>
      </div>
    </header>
  );
}
