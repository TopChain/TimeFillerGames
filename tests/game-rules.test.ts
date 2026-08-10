import { describe, expect, it } from 'vitest';
import { bingoBoardForTime, canStart, rankWithCompetitionTies } from '../lib/game-rules';

describe('universal readiness', () => {
  it('blocks below hard minimum', () => expect(canStart(3,1)).toEqual({ready:false,reason:'2 more players required.'}));
  it('allows valid player counts', () => expect(canStart(3,5).ready).toBe(true));
});

describe('time-first bingo', () => {
  it('maps normal presets to planned board sizes', () => {
    expect(bingoBoardForTime(3).size).toBe(5);
    expect(bingoBoardForTime(5).size).toBe(6);
    expect(bingoBoardForTime(8).size).toBe(7);
    expect(bingoBoardForTime(10).size).toBe(8);
  });
});

describe('competition ties', () => {
  it('uses 1,1,3 ranking for shared first', () => expect(rankWithCompetitionTies([{id:'a',score:2},{id:'b',score:2},{id:'c',score:1}]).map(x=>x.rank)).toEqual([1,1,3]));
});
