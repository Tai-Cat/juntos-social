import {describe,it,expect} from "vitest";
import {expandWeekly,freeTogether,calendarICS,type CalendarEvent} from "./calendar";
const e:CalendarEvent={id:"one",planId:"plan",title:"Weekly yoga",start:"2026-11-22T10:00:00Z",duration:60,kind:"friend",friendId:"sam",friendName:"Sam",example:false,recurring:true,area:"Paris centre",image:null};
describe("calendar rules",()=>{
 it("repeats a friend's weekly event",()=>expect(expandWeekly(e,new Date("2026-11-21"),new Date("2026-12-07")).map(v=>v.start)).toEqual(["2026-11-22T10:00:00.000Z","2026-11-29T10:00:00.000Z","2026-12-06T10:00:00.000Z"]));
 it("free time excludes days with either person's going plans",()=>{expect(freeTogether([e],"sam",new Date("2026-11-22T12:00:00Z"))).toBe(false);expect(freeTogether([{...e,kind:"going"}],"lee",new Date("2026-11-22T12:00:00Z"))).toBe(false);expect(freeTogether([e],"sam",new Date("2026-11-23T12:00:00Z"))).toBe(true);});
 it("suggested and saved plans do not mark someone busy",()=>expect(freeTogether([{...e,kind:"suggested"},{...e,kind:"saved"}],"sam",new Date("2026-11-22T12:00:00Z"))).toBe(true));
 it("ICS includes weekly recurrence and only general area",()=>{const text=calendarICS(e,"https://example.org/plans/plan");expect(text).toContain("RRULE:FREQ=WEEKLY");expect(text).toContain("LOCATION:Paris centre");expect(text).toContain("UID:");});
});