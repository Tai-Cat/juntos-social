import { useSyncExternalStore } from "react";
// Shared Explore preferences so the header (location pill, map/list toggle) works on every page.
export type ExploreView = "browse" | "list" | "map";
type Prefs = { city: string | null; view: ExploreView; position: { lat: number; lng: number } | null };
const KEY = "juntos-explore";
let state: Prefs = { city: null, view: "browse", position: null };
let loaded = false;
const subs = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { state = { ...state, ...JSON.parse(sessionStorage.getItem(KEY) ?? "{}") }; } catch {}
}
export function setExplorePrefs(next: Partial<Prefs>) {
  load();
  state = { ...state, ...next };
  try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  subs.forEach((f) => f());
}
const SERVER: Prefs = { city: null, view: "browse", position: null };
export function useExplorePrefs() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => { load(); return state; },
    () => SERVER,
  );
}
