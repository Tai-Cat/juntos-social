export const LOGO_OPTIONS = {
  A: { label: "Pink and orange", left: "fill-logo-pink", right: "fill-logo-orange", dot: "text-logo-pink" },
  B: { label: "Pink and yellow", left: "fill-logo-pink", right: "fill-logo-yellow", dot: "text-logo-pink" },
  C: { label: "Hot pink and coral", left: "fill-logo-hotpink", right: "fill-logo-coral", dot: "text-logo-hotpink" },
} as const;
export type LogoOption = keyof typeof LOGO_OPTIONS;
/** Live logo uses option A until Taira picks one on /admin/logo. */
export const LIVE_LOGO: LogoOption = "A";

export function JuntosLogo({ size = "md", option = LIVE_LOGO }: { size?: "md" | "lg"; option?: LogoOption }) {
  const o = LOGO_OPTIONS[option];
  return (
    <span className={`inline-flex items-center gap-1.5 font-display font-semibold ${size === "lg" ? "text-6xl" : "text-2xl sm:text-3xl"}`}>
      <svg aria-hidden viewBox="0 0 32 32" className={size === "lg" ? "h-14 w-14" : "h-7 w-7"}>
        <circle cx="12" cy="16" r="9" className={o.left} />
        <circle cx="20" cy="16" r="9" className={o.right} opacity=".85" />
      </svg>
      Juntos<span className={o.dot}>.</span>
    </span>
  );
}
