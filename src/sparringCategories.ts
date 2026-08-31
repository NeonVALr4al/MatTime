export const SPARRING_CATEGORIES = [
  { value: 'takedown', label: 'Takedown', short: 'Takedowns' },
  { value: 'guard_passing', label: 'Guard Passing', short: 'Guard Pass' },
  { value: 'guard_retention', label: 'Guard Retention', short: 'Guard Ret.' },
  { value: 'leg_entanglement', label: 'Leg Entanglement', short: 'Leg Locks' },
  { value: 'submission', label: 'Submission', short: 'Submissions' },
  { value: 'escape', label: 'Escape', short: 'Escapes' },
] as const;

export type SparringCategory = (typeof SPARRING_CATEGORIES)[number]['value'];
