export type SpeechSettings={enabled:boolean;rate:number};
type SpeakOptions={interrupt?:boolean;rate?:number};

const STORAGE_KEY="basslab-speech-v2";
const SETTINGS_EVENT="basslab-speech-settings";
const STATUS_EVENT="basslab-speech-status";
const DEFAULT_SETTINGS:SpeechSettings={enabled:true,rate:.92};
let requestId=0;

export function speechSupported(){return typeof window!=="undefined"&&"speechSynthesis" in window&&"SpeechSynthesisUtterance" in window}

export function getSpeechSettings():SpeechSettings{
 if(typeof window==="undefined")return DEFAULT_SETTINGS;
 try{
  const saved=JSON.parse(window.localStorage.getItem(STORAGE_KEY)||"null");
  return{enabled:saved?.enabled!==false,rate:typeof saved?.rate==="number"?Math.max(.7,Math.min(1.15,saved.rate)):DEFAULT_SETTINGS.rate};
 }catch{return DEFAULT_SETTINGS}
}

export function updateSpeechSettings(next:Partial<SpeechSettings>){
 const settings={...getSpeechSettings(),...next};
 if(typeof window!=="undefined"){
  window.localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT,{detail:settings}));
  if(!settings.enabled)stopCoachSpeech();
 }
 return settings;
}

export function onSpeechSettingsChange(listener:(settings:SpeechSettings)=>void){
 if(typeof window==="undefined")return()=>{};
 const handle=(event:Event)=>listener((event as CustomEvent<SpeechSettings>).detail||getSpeechSettings());
 window.addEventListener(SETTINGS_EVENT,handle);
 return()=>window.removeEventListener(SETTINGS_EVENT,handle);
}

export function onSpeechStatusChange(listener:(speaking:boolean)=>void){
 if(typeof window==="undefined")return()=>{};
 const handle=(event:Event)=>listener(Boolean((event as CustomEvent<{speaking:boolean}>).detail?.speaking));
 window.addEventListener(STATUS_EVENT,handle);
 return()=>window.removeEventListener(STATUS_EVENT,handle);
}

function emitStatus(speaking:boolean){
 if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent(STATUS_EVENT,{detail:{speaking}}));
}

function voiceFor(lang:string,voices:SpeechSynthesisVoice[]){
 const sameLanguage=voices.filter(voice=>voice.lang.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()));
 const preferred=sameLanguage.find(voice=>/Natural|Neural|Samantha|Daniel|Google|Microsoft|Zira|David|Hoda|Naayf/i.test(voice.name));
 return preferred||sameLanguage[0]||null;
}

function loadedVoices(synth:SpeechSynthesis){
 const current=synth.getVoices();
 if(current.length)return Promise.resolve(current);
 return new Promise<SpeechSynthesisVoice[]>(resolve=>{
  let done=false;
  const finish=()=>{if(done)return;done=true;synth.removeEventListener("voiceschanged",finish);resolve(synth.getVoices())};
  synth.addEventListener("voiceschanged",finish,{once:true});
  window.setTimeout(finish,500);
 });
}

export function stopCoachSpeech(){
 requestId+=1;
 if(!speechSupported())return;
 window.speechSynthesis.cancel();
 emitStatus(false);
}

export function speakCoach(message:string,options:SpeakOptions={}){
 if(!speechSupported()||!message.trim())return Promise.resolve(false);
 const settings=getSpeechSettings();
 if(!settings.enabled)return Promise.resolve(false);
 const id=++requestId,interrupt=options.interrupt??true;
 return (async()=>{
  const synth=window.speechSynthesis,lang="en-US";
  const text=message.replace(/[–—]/g," ").replace(/\s+/g," ").trim();
  const voices=await loadedVoices(synth);
  if(id!==requestId)return false;
  if(interrupt){synth.cancel();await new Promise(resolve=>window.setTimeout(resolve,55));if(id!==requestId)return false}
  const utterance=new SpeechSynthesisUtterance(text),voice=voiceFor(lang,voices);
  utterance.lang=lang;utterance.rate=options.rate??settings.rate;utterance.pitch=.92;utterance.volume=1;if(voice)utterance.voice=voice;
  utterance.onstart=()=>emitStatus(true);
  utterance.onend=()=>{if(id===requestId)emitStatus(false)};
  utterance.onerror=event=>{if(!["canceled","interrupted"].includes(event.error))console.warn("Bass Lab voice error:",event.error);if(id===requestId)emitStatus(false)};
  synth.resume();synth.speak(utterance);
  window.setTimeout(()=>{if(id===requestId&&synth.paused)synth.resume()},120);
  return true;
 })();
}
