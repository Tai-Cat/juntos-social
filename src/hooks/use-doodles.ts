import { useEffect, useState } from "react";
export function useDoodles() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    setEnabled(localStorage.getItem("tagalong-doodles") !== "off");
  }, []);
  function toggle(value: boolean) {
    setEnabled(value);
    localStorage.setItem("tagalong-doodles", value ? "on" : "off");
    document.documentElement.dataset["doodles"] = value ? "on" : "off";
  }
  return { enabled, toggle };
}