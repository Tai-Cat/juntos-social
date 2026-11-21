import { CITIES } from "@/lib/catalog";
import { Input } from "@/components/ui/input";
export function CityInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <Input
        id={id}
        list={`${id}-cities`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="City, country"
        autoComplete="off"
      />
      <datalist id={`${id}-cities`}>
        {CITIES.filter((c) => c.toLowerCase().includes(value.toLowerCase())).map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  );
}
