import { createContext, useContext } from 'react';

export type ToastKind = 'success' | 'error';
export type Toast = { id: number; message: string; kind: ToastKind };

export type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
