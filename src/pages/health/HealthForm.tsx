import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle, FileText, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { HealthFormData, HealthFormRequest, HealthFormStatus } from '../../types';
import Modal from '../../components/ui/Modal';
import Badge, { statusVariant } from '../../components/ui/Badge';

const emptyForm: HealthFormData = {
  fullName: '', gradeLevel: '', age: '', dateOfBirth: '', gender: '', address: '', contactNumber: '', email: '', idNumber: '', yearLevelOrPosition: '',
  height: '', weight: '', bloodPressure: '', bloodType: '', allergies: '', medications: '', chronicConditions: '', previousIllnesses: '', surgeries: '', familyHistory: '',
  emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '', smokingStatus: '', alcoholConsumption: '', exerciseFrequency: '', physicianNotes: '',
  allergyAnimals: '', allergyFoods: '', allergyChemicals: '', allergyPollen: '', allergySoap: '', allergyDrugs: '', physicalRestrictions: '', contagiousDiseaseExposure: '', medicationDetails: '',
  healthHistory: [], healthHistoryDetails: '', additionalInformation: '', releaseConsent: false, minorTreatmentConsent: false, studentSignature: '', releaseSignatureDate: '', parentSignature: '', parentSignatureDate: '',
};

const historyOptions = [
  'ADD/ADHD', 'Arthritis/Joints', 'Asthma', 'Birth Defects', 'Blood Disorder', 'Bowel Problems', 'Cancer',
  'Developmental Delays', 'Diabetes', 'Hearing Problems', 'Heart Problems', 'Hepatitis', 'Hospitalizations', 'Learning Problems',
  'Menstrual Problems', 'Mental Health Issues', 'Migraines', 'Physical Limitations', 'Relationship Issues', 'Seizures, tics, or tremors', 'Serious Illness',
  'Skin Problems', 'Stomach Problems', 'Surgeries', 'Urinary Problems', 'Visual Problems', 'Pregnancy', 'Other',
];

const lineInput = 'paper-input';
const sectionTitle = 'font-black text-[15px] uppercase tracking-wide text-slate-900';

type LineFieldProps = { label?: string; name: keyof HealthFormData; value: string; onChange: (name: keyof HealthFormData, value: string) => void; type?: string; className?: string };

function LineField({ label, name, value, onChange, type = 'text', className = '' }: LineFieldProps) {
  return <label className={`flex items-end gap-1 text-[13px] font-semibold text-slate-900 ${className}`}><span className="whitespace-nowrap">{label}</span><input type={type} value={value} onChange={(event) => onChange(name, event.target.value)} className={lineInput} /></label>;
}

function RuledLines({ value, onChange, rows = 2, name = 'additionalInformation' }: { value: string; onChange: (name: keyof HealthFormData, value: string) => void; rows?: number; name?: keyof HealthFormData }) {
  return <textarea name={name} value={value} onChange={(event) => onChange(name, event.target.value)} rows={rows} className="w-full resize-y border-0 bg-transparent px-1 py-1 text-[13px] leading-[26px] text-slate-800 outline-none" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 25px, #334155 26px)' }} />;
}

function PaperSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="border-t-2 border-slate-800 pt-3 mt-6"><h2 className={sectionTitle}>{title}</h2><div className="mt-3">{children}</div></section>;
}

