import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  highlighted?: boolean;
  className?: string;
};

export default function Card({ children, highlighted = false, className = '' }: Props) {
  return (
    <div
      className={`rounded-2xl p-4 border transition-all duration-200 ${
        highlighted
          ? 'bg-[rgba(255,46,85,0.08)] border-[rgba(255,46,85,0.3)]'
          : 'bg-mat-card border-mat-border'
      } ${className}`}
    >
      {children}
    </div>
  );
}