/**
 * The ground, which is no longer a choice.
 *
 * This module used to switch between a dark studio ground and a cream one,
 * persist the pick, follow the operating system when there was none, and apply
 * it before first paint so the page never flashed the wrong colour.
 *
 * The music book has one ground, because paper is the material rather than a
 * theme and a book does not have a night mode. Everything that made the choice
 * is gone: the stored preference, the `data-theme` attribute, the media query,
 * the toggle in the nav, and the second palette in tokens.css that every
 * contrast measurement had to be taken against twice.
 *
 * What survives is the one line that was never about theming: the browser's
 * own chrome should match the surface it frames, and the surface around the
 * page is the dark stand the book lies on.
 *
 * Any stored preference from the previous design is cleared on the way past,
 * so a reader who last visited under the dark ground does not carry a dead key
 * in local storage forever.
 */

const LEGACY_KEY = "basslab-theme";

export function initTheme() {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", "#101619");
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* storage may be unavailable, and nothing here depends on it */
  }
}
