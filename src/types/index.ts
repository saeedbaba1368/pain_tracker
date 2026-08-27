// Medical Pain Tracker Types & Interfaces

export type UserRole = 'PATIENT' | 'DOCTOR' | 'OPERATOR' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  profile: PatientProfile | DoctorProfile | OperatorProfile | AdminProfile;
}

export interface PatientProfile {
  firstName: string;
  lastName: string;
  nationalId?: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
  phone: string;
  bloodType?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  primaryDiagnosis?: string;
}

export interface DoctorProfile {
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  department: string;
  hospitalAffiliation: string;
}

export interface OperatorProfile {
  firstName: string;
  lastName: string;
  badgeNumber: string;
  phone: string;
  clinicBranch: string;
}

export interface AdminProfile {
  firstName: string;
  lastName: string;
  adminLevel: 'SUPER_ADMIN' | 'CLINICAL_ADMIN' | 'SYSTEM_ADMIN';
  phone: string;
}

export interface PatientDoctorAssignment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: 'ACTIVE' | 'REVOKED';
  assignedAt: string;
  revokedAt?: string;
  assignedBy: string;
  notes?: string;
}

// Body Map & Anatomy Definitions
export type BodyView = 'FRONT' | 'BACK';
export type BodySide = 'LEFT' | 'RIGHT' | 'BOTH' | 'CENTER' | 'NONE';

export interface BodyZone {
  id: string;
  name: string;
  parentRegion: string;
  bodyView: BodyView;
  side: BodySide;
  svgPath?: string;
  sortOrder: number;
}

export interface SelectedZoneIntensity {
  zoneId: string;
  zoneName: string;
  parentRegion: string;
  intensity: number; // 0-10
}

export interface PainTypeOption {
  id: string;
  name: string;
  description: string;
  iconName?: string;
}

export interface SymptomOption {
  id: string;
  name: string;
  category: 'NEUROLOGICAL' | 'PHYSICAL' | 'GASTROINTESTINAL' | 'PSYCHOLOGICAL' | 'OTHER';
}

export interface TriggerOption {
  id: string;
  name: string;
  category: 'FOOD' | 'ACTIVITY' | 'STRESS' | 'SLEEP' | 'WEATHER' | 'POSTURE' | 'OTHER';
}

export type MedicationCategory =
  | 'ANALGESIC'
  | 'NSAID'
  | 'OPIOID'
  | 'MUSCLE_RELAXANT'
  | 'ANTICONVULSANT'
  | 'ANTIDEPRESSANT'
  | 'TOPICAL'
  | 'OTHER';

export interface MedicationMaster {
  id: string;
  name: string;
  genericName: string;
  dosageUnit: string;
  category: MedicationCategory;
  standardDose?: string;
  isActive: boolean;
}

export interface MedicationLog {
  id: string;
  patientId: string;
  medicationId?: string;
  customMedicationName?: string;
  medicationName: string;
  dosage: string;
  category?: MedicationCategory;
  frequency?: string;
  takenAt: string;
  effectiveness: number; // 0: Not evaluated, 1: None, 2: Slight, 3: Moderate, 4: Good, 5: Excellent
  notes?: string;
  painEntryId?: string;
}

export interface PainEntryLocation {
  zoneId: string;
  zoneName: string;
  intensity?: number;
}

export interface PainEntrySymptom {
  symptomId: string;
  name: string;
  severity: 1 | 2 | 3 | 4 | 5; // 1: Mild to 5: Severe
}

export interface PainEntryTrigger {
  triggerId: string;
  name: string;
  description?: string;
}

export interface PainEntry {
  id: string;
  patientId: string;
  patientName: string;
  recordedAt: string;
  painLevel: number; // 0 to 10
  painTypeId?: string;
  painTypeName?: string;
  durationMinutes?: number;
  durationLabel?: string;
  locations: PainEntryLocation[];
  symptoms: PainEntrySymptom[];
  triggers: PainEntryTrigger[];
  medicationLog?: MedicationLog;
  notes?: string;
  isEmergency: boolean;
  createdAt: string;
  updatedAt: string;
}

// Alert System
export type AlertRuleType =
  | 'SUDDEN_SEVERE'
  | 'VERY_HIGH_PAIN'
  | 'RAPID_WORSENING'
  | 'PERSISTENT_PAIN'
  | 'MEDICATION_INEFFECTIVE'
  | 'PATIENT_EMERGENCY'
  | 'DOCTOR_DEFINED';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'REVIEWED' | 'DISMISSED';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  ruleType: AlertRuleType;
  severity: AlertSeverity;
  thresholdValue: {
    minPainLevel?: number;
    deltaIncrease?: number;
    consecutiveEntries?: number;
    consecutiveDays?: number;
    minEffectiveness?: number;
    customMessage?: string;
  };
  isGlobal: boolean;
  patientId?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
}

export interface ClinicalRuleConfig {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  isEnabled: boolean;
}

export interface ClinicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  painEntryId?: string;
  alertRuleId?: string;
  alertType: AlertRuleType;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  clinicalActionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

// Doctor Notes & Clinical Assessments
export interface DoctorNote {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  assessment: string;
  treatmentPlan: string;
  prescriptionsRecommended?: string;
  prescriptionsChanged?: string;
  clinicalNotes?: string;
  followUpDate?: string;
  recordedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Clinical Reports
export type ReportType =
  | 'PATIENT_SUMMARY'
  | 'DOCTOR_REPORT'
  | 'PAIN_HISTORY'
  | 'MEDICATION_REPORT'
  | 'SYSTEM_REPORT';

export interface ClinicalReport {
  id: string;
  patientId?: string;
  patientName?: string;
  generatedById: string;
  generatedByName: string;
  generatedByRole: UserRole;
  reportType: ReportType;
  startDate: string;
  endDate: string;
  summaryMetrics: {
    totalEntries: number;
    averagePain: number;
    maxPain: number;
    minPain: number;
    painTrend: 'IMPROVING' | 'STABLE' | 'WORSENING';
    primaryLocation: string;
    commonTriggers: string[];
    commonSymptoms: string[];
    medicationAdherenceRate: number;
    medicationEffectivenessAvg: number;
  };
  notes?: string;
  createdAt: string;
}

// Notifications
export type NotificationType =
  | 'PAIN_REMINDER'
  | 'MEDICATION_REMINDER'
  | 'ALERT'
  | 'DOCTOR_UPDATE'
  | 'SYSTEM'
  | 'APPOINTMENT';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType?: 'PainEntry' | 'ClinicalAlert' | 'DoctorNote' | 'Report';
  relatedEntityId?: string;
  createdAt: string;
}

// Audit Logging
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'EXPORT_REPORT'
  | 'ASSIGN_DOCTOR'
  | 'REVOKE_DOCTOR'
  | 'ACCOUNT_CREATE'
  | 'ALERT_ACKNOWLEDGE'
  | 'ALERT_REVIEW'
  | 'EMERGENCY_TRIGGER';

export interface AuditLog {
  id: string;
  userId?: string;
  userName: string;
  userRole?: UserRole;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
