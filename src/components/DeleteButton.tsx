type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export default function DeleteButton({ onClick, disabled = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Delete"
      className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-lg text-mat-red hover:bg-[rgba(255,46,85,0.13)] disabled:opacity-40 transition-all duration-200 active:scale-[0.98]"
    >
      {disabled ? (
        <span className="text-xs">...</span>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}