import { useAuthAction } from "./AuthSheet";
import { CityInput } from "./CityInput";
import { InterestPicker } from "./InterestPicker";
import { cityName } from "@/lib/catalog";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Chip } from "./bits";
import { errMsg } from "@/lib/tagalong";

const TRIP_INTERESTS = [
  "food",
  "coffee",
  "hiking",
  "running",
  "climbing",
  "museums",
  "music",
  "nightlife",
  "beach",
  "wine",
  "photography",
  "architecture",
  "history",
  "markets",
];

export function AddTripButton() {
  const { user } = useSession();
  const auth = useAuthAction();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  async function save() {
    if (!user) return;
    if (end < start) {
      toast.error("End date must be after start date");
      return;
    }
    const { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        country,
        city: cityName(city),
        start_date: start,
        end_date: end,
        interests,
      })
      .select("id")
      .single();
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    qc.invalidateQueries({ queryKey: ["trips"] });
    setOpen(false);
    navigate({ to: "/trips/$tripId", params: { tripId: data.id } });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => v ? auth(() => setOpen(true), "add a trip") : setOpen(false)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Add a trip
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a trip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tc">Country</Label>
              <Input
                id="tc"
                placeholder="Portugal"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ty">City</Label>
              <CityInput
                id="ty"
                value={city}
                onChange={(v) => {
                  setCity(v);
                  const c = v.split(",")[1]?.trim();
                  if (c) setCountry(c);
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ts">From</Label>
              <Input id="ts" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="te">To</Label>
              <Input id="te" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Interests</Label>
            <InterestPicker selected={interests} onChange={setInterests} city={city} />
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={save}
            disabled={!country || !city || !start || !end}
          >
            Save trip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
