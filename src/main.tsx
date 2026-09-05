import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {TransportProvider} from "./useTransport";
import {startConductor} from "./conductor";
import {startReveals} from "./reveal";
import BassLab from "./BassLab";
import ErrorBoundary from "./ErrorBoundary";
import NodeRuntimeShell from "./NodeRuntimeShell";
import {initTheme} from "./theme";

// Design tokens first: every sheet below reads these custom properties.
import "./styles/fonts.css";
import "./styles/tokens.css";

// Original stylesheets, still serving the views that have not been rebuilt yet.
// Each one is deleted as its view migrates to the new system.
import "./globals.css";
import "./engine.css";
import "./runtime.css";
import "./adaptive.css";
import "./labs.css";
import "./course.css";
import "./harmony-fretboard.css";
import "./beast.css";
import "./beast-extra.css";
import "./performance.css";
import "./maqam.css";
import "./slap.css";
import "./node-runtime.css";
import "./redesign.css";

// The new system loads last so it wins wherever the two overlap.
import "./styles/base.css";
import "./styles/motion.css";
import "./styles/transitions.css";

/*
 * The material vocabulary, after the reset rather than before it.
 *
 * base.css is a reset plus a handful of primitives, and several of those
 * primitives still carry the shape decisions of the world this replaces —
 * a pill radius on the primary action, a pill scrollbar thumb. Loaded first,
 * manuscript.css lost every one of those collisions and the committing button
 * came out fully rounded on a page whose whole rule is that it is not.
 */
import "./styles/manuscript.css";
import "./styles/book.css";
import "./styles/home.css";
import "./styles/game.css";
import "./styles/lesson.css";
import "./styles/lesson-content.css";

// The lesson stacked: brief, task strip, instrument at full page width. After
// lesson.css, which it replaces the split half of.
import "./styles/lesson-stack.css";
import "./styles/library.css";
import "./styles/tab.css";
import "./styles/legacy-bridge.css";

// Last of all: repoints the legacy custom properties at the new language.
// Custom properties cascade on definition, so this must win.
import "./styles/legacy-tokens.css";
import "./styles/legacy-views.css";

/* After the legacy sheets, because it re-composes what they assume. */
import "./styles/composition.css";
import "./styles/fretboard-workstation.css";

/* The transport strip and the page voice, then the live clock that re-times
   everything above it. */
import "./styles/transport.css";
import "./styles/intime.css";
import "./styles/container-scroll.css";
import "./styles/score.css";
import "./styles/score-integration.css";

/* The practice session as one fascia; structure only, the palette is unchanged. */
import "./styles/practice-fascia.css";

/* The instrument labs, each given the same treatment against its own structure. */
import "./styles/lab-slap.css";
import "./styles/home-book.css";

// The bound spread: the binding a split workspace opens at and the index cut
// into the fore-edge. After lesson.css, which sets the grid it draws the fold
// into.
import "./styles/spread.css";

// The leaf that goes over. After spread.css, because the turn is drawn against
// the fold the spread establishes.
import "./styles/page-turn.css";

// Audit corrections are intentionally last: they resolve cross-generation
// cascade collisions without introducing another visual language.
import "./styles/ui-audit.css";

// The two pieces of chrome that live outside the book: the voice switch in the
// head of the page, and the sync state out on the stand.
import "./styles/chrome.css";

// Marks that scripting is available, so motion.css can hide reveal targets. If
// this never runs the content stays visible rather than invisible.
document.documentElement.classList.add("js");

// Ground is chosen before the first paint, so the page never flashes.
initTheme();

const root=document.getElementById("root");
if(!root)throw new Error("Bass Lab root element is missing.");

createRoot(root).render(
 <StrictMode>
  <ErrorBoundary><TransportProvider><NodeRuntimeShell><BassLab/></NodeRuntimeShell></TransportProvider></ErrorBoundary>
 </StrictMode>,
);

/*
 * After the first render, so the observer has something to watch. Nothing is
 * hidden until this runs, which is what keeps a failure here from emptying the
 * page rather than merely leaving it still.
 */
startConductor();
startReveals();
