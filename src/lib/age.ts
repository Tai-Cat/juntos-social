export const AGE_BRACKETS = [{value:"18-24",label:"18–24",min:18,max:24},{value:"25-34",label:"25–34",min:25,max:34},{value:"35-44",label:"35–44",min:35,max:44},{value:"45-54",label:"45–54",min:45,max:54},{value:"55-120",label:"55+",min:55,max:120}];
export function adultAge(dob: string, on = new Date()) {
  const birth = new Date(`${dob}T12:00:00`);
  if (!dob || Number.isNaN(birth.getTime())) return null;
  let age = on.getFullYear()-birth.getFullYear();
  if (on.getMonth()<birth.getMonth() || (on.getMonth()===birth.getMonth() && on.getDate()<birth.getDate())) age--;
  return age;
}
export function ageAllowed(dob:string,min:number|null,max:number|null,on=new Date()) {
 const age=adultAge(dob,on); return age!==null && age>=Math.max(18,min??18) && age<=(max??120);
}
export function ageLabel(min:number|null,max:number|null) { return min===null && max===null ? "" : max===null || max===120 ? `${min??18}+` : `${min??18}–${max}`; }
export function matchesAgeRange(min:number|null,max:number|null,filter:string) {
 if(!filter)return true; const [low,high]=filter.split("-").map(Number); return low!==undefined && high!==undefined && (min??18)<=high && (max??120)>=low;
}