import {useEffect,useState} from "react";
import {getSpeechSettings,onSpeechSettingsChange,onSpeechStatusChange,speakCoach,speechSupported,updateSpeechSettings} from "./speech";

export default function VoiceControl(){
 const [settings,setSettings]=useState(getSpeechSettings),[supported,setSupported]=useState(true),[speaking,setSpeaking]=useState(false);
 useEffect(()=>{setSupported(speechSupported());const offSettings=onSpeechSettingsChange(setSettings),offStatus=onSpeechStatusChange(setSpeaking);return()=>{offSettings();offStatus()}},[]);
 if(!supported)return <span className="voiceUnsupported" title="This browser does not provide speech synthesis">Voice unavailable</span>;
 const toggle=()=>setSettings(updateSpeechSettings({enabled:!settings.enabled}));
 const test=()=>void speakCoach("Voice coach ready. Keep the groove steady and leave space.",{interrupt:true});
 /*
  * The speaker is drawn, at the same stroke weight as every other icon in the
  * chrome. It was two Unicode characters before — a half-filled circle and a
  * pair of brackets standing in for sound waves — which is the one thing on a
  * page of real engraved glyphs that reads as borrowed.
  */
 const wave=settings.enabled
  ?<path d="M12.4 6.6a3.4 3.4 0 0 1 0 4.8M14.6 4.4a6.4 6.4 0 0 1 0 9.2"/>
  :<path d="M12.6 6.8l4.2 4.2M16.8 6.8l-4.2 4.2"/>;

 return <div className={`voiceControl ${speaking?"speaking":""}`}>
  <button type="button" className="voiceToggle" aria-pressed={settings.enabled} onClick={toggle} title="Turn all spoken coaching on or off">
   <svg viewBox="0 0 20 18" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6.8h2.4L9 3.4v11.2L5.4 11.2H3z"/>
    {wave}
   </svg>
   <span>{settings.enabled?"Voice on":"Voice off"}</span>
  </button>
  {settings.enabled&&<button type="button" className="voiceTest" onClick={test} title="Play a short test message">Test</button>}
 </div>;
}
