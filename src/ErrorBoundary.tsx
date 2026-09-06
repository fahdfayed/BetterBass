import {Component,type ErrorInfo,type ReactNode} from "react";
import {ROUTE_EVENT} from "./router";

type Props={children:ReactNode};
type State={error:Error|null};

/**
 * Where the failure happened.
 *
 * A boundary that never clears turns one bad screen into a broken session: the
 * error state outlives the page that caused it, so every route the reader opens
 * afterwards shows the same crash until they reload by hand. That is how a
 * single lazy chunk failing to arrive — a flaky connection, a deploy landing
 * mid-visit — took out a dozen pages that were fine.
 *
 * Navigating away is the reader saying "not that, then". The boundary lets go
 * when the address changes, and stays put when it has not, so the crash screen
 * for the route you are actually on does not flicker back into a retry loop.
 */

const SAVED_KEYS=[
 "basslab-adaptive",
 "basslab-course",
 "basslab-last-take",
 "basslab-beast",
 "basslab-performance-coach-v1",
 "slaplab-passes",
];

/**
 * Without this, one bad render — most often saved progress that no longer
 * matches the shape the code expects — unmounts the whole tree and leaves a
 * blank page with no way back. The reset offers the escape hatch, because the
 * saved state is exactly what a reload would restore.
 */
export default class ErrorBoundary extends Component<Props,State>{
 state:State={error:null};
 /** The address the error belongs to, so leaving it is what clears it. */
 private brokenAt="";

 static getDerivedStateFromError(error:Error):State{return {error}}

 componentDidCatch(error:Error,info:ErrorInfo){
  this.brokenAt=typeof window==="undefined"?"":window.location.pathname;
  console.error("Bass Lab render error:",error,info.componentStack);
 }

 componentDidMount(){
  window.addEventListener(ROUTE_EVENT,this.onRoute);
  window.addEventListener("popstate",this.onRoute);
 }

 componentWillUnmount(){
  window.removeEventListener(ROUTE_EVENT,this.onRoute);
  window.removeEventListener("popstate",this.onRoute);
 }

 private onRoute=()=>{
  if(!this.state.error)return;
  if(window.location.pathname===this.brokenAt)return;
  this.setState({error:null});
 };

 private reload=()=>{this.setState({error:null});window.location.reload()};

 private resetProgress=()=>{
  try{SAVED_KEYS.forEach(key=>window.localStorage.removeItem(key))}catch{/* storage may be unavailable; the reload is still worth trying */}
  this.reload();
 };

 render(){
  const {error}=this.state;
  if(!error)return this.props.children;
  return (
   <main className="appCrash" role="alert">
    <h1>Something in the interface stopped responding.</h1>
    <p>Your practice history is stored in this browser and is still there. Reloading fixes most cases; if the same screen returns, clearing the saved progress for this site will get you back in.</p>
    <pre>{error.message}</pre>
    <div className="appCrashActions">
     <button type="button" onClick={this.reload}>Reload the page</button>
     <button type="button" className="secondary" onClick={this.resetProgress}>Clear saved progress and reload</button>
    </div>
   </main>
  );
 }
}
