/**
 * Juntos mark: three overlapping circles arranged in a triangle, like a Venn diagram.
 * The overlaps blend (multiply) so each pair and the centre read as their own colour.
 * The same geometry is used in public/favicon.svg and the app icons.
 */
export const LOGO_OPTIONS = {
  A: { label: "Pink, orange and yellow", top: "fill-logo-pink", left: "fill-logo-orange", right: "fill-logo-yellow", dot: "text-logo-pink" },
  B: { label: "Hot pink, coral and yellow", top: "fill-logo-hotpink", left: "fill-logo-coral", right: "fill-logo-yellow", dot: "text-logo-hotpink" },
  C: { label: "Pink, coral and orange", top: "fill-logo-pink", left: "fill-logo-coral", right: "fill-logo-orange", dot: "text-logo-pink" },
} as const;
export type LogoOption = keyof typeof LOGO_OPTIONS;
/** Live logo uses option A until Taira picks one on /admin/logo. */
export const LIVE_LOGO: LogoOption = "A";

/** Circle centres and radius on a 32 x 32 grid. */
export const LOGO_CIRCLES = { r: 8.2, top: [16, 10.6], left: [10.9, 19.6], right: [21.1, 19.6] } as const;

export function JuntosMark({ option = LIVE_LOGO, className = "h-7 w-7" }: { option?: LogoOption; className?: string }) {
  const o = LOGO_OPTIONS[option];
  const { r, top, left, right } = LOGO_CIRCLES;
  const blend = { mixBlendMode: "multiply" as const };
  return (
    <svg aria-hidden viewBox="0 0 32 32" className={className} style={{ isolation: "isolate" }}>
      <circle cx={top[0]} cy={top[1]} r={r} className={o.top} opacity={0.82} style={blend} />
      <circle cx={left[0]} cy={left[1]} r={r} className={o.left} opacity={0.82} style={blend} />
      <circle cx={right[0]} cy={right[1]} r={r} className={o.right} opacity={0.82} style={blend} />
    </svg>
  );
}

export function JuntosLogo({ size = "md", option = LIVE_LOGO }: { size?: "md" | "lg"; option?: LogoOption }) {
  const o = LOGO_OPTIONS[option];
  return (
    <span className={`inline-flex items-center gap-1.5 font-display font-semibold ${size === "lg" ? "text-6xl" : "text-2xl sm:text-3xl"}`}>
      <JuntosMark option={option} className={size === "lg" ? "h-14 w-14" : "h-8 w-8"} />
      Juntos<span className={o.dot}>.</span>
    </span>
  );
}
