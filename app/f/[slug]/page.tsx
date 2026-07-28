// app/f/[slug]/page.tsx
// Vizzy Form v1.0 — public booking page.
// Flow: 1) time first, 2) all form fields on one page, 3) atomic confirmation.

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPA_URL, SUPA_KEY);

type QuestionType = "text"|"textarea"|"email"|"phone"|"number"|"select"|"multi_select"|"checkbox"|"radio"|"date"|"scale"|"file";
type Question = {
  id:string; type:QuestionType|string; label:string; required:boolean;
  hidden?:boolean; options?:string[]; placeholder?:string; help_text?:string;
};
type BookingCfg = {
  enabled:boolean; duration:number; buffer:number; max_per_day:number;
  days:number[]; from:string; to:string; lead_hours:number; horizon_days:number;
  exceptions:string[]; tz:string;
};
type FormRow = {
  id:string; user_id:string; title:string; description:string; slug:string;
  questions:Question[]; completion_title:string; completion_subtitle:string;
  completion_text?:string; completion_url:string; completion_btn_label:string;
  completion_image_url?:string; completion_video_url?:string;
  accent_color:string; is_active:boolean; booking:BookingCfg|null;
};
type Slot = {startIso:string; visitorDate:string; visitorTime:string; ownerDate:string};
type BusySlot = {start_at:string; end_at:string};

const WD_SHORT=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const MONTHS=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_GEN=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const TIME_ZONES=[
  "Europe/Moscow","Europe/Kaliningrad","Europe/London","Europe/Paris","Europe/Berlin",
  "Asia/Dubai","Asia/Tbilisi","Asia/Yerevan","Asia/Almaty","Asia/Tashkent",
  "Asia/Bangkok","Asia/Singapore","Asia/Tokyo","Asia/Shanghai",
  "America/New_York","America/Chicago","America/Denver","America/Los_Angeles",
  "Australia/Sydney","Pacific/Auckland"
];
const pad=(n:number)=>String(n).padStart(2,"0");
const toMin=(t:string)=>{const[h,m]=String(t||"00:00").split(":").map(Number);return(h||0)*60+(m||0);};
const toHHMM=(m:number)=>`${pad(Math.floor(m/60)%24)}:${pad(m%60)}`;
const addDaysYmd=(ymd:string,days:number)=>{const[y,m,d]=ymd.split("-").map(Number);const dt=new Date(Date.UTC(y,m-1,d+days));return`${dt.getUTCFullYear()}-${pad(dt.getUTCMonth()+1)}-${pad(dt.getUTCDate())}`;};
const isoDowYmd=(ymd:string)=>{const[y,m,d]=ymd.split("-").map(Number);return((new Date(Date.UTC(y,m-1,d)).getUTCDay()+6)%7)+1;};

function zonedParts(date:Date,timeZone:string){
  const p=new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);
  const out:Record<string,string>={};p.forEach(x=>{if(x.type!=="literal")out[x.type]=x.value;});return out;
}
function ymdInZone(date:Date,timeZone:string){const p=zonedParts(date,timeZone);return`${p.year}-${p.month}-${p.day}`;}
function timeInZone(date:Date,timeZone:string){const p=zonedParts(date,timeZone);return`${p.hour}:${p.minute}`;}
function zoneOffsetMs(date:Date,timeZone:string){
  const p=zonedParts(date,timeZone);
  const asUtc=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
  return asUtc-date.getTime();
}
function zonedLocalToUtc(dateStr:string,timeStr:string,timeZone:string){
  const[y,m,d]=dateStr.split("-").map(Number);const[hh,mm]=timeStr.split(":").map(Number);
  let guess=new Date(Date.UTC(y,m-1,d,hh,mm,0));
  for(let i=0;i<3;i++)guess=new Date(Date.UTC(y,m-1,d,hh,mm,0)-zoneOffsetMs(guess,timeZone));
  return guess;
}
function zoneLabel(timeZone:string){
  try{
    const now=new Date();
    const parts=new Intl.DateTimeFormat("ru-RU",{timeZone,timeZoneName:"shortOffset",hour:"2-digit",minute:"2-digit"}).formatToParts(now);
    const offset=parts.find(p=>p.type==="timeZoneName")?.value?.replace("GMT","GMT")||"";
    return `${timeZone.replace(/_/g," ")}${offset?` (${offset})`:""}`;
  }catch{return timeZone.replace(/_/g," ");}
}
function getSessionId(){
  try{
    const key="vizzy_form_session";let id=localStorage.getItem(key);
    if(!id){id=globalThis.crypto?.randomUUID?.()||`vf-${Date.now()}-${Math.random().toString(36).slice(2)}`;localStorage.setItem(key,id);}return id;
  }catch{return`vf-${Date.now()}-${Math.random().toString(36).slice(2)}`;}
}
function safeUrl(value:string){try{const u=new URL(value);return u.protocol==="http:"||u.protocol==="https:"?u.toString():"";}catch{return"";}}
function isDirectVideo(value:string){
  const clean=safeUrl(value||"");if(!clean)return false;
  try{const path=new URL(clean).pathname.toLowerCase();return[".mp4",".webm",".mov",".m4v"].some(ext=>path.endsWith(ext));}
  catch{return false;}
}

