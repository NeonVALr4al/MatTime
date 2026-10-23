import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  highlighted?: boolean;
  className?: string;
};

export default function Card({ children, highlighted = false, className = '' }: Props) {
  return (
    <div
      className={`card-top-light rounded-2xl p-4 border transition-all duration-200 ${
        highlighted
          ? 'bg-mat-accent/8 border-mat-accent-border'
          : 'bg-mat-card border-mat-border'
      } ${className}`}
    >
      {children}
    </div>
  );
}