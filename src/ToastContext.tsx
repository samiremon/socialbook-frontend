import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export interface ErrorModalData {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  showErrorModal: (title: string, message: string, actionLabel?: string, onAction?: () => void) => void;
  closeErrorModal: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [errorModal, setErrorModal] = useState<ErrorModalData | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const showErrorModal = useCallback(
    (title: string, message: string, actionLabel?: string, onAction?: () => void) => {
      setErrorModal({ title, message, actionLabel, onAction });
    },
    []
  );

  const closeErrorModal = useCallback(() => {
    setErrorModal(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, showErrorModal, closeErrorModal }}>
      {children}

      {/* Centered Red Error Modal Popup */}
      {errorModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeErrorModal}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-500 text-center relative overflow-hidden animate-popIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top red decorative accent bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700" />

            {/* High-visibility Red Alert Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3 mt-2 shadow-inner">
              <AlertCircle className="w-9 h-9 text-rose-600 animate-pulse" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">
              {errorModal.title}
            </h3>

            <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 mb-5 text-xs text-rose-900 font-medium leading-relaxed text-left">
              {errorModal.message}
            </div>

            <div className="flex items-center justify-center gap-3">
              {errorModal.actionLabel && errorModal.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    const action = errorModal.onAction;
                    closeErrorModal();
                    action?.();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                >
                  {errorModal.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={closeErrorModal}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all transform translate-y-0 animate-fadeIn ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-rose-500/10'
                : 'bg-white border-slate-200 text-slate-800 shadow-slate-500/10'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-emerald-600 shrink-0" />}

            <span className="flex-1 leading-snug">{toast.message}</span>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
