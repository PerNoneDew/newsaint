import { supabase } from './supabase';
import type {
  User, HealthRecord, Request, Medicine, Expense, Notification, AuditLog, BackupRecord, MedicineDispensing, DataSnapshot, HealthFormRequest, HealthFormData,
} from '../types';

// ---------- Users ----------
type UserRow = {
  id: string; name: string; email: string; role: string; department: string | null;
  student_id: string | null; employee_id: string | null; faculty_id: string | null;
  admin_id: string | null; officer_id: string | null; status: string; created_at: string; password: string;
};

const userToRow = (u: User, password = ''): UserRow => ({
  id: u.id, name: u.name, email: u.email, role: u.role, department: u.department ?? null,
  student_id: u.studentId ?? null, employee_id: u.employeeId ?? null, faculty_id: u.facultyId ?? null,
  admin_id: u.adminId ?? null, officer_id: u.officerId ?? null, status: u.status, created_at: u.createdAt, password,
});
const rowToUser = (r: UserRow): User & { password?: string } => ({
  id: r.id, name: r.name, email: r.email, role: r.role as User['role'], department: r.department ?? undefined,
  studentId: r.student_id ?? undefined, employeeId: r.employee_id ?? undefined, facultyId: r.faculty_id ?? undefined,
  adminId: r.admin_id ?? undefined, officerId: r.officer_id ?? undefined, status: r.status as User['status'], createdAt: r.created_at,
  password: r.password,
});

export async function fetchUsers(): Promise<{ users: User[]; credentials: Record<string, string> }> {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  const rows = (data ?? []) as UserRow[];
  const users: User[] = rows.map((r) => {
    const { password: _pw, ...u } = rowToUser(r);
    return u;
  });
  const credentials: Record<string, string> = {};
  rows.forEach((r) => { if (r.password) credentials[r.email.trim().toLowerCase()] = r.password; });
  return { users, credentials };
}

export async function upsertUser(u: User, password?: string): Promise<void> {
  const existing = await supabase.from('users').select('password').eq('id', u.id).maybeSingle();
  const pw = password ?? existing.data?.password ?? '';
  const { error } = await supabase.from('users').upsert(userToRow(u, pw));
  if (error) throw error;
}

export async function upsertUsers(users: User[], credentials: Record<string, string>): Promise<void> {
  const rows = users.map((u) => userToRow(u, credentials[u.email.trim().toLowerCase()] ?? ''));
  const { error } = await supabase.from('users').upsert(rows);
  if (error) throw error;
}

