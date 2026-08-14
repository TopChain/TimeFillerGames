import { describe, expect, it } from 'vitest';
import { compactQuickDrawStrokes } from '../lib/client-quick-draw';

const stroke = (sequence: number) => ({
  sequence,
  payload: { type: 'stroke' as const, points: [{ x: 0.1, y: 0.2 }], width: 4 },
});
const clear = (sequence: number) => ({ sequence, payload: { type: 'clear' as const } });

describe('Quick Draw incremental canvas history', () => {
  it('keeps the full sequence when no clear exists', () => {
    const input = [stroke(0), stroke(1), stroke(2)];
    expect(compactQuickDrawStrokes(input).map((entry) => entry.sequence)).toEqual([0, 1, 2]);
  });

  it('drops all canvas history before the most recent clear', () => {
    const input = [stroke(0), clear(1), stroke(2), clear(3), stroke(4), stroke(5)];
    expect(compactQuickDrawStrokes(input).map((entry) => entry.sequence)).toEqual([3, 4, 5]);
  });
});
