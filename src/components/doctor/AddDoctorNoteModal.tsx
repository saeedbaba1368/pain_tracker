import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DoctorNote, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { Modal } from '../common/Modal';
import { Calendar, Pill, Save } from 'lucide-react';
import { addDays, format } from 'date-fns';

interface AddDoctorNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: User;
  onNoteAdded: (note: DoctorNote) => void;
}

export const AddDoctorNoteModal: React.FC<AddDoctorNoteModalProps> = ({
  isOpen,
  onClose,
  patient,
  onNoteAdded,
}) => {
  const { currentUser } = useAuth();

  const [assessment, setAssessment] = useState<string>('');
  const [treatmentPlan, setTreatmentPlan] = useState<string>('');
  const [prescriptionsChanged, setPrescriptionsChanged] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>(
    format(addDays(new Date(), 14), 'yyyy-MM-dd')
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const patientName = `${(patient.profile as any).firstName} ${(patient.profile as any).lastName}`;
  const doctorName = currentUser
    ? `${(currentUser.profile as any).firstName} ${(currentUser.profile as any).lastName}`
    : 'دکتر رضا مرادی';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment.trim() || !treatmentPlan.trim()) return;

    setIsSaving(true);
    const newNote = StorageService.addDoctorNote({
      doctorId: currentUser?.id || 'usr-doctor-1',
      doctorName,
      patientId: patient.id,
      patientName,
      recordedAt: new Date().toISOString(),
      assessment,
      treatmentPlan,
      prescriptionsChanged: prescriptionsChanged.trim() || undefined,
      followUpDate: followUpDate || undefined,
    });

    setIsSaving(false);
    onNoteAdded(newNote);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت ارزیابی بالینی و برنامه درمانی پزشک"
      subtitle={`پرونده بیمار: ${patientName} (${patient.username})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-right">
        {/* Clinical Assessment */}
        <div>
          <label className="block font-bold text-slate-800 text-[11px] mb-1">
            خلاصه ارزیابی و تشخیص بالینی پزشک <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            placeholder="مثال: بیمار علائم درد میوفاسیال لومبار با انتشار به درماتوم L5 چپ را نشان می‌دهد. دوز فعلی داروهای ضدالتهاب غیراستروئیدی برای کنترل حملات حاد کافی نیست."
            className="w-full text-xs rounded-xl border-slate-300 shadow-xs focus:border-teal-700 focus:ring-teal-700 p-3"
            required
          />
        </div>

        {/* Treatment Plan */}
        <div>
          <label className="block font-bold text-slate-800 text-[11px] mb-1">
            دستورالعمل‌ها و توصیه درمانی به بیمار <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={treatmentPlan}
            onChange={(e) => setTreatmentPlan(e.target.value)}
            placeholder="مثال: شروع فیزیوتراپی با تمرکز بر ثبات عضلات مرکزی ۲ جلسه در هفته. کمپرس گرم کمری به مدت ۲۰ دقیقه قبل از خواب توصیه شد."
            className="w-full text-xs rounded-xl border-slate-300 shadow-xs focus:border-teal-700 focus:ring-teal-700 p-3"
            required
          />
        </div>

        {/* Prescription Changes */}
        <div>
          <label className="block font-bold text-slate-800 text-[11px] mb-1 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-indigo-700" />
            تغییرات و تنظیم مجدد دوز داروها (اختیاری)
          </label>
          <input
            type="text"
            value={prescriptionsChanged}
            onChange={(e) => setPrescriptionsChanged(e.target.value)}
            placeholder="مثال: تعویض ایبوپروفن ۴۰۰ با ناپروکسن ۵۰۰ هر ۱۲ ساعت؛ اضافه شدن گاباپنتین ۳۰۰ شب‌ها"
            className="w-full text-xs rounded-xl border-slate-300 shadow-xs p-2.5"
          />
        </div>

        {/* Follow-up Scheduling */}
        <div>
          <label className="block font-bold text-slate-800 text-[11px] mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-700" />
            تاریخ پیشنهادی ویزیت بعدی بیمار
          </label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="text-xs rounded-xl border-slate-300 shadow-xs py-2 px-3 bg-white font-mono"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSaving || !assessment.trim() || !treatmentPlan.trim()}
            className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4 text-teal-200" />
            <span>{isSaving ? 'در حال ثبت...' : 'ثبت و انتشار در پرونده'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