export async function deleteUserRow(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Health Records ----------
type HealthRecordRow = {
  id: string; user_id: string; user_name: string; user_role: string | null; department: string | null;
  student_id: string | null; employee_id: string | null; faculty_id: string | null; admin_id: string | null; officer_id: string | null;
  blood_type: string; allergies: string[]; conditions: string[]; medications: string[];
  height: string | null; weight: string | null; bmi: string | null; vision: string | null; dental_status: string | null;
  last_checkup: string | null; next_checkup: string | null; emergency_contact: string | null; emergency_phone: string | null;
  notes: string | null; created_at: string; updated_at: string; archived: boolean;
  forward_status: string; forwarded_to: string | null; forward_reason: string | null; forwarded_by: string | null; forwarded_at: string | null;
};

const hrToRow = (r: HealthRecord): HealthRecordRow => ({
  id: r.id, user_id: r.userId, user_name: r.userName, user_role: r.userRole ?? null, department: r.department ?? null,
  student_id: r.studentId ?? null, employee_id: r.employeeId ?? null, faculty_id: r.facultyId ?? null,
  admin_id: r.adminId ?? null, officer_id: r.officerId ?? null, blood_type: r.bloodType,
  allergies: r.allergies, conditions: r.conditions, medications: r.medications,
  height: r.height ?? null, weight: r.weight ?? null, bmi: r.bmi ?? null, vision: r.vision ?? null, dental_status: r.dentalStatus ?? null,
  last_checkup: r.lastCheckup ?? null, next_checkup: r.nextCheckup ?? null,
  emergency_contact: r.emergencyContact ?? null, emergency_phone: r.emergencyPhone ?? null, notes: r.notes ?? null,
  created_at: r.createdAt, updated_at: r.updatedAt, archived: r.archived ?? false,
  forward_status: r.forwardStatus ?? 'active', forwarded_to: r.forwardedTo ?? null,
  forward_reason: r.forwardReason ?? null, forwarded_by: r.forwardedBy ?? null, forwarded_at: r.forwardedAt ?? null,
});
const rowToHr = (r: HealthRecordRow): HealthRecord => ({
  id: r.id, userId: r.user_id, userName: r.user_name, userRole: (r.user_role ?? undefined) as HealthRecord['userRole'], department: r.department ?? undefined,
  studentId: r.student_id ?? undefined, employeeId: r.employee_id ?? undefined, facultyId: r.faculty_id ?? undefined,
  adminId: r.admin_id ?? undefined, officerId: r.officer_id ?? undefined, bloodType: r.blood_type,
  allergies: r.allergies ?? [], conditions: r.conditions ?? [], medications: r.medications ?? [],
  height: r.height ?? '', weight: r.weight ?? '', bmi: r.bmi ?? undefined, vision: r.vision ?? undefined, dentalStatus: r.dental_status ?? undefined,
  lastCheckup: r.last_checkup ?? '', nextCheckup: r.next_checkup ?? undefined,
  emergencyContact: r.emergency_contact ?? undefined, emergencyPhone: r.emergency_phone ?? undefined, notes: r.notes ?? '',
  createdAt: r.created_at, updatedAt: r.updated_at, archived: r.archived,
  forwardStatus: (r.forward_status ?? 'active') as HealthRecord['forwardStatus'],
  forwardedTo: r.forwarded_to ?? undefined, forwardReason: r.forward_reason ?? undefined,
  forwardedBy: r.forwarded_by ?? undefined, forwardedAt: r.forwarded_at ?? undefined,
});

export async function fetchHealthRecords(): Promise<HealthRecord[]> {
  const { data, error } = await supabase.from('health_records').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToHr);
}
export async function upsertHealthRecord(r: HealthRecord): Promise<void> {
  const { error } = await supabase.from('health_records').upsert(hrToRow(r));
  if (error) throw error;
}
export async function upsertHealthRecords(records: HealthRecord[]): Promise<void> {
  const { error } = await supabase.from('health_records').upsert(records.map(hrToRow));
  if (error) throw error;
}

// ---------- Medicine Dispensing ----------
type DispensingRow = {
  id: string; medicine_id: string; medicine_name: string; patient_id: string; patient_name: string;
  patient_role: string | null; quantity: number; unit: string; dispensed_by: string; dispensed_at: string; reason: string;
};
const dispToRow = (d: MedicineDispensing): DispensingRow => ({
  id: d.id, medicine_id: d.medicineId, medicine_name: d.medicineName, patient_id: d.patientId, patient_name: d.patientName,
  patient_role: d.patientRole ?? null, quantity: d.quantity, unit: d.unit, dispensed_by: d.dispensedBy, dispensed_at: d.dispensedAt, reason: d.reason,
});
const rowToDisp = (r: DispensingRow): MedicineDispensing => ({
  id: r.id, medicineId: r.medicine_id, medicineName: r.medicine_name, patientId: r.patient_id, patientName: r.patient_name,
  patientRole: r.patient_role as MedicineDispensing['patientRole'] ?? undefined, quantity: r.quantity, unit: r.unit,
  dispensedBy: r.dispensed_by, dispensedAt: r.dispensed_at, reason: r.reason,
});

export async function fetchDispensing(): Promise<MedicineDispensing[]> {
  const { data, error } = await supabase.from('medicine_dispensing').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToDisp);
}
export async function upsertDispensing(d: MedicineDispensing): Promise<void> {
  const { error } = await supabase.from('medicine_dispensing').upsert(dispToRow(d));
  if (error) throw error;
}
export async function upsertDispensingAll(items: MedicineDispensing[]): Promise<void> {
  const { error } = await supabase.from('medicine_dispensing').upsert(items.map(dispToRow));
  if (error) throw error;
}

