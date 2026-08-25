import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import BassLab from "./BassLab";
import ErrorBoundary from "./ErrorBoundary";
import NodeRuntimeShell from "./NodeRuntimeShell";

// Design tokens first: every sheet below reads these custom properties.
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
import "./egyptian-arabic.css";
import "./node-runtime.css";
import "./redesign.css";

// The new system loads last so it wins wherever the two overlap.
import "./styles/base.css";
import "./styles/aurora.css";
import "./styles/motion.css";
import "./styles/shell.css";
import "./styles/home.css";
import "./styles/legacy-bridge.css";

// Marks that scripting is available, so motion.css can hide reveal targets. If
// this never runs the content stays visible rather than invisible.
document.documentElement.classList.add("js");

const root=document.getElementById("root");
if(!root)throw new Error("Bass Lab root element is missing.");

createRoot(root).render(
 <StrictMode>
  <ErrorBoundary><NodeRuntimeShell><BassLab/></NodeRuntimeShell></ErrorBoundary>
 </StrictMode>,
);
