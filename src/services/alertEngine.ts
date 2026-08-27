// Clinical Alert Engine for Automated Pain Surveillance & Safety Rules (Persian / فارسی)

import { PainEntry, ClinicalAlert, AlertRule, User, AppNotification, MedicationLog } from '../types';

export class AlertEngine {
  /**
   * Evaluate safety rules on a newly recorded pain entry.
   * Returns any triggered ClinicalAlert records and creates notifications.
   */
  static evaluateOnPainEntry(
    entry: PainEntry,
    allPatientEntries: PainEntry[],
    activeRules: AlertRule[],
    assignedDoctor?: User
  ): { alerts: ClinicalAlert[]; notifications: AppNotification[] } {
    const triggeredAlerts: ClinicalAlert[] = [];
    const generatedNotifs: AppNotification[] = [];
    const now = new Date().toISOString();

    // 1. Patient Manual Emergency Flag
    if (entry.isEmergency) {
      const emergencyRule = activeRules.find((r) => r.ruleType === 'PATIENT_EMERGENCY' && r.isActive);
      const alert: ClinicalAlert = {
        id: `alert-emg-${Date.now()}`,
        patientId: entry.patientId,
        patientName: entry.patientName,
        painEntryId: entry.id,
        alertRuleId: emergencyRule?.id,
        alertType: 'PATIENT_EMERGENCY',
        severity: 'CRITICAL',
        title: '🚨 درخواست فوری و وضعیت اورژانسی بیمار',
        message: `بیمار ${entry.patientName} درخواست فوری مداخله پزشکی را با شدت درد ${entry.painLevel} از ۱۰ اعلام کرده است.`,
        status: 'NEW',
        createdAt: now,
      };
      triggeredAlerts.push(alert);
    }

    // 2. Very High Pain (9 or 10)
    if (entry.painLevel >= 9) {
      const rule = activeRules.find((r) => r.ruleType === 'VERY_HIGH_PAIN' && r.isActive);
      const alert: ClinicalAlert = {
        id: `alert-vhigh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        patientId: entry.patientId,
        patientName: entry.patientName,
        painEntryId: entry.id,
        alertRuleId: rule?.id,
        alertType: 'VERY_HIGH_PAIN',
        severity: 'CRITICAL',
        title: `هشدار درد بحرانی و طاقت‌فرسا (${entry.painLevel} از ۱۰)`,
        message: `بیمار درد حداکثری ${entry.painLevel}/۱۰ را در نواحی ${entry.locations.map((l) => l.zoneName).join('، ')} گزارش نموده است.`,
        status: 'NEW',
        createdAt: now,
      };
      triggeredAlerts.push(alert);
    }

    // Sort prior entries chronologically
    const priorEntries = allPatientEntries
      .filter((e) => e.id !== entry.id)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    // 3. Sudden Severe Spike (Level >= 8 with low prior baseline average < 5.5)
    if (entry.painLevel >= 8) {
      const recentPrior = priorEntries.slice(0, 7);
      if (recentPrior.length >= 2) {
        const avgPrior = recentPrior.reduce((sum, e) => sum + e.painLevel, 0) / recentPrior.length;
        if (avgPrior < 5.5 && entry.painLevel - avgPrior >= 3) {
          const rule = activeRules.find((r) => r.ruleType === 'SUDDEN_SEVERE' && r.isActive);
          const alert: ClinicalAlert = {
            id: `alert-spike-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            patientId: entry.patientId,
            patientName: entry.patientName,
            painEntryId: entry.id,
            alertRuleId: rule?.id,
            alertType: 'SUDDEN_SEVERE',
            severity: 'HIGH',
            title: `جهش ناگهانی و شدید درد (+${(entry.painLevel - avgPrior).toFixed(1)} نمره افزایش)`,
            message: `نمره درد به ${entry.painLevel}/۱۰ افزایش یافته که نسبت به میانگین ثبت‌های اخیر (${avgPrior.toFixed(1)}/۱۰) جهش قابل‌توجه دارد.`,
            status: 'NEW',
            createdAt: now,
          };
          triggeredAlerts.push(alert);
        }
      }
    }

    // 4. Rapid Worsening (Last 3 entries strictly increasing)
    if (priorEntries.length >= 2) {
      const recentThree = [entry, priorEntries[0], priorEntries[1]];
      if (recentThree[0].painLevel > recentThree[1].painLevel && recentThree[1].painLevel > recentThree[2].painLevel) {
        const rule = activeRules.find((r) => r.ruleType === 'RAPID_WORSENING' && r.isActive);
        const alert: ClinicalAlert = {
          id: `alert-worsen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          patientId: entry.patientId,
          patientName: entry.patientName,
          painEntryId: entry.id,
          alertRuleId: rule?.id,
          alertType: 'RAPID_WORSENING',
          severity: 'MEDIUM',
          title: 'روند صعودی و تشدید سریع درد در نوبت‌های متوالی',
          message: `افزایش متوالی در سه نوبت اخیر: ${recentThree[2].painLevel}/۱۰ ← ${recentThree[1].painLevel}/۱۰ ← ${recentThree[0].painLevel}/۱۰.`,
          status: 'NEW',
          createdAt: now,
        };
        triggeredAlerts.push(alert);
      }
    }

    // 5. Persistent Severe Pain (Last 3 entries all >= 7)
    if (entry.painLevel >= 7 && priorEntries.length >= 2) {
      const lastTwo = [priorEntries[0], priorEntries[1]];
      if (lastTwo.every((e) => e.painLevel >= 7)) {
        const rule = activeRules.find((r) => r.ruleType === 'PERSISTENT_PAIN' && r.isActive);
        const alert: ClinicalAlert = {
          id: `alert-persist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          patientId: entry.patientId,
          patientName: entry.patientName,
          painEntryId: entry.id,
          alertRuleId: rule?.id,
          alertType: 'PERSISTENT_PAIN',
          severity: 'HIGH',
          title: 'تداوم درد شدید در دوره‌های متوالی',
          message: `بیمار درد شدید (سطح ۷/۱۰ یا بالاتر) را در ۳ ثبت متوالی گزارش کرده است.`,
          status: 'NEW',
          createdAt: now,
        };
        triggeredAlerts.push(alert);
      }
    }

    // Create notifications
    for (const alert of triggeredAlerts) {
      // Patient Notification
      generatedNotifs.push({
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: entry.patientId,
        type: 'ALERT',
        title: `هشدار بالینی: ${alert.title}`,
        message: alert.message,
        isRead: false,
        relatedEntityType: 'ClinicalAlert',
        relatedEntityId: alert.id,
        createdAt: now,
      });

      // Doctor Notification if linked
      if (assignedDoctor) {
        generatedNotifs.push({
          id: `notif-doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: assignedDoctor.id,
          type: 'ALERT',
          title: `هشدار [${alert.severity === 'CRITICAL' ? 'بحرانی' : alert.severity === 'HIGH' ? 'بالا' : 'متوسط'}]: ${entry.patientName}`,
          message: alert.message,
          isRead: false,
          relatedEntityType: 'ClinicalAlert',
          relatedEntityId: alert.id,
          createdAt: now,
        });
      }
    }

    return { alerts: triggeredAlerts, notifications: generatedNotifs };
  }

  /**
   * Evaluate medication effectiveness logs
   */
  static evaluateMedicationLogs(
    patientLogs: MedicationLog[],
    patient: User,
    assignedDoctor?: User
  ): { alert?: ClinicalAlert; notification?: AppNotification } {
    if (patientLogs.length < 3) return {};

    const sorted = [...patientLogs].sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
    const recent3 = sorted.slice(0, 3);
    const allIneffective = recent3.every((l) => l.effectiveness > 0 && l.effectiveness <= 1);

    if (allIneffective) {
      const now = new Date().toISOString();
      const alert: ClinicalAlert = {
        id: `alert-med-${Date.now()}`,
        patientId: patient.id,
        patientName: `${(patient.profile as any).firstName} ${(patient.profile as any).lastName}`,
        alertType: 'MEDICATION_INEFFECTIVE',
        severity: 'MEDIUM',
        title: 'گزارش عدم اثربخشی رژیم دارویی تسکین‌بخش',
        message: `بیمار در ۳ نوبت متوالی مصرف دارو اثربخشی ناچیز (امتیاز کمتر یا مساوی ۱ از ۵) گزارش نموده است: ${recent3.map((m) => m.medicationName).join('، ')}.`,
        status: 'NEW',
        createdAt: now,
      };

      const notification: AppNotification = {
        id: `notif-med-${Date.now()}`,
        userId: assignedDoctor ? assignedDoctor.id : patient.id,
        type: 'ALERT',
        title: `هشدار رژیم دارویی: ${alert.patientName}`,
        message: alert.message,
        isRead: false,
        relatedEntityType: 'ClinicalAlert',
        relatedEntityId: alert.id,
        createdAt: now,
      };

      return { alert, notification };
    }

    return {};
  }
}
