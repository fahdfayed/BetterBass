export const LEARNING_STATE_EVENT="basslab-learning-state";

export function saveLearningState(key:string,value:string){
 if(typeof window==="undefined")return;
 window.localStorage.setItem(key,value);
 window.dispatchEvent(new CustomEvent(LEARNING_STATE_EVENT,{detail:{key}}));
}
