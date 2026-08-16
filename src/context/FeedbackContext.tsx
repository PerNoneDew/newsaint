import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

interface FeedbackState {
  status: Status;
  title: string;
  message?: string;
}

interface RunOptions {
  loadingTitle: string;
  successTitle: string;
  successMessage?: string;
  errorTitle?: string;
  /** ms to keep the success/error modal visible before auto-closing. 0 = no auto-close. */
  autoCloseMs?: number;
}

interface FeedbackContextType {
  runWithFeedback: (action: () => Promise<void>, options: RunOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FeedbackState | null>(null);

  const close = useCallback(() => setState(null), []);

  const runWithFeedback = useCallback(async (action: () => Promise<void>, options: RunOptions): Promise<boolean> => {
    setState({ status: 'loading', title: options.loadingTitle });
    try {
      await action();
      setState({ status: 'success', title: options.successTitle, message: options.successMessage });
      if (options.autoCloseMs && options.autoCloseMs > 0) {
        setTimeout(close, options.autoCloseMs);
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setState({ status: 'error', title: options.errorTitle ?? 'Action failed', message });
      if (options.autoCloseMs && options.autoCloseMs > 0) {
        setTimeout(close, options.autoCloseMs);
      }
      return false;
    }
  }, [close]);

  return (
    <FeedbackContext.Provider value={{ runWithFeedback }}>
      {children}
      {state && <FeedbackModal state={state} onClose={close} />}
    </FeedbackContext.Provider>
  );
}

function FeedbackModal({ state, onClose }: { state: FeedbackState; onClose: () => void }) {
  const { status, title, message } = state;
  const showClose = status !== 'loading';

  const config = {
    loading: { icon: Loader2, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-100', spin: true },
    success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', spin: false },
    error: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', spin: false },
  }[status];

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={showClose ? onClose : undefined} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className={`px-6 py-8 ${config.bg} border-b ${config.border} flex flex-col items-center text-center`}>
          <div className={`p-3 rounded-2xl bg-white shadow-sm border ${config.border}`}>
            <Icon size={32} className={`${config.color} ${config.spin ? 'animate-spin' : ''}`} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-800">{title}</h3>
          {message && <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{message}</p>}
        </div>
        {showClose && (
          <div className="px-6 py-4 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
            >
              <X size={16} /> Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
}
