import {lazy,Suspense,useRef,useState} from "react";
import {type TabSource} from "./TabPlayer";
import {type TabExercise,toAlphaTex,n,r} from "./notation";

const TabPlayer=lazy(()=>import("./TabPlayer"));

/**
 * Bring your own tab: open a Guitar Pro file, or write one.
 *
 * The reader is the same engine the built-in exercises use, so anything that
 * plays here plays the same way in a lesson.
 */

// What alphaTab's importers accept. Guitar Pro 3 through 8, plus the two
// interchange formats worth supporting.
const ACCEPT=".gp,.gp3,.gp4,.gp5,.gpx,.musicxml,.xml,.mxl,.cap,.capx";
/** Guitar Pro files are small; anything this large is not one. */
const MAX_BYTES=12*1024*1024;

const STARTER:TabExercise={
 id:"starter",title:"New exercise",brief:"",pass:"",
 root:33,rootName:"A minor",tempo:80,
 bars:[
  [n(0,4),n(3,4),n(7,4),n(10,4)],
  [n(10,4),n(7,4),n(3,4),n(0,4)],
  [n(0,8),n(3,8),n(7,8),n(10,8),n(12,4),n(10,4)],
  [n(0,2),r(2)],
 ],
 loop:true,
};

type Mode="write"|"open";

export default function TabStudio(){
 const [mode,setMode]=useState<Mode>("write");
 const [tex,setTex]=useState(()=>toAlphaTex(STARTER));
 // Held separately from the textarea so a half-typed bar does not blank the
 // score on every keystroke.
 const [rendered,setRendered]=useState(tex);
 const [file,setFile]=useState<{data:ArrayBuffer;name:string}|null>(null);
 const [notice,setNotice]=useState("");
 const input=useRef<HTMLInputElement>(null);

 const open=async(chosen:File|undefined)=>{
  setNotice("");
  if(!chosen)return;
  if(chosen.size>MAX_BYTES){
   setNotice(`${chosen.name} is ${(chosen.size/1024/1024).toFixed(1)}MB — larger than this reader accepts.`);
   return;
  }
  try{
   setFile({data:await chosen.arrayBuffer(),name:chosen.name});
   setMode("open");
  }catch{
   setNotice("That file could not be read.");
  }
 };

 const source:TabSource|null=mode==="open"
  ?(file?{kind:"file",data:file.data,name:file.name}:null)
  :{kind:"tex",tex:rendered};

 return (
  <>
   <header className="lede-block">
    <span className="label">Tab studio</span>
    <h1 className="h2" data-page-heading tabIndex={-1}>Your own tabs</h1>
    <p className="lead">Open a Guitar Pro file, or write an exercise and play it back at any tempo.</p>
   </header>

   <nav className="studioModes" aria-label="Source">
    <button className={`exerciseChip ${mode==="write"?"on":""}`} onClick={()=>setMode("write")}>Write</button>
    <button className={`exerciseChip ${mode==="open"?"on":""}`} onClick={()=>{setMode("open");if(!file)input.current?.click()}}>Open a file</button>
   </nav>

   {mode==="open"?(
    <div className="studioOpen">
     <input
      ref={input}
      type="file"
      accept={ACCEPT}
      className="studioFile"
      onChange={event=>{void open(event.target.files?.[0]);event.target.value=""}}
     />
     <button className="action" onClick={()=>input.current?.click()}>
      {file?`Replace ${file.name}`:"Choose a Guitar Pro file"}
     </button>
     <p className="dim">Guitar Pro 3–8, MusicXML and Capella. Files stay on this device — nothing is uploaded.</p>
    </div>
   ):(
    <div className="studioWrite">
     <label className="label" htmlFor="tex">alphaTex source</label>
     <textarea
      id="tex"
      className="studioText mono"
      spellCheck={false}
      value={tex}
      onChange={event=>setTex(event.target.value)}
     />
     <div className="row-actions">
      <button className="action-primary" onClick={()=>setRendered(tex)} disabled={tex===rendered}>
       Render
      </button>
      <button className="action action-quiet" onClick={()=>{const fresh=toAlphaTex(STARTER);setTex(fresh);setRendered(fresh)}}>
       Reset
      </button>
     </div>
     <p className="dim">
      A note is <code>fret.string.duration</code> — string 4 is the low E, and the duration is the
      bottom of the fraction, so <code>5.4.4</code> is a quarter note at the fifth fret of the E string.
      Bars are separated by <code>|</code> and a rest is <code>r.4</code>.
     </p>
    </div>
   )}

   {notice&&<p className="tabError" role="alert">{notice}</p>}

   {source&&(
    <Suspense fallback={<p className="tabLoading" role="status">Loading the reader…</p>}>
     <TabPlayer source={source} title={mode==="open"?file?.name:"Your exercise"}/>
    </Suspense>
   )}
  </>
 );
}
