import {toggleTheme,useTheme} from "../theme";

/** Switches the ground between the dark studio default and cream. */
export default function ThemeToggle(){
 const theme=useTheme();
 const cream=theme==="cream";
 return (
  <button
   className="themeToggle"
   onClick={toggleTheme}
   role="switch"
   aria-checked={cream}
   aria-label={cream?"Switch to the dark ground":"Switch to the cream ground"}
   title={cream?"Dark":"Cream"}
  >
   <span className="themeTrack" aria-hidden="true"><i/></span>
   <span className="themeName" data-no-translate>{cream?"Cream":"Dark"}</span>
  </button>
 );
}
