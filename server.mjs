import express from "express";
import {createBassLabApp} from "./server/app.mjs";

// Vercel looks for a root entrypoint and invokes the exported Express app as a
// serverless function. Static Vite output is emitted into public/ at build time
// and served by Vercel's CDN, so this instance owns only the Node API.
const app=await createBassLabApp({
 expressApp:express(),
 dataFile:process.env.BASSLAB_DATA_FILE??"/tmp/outside-in-bass/learners.json",
 trustProxy:true,
 serveClient:false,
});

export default app;
