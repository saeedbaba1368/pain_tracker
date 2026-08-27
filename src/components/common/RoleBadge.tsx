import React from 'react';
import { UserRole } from '../../types';
import { User, Stethoscope, ClipboardCheck, ShieldCheck } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const config = {
    PATIENT: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      label: 'بیمار',
      icon: User,
    },
    DOCTOR: {
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      label: 'پزشک متخصص',
      icon: Stethoscope,
    },
    OPERATOR: {
      bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      label: 'اپراتور تریاژ و پذیرش',
      icon: ClipboardCheck,
    },
    ADMIN: {
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      label: 'مدیر ارشد سامانه',
      icon: ShieldCheck,
    },
  }[role];

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bg} ${sizeClasses} ${className}`}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
