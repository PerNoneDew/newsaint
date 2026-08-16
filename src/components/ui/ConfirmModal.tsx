import { useState } from 'react';
import { AlertTriangle, Trash2, UserCheck, Info } from 'lucide-react';

type AlertType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: AlertType;
  details?: string[];
  confirmText?: string;
  requireConfirmText?: boolean;
}

const typeConfig: Record<AlertType, { icon: React.ElementType; color: string; bg: string; border: string; btnColor: string }> = {
  danger: { icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', btnColor: 'bg-rose-500 hover:bg-rose-600' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', btnColor: 'bg-amber-500 hover:bg-amber-600' },
  info: { icon: Info, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', btnColor: 'bg-sky-500 hover:bg-sky-600' },
  success: { icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', btnColor: 'bg-emerald-500 hover:bg-emerald-600' },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'warning',
  details,
  confirmText,
  requireConfirmText = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const config = typeConfig[type];
  const Icon = config.icon;

  const [inputValue, setInputValue] = useState('');

  const canConfirm = !requireConfirmText || !confirmText || inputValue === confirmText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className={`px-6 py-5 ${config.bg} border-b ${config.border}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${config.bg} border ${config.border}`}>
              <Icon size={22} className={config.color} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500">This action requires confirmation</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>

          {details && details.length > 0 && (
            <div className={`rounded-xl p-4 ${config.bg} border ${config.border}`}>
              <ul className="text-sm text-slate-600 space-y-1.5">
                {details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')} mt-1.5 shrink-0`} />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requireConfirmText && confirmText && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type <span className="font-mono font-bold text-rose-600">{confirmText}</span> to confirm:
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                placeholder={confirmText}
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              if (canConfirm) {
                onConfirm();
                onClose();
              }
            }}
            disabled={!canConfirm}
            className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.btnColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
