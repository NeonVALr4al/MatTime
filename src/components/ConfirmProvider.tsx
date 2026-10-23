import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ConfirmContext } from '../hooks/useConfirm';

type ConfirmState = { message: string; resolve: (result: boolean) => void } | null;

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  const handle = useCallback(
    (result: boolean) => {
      state?.resolve(result);
      setState(null);
    },
    [state]
  );

  useEffect(() => {
    if (!state) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handle(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [state, handle]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handle(false);
          }}
        >
          <div className="bg-mat-card border border-mat-border rounded-2xl p-5 w-full max-w-xs space-y-4">
            <p className="text-mat-text text-sm font-semibold">{state.message}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handle(false)}
                className="flex-1 min-h-[40px] bg-mat-fill border border-mat-border-strong text-mat-muted text-sm font-semibold rounded-lg hover:text-mat-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handle(true)}
                className="flex-1 min-h-[40px] bg-mat-accent-strong hover:bg-mat-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
