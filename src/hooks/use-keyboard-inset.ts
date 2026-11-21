import { useEffect, useState } from "react";

/**
 * Height of the on-screen keyboard (0 when closed), from the visual viewport.
 * Lets sheets sit just above the keyboard instead of being pushed around by the browser.
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState({ bottom: 0, height: 0 });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bottom = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
        setInset((prev) => (prev.bottom === bottom && prev.height === Math.round(vv.height) ? prev : { bottom, height: Math.round(vv.height) }));
      });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { cancelAnimationFrame(frame); vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);
  return inset;
}

/** Enter on a "Next" field moves to the next field in the form instead of submitting. */
export function focusNextOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
  const form = e.currentTarget.form;
  if (!form) return;
  const fields = Array.from(form.querySelectorAll<HTMLInputElement>("input:not([type=hidden]):not([disabled])"));
  const next = fields[fields.indexOf(e.currentTarget) + 1];
  if (next) { e.preventDefault(); next.focus({ preventScroll: true }); next.scrollIntoView({ block: "nearest" }); }
}
