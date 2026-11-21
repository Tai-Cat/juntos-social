import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CITY_CENTERS } from "@/lib/spatial";
import ExploreMap from "./ExploreMap";

const mocks = vi.hoisted(() => {
  const setView = vi.fn();
  const remove = vi.fn();
  const map = { setView, remove };
  setView.mockReturnValue(map);
  return { map, setView, remove, createMap: vi.fn(() => map) };
});
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("leaflet", () => ({
  map: mocks.createMap,
  tileLayer: () => ({ addTo: vi.fn() }),
  layerGroup: () => ({ addTo: () => ({ remove: vi.fn() }) }),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("mounts the map, recentres after a city change, and cleans up without invalid hook calls", async () => {
  const props = { plans: [], onArea: vi.fn() };
  const view = render(<ExploreMap {...props} city="Paris" />);
  await waitFor(() => expect(mocks.setView).toHaveBeenCalledWith(CITY_CENTERS["Paris"], 12));
  view.rerender(<ExploreMap {...props} city="Lisbon" />);
  await waitFor(() => expect(mocks.setView).toHaveBeenCalledWith(CITY_CENTERS["Lisbon"], 12));
  expect(mocks.createMap).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(mocks.remove).toHaveBeenCalledTimes(1);
});