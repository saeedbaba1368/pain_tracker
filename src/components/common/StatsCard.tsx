import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  trendLabel?: string;
  variant?: 'default' | 'teal' | 'red' | 'amber' | 'emerald';
  onClick?: () => void;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  onClick,
  className = '',
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
      accent: 'text-slate-900',
    },
    teal: {
      border: 'border-teal-200 bg-teal-50/30',
      iconBg: 'bg-teal-100 text-teal-800',
      accent: 'text-teal-900',
    },
    red: {
      border: 'border-red-200 bg-red-50/30',
      iconBg: 'bg-red-100 text-red-700',
      accent: 'text-red-900',
    },
    amber: {
      border: 'border-amber-200 bg-amber-50/30',
      iconBg: 'bg-amber-100 text-amber-800',
      accent: 'text-amber-900',
    },
    emerald: {
      border: 'border-emerald-200 bg-emerald-50/30',
      iconBg: 'bg-emerald-100 text-emerald-800',
      accent: 'text-emerald-900',
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-4 shadow-xs flex flex-col justify-between transition-all text-right ${
        variantStyles.border
      } ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`p-2 rounded-lg ${variantStyles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2">
        <div className={`text-2xl font-black tracking-tight ${variantStyles.accent}`}>{value}</div>

        {(subtext || trend) && (
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            {subtext && <span className="truncate">{subtext}</span>}
            {trend && (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  trend === 'UP'
                    ? 'text-red-700'
                    : trend === 'DOWN'
                    ? 'text-emerald-700'
                    : 'text-slate-600'
                }`}
              >
                {trend === 'UP' && <TrendingUp className="w-3.5 h-3.5" />}
                {trend === 'DOWN' && <TrendingDown className="w-3.5 h-3.5" />}
                {trend === 'STABLE' && <Minus className="w-3.5 h-3.5" />}
                <span>{trendLabel}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
