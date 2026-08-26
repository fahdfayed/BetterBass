import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";
import {alphaTab} from "@coderline/alphatab-vite";

const vercelBuild=process.env.VERCEL==="1";

export default defineConfig({
 // alphaTab spawns a WebWorker for layout and an AudioWorklet for playback, and
 // ships its own music font and soundfont. Its plugin wires those up so the
 // bundler does not have to be told about each one.
 plugins:[react(),alphaTab()],
 // alphaTab's core reads import.meta.url to find its own assets, which is not
 // valid in the iife workers vite builds by default — and the plugin crashes
 // while reporting that rather than reporting it. ES workers keep it legal.
 worker:{format:"es"},
 publicDir:vercelBuild?false:"public",
 build:{
  outDir:vercelBuild?"public":"dist/client",
  emptyOutDir:!vercelBuild,
  target:"es2022",
 },
 server:{host:"0.0.0.0"},
});
