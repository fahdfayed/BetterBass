/**
 * Wrong Note Rescue's own scoring rules, apart from drills.ts for the same
 * reason boss.ts is: not "what is asked" but "what the answer is worth."
 *
 * Any chord tone still rescues a forced outside note — the drill's own
 * comment always said "the nearest ones are the convincing answers," but
 * nothing measured that until now.
 */

const mod=(v:number)=>((v%12)+12)%12;

export const circularDistance=(a:number,b:number):number=>{
 const d=Math.abs(mod(a)-mod(b));
 return Math.min(d,12-d);
};

export const nearestDistance=(pc:number,tones:number[]):number=>
 Math.min(...tones.map(t=>circularDistance(pc,t)));

export type Tier="Textbook"|"Reaches"|"Distant";

/** How convincing a rescue was, purely from how far the played note sits from the forced one. */
export function tierFor(distance:number):{tier:Tier;said:string}{
 if(distance<=1)return{tier:"Textbook",said:"Textbook. That pulls hardest."};
 if(distance===2)return{tier:"Reaches",said:"Reaches for it, and it holds."};
 return{tier:"Distant",said:"Distant, but it resolves — bold."};
}

/**
 * Which outside notes are even offered as the forced note, once the streak
 * has proven the easy pool. `hard` keeps only notes with no semitone-away
 * resolution in `inside` — a rescue with no convenient answer available.
 * Falls back to every outside note if that would otherwise be empty, so a
 * quality whose tones happen to cover the whole circle tightly never stalls.
 */
export function poolFor(outside:number[],inside:number[],level:number):number[]{
 if(level<1)return outside;
 const hard=outside.filter(pc=>nearestDistance(pc,inside)>=2);
 return hard.length?hard:outside;
}
