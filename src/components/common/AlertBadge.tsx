import React from 'react';
import { AlertSeverity, AlertStatus } from '../../types';
import { AlertTriangle, AlertCircle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';

interface AlertBadgeProps {
  severity?: AlertSeverity;
  status?: AlertStatus;
  count?: number;
  className?: string;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({
  severity,
  status,
  count,
  className = '',
}) => {
  if (count !== undefined) {
    if (count === 0) return null;
    return (
      <span className={`inline-flex items-center gap-1 bg-red-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full shadow-xs ${className}`}>
        <AlertTriangle className="w-3 h-3" />
        <span>{count} هشدار</span>
      </span>
    );
  }

  if (severity) {
    const config = {
      CRITICAL: { bg: 'bg-red-100 text-red-900 border-red-300', icon: AlertOctagon, label: 'بحرانی / اورژانسی' },
      HIGH: { bg: 'bg-orange-100 text-orange-900 border-orange-300', icon: AlertTriangle, label: 'شدت بالا' },
      MEDIUM: { bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: AlertCircle, label: 'شدت متوسط' },
      LOW: { bg: 'bg-blue-100 text-blue-900 border-blue-300', icon: Info, label: 'خفیف / پایش' },
    }[severity];

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${config.bg} ${className}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{config.label}</span>
      </span>
    );
  }

  if (status) {
    const statusMap = {
      NEW: { bg: 'bg-red-50 text-red-700 border-red-200', label: 'جدید / بررسی نشده' },
      ACKNOWLEDGED: { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'رویت شده' },
      REVIEWED: { bg: 'bg-teal-50 text-teal-800 border-teal-200', label: 'اقدام شده / بررسی پزشک' },
      DISMISSED: { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'بایگانی شده' },
    }[status];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${statusMap.bg} ${className}`}>
        {status === 'ACKNOWLEDGED' || status === 'REVIEWED' ? <CheckCircle2 className="w-3 h-3" /> : null}
        <span>{statusMap.label}</span>
      </span>
    );
  }

  return null;
};
