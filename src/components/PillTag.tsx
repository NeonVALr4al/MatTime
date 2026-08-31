type Props = {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
};

export default function PillTag({ label, sublabel, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] px-4 rounded-full border text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
        selected
          ? 'bg-mat-red border-mat-red text-white'
          : 'bg-transparent border-mat-border-strong text-mat-muted hover:border-[rgba(255,46,85,0.5)] hover:text-mat-text'
      }`}
    >
      {label}
      {sublabel && <span className="ml-1.5 opacity-70 font-normal">{sublabel}</span>}
    </button>
  );
}