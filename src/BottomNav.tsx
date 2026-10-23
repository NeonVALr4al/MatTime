type Tab = 'combat' | 'log' | 'journey' | 'history' | 'metrics' | 'profile';

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'combat',
    label: 'Combat',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'log',
    label: 'Log',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'journey',
    label: 'Journey',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path d="M4 20V10M12 20V4M20 20v-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="bg-glass fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-1
        md:top-0 md:bottom-0 md:right-auto md:w-56 md:flex-col md:items-stretch md:justify-start md:gap-1 md:border-r md:border-t-0 md:p-4"
    >
      <p className="hidden md:block px-3 pb-4 font-extrabold text-mat-text text-lg">MatTime</p>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2 rounded-xl transition-all duration-200 active:scale-[0.98]
              md:flex-row md:justify-start md:gap-3 md:w-full md:px-3 md:py-2.5 ${
              isActive ? 'text-mat-accent md:bg-mat-accent-fill' : 'text-mat-faint hover:text-mat-muted md:hover:bg-mat-card-hover'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium md:text-sm md:font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export type { Tab };