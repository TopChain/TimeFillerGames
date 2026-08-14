'use client';

import { apiUrl } from './runtime-api';
import type { MajorityCategory } from './majority-match-content';

export type MajorityRanking={participant_id:string;nickname:string;avatarKey:string|null;points:number;placement:number};
export type MajoritySnapshot={room:{joinCode:string;status:string;rankingVisibility:string};session:{id:string;status:'active'|'paused'|'ended';config:{category:MajorityCategory;questionCount:number;answerSeconds:number;anonymousResults:boolean;showPercentages:boolean;speedBonus:false};state:{phase:'answering'|'revealing'|'ended';roundIndex:number;questionIds:string[];currentQuestion:{id:string;category:MajorityCategory;prompt:string;choices:string[]};deadline:string;pauseStartedAt?:string|null;reveal:null|{counts:Record<string,number>;majorityChoices:string[];percentages:Record<string,number>|null;totalVotes:number}};submittedCount:number;ownChoice:string|null;rankings:MajorityRanking[];ownResult:MajorityRanking|null}};

async function request<T>(url:string,accessToken:string,init:RequestInit={}){const headers=new Headers(init.headers);headers.set('authorization',`Bearer ${accessToken}`);if(init.body)headers.set('content-type','application/json');const response=await fetch(apiUrl(url),{...init,headers,cache:'no-store'});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(typeof payload?.error==='string'?payload.error:`Majority Match request failed (${response.status}).`);return payload as T;}
function base(roomCode:string){return `/api/rooms/${encodeURIComponent(roomCode)}/games/majority-match`;}
export function fetchMajorityMatch(accessToken:string,roomCode:string){return request<MajoritySnapshot>(base(roomCode),accessToken);}
export function startMajorityMatchClient(accessToken:string,roomCode:string,input:{category:MajorityCategory;questionCount:number;answerSeconds:number;anonymousResults:boolean;showPercentages:boolean}){return request<MajoritySnapshot>(base(roomCode),accessToken,{method:'POST',body:JSON.stringify(input)});}
export function submitMajorityVoteClient(accessToken:string,roomCode:string,choice:string){return request<MajoritySnapshot>(`${base(roomCode)}/vote`,accessToken,{method:'POST',body:JSON.stringify({choice})});}
export function revealMajorityClient(accessToken:string,roomCode:string,force=false){return request<MajoritySnapshot>(`${base(roomCode)}/reveal`,accessToken,{method:'POST',body:JSON.stringify({force})});}
export function nextMajorityClient(accessToken:string,roomCode:string){return request<MajoritySnapshot>(`${base(roomCode)}/next`,accessToken,{method:'POST'});}
export function endMajorityClient(accessToken:string,roomCode:string){return request<MajoritySnapshot>(`${base(roomCode)}/end`,accessToken,{method:'POST'});}
