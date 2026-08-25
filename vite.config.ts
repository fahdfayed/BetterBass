import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

const vercelBuild=process.env.VERCEL==="1";

export default defineConfig({
 plugins:[react()],
 publicDir:vercelBuild?false:"public",
 build:{
  outDir:vercelBuild?"public":"dist/client",
  emptyOutDir:!vercelBuild,
  target:"es2022",
 },
 server:{host:"0.0.0.0"},
});
