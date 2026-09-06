import {createContext,useContext,type ReactNode} from "react";
import {createPortal} from "react-dom";

/**
 * The left page.
 *
 * The book is bound, so there are two pages open at once: the right page is
 * the work, and the left page is what the work sits inside — which section of
 * the book you have opened to, what is in it, where you are in it, and the
 * note you left yourself at the foot.
 *
 * Any route can print its own left page by rendering <PageLeaf> anywhere in
 * its tree. It portals into the slot the shell owns, so a view four components
 * deep can set it without the shell knowing anything about that view, and
 * without a prop being threaded through everything in between.
 *
 * A route that prints nothing gets the shell's default: the section it belongs
 * to, set as an ordered list of everything else in that section. That is not a
 * placeholder. Section-level navigation used to be a magnifying dock of icons
 * along the bottom edge, competing with the transport for the same strip; on
 * paper the contents of a section belong on the facing page, written out, in
 * order, where they can be read rather than hovered.
 *
 * Whether the default prints is decided in CSS rather than here: the slot sits
 * before the default in the DOM, and `.leafSlot:not(:empty)+.leafDefault` hides
 * it. A JavaScript flag for the same thing would have to be set during render
 * by a child of the component reading it, which React is right to complain
 * about.
 */

const SlotContext = createContext<HTMLElement | null>(null);

export const LeafSlotProvider = SlotContext.Provider;

export default function PageLeaf({children}: {children: ReactNode}) {
  const slot = useContext(SlotContext);
  // Null on the very first render, before the shell's callback ref has fired.
  // The shell re-renders once the node exists, so this resolves immediately.
  if (!slot) return null;
  return createPortal(children, slot);
}
