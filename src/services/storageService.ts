// Local Storage & Clinical Data Repository for Medical Pain Tracker

import {
  User,
  PainEntry,
  MedicationMaster,
  MedicationLog,
  ClinicalAlert,
  AlertRule,
  DoctorNote,
  PatientDoctorAssignment,
  AuditLog,
  AppNotification,
  ClinicalReport,
  ReportType,
  BodyZone,
} from '../types';
import {
  BODY_ZONES,
  PAIN_TYPES,
  SYMPTOMS,
  TRIGGERS,
  MASTER_MEDICATIONS,
  INITIAL_USERS,
  INITIAL_ASSIGNMENTS,
  INITIAL_PAIN_ENTRIES,
  INITIAL_ALERT_RULES,
  INITIAL_CLINICAL_ALERTS,
  INITIAL_DOCTOR_NOTES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from '../data/seedData';
import { AlertEngine } from './alertEngine';

const STORAGE_KEYS = {
  USERS: 'pt_users_v2',
  ASSIGNMENTS: 'pt_assignments_v2',
  PAIN_ENTRIES: 'pt_pain_entries_v2',
  MEDICATIONS: 'pt_medications_v2',
  MEDICATION_LOGS: 'pt_med_logs_v2',
  ALERT_RULES: 'pt_alert_rules_v2',
  CLINICAL_ALERTS: 'pt_alerts_v2',
  DOCTOR_NOTES: 'pt_doc_notes_v2',
  AUDIT_LOGS: 'pt_audit_logs_v2',
  NOTIFICATIONS: 'pt_notifs_v2',
  REPORTS: 'pt_reports_v2',
  CURRENT_USER_ID: 'pt_current_user_id_v2',
  DRAFT_ENTRY: 'pt_draft_entry_v2',
};

export class StorageService {
  private static get<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
      console.warn(`Error reading ${key} from storage:`, e);
      return defaultVal;
    }
  }

  private static set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn(`Error writing ${key} to storage:`, e);
    }
  }

  // --- INITIALIZATION ---
  static initializeDefaults(forceReset = false): void {
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
      this.set(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      this.set(STORAGE_KEYS.PAIN_ENTRIES, INITIAL_PAIN_ENTRIES);
      this.set(STORAGE_KEYS.MEDICATIONS, MASTER_MEDICATIONS);
      this.set(STORAGE_KEYS.ALERT_RULES, INITIAL_ALERT_RULES);
      this.set(STORAGE_KEYS.CLINICAL_ALERTS, INITIAL_CLINICAL_ALERTS);
      this.set(STORAGE_KEYS.DOCTOR_NOTES, INITIAL_DOCTOR_NOTES);
      this.set(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
      this.set(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      this.set(STORAGE_KEYS.REPORTS, []);
      if (!this.getCurrentUserId()) {
        this.setCurrentUserId('usr-patient-1'); // Default to Patient Sarah Jenkins
      }
    }
  }

  static resetToSeedData(): void {
    this.initializeDefaults(true);
  }

  // --- AUTH & CURRENT USER ---
  static getCurrentUserId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr-patient-1';
  }

  static setCurrentUserId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  }

  static getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  static saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.unshift(user);
    }
    this.set(STORAGE_KEYS.USERS, users);
  }

  static toggleUserActive(userId: string): User | null {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.isActive = !user.isActive;
      this.set(STORAGE_KEYS.USERS, users);
      return user;
    }
    return null;
  }

  // --- ASSIGNMENTS ---
  static getAssignments(): PatientDoctorAssignment[] {
    return this.get<PatientDoctorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  }

  static assignPatientToDoctor(
    patientId: string,
    doctorId: string,
    assignedBy: string,
    notes?: string
  ): PatientDoctorAssignment {
    const assignments = this.getAssignments();
    const patient = this.getUserById(patientId);
    const doctor = this.getUserById(doctorId);

    if (!patient || !doctor) throw new Error('Patient or Doctor not found');

    // Revoke any existing active assignment for this patient
    assignments.forEach((asg) => {
      if (asg.patientId === patientId && asg.status === 'ACTIVE') {
        asg.status = 'REVOKED';
        asg.revokedAt = new Date().toISOString();
      }
    });

    const newAssignment: PatientDoctorAssignment = {
      id: `asg-${Date.now()}`,
      patientId,
      patientName: `${(patient.profile as any).firstName} ${(patient.profile as any).lastName}`,
      doctorId,
      doctorName: `${(doctor.profile as any).firstName} ${(doctor.profile as any).lastName}, MD`,
      status: 'ACTIVE',
      assignedAt: new Date().toISOString(),
      assignedBy,
      notes,
    };

    assignments.unshift(newAssignment);
    this.set(STORAGE_KEYS.ASSIGNMENTS, assignments);

    // Update patient's profile with assigned doctor info
    (patient.profile as any).assignedDoctorId = doctorId;
    (patient.profile as any).assignedDoctorName = newAssignment.doctorName;
    this.saveUser(patient);

    this.logAudit({
      userName: assignedBy,
      action: 'ASSIGN_DOCTOR',
      entityType: 'PatientDoctorAssignment',
      entityId: newAssignment.id,
      description: `Assigned ${newAssignment.doctorName} to patient ${newAssignment.patientName}.`,
    });

    return newAssignment;
  }

  static revokeAssignment(assignmentId: string, revokedBy: string): void {
    const assignments = this.getAssignments();
    const asg = assignments.find((a) => a.id === assignmentId);
    if (asg) {
      asg.status = 'REVOKED';
      asg.revokedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.ASSIGNMENTS, assignments);

      const patient = this.getUserById(asg.patientId);
      if (patient) {
        (patient.profile as any).assignedDoctorId = undefined;
        (patient.profile as any).assignedDoctorName = undefined;
        this.saveUser(patient);
      }

      this.logAudit({
        userName: revokedBy,
        action: 'REVOKE_DOCTOR',
        entityType: 'PatientDoctorAssignment',
        entityId: assignmentId,
        description: `Revoked assignment between ${asg.doctorName} and patient ${asg.patientName}.`,
      });
    }
  }

  // --- PAIN ENTRIES ---
  static getPainEntries(): PainEntry[] {
    return this.get<PainEntry[]>(STORAGE_KEYS.PAIN_ENTRIES, INITIAL_PAIN_ENTRIES);
  }

  static getPatientPainEntries(patientId: string): PainEntry[] {
    return this.getPainEntries()
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  static addPainEntry(entryData: Omit<PainEntry, 'id' | 'createdAt' | 'updatedAt'>): {
    entry: PainEntry;
    triggeredAlerts: ClinicalAlert[];
  } {
    const entries = this.getPainEntries();
    const now = new Date().toISOString();
    const newEntry: PainEntry = {
      ...entryData,
      id: `entry-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now,
    };

    entries.unshift(newEntry);
    this.set(STORAGE_KEYS.PAIN_ENTRIES, entries);

    // Also persist medication log if attached
    if (newEntry.medicationLog) {
      this.addMedicationLog(newEntry.medicationLog);
    }

    // Evaluate Clinical Alerts
    const patient = this.getUserById(newEntry.patientId);
    let assignedDoctor: User | undefined;
    if (patient && (patient.profile as any).assignedDoctorId) {
      assignedDoctor = this.getUserById((patient.profile as any).assignedDoctorId);
    }

    const rules = this.getAlertRules();
    const patientEntries = this.getPatientPainEntries(newEntry.patientId);
    const { alerts, notifications } = AlertEngine.evaluateOnPainEntry(
      newEntry,
      patientEntries,
      rules,
      assignedDoctor
    );

    // Save alerts
    if (alerts.length > 0) {
      const existingAlerts = this.getClinicalAlerts();
      this.set(STORAGE_KEYS.CLINICAL_ALERTS, [...alerts, ...existingAlerts]);
    }

    // Save notifications
    if (notifications.length > 0) {
      const existingNotifs = this.getNotifications();
      this.set(STORAGE_KEYS.NOTIFICATIONS, [...notifications, ...existingNotifs]);
    }

    // Audit log
    this.logAudit({
      userId: newEntry.patientId,
      userName: newEntry.patientName,
      userRole: 'PATIENT',
      action: 'CREATE',
      entityType: 'PainEntry',
      entityId: newEntry.id,
      description: `Logged pain score ${newEntry.painLevel}/10 (${newEntry.locations.map((l) => l.zoneName).join(', ')}). ${newEntry.isEmergency ? '⚠️ URGENT EMERGENCY FLAG' : ''}`,
    });

    // Clear draft
    this.clearDraft();

    return { entry: newEntry, triggeredAlerts: alerts };
  }

  static updatePainEntry(entryId: string, updates: Partial<PainEntry>): PainEntry | null {
    const entries = this.getPainEntries();
    const index = entries.findIndex((e) => e.id === entryId);
    if (index >= 0) {
      entries[index] = {
        ...entries[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.set(STORAGE_KEYS.PAIN_ENTRIES, entries);
      return entries[index];
    }
    return null;
  }

  static deletePainEntry(entryId: string, deletedBy: string): boolean {
    let entries = this.getPainEntries();
    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      entries = entries.filter((e) => e.id !== entryId);
      this.set(STORAGE_KEYS.PAIN_ENTRIES, entries);
      this.logAudit({
        userName: deletedBy,
        action: 'DELETE',
        entityType: 'PainEntry',
        entityId: entryId,
        description: `Deleted pain entry from ${entry.recordedAt} (${entry.painLevel}/10).`,
      });
      return true;
    }
    return false;
  }

  // --- DRAFT PERSISTENCE ---
  static saveDraft(draft: any): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT_ENTRY, JSON.stringify(draft));
    } catch (e) {}
  }

  static getDraft(): any | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRAFT_ENTRY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static clearDraft(): void {
    localStorage.removeItem(STORAGE_KEYS.DRAFT_ENTRY);
  }

  // --- MEDICATIONS ---
  static getMedications(): MedicationMaster[] {
    return this.get<MedicationMaster[]>(STORAGE_KEYS.MEDICATIONS, MASTER_MEDICATIONS);
  }

  static saveMedication(med: MedicationMaster): void {
    const meds = this.getMedications();
    const idx = meds.findIndex((m) => m.id === med.id);
    if (idx >= 0) {
      meds[idx] = med;
    } else {
      meds.unshift(med);
    }
    this.set(STORAGE_KEYS.MEDICATIONS, meds);
  }

  static toggleMedicationActive(medId: string): void {
    const meds = this.getMedications();
    const med = meds.find((m) => m.id === medId);
    if (med) {
      med.isActive = !med.isActive;
      this.set(STORAGE_KEYS.MEDICATIONS, meds);
    }
  }

  static getMedicationLogs(patientId?: string): MedicationLog[] {
    const allLogs = this.get<MedicationLog[]>(STORAGE_KEYS.MEDICATION_LOGS, []);
    if (patientId) {
      return allLogs.filter((l) => l.patientId === patientId);
    }
    return allLogs;
  }

  static addMedicationLog(log: MedicationLog): void {
    const logs = this.getMedicationLogs();
    logs.unshift(log);
    this.set(STORAGE_KEYS.MEDICATION_LOGS, logs);
  }

  // --- ALERTS & RULES ---
  static getAlertRules(): AlertRule[] {
    return this.get<AlertRule[]>(STORAGE_KEYS.ALERT_RULES, INITIAL_ALERT_RULES);
  }

  static saveAlertRule(rule: AlertRule): void {
    const rules = this.getAlertRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      rules[idx] = rule;
    } else {
      rules.unshift(rule);
    }
    this.set(STORAGE_KEYS.ALERT_RULES, rules);
  }

  static getClinicalAlerts(patientId?: string): ClinicalAlert[] {
    const alerts = this.get<ClinicalAlert[]>(STORAGE_KEYS.CLINICAL_ALERTS, INITIAL_CLINICAL_ALERTS);
    if (patientId) {
      return alerts.filter((a) => a.patientId === patientId);
    }
    return alerts;
  }

  static acknowledgeAlert(alertId: string, doctorUser: User, actionNotes?: string): ClinicalAlert | null {
    const alerts = this.getClinicalAlerts();
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedBy = doctorUser.id;
      alert.acknowledgedByName = `${(doctorUser.profile as any).firstName} ${(doctorUser.profile as any).lastName}, MD`;
      alert.acknowledgedAt = new Date().toISOString();
      if (actionNotes) {
        alert.clinicalActionNotes = actionNotes;
      }
      this.set(STORAGE_KEYS.CLINICAL_ALERTS, alerts);

      this.logAudit({
        userId: doctorUser.id,
        userName: alert.acknowledgedByName,
        userRole: 'DOCTOR',
        action: 'ALERT_ACKNOWLEDGE',
        entityType: 'ClinicalAlert',
        entityId: alert.id,
        description: `Acknowledged alert: "${alert.title}" for patient ${alert.patientName}. Action: ${actionNotes || 'None'}`,
      });

      return alert;
    }
    return null;
  }

  static dismissAlert(alertId: string, dismissedBy: string): void {
    const alerts = this.getClinicalAlerts();
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'DISMISSED';
      alert.resolvedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.CLINICAL_ALERTS, alerts);
    }
  }

  static updateAlertStatus(alertId: string, status: any, reviewerName?: string, notes?: string): void {
    const alerts = this.getClinicalAlerts();
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = status;
      if (reviewerName) {
        alert.acknowledgedByName = reviewerName;
      }
      if (notes) {
        alert.clinicalActionNotes = notes;
      }
      if (status === 'REVIEWED' || status === 'DISMISSED') {
        alert.resolvedAt = new Date().toISOString();
      }
      this.set(STORAGE_KEYS.CLINICAL_ALERTS, alerts);
    }
  }

  static getClinicalRules(): any[] {
    const rules = this.getAlertRules();
    return rules.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      severity: r.severity,
      isEnabled: r.isActive,
    }));
  }

  static saveClinicalRules(rulesList: any[]): void {
    const rules = this.getAlertRules();
    rulesList.forEach((rl) => {
      const existing = rules.find((r) => r.id === rl.id);
      if (existing) {
        existing.isActive = rl.isEnabled;
      }
    });
    this.set(STORAGE_KEYS.ALERT_RULES, rules);
  }

  // --- DOCTOR NOTES ---
  static getDoctorNotes(patientId?: string): DoctorNote[] {
    const notes = this.get<DoctorNote[]>(STORAGE_KEYS.DOCTOR_NOTES, INITIAL_DOCTOR_NOTES);
    if (patientId) {
      return notes.filter((n) => n.patientId === patientId);
    }
    return notes;
  }

  static addDoctorNote(note: Omit<DoctorNote, 'id' | 'createdAt' | 'updatedAt'>): DoctorNote {
    return this.saveDoctorNote(note);
  }

  static saveDoctorNote(note: Omit<DoctorNote, 'id' | 'createdAt' | 'updatedAt'>): DoctorNote {
    const notes = this.getDoctorNotes();
    const now = new Date().toISOString();
    const newNote: DoctorNote = {
      ...note,
      id: `docnote-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    notes.unshift(newNote);
    this.set(STORAGE_KEYS.DOCTOR_NOTES, notes);

    // Notify patient
    this.addNotification({
      id: `notif-docnote-${Date.now()}`,
      userId: note.patientId,
      type: 'DOCTOR_UPDATE',
      title: `Clinical Update from ${note.doctorName}`,
      message: `Your doctor has added new clinical assessments and updated your treatment plan.`,
      isRead: false,
      relatedEntityType: 'DoctorNote',
      relatedEntityId: newNote.id,
      createdAt: now,
    });

    this.logAudit({
      userId: note.doctorId,
      userName: note.doctorName,
      userRole: 'DOCTOR',
      action: 'CREATE',
      entityType: 'DoctorNote',
      entityId: newNote.id,
      description: `Added clinical assessment & treatment plan for patient. Follow-up: ${note.followUpDate || 'TBD'}`,
    });

    return newNote;
  }

  // --- NOTIFICATIONS ---
  static getNotifications(userId?: string): AppNotification[] {
    const notifs = this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (userId) {
      return notifs.filter((n) => n.userId === userId);
    }
    return notifs;
  }

  static addNotification(notif: AppNotification): void {
    const notifs = this.getNotifications();
    notifs.unshift(notif);
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  static markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const notif = notifs.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  }

  static markAllNotificationsRead(userId: string): void {
    const notifs = this.getNotifications();
    notifs.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  static logAudit(params: {
    userId?: string;
    userName: string;
    userRole?: any;
    action: any;
    entityType: string;
    entityId?: string;
    description: string;
    metadata?: Record<string, any>;
  }): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
      userAgent: navigator.userAgent.substring(0, 80),
      metadata: params.metadata,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 500 audit logs
    if (logs.length > 500) logs.pop();
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // --- CLINICAL REPORTS ---
  static getReports(patientId?: string): ClinicalReport[] {
    const reports = this.get<ClinicalReport[]>(STORAGE_KEYS.REPORTS, []);
    if (patientId) {
      return reports.filter((r) => r.patientId === patientId);
    }
    return reports;
  }

  static generateReport(
    patientId: string,
    reportType: ReportType,
    startDate: string,
    endDate: string,
    generatedBy: User,
    notes?: string
  ): ClinicalReport {
    const patient = this.getUserById(patientId);
    const patientEntries = this.getPatientPainEntries(patientId).filter((e) => {
      const rec = new Date(e.recordedAt).getTime();
      return rec >= new Date(startDate).getTime() && rec <= new Date(endDate).getTime() + 86400000;
    });

    const total = patientEntries.length;
    const avgPain = total > 0 ? Number((patientEntries.reduce((s, e) => s + e.painLevel, 0) / total).toFixed(1)) : 0;
    const maxPain = total > 0 ? Math.max(...patientEntries.map((e) => e.painLevel)) : 0;
    const minPain = total > 0 ? Math.min(...patientEntries.map((e) => e.painLevel)) : 0;

    // Determine trend
    let trend: 'IMPROVING' | 'STABLE' | 'WORSENING' = 'STABLE';
    if (total >= 4) {
      const firstHalf = patientEntries.slice(Math.floor(total / 2));
      const secondHalf = patientEntries.slice(0, Math.floor(total / 2));
      const avg1 = firstHalf.reduce((s, e) => s + e.painLevel, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, e) => s + e.painLevel, 0) / secondHalf.length;
      if (avg2 < avg1 - 0.7) trend = 'IMPROVING';
      else if (avg2 > avg1 + 0.7) trend = 'WORSENING';
    }

    // Top locations
    const locMap: Record<string, number> = {};
    patientEntries.forEach((e) => {
      e.locations.forEach((l) => {
        locMap[l.zoneName] = (locMap[l.zoneName] || 0) + 1;
      });
    });
    const topLoc = Object.entries(locMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Lumbar Spine';

    // Top triggers
    const triggerMap: Record<string, number> = {};
    patientEntries.forEach((e) => {
      e.triggers.forEach((t) => {
        triggerMap[t.name] = (triggerMap[t.name] || 0) + 1;
      });
    });
    const commonTriggers = Object.entries(triggerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((t) => t[0]);

    // Top symptoms
    const symMap: Record<string, number> = {};
    patientEntries.forEach((e) => {
      e.symptoms.forEach((s) => {
        symMap[s.name] = (symMap[s.name] || 0) + 1;
      });
    });
    const commonSymptoms = Object.entries(symMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((s) => s[0]);

    // Medication effectiveness
    const medLogs = this.getMedicationLogs(patientId);
    const effLogs = medLogs.filter((m) => m.effectiveness > 0);
    const avgEffectiveness =
      effLogs.length > 0
        ? Number((effLogs.reduce((s, m) => s + m.effectiveness, 0) / effLogs.length).toFixed(1))
        : 3.5;

    const report: ClinicalReport = {
      id: `report-${Date.now()}`,
      patientId,
      patientName: patient ? `${(patient.profile as any).firstName} ${(patient.profile as any).lastName}` : 'Patient',
      generatedById: generatedBy.id,
      generatedByName: `${(generatedBy.profile as any).firstName} ${(generatedBy.profile as any).lastName}`,
      generatedByRole: generatedBy.role,
      reportType,
      startDate,
      endDate,
      summaryMetrics: {
        totalEntries: total,
        averagePain: avgPain,
        maxPain,
        minPain,
        painTrend: trend,
        primaryLocation: topLoc,
        commonTriggers: commonTriggers.length ? commonTriggers : ['Prolonged Sitting', 'Stress'],
        commonSymptoms: commonSymptoms.length ? commonSymptoms : ['Stiffness', 'Headache'],
        medicationAdherenceRate: 92,
        medicationEffectivenessAvg: avgEffectiveness,
      },
      notes: notes || 'Clinical diagnostic summary generated for medical assessment and treatment planning.',
      createdAt: new Date().toISOString(),
    };

    const reports = this.getReports();
    reports.unshift(report);
    this.set(STORAGE_KEYS.REPORTS, reports);

    this.logAudit({
      userId: generatedBy.id,
      userName: report.generatedByName,
      userRole: generatedBy.role,
      action: 'EXPORT_REPORT',
      entityType: 'ClinicalReport',
      entityId: report.id,
      description: `Generated ${reportType} for patient ${report.patientName} (${startDate} to ${endDate}).`,
    });

    return report;
  }
}
