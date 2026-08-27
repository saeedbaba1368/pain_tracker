import React from 'react';

interface PainLevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const PainLevelBadge: React.FC<PainLevelBadgeProps> = ({
  level,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const getLevelDetails = (val: number) => {
    if (val === 0) return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'بدون درد', emoji: '😊' };
    if (val <= 3) return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'درد خفیف', emoji: '🙂' };
    if (val <= 6) return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'درد متوسط', emoji: '😐' };
    if (val <= 8) return { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300', label: 'درد شدید', emoji: '😣' };
    return { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-400', label: 'اورژانسی / طاقت‌فرسا', emoji: '😫' };
  };

  const details = getLevelDetails(level);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-bold',
    lg: 'text-base px-3 py-1.5 font-black',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono ${details.bg} ${details.text} ${details.border} ${sizeClasses[size]} ${className}`}
    >
      <span className="font-sans">{details.emoji}</span>
      <span dir="ltr">{level}/10</span>
      {showLabel && <span className="font-sans font-medium text-slate-600 text-xs">({details.label})</span>}
    </span>
  );
};
