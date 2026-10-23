import { createContext, useContext } from 'react';

export type ConfirmContextValue = {
  confirm: (message: string) => Promise<boolean>;
};

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx.confirm;
}
