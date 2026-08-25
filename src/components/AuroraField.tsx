/**
 * Ambient background. Purely decorative and inert — all motion lives in CSS
 * keyframes on the compositor, so it costs the main thread nothing while the
 * pitch detector is running.
 */
export default function AuroraField(){
 return (
  <div className="auroraField" aria-hidden="true">
   <div className="auroraBody a"/>
   <div className="auroraBody b"/>
   <div className="auroraBody c"/>
   <div className="auroraVeil"/>
  </div>
 );
}
