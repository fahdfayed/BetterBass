export type TechniqueRule={name:string;detail:string};
export type TechniqueArea={
 id:string;
 n:string;
 title:string;
 aim:string;
 core:string;
 rules:TechniqueRule[];
 /** What it looks like when it is going wrong. */
 trap:string;
 /** How you know it is right without anybody watching. */
 proof:string;
};

/**
 * The half of playing this site never covered.
 *
 * Eighteen theory domains, a course, an ear ladder, a chromatic gym — and
 * nothing anywhere about the two hands. The only technique content was a
 * six-line injury checklist inside one practice page, which a player never
 * sees unless they happen to open the Beast passages.
 *
 * This is deliberately not a theory domain. Theory is what to play and this is
 * whether you can play it without hurting yourself, and a player whose hand
 * cramps at the fifth fret is not helped by another chord formula.
 */
export const TECHNIQUE_AREAS:TechniqueArea[]=[
 {
  id:"health",n:"01",title:"Ergonomics, tension and the stop signs",
  aim:"Set the instrument up so the hands can work, and know when to stop.",
  core:"Almost every technical problem that looks like weakness is actually tension, and almost every "+
       "injury is tension repeated. The instrument should be positioned so that both hands reach their "+
       "work without the wrists bending sharply, and the effort of playing should come from the arms and "+
       "back rather than from gripping.",
  rules:[
   {name:"One height, sitting and standing",
    detail:"Set the strap so the bass sits in the same place whether you sit or stand. If the two "+
           "differ, you are practising one instrument and performing on another."},
   {name:"The neck goes up, not across",
    detail:"Angling the headstock upward brings the left hand toward the body and lets the wrist "+
           "straighten. A neck held horizontally forces the wrist to bend to reach the lower frets."},
   {name:"Straight wrists carry load",
    detail:"A bent wrist under tension is where injuries start. Both wrists should be close to "+
           "neutral at rest and never sharply flexed while playing."},
   {name:"Minimum pressure",
    detail:"Fret a note, then release until it buzzes, then add back only what stops the buzz. That "+
           "is how hard the note actually needs to be pressed, and it is far less than most players use."},
   {name:"Effort belongs to the big muscles",
    detail:"Fingers position; the arm and back support. If your forearm is burning after a few "+
           "minutes, the small muscles are doing work the large ones should be doing."},
  ],
  trap:"Playing through a warning. Pain, tingling, numbness or a hand that will not open properly "+
       "afterwards are not signs of a hard session; they are signs to stop that session.",
  proof:"You can play for twenty minutes and your hands feel the same at the end as at the start.",
 },
 {
  id:"left",n:"02",title:"The left hand: position, pressure and muting",
  aim:"Reach four frets without collapsing, and silence everything you are not playing.",
  core:"Two left-hand positions cover almost everything. One finger per fret gives each finger its "+
       "own fret and works comfortably from about the fifth fret upward. Lower down the frets are "+
       "wider, and reaching four of them strains the hand. There the older position, using the first, "+
       "second and fourth fingers for three frets, is the safer choice. Knowing which one you are in is "+
       "more useful than insisting on either.",
  rules:[
   {name:"One finger per fret, above the fifth",
    detail:"Each finger takes one fret and the hand does not move. This is the position the finger "+
           "permutation drills are written in, and it is where independence is built."},
   {name:"First, second and fourth, below the fifth",
    detail:"Three frets covered by three fingers, with the third finger supporting the fourth. It "+
           "gives up a fret of reach and removes the stretch that causes most low-position pain."},
   {name:"Thumb behind, roughly opposite the second finger",
    detail:"Flat on the back of the neck rather than hooked over the top. A thumb over the top "+
           "locks the wrist and takes the fourth finger out of play."},
   {name:"Fingers stay near the string",
    detail:"A finger that lifts an inch has an inch to travel back. Keeping unused fingers hovering "+
           "close is most of what looks like speed."},
   {name:"The hand mutes what it is not playing",
    detail:"Fingers lying lightly across the strings above the one sounding stop them ringing. On "+
           "bass this is not tidiness. Undamped strings turn any line into a chord."},
  ],
  trap:"Squeezing harder when a passage gets difficult. It makes the hand slower, not more accurate, "+
       "and it is the single most common cause of a fourth finger that will not work.",
  proof:"You can play the twenty-four finger orders at one position with no buzz, no hand movement, "+
        "and no ringing from strings you are not on.",
 },
 {
  id:"right",n:"03",title:"The right hand: alternation, thumb and tone",
  aim:"Make every note sound the same, whichever finger and whichever string played it.",
  core:"The plucking hand decides tone, dynamics and. More than most players expect, time. Its "+
       "job is consistency: two fingers alternating strictly, each producing the same volume and the "+
       "same tone, on every string. Where you pluck changes the sound more than any tone control does, "+
       "so it is worth choosing rather than inheriting.",
  rules:[
   {name:"Strict alternation before anything else",
    detail:"Index, middle, index, middle, with no doubling. Raking across strings with one finger is "+
           "useful later and hides an unreliable alternation if learned first."},
   {name:"The thumb follows the played string",
    detail:"Resting the thumb on the string above whichever one you are playing mutes it and gives "+
           "the hand a consistent reference. A thumb anchored on the pickup mutes nothing."},
   {name:"Pluck through, not at",
    detail:"The finger comes to rest against the next string rather than pulling away from the "+
           "instrument. This gives an even tone and stops the string being pulled sideways."},
   {name:"Position chooses tone",
    detail:"Near the bridge is tighter and more articulate; over the neck is rounder and louder in "+
           "the low end. Pick one for the part rather than playing wherever the hand landed."},
   {name:"Both fingers sound alike",
    detail:"The middle finger is longer, so unattended it plays louder and later. Evening the two is "+
           "worth more practice time than raw speed."},
  ],
  trap:"An anchored thumb and a hand that only ever plays one string. The moment the line crosses "+
       "strings, the muting disappears and the alternation breaks.",
  proof:"Someone listening cannot tell which finger played which note, or which string a note was on "+
        "except by pitch.",
 },
 {
  id:"shift",n:"04",title:"Shifting: moving the hand on purpose",
  aim:"Arrive in a new position already in shape, without looking.",
  core:"The hand has to travel, and the useful skill is not stretching further but moving cleanly. A "+
       "shift is a measured distance made during a moment the music allows, and it is planned before "+
       "it happens: you decide which note ends the old position and which begins the new one.",
  rules:[
   {name:"Release the thumb first",
    detail:"The thumb leads the hand rather than being dragged after it. A thumb that stays put "+
           "turns a shift into a stretch."},
   {name:"Move during a long note or a rest",
    detail:"Shifts are almost free when they happen where the music is already still. Placing them "+
           "on a busy beat is what makes them audible."},
   {name:"Measure from a note you can hear",
    detail:"Know the interval you are moving, not the number of frets. The ear checks arrival faster "+
           "than the eye does."},
   {name:"Land in shape",
    detail:"Every finger arrives over its own fret at once. Reaching for the first note and letting "+
           "the rest follow is what makes the next three notes late."},
   {name:"Guide with the finger already down",
    detail:"Where a shift keeps the same finger, let it stay in light contact with the string as it "+
           "moves. It arrives more accurately than a finger travelling through the air."},
  ],
  trap:"Watching the hand. Anything you can only play while looking at the neck is not yet learned, "+
       "and the eyes will be needed for a chart soon enough.",
  proof:"You can shift by one, two, three, five and seven frets, eyes closed, and land in tune.",
 },
 {
  id:"practice",n:"05",title:"How to practise so it changes something",
  aim:"Spend the time in a way that produces a different player, not a warmer one.",
  core:"Repetition alone does not build skill; it makes whatever you are already doing more "+
       "automatic, including the faults. Practice that works has a single point of attention, a tempo "+
       "slow enough for that attention to be paid, and an honest way of knowing whether the rep was "+
       "good, and it stops the moment the attention goes.",
  rules:[
   {name:"One thing at a time, in rotation",
    detail:"Attend to one variable per pass. Pressure, then tone, then time, then muting. Trying to "+
           "watch everything means watching nothing, and rotating through them covers the ground "+
           "without splitting the attention."},
   {name:"Slow enough to be correct, not slow as a ritual",
    detail:"The right tempo is the fastest one at which you can still notice what you are doing. "+
           "Below that you are wasting time; above it you are rehearsing the fault."},
   {name:"A rep only counts if it was good",
    detail:"Count correct repetitions, not minutes. Ten deliberate reps change more than an hour of "+
           "playing something almost right."},
   {name:"Replace a habit, do not suppress it",
    detail:"An ingrained fault will not go by being told off. Decide the specific movement that "+
           "replaces it and practise that movement slowly enough to choose it every time."},
   {name:"Stop before it degrades",
    detail:"When attention goes, the reps start reinforcing the fault. Ending a session early with "+
           "everything correct is a better outcome than finishing the plan badly."},
  ],
  trap:"Playing what you can already play. It is the most enjoyable part of the session and the part "+
       "that changes least.",
  proof:"You can say what a session was for, and what was different at the end of it.",
 },
];
