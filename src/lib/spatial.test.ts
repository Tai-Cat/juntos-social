import { expect, it } from "vitest";
import { inBounds, distanceKm } from "./spatial";
it("visible-area search excludes pins outside the area",()=>expect(inBounds(48.8,2.4,{south:48.85,north:48.9,west:2.3,east:2.5})).toBe(false));
it("unknown approximate locations never enter the map filter",()=>expect(inBounds(null,null,{south:-90,north:90,west:-180,east:180})).toBe(false));
it("distance is zero at the same area",()=>expect(distanceKm({lat:48.85,lng:2.35},{lat:48.85,lng:2.35})).toBe(0));