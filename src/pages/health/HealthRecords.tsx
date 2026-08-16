import { useState } from 'react';
import { Plus, Search, Eye, CreditCard as Edit2, Archive, Pill, Activity, AlertCircle, Phone, ChevronRight, Share2 } from 'lucide-react';
import PatientSearch from '../../components/ui/PatientSearch';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { HealthRecord, UserRole, MedicineDispensing } from '../../types';
import Modal from '../../components/ui/Modal';
import Badge, { statusVariant, roleLabel } from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';

type FormData = Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt' | 'archived' | 'dispensingHistory'>;

const emptyForm: FormData = {
  userId: '', userName: '', userRole: 'student', department: '', studentId: '', employeeId: '', facultyId: '', adminId: '', officerId: '',
  bloodType: '', allergies: [], conditions: [], medications: [],
  height: '', weight: '', bmi: '', vision: '', dentalStatus: '',
  lastCheckup: '', nextCheckup: '', emergencyContact: '', emergencyPhone: '', notes: '',
};

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function HealthRecords() {
  const { currentUser } = useAuth();
  const { healthRecords, users, inventory, dispensingHistory, persistHealthRecord, persistMedicine, persistDispensing } = useData();
  const { runWithFeedback } = useFeedback();
  if (!currentUser) return null;

  const isOfficerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'health_officer';
  const isOfficer = currentUser.role === 'health_officer';
  const isPersonalView = !isOfficerOrAdmin;

  const displayRecords = isOfficerOrAdmin
    ? healthRecords.filter((r) => !r.archived)
    : healthRecords.filter((r) => r.userId === currentUser.id && !r.archived);

  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [viewRecord, setViewRecord] = useState<HealthRecord | null>(null);
  const [editRecord, setEditRecord] = useState<HealthRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [activeTab, setActiveTab] = useState<'overview' | 'dispensing'>('overview');
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [dispenseTarget, setDispenseTarget] = useState<HealthRecord | null>(null);
  const [dispenseForm, setDispenseForm] = useState({ medicineId: '', quantity: 1, reason: '' });
  const [dispenseError, setDispenseError] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showUnarchiveConfirm, setShowUnarchiveConfirm] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<HealthRecord | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<HealthRecord | null>(null);
  const [forwardForm, setForwardForm] = useState({ forwardedTo: '', reason: '' });
  const [forwardError, setForwardError] = useState('');

  const archivedRecords = healthRecords.filter((r) => r.archived);
  const activeRecords = showArchived ? archivedRecords : displayRecords;
  const filtered = activeRecords.filter((r) =>
    r.userName.toLowerCase().includes(search.toLowerCase()) ||
    r.bloodType.toLowerCase().includes(search.toLowerCase()) ||
    (r.department?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const openAdd = () => { setEditRecord(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (r: HealthRecord) => {
    setEditRecord(r);
    setForm({
      userId: r.userId, userName: r.userName, userRole: r.userRole,
      department: r.department, studentId: r.studentId, employeeId: r.employeeId, facultyId: r.facultyId, adminId: r.adminId, officerId: r.officerId,
      bloodType: r.bloodType, allergies: r.allergies, conditions: r.conditions, medications: r.medications,
      height: r.height, weight: r.weight, bmi: r.bmi, vision: r.vision, dentalStatus: r.dentalStatus,
      lastCheckup: r.lastCheckup, nextCheckup: r.nextCheckup,
      emergencyContact: r.emergencyContact, emergencyPhone: r.emergencyPhone, notes: r.notes,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.userName.trim() || !form.bloodType) return;
    const now = new Date().toISOString().split('T')[0];
    const isEdit = !!editRecord;
    const record: HealthRecord = isEdit
      ? { ...editRecord!, ...form, updatedAt: now }
      : { ...form, id: `hr${Date.now()}`, createdAt: now, updatedAt: now, archived: false, dispensingHistory: [] };
    const ok = await runWithFeedback(
      () => persistHealthRecord(record),
      { loadingTitle: isEdit ? 'Saving record…' : 'Creating record…', successTitle: isEdit ? 'Record updated' : 'Record created', successMessage: `${record.userName}'s health record has been saved.`, autoCloseMs: 1800 },
    );
    if (ok) setShowForm(false);
  };

  const archiveRecord = async (id: string) => {
    const target = healthRecords.find((r) => r.id === id);
    if (!target) return;
    const ok = await runWithFeedback(
      () => persistHealthRecord({ ...target, archived: true }),
      { loadingTitle: 'Archiving record…', successTitle: 'Record archived', successMessage: `${target.userName}'s record was moved to archive.`, autoCloseMs: 1800 },
    );
    if (ok) { setShowArchiveConfirm(false); setArchiveTarget(null); }
  };
  const unarchiveRecord = async (id: string) => {
    const target = healthRecords.find((r) => r.id === id);
    if (!target) return;
    const ok = await runWithFeedback(
      () => persistHealthRecord({ ...target, archived: false }),
      { loadingTitle: 'Restoring record…', successTitle: 'Record restored', successMessage: `${target.userName}'s record is active again.`, autoCloseMs: 1800 },
    );
    if (ok) { setShowUnarchiveConfirm(false); setArchiveTarget(null); }
  };

  const openForward = (r: HealthRecord) => {
    setForwardTarget(r);
    setForwardForm({ forwardedTo: '', reason: '' });
    setForwardError('');
    setShowForwardModal(true);
  };

  const handleForward = async () => {
    setForwardError('');
    if (!forwardTarget) { setForwardError('No patient selected.'); return; }
    if (!forwardForm.forwardedTo.trim()) { setForwardError('Please enter where the patient is being forwarded to.'); return; }
    if (!forwardForm.reason.trim()) { setForwardError('Please enter a reason for forwarding.'); return; }
    const now = new Date().toISOString().split('T')[0];
    const updated: HealthRecord = {
      ...forwardTarget,
      forwardStatus: 'forwarded',
      forwardedTo: forwardForm.forwardedTo.trim(),
      forwardReason: forwardForm.reason.trim(),
      forwardedBy: currentUser.name,
      forwardedAt: now,
      updatedAt: now,
    };
    const ok = await runWithFeedback(
      () => persistHealthRecord(updated),
      { loadingTitle: 'Forwarding patient…', successTitle: 'Patient forwarded', successMessage: `${forwardTarget.userName} has been forwarded to ${forwardForm.forwardedTo.trim()}.`, autoCloseMs: 1800 },
    );
    if (ok) setShowForwardModal(false);
  };

  const openArchiveConfirm = (r: HealthRecord) => {
    setArchiveTarget(r);
    setShowArchiveConfirm(true);
  };
  const openUnarchiveConfirm = (r: HealthRecord) => {
    setArchiveTarget(r);
    setShowUnarchiveConfirm(true);
  };

  const openDispense = (r: HealthRecord) => {
    setDispenseTarget(r);
    setDispenseForm({ medicineId: '', quantity: 1, reason: '' });
    setDispenseError('');
    setShowDispenseModal(true);
  };

  const handleDispense = async () => {
    setDispenseError('');
    if (!dispenseTarget) { setDispenseError('No patient selected.'); return; }
    if (!dispenseForm.medicineId) { setDispenseError('Please select a medicine.'); return; }
    if (dispenseForm.quantity <= 0) { setDispenseError('Quantity must be at least 1.'); return; }
    if (!dispenseForm.reason.trim()) { setDispenseError('Please enter a reason for dispensing.'); return; }
    const med = inventory.find((m) => m.id === dispenseForm.medicineId);
    if (!med) { setDispenseError('Selected medicine not found.'); return; }
    if (med.quantity < dispenseForm.quantity) { setDispenseError(`Insufficient stock. Only ${med.quantity} ${med.unit} available.`); return; }
    const now = new Date().toISOString().split('T')[0];
    const newDispensing: MedicineDispensing = {
      id: `disp${Date.now()}`, medicineId: med.id, medicineName: med.name, patientId: dispenseTarget.userId,
      patientName: dispenseTarget.userName, patientRole: dispenseTarget.userRole as UserRole,
      quantity: dispenseForm.quantity, unit: med.unit, dispensedBy: currentUser.name, dispensedAt: now, reason: dispenseForm.reason,
    };
    const updatedMed = { ...med, quantity: med.quantity - dispenseForm.quantity, lastUpdated: now };
    const updatedRecord: HealthRecord = {
      ...dispenseTarget,
      dispensingHistory: [...(dispenseTarget.dispensingHistory ?? []), newDispensing],
      medications: dispenseTarget.medications.includes(med.name) ? dispenseTarget.medications : [...dispenseTarget.medications, med.name],
      updatedAt: now,
    };
    const ok = await runWithFeedback(
      async () => {
        await persistMedicine(updatedMed);
        await persistDispensing(newDispensing);
        await persistHealthRecord(updatedRecord);
      },
      { loadingTitle: 'Dispensing medicine…', successTitle: 'Medicine dispensed', successMessage: `${dispenseForm.quantity} ${med.unit} of ${med.name} given to ${dispenseTarget.userName}.`, autoCloseMs: 1800 },
    );
    if (ok) setShowDispenseModal(false);
  };

  const parseList = (val: string) => val.split(',').map((s) => s.trim()).filter(Boolean);
  const rolePatients: UserRole[] = ['student', 'staff', 'faculty', 'employee'];

  const patientUsers = users.filter((u) => rolePatients.includes(u.role));

  const recordDispensingHistory = (r: HealthRecord) =>
    dispensingHistory.filter((d) => d.patientId === r.userId);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, blood type, college..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isOfficerOrAdmin && (
              <button onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${showArchived ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                <Archive size={14} />
                {showArchived ? 'View Active' : `Archived (${archivedRecords.length})`}
              </button>
            )}
            {isOfficer && !showArchived && (
              <button onClick={openAdd} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Plus size={15} /> Add Record
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Activity size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">No health records found</p>
            <p className="text-slate-400 text-xs mt-1">
              {isPersonalView ? 'Your health record has not been created yet. Please visit the clinic.' : showArchived ? 'No archived records.' : 'No records match your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {isOfficerOrAdmin && <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>}
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Blood Type</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Conditions / Allergies</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Vitals</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Checkup</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r) => {
                  const dispCount = recordDispensingHistory(r).length;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      {isOfficerOrAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                              <span className="text-sky-600 font-bold text-sm">{r.userName.charAt(0)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{r.userName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {r.userRole && <Badge label={roleLabel(r.userRole)} variant={statusVariant(r.userRole)} />}
                                {r.department && <span className="text-xs text-slate-400 truncate">{r.department}</span>}
                                {r.forwardStatus === 'forwarded' && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 text-sky-700 text-xs rounded-full border border-sky-200 font-medium">
                                    <Share2 size={9} /> Forwarded
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-rose-50 text-rose-700 text-sm font-bold border border-rose-100">{r.bloodType}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <div className="space-y-1">
                          {r.conditions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {r.conditions.map((c, i) => <span key={i} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-100 font-medium">{c}</span>)}
                            </div>
                          )}
                          {r.allergies.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <AlertCircle size={10} className="text-rose-400 shrink-0" />
                              <span className="text-xs text-rose-500">{r.allergies.join(', ')}</span>
                            </div>
                          )}
                          {r.conditions.length === 0 && r.allergies.length === 0 && <span className="text-xs text-slate-300">None noted</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="space-y-0.5 text-xs text-slate-500">
                          {r.height && <p><span className="font-medium text-slate-600">H:</span> {r.height}</p>}
                          {r.weight && <p><span className="font-medium text-slate-600">W:</span> {r.weight}</p>}
                          {r.bmi && <p><span className="font-medium text-slate-600">BMI:</span> {r.bmi}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-600 font-medium">{r.lastCheckup}</p>
                        {dispCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-teal-600 mt-0.5"><Pill size={10} />{dispCount} dispens.</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setViewRecord(r); setActiveTab('overview'); }} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                          {isOfficer && !showArchived && (
                            <>
                              <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit"><Edit2 size={14} /></button>
                              <button onClick={() => openDispense(r)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Dispense Medicine"><Pill size={14} /></button>
                              <button onClick={() => openForward(r)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Forward Patient"><Share2 size={14} /></button>
                              <button onClick={() => openArchiveConfirm(r)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Archive"><Archive size={14} /></button>
                            </>
                          )}
                          {isOfficerOrAdmin && showArchived && (
                            <button onClick={() => openUnarchiveConfirm(r)} className="p-1.5 text-xs text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium px-2" title="Restore">Restore</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={viewRecord !== null} onClose={() => setViewRecord(null)} title="Health Record Details" size="lg">
        {viewRecord && (() => {
          const dispHistory = recordDispensingHistory(viewRecord);
          return (
            <div className="space-y-4">
              {/* Patient header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-teal-50 rounded-xl border border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center shrink-0">
                  <span className="text-sky-600 font-bold text-xl">{viewRecord.userName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-lg">{viewRecord.userName}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {viewRecord.userRole && <Badge label={roleLabel(viewRecord.userRole)} variant={statusVariant(viewRecord.userRole)} />}
                    {viewRecord.department && <span className="text-sm text-slate-500">{viewRecord.department}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {viewRecord.adminId ? `Admin ID: ${viewRecord.adminId}` :
                     viewRecord.officerId ? `Officer ID: ${viewRecord.officerId}` :
                     viewRecord.studentId ? `Student ID: ${viewRecord.studentId}` :
                     viewRecord.facultyId ? `Faculty ID: ${viewRecord.facultyId}` :
                     viewRecord.employeeId ? `Employee ID: ${viewRecord.employeeId}` : ''}
                  </p>
                </div>
                <span className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-100 text-lg">{viewRecord.bloodType}</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                {(['overview', 'dispensing'] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {tab === 'dispensing' ? `Medicine Dispensing (${dispHistory.length})` : 'Overview'}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Vitals */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vital Information</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Height', value: viewRecord.height },
                        { label: 'Weight', value: viewRecord.weight },
                        { label: 'BMI', value: viewRecord.bmi },
                        { label: 'Vision', value: viewRecord.vision },
                        { label: 'Dental Status', value: viewRecord.dentalStatus },
                      ].map(({ label, value }) => value ? (
                        <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                          <p className="text-xs text-slate-400 mb-1">{label}</p>
                          <p className="text-sm font-bold text-slate-700">{value}</p>
                        </div>
                      ) : null)}
                    </div>
                  </div>

                  {/* Medical Info */}
                  <div className="grid grid-cols-1 gap-3">
                    <MedList label="Allergies" items={viewRecord.allergies} emptyText="No known allergies" colorClass="bg-rose-50 text-rose-700 border-rose-100" />
                    <MedList label="Medical Conditions" items={viewRecord.conditions} emptyText="No known conditions" colorClass="bg-amber-50 text-amber-700 border-amber-100" />
                    <MedList label="Current Medications" items={viewRecord.medications} emptyText="No current medications" colorClass="bg-teal-50 text-teal-700 border-teal-100" />
                  </div>

                  {/* Checkup Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-center">
                      <p className="text-xs text-sky-400 font-medium">Last Checkup</p>
                      <p className="text-sm font-bold text-sky-700 mt-0.5">{viewRecord.lastCheckup}</p>
                    </div>
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center">
                      <p className="text-xs text-teal-400 font-medium">Next Checkup</p>
                      <p className="text-sm font-bold text-teal-700 mt-0.5">{viewRecord.nextCheckup || '—'}</p>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  {(viewRecord.emergencyContact || viewRecord.emergencyPhone) && (
                    <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                      <Phone size={16} className="text-rose-500 shrink-0" />
                      <div>
                        <p className="text-xs text-rose-400 font-medium">Emergency Contact</p>
                        <p className="text-sm font-semibold text-rose-700">{viewRecord.emergencyContact}</p>
                        {viewRecord.emergencyPhone && <p className="text-sm text-rose-600">{viewRecord.emergencyPhone}</p>}
                      </div>
                    </div>
                  )}

                  {viewRecord.notes && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Clinical Notes</p>
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 leading-relaxed text-justify border border-slate-100">{viewRecord.notes}</p>
                    </div>
                  )}

                  {viewRecord.forwardStatus === 'forwarded' && (
                    <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Share2 size={15} className="text-sky-600" />
                        <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">Forwarding Details</p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium text-slate-500">Forwarded to:</span> <span className="font-semibold text-slate-700">{viewRecord.forwardedTo}</span></div>
                        <div><span className="font-medium text-slate-500">Reason:</span> <span className="text-slate-700">{viewRecord.forwardReason}</span></div>
                        <div><span className="font-medium text-slate-500">Forwarded by:</span> <span className="text-slate-700">{viewRecord.forwardedBy}</span></div>
                        <div><span className="font-medium text-slate-500">Date:</span> <span className="text-slate-700">{viewRecord.forwardedAt}</span></div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div><span className="font-medium text-slate-500">Created:</span> {viewRecord.createdAt}</div>
                    <div><span className="font-medium text-slate-500">Updated:</span> {viewRecord.updatedAt}</div>
                  </div>
                </div>
              )}

              {activeTab === 'dispensing' && (
                <div className="space-y-3">
                  {dispHistory.length === 0 ? (
                    <div className="text-center py-10">
                      <Pill size={28} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">No medicine dispensing records yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dispHistory.map((d) => (
                        <div key={d.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-teal-50 rounded-lg shrink-0"><Pill size={14} className="text-teal-500" /></div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{d.medicineName}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{d.reason}</p>
                              <p className="text-xs text-slate-400 mt-0.5">By {d.dispensedBy} · {d.dispensedAt}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-teal-600">{d.quantity}</p>
                            <p className="text-xs text-slate-400">{d.unit}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isOfficer && (
                    <button onClick={() => { setViewRecord(null); openDispense(viewRecord); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">
                      <Pill size={15} /> Dispense Medicine
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Dispense Medicine Modal */}
      <Modal isOpen={showDispenseModal} onClose={() => setShowDispenseModal(false)} title="Dispense Medicine" size="md">
        {dispenseTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
              <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                <span className="text-sky-600 font-bold">{dispenseTarget.userName.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{dispenseTarget.userName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {dispenseTarget.userRole && <Badge label={roleLabel(dispenseTarget.userRole)} variant={statusVariant(dispenseTarget.userRole)} />}
                  <span className="text-xs text-slate-400">{dispenseTarget.department}</span>
                </div>
              </div>
            </div>
            {dispenseError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                {dispenseError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Medicine</label>
              <select value={dispenseForm.medicineId} onChange={(e) => setDispenseForm({ ...dispenseForm, medicineId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">-- Select Medicine --</option>
                {inventory.filter((m) => m.quantity > 0).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.quantity} {m.unit} available)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input type="number" min={1}
                max={dispenseForm.medicineId ? (inventory.find((m) => m.id === dispenseForm.medicineId)?.quantity ?? 1) : 1}
                value={dispenseForm.quantity}
                onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Dispensing</label>
              <textarea value={dispenseForm.reason} onChange={(e) => setDispenseForm({ ...dispenseForm, reason: e.target.value })} rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                placeholder="e.g. Fever and headache, first aid..." />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowDispenseModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDispense} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors flex items-center gap-1.5">
                <Pill size={14} /> Dispense
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editRecord ? 'Update Health Record' : 'Add Health Record'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
              <PatientSearch
                patients={patientUsers}
                selectedId={form.userId}
                onSelect={(u) => {
                  if (u) {
                    setForm({ ...form, userId: u.id, userName: u.name, userRole: u.role, department: u.department, studentId: u.studentId, employeeId: u.employeeId, facultyId: u.facultyId, adminId: u.adminId, officerId: u.officerId });
                  } else {
                    setForm({ ...form, userId: '', userName: '', userRole: 'student', department: '', studentId: '', employeeId: '', facultyId: '', adminId: '', officerId: '' });
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Blood Type</label>
              <select value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">Select blood type</option>
                {bloodTypes.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Height</label>
              <input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. 170 cm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight</label>
              <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. 65 kg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">BMI</label>
              <input value={form.bmi ?? ''} onChange={(e) => setForm({ ...form, bmi: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. 22.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vision</label>
              <input value={form.vision ?? ''} onChange={(e) => setForm({ ...form, vision: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. 20/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dental Status</label>
              <input value={form.dentalStatus ?? ''} onChange={(e) => setForm({ ...form, dentalStatus: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Good / Needs cleaning" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Checkup Date</label>
              <input type="date" value={form.lastCheckup} onChange={(e) => setForm({ ...form, lastCheckup: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Checkup Date</label>
              <input type="date" value={form.nextCheckup ?? ''} onChange={(e) => setForm({ ...form, nextCheckup: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
              <input value={form.emergencyContact ?? ''} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Name and relation" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Phone</label>
              <input value={form.emergencyPhone ?? ''} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. 09171234567" />
            </div>
          </div>
          {(['allergies', 'conditions', 'medications'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">{field} <span className="text-slate-400 font-normal">(comma-separated)</span></label>
              <input value={form[field].join(', ')} onChange={(e) => setForm({ ...form, [field]: parseList(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder={field === 'allergies' ? 'e.g. Penicillin, Shellfish' : field === 'conditions' ? 'e.g. Asthma, Hypertension' : 'e.g. Salbutamol, Metformin'} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" placeholder="Additional clinical notes..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors flex items-center gap-1.5">
              <ChevronRight size={14} />{editRecord ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={showArchiveConfirm}
        onClose={() => { setShowArchiveConfirm(false); setArchiveTarget(null); }}
        onConfirm={() => archiveTarget && archiveRecord(archiveTarget.id)}
        title="Archive Health Record"
        message={`Are you sure you want to archive the health record for ${archiveTarget?.userName}? The record will be moved to the archive and hidden from the active list.`}
        confirmLabel="Archive Record"
        type="warning"
        details={[
          'Record will be hidden from active view',
          'Record can be restored from archive later',
          'Dispensing history will be preserved'
        ]}
      />

      {/* Unarchive Confirmation Modal */}
      <ConfirmModal
        isOpen={showUnarchiveConfirm}
        onClose={() => { setShowUnarchiveConfirm(false); setArchiveTarget(null); }}
        onConfirm={() => archiveTarget && unarchiveRecord(archiveTarget.id)}
        title="Restore Health Record"
        message={`Are you sure you want to restore the health record for ${archiveTarget?.userName}? It will be returned to the active records list.`}
        confirmLabel="Restore Record"
        type="success"
      />

      {/* Forward Patient Modal */}
      {showForwardModal && forwardTarget && (
        <Modal isOpen={showForwardModal} onClose={() => setShowForwardModal(false)} title={`Forward Patient — ${forwardTarget.userName}`}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl">
              <Share2 size={18} className="text-sky-600 mt-0.5 shrink-0" />
              <p className="text-sm text-sky-800">
                Forwarding transfers this patient to another facility or personnel. The patient's status will be marked as <span className="font-semibold">Forwarded</span>.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Forward To <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={forwardForm.forwardedTo}
                onChange={(e) => setForwardForm((f) => ({ ...f, forwardedTo: e.target.value }))}
                placeholder="e.g. City General Hospital, Dr. Smith (Cardiology)"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reason <span className="text-rose-500">*</span></label>
              <textarea
                value={forwardForm.reason}
                onChange={(e) => setForwardForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Reason for forwarding (e.g. needs specialist care, referred for X-ray)"
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition resize-none"
              />
            </div>
            {forwardError && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5"><AlertCircle size={14} /> {forwardError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForwardModal(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button onClick={handleForward} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition flex items-center justify-center gap-2"><Share2 size={15} /> Forward Patient</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MedList({ label, items, emptyText, colorClass }: { label: string; items: string[]; emptyText: string; colorClass: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>{item}</span>
          ))}
        </div>
      )}
    </div>
  );
}
