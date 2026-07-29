"use client";

import {useEffect,useMemo,useState} from "react";
import {supabase} from "@/lib/supabase";

type Props={params:Promise<{company:string;code:string}>};

function VizzyMark({size=64}:{size?:number}){
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Vizzy">
    <rect x="1" y="1" width="62" height="62" rx="16" fill="#2F6BFF"/>
    <path d="M15 19.5L27.6 44.5C29.3 47.8 34 47.8 35.7 44.5L49 18.5" stroke="white" strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M39.5 18.5H49V28" stroke="white" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

const safeTarget=(value:string)=>{
  try{
    const u=new URL(value);
    if(u.protocol!=="http:"&&u.protocol!=="https:")return "";
    return u.toString();
  }catch{return "";}
};

const appendUtm=(target:string,fields:{utm_source?:string;utm_medium?:string;utm_campaign?:string})=>{
  try{
    const u=new URL(target);
    if(fields.utm_source&&!u.searchParams.has("utm_source"))u.searchParams.set("utm_source",fields.utm_source);
    if(fields.utm_medium&&!u.searchParams.has("utm_medium"))u.searchParams.set("utm_medium",fields.utm_medium);
    if(fields.utm_campaign&&!u.searchParams.has("utm_campaign"))u.searchParams.set("utm_campaign",fields.utm_campaign);
    return u.toString();
  }catch{return target;}
};

const deviceType=()=>{
  const ua=navigator.userAgent||"";
  if(/ipad|tablet/i.test(ua))return"tablet";
  if(/mobile|iphone|android/i.test(ua))return"mobile";
  return"desktop";
};

export default function LinkRedirectPage({params}:Props){
  const[status,setStatus]=useState<"loading"|"error">("loading");
  const[message,setMessage]=useState("Проверяем ссылку");
  const[customMessage,setCustomMessage]=useState("");
  const[resolved,setResolved]=useState<{company:string;code:string}|null>(null);

  useEffect(()=>{
    let active=true;
    params.then(value=>{if(active)setResolved(value);});
    return()=>{active=false;};
  },[params]);

  useEffect(()=>{
    if(!resolved)return;
    let cancelled=false;
    const timeout=window.setTimeout(()=>{
      if(!cancelled){setStatus("error");setMessage("Переход занимает больше времени, чем обычно");}
    },10000);

    const run=async()=>{
      try{
        setMessage("Переходим по ссылке");

        const rpc=await supabase.rpc("tracker_resolve_and_log",{
          p_company:decodeURIComponent(resolved.company),
          p_code:decodeURIComponent(resolved.code),
          p_referrer:document.referrer||"",
          p_device:deviceType(),
        });

        let row:any=Array.isArray(rpc.data)?rpc.data[0]:rpc.data;

        // Совместимость до запуска SQL-функции.
        if(rpc.error||!row){
          const{data:link,error}=await supabase.from("tracker_links")
            .select("id,user_id,target_url,utm_source,utm_medium,utm_campaign,transition_message,active,expires_at")
            .eq("company",decodeURIComponent(resolved.company))
            .eq("code",decodeURIComponent(resolved.code))
            .maybeSingle();
          if(error)throw error;
          if(!link||link.active===false||(link.expires_at&&new Date(link.expires_at)<new Date()))throw new Error("Ссылка недоступна");
          row=link;
          // Аналитика не должна задерживать сам переход.
          void supabase.from("tracker_clicks").insert({
            link_id:link.id,
            user_id:link.user_id,
            referrer:document.referrer||"",
            device:deviceType(),
          });
        }

        const target=safeTarget(row.target_url||"");
        if(!target)throw new Error("Некорректный адрес назначения");
        setCustomMessage(String(row.transition_message||"").trim().slice(0,200));
        const finalUrl=appendUtm(target,row);
        setMessage("Открываем страницу");
        window.setTimeout(()=>window.location.replace(finalUrl),220);
      }catch(e){
        console.error("Link redirect failed",e);
        if(!cancelled){
          setStatus("error");
          setMessage("Ссылка недоступна или была отключена");
        }
      }finally{
        window.clearTimeout(timeout);
      }
    };

    run();
    return()=>{cancelled=true;window.clearTimeout(timeout);};
  },[resolved]);

  const dots=useMemo(()=>[0,1,2],[]);

  return <main style={{
    minHeight:"100dvh",background:"#0A0A0A",color:"#ECECEC",display:"flex",
    alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"Inter,Arial,sans-serif"
  }}>
    <style>{`
      @keyframes vizzyJump{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.02)}}
      @keyframes vizzyDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}
      @keyframes vizzyProgress{0%{transform:translateX(-140%)}60%{transform:translateX(150%)}100%{transform:translateX(150%)}}
    `}</style>
    <section style={{width:"100%",maxWidth:380,textAlign:"center"}}>
      <div style={{
        width:64,height:64,margin:"0 auto 22px",
        display:"flex",alignItems:"center",justifyContent:"center",
        filter:"drop-shadow(0 14px 30px rgba(47,107,255,.22))",
        animation:status==="loading"?"vizzyJump 1.25s ease-in-out infinite":"none"
      }}>
        <VizzyMark size={64}/>
      </div>

      <h1 style={{fontSize:20,fontWeight:500,letterSpacing:"-.025em",margin:"0 0 8px"}}>
        {status==="loading"?"Переходим по ссылке":"Не удалось открыть ссылку"}
      </h1>
      <p style={{fontSize:13,color:"#8A8A8A",lineHeight:1.55,margin:0}}>{message}</p>

      {customMessage&&<div style={{
        margin:"18px auto 0",padding:"13px 15px",maxWidth:330,borderRadius:11,
        border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.035)",
        color:"#D8D8D8",fontSize:12.5,lineHeight:1.55,textAlign:"left",
        overflowWrap:"anywhere"
      }}>{customMessage}</div>}

      {status==="loading"&&<>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:18}}>
          {dots.map((d)=><span key={d} style={{
            width:6,height:6,borderRadius:"50%",background:"#ECECEC",
            animation:`vizzyDot 1.2s ${d*.16}s ease-in-out infinite`
          }}/>)}
        </div>
        <div style={{width:180,height:2,borderRadius:2,background:"rgba(255,255,255,.08)",overflow:"hidden",margin:"18px auto 0"}}>
          <div style={{height:"100%",width:"45%",background:"#2F6BFF",borderRadius:2,animation:"vizzyProgress 1.2s ease-in-out infinite"}}/>
        </div>
      </>}

      {status==="error"&&<button onClick={()=>window.location.reload()} style={{
        marginTop:20,height:40,padding:"0 16px",borderRadius:9,border:"1px solid rgba(255,255,255,.12)",
        background:"#171717",color:"#ECECEC",fontSize:12.5,fontWeight:500,cursor:"pointer"
      }}>Повторить</button>}
    </section>
  </main>;
}
