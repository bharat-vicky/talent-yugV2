"use client";
import { use, useEffect, useState } from "react";
type LiveEvent={id:string;event:string;createdAt:string};
export default function LiveMonitorPage({params}:{params:Promise<{eventId:string}>}) {
 const {eventId}=use(params),[events,setEvents]=useState<LiveEvent[]>([]),[error,setError]=useState("");
 useEffect(()=>{let stopped=false,cursor="";const controller=new AbortController();
  async function poll(){try{const response=await fetch(`/pahchaan/api/realtime?channel=event_${eventId}&cursor=${cursor}`,{signal:controller.signal});if(!response.ok)throw new Error("Live updates unavailable");const data=await response.json();if(stopped)return;cursor=data.cursor||cursor;setEvents(previous=>[...data.events.reverse(),...previous].slice(0,100));setError("");}catch{if(!stopped)setError("Unable to load live updates. Retrying…");}}
  void poll();const interval=setInterval(poll,3000);return()=>{stopped=true;controller.abort();clearInterval(interval);};
 },[eventId]);
 return <div className="p-6 space-y-4"><h1 className="text-2xl font-bold">Live event monitor</h1><p role="status">{error || (events.length ? "Live updates" : "Waiting for event activity…")}</p>{events.map(item=><div key={item.id} className="border rounded-lg p-3"><p>{item.event.replaceAll("_"," ")}</p><time>{new Date(item.createdAt).toLocaleString()}</time></div>)}</div>;
}
