import express from "express";
import {access} from "node:fs/promises";
import {extname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {JsonLearnerStore,validateLearnerId,validateRecords} from "./store.mjs";

const projectRoot=fileURLToPath(new URL("..",import.meta.url));
const fail=(res,status,message)=>res.status(status).json({ok:false,error:message});

export async function createBassLabApp({dataFile=resolve(projectRoot,".data/learners.json"),clientDir=resolve(projectRoot,"dist/client"),dev=false,trustProxy=false,serveClient=true,expressApp}={}){
 const app=expressApp??express(),store=new JsonLearnerStore(dataFile);
 app.disable("x-powered-by");if(trustProxy)app.set("trust proxy",1);
 app.use((req,res,next)=>{res.set({"X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"microphone=(self), camera=(), geolocation=()"});next()});
 app.use(express.json({limit:"3mb",type:["application/json","application/*+json"]}));

 app.get("/api/v1/health",(req,res)=>res.json({ok:true,service:"outside-in-bass-lab",runtime:"node-express",apiVersion:1,time:new Date().toISOString()}));
 app.get("/api/v1/config",(req,res)=>res.json({ok:true,persistence:"anonymous-learner",audioProcessing:"browser",maximumSavedSessions:250}));
 app.get("/api/v1/state/:learnerId",async(req,res)=>{const {learnerId}=req.params;if(!validateLearnerId(learnerId))return fail(res,400,"Invalid learner identifier");return res.json(await store.getState(learnerId))});
 const saveState=async(req,res)=>{const {learnerId}=req.params;if(!validateLearnerId(learnerId))return fail(res,400,"Invalid learner identifier");const problem=validateRecords(req.body?.records);if(problem)return fail(res,400,problem);return res.json({ok:true,...await store.putState(learnerId,req.body.records)})};
 app.route("/api/v1/state/:learnerId").put(saveState).post(saveState);
 app.post("/api/v1/sessions/:learnerId",async(req,res)=>{const {learnerId}=req.params;if(!validateLearnerId(learnerId))return fail(res,400,"Invalid learner identifier");const {sessionId,source,context,events}=req.body??{};if(typeof sessionId!=="string"||!/^[A-Za-z0-9_-]{8,120}$/.test(sessionId))return fail(res,400,"Invalid session identifier");if(source!==undefined&&(typeof source!=="string"||source.length>80))return fail(res,400,"Invalid session source");if(context!==undefined&&(!context||typeof context!=="object"||Array.isArray(context)))return fail(res,400,"context must be an object");if(!Array.isArray(events)||events.length>5000)return fail(res,400,"events must be an array with at most 5000 entries");const result=await store.appendSession(learnerId,{sessionId,source,context,events});return res.status(result.created?201:200).json({ok:true,...result})});
 app.get("/api/v1/sessions/:learnerId",async(req,res)=>{const {learnerId}=req.params;if(!validateLearnerId(learnerId))return fail(res,400,"Invalid learner identifier");const limit=Number.parseInt(String(req.query.limit??25),10);return res.json({ok:true,learnerId,sessions:await store.getSessions(learnerId,Number.isFinite(limit)?limit:25)})});
 app.use("/api",(req,res)=>fail(res,404,"API route not found"));

 if(dev){const {createServer}=await import("vite");const vite=await createServer({configFile:resolve(projectRoot,"vite.config.ts"),server:{middlewareMode:true},appType:"spa"});app.locals.closeRuntime=()=>vite.close();app.use(vite.middlewares)}
 else if(serveClient){const indexFile=resolve(clientDir,"index.html");await access(indexFile);app.use(express.static(clientDir,{index:false,maxAge:"1h",setHeaders:(res,path)=>{if(/\/assets\/.*\.[A-Za-z0-9]{8,}\./.test(path))res.setHeader("Cache-Control","public, max-age=31536000, immutable")}}));app.use((req,res,next)=>{if((req.method==="GET"||req.method==="HEAD")&&extname(req.path)===""&&req.accepts("html")){res.setHeader("Cache-Control","no-store");return res.sendFile(indexFile)}return next()})}

 app.use((error,req,res,next)=>{if(res.headersSent)return next(error);const status=error?.type==="entity.too.large"?413:error?.status??500;return fail(res,status,status===500?"Unexpected server error":error.message)});
 app.locals.store=store;return app;
}
