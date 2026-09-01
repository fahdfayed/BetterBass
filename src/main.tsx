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
import "./styles/lithos.css";

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
import "./styles/shell.css";
import "./styles/home.css";
import "./styles/game.css";
import "./styles/lesson.css";
import "./styles/lesson-content.css";
import "./styles/library.css";
import "./styles/tab.css";
import "./styles/legacy-bridge.css";

// Last of all: repoints the legacy custom properties at the new language.
// Custom properties cascade on definition, so this must win.
import "./styles/legacy-tokens.css";
import "./styles/legacy-views.css";

/* Last, because the workstation re-composes the shell those files assume. */
import "./styles/workstation.css";
import "./styles/fretboard-workstation.css";

/* Last: it re-times everything above it from the live clock. */
import "./styles/stand.css";
import "./styles/intime.css";
import "./styles/dock-tabs.css";
import "./styles/container-scroll.css";
import "./styles/score.css";

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
