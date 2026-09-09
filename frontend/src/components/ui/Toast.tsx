import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ToastContextType {
  toasts: Toast[];
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Global toast helper for non-React contexts
export const toast = {
  success: (title: string, message?: string) => {
    const event = new CustomEvent('toast', { detail: { type: 'success', title, message } });
    window.dispatchEvent(event);
  },
  error: (title: string, message?: string) => {
    const event = new CustomEvent('toast', { detail: { type: 'error', title, message } });
    window.dispatchEvent(event);
  },
  info: (title: string, message?: string) => {
    const event = new CustomEvent('toast', { detail: { type: 'info', title, message } });
    window.dispatchEvent(event);
  },
  warning: (title: string, message?: string) => {
    const event = new CustomEvent('toast', { detail: { type: 'warning', title, message } });
    window.dispatchEvent(event);
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Listen for global toast events
  React.useEffect(() => {
    const handler = (e: Event) => {
      const { type, title, message } = (e as CustomEvent).detail;
      addToast(type, title, message);
    };
    window.addEventListener('toast', handler);
    return () => window.removeEventListener('toast', handler);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, success: (t,m) => addToast('success',t,m), error: (t,m) => addToast('error',t,m), info: (t,m) => addToast('info',t,m), warning: (t,m) => addToast('warning',t,m), dismiss }}>
      {children}
      <div className="fixed bottom-3 right-3 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-rose-50 border-rose-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-amber-50 border-amber-200',
  };

  const textColors = {
    success: 'text-emerald-800',
    error: 'text-rose-800',
    info: 'text-blue-800',
    warning: 'text-amber-800',
  };

  return (
    <div className={`w-72 rounded-md border ${bgColors[toast.type]} p-3 shadow-lg animate-in slide-in-from-right`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColors[toast.type]}`}>{toast.title}</p>
          {toast.message && (
            <p className={`text-xs mt-1 ${textColors[toast.type]} opacity-80`}>{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="ml-2 text-current opacity-50 hover:opacity-100"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
