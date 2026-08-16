import { useState } from 'react';
import { HardDrive, Download, RefreshCw, CheckCircle, XCircle, Clock, Calendar, Trash2, AlertTriangle, Database, Archive, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { DataSnapshot, BackupRecord } from '../../types';
import Badge, { statusVariant } from '../../components/ui/Badge';

export default function BackupRecovery() {
  const { currentUser, restoreUsers } = useAuth();
  const {
    backupRecords, setBackupRecords,
    users,
    healthRecords, setHealthRecords,
    requests, setRequests,
    inventory, setInventory,
    expenses, setExpenses,
    notifications, setNotifications,
    auditLogs, setAuditLogs,
    dispensingHistory, setDispensingHistory,
    snapshots, addSnapshot,
    resetAllData,
  } = useData();
  const { runWithFeedback } = useFeedback();

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [scheduleTime, setScheduleTime] = useState('03:00');
  const [scheduleMsg, setScheduleMsg] = useState('');

  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [showSnapshotsModal, setShowSnapshotsModal] = useState(false);
  const [restoringSnapshot, setRestoringSnapshot] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<DataSnapshot | null>(null);

  if (!currentUser) return null;

  const createSnapshot = (type: 'backup' | 'pre_reset') => {
    const now = new Date();
    const prefix = type === 'backup' ? 'Backup' : 'Pre-reset snapshot';
    return {
      id: `snapshot_${Date.now()}`,
      name: `${prefix} ${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`,
      createdAt: now.toISOString(),
      type,
      data: {
        users: [...users],
        healthRecords: [...healthRecords],
        requests: [...requests],
        inventory: [...inventory],
        expenses: [...expenses],
        notifications: [...notifications],
        auditLogs: [...auditLogs],
        dispensingHistory: [...dispensingHistory],
      },
    };
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    await runWithFeedback(
      async () => {
        const snapshot = createSnapshot('backup');
        const totalRecords = Object.values(snapshot.data).reduce((sum, arr) => sum + arr.length, 0);
        addSnapshot(snapshot);

        const now = new Date();
        const newRecord: BackupRecord = {
          id: `bk${Date.now()}`,
          filename: `healthsys_backup_${now.toISOString().slice(0, 10)}_${now.toTimeString().slice(0, 5).replace(':', '-')}.sql`,
          size: `${(totalRecords * 0.5).toFixed(1)} MB`,
          createdAt: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`,
          createdBy: currentUser.name,
          status: 'completed',
          type: 'manual',
        };
        setBackupRecords((prev) => [newRecord, ...prev]);
      },
      {
        loadingTitle: 'Creating backup...',
        successTitle: 'Backup created',
        successMessage: 'Your data has been backed up successfully.',
        autoCloseMs: 1800,
      },
    );
    setIsBackingUp(false);
  };

  const handleRestoreSnapshot = async (snapshot: DataSnapshot) => {
    setRestoringSnapshot(snapshot.id);
    await runWithFeedback(
      async () => {
        restoreUsers(snapshot.data.users);
        setHealthRecords(snapshot.data.healthRecords);
        setRequests(snapshot.data.requests);
        setInventory(snapshot.data.inventory);
        setExpenses(snapshot.data.expenses);
        setNotifications(snapshot.data.notifications);
        setAuditLogs(snapshot.data.auditLogs);
        setDispensingHistory(snapshot.data.dispensingHistory);
      },
      {
        loadingTitle: 'Restoring data...',
        successTitle: 'Data restored',
        successMessage: `Successfully restored from "${snapshot.name}".`,
        autoCloseMs: 1800,
      },
    );
    setRestoringSnapshot(null);
    setRestoreTarget(null);
    setShowSnapshotsModal(false);
  };

  const handleResetAllDataLocal = async () => {
    if (resetConfirmText !== 'RESET ALL DATA') return;
    setIsResetting(true);

    await runWithFeedback(
      async () => {
        resetAllData();
        const resetLogEntry: BackupRecord = {
          id: `bk${Date.now()}`,
          filename: `system_reset_${new Date().toISOString().slice(0, 10)}.log`,
          size: '0 KB',
          createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          createdBy: currentUser.name,
          status: 'completed',
          type: 'manual',
        };
        setBackupRecords((prev) => [resetLogEntry, ...prev]);
      },
      {
        loadingTitle: 'Resetting system...',
        successTitle: 'System reset complete',
        successMessage: 'All data has been cleared. A pre-reset snapshot was saved for recovery.',
        autoCloseMs: 2000,
      },
    );

    setIsResetting(false);
    setShowResetModal(false);
    setResetConfirmText('');
  };

  const saveSchedule = () => {
    setScheduleMsg(`Backup schedule ${scheduleEnabled ? `enabled at ${scheduleTime} daily` : 'disabled'}.`);
    setTimeout(() => setScheduleMsg(''), 3000);
  };

  const completedCount = backupRecords.filter((b) => b.status === 'completed').length;
  const failedCount = backupRecords.filter((b) => b.status === 'failed').length;
  const latestBackup = backupRecords.find((b) => b.status === 'completed');

  const dataStats = {
    users: users.length,
    healthRecords: healthRecords.length,
    requests: requests.length,
    inventory: inventory.length,
    expenses: expenses.length,
    notifications: notifications.length,
    auditLogs: auditLogs.length,
    dispensingHistory: dispensingHistory.length,
  };

  const totalRecords = Object.values(dataStats).reduce((a, b) => a + b, 0);

  const resetSnapshots = snapshots.filter((s) => s.type === 'pre_reset');

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl"><HardDrive size={18} className="text-teal-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Backups</p>
              <p className="text-2xl font-bold text-slate-800">{backupRecords.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl"><CheckCircle size={18} className="text-emerald-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Successful</p>
              <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-xl"><XCircle size={18} className="text-rose-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Failed</p>
              <p className="text-2xl font-bold text-rose-600">{failedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-50 rounded-xl"><Database size={18} className="text-violet-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Records</p>
              <p className="text-2xl font-bold text-violet-600">{totalRecords.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Manual Backup */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-1">Manual Backup & System Reset</h3>
            <p className="text-sm text-slate-500 mb-4">Create a backup or reset all system data. Snapshots are saved for recovery.</p>
            {latestBackup && (
              <p className="text-xs text-slate-400 mb-3">Last backup: {latestBackup.createdAt} · {latestBackup.size}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleManualBackup}
                disabled={isBackingUp}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {isBackingUp ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Backup...</>
                ) : (
                  <><Download size={15} /> Backup Now</>
                )}
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Trash2 size={15} /> Reset All Data
              </button>
            </div>
            <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-500">
                <span className="font-medium text-teal-600">Backup Now</span> — Creates a full backup with all data (can be restored later).<br/>
                <span className="font-medium text-rose-600">Reset All Data</span> — Clears all records. A snapshot is auto-created before reset.
              </p>
            </div>
          </div>

          {/* Available Snapshots for Restore */}
          {snapshots.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Available Snapshots for Restore</h3>
                <p className="text-xs text-slate-500 mt-0.5">Click restore to recover data from a snapshot</p>
              </div>
              <div className="divide-y divide-slate-50">
                {snapshots.map((s) => (
                  <div key={s.id} className={`px-5 py-4 flex items-center gap-4 transition-colors hover:bg-slate-50/50`}>
                    <div className={`p-2 rounded-xl shrink-0 ${s.type === 'backup' ? 'bg-teal-50' : 'bg-amber-50'}`}>
                      {s.type === 'backup' ? (
                        <Archive size={16} className="text-teal-500" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                        <span>{new Date(s.createdAt).toLocaleString()}</span>
                        <span>·</span>
                        <span className={s.type === 'backup' ? 'text-teal-600' : 'text-amber-600'}>
                          {s.type === 'backup' ? 'Manual Backup' : 'Pre-Reset Snapshot'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {[
                          { label: 'Users', count: s.data.users.length },
                          { label: 'Records', count: s.data.healthRecords.length },
                          { label: 'Requests', count: s.data.requests.length },
                          { label: 'Inventory', count: s.data.inventory.length },
                        ].map(({ label, count }) => (
                          <span key={label} className={`text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500`}>
                            {count.toLocaleString()} {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setRestoreTarget(s)}
                      disabled={restoringSnapshot === s.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors shrink-0 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300`}
                    >
                      {restoringSnapshot === s.id ? (
                        <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                      ) : (
                        <><RotateCcw size={11} /> Restore</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backup History */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Backup History</h3>
              {snapshots.length > 0 && (
                <button
                  onClick={() => setShowSnapshotsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors border border-violet-200"
                >
                  <Archive size={12} /> All Snapshots ({snapshots.length})
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-50">
              {backupRecords.map((b) => (
                <div key={b.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`p-2 rounded-xl shrink-0 ${b.status === 'completed' ? 'bg-emerald-50' : b.status === 'failed' ? 'bg-rose-50' : 'bg-amber-50'}`}>
                    {b.status === 'completed' ? <CheckCircle size={16} className="text-emerald-500" /> :
                     b.status === 'failed' ? <XCircle size={16} className="text-rose-500" /> :
                     <Clock size={16} className="text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{b.filename}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span>{b.createdAt}</span>
                      <span>·</span>
                      <span>{b.size}</span>
                      <span>·</span>
                      <span className={b.type === 'manual' ? 'text-teal-600' : ''}>{b.type}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{b.createdBy}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Badge label={b.status.charAt(0).toUpperCase() + b.status.slice(1)} variant={statusVariant(b.status)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-teal-500" />
              <h3 className="font-semibold text-slate-800 text-sm">Scheduled Backup</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Auto-Backup</label>
                <button
                  onClick={() => setScheduleEnabled(!scheduleEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${scheduleEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${scheduleEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Daily Backup Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  disabled={!scheduleEnabled}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                <p><span className="font-medium">Frequency:</span> Daily</p>
                <p><span className="font-medium">Retention:</span> Last 30 backups</p>
                <p><span className="font-medium">Status:</span> {scheduleEnabled ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Disabled</span>}</p>
              </div>
              {scheduleMsg && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-700">{scheduleMsg}</div>
              )}
              <button onClick={saveSchedule} className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <RefreshCw size={14} /> Save Schedule
              </button>
            </div>
          </div>

          {resetSnapshots.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="font-semibold text-slate-800 text-sm">Pre-Reset Snapshots</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">Data saved before system resets. Restore to recover.</p>
              <div className="space-y-2">
                {resetSnapshots.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => handleRestoreSnapshot(s)}
                      disabled={restoringSnapshot === s.id}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 hover:text-white hover:bg-amber-500 rounded transition-colors disabled:opacity-50"
                    >
                      {restoringSnapshot === s.id ? (
                        <><div className="w-3 h-3 border border-amber-400 border-t-amber-600 rounded-full animate-spin" /></>
                      ) : (
                        <><RotateCcw size={10} /> Restore</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {restoreTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !restoringSnapshot && setRestoreTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <RotateCcw size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Restore Data</h3>
                <p className="text-xs text-slate-500">From: {restoreTarget.name}</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              <p className="font-semibold mb-1">Warning: This will overwrite current data</p>
              <p className="text-xs">All current records will be replaced with data from this snapshot.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
              <p><span className="font-medium">Users:</span> {restoreTarget.data.users.length.toLocaleString()} records</p>
              <p><span className="font-medium">Health Records:</span> {restoreTarget.data.healthRecords.length.toLocaleString()} records</p>
              <p><span className="font-medium">Requests:</span> {restoreTarget.data.requests.length.toLocaleString()} records</p>
              <p><span className="font-medium">Inventory:</span> {restoreTarget.data.inventory.length.toLocaleString()} items</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setRestoreTarget(null)} disabled={!!restoringSnapshot} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={() => handleRestoreSnapshot(restoreTarget)} disabled={!!restoringSnapshot} className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl transition-colors flex items-center gap-2">
                {restoringSnapshot ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Restoring...</> : <><RotateCcw size={14} /> Confirm Restore</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !isResetting && setShowResetModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 pb-4 border-b border-rose-100">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle size={22} className="text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 text-lg">Confirm System Reset</h3>
                <p className="text-sm text-rose-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-rose-800 mb-2">You are about to permanently delete all system data:</p>
              <ul className="text-sm text-rose-700 space-y-1">
                <li>• All user accounts ({dataStats.users.toLocaleString()} records)</li>
                <li>• All health records ({dataStats.healthRecords.toLocaleString()} records)</li>
                <li>• All service requests ({dataStats.requests.toLocaleString()} records)</li>
                <li>• All medicine inventory ({dataStats.inventory.toLocaleString()} items)</li>
                <li>• All expense records ({dataStats.expenses.toLocaleString()} entries)</li>
                <li>• All notifications ({dataStats.notifications.toLocaleString()} items)</li>
                <li>• All audit logs ({dataStats.auditLogs.toLocaleString()} entries)</li>
                <li>• All dispensing history ({dataStats.dispensingHistory.toLocaleString()} records)</li>
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Archive size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-emerald-700">A snapshot will be automatically created before reset, allowing you to restore all data later if needed.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type <span className="font-mono font-bold text-rose-600">RESET ALL DATA</span> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                disabled={isResetting}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 disabled:opacity-50 disabled:bg-slate-50"
                placeholder="RESET ALL DATA"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => { setShowResetModal(false); setResetConfirmText(''); }}
                disabled={isResetting}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAllDataLocal}
                disabled={resetConfirmText !== 'RESET ALL DATA' || isResetting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl transition-colors"
              >
                {isResetting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Resetting...</>
                ) : (
                  <><Trash2 size={14} /> Reset All Data</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshots Modal */}
      {showSnapshotsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSnapshotsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Archive size={20} className="text-violet-500" />
                <div>
                  <h3 className="font-semibold text-slate-800">All Data Snapshots</h3>
                  <p className="text-xs text-slate-500">{snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} available for restoration</p>
                </div>
              </div>
              <button
                onClick={() => setShowSnapshotsModal(false)}
                className="text-sm text-slate-400 hover:text-slate-600 font-medium"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {snapshots.length === 0 ? (
                <div className="text-center py-12">
                  <Archive size={40} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No snapshots available</p>
                  <p className="text-slate-400 text-xs mt-1">Snapshots are created when you backup or reset</p>
                </div>
              ) : (
                snapshots.map((s) => (
                  <div key={s.id} className={`rounded-xl p-4 border ${s.type === 'backup' ? 'bg-teal-50 border-teal-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-700">{s.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.type === 'backup' ? 'bg-teal-100 text-teal-700' : 'bg-amber-200 text-amber-700'}`}>
                            {s.type === 'backup' ? 'Backup' : 'Pre-Reset'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(s.createdAt).toLocaleString()}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {[
                            { label: 'Users', count: s.data.users.length },
                            { label: 'Health Records', count: s.data.healthRecords.length },
                            { label: 'Requests', count: s.data.requests.length },
                            { label: 'Inventory', count: s.data.inventory.length },
                            { label: 'Expenses', count: s.data.expenses.length },
                            { label: 'Notifications', count: s.data.notifications.length },
                            { label: 'Audit Logs', count: s.data.auditLogs.length },
                            { label: 'Dispensing', count: s.data.dispensingHistory.length },
                          ].map(({ label, count }) => (
                            <span key={label} className={`text-xs px-2 py-0.5 rounded-full border bg-white border-slate-200 text-slate-600`}>
                              {count.toLocaleString()} {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => { handleRestoreSnapshot(s); setShowSnapshotsModal(false); }}
                        disabled={restoringSnapshot === s.id}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors shrink-0 ${s.type === 'backup' ? 'bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300' : 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300'}`}
                      >
                        {restoringSnapshot === s.id ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Restoring...</>
                        ) : (
                          <><RotateCcw size={14} /> Restore</>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
