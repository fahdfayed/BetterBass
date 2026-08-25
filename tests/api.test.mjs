import assert from "node:assert/strict";
import {mkdtemp,mkdir,readFile,rm,writeFile} from "node:fs/promises";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {createBassLabApp} from "../server/app.mjs";

async function fixture(){
 const root=await mkdtemp(join(tmpdir(),"basslab-node-")),client=join(root,"client");await mkdir(client);await writeFile(join(client,"index.html"),"<!doctype html><title>Bass Lab</title><div id=\"root\"></div>");
 const app=await createBassLabApp({dataFile:join(root,"learners.json"),clientDir:client}),server=createServer(app);await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const address=server.address(),base=`http://127.0.0.1:${address.port}`;
 return {base,close:async()=>{await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));await rm(root,{recursive:true,force:true})}};
}

test("Node API persists learner state and analyzes practice sessions",async()=>{
 const running=await fixture();
 try{
  const health=await fetch(`${running.base}/api/v1/health`).then(response=>response.json());assert.equal(health.ok,true);assert.equal(health.runtime,"node-express");
  const learner="learner_test_001";
  const empty=await fetch(`${running.base}/api/v1/state/${learner}`).then(response=>response.json());assert.deepEqual(empty.records,{});
  const savedResponse=await fetch(`${running.base}/api/v1/state/${learner}`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({records:{"basslab-course":JSON.stringify({index:7,step:3,completed:6})}})});assert.equal(savedResponse.status,200);
  const saved=await fetch(`${running.base}/api/v1/state/${learner}`).then(response=>response.json());assert.equal(JSON.parse(saved.records["basslab-course"]).completed,6);
  const events=[
   {start:0,end:300,offset:8,tension:1,fn:"CHORD",resolution:"—"},
   {start:400,end:700,offset:-12,tension:4,fn:"OUTSIDE",resolution:"recovered"},
   {start:800,end:1100,offset:10,tension:0,fn:"ROOT",resolution:"—"},
  ];
  const first=await fetch(`${running.base}/api/v1/sessions/${learner}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId:"take_test_001",source:"test",events})});assert.equal(first.status,201);const firstBody=await first.json();assert.equal(firstBody.session.analysis.noteCount,3);assert.equal(firstBody.session.analysis.insidePercent,67);assert.equal(firstBody.session.analysis.resolutionRate,100);
  const duplicate=await fetch(`${running.base}/api/v1/sessions/${learner}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId:"take_test_001",source:"test",events})});assert.equal(duplicate.status,200);assert.equal((await duplicate.json()).created,false);
  const sessions=await fetch(`${running.base}/api/v1/sessions/${learner}`).then(response=>response.json());assert.equal(sessions.sessions.length,1);
  const invalid=await fetch(`${running.base}/api/v1/state/${learner}`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({records:{"not-allowed":"value"}})});assert.equal(invalid.status,400);
  const spa=await fetch(`${running.base}/theory/reference`);assert.equal(spa.status,200);assert.match(await spa.text(),/Bass Lab/);
  assert.equal((await fetch(`${running.base}/`,{method:"HEAD"})).status,200);
  assert.equal((await fetch(`${running.base}/missing.js`)).status,404);
 }finally{await running.close()}
});

test("development runtime loads the repository Vite configuration",async()=>{
 const root=await mkdtemp(join(tmpdir(),"basslab-vite-"));
 const app=await createBassLabApp({dev:true,dataFile:join(root,"learners.json")});
 try{assert.equal(typeof app.locals.closeRuntime,"function")}
 finally{await app.locals.closeRuntime?.();await rm(root,{recursive:true,force:true})}
});

test("Vercel root entrypoint exports the API without starting a listener",async()=>{
 const source=await readFile(new URL("../server.mjs",import.meta.url),"utf8");assert.match(source,/import express from ["']express["']/);
 const {default:app}=await import("../server.mjs");assert.equal(typeof app,"function");
 const server=createServer(app);await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const address=server.address();
 try{const health=await fetch(`http://127.0.0.1:${address.port}/api/v1/health`).then(response=>response.json());assert.equal(health.ok,true);assert.equal(health.runtime,"node-express")}
 finally{await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()))}
});
