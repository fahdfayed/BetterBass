export type LessonDetail={
  terms:{name:string;definition:string}[];
  /**
   * What the lesson stands on, drawn from earlier ones.
   *
   * The opening section asks the player to check these before reading. It
   * used to show selfCheck, which is what the lesson teaches — so the
   * Lydian lesson asked whether you could feature ♯4 over a major third
   * before explaining either.
   */
  prerequisites:string[];
  /** What the lesson should leave you able to do. Checked at the jury. */
  selfCheck:string[];
  bassFocus:string;
  misconception:string;
  correction:string;
  earCue:string;
  transfer:string;
  variations:string[];
};

export const LESSON_DETAILS:LessonDetail[]=[
  {
    terms:[
      {name:"Tonal centre",definition:"The pitch the ear accepts as the main point of rest and comparison."},
      {name:"Gravity",definition:"The heard pull of unstable notes toward a more stable destination."},
      {name:"Harmonic floor",definition:"The low-register foundation through which bass can redefine the whole harmony."}
    ],
    prerequisites:[
      "Your bass is in tune and every open string speaks cleanly.",
      "You can hold a steady pulse for eight bars against a click.",
      "You can find any named note somewhere on the neck, even slowly."
    ],
    selfCheck:["Can you sing A after hearing an A drone for five seconds?","Can you end a phrase on A without beginning on A?","Can you hear when E temporarily competes with A as home?"],
    bassFocus:"A bassist does more than reinforce a written root. Register, repetition and phrase endings tell the band—and the listener—which pitch has authority.",
    misconception:"Playing the root on every beat automatically creates a strong tonal centre.",
    correction:"Constant root repetition can flatten the music. Establish home, leave it, then prove its gravity by resolving back from meaningful non-root tones.",
    earCue:"Listen for finality: home should feel able to stop the phrase without asking another note to follow.",
    transfer:"Rebuild the same sense of home on E, B♭ and D♭ without copying the original fingering.",
    variations:["Do not play the root until bar 4.","Establish home using only root, 3rd and 7th.","Move the whole task above fret 12."]
  },
  {
    terms:[
      {name:"Interval",definition:"The measured pitch distance—and heard relationship—between a root and another note."},
      {name:"Scale degree",definition:"An interval named by its position inside a tonal collection, such as 3, 6 or ♭7."},
      {name:"Function",definition:"What a note contributes in context: stability, identity, connection or tension."}
    ],
    prerequisites:[
      "Hold one pitch as home for eight bars and still hear it as home.",
      "Sing a pitch back after a drone has stopped.",
      "Hear when a phrase has left home, without being told."
    ],
    selfCheck:["Can you distinguish a semitone from a whole tone by ear?","Can you find the same note in at least three neck locations?","Can you name 3 and ♭7 from a random root without counting frets?"],
    bassFocus:"Interval thinking lets one idea survive every key and neck position. The fingering changes; the sonic job of ♭3 or 6 does not.",
    misconception:"Knowing a fretboard shape means you know the interval.",
    correction:"A shape is only physical information. You know the interval when you can predict its sound, sing it, name it and choose it deliberately.",
    earCue:"Hear every degree against the root—not only against the note immediately before it.",
    transfer:"Take one two-note idea through the circle of fourths while keeping its interval names constant.",
    variations:["Answer by degree before note name.","Play every answer on one string.","Alternate low and high-register answers."]
  },
  {
    terms:[
      {name:"Chord tone",definition:"A pitch contained in the sounding chord and therefore part of its structural identity."},
      {name:"Guide tone",definition:"Usually the 3rd or 7th—the tones that most clearly reveal chord quality and direction."},
      {name:"Extension",definition:"A colour tone above the basic chord, heard as 9, 11 or 13 relative to the root."}
    ],
    prerequisites:[
      "Name a note's distance from the root without counting up to it.",
      "Hear the difference between a ♭3 and a 3 over the same drone.",
      "Say what a note is doing rather than only which fret it is on."
    ],
    selfCheck:["Can you spell a minor 7 chord as 1–♭3–5–♭7?","Can you hear major versus minor from the 3rd?","Can you play a root–3rd–7th shell in three positions?"],
    bassFocus:"Root and 5th provide weight; 3rd and 7th provide information. A pro line balances both instead of treating all chord tones as equal.",
    misconception:"Every note in the correct scale communicates the chord equally well.",
    correction:"Remove the chord tones from a line and the harmony often disappears. Build a structural skeleton first; add extensions as controlled colour.",
    earCue:"Listen for chord quality. If the accompaniment vanished, could the 3rd and 7th in your line still reveal minor, major or dominant?",
    transfer:"Play the same shell hierarchy through Am7, Dm7, G7 and Cmaj7 using the nearest available notes.",
    variations:["Omit the 5th completely.","Land the 3rd on beat 1.","Use only four pitches for the full groove."]
  },
  {
    terms:[
      {name:"Metric weight",definition:"The structural importance a beat or subdivision receives inside the bar."},
      {name:"Duration",definition:"How long a pitch remains exposed before moving or resolving."},
      {name:"Articulation",definition:"The shape of the attack and release: legato, staccato, accented, ghosted or muted."}
    ],
    prerequisites:[
      "State a chord's quality using its root, third and seventh alone.",
      "Land a chosen chord tone on beat 1 without rushing into it.",
      "Play four bars without your tempo drifting."
    ],
    selfCheck:["Can you clap 16th-note subdivisions at 60 BPM?","Can you place a note precisely on &4 then beat 1?","Can you repeat one pitch at four clearly different dynamic levels?"],
    bassFocus:"Bass notes carry more harmonic mass in the low register. A long, accented low tension can reshape the chord more strongly than a quick upper-register passing tone.",
    misconception:"Tension is determined only by which pitch you choose.",
    correction:"Beat placement, length, accent and register can make the same pitch sound like a mistake, a passing gesture or a deliberate reharmonization.",
    earCue:"Compare identical pitches while changing only one variable. If two variables change, you cannot know what caused the new effect.",
    transfer:"Repeat the same four tension treatments at 60, 80 and 100 BPM; preserve their relative weight.",
    variations:["Use ghost notes only.","Reverse strong and weak placements.","Keep rhythm fixed and change register only."]
  },
  {
    terms:[
      {name:"Mode",definition:"A tonal environment defined by a centre and a specific ordered set of interval relationships."},
      {name:"Parent scale",definition:"The source collection from which relative modes can be derived."},
      {name:"Modal centre",definition:"The degree treated as home, which changes the function of every shared pitch."}
    ],
    prerequisites:[
      "Name every degree by its function rather than by its fret.",
      "Hear a collection change while the root underneath stays put.",
      "Say which note makes a chord minor rather than major."
    ],
    selfCheck:["Can you explain why D Dorian and C Ionian share notes but not sound?","Can you hold one root while changing interval collections?","Can you name the seven major-scale modes in order?"],
    bassFocus:"Because bass establishes the low centre, holding one pedal while changing a single degree is one of the clearest ways to make a band hear modal change.",
    misconception:"Modes are just major-scale shapes that begin on different frets.",
    correction:"A starting note does not create a mode. The harmony and phrasing must make that note home, while the interval pattern supplies the environment around it.",
    earCue:"Ignore the first note. Ask which pitch feels settled after the phrase ends and which altered degree defines the atmosphere.",
    transfer:"Compare all seven modes over one C pedal, then repeat the comparison over F♯.",
    variations:["Never begin a phrase on the root.","Keep one rhythm for all seven modes.","Morph only one altered degree at a time."]
  },
  {
    terms:[
      {name:"Relative modes",definition:"Modes that share one note collection but assign different notes as tonal centres."},
      {name:"Same-root modes",definition:"Modes compared from one common tonic so their altered degrees become obvious."},
      {name:"Reorientation",definition:"The act of making a different degree feel like home without changing the pitch collection."}
    ],
    prerequisites:[
      "Explain why two modes can share every note and not share a sound.",
      "Hold one root while the collection around it is replaced.",
      "Name the seven modes in order from one parent scale."
    ],
    selfCheck:["Can you identify C Ionian’s relative Dorian?","Can you compare C Ionian and C Dorian degree by degree?","Can you make D sound final using only white notes?"],
    bassFocus:"Relative thinking helps you spell material; same-root thinking helps you choose colour in real time. Bass improvisation needs both, but the ear should lead.",
    misconception:"If two modes contain the same notes, they are functionally interchangeable.",
    correction:"Shared notes do not create shared gravity. Chord support, bass emphasis and phrase resolution assign completely different meanings to the collection.",
    earCue:"In relative mode drills, listen for the new home. In same-root drills, listen for the degrees that changed.",
    transfer:"Name the relative parent and same-root alterations for Dorian, Lydian and Mixolydian in four random keys.",
    variations:["Use only white notes over changing drones.","Hold C while morphing all seven modes.","Explain both analyses after each take."]
  },
  {
    terms:[
      {name:"Brightness",definition:"A useful perceptual ordering based on how raised or lowered degrees alter a mode’s colour."},
      {name:"Modal family",definition:"Major-family modes contain 3; minor-family modes contain ♭3; Locrian is diminished-minor."},
      {name:"Reference mode",definition:"Ionian or Aeolian used as a baseline so one altered degree can be heard clearly."}
    ],
    prerequisites:[
      "Compare two modes on the same root and say which is brighter.",
      "Identify a mode's third and seventh by ear.",
      "Separate a relative reading of a mode from a parallel one."
    ],
    selfCheck:["Can you separate modes first by major 3 versus minor 3?","Can you hear ♯4 as brighter than natural 4?","Can you order Lydian through Locrian from bright to dark?"],
    bassFocus:"Family recognition is faster onstage than calculating parent scales. First hear major or minor; then identify the degree that changes the shade.",
    misconception:"Brightness is an exact emotional ranking that dictates how music must feel.",
    correction:"Brightness describes interval content, not a mandatory mood. Tempo, timbre, harmony and rhythm can make a ‘bright’ mode feel aggressive or mysterious.",
    earCue:"Make a two-step decision: major/minor family first, then listen for ♯4, 6, ♭2, ♭6 or ♭5.",
    transfer:"Sort seven same-root examples by family and brightness in C, E♭ and B.",
    variations:["Identify family with no root note played.","Use one-note modal morphs.","Match modes to a drawn brightness curve."]
  },
  {
    terms:[
      {name:"Characteristic tone",definition:"The degree that most efficiently distinguishes a mode from its nearest common alternative."},
      {name:"Contrast pair",definition:"Two modes compared by the single important degree between them, such as Dorian 6 versus Aeolian ♭6."},
      {name:"Modal cadence",definition:"A phrase ending or chord motion that reinforces the modal centre and defining colour."}
    ],
    prerequisites:[
      "Group the modes by whether their third is major or minor.",
      "Say which mode a parent scale produces from each of its degrees.",
      "Hear which single degree separates two otherwise identical modes."
    ],
    selfCheck:["Can you name the characteristic degree of every mode?","Can you sing Dorian 6 against a minor root?","Can you feature a colour without simply running the scale?"],
    bassFocus:"A strategically placed characteristic tone can communicate the mode with four pitches. This keeps the line supportive while still harmonically specific.",
    misconception:"More uses of the characteristic note always make the mode clearer.",
    correction:"Identity needs context and contrast. Overuse turns colour into wallpaper; place it where its relationship to chord tones can be heard.",
    earCue:"Hear the reference mode first, then the one altered degree. The emotional change should be audible before you name it.",
    transfer:"Create one two-bar identity phrase for each mode using no more than four unique pitches.",
    variations:["Feature the colour only once.","Place it on a weak beat first, then a strong beat.","Approach it from both directions."]
  },
  {
    terms:[
      {name:"Major 3rd",definition:"The degree that establishes major quality and separates Ionian from minor-family modes."},
      {name:"Major 7th",definition:"A semitone below the root that creates leading-tone pull and Ionian’s polished stability."},
      {name:"Natural 4",definition:"An inside colour that can rub against the major 3rd when held prominently."}
    ],
    prerequisites:[
      "Name the one degree that gives a mode its identity.",
      "Hold a major third clearly against a drone.",
      "Feature a chosen tone twice in four bars without a scale run."
    ],
    selfCheck:["Can you sing 3 and 7 above the root?","Can you resolve 7→1 in three registers?","Can you use 4 without letting it obscure the major 3rd?"],
    bassFocus:"Ionian basslines often sound generic when they rely only on 1 and 5. The 3 confirms major; 7 adds direction; 6 and 2 add melodic openness.",
    misconception:"Ionian has no characteristic sound because it is merely the default major scale.",
    correction:"Its natural 4 and major 7, heard against a stable major tonic, create a distinct diatonic-major environment. Familiar does not mean colourless.",
    earCue:"Listen for 7→1 and 4→3. Those semitone resolutions reveal Ionian’s internal gravity.",
    transfer:"Build an Ionian groove in C, E and A♭, locating 3 and 7 in two regions each.",
    variations:["Ban the 5th.","Use 7 only as a pickup to 1.","Sustain 4, then resolve it to 3."]
  },
  {
    terms:[
      {name:"Natural 6",definition:"Dorian’s defining lift above a minor tonic, contrasting with Aeolian ♭6."},
      {name:"Minor shell",definition:"Root, ♭3 and ♭7—the structural frame that must remain audible beneath modal colour."},
      {name:"Dorian cadence",definition:"Motion that highlights 6 and returns to a minor chord tone or tonic."}
    ],
    prerequisites:[
      "Hear a natural 6 as a different thing from a ♭7.",
      "Play a minor seventh arpeggio from any root.",
      "State a mode's identity without ascending its scale."
    ],
    selfCheck:["Can you sing 6 after hearing 1–♭3–5?","Can you compare 6 and ♭6 without a diagram?","Can you state minor quality before introducing 6?"],
    bassFocus:"Dorian is especially useful for funk, fusion and modal rock because 6 adds forward lift without changing the minor 3rd and ♭7 foundation.",
    misconception:"Playing the natural 6 anywhere over a minor chord automatically sounds Dorian.",
    correction:"The ear must first accept the minor tonic. Then 6 needs audible relationship to 5, ♭7 or a structural target—not random inclusion.",
    earCue:"Compare 5–6–♭7 with 5–♭6–♭7. The first opens upward; the second darkens and compresses.",
    transfer:"Create Dorian identity in A, E♭ and B using root, ♭3, 5, 6 and ♭7 only.",
    variations:["Use 6 exactly twice.","Never ascend the full mode.","Begin on ♭3 and end on 6→5."]
  },
  {
    terms:[
      {name:"Flat 2",definition:"Phrygian’s defining semitone above the tonic, creating immediate root friction."},
      {name:"Upper neighbour",definition:"A pitch above a target that falls into it; ♭2 can act this way above 1."},
      {name:"Phrygian pedal",definition:"A sustained or repeated root beneath gestures that expose ♭2 and the minor shell."}
    ],
    prerequisites:[
      "Hold a minor centre while a note that sounds outside is played over it.",
      "Hear a ♭2 as a semitone above the root rather than as a wrong note.",
      "Keep home audible when a phrase begins away from it."
    ],
    selfCheck:["Can you sing ♭2 without drifting to 2?","Can you maintain 5 as a stable reference?","Can you resolve ♭2→1 at three different durations?"],
    bassFocus:"The low ♭2 is extremely exposed. Short neighbour motion can sound controlled; a long accented ♭2 can imply a different bass harmony entirely.",
    misconception:"Phrygian means repeatedly hammering ♭2 against the root.",
    correction:"The minor shell establishes context. Use ♭2 as identity, motif or controlled friction, and balance it with stable 1, ♭3 and 5.",
    earCue:"The decisive sound is the one-fret compression between 1 and ♭2. Hear its pressure and its release back to 1.",
    transfer:"Improvise one dark but spacious Phrygian phrase in E, C and F♯ without a scale run.",
    variations:["Keep ♭2 above fret 12.","Use ♭2 only as an accented long tone.","Avoid returning directly ♭2→1."]
  },
  {
    terms:[
      {name:"Sharp 4",definition:"Lydian’s defining raised fourth, a tritone above the root and a whole tone below 5."},
      {name:"Lydian major",definition:"A major-tonic environment with ♯4 replacing Ionian’s natural 4."},
      {name:"Tritone colour",definition:"The open, suspended instability created between root and ♯4 when harmony supports it."}
    ],
    prerequisites:[
      "Keep a major third audible while another tone is being featured.",
      "Hear ♯4 as a different pitch from 5, not a mistuned one.",
      "Play a major seventh arpeggio from any root."
    ],
    selfCheck:["Can you sing ♯4 after a major triad?","Can you distinguish ♯4 from 5?","Can you preserve major 3 while featuring ♯4?"],
    bassFocus:"Against a major pedal, ♯4 creates wide cinematic colour without forcing dominant resolution. It works well in progressive and psychedelic textures.",
    misconception:"Because ♯4 is a tritone, it is automatically an outside or wrong note.",
    correction:"Over Lydian harmony ♯4 is inside and defining. Context, not the interval’s reputation, determines whether it is structural colour or foreign tension.",
    earCue:"Hear 3–♯4–5 as three whole-tone-connected colours, then compare natural 4 rubbing against 3.",
    transfer:"Build a major pedal line that reveals Lydian in C, D♭ and G without playing seven-note scales.",
    variations:["Sustain ♯4 for two beats.","Resolve ♯4 upward to 5.","Let ♯4 remain unresolved inside a repeated motif."]
  },
  {
    terms:[
      {name:"Flat 7",definition:"Mixolydian’s defining lowered seventh, removing Ionian’s leading tone and creating dominant colour."},
      {name:"Dominant quality",definition:"A major 3rd combined with a minor 7th, producing the core sound of a dominant 7 chord."},
      {name:"Subtonic",definition:"A whole-step-below-root seventh that feels less compelled to resolve than a major 7."}
    ],
    prerequisites:[
      "Hear a major seventh and a ♭7 as different distances above one root.",
      "Play a dominant seventh arpeggio from any root.",
      "Feature one characteristic tone without running the scale."
    ],
    selfCheck:["Can you sing 3 then ♭7 over the same root?","Can you hear ♭7 versus 7?","Can you state dominant quality with only three notes?"],
    bassFocus:"Mixolydian supports rock, funk and dominant vamps because the major 3rd gives clarity while ♭7 supplies grit and loop-friendly stability.",
    misconception:"Every dominant 7 chord requires urgent V→I functional resolution.",
    correction:"A dominant-quality chord can be a static modal home. Listen for whether the harmony moves toward a destination or stays long enough to develop Mixolydian colour.",
    earCue:"Compare 7→1 with ♭7→1. The former pulls tightly; the latter has a broader, rootsier return.",
    transfer:"Build one static Mixolydian groove and one functional dominant line in G, then explain the different treatment of ♭7.",
    variations:["Use 3 and ♭7 as the only non-root tones.","Avoid root on beat 1.","Alternate static and resolving contexts."]
  },
  {
    terms:[
      {name:"Flat 6",definition:"Aeolian’s defining darkening degree, contrasting directly with Dorian’s natural 6."},
      {name:"Natural minor",definition:"The interval collection 1–2–♭3–4–5–♭6–♭7."},
      {name:"Minor subtonic",definition:"The ♭7 that allows broad motion back to 1 without a leading-tone cadence."}
    ],
    prerequisites:[
      "Tell Dorian's natural 6 from a ♭6 by ear.",
      "Hold a minor centre through a complete phrase.",
      "Feature a ♭7 over a major third without the line sounding mistaken."
    ],
    selfCheck:["Can you sing ♭6 after the minor triad?","Can you compare Aeolian and Dorian by one degree?","Can you feature ♭6 without losing the root?"],
    bassFocus:"Aeolian’s ♭6 can define heavy, grunge and cinematic minor lines, especially through 5–♭6 or ♭6–5 gestures over a firm pedal.",
    misconception:"Aeolian is simply ‘sad Dorian’ and should always descend.",
    correction:"The interval pattern offers colour, not a compulsory emotion or contour. Rhythm, register and chord movement determine the musical character.",
    earCue:"Place Dorian 6 and Aeolian ♭6 back to back. Hear how one opens the top of the minor sound and the other compresses it.",
    transfer:"Create Aeolian lines in E, B♭ and C♯ with identical rhythms but different neck routes.",
    variations:["Climb into ♭6 from 5.","Hold ♭6 across a bar line.","Use only 1, ♭3, 5 and ♭6."]
  },
  {
    terms:[
      {name:"Flat 5",definition:"Locrian’s defining diminished fifth, removing the stable perfect 5 above the tonic."},
      {name:"Half-diminished",definition:"The chord 1–♭3–♭5–♭7, commonly written m7♭5."},
      {name:"Unstable tonic",definition:"A centre that can be established even though its tonic chord contains less conventional stability."}
    ],
    prerequisites:[
      "Play a m7♭5 arpeggio from any root.",
      "Hear a ♭5 as a chord tone rather than as a mistake.",
      "Keep a tonal centre audible when the fifth above it is unstable."
    ],
    selfCheck:["Can you spell m7♭5 in three keys?","Can you sing ♭5 without correcting it to 5?","Can you keep 1 audible despite ♭2 and ♭5 pressure?"],
    bassFocus:"Locrian demands disciplined root placement because the perfect 5 is absent. Root, ♭3 and ♭7 establish the shell; ♭2 and ♭5 reveal the mode.",
    misconception:"Locrian cannot have a tonal centre because its tonic triad is diminished.",
    correction:"Its centre is difficult, not impossible. A pedal, repetition, register and phrase endings can establish home while the unstable chord colour remains intentional.",
    earCue:"Hear 1–♭5 as the missing support, then add ♭2 to identify Locrian rather than a generic m7♭5 arpeggio.",
    transfer:"Sustain B as home while building short Locrian phrases, then repeat on F and C♯.",
    variations:["Avoid ♭2 until bar 3.","Use the tonic shell only for two bars.","Resolve ♭5 to 4 instead of 5."]
  },
  {
    terms:[
      {name:"Ostinato",definition:"A repeating rhythmic-pitch pattern that gives the listener a stable reference."},
      {name:"Modal anchor",definition:"A structural note or gesture that preserves home while other colours move around it."},
      {name:"Groove cell",definition:"The smallest repeatable rhythmic idea from which the bassline is developed."}
    ],
    prerequisites:[
      "Make any one of the seven modes recognisable inside four bars.",
      "Control note length and accent without changing pitch.",
      "Land a chord tone on beat 1 at a fixed tempo."
    ],
    selfCheck:["Can you repeat a two-beat rhythm for two minutes?","Can you state chord quality with four pitches?","Can you feature one modal colour without changing the pocket?"],
    bassFocus:"A modal bass groove has two jobs: make the centre physically undeniable and leave enough harmonic space for the defining degree to matter.",
    misconception:"A modal groove is a scale reordered into a bass pattern.",
    correction:"Begin with rhythm and structural tones. Add the characteristic degree only where it strengthens identity and does not weaken the pocket.",
    earCue:"Mute the colour tone mentally. If the groove collapses rhythmically, it was never a strong groove; if the mode disappears, the colour was doing useful work.",
    transfer:"Keep one groove DNA and rewrite only the modal colour for Dorian, Phrygian and Mixolydian.",
    variations:["Maximum four unique pitches.","No fills for eight bars.","Move the colour tone to a different subdivision."]
  },
  {
    terms:[
      {name:"Pitch budget",definition:"A deliberate limit on unique notes used during an improvisation."},
      {name:"Rhythmic vocabulary",definition:"The collection of placements, durations, rests and accents that gives phrases identity."},
      {name:"Register variation",definition:"Changing octave or neck area while preserving core pitch function."}
    ],
    prerequisites:[
      "Build a two-bar groove that states a mode on its own.",
      "Repeat a rhythmic idea without losing the pocket.",
      "Name the four tones that carry a mode's identity."
    ],
    selfCheck:["Can you improvise one minute on one note?","Can you make a phrase answer itself rhythmically?","Can you leave one full beat of silence without losing time?"],
    bassFocus:"Restricted pitch removes the illusion that more notes equal more music. It exposes whether your time, touch, space and phrase shape can carry the line.",
    misconception:"A four-note exercise is beginner work and cannot develop advanced improvisation.",
    correction:"Professional phrasing depends on control under limits. Scarcity makes every rhythmic and dynamic decision audible and measurable.",
    earCue:"Track phrase identity through rhythm first. If the pitches changed but the rhythmic character remained, you should still recognize the idea.",
    transfer:"Use the same four functional degrees in three keys and three registers without adding pitches.",
    variations:["One note for 60 seconds.","At least 35% silence.","Every phrase must begin off beat 1."]
  },
  {
    terms:[
      {name:"Motif",definition:"A short, memorable rhythmic-melodic idea that can be recognized when transformed."},
      {name:"Development",definition:"Creating continuity and change through repetition, displacement, sequence or altered endings."},
      {name:"Sequence",definition:"Repeating an idea from a new pitch level while preserving its internal relationships."}
    ],
    prerequisites:[
      "Improvise for eight bars using four pitches and stay interesting.",
      "Keep a rhythmic identity while the pitches around it change.",
      "Hear when a phrase has arrived home rather than merely stopped."
    ],
    selfCheck:["Can you sing your motif after one play?","Can you repeat its rhythm exactly?","Can you change one element while preserving the rest?"],
    bassFocus:"A clear motif lets bass move from accompaniment into melodic storytelling without abandoning groove. Repetition gives the listener permission to follow variation.",
    misconception:"Development means adding more notes on every repetition.",
    correction:"Change one variable at a time—ending, rhythm, register, direction or harmony—so the source remains perceptible.",
    earCue:"After each variation, ask what stayed constant. If the answer is ‘nothing,’ the phrase is new material, not development.",
    transfer:"Move one three-note motif through three modal contexts while preserving its rhythm and contour.",
    variations:["Alter only the last note.","Shift the rhythm by one eighth note.","Sequence the motif, then return exactly."]
  },
  {
    terms:[
      {name:"Target note",definition:"A chosen structural destination assigned to a specific moment in the bar."},
      {name:"Pickup",definition:"A note or phrase that begins before the main arrival beat and leads into it."},
      {name:"Landing",definition:"The moment a planned destination receives rhythmic and harmonic weight."}
    ],
    prerequisites:[
      "Develop one idea across several phrases instead of starting again.",
      "Land a named chord tone on a named beat.",
      "Return to the groove after leaving it, in time."
    ],
    selfCheck:["Can you count two bars while leaving space?","Can you name the next chord tone before playing the fill?","Can you land on beat 1 without rushing the pickup?"],
    bassFocus:"A bass fill succeeds when it connects sections and strengthens the next downbeat. Virtuosity that obscures the landing weakens the band.",
    misconception:"A fill is a free moment where harmonic responsibility temporarily stops.",
    correction:"The destination matters more during a fill, not less. Choose chord tone, beat and register first; then design the route backward.",
    earCue:"Judge the fill by the arrival. The listener should hear the downbeat as inevitable, not as recovery from excess motion.",
    transfer:"Land on root, 3rd and 7th across four different chord changes using the same pickup length.",
    variations:["Maximum four fill notes.","All fills descend.","Begin the fill one sixteenth later than usual."]
  },
  {
    terms:[
      {name:"Audiation",definition:"Hearing a pitch or phrase internally before producing it."},
      {name:"Retrieval",definition:"Recalling a note location or interval directly instead of reconstructing it by counting."},
      {name:"Transfer",definition:"Demonstrating the same musical understanding in a new key, register or physical route."}
    ],
    prerequisites:[
      "Play a fill and rejoin the groove without a gap.",
      "Name any note on the E and A strings without counting from the open string.",
      "Find a mode's characteristic tone in two registers."
    ],
    selfCheck:["Can you sing a requested degree before touching the bass?","Can you locate one note below fret 5 and above fret 12?","Can you identify a played degree against a drone?"],
    bassFocus:"The goal is one loop: hear function → see several routes → choose the musical register → execute. Any missing link creates hesitation.",
    misconception:"Fast note naming alone proves complete fretboard knowledge.",
    correction:"Real integration includes sound, function and physical choice. A note found quickly but heard incorrectly is not usable improvisational knowledge.",
    earCue:"Do not fish. Sing first, commit to one location, then use the played note as feedback and correct consciously.",
    transfer:"Run the sing–locate–play loop for 3, 6 and ♭7 in all 12 keys over several days.",
    variations:["No visual fretboard.","Frets 12–20 only.","Answer on a named string."]
  },
  {
    terms:[
      {name:"Static harmony",definition:"Harmony that remains on one centre long enough for colour, rhythm and motif to develop."},
      {name:"Pedal point",definition:"A sustained or repeated pitch beneath changing or ambiguous upper harmony."},
      {name:"Harmonic rhythm",definition:"The rate at which chords or harmonic functions change."}
    ],
    prerequisites:[
      "Develop a motif over one chord for sixteen bars.",
      "Play any mode's characteristic tone without hunting for it.",
      "Hear a dominant chord pull toward the chord a fourth above it."
    ],
    selfCheck:["Can you hear one centre through 16 bars?","Can you vary a motif without changing the harmony?","Can you distinguish static dominant colour from V→I motion?"],
    bassFocus:"On a long vamp, endlessly outlining the same chord gets flat. Bass can preserve the centre while using register, colour and rhythmic development to create motion.",
    misconception:"Static harmony means nothing harmonically changes, so any scale note is equally effective.",
    correction:"The chord may stay, but perceived tension changes through degree choice, metric weight, density and motif. Static is an invitation to develop, not to wander.",
    earCue:"Listen for whether a note demands a new chord or simply deepens colour inside the same centre.",
    transfer:"Sustain one groove over 16-bar Dorian, Mixolydian and Lydian vamps, changing only identity degrees.",
    variations:["One pedal tone for four bars.","No root after bar 4.","Increase energy without adding notes."]
  },
  {
    terms:[
      {name:"Diatonic harmony",definition:"Chords built only from the notes belonging to the current modal collection."},
      {name:"Upper structure",definition:"A triad or chord placed above the bass root, creating selected extensions and colours."},
      {name:"Modal chord",definition:"A harmony chosen to expose the mode’s centre and characteristic degree rather than force functional cadence."}
    ],
    prerequisites:[
      "Name the seventh chord built on any degree of a mode.",
      "Move through a mode without treating it as a scale.",
      "Hear a chord's quality from its third and seventh alone."
    ],
    selfCheck:["Can you stack thirds through a seven-note mode?","Can you spell triads without relying on shapes?","Can you name the intervals an upper triad creates over the bass root?"],
    bassFocus:"Holding or returning to the modal root lets upper triads change colour while the bass preserves the larger centre—a powerful tool in progressive and psychedelic writing.",
    misconception:"Every diatonic chord deserves its own separate modal scale during improvisation.",
    correction:"First decide whether the chords decorate one modal home or create functional motion. Track local chord tones without abandoning the larger centre unnecessarily.",
    earCue:"Hear the bass root under each upper structure and name the resulting intervals, not only the triad’s independent chord name.",
    transfer:"Over one D pedal, compare F, G, C and E-minor triads and state the D-relative interval content.",
    variations:["Use triads without their roots.","Keep the bass pedal constant.","Voice-lead one note at a time between upper structures."]
  },
  {
    terms:[
      {name:"Modal context",definition:"One centre developed through sustained colour and relatively slow harmonic movement."},
      {name:"Functional context",definition:"Chords heard as roles that create direction, especially dominant-to-tonic resolution."},
      {name:"Hybrid context",definition:"A larger modal centre containing local chord events with their own temporary gravity."}
    ],
    prerequisites:[
      "Build the diatonic seventh chords of a mode from memory.",
      "Hear when harmony is moving rather than sitting still.",
      "Name a dominant chord's pull by ear."
    ],
    selfCheck:["Can you identify a dominant destination?","Can you hear whether a chord is home or passing?","Can you explain why Dm7 alone differs from Dm7–G7–Cmaj7?"],
    bassFocus:"Choosing the wrong model causes either scale chasing or harmonic vagueness. Bass must know whether to deepen one centre or lead the band through destinations.",
    misconception:"Modal and functional thinking are competing theories; one must be correct for the entire song.",
    correction:"They are listening lenses. A piece can change lenses by section or even combine them when a stable centre contains directed local motion.",
    earCue:"Ask three questions: where is home, how often does harmony change, and does any chord create an unavoidable destination?",
    transfer:"Diagnose ten progressions before touching the bass; then prove each decision using the smallest possible line.",
    variations:["Guide tones only.","One pedal through a hybrid loop.","Explain the lens aloud before every take."]
  },
  {
    terms:[
      {name:"Voice leading",definition:"The path each individual chord tone takes as harmony changes."},
      {name:"Common tone",definition:"A pitch retained between chords, creating maximum continuity."},
      {name:"Destination map",definition:"A pre-heard sequence of structural landing notes across a progression."}
    ],
    prerequisites:[
      "Say whether a passage is modal or functional, and why.",
      "Find the third and seventh of any chord immediately.",
      "Play through a ii–V–I without running scales."
    ],
    selfCheck:["Can you spell 3rds and 7ths of ii–V–I?","Can you hear semitone guide-tone movement?","Can you play the skeleton without accompaniment?"],
    bassFocus:"Root motion tells where chords are; guide-tone motion tells what they are doing. Combining both makes a bassline harmonically articulate without overplaying.",
    misconception:"Smooth voice leading means always choosing the physically nearest fret.",
    correction:"Physical closeness helps, but musical function comes first. Choose the meaningful chord tone, then find the most singable physical route.",
    earCue:"Sing each line through the changes horizontally. If it sounds like a melody without chords, the voice-leading map is probably strong.",
    transfer:"Connect ii–V–I in C, E♭ and F♯ with no leap larger than a major 3rd.",
    variations:["3rds and 7ths only.","One chromatic approach per destination.","No root on any downbeat."]
  },
  {
    terms:[
      {name:"Chromatic approach",definition:"A non-diatonic pitch one semitone above or below a predetermined target."},
      {name:"Leading motion",definition:"Semitone movement whose destination retroactively explains the tension."},
      {name:"Target beat",definition:"The exact metrical position reserved for the stable destination."}
    ],
    prerequisites:[
      "Connect two chords through their nearest shared tones.",
      "Play the guide tones of a ii–V–I without sounding its roots.",
      "Place a note on a chosen beat while keeping time."
    ],
    selfCheck:["Can you name four chord-tone targets instantly?","Can you place ♭2→1 at a steady tempo?","Can you distinguish the approach from its target when listening back?"],
    bassFocus:"A chromatic pickup can drive the entire band into a downbeat. The approach gets energy; the target gets authority.",
    misconception:"Any outside note becomes valid if the following note is inside.",
    correction:"The route must be heard as directed motion. Timing, proximity, articulation and target emphasis determine whether the relationship is convincing.",
    earCue:"Listen backward from the landing. A good target makes the previous chromatic note sound necessary rather than accidental.",
    transfer:"Approach root, 3rd, 5th and 7th from both sides in all keys through the circle of fourths.",
    variations:["Lower approaches only.","Strong-beat approaches with immediate resolution.","Exactly one approach per bar."]
  },
  {
    terms:[
      {name:"Enclosure",definition:"A multi-note approach that surrounds a target from above and below before landing."},
      {name:"Connector",definition:"A chromatic or diatonic path joining two structural notes across time."},
      {name:"Skeleton",definition:"The destination-only line that remains after decorative pitches are removed."}
    ],
    prerequisites:[
      "Approach a chord tone from a semitone above and from below.",
      "Land a target note on a strong beat.",
      "Hear an approach note as separate from the target it leads to."
    ],
    selfCheck:["Can you hear the target before its enclosure?","Can you execute upper–lower–target evenly?","Can you remove decoration and replay only the skeleton?"],
    bassFocus:"Enclosures work best in bass when register and density leave the target readable. Too many low chromatics can muddy harmony rather than intensify it.",
    misconception:"An enclosure is a fixed lick shape placed before any convenient note.",
    correction:"Target function and beat come first. The chosen upper and lower paths are flexible, but their job is always to focus the destination.",
    earCue:"Sing the target through the entire enclosure. If you lose it internally, the listener is likely to lose it too.",
    transfer:"Enclose root, 3rd, 5th and 7th using three route types in three distant keys.",
    variations:["Every third target enclosed.","One diatonic and one chromatic side.","Decorated line followed by skeleton only."]
  },
  {
    terms:[
      {name:"Side-slip",definition:"Temporary displacement of a phrase or collection to a neighbouring tonal level."},
      {name:"Motivic identity",definition:"The rhythm and contour that let a displaced phrase remain recognizable."},
      {name:"Return point",definition:"The planned beat and structural note where the displaced idea reconnects to home."}
    ],
    prerequisites:[
      "Play an enclosure into any chord tone.",
      "Keep a motif recognisable when its pitches move.",
      "Return from outside to a chord tone inside one beat."
    ],
    selfCheck:["Can you repeat a motif exactly?","Can you transpose it one semitone without hesitation?","Can you count the departure length while maintaining groove?"],
    bassFocus:"Side-slipping lets bass create intense colour without abandoning rhythmic responsibility. The band can follow when the groove and motif survive the displacement.",
    misconception:"Playing any chromatic run outside the key is side-slipping.",
    correction:"A side-slip preserves recognizable source material at a clearly displaced level. Without source identity and planned return, it is merely chromatic motion.",
    earCue:"Hear three stages separately: established source, displaced copy, decisive reconnection. Each must be audible.",
    transfer:"Shift one motif +1 and −1 semitone for half a beat, one beat, two beats and one bar.",
    variations:["Preserve rhythm exactly.","Return on a non-root chord tone.","Slip downward instead of upward."]
  },
  {
    terms:[
      {name:"Tension arc",definition:"The planned rise, climax and release of musical pressure across a whole performance."},
      {name:"Tension budget",definition:"A deliberate limit on the amount and duration of harmonic distance used in a phrase or section."},
      {name:"Complete resolution",definition:"A return in harmony, rhythm, register and energy—not merely landing on an inside pitch."}
    ],
    prerequisites:[
      "Displace a whole idea by a semitone and bring it back.",
      "Shape a phrase that leaves home and arrives back deliberately.",
      "Hold a groove while the harmonic distance from home changes."
    ],
    selfCheck:["Can you draw the intended arc before playing?","Can you sustain groove while outside?","Can you explain how register, density and silence alter tension?"],
    bassFocus:"The bassist controls both harmonic floor and energy flow. A low register return, simpler rhythm and more space can release tension more fully than a root note alone.",
    misconception:"The capstone is passed by using every advanced device as often as possible.",
    correction:"Mastery is selective control. The narrative needs contrast: clear home, motivated departure, one true climax and enough time for the return to register.",
    earCue:"Track pressure across sections, not note by note. Ask whether the climax is unique and whether the final eight bars genuinely feel calmer.",
    transfer:"Perform the same planned curve over a static minor vamp, a hybrid progression and an evolving form.",
    variations:["Ten-point tension budget.","At least 25% silence.","One motif must survive every stage of the arc."]
  }
];
