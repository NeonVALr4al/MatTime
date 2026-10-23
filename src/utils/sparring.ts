export type RollOutcome = {
  submission_landed: string | null;
  submission_received: string | null;
  position_result: string | null;
};

/** A roll counts as a win if a submission landed, or the position result starts with "Won". */
export function isWin(r: RollOutcome): boolean {
  if (r.submission_landed) return true;
  if (r.position_result?.startsWith('Won')) return true;
  return false;
}

/** A roll counts as a loss if a submission was received, or the position result starts with "Lost". */
export function isLoss(r: RollOutcome): boolean {
  if (r.submission_received) return true;
  if (r.position_result?.startsWith('Lost')) return true;
  return false;
}