// ---------- Requests ----------
type RequestRow = {
  id: string; user_id: string; user_name: string; user_role: string | null; type: string; description: string; status: string;
  attachments: string[]; submitted_at: string; updated_at: string; reviewed_by: string | null; review_notes: string | null;
  remarks: string | null; forwarded_by: string | null; forwarded_to: string | null; forward_reason: string | null; forwarded_at: string | null;
};
const reqToRow = (r: Request): RequestRow => ({
  id: r.id, user_id: r.userId, user_name: r.userName, user_role: r.userRole ?? null, type: r.type, description: r.description, status: r.status,
  attachments: r.attachments, submitted_at: r.submittedAt, updated_at: r.updatedAt, reviewed_by: r.reviewedBy ?? null,
  review_notes: r.reviewNotes ?? null, remarks: r.remarks ?? null, forwarded_by: r.forwardedBy ?? null,
  forwarded_to: r.forwardedTo ?? null, forward_reason: r.forwardReason ?? null, forwarded_at: r.forwardedAt ?? null,
});
const rowToReq = (r: RequestRow): Request => ({
  id: r.id, userId: r.user_id, userName: r.user_name, userRole: r.user_role as Request['userRole'] ?? undefined, type: r.type as Request['type'],
  description: r.description, status: r.status as Request['status'], attachments: r.attachments ?? [],
  submittedAt: r.submitted_at, updatedAt: r.updated_at, reviewedBy: r.reviewed_by ?? undefined, reviewNotes: r.review_notes ?? undefined,
  remarks: r.remarks ?? undefined, forwardedBy: r.forwarded_by ?? undefined, forwardedTo: r.forwarded_to ?? undefined, forwardReason: r.forward_reason ?? undefined, forwardedAt: r.forwarded_at ?? undefined,
});

export async function fetchRequests(): Promise<Request[]> {
  const { data, error } = await supabase.from('requests').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToReq);
}
export async function upsertRequest(r: Request): Promise<void> {
  const { error } = await supabase.from('requests').upsert(reqToRow(r));
  if (error) throw error;
}
export async function upsertRequestsAll(items: Request[]): Promise<void> {
  const { error } = await supabase.from('requests').upsert(items.map(reqToRow));
  if (error) throw error;
}

// ---------- Medicines ----------
type MedicineRow = {
  id: string; name: string; category: string; quantity: number; unit: string; min_stock: number;
  expiry_date: string; supplier: string; last_updated: string; primary_key_date: string | null;
};
const medToRow = (m: Medicine): MedicineRow => ({
  id: m.id, name: m.name, category: m.category, quantity: m.quantity, unit: m.unit, min_stock: m.minStock,
  expiry_date: m.expiryDate, supplier: m.supplier, last_updated: m.lastUpdated, primary_key_date: m.primaryKeyDate ?? null,
});
const rowToMed = (r: MedicineRow): Medicine => ({
  id: r.id, name: r.name, category: r.category, quantity: r.quantity, unit: r.unit, minStock: r.min_stock,
  expiryDate: r.expiry_date, supplier: r.supplier, lastUpdated: r.last_updated, primaryKeyDate: r.primary_key_date ?? undefined,
});

export async function fetchMedicines(): Promise<Medicine[]> {
  const { data, error } = await supabase.from('medicines').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToMed);
}
export async function upsertMedicine(m: Medicine): Promise<void> {
  const { error } = await supabase.from('medicines').upsert(medToRow(m));
  if (error) throw error;
}
export async function upsertMedicinesAll(items: Medicine[]): Promise<void> {
  const { error } = await supabase.from('medicines').upsert(items.map(medToRow));
  if (error) throw error;
}

