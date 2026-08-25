import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import BassLab from "./BassLab";
import ErrorBoundary from "./ErrorBoundary";
import NodeRuntimeShell from "./NodeRuntimeShell";
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

const root=document.getElementById("root");
if(!root)throw new Error("Bass Lab root element is missing.");

createRoot(root).render(
 <StrictMode>
  <ErrorBoundary><NodeRuntimeShell><BassLab/></NodeRuntimeShell></ErrorBoundary>
 </StrictMode>,
);
