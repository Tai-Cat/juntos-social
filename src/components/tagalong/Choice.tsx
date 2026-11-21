import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export function Choice({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (string | { value: string; label: string })[];
  disabled?: boolean;
}) {
  return (
    <Select
      value={value || "__all"}
      onValueChange={(v) => onChange(v === "__all" ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label} className="min-w-0 bg-card">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{label}</SelectItem>
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          return (
            <SelectItem key={v} value={v}>
              {typeof o === "string" ? o : o.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
