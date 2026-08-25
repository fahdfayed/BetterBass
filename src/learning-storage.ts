export const LEARNING_STATE_EVENT="basslab-learning-state";

/**
 * Persist one slice of learner progress and tell the sync shell about it.
 *
 * setItem throws when storage is blocked or the quota is exhausted, and this is
 * called from click handlers all over the interface, so a failure here must not
 * take a screen down with it. The in-memory state stays correct either way.
 */
export function saveLearningState(key:string,value:string){
 if(typeof window==="undefined")return false;
 let stored=false;
 try{window.localStorage.setItem(key,value);stored=true}
 catch{stored=false}
 window.dispatchEvent(new CustomEvent(LEARNING_STATE_EVENT,{detail:{key,stored}}));
 return stored;
}
