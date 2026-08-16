export type UserRole = 'admin' | 'health_officer' | 'student' | 'staff' | 'faculty' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  studentId?: string;
  employeeId?: string;
  facultyId?: string;
  adminId?: string;
  officerId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface MedicineDispensing {
  id: string;
  medicineId: string;
  medicineName: string;
  patientId: string;
  patientName: string;
  patientRole: UserRole;
  quantity: number;
  unit: string;
  dispensedBy: string;
  dispensedAt: string;
  reason: string;
}

export type ForwardStatus = 'active' | 'forwarded' | 'transferred';

export interface HealthRecord {
  id: string;
  userId: string;
  userName: string;
  userRole?: UserRole;
  department?: string;
  studentId?: string;
  employeeId?: string;
  facultyId?: string;
  adminId?: string;
  officerId?: string;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  height: string;
  weight: string;
  bmi?: string;
  vision?: string;
  dentalStatus?: string;
  lastCheckup: string;
  nextCheckup?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes: string;
  dispensingHistory?: MedicineDispensing[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  forwardStatus?: ForwardStatus;
  forwardedTo?: string;
  forwardReason?: string;
  forwardedBy?: string;
  forwardedAt?: string;
}

export type PatientServiceClassification = 'medical' | 'dental' | 'medicine';

export type RequestType = PatientServiceClassification;

export type RequestStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'released' | 'forwarded';

export interface Request {
  id: string;
  userId: string;
  userName: string;
  userRole?: UserRole;
  type: RequestType;
  description: string;
  status: RequestStatus;
  attachments: string[];
  submittedAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
  remarks?: string;
  forwardedBy?: string;
  forwardedTo?: string;
  forwardReason?: string;
  forwardedAt?: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  expiryDate: string;
  supplier: string;
  lastUpdated: string;
  primaryKeyDate?: string;
}

export type ExpenseCategory = 'medicines' | 'equipment' | 'supplies' | 'services' | 'other';
export type ExpenseStatus = 'recorded' | 'verified' | 'liquidated';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  recordedBy: string;
  receiptNo: string;
  status: ExpenseStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  liquidatedAt?: string;
}

export type NotificationType = 'announcement' | 'status_update' | 'alert' | 'reminder' | 'approval' | 'rejection';

export interface Notification {
  id: string;
  title: string;
  message: string;
  recipientRoles: UserRole[];
  recipientIds?: string[];
  sentBy: string;
  sentAt: string;
  type: NotificationType;
  read: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'system';
}

export interface BackupRecord {
  id: string;
  filename: string;
  size: string;
  createdAt: string;
  createdBy: string;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'manual' | 'scheduled';
}

export interface DataSnapshot {
  id: string;
  name: string;
  createdAt: string;
  type: 'backup' | 'pre_reset' | 'initial';
  data: {
    users: User[];
    healthRecords: HealthRecord[];
    requests: Request[];
    inventory: Medicine[];
    expenses: Expense[];
    notifications: Notification[];
    auditLogs: AuditLog[];
    dispensingHistory: MedicineDispensing[];
  };
}

export type HealthFormStatus = 'pending' | 'approved' | 'rejected';

export interface HealthFormData {
  fullName: string;
  gradeLevel: string;
  age: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  contactNumber: string;
  email: string;
  idNumber: string;
  yearLevelOrPosition: string;
  height: string;
  weight: string;
  bloodPressure: string;
  bloodType: string;
  allergies: string;
  medications: string;
  chronicConditions: string;
  previousIllnesses: string;
  surgeries: string;
  familyHistory: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  smokingStatus: string;
  alcoholConsumption: string;
  exerciseFrequency: string;
  physicianNotes: string;
  allergyAnimals: string;
  allergyFoods: string;
  allergyChemicals: string;
  allergyPollen: string;
  allergySoap: string;
  allergyDrugs: string;
  physicalRestrictions: string;
  contagiousDiseaseExposure: string;
  medicationDetails: string;
  healthHistory: string[];
  healthHistoryDetails: string;
  additionalInformation: string;
  releaseConsent: boolean;
  minorTreatmentConsent: boolean;
  studentSignature: string;
  releaseSignatureDate: string;
  parentSignature: string;
  parentSignatureDate: string;
}

export interface HealthFormRequest {
  id: string;
  userId: string;
  userName: string;
  userRole?: UserRole;
  department?: string;
  formData: HealthFormData;
  status: HealthFormStatus;
  submittedAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export type Page =
  | 'dashboard'
  | 'users'
  | 'health-records'
  | 'health-form'
  | 'requests'
  | 'inventory'
  | 'liquidation'
  | 'notifications'
  | 'reports'
  | 'audit-trail'
  | 'backup-recovery';
