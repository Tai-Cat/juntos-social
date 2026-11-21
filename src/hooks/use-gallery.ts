import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {getGallery} from "@/lib/gallery.functions";
import {ensurePlanPhotos} from "@/lib/image-search.functions";
import {isRealPhoto} from "@/lib/placeholder";
import {useSession} from "./use-auth";
/** Signed upload URLs plus licensed stock photos; anything else (AI-looking bundled art) is dropped so callers show a placeholder. */
export function useGallery(planId:string|undefined,photos:string[]){
 const {user}=useSession(),fetchGallery=useServerFn(getGallery),ensure=useServerFn(ensurePlanPhotos);
 const real=photos.filter(isRealPhoto);
 const needsStock=!!planId&&real.length===0;
 const stock=useQuery({queryKey:["plan-stock-photos",planId],enabled:needsStock,staleTime:Infinity,retry:false,queryFn:async()=>planId?(await ensure({data:{planId}})).photos:[]});
 const q=useQuery({queryKey:["gallery",planId,user?.id],enabled:!!planId&&real.some(p=>p.startsWith("storage:")),staleTime:30*60*1000,queryFn:()=>planId?fetchGallery({data:{planId}}):Promise.resolve([])});
 if(needsStock)return stock.data??[];
 return (q.data??real.filter(p=>!p.startsWith("storage:"))).filter(Boolean);
}
