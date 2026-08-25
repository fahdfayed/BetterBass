import express from "express";
import {fileURLToPath} from "node:url";
import {createBassLabApp} from "./server/app.mjs";

// Vercel looks for a root entrypoint and invokes the exported Express app as a
// serverless function. Vite emits the client into public/ on Vercel; the same
// files are included with the function so Express can serve the SPA fallback.
const clientDir=fileURLToPath(new URL(process.env.VERCEL==="1"?"./public":"./dist/client",import.meta.url));
const app=await createBassLabApp({
 expressApp:express(),
 dataFile:process.env.BASSLAB_DATA_FILE??"/tmp/outside-in-bass/learners.json",
 clientDir,
 trustProxy:true,
 serveClient:true,
});

export default app;
