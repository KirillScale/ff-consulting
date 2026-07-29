"use client";

import {useEffect,useState} from "react";
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

    const run=async()=>{
      try{
        const company=decodeURIComponent(resolved.company);
        const code=decodeURIComponent(resolved.code);

        const rpc=await supabase.rpc("tracker_resolve_and_log",{
          p_company:company,
          p_code:code,
          p_referrer:document.referrer||"",
          p_device:deviceType(),
        });

        let row:any=Array.isArray(rpc.data)?rpc.data[0]:rpc.data;

        // Fallback keeps old installations working and never blocks redirect analytics.
        if(rpc.error||!row){
          const{data:link,error}=await supabase.from("tracker_links")
            .select("id,user_id,target_url,utm_source,utm_medium,utm_campaign,transition_message,active,expires_at")
            .eq("company",company)
            .eq("code",code)
            .maybeSingle();

          if(error)throw error;
          if(!link||link.active===false||(link.expires_at&&new Date(link.expires_at)<new Date())){
            throw new Error("Ссылка недоступна");
          }

          row=link;

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
        setCustomMessage(String(row.transition_message||"").trim().slice(0,200));

        // No artificial waiting: redirect on the next paint only, so the UI can update.
        requestAnimationFrame(()=>{
          if(!cancelled)window.location.replace(finalUrl);
        });
      }catch(error){
        console.error("Link redirect failed",error);
        if(!cancelled)setStatus("error");
      }
    };

    run();
    return()=>{cancelled=true;};
  },[resolved]);

  return <main style={{
    minHeight:"100dvh",
    background:"#000",
    color:"#F5F5F5",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    padding:"24px",
    fontFamily:"Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    boxSizing:"border-box"
  }}>
    <style>{`
      @keyframes vizzyFloat{
        0%,100%{transform:translateY(0) scale(1)}
        50%{transform:translateY(-6px) scale(1.015)}
      }
      @media (prefers-reduced-motion:reduce){
        .vizzy-loading-logo{animation:none!important}
      }
    `}</style>

    <section style={{
      width:"100%",
      maxWidth:520,
      textAlign:"center",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      transform:"translateY(-3vh)"
    }}>
      <img
        className="vizzy-loading-logo"
        src="/vizzy-logo.png"
        alt="Vizzy"
        width={76}
        height={76}
        draggable={false}
        style={{
          width:"clamp(68px,18vw,76px)",
          height:"clamp(68px,18vw,76px)",
          borderRadius:"18px",
          objectFit:"cover",
          display:"block",
          animation:status==="loading"?"vizzyFloat 1.35s ease-in-out infinite":"none",
          userSelect:"none",
          WebkitUserSelect:"none"
        }}
      />

      {status==="loading"?<>
        {customMessage&&<h1 style={{
          maxWidth:500,
          margin:"28px 0 0",
          color:"#F7F7F7",
          fontSize:"clamp(24px,6vw,34px)",
          lineHeight:1.18,
          fontWeight:700,
          letterSpacing:"-0.035em",
          overflowWrap:"anywhere"
        }}>{customMessage}</h1>}

        <p style={{
          margin:customMessage?"13px 0 0":"24px 0 0",
          color:"#8D929D",
          fontSize:"clamp(15px,4vw,18px)",
          lineHeight:1.45,
          fontWeight:400,
          letterSpacing:"-0.015em"
        }}>Переходим по ссылке...</p>
      </>:<>
        <h1 style={{
          margin:"28px 0 0",
          color:"#F7F7F7",
          fontSize:"clamp(22px,6vw,30px)",
          lineHeight:1.2,
          fontWeight:650,
          letterSpacing:"-0.03em"
        }}>Не удалось открыть ссылку</h1>

        <p style={{
          margin:"11px 0 0",
          color:"#8D929D",
          fontSize:15,
          lineHeight:1.5
        }}>Ссылка отключена, устарела или указана неверно.</p>

        <button onClick={()=>window.location.reload()} style={{
          marginTop:20,
          height:42,
          padding:"0 17px",
          borderRadius:10,
          border:"1px solid rgba(255,255,255,.12)",
          background:"#141414",
          color:"#F2F2F2",
          fontSize:13,
          fontWeight:500,
          cursor:"pointer"
        }}>Повторить</button>
      </>}
    </section>
  </main>;
}
