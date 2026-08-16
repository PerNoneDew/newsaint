import { useState } from 'react';
import { Plus, Bell, Megaphone, AlertTriangle, Clock, CheckCheck, Trash2, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Notification, NotificationType, UserRole } from '../../types';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const typeConfig: Record<NotificationType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  announcement: { label: 'Announcement', icon: Megaphone, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
  status_update: { label: 'Status Update', icon: CheckCheck, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
  alert: { label: 'Alert', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  reminder: { label: 'Reminder', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  approval: { label: 'Approval', icon: ThumbsUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  rejection: { label: 'Rejection', icon: ThumbsDown, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
};

const allRoleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  health_officer: 'Health Officer',
  student: 'Student',
  staff: 'Staff',
  faculty: 'Faculty',
  employee: 'Employee',
};

type FormData = {
  title: string;
  message: string;
  type: NotificationType;
  recipientRoles: UserRole[];
};

const emptyForm: FormData = {
  title: '',
  message: '',
  type: 'announcement',
  recipientRoles: ['student', 'staff', 'faculty', 'employee'],
};

export default function Notifications() {
  const { currentUser } = useAuth();
  const { notifications, setNotifications } = useData();
  if (!currentUser) return null;

  const isAdminOrOfficer = currentUser.role === 'admin' || currentUser.role === 'health_officer';

  const myNotifications = notifications.filter(
    (n) => n.recipientRoles.includes(currentUser.role) || n.recipientIds?.includes(currentUser.id)
  );

  const displayNotifications = isAdminOrOfficer ? notifications : myNotifications;

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);

  const filtered = displayNotifications.filter((n) => {
    const matchType = typeFilter === 'all' || n.type === typeFilter;
    const matchRead = !showUnreadOnly || !n.read;
    return matchType && matchRead;
  });

  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.recipientRoles.includes(currentUser.role) || n.recipientIds?.includes(currentUser.id)
          ? { ...n, read: true }
          : n
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const openDeleteConfirm = (n: Notification) => {
    setDeleteTarget(n);
    setShowDeleteConfirm(true);
  };

  const handleSend = () => {
    if (!form.title.trim() || !form.message.trim() || form.recipientRoles.length === 0) return;
    const newNotif: Notification = {
      id: `notif${Date.now()}`,
      title: form.title,
      message: form.message,
      recipientRoles: form.recipientRoles,
      sentBy: currentUser.name,
      sentAt: new Date().toISOString().split('T')[0],
      type: form.type,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setShowForm(false);
    setForm(emptyForm);
  };

  const toggleRole = (role: UserRole) => {
    setForm((prev) => ({
      ...prev,
      recipientRoles: prev.recipientRoles.includes(role)
        ? prev.recipientRoles.filter((r) => r !== role)
        : [...prev.recipientRoles, role],
    }));
  };

  const summaryTypes: NotificationType[] = ['announcement', 'status_update', 'alert', 'reminder'];
  const typeCounts = (Object.keys(typeConfig) as NotificationType[]).reduce((acc, t) => {
    acc[t] = displayNotifications.filter((n) => n.type === t).length;
    return acc;
  }, {} as Record<NotificationType, number>);

  const openNotification = (n: Notification) => {
    setSelected(n);
    if (!n.read) markRead(n.id);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryTypes.map((t) => {
          const { label, icon: Icon, color, bg, border } = typeConfig[t];
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
              className={`bg-white rounded-xl p-4 border text-left transition-all ${typeFilter === t ? 'border-teal-400 ring-2 ring-teal-100' : `${border} hover:border-teal-200`}`}
            >
              <div className={`inline-flex p-1.5 rounded-lg ${bg} mb-2`}>
                <Icon size={13} className={color} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{typeCounts[t]}</p>
              <p className="text-xs text-slate-500">{label}s</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-800 text-sm">
              {isAdminOrOfficer ? 'All Notifications' : 'My Notifications'}
            </h3>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600"
            >
              <option value="all">All Types</option>
              {(Object.keys(typeConfig) as NotificationType[]).map((t) => (
                <option key={t} value={t}>{typeConfig[t].label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${showUnreadOnly ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-200'}`}
            >
              Unread only
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 bg-slate-50 hover:border-teal-200 transition-all flex items-center gap-1.5"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
            {isAdminOrOfficer && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <Plus size={15} /> Send Notification
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Bell size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No notifications</p>
              <p className="text-slate-400 text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            filtered.map((n) => {
              const { icon: Icon, color, bg, border } = typeConfig[n.type] ?? typeConfig.announcement;
              const isMyNotif = n.recipientRoles.includes(currentUser.role) || n.recipientIds?.includes(currentUser.id);
              const isUnread = !n.read && isMyNotif;
              return (
                <div
                  key={n.id}
                  className={`px-5 py-4 flex gap-4 transition-all cursor-pointer group relative ${
                    isUnread
                      ? 'bg-gradient-to-r from-teal-50/80 to-sky-50/50 border-l-4 border-l-teal-400'
                      : 'hover:bg-slate-50/50'
                  }`}
                  onClick={() => openNotification(n)}
                >
                  {isUnread && (
                    <div className="absolute inset-0 bg-teal-100/20 pointer-events-none" />
                  )}
                  <div className={`shrink-0 w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center mt-0.5 relative z-10`}>
                    <Icon size={15} className={color} />
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isUnread ? 'text-teal-900' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        {isUnread && (
                          <span className="flex items-center gap-1 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAdminOrOfficer && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openDeleteConfirm(n); }}
                            className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm mt-0.5 line-clamp-2 leading-relaxed ${isUnread ? 'text-teal-700' : 'text-slate-500'}`}>{n.message}</p>
                    <div className={`flex items-center gap-3 mt-2 text-xs ${isUnread ? 'text-teal-500' : 'text-slate-400'}`}>
                      <span>{n.sentBy}</span>
                      <span>·</span>
                      <span>{n.sentAt}</span>
                      {isAdminOrOfficer && (
                        <>
                          <span>·</span>
                          <span>{n.recipientRoles.map((r) => allRoleLabels[r] || r).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal isOpen={selected !== null} onClose={() => setSelected(null)} title={selected?.title ?? ''} size="md">
        {selected && (() => {
          const cfg = typeConfig[selected.type] ?? typeConfig.announcement;
          const { icon: Icon, color, bg, label } = cfg;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
                  <Icon size={11} />
                  {label}
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">{selected.message}</p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sent by</span>
                  <span className="font-medium text-slate-700">{selected.sentBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date</span>
                  <span className="font-medium text-slate-700">{selected.sentAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipients</span>
                  <span className="font-medium text-slate-700">{selected.recipientRoles.map((r) => allRoleLabels[r] || r).join(', ')}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Send Notification" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              placeholder="Write your notification message..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(typeConfig) as NotificationType[]).map((t) => {
                const { label, icon: Icon, color, bg } = typeConfig[t];
                return (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all text-left ${form.type === t ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:border-teal-200'}`}
                  >
                    <div className={`p-1 rounded-lg ${bg}`}>
                      <Icon size={12} className={color} />
                    </div>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Recipients</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(allRoleLabels) as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.recipientRoles.includes(role) ? 'bg-teal-500 text-white border-teal-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300'}`}
                >
                  {allRoleLabels[role]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSend} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">
              <Send size={13} /> Send
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteNotification(deleteTarget.id)}
        title="Delete Notification"
        message={`Are you sure you want to permanently delete the notification "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Notification"
        type="danger"
        details={[
          'Notification will be permanently removed',
          'Recipients will no longer see this notification',
          'This action cannot be undone'
        ]}
      />
    </div>
  );
}
