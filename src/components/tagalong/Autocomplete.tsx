import { useId, useState } from "react";
import { Input } from "@/components/ui/input";

export type Suggestion = { value: string; label: string; hint?: string };

/**
 * Text box that suggests options underneath as you type (works the same on iPhone, unlike <datalist>).
 * Tap a suggestion or press Enter to take the first one.
 */
export function Autocomplete({
  value,
  onChange,
  onPick,
  suggestions,
  placeholder,
  ariaLabel,
  id,
  required,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (s: Suggestion) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const show = open && value.trim().length > 0 && suggestions.length > 0;
  const pick = (s: Suggestion) => { onPick(s); setOpen(false); setActive(0); };
  return (
    <div className="relative">
      <Input
        id={id}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); pick(suggestions[active] ?? suggestions[0]!); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {show && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.value}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left text-sm ${i === active ? "bg-muted" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                <span className="font-semibold">{s.label}</span>
                {s.hint && <span className="shrink-0 text-xs text-muted-foreground">{s.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
