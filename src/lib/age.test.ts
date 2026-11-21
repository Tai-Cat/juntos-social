import {describe,it,expect} from "vitest";
import {ageAllowed,adultAge,matchesAgeRange} from "./age";
describe("adult age rules",()=>{
 const today=new Date("2026-11-21T12:00:00");
 it("requires 18, including the birthday boundary",()=>{expect(ageAllowed("2008-11-22",null,null,today)).toBe(false);expect(ageAllowed("2008-11-21",null,null,today)).toBe(true);});
 it("enforces the host range inclusively",()=>{expect(ageAllowed("2001-11-21",18,24,today)).toBe(false);expect(ageAllowed("2002-11-21",18,24,today)).toBe(true);});
 it("handles 55 plus",()=>{expect(ageAllowed("1971-11-21",55,null,today)).toBe(true);expect(ageAllowed("1972-11-21",55,null,today)).toBe(false);});
 it("does not treat missing DOB as adult",()=>expect(adultAge("",today)).toBeNull());
 it("filters by overlapping bracket",()=>{expect(matchesAgeRange(35,44,"18-24")).toBe(false);expect(matchesAgeRange(null,null,"18-24")).toBe(true);});
});