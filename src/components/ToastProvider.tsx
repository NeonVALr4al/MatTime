import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type Toast, type ToastKind } from '../hooks/useToast';

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'border-mat-green/40 text-mat-green',
  error: 'border-red-400/40 text-red-400',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center px-4 w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`bg-mat-card border rounded-xl px-4 py-2.5 shadow-lg text-sm font-semibold max-w-sm w-fit ${KIND_STYLES[t.kind]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
