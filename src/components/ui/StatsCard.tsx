import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'teal' | 'sky' | 'emerald' | 'amber' | 'rose';
  trend?: { value: number; label: string };
}

export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend }: StatsCardProps) {
  const colorMap = {
    teal: { bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600' },
    sky: { bg: 'bg-sky-500', light: 'bg-sky-50', text: 'text-sky-600' },
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600' },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          {trend && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-slate-400 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`${c.light} p-3 rounded-xl`}>
          <Icon size={22} className={c.text} />
        </div>
      </div>
    </div>
  );
}
