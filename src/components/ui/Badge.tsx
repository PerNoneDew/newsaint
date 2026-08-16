interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal' | 'rose' | 'violet';
}

export default function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const styles: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    info: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    teal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
    rose: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    violet: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
}

export function statusVariant(status: string): BadgeProps['variant'] {
  const map: Record<string, BadgeProps['variant']> = {
    active: 'success', approved: 'success', verified: 'success', liquidated: 'success', released: 'teal',
    pending: 'warning', processing: 'info', recorded: 'neutral', forwarded: 'info',
    rejected: 'danger', inactive: 'danger',
    admin: 'teal', health_officer: 'info', student: 'neutral', staff: 'warning', employee: 'rose', faculty: 'violet',
  };
  return map[status] ?? 'neutral';
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: 'Admin',
    health_officer: 'Health Officer',
    student: 'Student',
    staff: 'Staff',
    faculty: 'Faculty',
    employee: 'Employee',
  };
  return map[role] ?? role;
}
