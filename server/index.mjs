import {createServer} from "node:http";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createBassLabApp} from "./app.mjs";

const projectRoot=fileURLToPath(new URL("..",import.meta.url));
const dev=process.argv.includes("--dev"),port=Number.parseInt(process.env.PORT??"3000",10),host=process.env.HOST??"0.0.0.0";
if(!Number.isInteger(port)||port<1||port>65535)throw new Error("PORT must be an integer from 1 to 65535");
const app=await createBassLabApp({dev,dataFile:resolve(process.env.BASSLAB_DATA_FILE??resolve(projectRoot,".data/learners.json")),clientDir:resolve(process.env.BASSLAB_CLIENT_DIR??resolve(projectRoot,"dist/client")),trustProxy:process.env.TRUST_PROXY==="1"});
const server=createServer(app);
server.listen(port,host,()=>console.log(`Outside In Bass Lab · Node/Express · http://${host}:${port}`));
const shutdown=()=>server.close(async()=>{await app.locals.closeRuntime?.();process.exit(0)});
process.once("SIGINT",shutdown);process.once("SIGTERM",shutdown);