// ---------- Expenses ----------
type ExpenseRow = {
  id: string; description: string; amount: number; category: string; date: string; recorded_by: string;
  receipt_no: string; status: string; reviewed_by: string | null; review_notes: string | null; liquidated_at: string | null;
};
const expToRow = (e: Expense): ExpenseRow => ({
  id: e.id, description: e.description, amount: e.amount, category: e.category, date: e.date, recorded_by: e.recordedBy,
  receipt_no: e.receiptNo, status: e.status, reviewed_by: e.reviewedBy ?? null, review_notes: e.reviewNotes ?? null, liquidated_at: e.liquidatedAt ?? null,
});
const rowToExp = (r: ExpenseRow): Expense => ({
  id: r.id, description: r.description, amount: Number(r.amount), category: r.category as Expense['category'], date: r.date,
  recordedBy: r.recorded_by, receiptNo: r.receipt_no, status: r.status as Expense['status'], reviewedBy: r.reviewed_by ?? undefined,
  reviewNotes: r.review_notes ?? undefined, liquidatedAt: r.liquidated_at ?? undefined,
});

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToExp);
}
export async function upsertExpense(e: Expense): Promise<void> {
  const { error } = await supabase.from('expenses').upsert(expToRow(e));
  if (error) throw error;
}
export async function upsertExpensesAll(items: Expense[]): Promise<void> {
  const { error } = await supabase.from('expenses').upsert(items.map(expToRow));
  if (error) throw error;
}

// ---------- Notifications ----------
type NotifRow = {
  id: string; title: string; message: string; recipient_roles: string[]; recipient_ids: string[] | null;
  sent_by: string; sent_at: string; type: string; read: boolean;
};
const notifToRow = (n: Notification): NotifRow => ({
  id: n.id, title: n.title, message: n.message, recipient_roles: n.recipientRoles, recipient_ids: n.recipientIds ?? null,
  sent_by: n.sentBy, sent_at: n.sentAt, type: n.type, read: n.read,
});
const rowToNotif = (r: NotifRow): Notification => ({
  id: r.id, title: r.title, message: r.message, recipientRoles: (r.recipient_roles ?? []) as Notification['recipientRoles'], recipientIds: r.recipient_ids ?? undefined,
  sentBy: r.sent_by, sentAt: r.sent_at, type: r.type as Notification['type'], read: r.read,
});

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase.from('notifications').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToNotif);
}
export async function upsertNotification(n: Notification): Promise<void> {
  const { error } = await supabase.from('notifications').upsert(notifToRow(n));
  if (error) throw error;
}
export async function upsertNotificationsAll(items: Notification[]): Promise<void> {
  const { error } = await supabase.from('notifications').upsert(items.map(notifToRow));
  if (error) throw error;
}
export async function deleteNotificationRow(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Audit Logs ----------
type AuditRow = {
  id: string; user_id: string; user_name: string; action: string; module: string; details: string;
  ip_address: string; timestamp: string; type: string;
};
const auditToRow = (a: AuditLog): AuditRow => ({
  id: a.id, user_id: a.userId, user_name: a.userName, action: a.action, module: a.module, details: a.details,
  ip_address: a.ipAddress, timestamp: a.timestamp, type: a.type,
});
const rowToAudit = (r: AuditRow): AuditLog => ({
  id: r.id, userId: r.user_id, userName: r.user_name, action: r.action, module: r.module, details: r.details,
  ipAddress: r.ip_address, timestamp: r.timestamp, type: r.type as AuditLog['type'],
});

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase.from('audit_logs').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToAudit);
}
export async function upsertAuditLogsAll(items: AuditLog[]): Promise<void> {
  const { error } = await supabase.from('audit_logs').upsert(items.map(auditToRow));
  if (error) throw error;
}