export default function HealthForm() {
  const { currentUser } = useAuth();
  const { healthFormRequests, persistHealthFormRequest } = useData();
  const [form, setForm] = useState<HealthFormData>(emptyForm);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<HealthFormRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState<HealthFormStatus>('approved');
  const [reviewNotes, setReviewNotes] = useState('');

  if (!currentUser) return null;

  const isReviewer = currentUser.role === 'admin' || currentUser.role === 'health_officer';
  const visibleRequests = isReviewer ? healthFormRequests : healthFormRequests.filter((request) => request.userId === currentUser.id);
  const latestRequest = visibleRequests[0];

  const updateField = (name: keyof HealthFormData, value: string) => setForm((previous) => ({ ...previous, [name]: value }));

  const toggleHistory = (item: string) => setForm((previous) => ({ ...previous, healthHistory: previous.healthHistory.includes(item) ? previous.healthHistory.filter((entry) => entry !== item) : [...previous.healthHistory, item] }));

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setFormError('');
    if (!form.fullName.trim() || !form.email.trim()) {
      setFormError('Please complete the student name and email address.');
      return;
    }
    if (!form.releaseConsent) {
      setFormError('Please agree to the release of medical information before submitting.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const request: HealthFormRequest = {
      id: `hfr${Date.now()}`, userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, department: currentUser.department,
      formData: { ...form }, status: 'pending', submittedAt: today, updatedAt: today,
    };
    await persistHealthFormRequest(request);
    setForm(emptyForm);
    setMessage('Student Health Record Form submitted successfully.');
  };

  const saveReview = async () => {
    if (!selectedRequest) return;
    await persistHealthFormRequest({ ...selectedRequest, status: reviewStatus, reviewedBy: currentUser.name, reviewNotes: reviewNotes.trim() || undefined, updatedAt: new Date().toISOString().split('T')[0] });
    setSelectedRequest(null);
    setReviewNotes('');
  };

  if (isReviewer) {
    return <div className="space-y-5"><div className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex items-center gap-3"><FileText className="text-teal-600" size={21} /><div><h2 className="text-lg font-bold text-slate-800">Submitted Health Record Forms</h2><p className="text-sm text-slate-500">Review student submissions using the original paper-form details.</p></div></div></div><div className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="px-5 py-4 border-b border-slate-200 flex justify-between"><span className="font-semibold text-slate-800">Submissions</span><span className="text-sm text-slate-500">{healthFormRequests.length} total</span></div>{visibleRequests.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">No health forms have been submitted.</p> : <div className="divide-y divide-slate-100">{visibleRequests.map((request) => <button key={request.id} onClick={() => { setSelectedRequest(request); setReviewStatus(request.status === 'rejected' ? 'approved' : request.status); setReviewNotes(request.reviewNotes ?? ''); }} className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-slate-50"><div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold">{request.userName.charAt(0)}</div><div className="flex-1"><p className="text-sm font-semibold text-slate-700">{request.userName}</p><p className="text-xs text-slate-400">Submitted {request.submittedAt} · {request.formData.gradeLevel || 'Grade level not provided'}</p></div><Badge label={request.status.charAt(0).toUpperCase() + request.status.slice(1)} variant={statusVariant(request.status)} /></button>)}</div>}</div><Modal isOpen={selectedRequest !== null} onClose={() => setSelectedRequest(null)} title="Review Student Health Form" size="lg">{selectedRequest && <div className="space-y-4"><div className="paper-sheet rounded-lg border border-slate-300 bg-[#fffef9] p-6"><PaperHeader /><PaperStudentInformation data={selectedRequest.formData} /><PaperHealthInformation data={selectedRequest.formData} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Review decision</label><div className="grid grid-cols-2 gap-2"><button onClick={() => setReviewStatus('approved')} className={`rounded-lg border py-2 text-sm font-medium ${reviewStatus === 'approved' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>Approve</button><button onClick={() => setReviewStatus('rejected')} className={`rounded-lg border py-2 text-sm font-medium ${reviewStatus === 'rejected' ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600'}`}>Reject</button></div></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Review notes</label><textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" /></div><div className="flex justify-end gap-2"><button onClick={() => setSelectedRequest(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button><button onClick={saveReview} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Save Decision</button></div></div>}</Modal></div>;
  }

  return <div className="space-y-5"><div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4"><div><h2 className="text-lg font-bold text-slate-800">Student Health Record Form</h2><p className="text-sm text-slate-500">Please fill out all applicable information clearly.</p></div>{latestRequest && <Badge label={latestRequest.status.charAt(0).toUpperCase() + latestRequest.status.slice(1)} variant={statusVariant(latestRequest.status)} />}</div>{message && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle size={16} />{message}</div>}{formError && <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><XCircle size={16} />{formError}</div>}<form onSubmit={submitForm} className="paper-sheet mx-auto max-w-5xl rounded-sm border border-slate-300 bg-[#fffef9] px-6 py-7 text-slate-900 shadow-md sm:px-10 sm:py-9"><PaperHeader /><PaperSection title="Student Information"><div className="space-y-2"><div className="flex flex-wrap gap-x-6 gap-y-1"><LineField label="Student's Name:" name="fullName" value={form.fullName} onChange={updateField} className="min-w-[260px] flex-1" /><LineField label="Grade Level:" name="gradeLevel" value={form.gradeLevel} onChange={updateField} className="w-full sm:w-44" /><LineField label="Age:" name="age" value={form.age} onChange={updateField} className="w-full sm:w-20" /></div><div className="flex flex-wrap gap-x-6 gap-y-1"><LineField label="Date of Birth:" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} className="w-full sm:flex-1" /><LineField label="Gender:" name="gender" value={form.gender} onChange={updateField} className="w-full sm:flex-1" /><LineField label="Height:" name="height" value={form.height} onChange={updateField} className="w-full sm:flex-1" /><LineField label="Weight:" name="weight" value={form.weight} onChange={updateField} className="w-full sm:flex-1" /><LineField label="Phone Number:" name="contactNumber" value={form.contactNumber} onChange={updateField} className="w-full sm:flex-1" /></div><LineField label="Address:" name="address" value={form.address} onChange={updateField} /><div className="flex flex-wrap gap-x-6 gap-y-1"><LineField label="Emergency Contact:" name="emergencyContactName" value={form.emergencyContactName} onChange={updateField} className="min-w-[230px] flex-1" /><LineField label="Relationship:" name="emergencyContactRelationship" value={form.emergencyContactRelationship} onChange={updateField} className="min-w-[150px] flex-1" /><LineField label="Contact Number:" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={updateField} className="min-w-[180px] flex-1" /></div></div></PaperSection><PaperSection title="Health Information"><p className="text-[13px] font-semibold">Do you have any allergies to (circle all that apply):</p><div className="mt-2 space-y-0.5 pl-5 text-[13px] font-semibold">{[['A.', 'Animals/Insects (specify)', 'allergyAnimals'], ['B.', 'Foods (specify)', 'allergyFoods'], ['C.', 'Chemical/Household Products (specify)', 'allergyChemicals'], ['D.', 'Pollens/Dust', 'allergyPollen'], ['E.', 'Soap/Personal Care Products (specify)', 'allergySoap'], ['F.', 'Drugs/Medications (specify)', 'allergyDrugs']].map(([letter, label, name]) => <div key={name} className="flex items-end gap-2"><span>{letter}</span><span className="whitespace-nowrap">{label}:</span><input value={String(form[name as keyof HealthFormData])} onChange={(event) => updateField(name as keyof HealthFormData, event.target.value)} className={lineInput} /></div>)}</div><p className="mt-4 text-[13px] font-semibold">Do you have any physical restrictions or special problems? If yes, please list directions below:</p><RuledLines name="physicalRestrictions" value={form.physicalRestrictions} onChange={updateField} rows={2} /><p className="mt-2 text-[13px] font-semibold">Have you had recent exposure to any contagious disease? <span className="ml-5">YES <input type="checkbox" checked={form.contagiousDiseaseExposure === 'Yes'} onChange={() => updateField('contagiousDiseaseExposure', form.contagiousDiseaseExposure === 'Yes' ? '' : 'Yes')} className="accent-teal-600" />&nbsp;&nbsp; NO <input type="checkbox" checked={form.contagiousDiseaseExposure === 'No'} onChange={() => updateField('contagiousDiseaseExposure', form.contagiousDiseaseExposure === 'No' ? '' : 'No')} className="accent-teal-600" /></span></p><p className="mt-3 text-[13px] font-semibold">Please list any current medication being taken and the reason for each below:</p><RuledLines name="medicationDetails" value={form.medicationDetails} onChange={updateField} rows={2} /></PaperSection><PaperSection title="Health History"><p className="text-[13px] font-semibold">Please check all the conditions you have or have had:</p><div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-1 text-[12px] font-semibold sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, column) => <div key={column}>{historyOptions.slice(column * 7, column * 7 + 7).map((item) => <label key={item} className="flex items-center gap-1"><input type="checkbox" checked={form.healthHistory.includes(item)} onChange={() => toggleHistory(item)} className="accent-teal-600" />{item}</label>)}</div>)}</div><p className="mt-4 text-[13px] font-semibold">If you have any of the above, please describe briefly:</p><RuledLines name="healthHistoryDetails" value={form.healthHistoryDetails} onChange={updateField} rows={2} /><p className="mt-3 text-[13px] font-semibold">Other Disease or any additional information we should know?</p><RuledLines name="additionalInformation" value={form.additionalInformation} onChange={updateField} rows={3} /></PaperSection><PaperSection title="Consents"><p className="text-[12px] font-semibold uppercase underline">Release of Medical Information</p><p className="mt-1 text-[11px] leading-relaxed">I hereby authorize SFC-G to disclose information on the health forms to any Health Care Provider who has rendered medical services to me.</p><label className="mt-2 flex items-start gap-2 text-[12px] font-semibold"><input type="checkbox" checked={form.releaseConsent} onChange={(event) => setForm({ ...form, releaseConsent: event.target.checked })} className="mt-0.5 accent-teal-600" />I agree to the release of my medical information for health care purposes.</label><div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2"><LineField label="Student's Signature:" name="studentSignature" value={form.studentSignature} onChange={updateField} /><LineField label="Date:" name="releaseSignatureDate" type="date" value={form.releaseSignatureDate} onChange={updateField} /></div><div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2"><LineField label="Parent/Legal Guardian Signature:" name="parentSignature" value={form.parentSignature} onChange={updateField} /><LineField label="Date:" name="parentSignatureDate" type="date" value={form.parentSignatureDate} onChange={updateField} /></div><p className="mt-5 text-[12px] font-semibold uppercase underline">Parental Consent for Medical Treatment of Minor</p><p className="mt-1 text-[11px] leading-relaxed">I hereby authorize my son/daughter to be treated by the medical staff of SFC-G if needed, and in case of emergency, to be taken to the nearest emergency care center or hospital for treatment.</p></PaperSection><div className="mt-7 flex items-center justify-between border-t border-slate-300 pt-4"><span className="flex items-center gap-2 text-[11px] text-slate-500"><ShieldCheck size={15} /> Information is kept confidential.</span><button type="submit" className="rounded bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700">Submit Form</button></div></form></div>;
}

function PaperHeader() {
  return <header className="text-center"><img src="/logo.png" alt="Saint Francis College logo" className="mx-auto h-14 w-auto object-contain" /><p className="mt-2 text-[10px] font-bold leading-tight">Saint Francis College Guihulngan, Negros Oriental, Incorporated<br />Bateria, Guihulngan City, Negros Oriental</p><div className="mt-2 border-t-2 border-slate-800 pt-1"><h1 className="text-xl font-black tracking-tight">STUDENT HEALTH RECORD FORM</h1></div></header>;
}

function PaperStudentInformation({ data }: { data: HealthFormData }) {
  return <PaperSection title="Student Information"><div className="space-y-2 text-[13px] font-semibold"><p>Student's Name: <span className="border-b border-slate-800">{data.fullName}</span> &nbsp;&nbsp; Grade Level: <span className="border-b border-slate-800">{data.gradeLevel}</span> &nbsp;&nbsp; Age: <span className="border-b border-slate-800">{data.age}</span></p><p>Date of Birth: {data.dateOfBirth} &nbsp;&nbsp; Gender: {data.gender} &nbsp;&nbsp; Height: {data.height} &nbsp;&nbsp; Weight: {data.weight}</p><p>Address: {data.address}</p><p>Emergency Contact: {data.emergencyContactName} &nbsp;&nbsp; Relationship: {data.emergencyContactRelationship} &nbsp;&nbsp; Contact Number: {data.emergencyContactPhone}</p></div></PaperSection>;
}

function PaperHealthInformation({ data }: { data: HealthFormData }) {
  return <PaperSection title="Health Information"><div className="space-y-2 text-[12px]"><p><b>Allergies:</b> Animals/Insects: {data.allergyAnimals || 'None'} · Foods: {data.allergyFoods || 'None'} · Chemicals: {data.allergyChemicals || 'None'} · Drugs: {data.allergyDrugs || 'None'}</p><p><b>Restrictions:</b> {data.physicalRestrictions || 'None listed'}</p><p><b>Contagious disease exposure:</b> {data.contagiousDiseaseExposure || 'Not answered'}</p><p><b>Current medications:</b> {data.medicationDetails || 'None listed'}</p><p><b>Health history:</b> {data.healthHistory.join(', ') || 'None checked'}</p><p><b>Additional information:</b> {data.additionalInformation || 'None'}</p></div></PaperSection>;
}
