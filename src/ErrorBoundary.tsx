import {Component,type ErrorInfo,type ReactNode} from "react";

type Props={children:ReactNode};
type State={error:Error|null};

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

 static getDerivedStateFromError(error:Error):State{return {error}}

 componentDidCatch(error:Error,info:ErrorInfo){console.error("Bass Lab render error:",error,info.componentStack)}

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
    <span>Bass lab</span>
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
