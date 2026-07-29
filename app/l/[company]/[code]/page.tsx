"use client";

import {useEffect,useMemo,useState} from "react";
import {supabase} from "@/lib/supabase";

type Props={params:Promise<{company:string;code:string}>};

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
            .select("id,user_id,target_url,utm_source,utm_medium,utm_campaign,active,expires_at")
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
        const finalUrl=appendUtm(target,row);
        setMessage("Открываем страницу");
        window.setTimeout(()=>window.location.replace(finalUrl),120);
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
    `}</style>
    <section style={{width:"100%",maxWidth:380,textAlign:"center"}}>
      <div style={{
        width:64,height:64,borderRadius:16,margin:"0 auto 22px",background:"#2F6BFF",
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:"0 14px 40px rgba(47,107,255,.22)",
        animation:status==="loading"?"vizzyJump 1.25s ease-in-out infinite":"none"
      }}>
        <span style={{fontSize:28,fontWeight:600,letterSpacing:"-.06em",color:"#fff"}}>V</span>
      </div>

      <h1 style={{fontSize:20,fontWeight:500,letterSpacing:"-.025em",margin:"0 0 8px"}}>
        {status==="loading"?"Переходим по ссылке":"Не удалось открыть ссылку"}
      </h1>
      <p style={{fontSize:13,color:"#8A8A8A",lineHeight:1.55,margin:0}}>{message}</p>

      {status==="loading"&&<div style={{display:"flex",gap:6,justifyContent:"center",marginTop:18}}>
        {dots.map((d)=><span key={d} style={{
          width:6,height:6,borderRadius:"50%",background:"#ECECEC",
          animation:`vizzyDot 1.2s ${d*.16}s ease-in-out infinite`
        }}/>)}
      </div>}

      {status==="error"&&<button onClick={()=>window.location.reload()} style={{
        marginTop:20,height:40,padding:"0 16px",borderRadius:9,border:"1px solid rgba(255,255,255,.12)",
        background:"#171717",color:"#ECECEC",fontSize:12.5,fontWeight:500,cursor:"pointer"
      }}>Повторить</button>}
    </section>
  </main>;
}
