# 3D Fretboard Neck (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new, standalone 3D bass-neck screen for spatial exploration — rotate/zoom a real-proportioned neck, pick a root and mode, see the scale's notes colored by role, click a note to hear it.

**Architecture:** A tiny new pure-math/theory module (`fretboard-neck-geometry.ts`) supplies fret spacing and note-role data, reusing this repo's existing `fretboard-positions.ts` tuning constants rather than re-deriving them. A new React Three Fiber component (`FretboardNeck3D.tsx`) renders the neck as procedural geometry (boxes, cylinders, spheres) — no 3D model files. It's wired into `BassLab.tsx`'s existing "Specialties" navigation section as a new, independent `view`, lazy-loaded like every other heavy tool screen already is. Nothing about the existing 2D `HarmonyFretboard.tsx` or its call sites changes.

**Tech Stack:** React 19, TypeScript, Vite. New dependencies: `three`, `@react-three/fiber`, `@react-three/drei`.

**Spec:** `docs/superpowers/specs/2026-09-06-fretboard-neck-3d-design.md`

## Global Constraints

- No changes to `src/HarmonyFretboard.tsx` or either of its call sites (`src/BassLab.tsx`'s "fret" view, `src/views/LessonTools.tsx`).
- No live mic/pitch integration, no backing-band/progression playback, no "fog" recall filter — Phase 1 only (per spec Non-goals).
- No 3D model files or external asset pipeline — procedural geometry only.
- Reuse `src/fretboard-positions.ts`'s `OPEN_STRINGS`/`TOP_FRET` for tuning data rather than re-declaring it.
- Reuse `src/harmony-fretboard-data.ts`'s `MODES`/`SCALE_LIBRARY` for scale/mode data rather than inventing new theory data.
- Code style matches this codebase: no semicolons-as-line-breaks convention to violate — this repo's TypeScript/TSX is written compact (tabs for indent are 1 space per existing files; follow whatever a file already uses), with named exports and no default-export-then-named mixing beyond what's already established. Follow the formatting of the file being edited.

---

### Task 1: Fretboard neck geometry module

**Files:**
- Create: `src/fretboard-neck-geometry.ts`
- Test: `tests/fretboard-neck-geometry.test.mjs`

**Interfaces:**
- Consumes: `OPEN_STRINGS:number[]`, `TOP_FRET:number` from `../src/fretboard-positions.ts` (already exist); `MODES:{n:string;f:string;s:number[];c:number}[]` and `SCALE_LIBRARY:{character:number[]}[]` from `../src/harmony-fretboard-data.ts` (already exist, index-aligned: `MODES[i]` and `SCALE_LIBRARY[i]` describe the same scale for `i` in 0-6).
- Produces: `fretPosition(fret:number, scaleLength:number):number`, `notesInMode(root:number, mode:number):number[]`, `type Role="root"|"colour"|"scale"|"outside"`, `roleFor(pc:number, root:number, mode:number):Role`. `FretboardNeck3D.tsx` (Task 3) imports all four.

- [ ] **Step 1: Write the failing tests**

Create `tests/fretboard-neck-geometry.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {fretPosition,notesInMode,roleFor} from "../src/fretboard-neck-geometry.ts";

test("fretPosition places the nut at zero and the octave at half the scale length",()=>{
 assert.equal(fretPosition(0,100),0);
 assert.equal(fretPosition(12,100),50,"the 12th fret is always exactly half the scale length");
});

test("fretPosition places the double-octave at three quarters of the scale length",()=>{
 // A well-known real-world checkpoint: fret 24 sits 3/4 of the way to the bridge.
 assert.ok(Math.abs(fretPosition(24,100)-75)<1e-9);
});

test("fretPosition is monotonically increasing and never reaches the scale length",()=>{
 let previous=-1;
 for(let fret=0;fret<=20;fret++){
  const position=fretPosition(fret,100);
  assert.ok(position>previous,`fret ${fret} did not move further than the one before it`);
  assert.ok(position<100,`fret ${fret} reached or passed the bridge`);
  previous=position;
 }
});

test("notesInMode returns the mode's scale transposed to the given root",()=>{
 // Ionian (mode 0) from C (root 0) is the plain major scale.
 assert.deepEqual(notesInMode(0,0),[0,2,4,5,7,9,11]);
 // The same mode from A (root 9) transposes every degree by 9 semitones.
 assert.deepEqual(notesInMode(9,0),[9,11,1,2,4,6,8]);
});

test("roleFor names the root, the mode's own character tones, and the rest of the scale",()=>{
 // Dorian (mode 1) from A: scale is A B C D E F# G (root 9).
 assert.equal(roleFor(9,9,1),"root");
 // Dorian's character tone is scale degree index matching its raised 6th (F#, pc 6).
 assert.equal(roleFor(6,9,1),"colour");
 // D (pc 2) is in the scale, not the root, not the character tone.
 assert.equal(roleFor(2,9,1),"scale");
});

test("roleFor names anything outside the mode's scale as outside",()=>{
 // A# (pc 10) is not in A Dorian (A B C D E F# G).
 assert.equal(roleFor(10,9,1),"outside");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/fretboard-neck-geometry.test.mjs`
Expected: FAIL — `Cannot find module '../src/fretboard-neck-geometry.ts'`

- [ ] **Step 3: Write the implementation**

Create `src/fretboard-neck-geometry.ts`:

```ts
/**
 * Physical and theoretical facts the 3D neck view needs, kept apart from
 * React and Three.js so the arithmetic can be tested directly.
 *
 * Tuning and fret count are not re-declared here — they already exist,
 * tested, in fretboard-positions.ts, which the live-pitch board uses to
 * find where a heard note could be fretted. This module only adds what
 * that one doesn't have: real (non-uniform) fret spacing, and which
 * pitch classes belong to a root+mode and what role each one plays.
 */

import {MODES,SCALE_LIBRARY} from "./harmony-fretboard-data";

const mod=(value:number)=>((value%12)+12)%12;

/**
 * Distance from the nut to `fret`, in the same units as `scaleLength`.
 *
 * The standard luthier's formula: each fret sits at the point that leaves
 * the remaining string length shorter by the twelfth root of two, compounded
 * per fret — which is why the 12th fret (one octave) always lands at exactly
 * half the scale length, real basses included.
 */
export function fretPosition(fret:number,scaleLength:number):number{
 return scaleLength*(1-1/Math.pow(2,fret/12));
}

/** The pitch classes of `mode`'s scale, transposed to `root`. */
export function notesInMode(root:number,mode:number):number[]{
 return MODES[mode].s.map(interval=>mod(root+interval));
}

export type Role="root"|"colour"|"scale"|"outside";

/**
 * A note's role against a root+mode alone — no chord.
 *
 * This is deliberately a 4-tier scheme, not HarmonyFretboard's 5-tier
 * root/chord/colour/scale/outside: "chord" and the guide-tone tiers
 * describe a note's relationship to a *sounding chord*, which doesn't
 * exist yet without progression playback (a later phase). Root, colour
 * (the mode's own identifying tone) and scale are all real without one.
 */
export function roleFor(pc:number,root:number,mode:number):Role{
 const interval=mod(pc-root);
 if(interval===0)return "root";
 if(SCALE_LIBRARY[mode].character.includes(interval))return "colour";
 if(MODES[mode].s.includes(interval))return "scale";
 return "outside";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/fretboard-neck-geometry.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/fretboard-neck-geometry.ts tests/fretboard-neck-geometry.test.mjs
git commit -m "Add fretboard-neck-geometry module for the 3D neck view

Pure fret-spacing and root/mode note-role logic, reusing fretboard-positions.ts's existing tuning data rather than re-declaring it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Install 3D rendering dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)

**Interfaces:**
- Consumes: nothing
- Produces: `three`, `@react-three/fiber`, `@react-three/drei` importable from Task 3 onward.

- [ ] **Step 1: Install the packages**

Run: `npm install three @react-three/fiber @react-three/drei`

- [ ] **Step 2: Verify the app still builds**

Run: `npx tsc --noEmit`
Expected: the same two pre-existing error clusters this repo already has (`src/BassLab.tsx` two `midi` type errors, `src/PerformanceCoach.tsx` two `"Build"` literal errors) and nothing new. If new errors appear naming `three`/`@react-three/*` types, check `tsconfig.json`'s `types`/`skipLibCheck` settings rather than proceeding.

Run: `npm run build`
Expected: succeeds (the existing >500kB chunk-size warning is expected and not a failure).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add three.js and React Three Fiber for the 3D neck view

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: The 3D neck scene component

**Files:**
- Create: `src/views/FretboardNeck3D.tsx`
- Create: `src/neck3d.css`

**Interfaces:**
- Consumes: `fretPosition`, `notesInMode`, `roleFor`, `type Role` from `../fretboard-neck-geometry` (Task 1); `OPEN_STRINGS`, `TOP_FRET` from `../fretboard-positions`; `NOTE_NAMES` from `../pitch`; `MODES` from `../harmony-fretboard-data`; `Canvas` from `@react-three/fiber`; `OrbitControls` from `@react-three/drei` (Task 2).
- Produces: `export default function FretboardNeck3D(props: {root:number; mode:number; onSetRoot:(root:number)=>void; onSetMode:(mode:number)=>void; audition:(pitchClasses:number[], hold?:number)=>void})`. Task 4 imports this as the default export.

- [ ] **Step 1: Write the component**

Create `src/views/FretboardNeck3D.tsx`:

```tsx
import {useMemo} from "react";
import {Canvas} from "@react-three/fiber";
import {OrbitControls} from "@react-three/drei";
import {fretPosition,notesInMode,roleFor,type Role} from "../fretboard-neck-geometry";
import {OPEN_STRINGS,TOP_FRET} from "../fretboard-positions";
import {NOTE_NAMES} from "../pitch";
import {MODES} from "../harmony-fretboard-data";

/**
 * Phase 1 of the 3D neck: rotate/explore, pick a root and mode, click a
 * note to hear it. No live pitch, no backing band, no fog filter — see
 * docs/superpowers/specs/2026-09-06-fretboard-neck-3d-design.md for why.
 */

type Props={
 root:number;
 mode:number;
 onSetRoot:(root:number)=>void;
 onSetMode:(mode:number)=>void;
 audition:(pitchClasses:number[],hold?:number)=>void;
};

const SCALE_LENGTH=34;
const STRING_SPACING=0.6;
const ROLE_COLOR:Record<Role,string>={root:"#c4351a",colour:"#8a6206",scale:"#63701a",outside:"#6a675e"};
const ROLE_LABEL:Record<Role,string>={root:"Root",colour:"Colour",scale:"Scale",outside:"Outside"};
const mod=(value:number)=>((value%12)+12)%12;

export default function FretboardNeck3D({root,mode,onSetRoot,onSetMode,audition}:Props){
 const scale=useMemo(()=>notesInMode(root,mode),[root,mode]);
 const frets=useMemo(()=>Array.from({length:TOP_FRET+1},(_,index)=>index),[]);
 const fretXs=useMemo(()=>frets.map(fret=>fretPosition(fret,SCALE_LENGTH)),[frets]);
 const neckLength=fretXs[fretXs.length-1];
 const boardWidth=(OPEN_STRINGS.length-1)*STRING_SPACING;

 const notes=useMemo(()=>{
  const placed:{key:string;x:number;z:number;color:string;pc:number}[]=[];
  OPEN_STRINGS.forEach((open,stringIndex)=>{
   frets.forEach(fret=>{
    const pc=mod(open+fret);
    if(!scale.includes(pc))return;
    const role=roleFor(pc,root,mode);
    const x=fret===0?0:(fretXs[fret-1]+fretXs[fret])/2;
    placed.push({key:`${stringIndex}:${fret}`,x,z:stringIndex*STRING_SPACING,color:ROLE_COLOR[role],pc});
   });
  });
  return placed;
 },[frets,fretXs,scale,root,mode]);

 return (
  <div className="neck3d">
   <div className="neck3dControls">
    <label><span className="label">Root</span>
     <select value={root} onChange={event=>onSetRoot(+event.target.value)}>
      {NOTE_NAMES.map((name,index)=><option value={index} key={name}>{name}</option>)}
     </select>
    </label>
    <label><span className="label">Mode</span>
     <select value={mode} onChange={event=>onSetMode(+event.target.value)}>
      {MODES.map((entry,index)=><option value={index} key={entry.n}>{entry.n}</option>)}
     </select>
    </label>
   </div>

   <div className="neck3dCanvas">
    <Canvas camera={{position:[neckLength/2,9,11],fov:45}}>
     <ambientLight intensity={.7}/>
     <directionalLight position={[10,12,8]} intensity={.9}/>
     <OrbitControls target={[neckLength/2,0,boardWidth/2]} makeDefault/>

     <mesh position={[neckLength/2,-0.3,boardWidth/2]}>
      <boxGeometry args={[neckLength+1,0.4,boardWidth+0.6]}/>
      <meshStandardMaterial color="#3a2a1e"/>
     </mesh>

     {fretXs.map((x,index)=>(
      <mesh key={index} position={[x,-0.08,boardWidth/2]}>
       <boxGeometry args={[0.06,0.05,boardWidth+0.4]}/>
       <meshStandardMaterial color="#c8c2b0"/>
      </mesh>
     ))}

     {OPEN_STRINGS.map((_,stringIndex)=>(
      <mesh key={stringIndex} position={[neckLength/2,0,stringIndex*STRING_SPACING]} rotation={[0,0,Math.PI/2]}>
       <cylinderGeometry args={[0.025,0.025,neckLength+1,8]}/>
       <meshStandardMaterial color="#d8d4c4"/>
      </mesh>
     ))}

     {notes.map(note=>(
      <mesh key={note.key} position={[note.x,0.22,note.z]}
            onClick={event=>{event.stopPropagation();audition([note.pc])}}>
       <sphereGeometry args={[0.18,16,16]}/>
       <meshStandardMaterial color={note.color}/>
      </mesh>
     ))}
    </Canvas>
   </div>

   <div className="neck3dLegend">
    {(Object.keys(ROLE_COLOR) as Role[]).map(role=>(
     <span className="neck3dLegendItem" key={role}>
      <i style={{background:ROLE_COLOR[role]}}/>{ROLE_LABEL[role]}
     </span>
    ))}
   </div>
  </div>
 );
}
```

- [ ] **Step 2: Write the stylesheet**

Create `src/neck3d.css`:

```css
.neck3d{display:flex;flex-direction:column;gap:var(--s4)}
.neck3dControls{display:flex;flex-wrap:wrap;gap:var(--s4)}
.neck3dControls .label{font:var(--t-micro) var(--mono);letter-spacing:.1em;color:var(--ink-3)}
.neck3dCanvas{height:420px;border:1px solid var(--line);background:#1b140e}
.neck3dLegend{display:flex;flex-wrap:wrap;gap:var(--s4)}
.neck3dLegendItem{display:flex;align-items:center;gap:6px;font:var(--t-micro) var(--mono);letter-spacing:.06em;color:var(--ink-2)}
.neck3dLegendItem i{width:10px;height:10px;border-radius:50%;display:inline-block}
```

- [ ] **Step 3: Import the stylesheet**

In `src/main.tsx`, find this exact line:

```ts
import "./slap.css";
```

Add immediately after it:

```ts
import "./neck3d.css";
```

- [ ] **Step 4: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: same pre-existing errors only, nothing new from this file.

- [ ] **Step 5: Commit**

```bash
git add src/views/FretboardNeck3D.tsx src/neck3d.css
git commit -m "Add the 3D fretboard neck scene component

React Three Fiber scene: procedural neck/frets/strings, notes colored by root/colour/scale role, click-to-audition, orbit controls. Not yet reachable from navigation.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Wire the 3D neck into navigation

**Files:**
- Modify: `src/BassLab.tsx`

**Interfaces:**
- Consumes: `FretboardNeck3D` default export (Task 3); existing `root`, `mode`, `setRoot`, `setMode`, `audition` state/callbacks already declared in `BassLab.tsx`.
- Produces: a new reachable `view==="neck3d"` screen under "Specialties" in the nav.

- [ ] **Step 1: Add the lazy import**

Find this line in `src/BassLab.tsx` (near the other `lazy()` screen imports, e.g. next to the `MaqamLab` one):

```ts
const MaqamLab=lazy(()=>import("./MaqamLab"));
```

Add immediately after it:

```ts
const FretboardNeck3D=lazy(()=>import("./views/FretboardNeck3D"));
```

- [ ] **Step 2: Add the nav entry**

Find this exact line:

```ts
 {label:"Specialties",items:[{id:"maqam",icon:"maqam",label:"Arabic maqam"},{id:"slap",icon:"slap",label:"Slap bass"}]},
```

Replace it with:

```ts
 {label:"Specialties",items:[{id:"maqam",icon:"maqam",label:"Arabic maqam"},{id:"slap",icon:"slap",label:"Slap bass"},{id:"neck3d",icon:"neck3d",label:"3D neck"}]},
```

- [ ] **Step 3: Add the view metadata entry**

Find this exact line:

```ts
 practice:{eyebrow:"Hands-free training",title:"Practice studio"},coach:{eyebrow:"Listening + feedback",title:"Live coach"},maqam:{eyebrow:"Arabic music",title:"Maqam lab"},slap:{eyebrow:"Technique + groove",title:"Slap bass"},
```

Replace it with:

```ts
 practice:{eyebrow:"Hands-free training",title:"Practice studio"},coach:{eyebrow:"Listening + feedback",title:"Live coach"},maqam:{eyebrow:"Arabic music",title:"Maqam lab"},slap:{eyebrow:"Technique + groove",title:"Slap bass"},neck3d:{eyebrow:"Spatial practice",title:"3D neck"},
```

- [ ] **Step 4: Add the NAV_ACTIVE entry**

Find this exact line (search for `const NAV_ACTIVE`):

```ts
const NAV_ACTIVE:Record<string,string[]>={course:["course"],roadmap:["roadmap","courseLesson"],practice:["practice","today","live"],coach:["coach","adaptive"],maqam:["maqam"],slap:["slap"],tools:["tools","fret","runtime","engine","advanced","reference","games","progression"],courseProgress:["courseProgress"]};
```

Replace it with:

```ts
const NAV_ACTIVE:Record<string,string[]>={course:["course"],roadmap:["roadmap","courseLesson"],practice:["practice","today","live"],coach:["coach","adaptive"],maqam:["maqam"],slap:["slap"],neck3d:["neck3d"],tools:["tools","fret","runtime","engine","advanced","reference","games","progression"],courseProgress:["courseProgress"]};
```

- [ ] **Step 5: Add the render block**

Find this exact line (search for `view==="slap"`):

```tsx
 {view==="slap"&&<Suspense fallback={<ToolLoading/>}><SlapLab livePitch={pitch} listening={listening} onToggleListening={startAudio} events={events}/></Suspense>} 
```

Add immediately after it:

```tsx
 {view==="neck3d"&&<Suspense fallback={<ToolLoading/>}><FretboardNeck3D root={root} mode={mode} onSetRoot={setRoot} onSetMode={setMode} audition={audition}/></Suspense>}
```

- [ ] **Step 6: Type-check and build**

Run: `npx tsc --noEmit`
Expected: same two pre-existing error clusters only.

Run: `npm run build`
Expected: succeeds.

Run: `npm test`
Expected: all tests pass, including the 6 new ones from Task 1.

- [ ] **Step 7: Commit**

```bash
git add src/BassLab.tsx
git commit -m "Wire the 3D fretboard neck into the Specialties navigation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Manual verification in the browser

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Start the dev server and open it**

Use the project's preview/dev-server tool to start `basslab-dev` (or run `npm run dev` if working outside an environment with that tool) and navigate to the app.

- [ ] **Step 2: Navigate to the new screen**

Click through: the "Specialties" section of the nav → "3D neck".

- [ ] **Step 3: Verify the checklist**

- The canvas renders a neck with 4 strings and visible fret lines, not a blank or black box.
- Dragging inside the canvas rotates the view; scrolling zooms.
- Changing the Root or Mode dropdown changes which note spheres are shown.
- Root notes, colour-tone notes, and other scale notes are visually distinguishable by color, matching the legend.
- Clicking a note sphere plays a sound (requires the bass/audio context to already be started elsewhere in the app first, same as any other `audition` call).
- No console errors on load or on interaction.

- [ ] **Step 4: Check it on the hardware this app is actually practiced on**

The spec's stated purpose is spatial-memory drilling during real practice, and its own Risks section names mobile WebGL performance as untested and potentially disqualifying. Resize the browser to a phone viewport (or test on an actual phone/tablet if available) and check:

- The canvas still renders the neck, not a blank/broken view.
- Rotate/zoom gestures work with touch, not just mouse drag/scroll.
- Frame rate during rotation is usable, not a slideshow.

If mobile performance is unacceptable, do not treat that as this task failing — it's exactly the evaluative signal Phase 1 exists to produce. Report it plainly; it directly informs whether a Phase 2 is worth planning at all.

- [ ] **Step 5: Report results**

If any checklist item fails, fix it in the relevant task's file and re-run that task's verification steps before continuing. Do not commit a fix without re-running `npx tsc --noEmit` and `npm test` first.
