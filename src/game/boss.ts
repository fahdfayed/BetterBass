/**
 * The boss fight's own scoring rules, apart from drills.ts because they
 * answer a different question — not "what is asked" but "what a hit or a
 * miss costs" — which only Boss Fight's health-bar model needs.
 */

export const START_HP=100;
const MISS_DAMAGE=15;
const BASE_DAMAGE=10;
const MAX_COMBO=10;

/**
 * Damage a hit deals to the boss. Rises with an unbroken streak so a run of
 * hits is worth chasing, capped so it never trivializes the fight outright.
 */
export function hitDamage(streak:number):number{
 return BASE_DAMAGE*(1+Math.min(streak,MAX_COMBO)*.1);
}

export const missDamage=MISS_DAMAGE;

export type FightResult="won"|"lost"|"fighting";

/** Who's ahead, from the raw numbers — no clock, no React. */
export function fightResult(bossHp:number,playerHp:number,timeLeft:number):FightResult{
 if(bossHp<=0)return "won";
 if(playerHp<=0)return "lost";
 if(timeLeft<=0)return "lost";
 return "fighting";
}
