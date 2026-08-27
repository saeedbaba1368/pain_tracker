import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PainEntryLocation, PainEntrySymptom, PainEntryTrigger, MedicationCategory, ClinicalAlert } from '../../types';
import { PAIN_TYPES, SYMPTOMS, TRIGGERS, MASTER_MEDICATIONS, BODY_ZONES } from '../../data/seedData';
import { StorageService } from '../../services/storageService';
import { BodyMap } from '../bodymap/BodyMap';
import { BodyZoneDetail } from '../bodymap/BodyZoneDetail';
import { PainLevelBadge } from '../common/PainLevelBadge';
import {
  Activity,
  X,
  AlertTriangle,
  Pill,
  Clock,
  Zap,
  CheckCircle2,
  Save,
  RotateCcw,
} from 'lucide-react';

interface AddPainEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (alertTriggers: ClinicalAlert[]) => void;
}

export const AddPainEntryModal: React.FC<AddPainEntryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();

  // Core Form State
  const [recordedAt, setRecordedAt] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [painLevel, setPainLevel] = useState<number>(5);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>(['back-lumbar']);
  const [zoneIntensities, setZoneIntensities] = useState<Record<string, number>>({
    'back-lumbar': 5,
  });
  const [selectedPainTypeId, setSelectedPainTypeId] = useState<string>('dull');
  const [durationLabel, setDurationLabel] = useState<string>('۳۰ تا ۶۰ دقیقه');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);

  // Symptoms & Triggers
  const [selectedSymptoms, setSelectedSymptoms] = useState<{ id: string; name: string; severity: 1 | 2 | 3 | 4 | 5 }[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<{ id: string; name: string; description?: string }[]>([]);

  // Medication
  const [includeMedication, setIncludeMedication] = useState<boolean>(false);
  const [selectedMedId, setSelectedMedId] = useState<string>('med-1');
  const [customMedName, setCustomMedName] = useState<string>('');
  const [medDosage, setMedDosage] = useState<string>('۵۰۰ میلی‌گرم');
  const [medEffectiveness, setMedEffectiveness] = useState<number>(3);
  const [medNotes, setMedNotes] = useState<string>('');

  // Subjective Notes & Emergency
  const [notes, setNotes] = useState<string>('');
  const [isEmergency, setIsEmergency] = useState<boolean>(false);

  // UI State
  const [activeTab, setActiveTab] = useState<'MAP' | 'DETAILS' | 'MEDS'>('MAP');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Restore draft or default on open
  useEffect(() => {
    if (isOpen) {
      const draft = StorageService.getDraft();
      if (draft) {
        setPainLevel(draft.painLevel ?? 5);
        setSelectedZoneIds(draft.selectedZoneIds ?? ['back-lumbar']);
        setZoneIntensities(draft.zoneIntensities ?? { 'back-lumbar': 5 });
        setSelectedPainTypeId(draft.selectedPainTypeId ?? 'dull');
        setNotes(draft.notes ?? '');
        setIsEmergency(draft.isEmergency ?? false);
      }
    }
  }, [isOpen]);

  // Auto-save draft periodically
  useEffect(() => {
    if (isOpen) {
      const draft = {
        painLevel,
        selectedZoneIds,
        zoneIntensities,
        selectedPainTypeId,
        notes,
        isEmergency,
      };
      StorageService.saveDraft(draft);
    }
  }, [painLevel, selectedZoneIds, zoneIntensities, selectedPainTypeId, notes, isEmergency, isOpen]);

  if (!isOpen) return null;

  const handleZoneToggle = (zoneId: string) => {
    setSelectedZoneIds((prev) => {
      if (prev.includes(zoneId)) {
        const next = prev.filter((id) => id !== zoneId);
        const nextIntensities = { ...zoneIntensities };
        delete nextIntensities[zoneId];
        setZoneIntensities(nextIntensities);
        return next;
      } else {
        setZoneIntensities((prevInt) => ({ ...prevInt, [zoneId]: painLevel }));
        return [...prev, zoneId];
      }
    });
  };

  const handleIntensityChange = (zoneId: string, intensity: number) => {
    setZoneIntensities((prev) => ({ ...prev, [zoneId]: intensity }));
  };

  const handleSymptomToggle = (sym: { id: string; name: string }) => {
    setSelectedSymptoms((prev) => {
      const exists = prev.find((s) => s.id === sym.id);
      if (exists) {
        return prev.filter((s) => s.id !== sym.id);
      } else {
        return [...prev, { id: sym.id, name: sym.name, severity: 3 }];
      }
    });
  };

  const handleTriggerToggle = (trig: { id: string; name: string }) => {
    setSelectedTriggers((prev) => {
      const exists = prev.find((t) => t.id === trig.id);
      if (exists) {
        return prev.filter((t) => t.id !== trig.id);
      } else {
        return [...prev, { id: trig.id, name: trig.name }];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (selectedZoneIds.length === 0) {
      setErrorMsg('لطفاً حداقل یک ناحیه آناتومیک را روی نقشه بدن انتخاب کنید.');
      setActiveTab('MAP');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      // Build location records
      const locations: PainEntryLocation[] = selectedZoneIds.map((id) => {
        const z = BODY_ZONES.find((zone) => zone.id === id);
        return {
          zoneId: id,
          zoneName: z ? z.name : id,
          intensity: zoneIntensities[id] ?? painLevel,
        };
      });

      // Build symptom records
      const symptoms: PainEntrySymptom[] = selectedSymptoms.map((s) => ({
        symptomId: s.id,
        name: s.name,
        severity: s.severity,
      }));

      // Build trigger records
      const triggers: PainEntryTrigger[] = selectedTriggers.map((t) => ({
        triggerId: t.id,
        name: t.name,
      }));

      const selectedType = PAIN_TYPES.find((t) => t.id === selectedPainTypeId);

      // Medication log if selected
      let medLog = undefined;
      if (includeMedication) {
        const masterMed = MASTER_MEDICATIONS.find((m) => m.id === selectedMedId);
        medLog = {
          id: `medlog-${Date.now()}`,
          patientId: currentUser.id,
          medicationId: selectedMedId !== 'custom' ? selectedMedId : undefined,
          customMedicationName: selectedMedId === 'custom' ? customMedName : undefined,
          medicationName: selectedMedId === 'custom' ? customMedName || 'داروی اختصاصی' : masterMed?.name || 'دارو',
          dosage: medDosage,
          category: masterMed?.category as MedicationCategory,
          takenAt: new Date(recordedAt).toISOString(),
          effectiveness: medEffectiveness,
          notes: medNotes,
        };
      }

      const patientName = `${(currentUser.profile as any).firstName} ${(currentUser.profile as any).lastName}`;

      const { triggeredAlerts } = StorageService.addPainEntry({
        patientId: currentUser.id,
        patientName,
        recordedAt: new Date(recordedAt).toISOString(),
        painLevel,
        painTypeId: selectedPainTypeId,
        painTypeName: selectedType?.name,
        durationMinutes,
        durationLabel,
        locations,
        symptoms,
        triggers,
        medicationLog: medLog,
        notes,
        isEmergency,
      });

      setIsSaving(false);
      onSuccess(triggeredAlerts);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err?.message || 'خطا در ذخیره‌سازی نوبت درد.');
    }
  };

  const getSliderBackground = (val: number) => {
    if (val <= 3) return 'from-emerald-500 to-teal-600';
    if (val <= 6) return 'from-amber-500 to-orange-500';
    if (val <= 8) return 'from-orange-600 to-red-600';
    return 'from-red-600 to-rose-700';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 text-right">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col z-10 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800 text-white shadow-xs">
              <Activity className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">ثبت نوبت درد</h2>
              <p className="text-xs text-slate-500">ثبت سریع و بالینی علائم و موقعیت آناتومیک درد</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="datetime-local"
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
                className="text-xs bg-transparent border-0 focus:ring-0 text-slate-700 font-mono font-medium"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Sub-navigation tabs for rapid stepping */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('MAP')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'MAP'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>۱. شدت و نقشه بدن</span>
            <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 text-[10px] flex items-center justify-center font-bold font-mono">
              {selectedZoneIds.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DETAILS')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'DETAILS'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>۲. کیفیت درد، محرک‌ها و علائم</span>
            {(selectedSymptoms.length > 0 || selectedTriggers.length > 0) && (
              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] flex items-center justify-center font-bold font-mono">
                {selectedSymptoms.length + selectedTriggers.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MEDS')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'MEDS'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>۳. مصرف دارو و یادداشت</span>
            {includeMedication && <span className="w-2 h-2 rounded-full bg-teal-600"></span>}
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: SEVERITY & BODY MAP */}
          {activeTab === 'MAP' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Pain Scale (0-10) */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-teal-700" />
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                      شدت کلی درد در این نوبت (مقیاس ۰ تا ۱۰) <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <PainLevelBadge level={painLevel} size="lg" showLabel />
                </div>

                {/* Interactive Slider */}
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    id="pain-scale-slider"
                    value={painLevel}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPainLevel(val);
                      // Update any zones that have default intensity
                      const next = { ...zoneIntensities };
                      selectedZoneIds.forEach((id) => {
                        if (!next[id] || next[id] === painLevel) next[id] = val;
                      });
                      setZoneIntensities(next);
                    }}
                    className={`w-full h-3 rounded-lg cursor-pointer appearance-none bg-gradient-to-l ${getSliderBackground(
                      painLevel
                    )} accent-slate-900`}
                  />

                  {/* Discrete Number Badges */}
                  <div className="grid grid-cols-11 gap-1" dir="ltr">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setPainLevel(num);
                          const next = { ...zoneIntensities };
                          selectedZoneIds.forEach((id) => {
                            next[id] = num;
                          });
                          setZoneIntensities(next);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                          painLevel === num
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
                    <span>۰: بدون حس درد</span>
                    <span>۵: درد متوسط و آزاردهنده</span>
                    <span>۱۰: درد اورژانسی و غیرقابل تحمل</span>
                  </div>
                </div>
              </div>

              {/* Anatomical Body Map & Target Sites Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-2 flex items-center justify-between">
                    <span>نواحی درگیر آناتومیک <span className="text-red-500">*</span></span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      جهت انتخاب، روی شکل بدن کلیک کنید
                    </span>
                  </div>
                  <BodyMap
                    selectedZones={selectedZoneIds}
                    onZoneToggle={handleZoneToggle}
                  />
                </div>

                <div className="lg:col-span-5 flex flex-col gap-4">
                  <BodyZoneDetail
                    selectedZoneIds={selectedZoneIds}
                    zoneIntensities={zoneIntensities}
                    onRemoveZone={handleZoneToggle}
                    onIntensityChange={handleIntensityChange}
                  />

                  {/* Pain Type Quick Selector */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 block">
                      جنس و کیفیت حس درد
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PAIN_TYPES.slice(0, 6).map((pt) => (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setSelectedPainTypeId(pt.id)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                            selectedPainTypeId === pt.id
                              ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pt.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAIN TYPE, DURATION & TRIGGERS */}
          {activeTab === 'DETAILS' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Full Pain Type Selection */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 block">
                  انتخاب توصیف دقیق حس درد
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PAIN_TYPES.map((pt) => {
                    const isSelected = selectedPainTypeId === pt.id;
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setSelectedPainTypeId(pt.id)}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-xs ring-1 ring-teal-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">{pt.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{pt.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Buttons */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-700" />
                  مدت زمان تقریبی حمله یا دوره درد
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: 'کمتر از ۱۵ دقیقه', mins: 10 },
                    { label: '۱۵ تا ۳۰ دقیقه', mins: 20 },
                    { label: '۳۰ تا ۶۰ دقیقه', mins: 45 },
                    { label: '۱ تا ۲ ساعت', mins: 90 },
                    { label: '۲ تا ۴ ساعت', mins: 180 },
                    { label: 'بیش از ۴ ساعت', mins: 240 },
                  ].map((dur) => (
                    <button
                      key={dur.label}
                      type="button"
                      onClick={() => {
                        setDurationLabel(dur.label);
                        setDurationMinutes(dur.mins);
                      }}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        durationLabel === dur.label
                          ? 'bg-teal-800 text-white border-teal-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Associated Symptoms */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 block">
                  علائم همراه بالینی (چند انتخابی)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map((sym) => {
                    const isSelected = selectedSymptoms.some((s) => s.id === sym.id);
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => handleSymptomToggle(sym)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-200" />}
                        <span>{sym.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suspected Triggers */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 block">
                  عوامل محرک یا تشدیدکننده (چند انتخابی)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRIGGERS.map((trig) => {
                    const isSelected = selectedTriggers.some((t) => t.id === trig.id);
                    return (
                      <button
                        key={trig.id}
                        type="button"
                        onClick={() => handleTriggerToggle(trig)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-200" />}
                        <span>{trig.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDICATION, NOTES & EMERGENCY */}
          {activeTab === 'MEDS' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Medication Intake Log Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-indigo-700" />
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                        ثبت داروی مصرف‌شده برای تسکین این نوبت درد
                      </h4>
                      <p className="text-[11px] text-slate-500">پایش مسکن‌ها و ارزیابی میزان اثربخشی</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMedication}
                      onChange={(e) => setIncludeMedication(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {includeMedication && (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          انتخاب دارو
                        </label>
                        <select
                          value={selectedMedId}
                          onChange={(e) => setSelectedMedId(e.target.value)}
                          className="w-full text-xs rounded-xl border-slate-300 shadow-xs focus:border-teal-700 focus:ring-teal-700 py-2 px-3 bg-white"
                        >
                          {MASTER_MEDICATIONS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.category})
                            </option>
                          ))}
                          <option value="custom">سایر / داروی تجویزی متفرقه...</option>
                        </select>
                      </div>

                      {selectedMedId === 'custom' ? (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            نام داروی تجویزی
                          </label>
                          <input
                            type="text"
                            value={customMedName}
                            onChange={(e) => setCustomMedName(e.target.value)}
                            placeholder="مثال: پماد پیروکسیکام، کپسول گاباپنتین"
                            className="w-full text-xs rounded-xl border-slate-300 shadow-xs py-2 px-3"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            دوز مصرفی
                          </label>
                          <input
                            type="text"
                            value={medDosage}
                            onChange={(e) => setMedDosage(e.target.value)}
                            placeholder="مثال: ۵۰۰ میلی‌گرم، ۲ عدد قرص"
                            className="w-full text-xs rounded-xl border-slate-300 shadow-xs py-2 px-3"
                          />
                        </div>
                      )}
                    </div>

                    {/* Effectiveness Star Rating */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        میزان تسکین و اثربخشی دارو (۰ تا ۵)
                      </label>
                      <div className="flex items-center gap-2">
                        {[
                          { val: 0, label: 'هنوز ارزیابی نشده' },
                          { val: 1, label: '۱ - بدون تسکین' },
                          { val: 2, label: '۲ - تسکین ناچیز' },
                          { val: 3, label: '۳ - تسکین متوسط' },
                          { val: 4, label: '۴ - تسکین خوب' },
                          { val: 5, label: '۵ - تسکین کامل و عالی' },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setMedEffectiveness(item.val)}
                            className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              medEffectiveness === item.val
                                ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {item.val === 0 ? '۰' : `★ ${item.val}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subjective Notes */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center justify-between">
                  <span>یادداشت‌ها و مشاهدات بیمار</span>
                  <span className="text-[11px] font-normal text-slate-400 font-mono" dir="ltr">
                    {notes.length}/500 کاراکتر
                  </span>
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="توضیح دهید درد به کجا انتشار دارد، آیا مانع ایستادن یا خوابیدن شد، یا چه عاملی باعث کاهش درد شد..."
                  className="w-full text-xs rounded-xl border-slate-300 shadow-xs focus:border-teal-700 focus:ring-teal-700 p-3"
                />
              </div>

              {/* Emergency Flag Card */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      علامت‌گذاری به عنوان حمله حاد و اورژانسی
                    </h4>
                    <p className="text-[11px] text-rose-700 leading-relaxed mt-0.5">
                      در صورتی که درد بسیار شدید، ناگهانی یا غیرقابل تحمل است، این گزینه را فعال کنید تا هشدار فوری برای تیم بالینی صادر شود.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mr-4">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* Modal Footer / Action Bar */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 border-t border-slate-200 flex items-center justify-between -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                انتخاب شده: {selectedZoneIds.length} ناحیه | شدت {painLevel}/۱۰
              </span>
              <button
                type="button"
                onClick={() => {
                  StorageService.clearDraft();
                  setPainLevel(5);
                  setSelectedZoneIds(['back-lumbar']);
                  setNotes('');
                  setIsEmergency(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                پاک‌کردن
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="submit"
                id="submit-pain-entry-btn"
                disabled={isSaving || selectedZoneIds.length === 0}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-teal-200" />
                <span>{isSaving ? 'در حال ثبت...' : 'ثبت نهایی گزارش درد'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
