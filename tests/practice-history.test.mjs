import assert from "node:assert/strict";
import test from "node:test";
import {fetchPracticeHistory,trendOf} from "../src/practice-history.ts";

/**
 * The read side of the practice loop.
 *
 * Every recorded take is posted, analysed on the server and stored. This is
 * what reads it back, and the thing it must never do is take the progress page
 * down because a request failed — a history that cannot load is an empty
 * section, not a broken page.
 */

const take=(over={})=>({
 sessionId:`s${Math.random().toString(36).slice(2)}`,
 createdAt:new Date().toISOString(),
 analysis:{noteCount:12,durationMs:8000,averageGridOffsetMs:20,timingScore:80,
           insidePercent:70,outsideCount:2,resolutionRate:50,functionCounts:{},...over},
});
const scored=(...scores)=>scores.map(timingScore=>take({timingScore}));

/** Stand in for the browser globals the module reads, for one call. */
function withBrowser({learner="learner-1",fetch},run){
 const saved={window:globalThis.window,localStorage:globalThis.localStorage,fetch:globalThis.fetch};
 globalThis.window={};
 globalThis.localStorage={getItem:key=>key==="basslab-node-learner-id"?learner:null};
 globalThis.fetch=fetch;
 return run().finally(()=>Object.assign(globalThis,saved));
}

const respond=body=>async()=>new Response(JSON.stringify(body),
 {status:200,headers:{"content-type":"application/json"}});

test("a trend needs enough takes to be a trend",()=>{
 const read=a=>a.timingScore;
 // Two numbers are a pair, not a direction; saying someone improved on that
 // evidence would be a guess dressed as a measurement.
 assert.equal(trendOf([],read),null);
 assert.equal(trendOf(scored(80),read),null);
 assert.equal(trendOf(scored(80,90),read),null);
 assert.equal(trendOf(scored(80,90,70),read),null,"three is still not enough");

 // Newest first: the latest pair against the pair before it.
 assert.equal(trendOf(scored(90,80,70,60),read),20);
 assert.equal(trendOf(scored(60,70,80,90),read),-20,"getting worse reads as negative");
 assert.equal(trendOf(scored(70,70,70,70),read),0,"no change is zero, not null");

 // Only the four most recent count, however long the history runs.
 assert.equal(trendOf(scored(90,80,70,60,10,10,10),read),20);
});

test("a history that cannot load is an empty section, not an exception",async()=>{
 for(const [name,fetchImpl] of [
  ["the network refuses",async()=>{throw new TypeError("offline")}],
  ["the server errors",async()=>new Response("nope",{status:500})],
  ["the body is not JSON",async()=>new Response("<html>",{status:200})],
  ["sessions is not a list",respond({ok:true,sessions:"nope"})],
  ["there is no sessions field",respond({ok:true})],
 ]){
  const result=await withBrowser({fetch:fetchImpl},()=>fetchPracticeHistory());
  assert.deepEqual(result,[],`${name}: should come back empty`);
 }

 // No learner yet means nothing has been recorded, and no request to make.
 let called=false;
 const none=await withBrowser({learner:null,fetch:async()=>{called=true;return new Response("{}")}},
  ()=>fetchPracticeHistory());
 assert.deepEqual(none,[]);
 assert.equal(called,false,"a learnerless visitor should not hit the API at all");
});

test("only sessions carrying a real analysis are shown",async()=>{
 const good=take({timingScore:91});
 const sessions=await withBrowser({fetch:respond({ok:true,sessions:[
  null,
  "a string",
  {sessionId:"no analysis",createdAt:new Date().toISOString()},
  {sessionId:"no date",analysis:{timingScore:5}},
  {sessionId:"score is not a number",createdAt:new Date().toISOString(),analysis:{timingScore:"80"}},
  good,
 ]})},()=>fetchPracticeHistory());

 assert.equal(sessions.length,1,"the five malformed entries should be dropped");
 assert.equal(sessions[0].sessionId,good.sessionId);
 assert.equal(sessions[0].analysis.timingScore,91);
});

test("the request asks for the number of takes it was given",async()=>{
 let asked="";
 await withBrowser({learner:"abc def",fetch:async url=>{
  asked=String(url);
  return new Response(JSON.stringify({sessions:[]}),{status:200});
 }},()=>fetchPracticeHistory(3));
 assert.match(asked,/limit=3/);
 assert.match(asked,/sessions\/abc%20def/,"the learner id has to be encoded into the path");
});
