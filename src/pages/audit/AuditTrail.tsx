import { useState } from 'react';
import { Search, LogIn, LogOut, Plus, CreditCard as Edit2, Trash2, Eye, Settings, History } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AuditLog } from '../../types';

const typeConfig: Record<AuditLog['type'], { label: string; icon: React.ElementType; color: string; bg: string }> = {
  login: { label: 'Login', icon: LogIn, color: 'text-teal-600', bg: 'bg-teal-50' },
  logout: { label: 'Logout', icon: LogOut, color: 'text-slate-600', bg: 'bg-slate-100' },
  create: { label: 'Create', icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  update: { label: 'Update', icon: Edit2, color: 'text-sky-600', bg: 'bg-sky-50' },
  delete: { label: 'Delete', icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
  view: { label: 'View', icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50' },
  system: { label: 'System', icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50' },
};

export default function AuditTrail() {
  const { auditLogs } = useData();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [viewLog, setViewLog] = useState<AuditLog | null>(null);

  const modules = Array.from(new Set(auditLogs.map((l) => l.module)));

  const filtered = auditLogs.filter((l) => {
    const matchSearch = l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || l.type === typeFilter;
    const matchModule = moduleFilter === 'all' || l.module === moduleFilter;
    return matchSearch && matchType && matchModule;
  });

  const loginCount = auditLogs.filter((l) => l.type === 'login').length;
  const activityCount = auditLogs.filter((l) => l.type !== 'login' && l.type !== 'logout').length;
  const uniqueUsers = new Set(auditLogs.map((l) => l.userId)).size;

  return (
    <div className="space-y-5">
      {/* Summary — 10.1-10.3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl"><History size={18} className="text-teal-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Log Entries</p>
              <p className="text-2xl font-bold text-slate-800">{auditLogs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 rounded-xl"><LogIn size={18} className="text-sky-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Login Events</p>
              <p className="text-2xl font-bold text-slate-800">{loginCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl"><Edit2 size={18} className="text-emerald-500" /></div>
            <div>
              <p className="text-sm text-slate-500">User Activities ({uniqueUsers} users)</p>
              <p className="text-2xl font-bold text-slate-800">{activityCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Types</option>
              {(Object.keys(typeConfig) as AuditLog['type'][]).map((t) => (
                <option key={t} value={t}>{typeConfig[t].label}</option>
              ))}
            </select>
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Modules</option>
              {modules.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Module</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">IP Address</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((log) => {
                const { icon: Icon, color, bg } = typeConfig[log.type];
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                          <span className="text-teal-600 font-semibold text-xs">{log.userName.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex p-1 rounded-lg ${bg}`}><Icon size={12} className={color} /></span>
                        <span className="text-sm text-slate-700">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{log.module}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-400 font-mono">{log.ipAddress}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setViewLog(log)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View Details">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No audit log entries found.</div>}
        </div>
      </div>

      {viewLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewLog(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Audit Log Details</h3>
              <button onClick={() => setViewLog(null)} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><p className="text-xs text-slate-400 mb-0.5">Timestamp</p><p className="font-mono text-slate-700">{viewLog.timestamp}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">User</p><p className="font-medium text-slate-700">{viewLog.userName} (ID: {viewLog.userId})</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Action</p><p className="font-medium text-slate-700">{viewLog.action}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Module</p><p className="font-medium text-slate-700">{viewLog.module}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">IP Address</p><p className="font-mono text-slate-700">{viewLog.ipAddress}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Details</p><p className="text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">{viewLog.details}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
