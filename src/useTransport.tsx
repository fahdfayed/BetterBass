import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import {startAudioClock,type AudioClock} from "./audio-clock";
import {markBeat,setTempo as publishTempo,stopClock} from "./conductor";

/**
 * One clock for the whole workstation.
 *
 * Playback used to be a private arrangement inside whichever screen you had
 * open: four separate views each built their own AudioContext, each with its
 * own tempo, and leaving a screen silently threw all of it away. Tempo is a
 * property of the session, not of the page you happen to be reading.
 *
 * So the clock lives here and the transport strip drives it. The strip is
 * real hardware: every control on it does something, because a transport with
 * a decorative loop button is worse than no loop button at all.
 *
 * The context is created on the first press rather than at load, because a
 * browser will not let one exist before a gesture, and one built too early is
 * a suspended object that never makes a sound.
 */

const TEMPO_MIN=40,TEMPO_MAX=240;

export type TransportState={
 tempo:number;
 running:boolean;
 loop:boolean;
 countIn:boolean;
 /** Beat within the bar, 0 to 3. Meaningless while stopped. */
 beat:number;
 /** Bars elapsed since the clock started. */
 bar:number;
 /** True while the count-in bar is playing and before the loop proper. */
 counting:boolean;
 setTempo:(bpm:number)=>void;
 nudgeTempo:(by:number)=>void;
 toggle:()=>void;
 stop:()=>void;
 setLoop:(on:boolean)=>void;
 setCountIn:(on:boolean)=>void;
};

const Ctx=createContext<TransportState|null>(null);

/** Read the session clock. Safe to call from any screen. */
export function useTransport(){
 const value=useContext(Ctx);
 if(!value)throw new Error("useTransport used outside TransportProvider");
 return value;
}

export function TransportProvider({children}:{children:ReactNode}){
 const [tempo,setTempoRaw]=useState(84);
 const [running,setRunning]=useState(false);
 const [loop,setLoop]=useState(true);
 const [countIn,setCountIn]=useState(true);
 const [beat,setBeat]=useState(0);
 const [bar,setBar]=useState(0);
 const [counting,setCounting]=useState(false);

 const audio=useRef<{ctx:AudioContext;clock:AudioClock}|null>(null);
 // The clock reads tempo through a ref so a change while running takes effect
 // on the next beat instead of tearing the clock down and restarting it.
 const tempoRef=useRef(tempo);
 tempoRef.current=tempo;
 const countInRef=useRef(countIn);
 countInRef.current=countIn;

 const setTempo=useCallback((bpm:number)=>{
  const next=Math.round(Math.min(TEMPO_MAX,Math.max(TEMPO_MIN,bpm)));
  setTempoRaw(next);publishTempo(next);
 },[]);
 const nudgeTempo=useCallback((by:number)=>{
  setTempoRaw(value=>{
   const next=Math.round(Math.min(TEMPO_MAX,Math.max(TEMPO_MIN,value+by)));
   publishTempo(next);return next;
  });
 },[]);

 const stop=useCallback(()=>{
  const engine=audio.current;
  if(engine){engine.clock.stop();void engine.ctx.close();audio.current=null}
  setRunning(false);setCounting(false);setBeat(0);setBar(0);
  // Stopped, the interface stops keeping time: nothing pulses and nothing waits.
  stopClock();
 },[]);

 const start=useCallback(()=>{
  if(audio.current)return;
  const ctx=new AudioContext();
  const countInBeats=countInRef.current?4:0;
  setCounting(countInBeats>0);

  const clock=startAudioClock(ctx,()=>tempoRef.current,{
   schedule:(index,time)=>{
    /*
     * Three voices, so the count-in is audibly not the take. The count-in
     * is a dry high tick, the downbeat is a fifth below it, and the other
     * three beats are quieter again. A metronome where every click sounds
     * the same is one you stop being able to hear.
     */
    const inCount=index<countInBeats;
    const onDownbeat=(index-countInBeats)%4===0;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.frequency.setValueAtTime(inCount?1760:onDownbeat?1320:880,time);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(inCount?.34:onDownbeat?.42:.2,time+.004);
    gain.gain.exponentialRampToValueAtTime(.0001,time+.055);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(time);osc.stop(time+.07);
   },
   display:index=>{
    const counted=index<countInBeats;
    const beatOfBar=counted?index%4:(index-countInBeats)%4;
    setCounting(counted);
    setBeat(beatOfBar);
    if(!counted)setBar(Math.floor((index-countInBeats)/4));
    // The rest of the interface takes its time from here.
    markBeat(beatOfBar,tempoRef.current);
   },
  });

  audio.current={ctx,clock};
  setRunning(true);
 },[]);

 const toggle=useCallback(()=>{
  if(audio.current)stop();else start();
 },[start,stop]);

 // A transport left running when the app unmounts keeps making noise.
 useEffect(()=>()=>{
  const engine=audio.current;
  if(engine){engine.clock.stop();void engine.ctx.close();audio.current=null}
 },[]);

 const value=useMemo<TransportState>(()=>({
  tempo,running,loop,countIn,beat,bar,counting,
  setTempo,nudgeTempo,toggle,stop,setLoop,setCountIn,
 }),[tempo,running,loop,countIn,beat,bar,counting,setTempo,nudgeTempo,toggle,stop]);

 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export {TEMPO_MIN,TEMPO_MAX};
