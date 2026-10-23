import { describe, expect, it } from 'vitest';
import { isWin, isLoss } from './sparring';

describe('isWin', () => {
  it('is a win when a submission landed', () => {
    expect(isWin({ submission_landed: 'Armbar', submission_received: null, position_result: null })).toBe(true);
  });

  it('is a win when the position result starts with "Won"', () => {
    expect(isWin({ submission_landed: null, submission_received: null, position_result: 'Won from mount' })).toBe(true);
  });

  it('is not a win otherwise', () => {
    expect(isWin({ submission_landed: null, submission_received: null, position_result: 'Lost from guard' })).toBe(false);
    expect(isWin({ submission_landed: null, submission_received: null, position_result: null })).toBe(false);
  });
});

describe('isLoss', () => {
  it('is a loss when a submission was received', () => {
    expect(isLoss({ submission_landed: null, submission_received: 'Triangle Choke', position_result: null })).toBe(true);
  });

  it('is a loss when the position result starts with "Lost"', () => {
    expect(isLoss({ submission_landed: null, submission_received: null, position_result: 'Lost from side control' })).toBe(true);
  });

  it('is not a loss otherwise', () => {
    expect(isLoss({ submission_landed: null, submission_received: null, position_result: 'Won from mount' })).toBe(false);
    expect(isLoss({ submission_landed: null, submission_received: null, position_result: null })).toBe(false);
  });

  it('a roll with both a landed and received submission counts as both a win and a loss', () => {
    const roll = { submission_landed: 'Armbar', submission_received: 'Guillotine Choke', position_result: null };
    expect(isWin(roll)).toBe(true);
    expect(isLoss(roll)).toBe(true);
  });
});
