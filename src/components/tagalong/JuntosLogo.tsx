export function JuntosLogo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-display font-semibold ${size === "lg" ? "text-6xl" : "text-2xl sm:text-3xl"}`}>
      <svg aria-hidden viewBox="0 0 32 32" className={size === "lg" ? "h-14 w-14" : "h-7 w-7"}>
        <circle cx="12" cy="16" r="9" className="fill-tangerine" />
        <circle cx="20" cy="16" r="9" className="fill-sunflower" opacity=".85" />
      </svg>
      Juntos<span className="text-tangerine">.</span>
    </span>
  );
}
