import {useEffect,useState} from "react";
import {getSpeechSettings,onSpeechSettingsChange,onSpeechStatusChange,speakCoach,speechSupported,updateSpeechSettings} from "./speech";

export default function VoiceControl(){
 const [settings,setSettings]=useState(getSpeechSettings),[supported,setSupported]=useState(true),[speaking,setSpeaking]=useState(false);
 useEffect(()=>{setSupported(speechSupported());const offSettings=onSpeechSettingsChange(setSettings),offStatus=onSpeechStatusChange(setSpeaking);return()=>{offSettings();offStatus()}},[]);
 if(!supported)return <span className="voiceUnsupported" title="This browser does not provide speech synthesis">Voice unavailable</span>;
 const toggle=()=>setSettings(updateSpeechSettings({enabled:!settings.enabled}));
 const test=()=>void speakCoach("Voice coach ready. Keep the groove steady and leave space.",{interrupt:true});
 return <div className={`voiceControl ${speaking?"speaking":""}`}><button type="button" className="voiceToggle" aria-pressed={settings.enabled} onClick={toggle} title="Turn all spoken coaching on or off"><i>{settings.enabled?"◖))":"◖×"}</i><span>{settings.enabled?"Voice on":"Voice off"}</span></button>{settings.enabled&&<button type="button" className="voiceTest" onClick={test} title="Play a short test message">Test</button>}</div>;
}
