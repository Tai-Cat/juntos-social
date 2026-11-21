import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {getGallery} from "@/lib/gallery.functions";
import {useSession} from "./use-auth";
export function useGallery(planId:string|undefined,photos:string[]){const {user}=useSession(),fetchGallery=useServerFn(getGallery);const q=useQuery({queryKey:["gallery",planId,user?.id],enabled:!!planId&&photos.some(p=>p.startsWith("storage:")),staleTime:30*60*1000,queryFn:()=>planId?fetchGallery({data:{planId}}):Promise.resolve([])});return q.data??photos.filter(p=>!p.startsWith("storage:"));}