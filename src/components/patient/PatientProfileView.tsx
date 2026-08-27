import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, PatientProfile } from '../../types';
import { StorageService } from '../../services/storageService';
import { User as UserIcon, Heart, Stethoscope, Save, Check } from 'lucide-react';

export const PatientProfileView: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();

  if (!currentUser) return null;

  const profile = currentUser.profile as PatientProfile;

  const [firstName, setFirstName] = useState<string>(profile.firstName || '');
  const [lastName, setLastName] = useState<string>(profile.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState<string>(profile.dateOfBirth || '');
  const [gender, setGender] = useState<string>(profile.gender || 'Female');
  const [bloodType, setBloodType] = useState<string>(profile.bloodType || 'A+');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<string>(profile.primaryDiagnosis || '');
  const [emergencyContactName, setEmergencyContactName] = useState<string>(profile.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>(profile.emergencyContactPhone || '');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState<string>(profile.emergencyContactRelation || '');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...currentUser,
      profile: {
        ...profile,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        bloodType,
        primaryDiagnosis,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
      },
    };

    StorageService.saveUser(updatedUser);
    refreshUserData();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200 text-right">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          پرونده هویتی و اطلاعات بالینی بیمار
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          مدیریت اطلاعات فردی، سوابق بالینی، مخاطبین اضطراری و پزشک معالج پرونده
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Personal Details Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-teal-700" />
            اطلاعات هویتی و دموگرافیک
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">نام</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 focus:border-teal-700"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">نام خانوادگی</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 focus:border-teal-700"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">تاریخ تولد</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">جنسیت</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 bg-white"
              >
                <option value="Female">زن (Female)</option>
                <option value="Male">مرد (Male)</option>
                <option value="Other">سایر</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">گروه خونی</label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 bg-white font-mono"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">تشخیص اولیه و بالینی</label>
              <input
                type="text"
                value={primaryDiagnosis}
                onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                placeholder="مثال: رادیکولوپاتی کمری، فیبرومیالژیا"
                className="w-full text-xs rounded-xl border-slate-300 py-2 px-3"
              />
            </div>
          </div>
        </div>

        {/* Assigned Physician & Care Team */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-700" />
            پزشک معالج و تیم مراقبت بالینی
          </h3>
          <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold">
                د.م
              </div>
              <div>
                <h4 className="text-xs font-bold text-teal-950">
                  {profile.assignedDoctorName || 'دکتر رضا مرادی'}
                </h4>
                <p className="text-[11px] text-teal-800">فوق تخصص طب تسکینی و کنترل دردهای مزمن ستون فقرات</p>
                <p className="text-[10px] text-slate-500 mt-0.5">مرکز جامع مدیریت درد • لینک مستقیم پرونده الکترونیک فعال است</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600" />
            اطلاعات مخاطب اضطراری
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">نام مخاطب</label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="مثال: علی احمدی"
                className="w-full text-xs rounded-xl border-slate-300 py-2 px-3"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">نسبت</label>
              <input
                type="text"
                value={emergencyContactRelation}
                onChange={(e) => setEmergencyContactRelation(e.target.value)}
                placeholder="مثال: همسر / برادر"
                className="w-full text-xs rounded-xl border-slate-300 py-2 px-3"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">شماره تماس اضطراری</label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="مثال: ۰۹۱۲۱۲۳۴۵۶۷"
                className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 font-mono text-left"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Action Save Bar */}
        <div className="flex items-center justify-between">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <Check className="w-4 h-4" />
              <span>اطلاعات پرونده با موفقیت ذخیره و به‌روزرسانی شد.</span>
            </div>
          )}
          {!savedSuccess && <div></div>}

          <button
            type="submit"
            className="bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-teal-200" />
            <span>ذخیره تغییرات پرونده</span>
          </button>
        </div>
      </form>
    </div>
  );
};
