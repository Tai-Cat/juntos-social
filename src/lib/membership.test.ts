import { expect, it } from "vitest";
import { canSaveAlert, canUseHostTools, FREE_ALERT_LIMIT } from "./membership";
it("free gets exactly 2 alerts",()=>{expect(FREE_ALERT_LIMIT).toBe(2);expect(canSaveAlert(false,1)).toBe(true);expect(canSaveAlert(false,2)).toBe(false);});
it("Plus has unlimited alerts",()=>expect(canSaveAlert(true,10000)).toBe(true));
it("recurring host tools require Plus",()=>expect(canUseHostTools(false,6,true,false)).toBe(false));
it("reliable-only joining requires Plus",()=>expect(canUseHostTools(false,6,false,true)).toBe(false));
it("larger groups require Plus",()=>expect(canUseHostTools(false,9,false,false)).toBe(false));
it("Plus enables host tools",()=>expect(canUseHostTools(true,30,true,true)).toBe(true));