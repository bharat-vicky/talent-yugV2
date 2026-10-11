"use client";
import {useEffect} from "react";
import {useRouter,usePathname} from "next/navigation";
export function AutoRefresh(){
 const router=useRouter(),pathname=usePathname();
 useEffect(()=>{
  let cursor="",stopped=false;const controller=new AbortController();
  const refresh=()=>router.refresh();
  async function poll(){if(document.hidden)return;const workspace=document.cookie.split("; ").find(item=>item.startsWith("active-workspace-id="))?.split("=")[1];const event=/^\/events\/([a-f0-9]{24})/.exec(pathname)?.[1];const channel=event?`event_${event}`:workspace?`workspace_${workspace}`:"";if(!channel)return;
   try{const response=await fetch(`/pahchaan/api/realtime?channel=${channel}&cursor=${cursor}`,{signal:controller.signal});if(!response.ok)return;const data=await response.json();if(stopped)return;if(cursor && data.events.length)router.refresh();cursor=data.cursor||cursor;}catch{/* Retry on the next poll. */}}
  const interval=setInterval(poll,5000);window.addEventListener("focus",refresh);return()=>{stopped=true;controller.abort();clearInterval(interval);window.removeEventListener("focus",refresh);};
 },[router,pathname]);return null;
}
