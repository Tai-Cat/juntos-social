// Tinted category placeholders shown instead of AI-generated imagery until a real photo exists.
const ICONS: Record<string, string> = {
  active: '<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>',
  food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  arts: '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/>',
  tech: '<path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z"/><path d="M20.054 15.987H3.946"/>',
  ideas: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  outdoors: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
  social: '<rect width="12" height="12" x="2" y="10" rx="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/>',
  wellness: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  place: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
};
const COLORS: Record<string, [string, string]> = {
  active: ["#E6F2E4", "#3E8E4A"], food: ["#FCE6DA", "#E2642A"], arts: ["#F0E6F6", "#9461B8"],
  tech: ["#E1EEF8", "#3A86C2"], ideas: ["#FFF3C9", "#B98A00"], outdoors: ["#E4F1E0", "#4F8F3A"],
  social: ["#FBE2DD", "#D9473A"], wellness: ["#ECE7F7", "#7C6BC4"], place: ["#E1EEF8", "#3A86C2"],
};
const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
function wrap(text: string, max: number, lines: number) {
  const out: string[] = []; let cur = "";
  for (const w of text.split(/\s+/)) {
    if ((cur + " " + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim();
  }
  if (cur) out.push(cur);
  if (out.length > lines) { out.length = lines; out[lines - 1] = out[lines - 1]!.replace(/.{0,2}$/, "…"); }
  return out;
}
const titleCase = (t: string) => t.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
/** Illustrated, object-focused header: a scattered pattern of the category's object with a label — never a lone icon. */
export function placeholderImage(genre: string, label?: string) {
  const key = ICONS[genre] ? genre : "outdoors";
  const [bg, fg] = COLORS[key] ?? ["#FFF3E3", "#E2642A"];
  const seed = hash(`${genre}${label ?? ""}`);
  const marks = Array.from({ length: 9 }, (_, i) => {
    const x = ((seed >> i) % 7) * 24 + (i % 3) * 52 - 10, y = Math.floor(i / 3) * 34 - 6 + ((seed >> (i + 3)) % 9);
    const sc = 0.9 + ((seed >> (i + 1)) % 5) * 0.25, r = ((seed >> (i + 2)) % 60) - 30;
    return `<g transform="translate(${x} ${y}) rotate(${r} 12 12) scale(${sc})" opacity="${i % 2 ? 0.35 : 0.6}">${ICONS[key]}</g>`;
  }).join("");
  const big = `<g transform="translate(92 40) scale(2.6) rotate(-8 12 12)" stroke-width="1.4">${ICONS[key]}</g>`;
  const text = label ? `<rect x="0" y="100" width="160" height="26" fill="${bg}" opacity=".9"/><text x="10" y="118" font-family="Georgia, serif" font-size="13" font-weight="700" fill="${fg}">${esc(wrap(titleCase(label), 22, 1)[0] ?? "")}</text>` : "";
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" fill="${bg}"/><g fill="none" stroke="${fg}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${marks}${big}</g>${text}</svg>`);
}
/** Luma-style flyer header generated from the event itself. */
export function flyerImage(p: { title: string; starts_at?: string | null; genre?: string | null; area_label?: string | null }) {
  const key = p.genre && COLORS[p.genre] ? p.genre : "food";
  const [soft, strong] = COLORS[key]!;
  const lines = wrap(p.title, 15, 3);
  const d = p.starts_at ? new Date(p.starts_at) : null;
  const date = d ? d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toUpperCase() + " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
  const size = lines.length > 2 ? 30 : 36;
  // Square canvas; all text sits in the middle band so both square cards and wide carousels show it.
  const top = 150 - (lines.length - 1) * (size / 2);
  const title = lines.map((l, i) => `<text x="28" y="${top + i * (size + 4)}" font-family="Georgia, serif" font-size="${size}" font-weight="700" fill="#FFF8EE">${esc(l)}</text>`).join("");
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${strong}"/><circle cx="350" cy="90" r="110" fill="${soft}" opacity=".22"/><rect y="236" width="400" height="164" fill="${soft}"/><g transform="translate(318 250) scale(2.4)" fill="none" stroke="${strong}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".45">${ICONS[key]}</g>${title}<text x="28" y="268" font-family="Helvetica, Arial, sans-serif" font-size="17" font-weight="800" fill="${strong}">${esc(date)}</text><text x="28" y="290" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#2A2824">${esc((p.area_label ?? "").slice(0, 44))}</text><text x="28" y="318" font-family="Georgia, serif" font-size="16" font-weight="700" fill="#2A2824">Juntos.</text></svg>`);
}
/** Cover when no real photo exists: roughly half flyers, half illustrated object headers (deterministic per plan). */
export function planFallback(p: { id: string; title: string; starts_at?: string | null; genre?: string | null; area_label?: string | null; activity?: string | null }) {
  return hash(p.id) % 2 === 0 ? flyerImage(p) : placeholderImage(p.genre ?? "outdoors", p.activity ?? p.title);
}
/** Bundled generated assets look AI-made, so only uploads and licensed stock photos count as real. */
export const isRealPhoto = (url: string | null | undefined) =>
  !!url && (url.startsWith("storage:") || url.startsWith("data:") || url.startsWith("/flyers/") || /^https:\/\/(images\.unsplash\.com|images\.pexels\.com)\//.test(url) || /\/storage\/v1\/object\//.test(url));
export const photoOr = (url: string | null | undefined, p: string | Parameters<typeof planFallback>[0]) =>
  url && isRealPhoto(url) ? url : typeof p === "string" ? placeholderImage(p) : planFallback(p);
