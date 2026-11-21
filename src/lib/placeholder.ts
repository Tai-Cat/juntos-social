// Tinted placeholders shown only until a real photo exists.
const COLORS: Record<string, [string, string]> = {
  active: ["#E6F2E4", "#3E8E4A"], food: ["#FCE6DA", "#E2642A"], arts: ["#F0E6F6", "#9461B8"],
  tech: ["#E1EEF8", "#3A86C2"], ideas: ["#FFF3C9", "#B98A00"], outdoors: ["#E4F1E0", "#4F8F3A"],
  social: ["#FBE2DD", "#D9473A"], wellness: ["#ECE7F7", "#7C6BC4"], place: ["#E1EEF8", "#3A86C2"],
};
const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
/** Plain tinted photo-style placeholder shown only until a real photo exists. No flyers or illustrations are generated. */
export function placeholderImage(genre: string, _label?: string) {
  const [bg] = COLORS[genre] ?? ["#F3ECE0", "#E2642A"];
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="none"><rect width="400" height="300" fill="${bg}"/><rect width="400" height="300" fill="#2A2824" opacity=".04"/></svg>`);
}
/** Kept for callers; now the same plain tinted placeholder. */
export function planFallback(p: { id: string; title: string; starts_at?: string | null; genre?: string | null; area_label?: string | null; activity?: string | null }) {
  return aiImage("plan", p.id);
}
export type AiKind = "plan" | "interest" | "city" | "org";
/** Last-resort generated picture, made once on first request and cached by the server. */
export const aiImage = (kind: AiKind, ref: string) => `/api/public/ai-image/${kind}/${encodeURIComponent(ref.trim().toLowerCase().slice(0, 80))}`;
export const isAiImage = (url: string | null | undefined) => !!url && (url.startsWith("/api/public/ai-image/") || url.startsWith("/generated/"));
/** Bundled generated assets look AI-made, so only uploads and licensed stock photos count as real. */
export const isRealPhoto = (url: string | null | undefined) =>
  !!url && (url.startsWith("storage:") || url.startsWith("/generated/") || url.startsWith("/api/public/ai-image/") || /^https:\/\/(images\.unsplash\.com|images\.pexels\.com)\//.test(url) || /\/storage\/v1\/object\//.test(url));
export const photoOr = (url: string | null | undefined, p: string | Parameters<typeof planFallback>[0]) =>
  url && isRealPhoto(url) ? url : typeof p === "string" ? placeholderImage(p) : planFallback(p);
