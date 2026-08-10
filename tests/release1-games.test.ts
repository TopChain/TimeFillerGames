import { describe, expect, it } from 'vitest';
import { bingoWinnersOnDraw, isAcceptedQuickDrawGuess, majorityResult, quickDrawArtistPoints, quickDrawGuesserPoints } from '../lib/release1-games';

describe('Bingo',()=>{
  it('awards simultaneous winners from the same server draw',()=>{
    const cards={a:[1,2,3,4],b:[1,2,3,4],c:[5,6,7,8]};
    expect(bingoWinnersOnDraw(cards,[1],2,2)).toEqual(['a','b']);
  });
});

describe('Majority Match',()=>{
  it('treats tied top answers as full majority answers',()=>{
    const result=majorityResult({a:'red',b:'blue',c:'red',d:'blue'});
    expect(result.majorityChoices.sort()).toEqual(['blue','red']);
    expect(Object.values(result.points)).toEqual([1,1,1,1]);
  });
});

describe('Quick Draw',()=>{
  it('normalizes capitalization and obvious punctuation',()=>expect(isAcceptedQuickDrawGuess(' Ice-Cream! ','ice cream')).toBe(true));
  it('rewards faster correct guesses without exceeding bounds',()=>{
    expect(quickDrawGuesserPoints(60000,60000)).toBe(1000);
    expect(quickDrawGuesserPoints(0,60000)).toBe(500);
  });
  it('rewards artists by successful eligible guesses',()=>expect(quickDrawArtistPoints(3,4)).toBe(750));
});
