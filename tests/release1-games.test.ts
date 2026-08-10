import { describe, expect, it } from 'vitest';
import { bingoWinnersOnDraw, buildBingoNumberPool, generateBingoCandidates, generatePeopleBingoCandidates, isAcceptedQuickDrawGuess, majorityResult, quickDrawArtistPoints, quickDrawGuesserPoints } from '../lib/release1-games';

describe('Bingo',()=>{
  it('builds the current test-driven pool from board size and multiplier',()=>{
    expect(buildBingoNumberPool(5,3)).toHaveLength(75);
    expect(buildBingoNumberPool(6,2)).toHaveLength(72);
  });

  it('generates the planned default of three personal candidate cards',()=>{
    const cards=generateBingoCandidates(5,3,()=>0.25);
    expect(cards).toHaveLength(3);
    expect(cards.every((card)=>card.length===25)).toBe(true);
    expect(cards.every((card)=>new Set(card).size===25)).toBe(true);
  });

  it('generates People Bingo 5x5 cards with 25 unique identities and no repeats',()=>{
    const people=Array.from({length:30},(_,index)=>`person-${index+1}`);
    const cards=generatePeopleBingoCandidates(people,3,5,()=>0.37);
    expect(cards).toHaveLength(3);
    expect(cards.every((card)=>card.length===25)).toBe(true);
    expect(cards.every((card)=>new Set(card).size===25)).toBe(true);
    expect(cards.every((card)=>card.every((id)=>people.includes(id)))).toBe(true);
  });

  it('rejects People Bingo 5x5 below the 25-person hard minimum',()=>{
    const people=Array.from({length:24},(_,index)=>`person-${index+1}`);
    expect(()=>generatePeopleBingoCandidates(people,3,5)).toThrow(/requires 25 unique participants/i);
  });

  it('rejects duplicate identities in the People Bingo participant pool',()=>{
    const people=[...Array.from({length:24},(_,index)=>`person-${index+1}`),'person-1'];
    expect(()=>generatePeopleBingoCandidates(people,3,5)).toThrow(/unique identities/i);
  });

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