export default function PublicFormPage({params}:{params:Promise<{slug:string}>}){
  const[slug,setSlug]=useState("");
  const[form,setForm]=useState<FormRow|null>(null);
  const[loading,setLoading]=useState(true);
  const[notFound,setNotFound]=useState(false);
  const[step,setStep]=useState<"time"|"form"|"done">("time");
  const[sessionId,setSessionId]=useState("");
  const[busy,setBusy]=useState<BusySlot[]>([]);
  const[month,setMonth]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1);});
  const[pickedDate,setPickedDate]=useState("");
  const[pickedSlot,setPickedSlot]=useState<Slot|null>(null);
  const[answers,setAnswers]=useState<Record<string,any>>({});
  const[touched,setTouched]=useState(false);
  const[submitting,setSubmitting]=useState(false);
  const[uploading,setUploading]=useState<Record<string,boolean>>({});
  const[err,setErr]=useState("");
  const trackedView=useRef(false);

  const detectedTz=useMemo(()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||"Europe/Moscow";}catch{return"Europe/Moscow";}},[]);
  const[selectedTz,setSelectedTz]=useState(()=>{try{return localStorage.getItem("vizzy_form_tz")||"Europe/Moscow";}catch{return"Europe/Moscow";}});
  const timeZoneOptions=useMemo(()=>Array.from(new Set(["Europe/Moscow",detectedTz,...TIME_ZONES])),[detectedTz]);
  const visitorTz=selectedTz;
  useEffect(()=>{params.then(p=>setSlug(p.slug));setSessionId(getSessionId());},[params]);
  useEffect(()=>{try{localStorage.setItem("vizzy_form_tz",selectedTz);}catch{}},[selectedTz]);
  const changeTimeZone=(tz:string)=>{
    setSelectedTz(tz);
    setPickedDate("");
    setPickedSlot(null);
    const parts=zonedParts(new Date(),tz);
    setMonth(new Date(Number(parts.year),Number(parts.month)-1,1));
  };

  useEffect(()=>{
    if(!slug)return;
    (async()=>{
      setLoading(true);setNotFound(false);
      const{data,error}=await supabase.from("forms").select("*").eq("slug",slug).eq("is_active",true).maybeSingle();
      if(error||!data){setNotFound(true);setLoading(false);return;}
      const loaded=data as FormRow;setForm(loaded);
      if(!loaded.booking?.enabled)setStep("form");
      const horizon=Math.max(7,loaded.booking?.horizon_days||30);
      const from=new Date(Date.now()-3*864e5).toISOString();
      const to=new Date(Date.now()+(horizon+4)*864e5).toISOString();
      const busyRes=await supabase.rpc("get_vizzy_form_busy_slots",{p_slug:slug,p_from:from,p_to:to});
      setBusy((busyRes.data||[]) as BusySlot[]);
      setLoading(false);
    })();
  },[slug]);

  useEffect(()=>{
    if(!form||!sessionId||trackedView.current)return;trackedView.current=true;
    supabase.rpc("track_vizzy_form_event",{
      p_slug:form.slug,p_session_id:sessionId,p_event:"view",
      p_source_url:location.href,p_referrer:document.referrer||null,p_user_agent:navigator.userAgent,p_visitor_tz:visitorTz,
    }).then(()=>{});
  },[form,sessionId,visitorTz]);

  const cfg=form?.booking;
  const accent=form?.accent_color&&/^#[0-9a-f]{6}$/i.test(form.accent_color)?form.accent_color:"#2F6BFF";
  const visibleQuestions=useMemo(()=>(form?.questions||[]).filter(q=>!q.hidden),[form]);

  const slotMap=useMemo(()=>{
    const map:Record<string,Slot[]>={};
    if(!cfg?.enabled)return map;
    const ownerTz=cfg.tz||"Europe/Moscow";
    const ownerToday=ymdInZone(new Date(),ownerTz);
    const now=Date.now();const minStart=now+Math.max(0,cfg.lead_hours||0)*3600e3;
    const duration=Math.max(5,cfg.duration||45);const stepM=Math.max(5,duration+Math.max(0,cfg.buffer||0));
    const busyMs=busy.map(b=>{const s=new Date(b.start_at).getTime();let e=new Date(b.end_at).getTime();if(!Number.isFinite(e)||e<=s)e=s+duration*60000;return{s,e,ownerDate:ymdInZone(new Date(s),ownerTz)};});
    const perOwner:Record<string,number>={};busyMs.forEach(b=>{perOwner[b.ownerDate]=(perOwner[b.ownerDate]||0)+1;});
    for(let i=0;i<=Math.max(1,cfg.horizon_days||30);i++){
      const ownerDate=addDaysYmd(ownerToday,i);
      if(!(cfg.days||[]).includes(isoDowYmd(ownerDate)))continue;
      if((cfg.exceptions||[]).includes(ownerDate))continue;
      if((cfg.max_per_day||0)>0&&(perOwner[ownerDate]||0)>=cfg.max_per_day)continue;
      const fromM=toMin(cfg.from),toM=toMin(cfg.to);
      for(let m=fromM;m+duration<=toM;m+=stepM){
        const start=zonedLocalToUtc(ownerDate,toHHMM(m),ownerTz);const startMs=start.getTime();const endMs=startMs+duration*60000;
        if(startMs<minStart)continue;
        if(busyMs.some(b=>b.s<endMs&&b.e>startMs))continue;
        const visitorDate=ymdInZone(start,visitorTz);const visitorTime=timeInZone(start,visitorTz);
        (map[visitorDate]=map[visitorDate]||[]).push({startIso:start.toISOString(),visitorDate,visitorTime,ownerDate});
      }
    }
    Object.values(map).forEach(a=>a.sort((x,y)=>x.startIso.localeCompare(y.startIso)));
    return map;
  },[cfg,busy,visitorTz]);

  const monthGrid=useMemo(()=>{
    const y=month.getFullYear(),m=month.getMonth();const first=new Date(y,m,1);const lead=(first.getDay()+6)%7;const days=new Date(y,m+1,0).getDate();
    const cells:(string|null)[]=Array(lead).fill(null);for(let d=1;d<=days;d++)cells.push(`${y}-${pad(m+1)}-${pad(d)}`);return cells;
  },[month]);

  const requiredOk=()=>{
    for(const q of visibleQuestions){if(!q.required)continue;const v=answers[q.id];if(Array.isArray(v)){if(!v.length)return false;}else if(v===null||v===undefined||String(v).trim()==="")return false;}
    return true;
  };
  const answerText=(q?:Question)=>{
    if(!q)return "";
    const value=answers[q.id];
    if(Array.isArray(value))return value.join(", ");
    return value===null||value===undefined?"":String(value).trim();
  };
  const contactName=()=>{
    const q=visibleQuestions.find(q=>/имя|name/i.test(q.label))||visibleQuestions.find(q=>q.type==="text");
    return answerText(q)||"Новый лид";
  };
  const contactEmail=()=>{
    const q=visibleQuestions.find(q=>q.type==="email"||/e-?mail|почт/i.test(q.label));
    const value=answerText(q);
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)?value:`${sessionId.replace(/[^a-zA-Z0-9]/g,"")}@form.vizzy.local`;
  };
  const contactPhone=()=>{
    const q=visibleQuestions.find(q=>q.type==="phone"||/телефон|phone/i.test(q.label));
    return answerText(q);
  };
  const fieldError=(q:Question)=>{if(!touched||!q.required)return"";const v=answers[q.id];return(Array.isArray(v)?v.length===0:v===null||v===undefined||String(v).trim()==="")?"Заполните обязательное поле":"";};

  const chooseSlot=(slot:Slot)=>{
    setPickedSlot(slot);setStep("form");setErr("");
    supabase.rpc("track_vizzy_form_event",{p_slug:slug,p_session_id:sessionId,p_event:"start",p_source_url:location.href,p_referrer:document.referrer||null,p_user_agent:navigator.userAgent,p_visitor_tz:visitorTz}).then(()=>{});
  };

  const uploadFile=async(questionId:string,file:File)=>{
    if(!form||!sessionId)return;setUploading(p=>({...p,[questionId]:true}));setErr("");
    try{
      const fd=new FormData();fd.append("file",file);fd.append("slug",form.slug);fd.append("session_id",sessionId);
      const res=await fetch("/api/forms/upload",{method:"POST",body:fd});const data=await res.json();
      if(!res.ok)throw new Error(data?.error||"Upload failed");
      setAnswers(a=>({...a,[questionId]:data}));
    }catch(e:any){setErr(e?.message?.includes("10 MB")?"Файл должен быть меньше 10 МБ.":"Не удалось загрузить файл. Попробуйте ещё раз.");}
    setUploading(p=>({...p,[questionId]:false}));
  };

  const submit=async()=>{
    setTouched(true);setErr("");
    if(!form||submitting||!requiredOk())return;
    if(cfg?.enabled&&!pickedSlot){setErr("Сначала выберите дату и время.");setStep("time");return;}
    setSubmitting(true);
    const{data,error}=await supabase.rpc("submit_vizzy_form_booking",{
      p_slug:form.slug,p_session_id:sessionId,p_name:contactName(),p_email:contactEmail(),p_phone:contactPhone(),
      p_answers:answers,p_start_at:pickedSlot?.startIso||null,
      p_source:document.referrer||"direct",p_page_url:location.href,p_visitor_tz:visitorTz,
    });
    if(error){
      const msg=String(error.message||"");
      if(msg.includes("slot_taken")||msg.includes("daily_limit_reached")){setErr("Это время только что заняли. Выберите другой слот.");setStep("time");setPickedSlot(null);}
      else if(msg.includes("required_answer_missing"))setErr("Проверьте обязательные поля.");
      else if(msg.includes("email_invalid"))setErr("Проверьте email.");
      else setErr("Не удалось подтвердить запись. Данные не потеряны — попробуйте ещё раз.");
      console.error("Vizzy Form submit failed",error);
    }else if(data){setStep("done");window.scrollTo({top:0,behavior:"smooth"});}
    setSubmitting(false);
  };

  const inputStyle:React.CSSProperties={width:"100%",height:44,padding:"0 13px",border:"1px solid var(--vf-border)",borderRadius:8,fontSize:14,fontWeight:400,outline:"none",background:"var(--vf-input)",color:"var(--vf-text)",fontFamily:"inherit"};
  const labelStyle:React.CSSProperties={display:"block",fontSize:12,fontWeight:500,color:"var(--vf-muted-strong)",marginBottom:7};

  if(loading)return(
    <div className="vf-page vf-loading-page">
      <style>{`
        @keyframes vfVizzyBounce{
          0%,100%{transform:translateY(0) scale(1)}
          45%{transform:translateY(-14px) scale(1.025)}
          70%{transform:translateY(0) scale(.985)}
        }
        @keyframes vfVizzyShadow{
          0%,100%{transform:scaleX(1);opacity:.22}
          45%{transform:scaleX(.72);opacity:.10}
          70%{transform:scaleX(1.05);opacity:.24}
        }
        .vf-loading-page{
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:20px;
        }
        .vf-loading-wrap{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:16px;
        }
        .vf-loading-logo{
          width:76px;
          height:76px;
          object-fit:cover;
          border-radius:17px;
          display:block;
          animation:vfVizzyBounce 1.15s cubic-bezier(.45,.05,.55,.95) infinite;
          will-change:transform;
        }
        .vf-loading-shadow{
          width:54px;
          height:8px;
          border-radius:50%;
          background:rgba(255,255,255,.18);
          filter:blur(5px);
          animation:vfVizzyShadow 1.15s cubic-bezier(.45,.05,.55,.95) infinite;
        }
        @media(max-width:640px){
          .vf-loading-logo{width:66px;height:66px;border-radius:15px}
          .vf-loading-shadow{width:48px}
        }
        @media(prefers-reduced-motion:reduce){
          .vf-loading-logo,.vf-loading-shadow{animation:none}
        }
      `}</style>
      <div className="vf-loading-wrap" aria-label="Загрузка формы">
        <img className="vf-loading-logo" src="/logo.png" alt="Vizzy"/>
        <div className="vf-loading-shadow"/>
      </div>
    </div>
  );
  if(notFound||!form)return<div className="vf-page"><div className="vf-unavailable"><div className="vf-unavailable-title">Форма недоступна</div><div>Ссылка могла устареть или запись временно закрыта.</div></div></div>;

  const selectedDateLabel=pickedSlot?`${Number(pickedSlot.visitorDate.slice(8,10))} ${MONTHS_GEN[Number(pickedSlot.visitorDate.slice(5,7))-1]} ${pickedSlot.visitorDate.slice(0,4)}, ${pickedSlot.visitorTime}`:"";

  return <div className="vf-page" style={{"--vf-accent":accent} as React.CSSProperties}>
    <style>{`
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;350;400;450;500;600&display=swap");
      :root{color-scheme:light dark}.vf-page{--vf-bg:#f5f6f8;--vf-panel:#fff;--vf-panel-soft:#fafafa;--vf-input:#fff;--vf-text:#172033;--vf-muted:#7c8492;--vf-muted-strong:#4f5968;--vf-border:#e2e5ea;min-height:100vh;background:var(--vf-bg);color:var(--vf-text);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-weight:300;letter-spacing:-.006em;padding:28px;display:flex;box-sizing:border-box;overflow-x:hidden}.vf-page *{box-sizing:border-box;min-width:0}.vf-shell{margin:auto;width:min(1180px,100%);background:var(--vf-panel);border:1px solid var(--vf-border);border-radius:10px;box-shadow:0 10px 32px rgba(16,24,40,.06);overflow:hidden;display:grid;grid-template-columns:300px minmax(0,1fr)}.vf-info{padding:34px 30px;border-right:1px solid var(--vf-border);background:var(--vf-panel-soft);min-width:0}.vf-main{padding:34px 36px;min-width:0}.vf-time-grid{display:grid;grid-template-columns:minmax(360px,1fr) 220px;gap:34px;align-items:start}.vf-calendar{min-width:0}.vf-slots{min-width:0}.vf-day{aspect-ratio:1;border:0;border-radius:50%;background:transparent;color:var(--vf-muted);font-size:13px;font-weight:350;cursor:default}.vf-day.available{cursor:pointer;color:var(--vf-accent);background:color-mix(in srgb,var(--vf-accent) 8%,transparent);font-weight:400}.vf-day.selected{background:var(--vf-accent);color:#fff}.vf-slot{width:100%;height:46px;border:1px solid color-mix(in srgb,var(--vf-accent) 68%,var(--vf-border));border-radius:8px;background:transparent;color:var(--vf-accent);font-size:14px;font-weight:400;cursor:pointer}.vf-slot:hover{background:color-mix(in srgb,var(--vf-accent) 7%,transparent)}.vf-fields{display:grid;grid-template-columns:1fr 1fr;gap:16px}.vf-field.full{grid-column:1/-1;max-width:100%;overflow:hidden}.vf-field input,.vf-field textarea,.vf-field select{max-width:100%}.vf-error{font-size:12px;color:#d14343;margin-top:6px}.vf-primary{max-width:100%;height:46px;border:0;border-radius:8px;background:var(--vf-accent);color:#fff;font-size:14px;font-weight:400;padding:0 20px;cursor:pointer}.vf-primary:disabled{opacity:.45;cursor:not-allowed}.vf-secondary{height:38px;border:1px solid var(--vf-border);border-radius:8px;background:transparent;color:var(--vf-muted-strong);font-size:13px;padding:0 12px;cursor:pointer}.vf-loader,.vf-unavailable{margin:auto;color:var(--vf-muted);font-size:14px}.vf-unavailable{text-align:center;padding:36px}.vf-unavailable-title{font-size:19px;color:var(--vf-text);font-weight:400;margin-bottom:8px}.vf-radio{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--vf-muted-strong);cursor:pointer;padding:7px 0}.vf-check-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px 14px}.vf-scale{display:grid;grid-template-columns:repeat(10,1fr);gap:6px}.vf-scale button{height:36px;border-radius:7px;border:1px solid var(--vf-border);background:transparent;color:var(--vf-muted-strong);cursor:pointer}.vf-scale button.on{background:var(--vf-accent);border-color:var(--vf-accent);color:#fff}.vf-media{width:100%;max-height:310px;object-fit:cover;border-radius:10px;border:1px solid var(--vf-border);margin-top:18px}.vf-video{width:100%;aspect-ratio:16/9;border:0;border-radius:10px;margin-top:18px;background:#000;display:block;object-fit:contain}.vf-logo{display:inline-flex;align-items:center;margin-bottom:22px}.vf-logo-img{width:42px;height:42px;display:block;object-fit:cover;border-radius:10px;overflow:hidden}.vf-logo-text{display:none}.vf-footer{margin-top:28px;padding-top:18px;border-top:1px solid var(--vf-border);font-size:11px;color:var(--vf-muted);display:flex;align-items:center;justify-content:space-between;gap:12px}.vf-brand{font-weight:400;letter-spacing:.08em;color:var(--vf-muted-strong)}.vf-tz-wrap{margin-top:22px;padding-top:18px;border-top:1px solid var(--vf-border)}.vf-tz-label{font-size:11px;color:var(--vf-muted);margin-bottom:8px}.vf-tz-select{width:100%;height:42px;border:1px solid var(--vf-border);border-radius:8px;background:var(--vf-input);color:var(--vf-text);padding:0 12px;font:350 12.5px Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;outline:none}.vf-tz-note{font-size:11.5px;color:var(--vf-muted);line-height:1.55;margin-top:9px}
      @media(prefers-color-scheme:dark){.vf-page{--vf-bg:#0b0b0c;--vf-panel:#151516;--vf-panel-soft:#111112;--vf-input:#1b1b1d;--vf-text:#ececef;--vf-muted:#8a8a92;--vf-muted-strong:#b7b7bd;--vf-border:rgba(255,255,255,.09)}.vf-shell{box-shadow:0 18px 48px rgba(0,0,0,.35)}}
      @media(max-width:900px){.vf-page{padding:14px}.vf-shell{margin:auto;width:100%}.vf-shell{grid-template-columns:1fr}.vf-info{border-right:0;border-bottom:1px solid var(--vf-border);padding:24px}.vf-main{padding:24px}.vf-time-grid{grid-template-columns:1fr}.vf-slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.vf-slots .vf-slot{margin:0!important}}
      @media(max-width:620px){.vf-page{padding:0;background:var(--vf-panel);display:block}.vf-shell{width:100%;margin:0;overflow:hidden}.vf-shell{border-radius:0;border-left:0;border-right:0;box-shadow:none}.vf-info,.vf-main{padding:20px}.vf-fields{grid-template-columns:1fr}.vf-field.full{grid-column:auto}.vf-slots{grid-template-columns:repeat(2,1fr)}.vf-check-grid{grid-template-columns:1fr}.vf-scale{grid-template-columns:repeat(5,minmax(0,1fr))}.vf-main>div{max-width:100%}.vf-secondary{white-space:nowrap}.vf-footer{flex-wrap:wrap}.vf-tz-select{font-size:12px}.vf-time-grid{gap:22px}}@media(max-width:420px){.vf-info,.vf-main{padding:18px 16px}.vf-slots{grid-template-columns:1fr}.vf-scale{grid-template-columns:repeat(5,minmax(0,1fr))}.vf-day{font-size:12px}.vf-primary{width:100%}}
    `}</style>

    <div className="vf-shell">
      <aside className="vf-info">
        <div className="vf-logo" aria-label="Vizzy"><img className="vf-logo-img" src="/logo.png" alt="Vizzy"/></div>
        <h1 style={{fontSize:26,lineHeight:1.18,fontWeight:590,letterSpacing:"-.025em",margin:"0 0 18px"}}>{form.title}</h1>
        {cfg?.enabled&&<div style={{display:"flex",flexDirection:"column",gap:11,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:9,fontSize:13,color:"var(--vf-muted-strong)"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>{cfg.duration} минут</div>
          <div style={{display:"flex",alignItems:"center",gap:9,fontSize:13,color:"var(--vf-muted-strong)"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>{zoneLabel(visitorTz)}</div>
          {pickedSlot&&<div style={{display:"flex",alignItems:"center",gap:9,fontSize:13,color:"var(--vf-muted-strong)"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>{selectedDateLabel}</div>}
        </div>}
        {form.description&&<div style={{fontSize:13.5,lineHeight:1.65,color:"var(--vf-muted-strong)",whiteSpace:"pre-wrap"}}>{form.description}</div>}
        <div className="vf-footer"><span>Защищённая запись</span><img src="/logo.png" alt="Vizzy" style={{width:24,height:24,borderRadius:6,objectFit:"cover"}}/></div>
      </aside>

      <main className="vf-main">
        {step==="time"&&cfg?.enabled&&<>
          <div style={{fontSize:22,fontWeight:580,letterSpacing:"-.02em",marginBottom:26}}>Выберите дату и время</div>
          <div className="vf-time-grid">
            <section className="vf-calendar">
              <div style={{display:"grid",gridTemplateColumns:"36px 1fr 36px",alignItems:"center",marginBottom:18}}>
                <button className="vf-secondary" aria-label="Предыдущий месяц" onClick={()=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))} style={{padding:0}}>‹</button>
                <div style={{textAlign:"center",fontSize:14,fontWeight:600}}>{MONTHS[month.getMonth()]} {month.getFullYear()}</div>
                <button className="vf-secondary" aria-label="Следующий месяц" onClick={()=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))} style={{padding:0}}>›</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,marginBottom:7}}>{WD_SHORT.map(w=><div key={w} style={{textAlign:"center",fontSize:11,color:"var(--vf-muted)",padding:"5px 0"}}>{w}</div>)}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>{monthGrid.map((date,i)=>{
                if(!date)return<div key={`e-${i}`}/>;const available=(slotMap[date]||[]).length>0;const selected=pickedDate===date;
                return<button key={date} disabled={!available} className={`vf-day ${available?"available":""} ${selected?"selected":""}`} onClick={()=>setPickedDate(date)}>{Number(date.slice(8,10))}</button>;
              })}</div>
              <div className="vf-tz-wrap"><div className="vf-tz-label">Часовой пояс</div><select className="vf-tz-select" value={selectedTz} onChange={e=>changeTimeZone(e.target.value)}>{timeZoneOptions.map(tz=><option key={tz} value={tz}>{zoneLabel(tz)}</option>)}</select><div className="vf-tz-note">Свободное время пересчитывается под выбранный пояс. В системе владельца запись сохраняется в часовом поясе Europe/Moscow.</div></div>
            </section>
            <section className="vf-slots">
              <div style={{fontSize:13,fontWeight:550,marginBottom:12,minHeight:20}}>{pickedDate?`${Number(pickedDate.slice(8,10))} ${MONTHS_GEN[Number(pickedDate.slice(5,7))-1]}`:"Выберите доступный день"}</div>
              {pickedDate?(slotMap[pickedDate]||[]).map(s=><button key={s.startIso} className="vf-slot" onClick={()=>chooseSlot(s)} style={{marginBottom:9}}>{s.visitorTime}</button>):<div style={{fontSize:12.5,color:"var(--vf-muted)",lineHeight:1.55}}>После выбора даты здесь появятся свободные интервалы.</div>}
              {pickedDate&&(slotMap[pickedDate]||[]).length===0&&<div style={{fontSize:12.5,color:"var(--vf-muted)"}}>Свободного времени нет.</div>}
            </section>
          </div>
        </>}

        {step==="form"&&<>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14,marginBottom:24}}>
            <div><div style={{fontSize:22,fontWeight:400,letterSpacing:"-.02em"}}>Заполните форму</div></div>
            {cfg?.enabled&&<button className="vf-secondary" onClick={()=>setStep("time")}>Изменить время</button>}
          </div>
          {pickedSlot&&<div style={{padding:"11px 13px",border:"1px solid var(--vf-border)",borderRadius:8,background:"var(--vf-panel-soft)",fontSize:13,color:"var(--vf-muted-strong)",marginBottom:20}}>Выбрано: <b style={{fontWeight:600,color:"var(--vf-text)"}}>{selectedDateLabel}</b></div>}
          <div className="vf-fields">
            {visibleQuestions.length===0&&<div className="vf-field full" style={{padding:"18px",border:"1px solid var(--vf-border)",borderRadius:8,color:"var(--vf-muted)",fontSize:13}}>В этой форме пока нет вопросов.</div>}
            {visibleQuestions.map(q=>{
              const error=fieldError(q);const opts=(q.options||[]).filter(Boolean);const cls="vf-field full";
              return<div key={q.id} className={cls}>
                <label style={labelStyle}>{q.label}{q.required&&" *"}</label>
                {q.help_text&&<div style={{fontSize:11.5,color:"var(--vf-muted)",margin:"-2px 0 8px",lineHeight:1.5}}>{q.help_text}</div>}
                {q.type==="textarea"?<textarea value={answers[q.id]||""} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} placeholder={q.placeholder||""} rows={4} style={{...inputStyle,height:"auto",minHeight:104,padding:"11px 13px",resize:"vertical"}}/>
                :q.type==="select"?<select value={answers[q.id]||""} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} style={inputStyle}><option value="">Выберите вариант</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
                :q.type==="radio"?<div>{opts.map(o=><label className="vf-radio" key={o}><input type="radio" name={q.id} checked={answers[q.id]===o} onChange={()=>setAnswers(a=>({...a,[q.id]:o}))} style={{accentColor:accent}}/><span>{o}</span></label>)}</div>
                :q.type==="checkbox"||q.type==="multi_select"?<div className="vf-check-grid">{opts.map(o=>{const arr:string[]=Array.isArray(answers[q.id])?answers[q.id]:[];return<label className="vf-radio" key={o}><input type="checkbox" checked={arr.includes(o)} onChange={()=>setAnswers(a=>({...a,[q.id]:arr.includes(o)?arr.filter(x=>x!==o):[...arr,o]}))} style={{accentColor:accent}}/><span>{o}</span></label>;})}</div>
                :q.type==="scale"?<div className="vf-scale">{Array.from({length:10},(_,i)=>i+1).map(n=><button type="button" key={n} className={answers[q.id]===n?"on":""} onClick={()=>setAnswers(a=>({...a,[q.id]:n}))}>{n}</button>)}</div>
                :q.type==="file"?<div><label style={{height:44,border:"1px dashed var(--vf-border)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12.5,color:"var(--vf-muted-strong)",cursor:"pointer",background:"var(--vf-panel-soft)"}}>{uploading[q.id]?"Загружаем…":answers[q.id]?.name?`Файл: ${answers[q.id].name}`:"Выбрать файл до 10 МБ"}<input type="file" style={{display:"none"}} disabled={!!uploading[q.id]} onChange={e=>{const f=e.target.files?.[0];if(f)uploadFile(q.id,f);}}/></label>{answers[q.id]?.name&&<button type="button" onClick={()=>setAnswers(a=>({...a,[q.id]:null}))} style={{marginTop:7,border:0,background:"none",color:"var(--vf-muted)",fontSize:11.5,cursor:"pointer",padding:0}}>Удалить файл</button>}</div>
                :<input style={inputStyle} type={q.type==="email"?"email":q.type==="phone"?"tel":q.type==="number"?"number":q.type==="date"?"date":"text"} value={answers[q.id]??""} onChange={e=>setAnswers(a=>({...a,[q.id]:q.type==="number"&&e.target.value!==""?Number(e.target.value):e.target.value}))} placeholder={q.placeholder||""}/>}
                {error&&<div className="vf-error">{error}</div>}
              </div>;
            })}
          </div>
          {err&&<div style={{marginTop:16,padding:"11px 13px",borderRadius:8,border:"1px solid rgba(209,67,67,.25)",background:"rgba(209,67,67,.07)",fontSize:13,color:"#d14343"}}>{err}</div>}
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:22}}><button className="vf-primary" onClick={submit} disabled={submitting}>{submitting?"Подтверждаем…":cfg?.enabled?"Подтвердить запись":"Отправить форму"}</button></div>
        </>}

        {step==="done"&&<div style={{maxWidth:620,margin:"0 auto",textAlign:"center",padding:"20px 0"}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:`color-mix(in srgb,${accent} 12%,transparent)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",color:accent,fontSize:23}}>✓</div>
          <div style={{fontSize:24,fontWeight:590,letterSpacing:"-.02em",marginBottom:9}}>{form.completion_title||"Запись подтверждена"}</div>
          {form.completion_subtitle&&<div style={{fontSize:14,color:"var(--vf-muted-strong)",lineHeight:1.65,marginBottom:10}}>{form.completion_subtitle}</div>}
          {form.completion_text&&<div style={{fontSize:13.5,color:"var(--vf-muted)",lineHeight:1.7,whiteSpace:"pre-wrap",marginTop:12}}>{form.completion_text}</div>}
          {pickedSlot&&<div style={{marginTop:18,padding:"11px 14px",borderRadius:8,background:"var(--vf-panel-soft)",border:"1px solid var(--vf-border)",fontSize:13,color:"var(--vf-muted-strong)"}}>{selectedDateLabel} · {visitorTz}</div>}
          {safeUrl(form.completion_image_url||"")&&<img className="vf-media" src={safeUrl(form.completion_image_url||"")} alt=""/>}
          {safeUrl(form.completion_video_url||"")&&(isDirectVideo(form.completion_video_url||"")
            ?<video className="vf-video" src={safeUrl(form.completion_video_url||"")} controls playsInline preload="metadata"/>
            :<iframe className="vf-video" src={safeUrl(form.completion_video_url||"")} title="Видео" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>)}
          {safeUrl(form.completion_url||"")&&<a href={safeUrl(form.completion_url||"")} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",height:44,padding:"0 22px",borderRadius:8,background:accent,color:"#fff",textDecoration:"none",fontSize:14,fontWeight:600,marginTop:22}}>{form.completion_btn_label||"Перейти"}</a>}
        </div>}
      </main>
    </div>
  </div>;
}
