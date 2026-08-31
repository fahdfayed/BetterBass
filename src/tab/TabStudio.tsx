import {lazy,Suspense,useRef,useState} from "react";
import {type TabSource} from "./TabPlayer";
import {type TabExercise,toAlphaTex,n,r} from "./notation";
import {exerciseFromAsciiTab} from "./ascii-tab";

const TabPlayer=lazy(()=>import("./TabPlayer"));

/**
 * Bring your own tab: paste plain tab, open a Guitar Pro file, or write one.
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

/** The top fret the reader will draw, matching the rest of the studio. */
const MAX_FRET=24;

type Mode="write"|"open"|"paste";

export default function TabStudio(){
 const [mode,setMode]=useState<Mode>("write");
 const [tex,setTex]=useState(()=>toAlphaTex(STARTER));
 // Held separately from the textarea so a half-typed bar does not blank the
 // score on every keystroke.
 const [rendered,setRendered]=useState(tex);
 const [file,setFile]=useState<{data:ArrayBuffer;name:string}|null>(null);
 const [notice,setNotice]=useState("");
 /*
  * Plain tab, which is the form most bass material actually exists in and the
  * one thing this studio could not read. It offered a Guitar Pro file or
  * alphaTex source, and alphaTex is a notation language rather than something
  * anybody already has.
  */
 const [pasted,setPasted]=useState("");
 const [pastedTex,setPastedTex]=useState("");
 const input=useRef<HTMLInputElement>(null);

 const readPasted=()=>{
  setNotice("");
  try{
   const exercise=exerciseFromAsciiTab({
    id:"pasted",title:"Pasted tab",brief:"Read from plain tab.",pass:"-",tab:pasted,
   });
   if(!exercise.bars.some(bar=>bar.length)){
    setPastedTex("");
    setNotice("No frets found. Each line should start with G, D, A or E and carry that string's fret numbers.");
    return;
   }

   /*
    * Say what cannot be played rather than playing something else.
    *
    * Frets are placed on the neck directly, so nothing checks them the way a
    * pitch would be checked — fret 99 rendered happily. And tab exported from
    * a source written for another instrument often marks the notes that do not
    * fit, "v" under the low E and "^" past the top fret; reading the number
    * and dropping the marker turns those into a different note without saying
    * so, which is worse than refusing them.
    */
   const beyond=exercise.bars.flat()
    .filter((event):event is Extract<typeof event,{t:"f"}>=>event.t==="f")
    .filter(event=>event.fret<0||event.fret>MAX_FRET);
   const marked=pasted.match(/\d+[v^]/g)?.length??0;

   /*
    * Three or more digits with nothing between them cannot be split reliably:
    * "0134" is 0 1 3 4 or 0 13 4 and the spacing that would have said which is
    * exactly what proportional export throws away. Two digits are safe, since
    * a fret below ten is written with one.
    */
   const crowded=pasted.match(/\d{3,}/g)?.length??0;

   const trouble=[
    beyond.length&&`${beyond.length} note${beyond.length>1?"s sit":" sits"} past fret ${MAX_FRET}`,
    marked&&`${marked} ${marked>1?"are":"is"} marked as outside a four-string's range (v below the low E, ^ above the top fret) and will sound at the fret written rather than where they belong`,
    crowded&&`${crowded} run${crowded>1?"s":""} of three or more digits had to be guessed at. Put a space between those notes and it will read them the way you meant`,
   ].filter(Boolean);
   setNotice(trouble.length?`Read, but check it: ${trouble.join("; ")}.`:"");

   setPastedTex(toAlphaTex(exercise));
  }catch(cause){
   setPastedTex("");
   setNotice(cause instanceof Error?cause.message:"That tab could not be read.");
  }
 };

 const open=async(chosen:File|undefined)=>{
  setNotice("");
  if(!chosen)return;
  if(chosen.size>MAX_BYTES){
   setNotice(`${chosen.name} is ${(chosen.size/1024/1024).toFixed(1)}MB. Larger than this reader accepts.`);
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
  :mode==="paste"
   ?(pastedTex?{kind:"tex",tex:pastedTex}:null)
   :{kind:"tex",tex:rendered};

 return (
  <>
   <header className="lede-block">
    <span className="label">Tab studio</span>
    <h1 className="h2" data-page-heading tabIndex={-1}>Your own tabs</h1>
    <p className="lead">Paste plain tab, open a Guitar Pro file, or write an exercise, then play it back at any tempo.</p>
   </header>

   <nav className="studioModes" aria-label="Source">
    <button className={`exerciseChip ${mode==="write"?"on":""}`} onClick={()=>setMode("write")}>Write</button>
    <button className={`exerciseChip ${mode==="paste"?"on":""}`} onClick={()=>setMode("paste")}>Paste tab</button>
    <button className={`exerciseChip ${mode==="open"?"on":""}`} onClick={()=>{setMode("open");if(!file)input.current?.click()}}>Open a file</button>
   </nav>

   {mode==="paste"?(
    <div className="studioWrite">
     <label className="label" htmlFor="pasted">Plain tab</label>
     <textarea
      id="pasted"
      className="studioText mono"
      spellCheck={false}
      value={pasted}
      placeholder={`G|-----------------|
D|-----------------|
A|--2--4--5--------|
E|-3--5-----3--5---|`}
      onChange={event=>setPasted(event.target.value)}
     />
     <div className="row-actions">
      <button className="action-primary" onClick={readPasted} disabled={!pasted.trim()}>Read it</button>
      <button className="action action-quiet" onClick={()=>{setPasted("");setPastedTex("");setNotice("")}}>Clear</button>
     </div>
     <p className="dim">
      One line per string, highest first, each starting with its letter, with or without
      the <code>|</code>. Fret numbers sit where the note falls, so the spacing carries the
      rhythm and a wider gap reads as a new group. Anything the four strings cannot reach
      is reported rather than quietly moved.
     </p>
    </div>
   ):mode==="open"?(
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
     <p className="dim">Guitar Pro 3-8, MusicXML and Capella. Files stay on this device, nothing is uploaded.</p>
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
      A note is <code>fret.string.duration</code>. String 4 is the low E, and the duration is the
      bottom of the fraction, so <code>5.4.4</code> is a quarter note at the fifth fret of the E string.
      Bars are separated by <code>|</code> and a rest is <code>r.4</code>.
     </p>
    </div>
   )}

   {notice&&<p className={`tabError ${pastedTex?"tabWarn":""}`} role="alert">{notice}</p>}

   {source&&(
    <Suspense fallback={<p className="tabLoading" role="status">Loading the reader…</p>}>
     <TabPlayer source={source} title={mode==="open"?file?.name:mode==="paste"?"Pasted tab":"Your exercise"}/>
    </Suspense>
   )}
  </>
 );
}
