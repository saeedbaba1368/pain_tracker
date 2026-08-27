import React from 'react';
import { PainEntry } from '../../types';
import { PainLevelBadge } from '../common/PainLevelBadge';
import { BodyMap } from '../bodymap/BodyMap';
import { Modal } from '../common/Modal';
import { format, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale';
import {
  AlertTriangle,
  Pill,
  MapPin,
  FileText,
  Trash2,
} from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface PainEntryDetailModalProps {
  entry: PainEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export const PainEntryDetailModal: React.FC<PainEntryDetailModalProps> = ({
  entry,
  isOpen,
  onClose,
  onDeleted,
}) => {
  if (!entry || !isOpen) return null;

  const handleDelete = () => {
    if (window.confirm('آیا از حذف این گزارش بالینی درد از تاریخچه پرونده اطمینان دارید؟')) {
      StorageService.deletePainEntry(entry.id, entry.patientName);
      if (onDeleted) onDeleted();
      onClose();
    }
  };

  let formattedDate = '';
  try {
    formattedDate = format(parseISO(entry.recordedAt), 'EEEE, d MMMM yyyy - ساعت HH:mm', { locale: faIR });
  } catch (e) {
    formattedDate = entry.recordedAt;
  }

  const highlightedZones = entry.locations.map((loc) => ({
    zoneId: loc.zoneId,
    intensity: loc.intensity ?? entry.painLevel,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="جزئیات گزارش بالینی درد"
      subtitle={`زمان ثبت: ${formattedDate}`}
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف گزارش
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      }
    >
      <div className="space-y-5 text-right">
        {/* Emergency Alert Banner if applicable */}
        {entry.isEmergency && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-3 flex items-center gap-2 text-xs text-red-900 font-bold">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>⚠️ بیمار این نوبت را به عنوان حمله حاد و اورژانسی علامت‌گذاری کرده است.</span>
          </div>
        )}

        {/* Top Summary Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">شدت کلی درد:</div>
            <PainLevelBadge level={entry.painLevel} size="lg" showLabel />
          </div>

          <div className="flex items-center gap-4 text-xs">
            {entry.painTypeName && (
              <div>
                <span className="text-slate-400 font-medium">کیفیت و حس درد: </span>
                <span className="font-bold text-slate-800">{entry.painTypeName}</span>
              </div>
            )}
            {entry.durationLabel && (
              <div>
                <span className="text-slate-400 font-medium">مدت زمان: </span>
                <span className="font-bold text-slate-800">{entry.durationLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Anatomical Locations & Interactive Visual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-700" />
              توزیع آناتومیک ({entry.locations.length} ناحیه)
            </h4>
            <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto pl-1">
              {entry.locations.map((loc) => (
                <div
                  key={loc.zoneId}
                  className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800">{loc.zoneName}</span>
                  <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    شدت: {loc.intensity ?? entry.painLevel}/۱۰
                  </span>
                </div>
              ))}
            </div>

            {/* Symptoms & Triggers */}
            {entry.symptoms.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-bold text-slate-700 mb-1.5">علائم بالینی همراه:</div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.symptoms.map((s) => (
                    <span
                      key={s.symptomId}
                      className="bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium px-2 py-0.5 rounded-md"
                    >
                      {s.name} (شدت: {s.severity}/۵)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {entry.triggers.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-bold text-slate-700 mb-1.5">عوامل تشدیدکننده:</div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.triggers.map((t) => (
                    <span
                      key={t.triggerId}
                      className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium px-2 py-0.5 rounded-md"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              نقشه استقرار آناتومیک
            </h4>
            <BodyMap
              selectedZones={entry.locations.map((l) => l.zoneId)}
              highlightedZones={highlightedZones}
              onZoneToggle={() => {}}
              readOnly={true}
              className="scale-95 origin-top"
            />
          </div>
        </div>

        {/* Medication Details if present */}
        {entry.medicationLog && (
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-2">
              <Pill className="w-4 h-4 text-indigo-700" />
              <span>داروی مصرف‌شده در این نوبت</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">نام دارو:</span>
                <span className="font-bold text-slate-800">{entry.medicationLog.medicationName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">دوز:</span>
                <span className="font-bold text-slate-800">{entry.medicationLog.dosage}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">امتیاز تسکین:</span>
                <span className="font-bold text-indigo-800">
                  {entry.medicationLog.effectiveness > 0 ? `★ ${entry.medicationLog.effectiveness}/۵` : 'ارزیابی نشده'}
                </span>
              </div>
              {entry.medicationLog.notes && (
                <div className="col-span-2">
                  <span className="text-slate-400 text-[11px] block">یادداشت مصرف:</span>
                  <span className="text-slate-700 italic">{entry.medicationLog.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subjective Notes */}
        {entry.notes && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              <span>یادداشت‌ها و اظهارات بیمار</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
              «{entry.notes}»
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