// ---------- Backup Records ----------
type BackupRow = {
  id: string; filename: string; size: string; created_at: string; created_by: string; status: string; type: string;
};
const backupToRow = (b: BackupRecord): BackupRow => ({
  id: b.id, filename: b.filename, size: b.size, created_at: b.createdAt, created_by: b.createdBy, status: b.status, type: b.type,
});
const rowToBackup = (r: BackupRow): BackupRecord => ({
  id: r.id, filename: r.filename, size: r.size, createdAt: r.created_at, createdBy: r.created_by, status: r.status as BackupRecord['status'], type: r.type as BackupRecord['type'],
});

export async function fetchBackupRecords(): Promise<BackupRecord[]> {
  const { data, error } = await supabase.from('backup_records').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToBackup);
}
export async function upsertBackupRecord(b: BackupRecord): Promise<void> {
  const { error } = await supabase.from('backup_records').upsert(backupToRow(b));
  if (error) throw error;
}
export async function upsertBackupRecordsAll(items: BackupRecord[]): Promise<void> {
  const { error } = await supabase.from('backup_records').upsert(items.map(backupToRow));
  if (error) throw error;
}

// ---------- Snapshots ----------
type SnapshotRow = { id: string; name: string; type: string; created_at: string; data: DataSnapshot['data'] };

export async function fetchSnapshots(): Promise<DataSnapshot[]> {
  const { data, error } = await supabase.from('snapshots').select('*');
  if (error) throw error;
  return ((data ?? []) as SnapshotRow[]).map((r) => ({
    id: r.id, name: r.name, type: r.type as DataSnapshot['type'], createdAt: r.created_at, data: r.data,
  }));
}

export async function upsertSnapshot(s: DataSnapshot): Promise<void> {
  const row = { id: s.id, name: s.name, type: s.type, created_at: s.createdAt, data: s.data };
  const { error } = await supabase.from('snapshots').upsert(row);
  if (error) throw error;
}

export async function deleteSnapshotRow(id: string): Promise<void> {
  const { error } = await supabase.from('snapshots').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Health Form Requests ----------
type HealthFormRow = {
  id: string; user_id: string; user_name: string; user_role: string | null; department: string | null;
  form_data: HealthFormData; status: string; submitted_at: string; updated_at: string;
  reviewed_by: string | null; review_notes: string | null;
};

const hfToRow = (r: HealthFormRequest): HealthFormRow => ({
  id: r.id, user_id: r.userId, user_name: r.userName, user_role: r.userRole ?? null, department: r.department ?? null,
  form_data: r.formData, status: r.status, submitted_at: r.submittedAt, updated_at: r.updatedAt,
  reviewed_by: r.reviewedBy ?? null, review_notes: r.reviewNotes ?? null,
});
const rowToHf = (r: HealthFormRow): HealthFormRequest => ({
  id: r.id, userId: r.user_id, userName: r.user_name, userRole: (r.user_role ?? undefined) as HealthFormRequest['userRole'],
  department: r.department ?? undefined, formData: r.form_data, status: r.status as HealthFormRequest['status'],
  submittedAt: r.submitted_at, updatedAt: r.updated_at, reviewedBy: r.reviewed_by ?? undefined, reviewNotes: r.review_notes ?? undefined,
});

export async function fetchHealthFormRequests(): Promise<HealthFormRequest[]> {
  const { data, error } = await supabase.from('health_form_requests').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToHf);
}
export async function upsertHealthFormRequest(r: HealthFormRequest): Promise<void> {
  const { error } = await supabase.from('health_form_requests').upsert(hfToRow(r));
  if (error) throw error;
}
export async function upsertHealthFormRequestsAll(items: HealthFormRequest[]): Promise<void> {
  const { error } = await supabase.from('health_form_requests').upsert(items.map(hfToRow));
  if (error) throw error;
}
export async function deleteHealthFormRequestRow(id: string): Promise<void> {
  const { error } = await supabase.from('health_form_requests').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Bulk clear (for reset) ----------
export async function clearAllData(): Promise<void> {
  const tables = ['health_records', 'medicine_dispensing', 'requests', 'medicines', 'expenses', 'notifications', 'audit_logs', 'backup_records', 'health_form_requests'];
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq('id', '0');
    if (error) throw error;
  }
}
