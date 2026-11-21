import { GENRES, CITY_SUGGESTIONS, imageFor, genreClass, cityName } from "@/lib/catalog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
export function InterestPicker({
  selected,
  onChange,
  city,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
  city: string;
}) {
  const toggle = (a: string) =>
    onChange(selected.includes(a) ? selected.filter((i) => i !== a) : [...selected, a]);
  const tile = (a: string, genre: string) => (
    <Button
      key={a}
      type="button"
      variant="ghost"
      aria-pressed={selected.includes(a)}
      onClick={() => toggle(a)}
      className={`interest-tile ${genreClass(genre)} ${selected.includes(a) ? "selected" : ""}`}
    >
      <img src={imageFor(a, genre)} alt="" loading="lazy" />
      <span className="min-w-0 whitespace-normal text-left capitalize">{a}</span>
      {selected.includes(a) && <Check className="shrink-0" />}
    </Button>
  );
  return (
    <>
      <Accordion type="multiple">
        {GENRES.map((g) => (
          <AccordionItem key={g.id} value={g.id}>
            <AccordionTrigger className="gap-3 text-base">
              <img
                src={imageFor(g.items.split("|")[0] ?? "", g.id)}
                alt=""
                className="h-12 w-16 rounded-md object-cover"
              />
              <span className="flex-1">{g.label}</span>
              <span className="text-xs text-muted-foreground">
                {g.items.split("|").filter((a) => selected.includes(a)).length || ""}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {g.items.split("|").map((a) => tile(a, g.id))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {CITY_SUGGESTIONS[cityName(city)] && (
        <section className="mt-5">
          <h3 className="mb-3 text-lg">Only in {cityName(city)}</h3>
          <div className="grid grid-cols-2 gap-2">
            {CITY_SUGGESTIONS[cityName(city)]?.map((a) => tile(a, "arts"))}
          </div>
        </section>
      )}
    </>
  );
}
