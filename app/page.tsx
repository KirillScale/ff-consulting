"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

/* ============ CONSTANTS ============ */
const C = {
  bg:"#F5F7FA",w:"#FFFFFF",a:"#2563EB",ah:"#1D4ED8",dk:"#0F1E40",da:"#1E3A5F",
  t1:"#111827",t2:"#6B7280",bd:"#E5E7EB",g:"#10B981",r:"#EF4444",y:"#F59E0B",
  sh:"0 2px 12px rgba(0,0,0,0.06)",ib:"#F9FAFB",pk:"#EC4899",lb:"#06B6D4"
};
const PLATS=[{id:"instagram",label:"Instagram",color:C.pk},{id:"telegram",label:"Telegram",color:C.a},{id:"youtube",label:"YouTube",color:C.r},{id:"vk",label:"VK",color:C.lb},{id:"other",label:"Другое",color:C.t2}];
const CTYPES=["Пост","Reels","Stories","Текст","Видео","Другое"];
const CSTATS=[{id:"idea",label:"Идея",color:C.t2},{id:"progress",label:"В работе",color:C.y},{id:"ready",label:"Готово",color:C.a},{id:"published",label:"Опубликовано",color:C.g}];
const STAGES_DEFAULT=[{id:"new",label:"Новый",color:C.a},{id:"contact",label:"Взаимодействовали",color:"#8B5CF6"},{id:"call",label:"Созвон",color:C.y},{id:"closed",label:"Закрыт",color:C.g},{id:"rejected",label:"Отказ",color:C.r}];
const SRCS=["Instagram","Telegram","YouTube","Сайт","Рекомендация","Реклама","Другое"];
const TASK_STATUS=[{id:"todo",label:"Не начата",color:C.t2},{id:"inprogress",label:"В процессе",color:C.y},{id:"done",label:"Выполнена",color:C.g}];
const CALL_GOALS=["Созвон с командой","Созвон с лидом","Созвон с клиентом","Своя цель"];
// NAV grouped structure
const NAV_GROUPS=[
  {
    items:[
      {id:"dashboard",label:"Dashboard",ic:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"},
      {id:"strategy",label:"Стратегия роста",ic:"M5 3l3.057 7.134L2 16h5.5L12 21l4.5-5H22l-6.057-5.866L19 3l-7 4-7-4z"},
    ]
  },
  {
    label:"Работа с лидами",
    items:[
      {id:"crm",label:"CRM",ic:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"},
      {id:"calls",label:"Созвоны",ic:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"},
    ]
  },
  {
    label:"Привлечение",
    items:[
      {id:"content",label:"Контент",ic:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"},
      {id:"media",label:"Медийность",ic:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"},
      {id:"ads",label:"Реклама",ic:"M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"},
    ]
  },
  {
    label:"VIZZY AI",
    items:[
      {id:"ai",label:"Kirill Scales AI",ic:"M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",accent:"#A78BFA"},
      {id:"script",label:"Vizzy Copy AI",ic:"M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",accent:"#FB923C"},
      {id:"product",label:"Vizzy Product AI",ic:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",accent:"#34D399"},
      {id:"stories",label:"Vizzy Stories AI",ic:"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",accent:"gradient"},
    ]
  },
  {
    label:"Остальное",
    items:[
      {id:"pnl",label:"P&L",ic:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
      {id:"tools",label:"Инструменты",ic:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"},
      {id:"links",label:"База ссылок",ic:"M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"},
    ]
  },
];
// Flat NAV for routing/mobile
const NAV=NAV_GROUPS.flatMap(g=>g.items);
const WD=["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const MR=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const MS=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const QUOTES=["Никто не придёт и не спасёт тебя. Либо ты встаёшь и делаешь, либо остаёшься там где ты есть.","Дисциплина - это выбор между тем чего ты хочешь сейчас и тем чего ты хочешь больше всего.","Ленивый человек всегда найдёт причину. Работающий человек всегда найдёт способ.","Боль временна. Результат остаётся. Выбирай что важнее.","Пока ты думаешь - кто-то делает. Пока ты делаешь - кто-то уже обогнал.","Жалобы - это налог который платят неудачники. Перестань платить.","Каждое утро ты выбираешь: строить своё или строить чужое. Третьего нет.","Никто не запомнит как ты устал. Все запомнят что ты сделал.","Успех - это не случайность. Это результат решений которые ты принимаешь каждый день.","Деньги не приходят к тем кто их ждёт. Они приходят к тем кто за ними идёт.","Мотивация приходит и уходит. Система остаётся. Строй систему.","Через год ты пожалеешь только об одном - что не начал сегодня."];

/* ============ HELPERS ============ */
const fmtDate = (d:Date) => WD[d.getDay()]+", "+d.getDate()+" "+MR[d.getMonth()]+" "+d.getFullYear();
const ds = (d:Date) => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today = () => ds(new Date());
const pCol = (p:string) => (PLATS.find(x=>x.id===p)||{color:C.t2}).color;
const pLbl = (p:string) => (PLATS.find(x=>x.id===p)||{label:p}).label;
const csCol = (s:string) => (CSTATS.find(x=>x.id===s)||{color:C.t2}).color;
const csLbl = (s:string) => (CSTATS.find(x=>x.id===s)||{label:s}).label;
const stCol = (s:string,stages:any[]) => (stages.find(x=>x.id===s)||{color:C.t2}).color;
const stLbl = (s:string,stages:any[]) => (stages.find(x=>x.id===s)||{label:s}).label;
const fmt$ = (n:number) => n.toLocaleString("ru-RU");
const tsCol = (s:string) => (TASK_STATUS.find(x=>x.id===s)||{color:C.t2}).color;
const tsLbl = (s:string) => (TASK_STATUS.find(x=>x.id===s)||{label:s}).label;
const nextStatus = (s:string) => s==="todo"?"inprogress":s==="inprogress"?"done":"todo";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Доброе утро";
  if (h >= 12 && h < 18) return "Добрый день";
  if (h >= 18 && h < 23) return "Добрый вечер";
  return "Доброй ночи";
};

const I = ({path,size=20,color="currentColor",sw=1.5}:{path:string,size?:number,color?:string,sw?:number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>
);
const iS:React.CSSProperties = {width:"100%",padding:"11px 14px",border:"1px solid "+C.bd,borderRadius:10,fontSize:14,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box",fontFamily:"'Montserrat',sans-serif"};
const Logo = ({s=22}:{s?:number}) => <img src="/logo.png" width={s} height={s} style={{objectFit:"contain",display:"block"}} alt="Vizzy"/>;
const Brand = ({size="md"}:{size?:string}) => {
  const sz:any={sm:{f:12,sub:8,gap:1},md:{f:15,sub:9,gap:2},lg:{f:20,sub:11,gap:3}};
  const s=sz[size]||sz.md;
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",lineHeight:1.2}}><span style={{fontSize:s.f,fontWeight:800,color:"#fff",letterSpacing:2}}>VIZZY</span><span style={{fontSize:s.sub,fontWeight:300,color:"rgba(255,255,255,0.6)",letterSpacing:1.5,marginTop:s.gap}}>by Kirill Scales</span></div>;
};
const Btn = ({children,onClick,primary=true,style:sx,disabled}:{children:React.ReactNode,onClick?:()=>void,primary?:boolean,style?:React.CSSProperties,disabled?:boolean}) => <button onClick={onClick} disabled={disabled} style={{padding:"10px 20px",background:primary?C.a:C.bg,color:primary?"#fff":C.t2,border:primary?"none":"1px solid "+C.bd,borderRadius:10,fontSize:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,...sx}}>{children}</button>;
const Tag = ({label,color}:{label:string,color:string}) => <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:color+"18",color}}>{label}</span>;
const Card = ({children,style:sx}:{children:React.ReactNode,style?:React.CSSProperties}) => <div style={{background:C.w,borderRadius:16,padding:24,boxShadow:C.sh,...sx}}>{children}</div>;

/* ============ SUPABASE DATA HOOK ============ */
function useTable(table:string, userId:string|null) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data: rows } = await supabase.from(table).select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setData(rows || []);
    setLoading(false);
  }, [table, userId]);

  useEffect(() => { load(); }, [load]);

  const add = async (row: any) => {
    const { data: inserted } = await supabase.from(table).insert({ ...row, user_id: userId }).select().single();
    if (inserted) setData(prev => [inserted, ...prev]);
    return inserted;
  };

  const update = async (id: string, updates: any) => {
    await supabase.from(table).update(updates).eq("id", id);
    setData(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const remove = async (id: string) => {
    await supabase.from(table).delete().eq("id", id);
    setData(prev => prev.filter(r => r.id !== id));
  };

  return { data, loading, add, update, remove, reload: load, setData };
}

/* ============ AUTH ============ */
function Auth({ onLogin }: { onLogin: (u: any) => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setErr(""); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) return setErr("Неверный email или пароль");
    if (data.user) onLogin(data.user);
  };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.dk},${C.da},${C.a})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Montserrat',sans-serif",padding:20}}>
      <div style={{background:C.w,borderRadius:24,padding:"48px 40px",width:"100%",maxWidth:420,boxShadow:"0 24px 80px rgba(0,0,0,0.25)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,background:C.dk,padding:"14px 28px",borderRadius:12}}>
            <Logo/><Brand size="lg"/>
          </div>
        </div>
        <div style={{fontSize:16,fontWeight:600,textAlign:"center",marginBottom:24,color:C.t1}}>Вход в платформу</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} style={iS}/>
          <input placeholder="Пароль" type="password" value={pw} onChange={e=>setPw(e.target.value)} style={iS} onKeyDown={e=>e.key==="Enter"&&login()}/>
          {err&&<div style={{background:"#FEF2F2",color:C.r,padding:"10px 14px",borderRadius:10,fontSize:13,fontWeight:500}}>{err}</div>}
          <Btn onClick={login} style={{width:"100%",padding:"14px 0",fontSize:15,marginTop:8,opacity:loading?0.6:1}}>
            {loading?"Вход...":"Войти"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ============ MOBILE HOOK ============ */
function useIsMobile(){
  const[m,setM]=useState(()=>typeof window!=="undefined"&&window.innerWidth<768);
  useEffect(()=>{
    const h=()=>setM(window.innerWidth<768);
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[]);
  return m;
}

/* ============ SIDEBAR (desktop) ============ */
const SB="#1F1F1F"; // Notion-style dark gray
const SB_H="#2F2F2F"; // hover
const SB_ACT="#3B3B3B"; // active bg

function Side({active,onNav,onLogout}:{active:string,onNav:(id:string)=>void,onLogout:()=>void}){
  const[c,sC]=useState(false);

  const getAccentColor=(n:any)=>{
    if((n as any).accent==="gradient")return null;
    return (n as any).accent||null;
  };

  const renderItem=(n:any)=>{
    const a=active===n.id;
    const accent=getAccentColor(n);
    const isGrad=(n as any).accent==="gradient";
    const iconColor=a?"#fff":accent||"rgba(255,255,255,0.55)";
    return <button key={n.id} onClick={()=>onNav(n.id)} title={c?n.label:undefined}
      style={{display:"flex",alignItems:"center",gap:9,padding:c?"8px 0":"6px 10px",justifyContent:c?"center":"flex-start",
        border:"none",borderRadius:6,cursor:"pointer",width:"100%",
        background:a?(accent?"transparent":SB_ACT):"transparent",
        position:"relative",overflow:"hidden",
        transition:"background 0.15s",
      }}
      onMouseEnter={e=>{if(!a)(e.currentTarget as HTMLElement).style.background=SB_H;}}
      onMouseLeave={e=>{if(!a)(e.currentTarget as HTMLElement).style.background="transparent";}}>
      {/* Active indicator */}
      {a&&<div style={{position:"absolute",left:0,top:"15%",bottom:"15%",width:3,borderRadius:"0 3px 3px 0",background:accent||"#fff"}}/>}
      {/* Gradient bg for stories */}
      {a&&isGrad&&<div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(134,239,172,0.12),rgba(167,139,250,0.12))",borderRadius:6}}/>}
      {/* Icon with accent */}
      <div style={{
        width:22,height:22,borderRadius:5,flexShrink:0,
        display:"flex",alignItems:"center",justifyContent:"center",
        background:a?(isGrad?"linear-gradient(135deg,#86EFAC,#A78BFA)":accent?accent+"22":"rgba(255,255,255,0.1)"):"transparent",
      }}>
        <I path={n.ic} size={13} color={isGrad&&a?"#fff":iconColor}/>
      </div>
      {!c&&<span style={{
        fontSize:12.5,fontWeight:a?600:400,
        color:a?(isGrad?"#86EFAC":accent||"#fff"):"rgba(255,255,255,0.75)",
        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,textAlign:"left",
      }}>{n.label}</span>}
    </button>;
  };

  return(
    <div style={{width:c?56:240,height:"100vh",background:SB,display:"flex",flexDirection:"column",
      transition:"width 0.25s ease",position:"fixed",left:0,top:0,zIndex:100,
      overflowX:"hidden",overflowY:"hidden",
      borderRight:"1px solid rgba(255,255,255,0.06)"}}>

      {/* Logo */}
      <div style={{padding:c?"16px 0":"14px 16px",display:"flex",alignItems:"center",gap:8,
        justifyContent:c?"center":"flex-start",
        borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <Logo s={22}/>
        {!c&&<div style={{display:"flex",flexDirection:"column",lineHeight:1.2}}>
          <span style={{fontSize:13,fontWeight:700,color:"#fff",letterSpacing:0.5}}>VIZZY</span>
          <span style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:0.5}}>by Kirill Scales</span>
        </div>}
      </div>

      {/* Nav groups */}
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"8px 8px 0"}}>
        {NAV_GROUPS.map((group,gi)=><div key={gi} style={{marginBottom:4}}>
          {/* Group label */}
          {group.label&&!c&&<div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.28)",
            padding:"10px 10px 4px",letterSpacing:0.8,textTransform:"uppercase"}}>
            {group.label}
          </div>}
          {/* Divider when collapsed */}
          {group.label&&c&&gi>0&&<div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"6px 8px"}}/>}
          {/* Items */}
          <div style={{display:"flex",flexDirection:"column",gap:1}}>
            {group.items.map(n=>renderItem(n))}
          </div>
        </div>)}
      </div>

      {/* Bottom */}
      <div style={{padding:"8px",borderTop:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <button onClick={()=>sC(!c)}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:c?"8px 0":"6px 10px",
            justifyContent:c?"center":"flex-start",border:"none",borderRadius:6,cursor:"pointer",
            background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:12,
            transition:"background 0.15s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=SB_H;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{c?<polyline points="9 18 15 12 9 6"/>:<polyline points="15 18 9 12 15 6"/>}</svg>
          {!c&&<span>Свернуть</span>}
        </button>
        <button onClick={onLogout}
          style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:c?"8px 0":"6px 10px",
            justifyContent:c?"center":"flex-start",border:"none",borderRadius:6,cursor:"pointer",
            background:"transparent",color:"rgba(255,255,255,0.3)",fontSize:12,marginTop:1,
            transition:"background 0.15s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=SB_H;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {!c&&<span>Выйти</span>}
        </button>
      </div>
    </div>
  );
}

/* ============ MOBILE NAV ============ */
// Shows top 5 most important nav items + "More" drawer
const MOB_NAV_PRIMARY=["dashboard","strategy","crm","calls","ai"];
function MobileNav({active,onNav,onLogout}:{active:string,onNav:(id:string)=>void,onLogout:()=>void}){
  const[drawerOpen,setDrawerOpen]=useState(false);
  const primary=NAV.filter(n=>MOB_NAV_PRIMARY.includes(n.id));
  const more=NAV.filter(n=>!MOB_NAV_PRIMARY.includes(n.id));

  return <>
    {/* Bottom nav bar */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.dk,zIndex:200,borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"stretch",height:60,paddingBottom:"env(safe-area-inset-bottom)"}}>
      {primary.map(n=>{
        const a=active===n.id;
        return <button key={n.id} onClick={()=>{onNav(n.id);setDrawerOpen(false);}}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,border:"none",background:"transparent",cursor:"pointer",padding:"8px 4px"}}>
          <I path={n.ic} size={20} color={a?C.a:"rgba(255,255,255,0.5)"}/>
          <span style={{fontSize:9,color:a?C.a:"rgba(255,255,255,0.5)",fontWeight:a?700:400,lineHeight:1}}>{n.label.split(" ")[0]}</span>
        </button>;
      })}
      {/* More button */}
      <button onClick={()=>setDrawerOpen(!drawerOpen)}
        style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,border:"none",background:"transparent",cursor:"pointer",padding:"8px 4px"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={drawerOpen?C.a:"rgba(255,255,255,0.5)"} strokeWidth="2"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>
        <span style={{fontSize:9,color:drawerOpen?C.a:"rgba(255,255,255,0.5)",fontWeight:400,lineHeight:1}}>Ещё</span>
      </button>
    </div>

    {/* Drawer overlay */}
    {drawerOpen&&<div style={{position:"fixed",inset:0,zIndex:190,background:"rgba(0,0,0,0.5)"}} onClick={()=>setDrawerOpen(false)}/>}

    {/* Drawer panel */}
    <div style={{position:"fixed",bottom:60,left:0,right:0,background:C.dk,zIndex:195,borderTop:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px 20px 0 0",transform:drawerOpen?"translateY(0)":"translateY(100%)",transition:"transform 0.3s ease",maxHeight:"70vh",overflowY:"auto",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div style={{padding:"12px 0 4px",textAlign:"center"}}>
        <div style={{width:36,height:4,background:"rgba(255,255,255,0.15)",borderRadius:2,margin:"0 auto"}}/>
      </div>
      <div style={{padding:"8px 16px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {more.map(n=>{
          const a=active===n.id;
          return <button key={n.id} onClick={()=>{onNav(n.id);setDrawerOpen(false);}}
            style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",border:"none",borderRadius:12,background:a?C.a:"rgba(255,255,255,0.07)",cursor:"pointer"}}>
            <I path={n.ic} size={18} color={a?"#fff":"rgba(255,255,255,0.7)"}/>
            <span style={{fontSize:13,color:a?"#fff":"rgba(255,255,255,0.7)",fontWeight:a?600:400,textAlign:"left",lineHeight:1.2}}>{n.label}</span>
          </button>;
        })}
        <button onClick={()=>{onLogout();setDrawerOpen(false);}}
          style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",border:"none",borderRadius:12,background:"rgba(239,68,68,0.15)",cursor:"pointer",gridColumn:"span 2"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span style={{fontSize:13,color:"#EF4444",fontWeight:500}}>Выйти</span>
        </button>
      </div>
    </div>
  </>;
}

const Head=({name,onMenuOpen}:{name:string,onMenuOpen?:()=>void})=>{
  const isMobile=useIsMobile();
  const greeting = getGreeting();
  const displayName = name && name !== "User" ? name : "";
  if(isMobile) return <div style={{height:56,background:C.dk,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",position:"sticky",top:0,zIndex:50}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <Logo s={20}/>
      <div style={{display:"flex",flexDirection:"column",lineHeight:1.15}}>
        <span style={{color:"#fff",fontSize:11,fontWeight:800,letterSpacing:1.5}}>VIZZY</span>
        <span style={{color:"rgba(255,255,255,0.4)",fontSize:8,letterSpacing:1}}>by Kirill Scales</span>
      </div>
    </div>
    <div style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.7)"}}>{greeting}{displayName?", "+displayName:""}</div>
  </div>;
  return <div style={{height:64,background:C.w,borderBottom:"1px solid "+C.bd,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",position:"sticky",top:0,zIndex:50}}>
    <div style={{fontSize:15,fontWeight:600}}>{greeting}{displayName?", "+displayName:""}</div>
    <div style={{display:"inline-flex",alignItems:"center",gap:10,background:C.dk,padding:"8px 20px",borderRadius:10}}><Logo s={16}/><div style={{display:"flex",flexDirection:"column",lineHeight:1.15}}><span style={{color:"#fff",fontSize:11,fontWeight:800,letterSpacing:1.5}}>VIZZY</span><span style={{color:"rgba(255,255,255,0.5)",fontSize:8,fontWeight:300,letterSpacing:1}}>by Kirill Scales</span></div></div>
    <div style={{fontSize:14,color:C.t2}}>{fmtDate(new Date())}</div>
  </div>;
};

const Placeholder=({title,ic}:{title:string,ic:string})=><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"calc(100vh - 180px)",gap:20}}><div style={{width:80,height:80,borderRadius:20,background:C.a+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><I path={ic} size={36} color={C.a} sw={1.2}/></div><div style={{fontSize:22,fontWeight:700}}>{title}</div><Card style={{padding:"12px 24px"}}><span style={{fontSize:14,color:C.t2}}>Раздел скоро будет доступен</span></Card></div>;

/* ============ MAIN APP ============ */
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id); }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id); }
      else { setUser(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("name,avatar_url").eq("id", uid).single();
    if (data?.name) setUserName(data.name);
    if (data?.avatar_url) setUserAvatar(data.avatar_url);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("dashboard");
  };

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,fontFamily:"'Montserrat',sans-serif"}}><div style={{fontSize:18,color:C.t2}}>Загрузка...</div></div>;
  if (!user) return <Auth onLogin={(u) => { setUser(u); loadProfile(u.id); }} />;

  const nav = NAV.find(n => n.id === page);

  return <AppLayout user={user} page={page} setPage={setPage} userName={userName} userAvatar={userAvatar} setUserAvatar={setUserAvatar} logout={logout} nav={nav}/>;
}

function AppLayout({user,page,setPage,userName,userAvatar,setUserAvatar,logout,nav}:any){
  const isMobile=useIsMobile();

  const pageContent=<>
    {page === "dashboard" && <DashPage userId={user.id} name={userName} avatar={userAvatar} onNav={setPage} onAvatarChange={async(url:string)=>{setUserAvatar(url);await supabase.from("profiles").upsert({id:user.id,avatar_url:url},{onConflict:"id"});}}/>}
    {page === "strategy" && <StrategyPage userId={user.id}/>}
    {page === "crm" && <CrmPage userId={user.id}/>}
    {page === "calls" && <CallsPage userId={user.id}/>}
    {page === "content" && <ContentPage userId={user.id}/>}
    {page === "pnl" && <PnlPage userId={user.id}/>}
    {page === "media" && <MediaPage userId={user.id}/>}
    {page === "ads" && <AdsPage userId={user.id}/>}
    {page === "calc" && <CalcPage/>}
    {page === "tools" && <ToolsPage/>}
    {page === "links" && <LinksPage userId={user.id}/>}
    {page === "files" && <FilesPage userId={user.id}/>}
    {page === "ai" && <AIPage/>}
    {page === "script" && <ScriptAIPage/>}
    {page === "product" && <ProductAIPage/>}
    {page === "stories" && <StoriesAIPage/>}
    {!["dashboard","strategy","crm","calls","content","pnl","media","ads","calc","tools","links","files","ai","script","product","stories"].includes(page) && nav && <Placeholder title={nav.label} ic={nav.ic}/>}
  </>;

  return (
    <div style={{fontFamily:"'Montserrat',-apple-system,BlinkMacSystemFont,sans-serif",background:C.bg,minHeight:"100vh",color:C.t1}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        *{box-sizing:border-box;}
        body{overflow-x:hidden;}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>

      {isMobile ? <>
        {/* Mobile layout */}
        <MobileNav active={page} onNav={setPage} onLogout={logout}/>
        <div style={{minHeight:"100vh",paddingBottom:80}}>
          <Head name={userName}/>
          <div style={{padding:"16px 16px 0"}}>
            {pageContent}
          </div>
        </div>
      </> : <>
        {/* Desktop layout */}
        <Side active={page} onNav={setPage} onLogout={logout}/>
        <div style={{marginLeft:240,minHeight:"100vh"}}>
          <Head name={userName}/>
          <div style={{padding:"28px 32px"}}>
            {pageContent}
          </div>
        </div>
      </>}
    </div>
  );
}

/* ============ DASHBOARD ============ */
function DonutChart({done,total,size=140}:{done:number,total:number,size?:number}){
  const[hover,setHover]=useState<string|null>(null);
  const r=54,cx=size/2,cy=size/2,stroke=16;
  const circ=2*Math.PI*r;
  const pct=total>0?Math.round(done/total*100):0;
  const doneFrac=total>0?done/total:0;
  return <div style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.bd} strokeWidth={stroke}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.a} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ*(1-doneFrac)} strokeLinecap="round"
        style={{transition:"stroke-dashoffset 0.6s ease"}}
        onMouseEnter={()=>setHover("done")} onMouseLeave={()=>setHover(null)}/>
    </svg>
    <div style={{position:"absolute",textAlign:"center",pointerEvents:"none"}}>
      {hover==="done"?<><div style={{fontSize:13,fontWeight:700,color:C.a}}>Выполнено</div><div style={{fontSize:12,color:C.t2}}>{done} из {total}</div></>
      :<><div style={{fontSize:22,fontWeight:800,color:C.a}}>{pct}%</div><div style={{fontSize:10,color:C.t2,marginTop:1}}>выполнено</div></>}
    </div>
  </div>;
}

// Simple inline SVG bar chart for P&L
function PnlBarChart({income,expense,width=280,height=80}:{income:number,expense:number,width?:number,height?:number}){
  const max=Math.max(income,expense,1);
  const iH=Math.max(4,Math.round(income/max*(height-20)));
  const eH=Math.max(4,Math.round(expense/max*(height-20)));
  const[hover,setHover]=useState<string|null>(null);
  const bw=42,gap=16,pad=20;
  const iX=pad,eX=pad+bw+gap;
  return <svg width={width} height={height} style={{overflow:"visible"}}>
    {/* Income bar */}
    <rect x={iX} y={height-20-iH} width={bw} height={iH} rx={6} fill={C.g} opacity={hover==="i"?1:0.8}
      style={{cursor:"pointer",transition:"opacity 0.15s"}}
      onMouseEnter={()=>setHover("i")} onMouseLeave={()=>setHover(null)}/>
    <text x={iX+bw/2} y={height-4} textAnchor="middle" fontSize="10" fill={C.t2}>Доход</text>
    {hover==="i"&&<g>
      <rect x={iX+bw/2-32} y={height-20-iH-24} width={64} height={20} rx={5} fill={C.dk}/>
      <text x={iX+bw/2} y={height-20-iH-10} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">+{fmt$(income)} ₽</text>
    </g>}
    {/* Expense bar */}
    <rect x={eX} y={height-20-eH} width={bw} height={eH} rx={6} fill={C.r} opacity={hover==="e"?1:0.8}
      style={{cursor:"pointer",transition:"opacity 0.15s"}}
      onMouseEnter={()=>setHover("e")} onMouseLeave={()=>setHover(null)}/>
    <text x={eX+bw/2} y={height-4} textAnchor="middle" fontSize="10" fill={C.t2}>Расход</text>
    {hover==="e"&&<g>
      <rect x={eX+bw/2-32} y={height-20-eH-24} width={64} height={20} rx={5} fill={C.dk}/>
      <text x={eX+bw/2} y={height-20-eH-10} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">-{fmt$(expense)} ₽</text>
    </g>}
    {/* Profit line */}
    <text x={eX+bw+16} y={height/2-4} fontSize="11" fill={income-expense>=0?C.g:C.r} fontWeight="700">{income-expense>=0?"+":""}{fmt$(income-expense)} ₽</text>
    <text x={eX+bw+16} y={height/2+10} fontSize="9" fill={C.t2}>прибыль</text>
  </svg>;
}

// Social media SVG icons
const IgSvg=({size=18}:{size?:number})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#igGrad)" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="url(#igGrad)" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C"/><defs><linearGradient id="igGrad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse"><stop stopColor="#F58529"/><stop offset="0.5" stopColor="#DD2A7B"/><stop offset="1" stopColor="#8134AF"/></linearGradient></defs></svg>;
const YtSvg=({size=18}:{size?:number})=><svg width={size} height={size} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#FF0000"/><path d="M19.59 7.35A2.5 2.5 0 0017.83 5.6C16.37 5.2 12 5.2 12 5.2s-4.37 0-5.83.4A2.5 2.5 0 004.41 7.35 26 26 0 004 12a26 26 0 00.41 4.65A2.5 2.5 0 006.17 18.4c1.46.4 5.83.4 5.83.4s4.37 0 5.83-.4a2.5 2.5 0 001.76-1.75A26 26 0 0020 12a26 26 0 00-.41-4.65z" fill="white"/><path d="M10 15.2l5.2-3.2-5.2-3.2v6.4z" fill="#FF0000"/></svg>;
const TgSvg=({size=18}:{size?:number})=><svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#29B6F6"/><path d="M5.5 11.8l11.5-4.4c.5-.2 1 .1.8.9l-2 9.2c-.1.6-.5.7-.9.5l-2.5-1.8-1.2 1.1c-.1.1-.3.2-.6.2l.2-2.6 4.8-4.3c.2-.2 0-.3-.3-.1L7.8 13.4 5.3 12.7c-.6-.2-.6-.6.2-.9z" fill="white"/></svg>;

function DashPage({userId,name,avatar,onNav,onAvatarChange}:{userId:string,name:string,avatar:string,onNav:(p:string)=>void,onAvatarChange:(url:string)=>void}){
  const leads = useTable("leads", userId);
  const pnl = useTable("pnl", userId);
  const kanban = useTable("kanban", userId);
  const goalTasks = useTable("goal_tasks", userId);
  const content = useTable("content", userId);
  const calls = useTable("calls", userId);
  const media = useTable("media", userId);
  const[avatarUploading,setAvatarUploading]=useState(false);
  const isMobile=useIsMobile();
  const td = today();
  const cm = td.substring(0,7);

  const uploadAvatar=async(file:File)=>{
    setAvatarUploading(true);
    try{
      const compressed=await new Promise<Blob>((resolve,reject)=>{
        const img=new Image();
        const obj=URL.createObjectURL(file);
        img.onload=()=>{
          const SIZE=256;
          const canvas=document.createElement("canvas");
          canvas.width=SIZE;canvas.height=SIZE;
          const ctx=canvas.getContext("2d")!;
          const s=Math.min(img.width,img.height);
          const ox=(img.width-s)/2,oy=(img.height-s)/2;
          ctx.drawImage(img,ox,oy,s,s,0,0,SIZE,SIZE);
          URL.revokeObjectURL(obj);
          canvas.toBlob(b=>b?resolve(b):reject(),"image/jpeg",0.85);
        };
        img.onerror=reject;img.src=obj;
      });
      const path=`${userId}/avatar.jpg`;
      await supabase.storage.from("files").upload(path,compressed,{upsert:true,contentType:"image/jpeg"});
      const{data}=supabase.storage.from("files").getPublicUrl(path);
      onAvatarChange(data.publicUrl+"?t="+Date.now());
    }catch(e){console.error(e);}
    finally{setAvatarUploading(false);}
  };

  const todayTasks = kanban.data.filter((t:any)=>t.date===td&&t.type!=="delegate");
  const todayGoalTasks = goalTasks.data.filter((t:any)=>t.date===td&&t.type!=="delegate");
  const seenIds = new Set(todayTasks.map((t:any)=>t.id));
  const allTodayTasks = [...todayTasks, ...todayGoalTasks.filter((t:any)=>!seenIds.has(t.id))];
  const doneTodayTasks = allTodayTasks.filter((t:any)=>t.status==="done"||t.done);

  const cI = pnl.data.filter((t:any)=>t.type==="income"&&t.date?.startsWith(cm)).reduce((s:number,t:any)=>s+(t.amount||0),0);
  const cE = pnl.data.filter((t:any)=>t.type==="expense"&&t.date?.startsWith(cm)).reduce((s:number,t:any)=>s+(t.amount||0),0);
  const cP = cI-cE;

  const latestMedia = useMemo(()=>{
    const sorted=[...media.data].sort((a:any,b:any)=>b.date?.localeCompare(a.date));
    return sorted[0]||null;
  },[media.data]);

  const upcomingCalls = useMemo(()=>{
    return calls.data
      .filter((c:any)=>c.date >= td)
      .sort((a:any,b:any)=>a.date===b.date?a.time_start.localeCompare(b.time_start):a.date.localeCompare(b.date))
      .slice(0,5);
  },[calls.data, td]);

  const minsUntilCall = (c:any) => {
    const now = new Date();
    const [h,m] = c.time_start.split(":").map(Number);
    const callTime = new Date(c.date);
    callTime.setHours(h, m, 0, 0);
    return Math.round((callTime.getTime() - now.getTime()) / 60000);
  };

  const callLabel = (c:any) => c.goal === "Своя цель" ? (c.custom_goal || "Созвон") : c.goal;

  return <>
    {/* Hero greeting with avatar */}
    <div style={{background:`linear-gradient(135deg,${C.dk},${C.da})`,borderRadius:16,padding:isMobile?"18px 20px":"28px 36px",marginBottom:isMobile?16:24,color:"#fff",display:"flex",alignItems:"center",gap:16}}>
      <label style={{cursor:"pointer",flexShrink:0}}>
        <div style={{width:isMobile?52:64,height:isMobile?52:64,borderRadius:"50%",border:"3px solid rgba(255,255,255,0.3)",overflow:"hidden",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {avatarUploading
            ? <div style={{width:20,height:20,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
            : avatar
            ? <img src={avatar} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="avatar"/>
            : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          }
        </div>
        <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadAvatar(e.target.files[0]);}}/>
      </label>
      <div>
        <div style={{fontSize:isMobile?18:24,fontWeight:700,marginBottom:4}}>{getGreeting()}{name?", "+name:""}</div>
        <div style={{fontSize:isMobile?12:14,opacity:0.6}}>Сегодня {fmtDate(new Date())}</div>
      </div>
    </div>

    {/* Stat cards — 2 cols mobile, 4 cols desktop */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16,marginBottom:isMobile?16:24}}>
      {[{l:"Задачи",v:allTodayTasks.filter((t:any)=>t.status!=="done"&&!t.done).length,c:C.a},{l:"Лиды",v:leads.data.length,c:C.g},{l:"Публикации",v:content.data.filter((x:any)=>x.status==="published").length,c:C.y},{l:"Прибыль",v:(cP>=0?"+":"")+fmt$(cP)+" ₽",c:cP>=0?C.g:C.r}].map((s,i)=><Card key={i} style={{padding:isMobile?"14px 16px":"22px 24px"}}>
        <div style={{fontSize:isMobile?22:28,fontWeight:700,marginBottom:4}}>{s.v}</div>
        <div style={{fontSize:isMobile?11:13,color:C.t2}}>{s.l}</div>
      </Card>)}
    </div>

    {/* Donut + Media — stack on mobile */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:16,marginBottom:isMobile?12:24}}>
      <Card style={{padding:isMobile?16:24}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <span style={{fontSize:isMobile?14:16,fontWeight:600}}>Прогресс задач</span>
          <button onClick={()=>onNav("strategy")} style={{fontSize:13,color:C.a,background:"none",border:"none",cursor:"pointer"}}>Стратегия</button>
        </div>
        {allTodayTasks.length===0
          ? <div style={{padding:"20px 0",textAlign:"center",color:C.t2,fontSize:14}}>На сегодня задач нет</div>
          : <div style={{display:"flex",alignItems:"center",gap:isMobile?16:24}}>
              <DonutChart done={doneTodayTasks.length} total={allTodayTasks.length} size={isMobile?110:140}/>
              <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:3,background:C.a}}/><span style={{fontSize:13,color:C.t2}}>Выполнено</span><span style={{fontSize:14,fontWeight:700,marginLeft:"auto"}}>{doneTodayTasks.length}</span></div>
                <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:3,background:C.bd}}/><span style={{fontSize:13,color:C.t2}}>Осталось</span><span style={{fontSize:14,fontWeight:700,marginLeft:"auto"}}>{allTodayTasks.length-doneTodayTasks.length}</span></div>
                <div style={{height:1,background:C.bd}}/>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,color:C.t2}}>Всего</span><span style={{fontSize:14,fontWeight:700,marginLeft:"auto"}}>{allTodayTasks.length}</span></div>
              </div>
            </div>
        }
      </Card>

      <div onClick={()=>onNav("media")} style={{cursor:"pointer",background:C.w,borderRadius:16,padding:isMobile?16:24,boxShadow:C.sh}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <span style={{fontSize:isMobile?14:16,fontWeight:600}}>Медийность</span>
          <span style={{fontSize:12,color:C.a}}>Подробнее →</span>
        </div>
        {!latestMedia
          ? <div style={{padding:"20px 0",textAlign:"center",color:C.t2,fontSize:14}}>Нет данных</div>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:11,color:C.t2,marginBottom:2}}>Обновлено: {latestMedia.date}</div>
              {[{label:"Instagram",key:"ig",icon:<IgSvg size={16}/>},{label:"YouTube",key:"yt",icon:<YtSvg size={16}/>},{label:"Telegram",key:"tg",icon:<TgSvg size={16}/>}].map(p=><div key={p.key} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:C.bg,borderRadius:10,border:"1px solid "+C.bd}}>
                {p.icon}
                <span style={{fontSize:13,flex:1,fontWeight:500}}>{p.label}</span>
                <span style={{fontSize:isMobile?14:18,fontWeight:800,color:C.t1}}>{fmt$(latestMedia[p.key]||0)}</span>
              </div>)}
            </div>
        }
      </div>
    </div>

    {/* Tasks + P&L — stack on mobile */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:16,marginBottom:isMobile?12:16}}>
      <Card style={{padding:isMobile?16:24}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:isMobile?14:16,fontWeight:600}}>Задачи сегодня</span><button onClick={()=>onNav("strategy")} style={{fontSize:13,color:C.a,background:"none",border:"none",cursor:"pointer"}}>Стратегия</button></div>
        {allTodayTasks.filter((t:any)=>t.status!=="done"&&!t.done).length===0
          ? <div style={{padding:"16px 0",textAlign:"center",color:C.t2,fontSize:14}}>Нет задач</div>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>{allTodayTasks.filter((t:any)=>t.status!=="done"&&!t.done).slice(0,5).map((t:any)=><div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:C.bg,borderRadius:10,borderLeft:"3px solid "+(t.type==="biz"?C.a:C.y)}}>
            <span style={{fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</span>
            {!isMobile&&<Tag label={tsLbl(t.status||"todo")} color={tsCol(t.status||"todo")}/>}
            <span style={{fontSize:11,color:C.t2,flexShrink:0}}>{t.mins}м</span>
          </div>)}</div>
        }
      </Card>
      <Card style={{padding:isMobile?16:24}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:isMobile?14:16,fontWeight:600}}>P&L (месяц)</span><button onClick={()=>onNav("pnl")} style={{fontSize:13,color:C.a,background:"none",border:"none",cursor:"pointer"}}>Подробнее</button></div>
        {cI===0&&cE===0
          ? <div style={{padding:"16px 0",textAlign:"center",color:C.t2,fontSize:14}}>Нет данных</div>
          : <>
              <PnlBarChart income={cI} expense={cE} width={isMobile?260:280} height={isMobile?70:80}/>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <div style={{flex:1,padding:"8px 10px",background:"#F0FDF4",borderRadius:8,textAlign:"center"}}><div style={{fontSize:10,color:C.g,fontWeight:600}}>Доходы</div><div style={{fontSize:13,fontWeight:700,color:C.g}}>+{fmt$(cI)} ₽</div></div>
                <div style={{flex:1,padding:"8px 10px",background:"#FEF2F2",borderRadius:8,textAlign:"center"}}><div style={{fontSize:10,color:C.r,fontWeight:600}}>Расходы</div><div style={{fontSize:13,fontWeight:700,color:C.r}}>{fmt$(cE)} ₽</div></div>
              </div>
            </>
        }
      </Card>
    </div>

    {/* Calls */}
    <Card style={{padding:isMobile?16:24,marginBottom:isMobile?8:0}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:isMobile?14:16,fontWeight:600}}>Созвоны</span>
        <button onClick={()=>onNav("calls")} style={{fontSize:13,color:C.a,background:"none",border:"none",cursor:"pointer"}}>Все →</button>
      </div>
      {upcomingCalls.length===0
        ? <div style={{padding:"16px 0",textAlign:"center",color:C.t2,fontSize:14}}>Созвоны не запланированы</div>
        : <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {upcomingCalls.map((c:any)=>{
              const isToday = c.date === td;
              const mins = isToday ? minsUntilCall(c) : null;
              const isPast = mins !== null && mins < 0;
              const isImminentOrNow = mins !== null && mins >= 0;
              return <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:isMobile?"10px 12px":"12px 16px",background:isToday?"#FFF7ED":C.bg,borderRadius:10,borderLeft:"3px solid "+(isToday?C.y:C.a)}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:isMobile?13:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{callLabel(c)}</div>
                  <div style={{fontSize:11,color:C.t2,marginTop:2}}>{c.date} в {c.time_start}</div>
                </div>
                {isToday && isImminentOrNow && <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,background:C.y+"22",color:C.y,whiteSpace:"nowrap"}}>через {mins}м</span>}
                {isToday && isPast && <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,background:C.r+"18",color:C.r}}>Сегодня</span>}
                {!isToday && <span style={{fontSize:11,color:C.t2,flexShrink:0}}>{c.date}</span>}
              </div>;
            })}
          </div>
      }
    </Card>

    {/* Kirill Scales AI widget */}
    <div onClick={()=>onNav("ai")} style={{marginTop:isMobile?12:16,background:`linear-gradient(135deg,${C.dk},#1a2744)`,borderRadius:16,padding:isMobile?"14px 16px":"18px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",transition:"transform 0.15s,box-shadow 0.15s"}}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-1px)";(e.currentTarget as HTMLElement).style.boxShadow="0 8px 28px rgba(0,0,0,0.2)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(0)";(e.currentTarget as HTMLElement).style.boxShadow="0 4px 20px rgba(0,0,0,0.15)";}}>
      <img src="/ai-avatar.png" style={{width:isMobile?48:56,height:isMobile?48:56,borderRadius:14,objectFit:"cover",flexShrink:0,border:"2px solid rgba(255,255,255,0.15)"}} alt="AI"/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:isMobile?14:16,fontWeight:700,color:"#fff",marginBottom:3}}>Kirill Scales AI</div>
        <div style={{fontSize:isMobile?11:12,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>Твой AI-ассистент по бизнесу и маркетингу. Спроси что угодно.</div>
      </div>
      <div style={{flexShrink:0,width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </div>
    </div>
  </>;
}
/* ============ STRATEGY ============ */

// Task comment modal
function TaskModal({task,taskType,userId,onClose}:{task:any,taskType:"kanban"|"goal",userId:string,onClose:()=>void}){
  const comments=useTable("task_comments",userId);
  const[text,setText]=useState("");
  const[editId,setEditId]=useState<string|null>(null);
  const[editText,setEditText]=useState("");

  const taskComments=useMemo(()=>
    comments.data.filter((c:any)=>c.task_id===task.id).sort((a:any,b:any)=>a.created_at.localeCompare(b.created_at))
  ,[comments.data,task.id]);

  const send=async()=>{
    if(!text.trim())return;
    await comments.add({task_id:task.id,task_type:taskType,text:text.trim()});
    setText("");
  };

  const saveEdit=async(id:string)=>{
    if(!editText.trim())return;
    await comments.update(id,{text:editText.trim()});
    setEditId(null);
  };

  const fmtTs=(ts:string)=>{
    const d=new Date(ts);
    return d.toLocaleDateString("ru-RU",{day:"numeric",month:"short"})+", "+d.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"});
  };

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{width:480,height:"100vh",background:C.w,display:"flex",flexDirection:"column",boxShadow:"-8px 0 40px rgba(0,0,0,0.15)"}}>
      {/* Header */}
      <div style={{padding:"20px 24px",borderBottom:"1px solid "+C.bd,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1,paddingRight:12}}>
          <div style={{fontSize:11,color:C.t2,fontWeight:500,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Задача</div>
          <div style={{fontSize:16,fontWeight:700,color:C.t1,lineHeight:1.3}}>{task.text}</div>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <Tag label={tsLbl(task.status||"todo")} color={tsCol(task.status||"todo")}/>
            {task.mins&&<span style={{fontSize:11,color:C.t2}}>{task.mins} мин</span>}
            {task.date&&<span style={{fontSize:11,color:C.t2}}>{task.date}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{width:32,height:32,border:"none",background:C.bg,borderRadius:8,cursor:"pointer",fontSize:18,color:C.t2,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>

      {/* Comments */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:14,color:C.t1}}>Комментарии ({taskComments.length})</div>
        {taskComments.length===0&&<div style={{padding:"24px 0",textAlign:"center",color:C.t2,fontSize:13}}>Нет комментариев</div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {taskComments.map((c:any)=><div key={c.id} style={{background:C.bg,borderRadius:12,padding:"12px 14px"}}>
            {editId===c.id
              ? <div style={{display:"flex",gap:8,flexDirection:"column"}}>
                  <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2} style={{...iS,resize:"none",fontSize:13}}/>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>saveEdit(c.id)} style={{padding:"6px 14px",background:C.a,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Сохранить</button>
                    <button onClick={()=>setEditId(null)} style={{padding:"6px 12px",background:"transparent",border:"1px solid "+C.bd,borderRadius:8,fontSize:12,cursor:"pointer"}}>Отмена</button>
                  </div>
                </div>
              : <>
                  <div style={{fontSize:13,color:C.t1,lineHeight:1.5,marginBottom:6}}>{c.text}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.t2}}>{fmtTs(c.created_at)}</span>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>{setEditId(c.id);setEditText(c.text);}} style={{fontSize:11,color:C.a,background:"none",border:"none",cursor:"pointer",padding:"2px 6px"}}>Изменить</button>
                      <button onClick={()=>comments.remove(c.id)} style={{fontSize:11,color:C.r,background:"none",border:"none",cursor:"pointer",padding:"2px 6px"}}>Удалить</button>
                    </div>
                  </div>
                </>
            }
          </div>)}
        </div>
      </div>

      {/* Input */}
      <div style={{padding:"16px 24px",borderTop:"1px solid "+C.bd}}>
        <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))send();}} placeholder="Напиши комментарий... (Cmd+Enter для отправки)" rows={3} style={{...iS,resize:"none",fontSize:13,marginBottom:10}}/>
        <button onClick={send} disabled={!text.trim()} style={{width:"100%",padding:"10px",background:C.a,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:text.trim()?"pointer":"not-allowed",opacity:text.trim()?1:0.5}}>Отправить</button>
      </div>
    </div>
  </div>;
}

// Year map (Gantt-style) — full rewrite
function YearMap({userId,goals,goalUpdate,goalAdd}:{userId:string,goals:any,goalUpdate:any,goalAdd:any}){
  const currentYear=new Date().getFullYear();
  const MONTHS_RU=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const[showForm,setShowForm]=useState(false);
  const[gf,sGf]=useState({name:"",description:"",color:C.a,start_date:"",end_date:""});
  const[editGoal,setEditGoal]=useState<any|null>(null);
  const[openGoalId,setOpenGoalId]=useState<string|null>(null);
  const[period,setPeriod]=useState<1|3|6|12>(12);
  const[viewYear,setViewYear]=useState(currentYear);
  const[startMonth,setStartMonth]=useState(0); // 0-based month offset for 1/3/6 month views

  const YEARS=[currentYear, currentYear+1, currentYear+2];
  const COLORS=[C.a,"#8B5CF6",C.g,C.r,C.y,C.pk,"#06B6D4","#F97316"];

  // Only non-system goals
  const visibleGoals=useMemo(()=>goals.data.filter((g:any)=>!g.is_system_pinned),[goals.data]);

  const addGoal=async()=>{
    if(!gf.name.trim()||!gf.start_date||!gf.end_date)return;
    await goalAdd({name:gf.name,description:gf.description,color:gf.color,start_date:gf.start_date,end_date:gf.end_date,deadline:gf.end_date});
    sGf({name:"",description:"",color:C.a,start_date:"",end_date:""});
    setShowForm(false);
  };

  const saveEdit=async()=>{
    if(!editGoal||!editGoal.name.trim())return;
    await goalUpdate(editGoal.id,{name:editGoal.name,description:editGoal.description,color:editGoal.color,start_date:editGoal.start_date,end_date:editGoal.end_date,deadline:editGoal.end_date});
    setEditGoal(null);
  };

  // Visible months based on period & startMonth
  const visibleMonths=useMemo(()=>{
    const months=[];
    for(let i=0;i<period;i++){
      const m=(startMonth+i)%12;
      const y=viewYear+Math.floor((startMonth+i)/12);
      months.push({m,y,label:MONTHS_RU[m]});
    }
    return months;
  },[period,startMonth,viewYear]);

  // Navigate period
  const shiftPeriod=(dir:1|-1)=>{
    const next=startMonth+dir*period;
    if(next<0){setStartMonth(12+next%12);setViewYear(v=>v-1);}
    else if(next>=12){setStartMonth(next%12);setViewYear(v=>v+1);}
    else setStartMonth(next);
  };

  // Compute bar within visible range
  const goalToBar=(g:any)=>{
    if(!g.start_date||!g.end_date)return null;
    const s=new Date(g.start_date);
    const e=new Date(g.end_date);
    // Total visible range
    const firstVis=new Date(visibleMonths[0].y,visibleMonths[0].m,1);
    const lastVis=new Date(visibleMonths[visibleMonths.length-1].y,visibleMonths[visibleMonths.length-1].m+1,0);
    if(e<firstVis||s>lastVis)return null;
    const rangeMs=lastVis.getTime()-firstVis.getTime();
    const leftMs=Math.max(0,s.getTime()-firstVis.getTime());
    const rightMs=Math.min(rangeMs,e.getTime()-firstVis.getTime());
    const left=leftMs/rangeMs*100;
    const width=Math.max(0.8,(rightMs-leftMs)/rangeMs*100);
    return{left,width};
  };

  const now=new Date();
  const todayCol=useMemo(()=>{
    if(visibleMonths.length===0)return -1;
    const firstVis=new Date(visibleMonths[0].y,visibleMonths[0].m,1);
    const lastVis=new Date(visibleMonths[visibleMonths.length-1].y,visibleMonths[visibleMonths.length-1].m+1,0);
    const rangeMs=lastVis.getTime()-firstVis.getTime();
    const nowMs=now.getTime()-firstVis.getTime();
    if(nowMs<0||nowMs>rangeMs)return -1;
    return nowMs/rangeMs*100;
  },[visibleMonths]);

  // Period label
  const periodLabel=useMemo(()=>{
    if(period===12)return `${viewYear}`;
    const first=visibleMonths[0];
    const last=visibleMonths[visibleMonths.length-1];
    if(first.y===last.y)return `${MONTHS_RU[first.m]} — ${MONTHS_RU[last.m]} ${first.y}`;
    return `${MONTHS_RU[first.m]} ${first.y} — ${MONTHS_RU[last.m]} ${last.y}`;
  },[period,visibleMonths,viewYear]);

  const GoalForm=({value,onChange,onSave,onCancel,saveLabel}:{value:any,onChange:(v:any)=>void,onSave:()=>void,onCancel:()=>void,saveLabel:string})=><Card style={{marginBottom:16,padding:20}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <div style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Название *</label><input value={value.name} onChange={e=>onChange({...value,name:e.target.value})} style={iS} placeholder="Запуск продукта..."/></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Начало *</label><input type="date" value={value.start_date} onChange={e=>onChange({...value,start_date:e.target.value})} style={iS}/></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Конец *</label><input type="date" value={value.end_date} onChange={e=>onChange({...value,end_date:e.target.value})} style={iS}/></div>
      <div style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Описание</label><textarea value={value.description||""} onChange={e=>onChange({...value,description:e.target.value})} rows={2} style={{...iS,resize:"none"}}/></div>
      <div style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Цвет</label><div style={{display:"flex",gap:6,marginTop:2}}>{COLORS.map(c=><button key={c} onClick={()=>onChange({...value,color:c})} style={{width:28,height:28,borderRadius:8,background:c,border:value.color===c?"3px solid #111":"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
    </div>
    <div style={{display:"flex",gap:10}}><Btn onClick={onSave}>{saveLabel}</Btn><Btn primary={false} onClick={onCancel}>Отмена</Btn></div>
  </Card>;

  return <>
    {/* Header controls */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:12,flexWrap:"wrap"}}>
      <div style={{fontSize:20,fontWeight:700}}>Карта года</div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        {/* Year selector */}
        <div style={{display:"flex",background:"#F2F2F7",borderRadius:10,padding:3,gap:2}}>
          {YEARS.map(y=><button key={y} onClick={()=>{setViewYear(y);setStartMonth(0);}} style={{padding:"6px 14px",border:"none",borderRadius:8,background:viewYear===y&&period===12?C.a:"transparent",color:viewYear===y&&period===12?"#fff":C.t2,fontSize:13,fontWeight:viewYear===y&&period===12?700:400,cursor:"pointer"}}>{y}</button>)}
        </div>
        {/* Period selector */}
        {(()=>{const PERIODS:Array<[number,string]>=[[1,"1 мес"],[3,"3 мес"],[6,"6 мес"],[12,"Год"]];return <div style={{display:"flex",background:"#F2F2F7",borderRadius:10,padding:3,gap:2}}>
          {PERIODS.map(([p,l])=><button key={p} onClick={()=>{setPeriod(p as any);if(p===12)setStartMonth(0);else setStartMonth(now.getMonth());}} style={{padding:"6px 14px",border:"none",borderRadius:8,background:period===p?C.a:"transparent",color:period===p?"#fff":C.t2,fontSize:13,fontWeight:period===p?700:400,cursor:"pointer"}}>{l}</button>)}
        </div>;})()}
        {/* Nav arrows (only for < 12 months) */}
        {period<12&&<div style={{display:"flex",gap:4}}>
          <button onClick={()=>shiftPeriod(-1)} style={{width:32,height:32,border:"1px solid "+C.bd,borderRadius:8,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
          <button onClick={()=>shiftPeriod(1)} style={{width:32,height:32,border:"1px solid "+C.bd,borderRadius:8,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>}
        <button onClick={()=>{setShowForm(!showForm);setEditGoal(null);}} style={{padding:"8px 18px",background:C.a,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Цель</button>
      </div>
    </div>

    {/* Period label */}
    {period<12&&<div style={{fontSize:14,fontWeight:600,color:C.t2,marginBottom:12}}>{periodLabel}</div>}

    {showForm&&!editGoal&&<GoalForm value={gf} onChange={sGf} onSave={addGoal} onCancel={()=>setShowForm(false)} saveLabel="Создать"/>}
    {editGoal&&<GoalForm value={editGoal} onChange={setEditGoal} onSave={saveEdit} onCancel={()=>setEditGoal(null)} saveLabel="Сохранить"/>}

    {/* Timeline */}
    <Card style={{padding:0,overflow:"hidden",marginBottom:24}}>
      {/* Month headers */}
      <div style={{display:"flex",borderBottom:"2px solid "+C.bd,background:"#FAFBFC"}}>
        <div style={{width:200,flexShrink:0,padding:"11px 16px",fontSize:11,fontWeight:700,color:C.t2,borderRight:"1px solid "+C.bd,letterSpacing:0.5}}>ЦЕЛЬ</div>
        <div style={{flex:1,display:"flex"}}>
          {visibleMonths.map((vm,i)=><div key={i} style={{flex:1,textAlign:"center",padding:"11px 0",fontSize:11,fontWeight:700,color:C.t2,borderRight:i<visibleMonths.length-1?"1px solid "+C.bd:"none",whiteSpace:"nowrap"}}>
            {vm.label}{period===12?"":(" "+vm.y.toString().slice(2))}
          </div>)}
        </div>
      </div>

      {/* Empty state */}
      {visibleGoals.length===0&&<div style={{padding:"60px 0",textAlign:"center",color:C.t2,fontSize:14}}>
        <div style={{marginBottom:8}}>Нет целей на таймлайне</div>
        <div style={{fontSize:12}}>Добавь цель с датами начала и конца</div>
      </div>}

      {/* Goal rows */}
      {visibleGoals.map((g:any,idx:number)=>{
        const bar=goalToBar(g);
        const isOpen=openGoalId===g.id;
        const isLast=idx===visibleGoals.length-1;
        return <div key={g.id} style={{borderBottom:isLast?"none":"1px solid "+C.bd+"88"}}>
          <div style={{display:"flex",minHeight:56,alignItems:"stretch"}}>
            {/* Label */}
            <div style={{width:200,flexShrink:0,display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRight:"1px solid "+C.bd,cursor:"pointer",background:isOpen?g.color+"08":"transparent",transition:"background 0.15s"}} onClick={()=>setOpenGoalId(isOpen?null:g.id)}>
              <div style={{width:10,height:10,borderRadius:3,background:g.color||C.a,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                {g.start_date&&g.end_date&&<div style={{fontSize:10,color:C.t2,marginTop:2}}>{g.start_date.substring(5)} — {g.end_date.substring(5)}</div>}
              </div>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points={isOpen?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
            </div>
            {/* Timeline area */}
            <div style={{flex:1,position:"relative",background:idx%2===0?"transparent":"#FAFBFC88"}}>
              {/* Month separators */}
              {visibleMonths.map((_,i)=><div key={i} style={{position:"absolute",left:`${i*(100/period)}%`,top:0,bottom:0,width:1,background:C.bd,opacity:0.4}}/>)}
              {/* Today line */}
              {todayCol>=0&&<div style={{position:"absolute",left:`${todayCol}%`,top:0,bottom:0,width:2,background:"#EF4444",zIndex:3,borderRadius:1}}/>}
              {/* Bar */}
              {bar?<div style={{position:"absolute",top:"50%",transform:"translateY(-50%)",left:`${bar.left}%`,width:`${bar.width}%`,minWidth:6,height:32,background:g.color||C.a,borderRadius:8,display:"flex",alignItems:"center",padding:"0 10px",boxSizing:"border-box",zIndex:2,boxShadow:`0 3px 10px ${g.color||C.a}40`,cursor:"pointer",overflow:"hidden"}} onClick={()=>{setEditGoal({...g});setOpenGoalId(null);}}>
                <span style={{fontSize:12,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textShadow:"0 1px 3px rgba(0,0,0,0.35)"}}>{g.name}</span>
              </div>
              :<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",paddingLeft:16}}>
                <span style={{fontSize:11,color:C.t2,fontStyle:"italic"}}>Вне диапазона</span>
              </div>}
            </div>
          </div>

          {/* Expanded */}
          {isOpen&&<div style={{borderTop:"1px solid "+C.bd,padding:"14px 18px",background:g.color+"05",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:g.description?5:0}}>{g.name}</div>
              {g.description&&<div style={{fontSize:12,color:C.t2,lineHeight:1.5,marginBottom:6}}>{g.description}</div>}
              <div style={{display:"flex",gap:16,fontSize:11,color:C.t2}}>
                {g.start_date&&<span>Начало: <b style={{color:C.t1}}>{g.start_date}</b></span>}
                {g.end_date&&<span>Конец: <b style={{color:C.t1}}>{g.end_date}</b></span>}
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button onClick={()=>{setEditGoal({...g});setShowForm(false);setOpenGoalId(null);}} style={{padding:"6px 14px",fontSize:12,fontWeight:600,background:C.a+"14",color:C.a,border:"1px solid "+C.a+"33",borderRadius:8,cursor:"pointer"}}>Изменить</button>
              <button onClick={()=>goals.remove(g.id)} style={{padding:"6px 12px",fontSize:12,background:C.r+"10",color:C.r,border:"1px solid "+C.r+"22",borderRadius:8,cursor:"pointer"}}>Удалить</button>
            </div>
          </div>}
        </div>;
      })}

      {/* Today footer label */}
      {visibleGoals.length>0&&todayCol>=0&&<div style={{display:"flex",borderTop:"1px solid "+C.bd+"44"}}>
        <div style={{width:200,flexShrink:0}}/>
        <div style={{flex:1,position:"relative",height:18}}>
          <div style={{position:"absolute",left:`${todayCol}%`,transform:"translateX(-50%)",top:2,fontSize:9,fontWeight:700,color:"#EF4444",whiteSpace:"nowrap"}}>▲ Сегодня</div>
        </div>
      </div>}
    </Card>
  </>;
}

/* ============ GOALS BLOCK ============ */
// Priority system helpers
const PRIORITIES={
  urgent:{id:"urgent",label:"Горит",color:"#EF4444",icon:"🔥"},
  medium:{id:"medium",label:"Ещё терпимо",color:"#F59E0B",icon:"⏳"},
  low:{id:"low",label:"Можно отложить",color:"#10B981",icon:"📌"},
};

const calcAutoPriority=(endDate:string|null):{p:"urgent"|"medium"|"low",days:number|null,overdue:boolean}=>{
  if(!endDate)return{p:"low",days:null,overdue:false};
  const end=new Date(endDate);end.setHours(23,59,59);
  const now=new Date();
  const days=Math.ceil((end.getTime()-now.getTime())/(1000*60*60*24));
  if(days<0)return{p:"urgent",days,overdue:true};
  if(days<=5)return{p:"urgent",days,overdue:false};
  if(days<=14)return{p:"medium",days,overdue:false};
  return{p:"low",days,overdue:false};
};

function GoalsBlock({userId,goals,goalTasks,dndDrag,dndOver,setDndDrag,setDndOver,onGtDragStart,onGtDragOver,onGtDrop,setActiveModal,TYPES}:any){
  const isMobile=useIsMobile();
  const[openGoal,setOpenGoal]=useState<string|null>(null);
  const[showGTF,setShowGTF]=useState<string|null>(null);
  const[gtf,sGtf]=useState({text:"",mins:30,type:"biz",date:""});
  const[tfErr,setTfErr]=useState("");
  const[showNewGoal,setShowNewGoal]=useState(false);
  const[newGoal,sNewGoal]=useState({name:"",description:"",color:C.a,start_date:"",end_date:""});
  const[editGoalId,setEditGoalId]=useState<string|null>(null);
  const[editGoalData,setEditGoalData]=useState<any>({});
  const[priorityMenu,setPriorityMenu]=useState<string|null>(null);
  const[toast,setToast]=useState<string|null>(null);

  const COLORS=[C.a,"#8B5CF6",C.g,C.r,C.y,C.pk,"#06B6D4","#F97316"];

  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(null),3500);};

  useEffect(()=>{
    if(!userId||goals.loading)return;
    const hasPinned=goals.data.some((g:any)=>g.is_system_pinned);
    if(!hasPinned){goals.add({name:"Масштабные цели",color:C.a,is_system_pinned:true});}
  },[userId,goals.loading,goals.data.length]);

  // Auto-update priorities on load
  useEffect(()=>{
    if(goals.loading)return;
    goals.data.filter((g:any)=>!g.is_system_pinned&&!g.priority_manual).forEach((g:any)=>{
      const{p}=calcAutoPriority(g.end_date||null);
      if(g.priority!==p){
        goals.update(g.id,{priority:p,priority_updated_at:new Date().toISOString()});
        if((g.priority||"low")!==p){
          const pr=PRIORITIES[p as keyof typeof PRIORITIES];
          const{days,overdue}=calcAutoPriority(g.end_date||null);
          if(p==="urgent"&&overdue)showToast(`Цель "${g.name}" просрочена!`);
          else if(p==="urgent"&&days!==null)showToast(`Цель "${g.name}" теперь "${pr.label}" — до дедлайна ${days} дн.`);
        }
      }
    });
  },[goals.data.length,goals.loading]);

  const systemBlock=goals.data.find((g:any)=>g.is_system_pinned);
  const childGoals=useMemo(()=>goals.data.filter((g:any)=>!g.is_system_pinned),[goals.data]);

  // Sort goals by priority
  const priorityOrder={urgent:0,medium:1,low:2};
  const sortedGoals=useMemo(()=>{
    return [...childGoals].sort((a:any,b:any)=>{
      const pa=a.priority||"low",pb=b.priority||"low";
      if(priorityOrder[pa as keyof typeof priorityOrder]!==priorityOrder[pb as keyof typeof priorityOrder])
        return priorityOrder[pa as keyof typeof priorityOrder]-priorityOrder[pb as keyof typeof priorityOrder];
      // Within same priority: overdue first, then by days remaining
      const da=calcAutoPriority(a.end_date),db=calcAutoPriority(b.end_date);
      if(da.overdue&&!db.overdue)return -1;
      if(!da.overdue&&db.overdue)return 1;
      if(da.days!==null&&db.days!==null)return da.days-db.days;
      return 0;
    });
  },[childGoals]);

  const groupedGoals=useMemo(()=>{
    const g:Record<string,any[]>={urgent:[],medium:[],low:[]};
    sortedGoals.forEach((goal:any)=>{const p=goal.priority||"low";if(g[p])g[p].push(goal);});
    return g;
  },[sortedGoals]);

  const setPriority=async(goalId:string,p:string,manual:boolean)=>{
    await goals.update(goalId,{priority:p,priority_manual:manual,priority_updated_at:new Date().toISOString()});
    setPriorityMenu(null);
  };

  const addChildGoal=async()=>{
    if(!newGoal.name.trim())return;
    const{p}=calcAutoPriority(newGoal.end_date||null);
    await goals.add({name:newGoal.name,description:newGoal.description,color:newGoal.color,start_date:newGoal.start_date||null,end_date:newGoal.end_date||null,deadline:newGoal.end_date||null,parent_id:systemBlock?.id||null,is_system_pinned:false,priority:p,priority_manual:false});
    sNewGoal({name:"",description:"",color:C.a,start_date:"",end_date:""});setShowNewGoal(false);
  };

  const saveGoalEdit=async()=>{
    if(!editGoalId||!editGoalData.name?.trim())return;
    const{p}=calcAutoPriority(editGoalData.end_date||null);
    await goals.update(editGoalId,{name:editGoalData.name,description:editGoalData.description,color:editGoalData.color,start_date:editGoalData.start_date||null,end_date:editGoalData.end_date||null,deadline:editGoalData.end_date||null,...(!editGoalData.priority_manual?{priority:p}:{})});
    setEditGoalId(null);
  };

  const addGoalTask=async(goalId:string)=>{
    setTfErr("");
    if(!gtf.text.trim()){setTfErr("Введи задачу");return;}
    if(gtf.mins<30){setTfErr("Минимум 30 минут");return;}
    const order=goalTasks.data.filter((t:any)=>t.goal_id===goalId).length;
    await goalTasks.add({goal_id:goalId,text:gtf.text,mins:gtf.mins,type:gtf.type,date:gtf.date||null,done:false,status:"todo",sort_order:order});
    sGtf({text:"",mins:30,type:"biz",date:""});setShowGTF(null);
  };

  const goalProgress=(gid:string)=>{
    const tasks=goalTasks.data.filter((t:any)=>t.goal_id===gid&&t.type!=="delegate");
    if(!tasks.length)return 0;
    return Math.round(tasks.filter((t:any)=>t.status==="done"||t.done).length/tasks.length*100);
  };
  const prgColor=(p:number)=>p<30?C.r:p<50?"#F97316":p<70?C.y:p<90?"#84CC16":"#16A34A";

  if(!systemBlock&&goals.loading) return <div style={{padding:40,textAlign:"center",color:C.t2}}>Загрузка...</div>;

  const GoalCard=({g}:{g:any})=>{
    const p=goalProgress(g.id);
    const gTasks=[...goalTasks.data.filter((t:any)=>t.goal_id===g.id)].sort((a:any,b:any)=>(a.sort_order||0)-(b.sort_order||0));
    const isOpen=openGoal===g.id;
    const isEditing=editGoalId===g.id;
    const pr=PRIORITIES[(g.priority||"low") as keyof typeof PRIORITIES]||PRIORITIES.low;
    const{days,overdue}=calcAutoPriority(g.end_date||null);
    const isUrgent=pr.id==="urgent";
    const isPriorityMenuOpen=priorityMenu===g.id;

    return <div style={{background:C.bg,borderRadius:14,overflow:"hidden",border:"1px solid "+C.bd,
      transition:"transform 0.2s,box-shadow 0.2s",
      borderLeft:`4px solid ${pr.color}`}}>
      {isEditing&&<div style={{padding:"16px 18px",background:C.w,borderBottom:"1px solid "+C.bd}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Название</label><input value={editGoalData.name||""} onChange={e=>setEditGoalData({...editGoalData,name:e.target.value})} style={iS}/></div>
          <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Начало</label><input type="date" value={editGoalData.start_date||""} onChange={e=>setEditGoalData({...editGoalData,start_date:e.target.value})} style={iS}/></div>
          <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Конец</label><input type="date" value={editGoalData.end_date||""} onChange={e=>setEditGoalData({...editGoalData,end_date:e.target.value})} style={iS}/></div>
          <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Цвет</label><div style={{display:"flex",gap:4,marginTop:2}}>{COLORS.map((c:string)=><button key={c} onClick={()=>setEditGoalData({...editGoalData,color:c})} style={{width:22,height:22,borderRadius:6,background:c,border:(editGoalData.color||C.a)===c?"3px solid #111":"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
          <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Описание</label><textarea value={editGoalData.description||""} onChange={e=>setEditGoalData({...editGoalData,description:e.target.value})} rows={2} style={{...iS,resize:"none"}}/></div>
        </div>
        <div style={{display:"flex",gap:8}}><Btn onClick={saveGoalEdit}>Сохранить</Btn><Btn primary={false} onClick={()=>setEditGoalId(null)}>Отмена</Btn></div>
      </div>}

      {/* Goal header */}
      <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12,background:C.w,cursor:"pointer"}} onClick={()=>setOpenGoal(isOpen?null:g.id)}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
            <span style={{fontSize:14,fontWeight:700,color:C.t1}}>{g.name}</span>
            {overdue&&<span style={{fontSize:10,fontWeight:700,background:C.r+"18",color:C.r,borderRadius:20,padding:"2px 8px"}}>Просрочена на {Math.abs(days||0)} дн.</span>}
            {!overdue&&days!==null&&days<=14&&<span style={{fontSize:10,color:pr.color,fontWeight:600}}>осталось {days} дн.</span>}
            {g.priority_manual&&<span style={{fontSize:9,background:C.bd,color:C.t2,borderRadius:20,padding:"1px 6px"}}>вручную</span>}
          </div>
          {g.start_date&&g.end_date&&<div style={{fontSize:11,color:C.t2,marginBottom:4}}>{g.start_date.substring(5)} — {g.end_date.substring(5)}</div>}
          {!g.end_date&&<div style={{fontSize:10,color:C.t2,fontStyle:"italic",marginBottom:4}}>Укажите дедлайн для автоопределения приоритета</div>}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1,height:5,background:C.bd,borderRadius:3,overflow:"hidden",maxWidth:180}}><div style={{width:p+"%",height:"100%",background:prgColor(p),borderRadius:3,transition:"width 0.3s"}}/></div>
            <span style={{fontSize:10,color:C.t2,whiteSpace:"nowrap"}}>{gTasks.filter((t:any)=>t.status==="done"||t.done).length}/{gTasks.length} ({p}%)</span>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
          {/* Priority badge */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setPriorityMenu(isPriorityMenuOpen?null:g.id)}
              style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,border:`1px solid ${pr.color}33`,background:pr.color+"10",cursor:"pointer",fontSize:11,fontWeight:600,color:pr.color}}>
              <span style={{animation:isUrgent?"pulse 1.5s ease-in-out infinite":"none"}}>{pr.icon}</span>
              <span>{pr.label}</span>
            </button>
            {isPriorityMenuOpen&&<div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:C.w,border:"1px solid "+C.bd,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:100,minWidth:200,overflow:"hidden"}}>
              {Object.values(PRIORITIES).map(op=><button key={op.id} onClick={()=>setPriority(g.id,op.id,true)}
                style={{width:"100%",padding:"10px 14px",background:g.priority===op.id?op.color+"10":"transparent",border:"none",borderBottom:"1px solid "+C.bd,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontSize:13,color:g.priority===op.id?op.color:C.t1,fontWeight:g.priority===op.id?600:400,textAlign:"left"}}>
                <span>{op.icon}</span><span>{op.label}</span>
                {g.priority===op.id&&<svg style={{marginLeft:"auto"}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>)}
              {g.priority_manual&&<button onClick={()=>setPriority(g.id,calcAutoPriority(g.end_date||null).p,false)}
                style={{width:"100%",padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.t2,textAlign:"left"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0"/><path d="M12 8v4l3 3"/></svg>
                Вернуть автоматическое
              </button>}
            </div>}
          </div>
          <button onClick={()=>{setEditGoalId(g.id);setEditGoalData({...g});setOpenGoal(null);}} style={{padding:"5px 10px",fontSize:12,background:C.a+"12",color:C.a,border:"1px solid "+C.a+"22",borderRadius:8,cursor:"pointer",fontWeight:500}}>Изм.</button>
          <button onClick={()=>goals.remove(g.id)} style={{width:26,height:26,fontSize:12,background:C.r+"10",color:C.r,border:"1px solid "+C.r+"22",borderRadius:8,cursor:"pointer"}}>×</button>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points={isOpen?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
        </div>
      </div>

      {/* Tasks */}
      {isOpen&&<div style={{padding:"10px 18px 14px"}}>
        {gTasks.map((t:any)=>{
          const isDone=t.status==="done"||t.done;
          const isOver=dndOver===t.id;
          return <div key={t.id} draggable
            onDragStart={()=>onGtDragStart(t.id)} onDragOver={(e:React.DragEvent)=>onGtDragOver(t.id,e)}
            onDrop={()=>onGtDrop(t.id,g.id)} onDragEnd={()=>{setDndDrag(null);setDndOver(null);}}
            style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,background:isDone?"#F0FDF4":C.w,marginBottom:6,
              borderLeft:"3px solid "+(t.type==="biz"?C.a:t.type==="delegate"?C.t2:C.y),
              opacity:dndDrag===t.id?0.4:1,boxShadow:isOver?"0 0 0 2px "+C.a:"0 1px 3px rgba(0,0,0,0.05)",cursor:"grab",border:"1px solid "+C.bd,borderLeftWidth:3}}>
            <span style={{fontSize:13,color:C.t2,cursor:"grab",userSelect:"none"}}>⠿</span>
            <button onClick={()=>goalTasks.update(t.id,{status:nextStatus(t.status||"todo"),done:nextStatus(t.status||"todo")==="done"})} style={{width:18,height:18,minWidth:18,borderRadius:5,border:"2px solid "+(isDone?C.g:(t.status==="inprogress")?C.y:C.bd),background:isDone?C.g:(t.status==="inprogress")?C.y+"33":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{isDone&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}</button>
            <div style={{flex:1,cursor:"pointer",minWidth:0}} onClick={()=>setActiveModal({task:t,type:"goal"})}>
              <div style={{fontSize:13,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</div>
              <div style={{fontSize:10,color:C.t2,marginTop:1}}>{t.mins}м{t.date?` | ${t.date.substring(5)}`:""}</div>
            </div>
            <Tag label={tsLbl(t.status||"todo")} color={tsCol(t.status||"todo")}/>
            <input type="date" value={t.date||""} onChange={e=>goalTasks.update(t.id,{date:e.target.value||null})} style={{width:110,padding:"3px 6px",border:"1px solid "+C.bd,borderRadius:6,fontSize:11,background:C.ib,flexShrink:0}}/>
            <button onClick={()=>goalTasks.remove(t.id)} style={{border:"none",background:"transparent",cursor:"pointer",color:C.t2,fontSize:14,flexShrink:0}}>×</button>
          </div>;
        })}
        {showGTF===g.id
          ? <div style={{marginTop:8,padding:12,background:C.w,borderRadius:10,border:"1px solid "+C.bd}}>
              <input placeholder="Задача" value={gtf.text} onChange={e=>sGtf({...gtf,text:e.target.value})} style={{...iS,padding:"8px 10px",fontSize:12,marginBottom:8}}/>
              <div style={{display:"flex",gap:6,marginBottom:6}}>
                <input type="number" value={gtf.mins} onChange={e=>sGtf({...gtf,mins:+e.target.value})} min={30} max={480} step={5} style={{...iS,width:75,padding:"6px 8px",fontSize:12}}/>
                <select value={gtf.type} onChange={e=>sGtf({...gtf,type:e.target.value})} style={{...iS,flex:1,padding:"6px 8px",fontSize:12}}>{TYPES.map((t:any)=><option key={t.id} value={t.id}>{t.label}</option>)}</select>
                <input type="date" value={gtf.date} onChange={e=>sGtf({...gtf,date:e.target.value})} style={{...iS,width:130,padding:"6px 8px",fontSize:12}}/>
              </div>
              {tfErr&&<div style={{fontSize:11,color:C.r,marginBottom:6}}>{tfErr}</div>}
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>addGoalTask(g.id)} style={{flex:1,padding:"7px",background:C.a,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Добавить</button>
                <button onClick={()=>setShowGTF(null)} style={{padding:"7px 12px",background:C.bg,border:"1px solid "+C.bd,borderRadius:8,fontSize:12,cursor:"pointer"}}>Отмена</button>
              </div>
            </div>
          : <button onClick={()=>{setShowGTF(g.id);sGtf({text:"",mins:30,type:"biz",date:""}); }} style={{width:"100%",padding:"8px",background:"transparent",border:"1px dashed "+C.bd,borderRadius:10,fontSize:12,color:C.t2,cursor:"pointer",marginTop:4}}>+ Задача</button>
        }
      </div>}
    </div>;
  };

  return <div style={{background:C.w,borderRadius:20,boxShadow:"0 4px 24px rgba(0,0,0,0.07)",border:"1px solid "+C.bd,overflow:"hidden"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    {/* Toast */}
    {toast&&<div style={{position:"fixed",bottom:isMobile?72:24,left:"50%",transform:"translateX(-50%)",background:C.dk,color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:500,zIndex:1000,boxShadow:"0 8px 24px rgba(0,0,0,0.2)",maxWidth:360,textAlign:"center"}}>{toast}</div>}

    {/* Header */}
    <div style={{padding:"18px 24px",background:`linear-gradient(135deg,${C.dk},${C.da})`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>Масштабные цели</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:1}}>{childGoals.length} целей · сортировка по приоритету</div>
        </div>
      </div>
      <button onClick={()=>setShowNewGoal(!showNewGoal)} style={{padding:"8px 16px",background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.25)",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Цель</button>
    </div>

    {/* New goal form */}
    {showNewGoal&&<div style={{padding:"20px 24px",borderBottom:"1px solid "+C.bd,background:"#FAFBFD"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
        <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Название *</label><input value={newGoal.name} onChange={e=>sNewGoal({...newGoal,name:e.target.value})} style={iS} placeholder="Запустить воронку..."/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Начало</label><input type="date" value={newGoal.start_date} onChange={e=>sNewGoal({...newGoal,start_date:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Дедлайн</label><input type="date" value={newGoal.end_date} onChange={e=>sNewGoal({...newGoal,end_date:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Цвет</label><div style={{display:"flex",gap:5,marginTop:2}}>{COLORS.map((c:string)=><button key={c} onClick={()=>sNewGoal({...newGoal,color:c})} style={{width:26,height:26,borderRadius:7,background:c,border:newGoal.color===c?"3px solid #111":"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
        <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Описание</label><textarea value={newGoal.description} onChange={e=>sNewGoal({...newGoal,description:e.target.value})} rows={2} style={{...iS,resize:"none"}}/></div>
      </div>
      <div style={{display:"flex",gap:8}}><Btn onClick={addChildGoal}>Создать</Btn><Btn primary={false} onClick={()=>setShowNewGoal(false)}>Отмена</Btn></div>
    </div>}

    {/* Goals grouped by priority */}
    <div style={{padding:"16px 24px",display:"flex",flexDirection:"column",gap:16}}>
      {childGoals.length===0&&<div style={{padding:"32px 0",textAlign:"center",color:C.t2,fontSize:14}}>Создай первую цель</div>}

      {Object.entries(PRIORITIES).map(([pKey,pInfo])=>{
        const group=groupedGoals[pKey]||[];
        if(group.length===0)return null;
        return <div key={pKey}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:14,animation:pKey==="urgent"?"pulse 1.5s ease-in-out infinite":"none"}}>{pInfo.icon}</span>
            <span style={{fontSize:12,fontWeight:700,color:pInfo.color,textTransform:"uppercase",letterSpacing:0.5}}>{pInfo.label}</span>
            <span style={{fontSize:11,background:pInfo.color+"15",color:pInfo.color,borderRadius:20,padding:"1px 8px",fontWeight:600}}>{group.length}</span>
            <div style={{flex:1,height:1,background:pInfo.color+"20"}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {group.map((g:any)=><GoalCard key={g.id} g={g}/>)}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

function StrategyPage({userId}:{userId:string}){
  const kanban = useTable("kanban", userId);
  const goals = useTable("goals", userId);
  const goalTasks = useTable("goal_tasks", userId);
  const isMobile=useIsMobile();
  const[stratTab,setStratTab]=useState<"sprint"|"yearmap">("sprint");
  const[showTF,setShowTF]=useState<string|null>(null);
  const[tf,sTf]=useState({text:"",mins:30,type:"biz"});
  const[tfErr,setTfErr]=useState("");
  const[showGF,setShowGF]=useState(false);
  const[gf,sGf]=useState({name:"",deadline:"",color:C.a});
  const[openGoal,setOpenGoal]=useState<string|null>(null);
  const[showGTF,setShowGTF]=useState<string|null>(null);
  const[gtf,sGtf]=useState({text:"",mins:30,type:"biz",date:""});
  const[scroll,setScroll]=useState(0);
  const[quote]=useState(()=>QUOTES[Math.floor(Math.random()*QUOTES.length)]);
  const[editingTask,setEditingTask]=useState<string|null>(null);
  const[editText,setEditText]=useState("");
  const[deleteConfirm,setDeleteConfirm]=useState<string|null>(null);
  const[activeModal,setActiveModal]=useState<{task:any,type:"kanban"|"goal"}|null>(null);
  // DnD for goal tasks
  const[dndDrag,setDndDrag]=useState<string|null>(null);
  const[dndOver,setDndOver]=useState<string|null>(null);
  // DnD for kanban day tasks
  const[kanbanDrag,setKanbanDrag]=useState<string|null>(null);
  const[kanbanOver,setKanbanOver]=useState<string|null>(null);
  const[kanbanErrToast,setKanbanErrToast]=useState(false);

  const onKanbanDragStart=(id:string)=>{
    setKanbanDrag(id);
    if(navigator.vibrate)navigator.vibrate(30);
  };
  const onKanbanDragOver=(id:string,e:React.DragEvent)=>{e.preventDefault();setKanbanOver(id);};
  const onKanbanDrop=async(targetId:string,dayStr:string)=>{
    if(!kanbanDrag||kanbanDrag===targetId){setKanbanDrag(null);setKanbanOver(null);return;}
    const dayTasks=[...kanban.data.filter((t:any)=>t.date===dayStr)].sort((a:any,b:any)=>(a.sort_order||0)-(b.sort_order||0));
    const fromIdx=dayTasks.findIndex((t:any)=>t.id===kanbanDrag);
    const toIdx=dayTasks.findIndex((t:any)=>t.id===targetId);
    if(fromIdx<0||toIdx<0){setKanbanDrag(null);setKanbanOver(null);return;}
    const reordered=[...dayTasks];
    const[moved]=reordered.splice(fromIdx,1);
    reordered.splice(toIdx,0,moved);
    setKanbanDrag(null);setKanbanOver(null);
    try{
      await Promise.all(reordered.map((t:any,i:number)=>kanban.update(t.id,{sort_order:i})));
    }catch{
      setKanbanErrToast(true);
      setTimeout(()=>setKanbanErrToast(false),3000);
    }
  };

  const days=useMemo(()=>{const d=[];for(let i=0;i<7;i++){const dt=new Date();dt.setDate(dt.getDate()+i);d.push(ds(dt));}return d;},[]);
  const td=today();
  const WDS=["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
  const TYPES=[{id:"biz",label:"Бизнес",c:C.a},{id:"other",label:"Другое",c:C.y},{id:"delegate",label:"Делегировано",c:C.t2}];
  const typeColor=(t:string)=>(TYPES.find(x=>x.id===t)||{c:C.t2}).c;

  const tasksForDay=(d:string)=>{
    const manual=[...kanban.data.filter((t:any)=>t.date===d)].sort((a:any,b:any)=>(a.sort_order||0)-(b.sort_order||0));
    const fromGoals=goalTasks.data.filter((t:any)=>t.date===d).map((t:any)=>({...t,fromGoal:true,goalColor:goals.data.find((g:any)=>g.id===t.goal_id)?.color||C.a}));
    return[...manual,...fromGoals];
  };

  const addTask=async(d:string)=>{
    setTfErr("");
    if(!tf.text.trim()){setTfErr("Введи задачу");return;}
    if(tf.mins<30){setTfErr("Минимум 30 минут");return;}
    const order=kanban.data.filter((t:any)=>t.date===d).length;
    await kanban.add({text:tf.text,mins:tf.mins,type:tf.type,date:d,done:false,status:"todo",sort_order:order});
    sTf({text:"",mins:30,type:"biz"});setShowTF(null);
  };

  const dayStats=(d:string)=>{
    const tasks=tasksForDay(d);
    const biz=tasks.filter((t:any)=>t.type==="biz");
    const oth=tasks.filter((t:any)=>t.type==="other");
    const del=tasks.filter((t:any)=>t.type==="delegate");
    const totalMins=tasks.filter((t:any)=>t.type!=="delegate").reduce((s:number,t:any)=>s+(t.mins||0),0);
    const isDone=(t:any)=>t.status==="done"||t.done===true;
    return{tasks,biz,oth,del,totalMins,overload:totalMins>480,
      bizDone:biz.filter(isDone).length,bizTotal:biz.length,
      othDone:oth.filter(isDone).length,othTotal:oth.length,
      delDone:del.filter(isDone).length,delTotal:del.length,
      allDone:tasks.filter((t:any)=>t.type!=="delegate").length>0&&tasks.filter((t:any)=>t.type!=="delegate").every(isDone)};
  };

  const cycleTaskStatus=async(t:any)=>{
    const ns=nextStatus(t.status||"todo");
    if(t.fromGoal){await goalTasks.update(t.id,{status:ns,done:ns==="done"});}
    else{await kanban.update(t.id,{status:ns,done:ns==="done"});}
  };

  const startEdit=(t:any)=>{setEditingTask(t.id);setEditText(t.text);};
  const saveEdit=async(t:any)=>{
    if(!editText.trim()){setEditingTask(null);return;}
    if(t.fromGoal){await goalTasks.update(t.id,{text:editText});}
    else{await kanban.update(t.id,{text:editText});}
    setEditingTask(null);
  };
  const confirmDelete=async(t:any)=>{
    if(t.fromGoal){await goalTasks.remove(t.id);}
    else{await kanban.remove(t.id);}
    setDeleteConfirm(null);
  };

  const advice=useMemo(()=>{
    const tasks=tasksForDay(td);
    const active=tasks.filter((t:any)=>t.type!=="delegate");
    const done=active.filter((t:any)=>t.status==="done"||t.done).length;
    const undone=active.length-done;
    const pct=active.length?done/active.length:0;
    const hr=new Date().getHours();
    const st=dayStats(td);
    if(active.length===0)return{icon:"💡",text:"Сегодня нет задач. Хороший день для стратегии."};
    if(done===active.length)return{icon:"✅",text:"Все задачи выполнены!"};
    if(hr>=18&&undone>0)return{icon:"⏰",text:`Уже ${hr}:00, осталось ${undone} задач.`};
    if(st.overload)return{icon:"⚠️",text:`Перегруз: ${st.totalMins} мин. Делегируй часть.`};
    if(pct<0.3)return{icon:"💡",text:"Не откладывай задачи на вечер."};
    if(pct>=0.7)return{icon:"🔥",text:`Отличный темп! Осталось ${undone} задач.`};
    return{icon:"💡",text:quote};
  },[kanban.data,goalTasks.data,td]);

  const addGoal=async()=>{
    if(!gf.name.trim())return;
    await goals.add({name:gf.name,deadline:gf.deadline||null,color:gf.color});
    sGf({name:"",deadline:"",color:C.a});setShowGF(false);
  };

  const addGoalTask=async(goalId:string)=>{
    setTfErr("");
    if(!gtf.text.trim()){setTfErr("Введи задачу");return;}
    if(gtf.mins<30){setTfErr("Минимум 30 минут");return;}
    const order=goalTasks.data.filter((t:any)=>t.goal_id===goalId).length;
    await goalTasks.add({goal_id:goalId,text:gtf.text,mins:gtf.mins,type:gtf.type,date:gtf.date||null,done:false,status:"todo",sort_order:order});
    sGtf({text:"",mins:30,type:"biz",date:""});setShowGTF(null);
  };

  const goalProgress=(gid:string)=>{
    const tasks=goalTasks.data.filter((t:any)=>t.goal_id===gid&&t.type!=="delegate");
    if(!tasks.length)return 0;
    return Math.round(tasks.filter((t:any)=>t.status==="done"||t.done).length/tasks.length*100);
  };
  const prgColor=(p:number)=>p<30?C.r:p<50?"#F97316":p<70?C.y:p<90?"#84CC16":"#16A34A";

  // DnD handlers for goal tasks
  const onGtDragStart=(id:string)=>setDndDrag(id);
  const onGtDragOver=(id:string,e:React.DragEvent)=>{e.preventDefault();setDndOver(id);};
  const onGtDrop=async(targetId:string,goalId:string)=>{
    if(!dndDrag||dndDrag===targetId){setDndDrag(null);setDndOver(null);return;}
    const gTasks=[...goalTasks.data.filter((t:any)=>t.goal_id===goalId)].sort((a:any,b:any)=>(a.sort_order||0)-(b.sort_order||0));
    const fromIdx=gTasks.findIndex((t:any)=>t.id===dndDrag);
    const toIdx=gTasks.findIndex((t:any)=>t.id===targetId);
    if(fromIdx<0||toIdx<0){setDndDrag(null);setDndOver(null);return;}
    const reordered=[...gTasks];
    const[moved]=reordered.splice(fromIdx,1);
    reordered.splice(toIdx,0,moved);
    // Save new order
    await Promise.all(reordered.map((t:any,i:number)=>goalTasks.update(t.id,{sort_order:i})));
    setDndDrag(null);setDndOver(null);
  };

  const visibleDays=isMobile?days.slice(scroll,scroll+1):days.slice(scroll,scroll+4);

  const TaskItem=({t,showDate=false,dayStr}:{t:any,showDate?:boolean,dayStr?:string})=>{
    const status=t.status||"todo";
    const statusColor=tsCol(status);
    const isDone=status==="done";
    const isKanbanOver=kanbanOver===t.id;
    const isKanbanDragging=kanbanDrag===t.id;
    const canDrag=!t.fromGoal&&dayStr;
    if(editingTask===t.id){
      return <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",borderRadius:8,background:C.bg,borderLeft:"3px solid "+typeColor(t.type)}}>
        <input autoFocus value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEdit(t);if(e.key==="Escape")setEditingTask(null);}} style={{...iS,padding:"4px 8px",fontSize:12,flex:1}}/>
        <button onClick={()=>saveEdit(t)} style={{padding:"4px 8px",background:C.a,color:"#fff",border:"none",borderRadius:6,fontSize:11,cursor:"pointer"}}>✓</button>
        <button onClick={()=>setEditingTask(null)} style={{padding:"4px 8px",background:C.bg,border:"1px solid "+C.bd,borderRadius:6,fontSize:11,cursor:"pointer"}}>✕</button>
      </div>;
    }
    if(deleteConfirm===t.id){
      return <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",borderRadius:8,background:"#FEF2F2",borderLeft:"3px solid "+C.r}}>
        <span style={{flex:1,fontSize:12,color:C.r}}>Удалить задачу?</span>
        <button onClick={()=>confirmDelete(t)} style={{padding:"4px 8px",background:C.r,color:"#fff",border:"none",borderRadius:6,fontSize:11,cursor:"pointer"}}>Да</button>
        <button onClick={()=>setDeleteConfirm(null)} style={{padding:"4px 8px",background:C.bg,border:"1px solid "+C.bd,borderRadius:6,fontSize:11,cursor:"pointer"}}>Нет</button>
      </div>;
    }
    return <div
      draggable={!!canDrag}
      onDragStart={canDrag?()=>onKanbanDragStart(t.id):undefined}
      onDragOver={canDrag?(e)=>onKanbanDragOver(t.id,e):undefined}
      onDrop={canDrag&&dayStr?()=>onKanbanDrop(t.id,dayStr):undefined}
      onDragEnd={canDrag?()=>{setKanbanDrag(null);setKanbanOver(null);}:undefined}
      style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,
        background:isDone?"#F0FDF4":C.bg,borderLeft:"3px solid "+typeColor(t.type),
        opacity:isKanbanDragging?0.4:1,
        boxShadow:isKanbanOver?"0 0 0 2px "+C.a:isKanbanDragging?"0 4px 16px rgba(0,0,0,0.15)":"none",
        cursor:canDrag?"grab":"default",
        transition:"opacity 0.15s,box-shadow 0.15s",
      }}>
      {canDrag&&<span style={{fontSize:13,color:C.t2,cursor:"grab",userSelect:"none",flexShrink:0,opacity:0.5}}>⠿</span>}
      <button onClick={()=>cycleTaskStatus(t)} title={tsLbl(status)} style={{width:20,height:20,minWidth:20,borderRadius:6,border:"2px solid "+statusColor,background:isDone?C.g:status==="inprogress"?C.y+"33":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {isDone&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        {status==="inprogress"&&<div style={{width:8,height:8,borderRadius:2,background:C.y}}/>}
      </button>
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setActiveModal({task:t,type:t.fromGoal?"goal":"kanban"})}>
        <div style={{fontSize:12,fontWeight:500,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</div>
        <div style={{display:"flex",gap:6,marginTop:2}}><span style={{fontSize:10,color:C.t2}}>{t.mins}м</span>{t.fromGoal&&<span style={{fontSize:10,color:t.goalColor}}>★</span>}{showDate&&t.date&&<span style={{fontSize:10,color:C.t2}}>{t.date.substring(5)}</span>}</div>
      </div>
      <button onClick={()=>startEdit(t)} style={{width:16,height:16,border:"none",background:"transparent",cursor:"pointer",color:C.t2,fontSize:10,opacity:0.6}}>✏️</button>
      {!t.fromGoal&&<button onClick={()=>setDeleteConfirm(t.id)} style={{width:16,height:16,border:"none",background:"transparent",cursor:"pointer",color:C.r,fontSize:11}}>×</button>}
    </div>;
  };

  // Tab style (same as CRM)
  const tabStyle=(active:boolean):React.CSSProperties=>({
    padding:"9px 24px",border:"none",borderRadius:9,
    background:active?C.a:"transparent",
    color:active?"#fff":C.t2,fontSize:14,fontWeight:active?600:400,
    cursor:"pointer",transition:"all 0.2s",
  });

  return <>
    {/* Tabs */}
    <div style={{display:"inline-flex",background:C.bg,borderRadius:12,padding:3,gap:2,marginBottom:24,border:"1px solid "+C.bd}}>
      <button style={tabStyle(stratTab==="sprint")} onClick={()=>setStratTab("sprint")}>Текущий спринт</button>
      <button style={tabStyle(stratTab==="yearmap")} onClick={()=>setStratTab("yearmap")}>Карта года</button>
    </div>

    {/* YEAR MAP */}
    {stratTab==="yearmap"&&<YearMap userId={userId} goals={goals} goalUpdate={goals.update} goalAdd={goals.add}/>}

    {/* SPRINT */}
    {stratTab==="sprint"&&<>
      {kanbanErrToast&&<div style={{position:"fixed",bottom:isMobile?72:24,left:"50%",transform:"translateX(-50%)",background:C.r,color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:500,zIndex:1000,boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>Не удалось сохранить порядок. Попробуйте ещё раз</div>}
      {/* Kanban */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:isMobile?16:18,fontWeight:700}}>Задачи на {isMobile?"день":"7 дней"}</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {isMobile&&<span style={{fontSize:12,color:C.t2,marginRight:4}}>{scroll+1} / 7</span>}
            <button onClick={()=>setScroll(Math.max(0,scroll-1))} disabled={scroll===0} style={{width:36,height:36,borderRadius:10,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:scroll===0?0.3:1}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
            <button onClick={()=>setScroll(Math.min(isMobile?6:3,scroll+1))} disabled={scroll>=(isMobile?6:3)} style={{width:36,height:36,borderRadius:10,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:scroll>=(isMobile?6:3)?0.3:1}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:isMobile?12:14}}>
          {visibleDays.map(d=>{const st=dayStats(d);const isT=d===td;const isPast=d<td;const dt=new Date(d);
            const bc=isT?C.a:st.allDone?C.g:isPast&&!st.allDone&&st.tasks.length>0?C.r:"transparent";
            return<div key={d} style={{background:C.w,borderRadius:16,boxShadow:C.sh,border:"2px solid "+bc,display:"flex",flexDirection:"column",minHeight:isMobile?200:300}}>
              <div style={{padding:"14px 16px",borderBottom:"1px solid "+C.bd,display:"flex",justifyContent:"space-between",background:isT?"rgba(37,99,235,0.04)":"transparent"}}>
                <div><div style={{fontSize:20,fontWeight:700,color:isT?C.a:C.t1}}>{dt.getDate()}</div><div style={{fontSize:11,color:C.t2}}>{WDS[dt.getDay()]}, {MR[dt.getMonth()].substring(0,3)}</div></div>
                {st.overload&&<span style={{fontSize:10,color:C.r,fontWeight:600}}>⚠️ Перегруз</span>}
              </div>
              <div style={{flex:1,padding:"10px 12px",overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}
                onDragOver={e=>{e.preventDefault();}}
                onDrop={()=>{
                  if(!kanbanDrag)return;
                  const dayTasks=[...kanban.data.filter((t:any)=>t.date===d)].sort((a:any,b:any)=>(a.sort_order||0)-(b.sort_order||0));
                  const fromIdx=dayTasks.findIndex((t:any)=>t.id===kanbanDrag);
                  if(fromIdx<0){setKanbanDrag(null);setKanbanOver(null);return;}
                  // Move to end
                  const reordered=[...dayTasks];
                  const[moved]=reordered.splice(fromIdx,1);
                  reordered.push(moved);
                  setKanbanDrag(null);setKanbanOver(null);
                  Promise.all(reordered.map((t:any,i:number)=>kanban.update(t.id,{sort_order:i}))).catch(()=>{setKanbanErrToast(true);setTimeout(()=>setKanbanErrToast(false),3000);});
                }}>
                {st.tasks.length===0&&<div style={{textAlign:"center",color:C.t2,fontSize:12,padding:"20px 0"}}>Нет задач</div>}
                {st.tasks.map((t:any)=><TaskItem key={t.id} t={t} dayStr={d}/>)}
                {showTF===d?<div style={{marginTop:6}}>
                  <input placeholder="Задача" value={tf.text} onChange={e=>sTf({...tf,text:e.target.value})} style={{...iS,padding:"8px 10px",fontSize:12,marginBottom:6}}/>
                  <div style={{display:"flex",gap:6,marginBottom:6}}>
                    <input type="number" value={tf.mins} onChange={e=>sTf({...tf,mins:+e.target.value})} min={30} max={480} step={5} style={{...iS,width:70,padding:"6px 8px",fontSize:12}}/>
                    <select value={tf.type} onChange={e=>sTf({...tf,type:e.target.value})} style={{...iS,flex:1,padding:"6px 8px",fontSize:12}}>{TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select>
                  </div>
                  {tfErr&&<div style={{fontSize:11,color:C.r,marginBottom:4}}>{tfErr}</div>}
                  <div style={{display:"flex",gap:6}}><button onClick={()=>addTask(d)} style={{flex:1,padding:"6px",background:C.a,color:"#fff",border:"none",borderRadius:6,fontSize:12,cursor:"pointer"}}>+</button><button onClick={()=>setShowTF(null)} style={{padding:"6px 10px",background:C.bg,border:"1px solid "+C.bd,borderRadius:6,fontSize:12,cursor:"pointer"}}>×</button></div>
                </div>:<button onClick={()=>setShowTF(d)} style={{marginTop:6,width:"100%",padding:"6px",background:C.bg,border:"1px dashed "+C.bd,borderRadius:8,fontSize:12,color:C.t2,cursor:"pointer"}}>+ Задача</button>}
              </div>
              {st.overload&&<div style={{padding:"8px 12px",background:"#FEF2F2",fontSize:11,color:C.r}}>{st.totalMins} мин запланировано</div>}
              <div style={{padding:"10px 12px",borderTop:"1px solid "+C.bd,display:"flex",gap:8}}>
                {[{l:"Б",d:st.bizDone,t:st.bizTotal,c:C.a},{l:"Д",d:st.othDone,t:st.othTotal,c:C.y},{l:"Дл",d:st.delDone,t:st.delTotal,c:C.t2}].map((b,i)=><div key={i} style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.t2,marginBottom:3}}><span>{b.l}</span><span>{b.d}/{b.t}</span></div><div style={{height:4,background:C.bg,borderRadius:2,overflow:"hidden"}}><div style={{width:b.t?b.d/b.t*100+"%":"0%",height:"100%",background:b.c,borderRadius:2}}/></div></div>)}
              </div>
            </div>})}
        </div>
      </div>

      <div style={{background:C.w,borderRadius:12,padding:"14px 20px",boxShadow:C.sh,marginBottom:24,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:20}}>{advice.icon}</span>
        <span style={{fontSize:14,lineHeight:1.5}}>{advice.text}</span>
      </div>

      {/* Goals — Масштабные цели (system pinned block) */}
      <GoalsBlock userId={userId} goals={goals} goalTasks={goalTasks} dndDrag={dndDrag} dndOver={dndOver} setDndDrag={setDndDrag} setDndOver={setDndOver} onGtDragStart={onGtDragStart} onGtDragOver={onGtDragOver} onGtDrop={onGtDrop} setActiveModal={setActiveModal} TYPES={TYPES}/>
    </>}

    {/* Task modal */}
    {activeModal&&<TaskModal task={activeModal.task} taskType={activeModal.type} userId={userId} onClose={()=>setActiveModal(null)}/>}
  </>;
}

/* ============ CRM ============ */
const CRM_STAGES_FIXED = [
  {id:"new",      label:"Новый",            color:"#007AFF"},
  {id:"contact",  label:"Взаимодействовали",color:"#AF52DE"},
  {id:"call",     label:"Созвон",           color:"#FF9500"},
  {id:"closed",   label:"Закрыт",           color:"#34C759"},
  {id:"rejected", label:"Отказ",            color:"#FF3B30"},
];

function CrmPage({userId}:{userId:string}){
  const isMobile=useIsMobile();
  const{data:leads,add,update,remove}=useTable("leads",userId);
  const[tab,setTab]=useState<"list"|"kanban">("kanban");
  const[search,setSearch]=useState("");
  const[show,setShow]=useState(false);
  const[editStageId,setEditStageId]=useState<string|null>(null);
  const[stageLabels,setStageLabels]=useState<Record<string,string>>({});
  const[f,sF]=useState({name:"",contact:"",phone:"",email:"",source:"Instagram",status:"new",note:"",deal:""});
  const[dragId,setDragId]=useState<string|null>(null);
  const[dragOver,setDragOver]=useState<string|null>(null);
  const[openLead,setOpenLead]=useState<string|null>(null);

  // Merge fixed stages with any user-renamed labels
  const stages = CRM_STAGES_FIXED.map(s=>({...s,label:stageLabels[s.id]||s.label}));

  const found=useMemo(()=>{
    if(!search)return leads;
    const q=search.toLowerCase();
    return leads.filter((l:any)=>l.name.toLowerCase().includes(q)||(l.contact||"").toLowerCase().includes(q)||(l.phone||"").includes(q)||(l.email||"").toLowerCase().includes(q));
  },[leads,search]);

  const sub=async()=>{
    if(!f.name.trim())return;
    await add({...f,deal:f.deal?+f.deal:null});
    sF({name:"",contact:"",phone:"",email:"",source:"Instagram",status:"new",note:"",deal:""});
    setShow(false);
  };

  const totalD=leads.filter((l:any)=>l.status==="closed"&&l.deal).reduce((s:number,l:any)=>s+(l.deal||0),0);

  const onDragStart=(id:string,e:React.DragEvent)=>{
    setDragId(id);
    e.dataTransfer.effectAllowed="move";
  };
  const onDragOver=(stageId:string,e:React.DragEvent)=>{
    e.preventDefault();
    e.dataTransfer.dropEffect="move";
    setDragOver(stageId);
  };
  const onDrop=(stageId:string)=>{
    if(dragId){update(dragId,{status:stageId});}
    setDragId(null);setDragOver(null);
  };
  const onDragEnd=()=>{setDragId(null);setDragOver(null);};

  const stCol2=(id:string)=>stages.find(s=>s.id===id)?.color||C.t2;
  const stLbl2=(id:string)=>stages.find(s=>s.id===id)?.label||id;

  // iOS tab style
  const tabStyle=(active:boolean):React.CSSProperties=>({
    flex:1,padding:"8px 0",border:"none",borderRadius:8,
    background:active?"#fff":"transparent",
    color:active?C.t1:C.t2,fontSize:13,fontWeight:active?600:400,
    cursor:"pointer",boxShadow:active?"0 1px 4px rgba(0,0,0,0.12)":"none",
    transition:"all 0.2s",
  });

  // iOS card style for leads
  const leadCard=(l:any,stageColor:string)=>{
    const isOpen=openLead===l.id;
    return <div key={l.id} draggable
      onDragStart={e=>onDragStart(l.id,e)}
      onDragEnd={onDragEnd}
      onClick={()=>setOpenLead(isOpen?null:l.id)}
      style={{background:"#fff",borderRadius:14,padding:"13px 15px",marginBottom:8,
        cursor:"grab",userSelect:"none",
        boxShadow:"0 2px 8px rgba(0,0,0,0.08),0 0 0 0.5px rgba(0,0,0,0.06)",
        borderLeft:`3px solid ${stageColor}`,
        transition:"box-shadow 0.15s, transform 0.15s",
        opacity:dragId===l.id?0.45:1,
        transform:dragId===l.id?"scale(0.97)":"scale(1)",
      }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{fontWeight:600,fontSize:14,color:"#1C1C1E",flex:1}}>{l.name}</div>
        {l.deal&&<div style={{fontSize:12,fontWeight:700,color:"#34C759",marginLeft:8,whiteSpace:"nowrap"}}>{fmt$(l.deal)} ₽</div>}
      </div>
      {(l.phone||l.email||l.contact)&&<div style={{fontSize:12,color:"#8E8E93",marginTop:4}}>
        {l.phone||l.email||l.contact}
      </div>}
      {isOpen&&<div style={{marginTop:10,paddingTop:10,borderTop:"0.5px solid #E5E5EA"}}>
        {l.source&&<div style={{fontSize:11,color:"#8E8E93",marginBottom:4}}>Источник: {l.source}</div>}
        {l.note&&<div style={{fontSize:12,color:"#3C3C43",marginBottom:4}}>{l.note}</div>}
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
          {stages.filter(s=>s.id!==l.status).map(s=><button key={s.id} onClick={e=>{e.stopPropagation();update(l.id,{status:s.id});}} style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:"none",background:s.color+"18",color:s.color,fontWeight:600,cursor:"pointer"}}>{s.label}</button>)}
          <button onClick={e=>{e.stopPropagation();if(confirm("Удалить лида?"))remove(l.id);}} style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:"none",background:"#FF3B3018",color:"#FF3B30",fontWeight:600,cursor:"pointer",marginLeft:"auto"}}>Удалить</button>
        </div>
      </div>}
    </div>;
  };

  return <>
    {/* Stats */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12,marginBottom:24}}>
      {[
        {l:"Всего",v:leads.length,c:"#007AFF"},
        {l:"В работе",v:leads.filter((l:any)=>!["closed","rejected"].includes(l.status)).length,c:"#FF9500"},
        {l:"Закрыто",v:leads.filter((l:any)=>l.status==="closed").length,c:"#34C759"},
        {l:"Сделки",v:fmt$(totalD)+" ₽",c:"#1C1C1E"},
      ].map((s,i)=><div key={i} style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 2px 8px rgba(0,0,0,0.07),0 0 0 0.5px rgba(0,0,0,0.05)"}}>
        <div style={{fontSize:24,fontWeight:700,color:s.c,marginBottom:2}}>{s.v}</div>
        <div style={{fontSize:12,color:"#8E8E93"}}>{s.l}</div>
      </div>)}
    </div>

    {/* iOS segmented control */}
    <div style={{display:"flex",background:"#F2F2F7",borderRadius:10,padding:2,marginBottom:20,gap:2}}>
      <button style={tabStyle(tab==="kanban")} onClick={()=>setTab("kanban")}>Канбан</button>
      <button style={tabStyle(tab==="list")} onClick={()=>setTab("list")}>Список лидов</button>
    </div>

    {/* KANBAN TAB */}
    {tab==="kanban"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:12,color:"#8E8E93"}}>Перетаскивай карточки между этапами. Нажми на этап чтобы переименовать.</div>
        <button onClick={()=>setShow(!show)} style={{padding:"9px 18px",background:"#007AFF",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Лид</button>
      </div>

      {show&&<div style={{background:"#fff",borderRadius:16,padding:20,marginBottom:20,boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:14,color:"#1C1C1E"}}>Новый лид</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12}}>
          {([["name","Имя *"],["contact","Контакт"],["phone","Телефон"],["email","Email"],["note","Заметка"],["deal","Сделка, ₽"]] as const).map(([k,l])=><div key={k}>
            <label style={{fontSize:11,color:"#8E8E93",display:"block",marginBottom:5,fontWeight:500}}>{l}</label>
            <input type={k==="deal"?"number":"text"} value={(f as any)[k]} onChange={e=>sF({...f,[k]:e.target.value})}
              style={{width:"100%",padding:"10px 12px",border:"0.5px solid #C6C6C8",borderRadius:10,fontSize:13,outline:"none",background:"#FAFAFA",boxSizing:"border-box",fontFamily:"'Montserrat',sans-serif"}}/>
          </div>)}
          <div><label style={{fontSize:11,color:"#8E8E93",display:"block",marginBottom:5,fontWeight:500}}>Источник</label>
            <select value={f.source} onChange={e=>sF({...f,source:e.target.value})} style={{width:"100%",padding:"10px 12px",border:"0.5px solid #C6C6C8",borderRadius:10,fontSize:13,outline:"none",background:"#FAFAFA",boxSizing:"border-box"}}>
              {SRCS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label style={{fontSize:11,color:"#8E8E93",display:"block",marginBottom:5,fontWeight:500}}>Этап</label>
            <select value={f.status} onChange={e=>sF({...f,status:e.target.value})} style={{width:"100%",padding:"10px 12px",border:"0.5px solid #C6C6C8",borderRadius:10,fontSize:13,outline:"none",background:"#FAFAFA",boxSizing:"border-box"}}>
              {stages.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={sub} style={{padding:"10px 20px",background:"#007AFF",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Добавить</button>
          <button onClick={()=>setShow(false)} style={{padding:"10px 16px",background:"#F2F2F7",color:"#8E8E93",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Отмена</button>
        </div>
      </div>}

      {/* Kanban board */}
      <div style={{display:"flex",gap:isMobile?10:14,overflowX:"auto",paddingBottom:16,alignItems:"flex-start"}}>
        {stages.map(stage=>{
          const stageLeads=leads.filter((l:any)=>l.status===stage.id);
          const isOver=dragOver===stage.id;
          return <div key={stage.id}
            onDragOver={e=>onDragOver(stage.id,e)}
            onDrop={()=>onDrop(stage.id)}
            onDragLeave={()=>setDragOver(null)}
            style={{
              minWidth:240,width:240,flexShrink:0,
              background:isOver?"#F0F6FF":"#F2F2F7",
              borderRadius:18,padding:"0 0 12px",
              boxShadow:isOver?"0 0 0 2px #007AFF,0 4px 20px rgba(0,122,255,0.15)":"0 1px 4px rgba(0,0,0,0.06)",
              transition:"box-shadow 0.2s, background 0.2s",
              border:isOver?"2px solid #007AFF":"2px solid transparent",
            }}>
            {/* Stage header */}
            <div style={{padding:"14px 14px 10px",borderBottom:"0.5px solid rgba(0,0,0,0.06)"}}>
              {editStageId===stage.id
                ? <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input autoFocus defaultValue={stage.label}
                      onBlur={e=>{setStageLabels(p=>({...p,[stage.id]:e.target.value||stage.label}));setEditStageId(null);}}
                      onKeyDown={e=>{if(e.key==="Enter"){setStageLabels(p=>({...p,[stage.id]:(e.target as HTMLInputElement).value||stage.label}));setEditStageId(null);}if(e.key==="Escape")setEditStageId(null);}}
                      style={{flex:1,fontSize:13,fontWeight:600,padding:"4px 8px",border:"1.5px solid "+stage.color,borderRadius:8,outline:"none",background:"#fff"}}/>
                  </div>
                : <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:9,height:9,borderRadius:"50%",background:stage.color,flexShrink:0}}/>
                      <span style={{fontSize:13,fontWeight:600,color:"#1C1C1E"}}>{stage.label}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:12,fontWeight:600,color:"#fff",background:stage.color,borderRadius:20,padding:"2px 8px",minWidth:22,textAlign:"center"}}>{stageLeads.length}</span>
                      <button onClick={()=>setEditStageId(stage.id)} title="Переименовать" style={{width:24,height:24,border:"none",background:"transparent",cursor:"pointer",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#8E8E93",fontSize:13}}>✎</button>
                    </div>
                  </div>
              }
            </div>
            {/* Leads */}
            <div style={{padding:"10px 10px 0"}}>
              {stageLeads.length===0&&!isOver&&
                <div style={{padding:"20px 0",textAlign:"center",color:"#C7C7CC",fontSize:12}}>Нет лидов</div>}
              {stageLeads.map(l=>leadCard(l,stage.color))}
              {isOver&&dragId&&<div style={{height:56,borderRadius:12,border:"2px dashed "+stage.color,background:stage.color+"0A",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:12,color:stage.color,fontWeight:500}}>Перетащи сюда</span></div>}
            </div>
          </div>;
        })}
      </div>
    </>}

    {/* LIST TAB */}
    {tab==="list"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,gap:12}}>
        <input placeholder="Поиск..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{...iS,width:260,borderRadius:10,background:"#F2F2F7",border:"none",fontSize:13}}/>
        <button onClick={()=>setShow(!show)} style={{padding:"9px 18px",background:"#007AFF",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Лид</button>
      </div>
      {show&&<div style={{background:"#fff",borderRadius:16,padding:20,marginBottom:20,boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:14,color:"#1C1C1E"}}>Новый лид</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          {([["name","Имя *"],["contact","Контакт"],["phone","Телефон"],["email","Email"],["note","Заметка"],["deal","Сделка, ₽"]] as const).map(([k,l])=><div key={k}>
            <label style={{fontSize:11,color:"#8E8E93",display:"block",marginBottom:5,fontWeight:500}}>{l}</label>
            <input type={k==="deal"?"number":"text"} value={(f as any)[k]} onChange={e=>sF({...f,[k]:e.target.value})}
              style={{width:"100%",padding:"10px 12px",border:"0.5px solid #C6C6C8",borderRadius:10,fontSize:13,outline:"none",background:"#FAFAFA",boxSizing:"border-box",fontFamily:"'Montserrat',sans-serif"}}/>
          </div>)}
          <div><label style={{fontSize:11,color:"#8E8E93",display:"block",marginBottom:5,fontWeight:500}}>Этап</label>
            <select value={f.status} onChange={e=>sF({...f,status:e.target.value})} style={{width:"100%",padding:"10px 12px",border:"0.5px solid #C6C6C8",borderRadius:10,fontSize:13,outline:"none",background:"#FAFAFA",boxSizing:"border-box"}}>
              {stages.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={sub} style={{padding:"10px 20px",background:"#007AFF",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Добавить</button>
          <button onClick={()=>setShow(false)} style={{padding:"10px 16px",background:"#F2F2F7",color:"#8E8E93",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Отмена</button>
        </div>
      </div>}
      <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        {found.length===0
          ? <div style={{padding:"48px",textAlign:"center",color:"#8E8E93",fontSize:14}}>Нет лидов</div>
          : found.map((l:any,i:number)=><div key={l.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderBottom:i<found.length-1?"0.5px solid #E5E5EA":"none"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:stCol2(l.status)+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:15,fontWeight:700,color:stCol2(l.status)}}>{l.name[0]?.toUpperCase()}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:"#1C1C1E"}}>{l.name}</div>
                <div style={{fontSize:12,color:"#8E8E93",marginTop:2}}>{l.phone||l.email||l.contact||l.source}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {l.deal&&<span style={{fontSize:12,fontWeight:600,color:"#34C759"}}>{fmt$(l.deal)} ₽</span>}
                <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:stCol2(l.status)+"18",color:stCol2(l.status)}}>{stLbl2(l.status)}</span>
                <button onClick={()=>remove(l.id)} style={{width:26,height:26,borderRadius:8,border:"none",background:"#FF3B3012",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>)
        }
      </div>
    </>}
  </>;
}


/* ============ CONTENT ============ */

// Platform SVG icons for content
const PlatformIcon=({pid,size=16}:{pid:string,size?:number})=>{
  if(pid==="instagram") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#igG)" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="url(#igG)" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C"/><defs><linearGradient id="igG" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse"><stop stopColor="#F58529"/><stop offset="0.5" stopColor="#DD2A7B"/><stop offset="1" stopColor="#8134AF"/></linearGradient></defs></svg>;
  if(pid==="youtube") return <svg width={size} height={size} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#FF0000"/><path d="M19.59 7.35A2.5 2.5 0 0017.83 5.6C16.37 5.2 12 5.2 12 5.2s-4.37 0-5.83.4A2.5 2.5 0 004.41 7.35 26 26 0 004 12a26 26 0 00.41 4.65A2.5 2.5 0 006.17 18.4c1.46.4 5.83.4 5.83.4s4.37 0 5.83-.4a2.5 2.5 0 001.76-1.75A26 26 0 0020 12a26 26 0 00-.41-4.65z" fill="white"/><path d="M10 15.2l5.2-3.2-5.2-3.2v6.4z" fill="#FF0000"/></svg>;
  if(pid==="telegram") return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#29B6F6"/><path d="M5.5 11.8l11.5-4.4c.5-.2 1 .1.8.9l-2 9.2c-.1.6-.5.7-.9.5l-2.5-1.8-1.2 1.1c-.1.1-.3.2-.6.2l.2-2.6 4.8-4.3c.2-.2 0-.3-.3-.1L7.8 13.4 5.3 12.7c-.6-.2-.6-.6.2-.9z" fill="white"/></svg>;
  if(pid==="vk") return <svg width={size} height={size} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#4C75A3"/><path d="M13.1 16.3h1.2s.4 0 .5-.3c.1-.2 0-.5 0-.5s-.1-1.3.6-1.5c.7-.2 1.5 1.3 2.4 1.8.7.4 1.2.3 1.2.3l2.4-.1s1.2-.1.7-.9c0-.1-.3-.6-1.4-1.6-1.2-1.1-1-1 .4-2.9.9-1.2 1.2-2 1.1-2.3-.1-.3-1.1-.2-1.1-.2h-2.7s-.2 0-.3.1c-.1.1-.2.3-.2.3s-.4 1.1-.9 2c-1.1 1.8-1.5 1.9-1.7 1.8-.4-.3-.3-1-.3-1.6V9.4c0-1.3-.3-1.8-1.1-1.8H10c-.5 0-.8.3-.8.3s-.3.3.2.3c.6.1.7.5.7.5V12c0 1.5-.3 1.7-.7 1.7-.7 0-1.6-1.3-2.3-2.8-.3-.7-.6-1.5-.6-1.5s-.1-.2-.2-.3c-.2-.1-.4-.1-.4-.1H3.5s-.5 0-.5.3c0 .3.2.9.9 2.1C5.1 13.9 6.8 16.4 9.1 16.4c1.3 0 1.3-.2 1.3-.2l1.2-.3s.1-.2.3-.1c.2.1.1.3.1.3l-.1.5s-.1.3.1.5c.1.1.3.1.3.1h2.1" fill="white"/></svg>;
  return <div style={{width:size,height:size,borderRadius:"50%",background:C.t2+"44",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width={size*0.55} height={size*0.55} viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg></div>;
};

function ContentPage({userId}:{userId:string}){
  const isMobile=useIsMobile();
  const{data:items,add,update,remove}=useTable("content",userId);
  const[tab,setTab]=useState<"list"|"calendar"|"stories">("list");
  const[show,setShow]=useState(false);
  const[editId,setEditId]=useState<string|null>(null);
  const[coverUploading,setCoverUploading]=useState(false);
  const emptyF=()=>({platform:"instagram",type:"Пост",topic:"",status:"idea",date:today(),link:"",scenario:"",cover_url:"",content_url:"",deadline_prep:"",deadline_dev:"",deadline_pub:"",publish_date:""});
  const[f,sF]=useState<any>(emptyF());
  const[calMonth,setCalMonth]=useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()};});

  const uploadCover=async(file:File)=>{
    setCoverUploading(true);
    try{
      const compressed=await new Promise<Blob>((resolve,reject)=>{
        const img=new Image();
        const obj=URL.createObjectURL(file);
        img.onload=()=>{
          const MAX=900;
          const scale=Math.min(1,MAX/Math.max(img.width,img.height));
          const canvas=document.createElement("canvas");
          canvas.width=Math.round(img.width*scale);
          canvas.height=Math.round(img.height*scale);
          canvas.getContext("2d")!.drawImage(img,0,0,canvas.width,canvas.height);
          URL.revokeObjectURL(obj);
          canvas.toBlob(b=>b?resolve(b):reject(),"image/jpeg",0.82);
        };
        img.onerror=reject;img.src=obj;
      });
      const path=`${userId}/content_${Date.now()}.jpg`;
      const{error}=await supabase.storage.from("files").upload(path,compressed,{upsert:true,contentType:"image/jpeg"});
      if(error)throw error;
      const{data}=supabase.storage.from("files").getPublicUrl(path);
      sF((prev:any)=>({...prev,cover_url:data.publicUrl}));
    }catch(e){console.error(e);}
    finally{setCoverUploading(false);}
  };

  const sub=async()=>{
    if(!f.topic.trim())return;
    if(editId){await update(editId,f);setEditId(null);}
    else{await add(f);}
    sF(emptyF());setShow(false);
  };

  const startEdit=(item:any)=>{
    sF({platform:item.platform||"instagram",type:item.type||"Пост",topic:item.topic||"",status:item.status||"idea",date:item.date||today(),link:item.link||"",scenario:item.scenario||"",cover_url:item.cover_url||"",content_url:item.content_url||"",deadline_prep:item.deadline_prep||"",deadline_dev:item.deadline_dev||"",deadline_pub:item.deadline_pub||"",publish_date:item.publish_date||""});
    setEditId(item.id);setShow(true);
  };

  const calDays=useMemo(()=>{
    const first=new Date(calMonth.y,calMonth.m,1);
    const last=new Date(calMonth.y,calMonth.m+1,0);
    const days:any[]=[];
    const startDay=first.getDay()===0?6:first.getDay()-1;
    for(let i=0;i<startDay;i++)days.push(null);
    for(let i=1;i<=last.getDate();i++)days.push(new Date(calMonth.y,calMonth.m,i));
    return days;
  },[calMonth]);

  const itemsForDay=(d:Date)=>items.filter((x:any)=>x.date===ds(d));

  // Group by month for list view
  const groupedByMonth=useMemo(()=>{
    const sorted=[...items].sort((a:any,b:any)=>(b.date||"").localeCompare(a.date||""));
    const groups:Record<string,any[]>={};
    sorted.forEach((x:any)=>{
      const key=x.date?x.date.substring(0,7):"без даты";
      if(!groups[key])groups[key]=[];
      groups[key].push(x);
    });
    return groups;
  },[items]);

  const monthLabel=(key:string)=>{
    if(key==="без даты")return"Без даты";
    const[y,m]=key.split("-");
    return`${MS[parseInt(m)-1]} ${y}`;
  };

  const DEADLINES=[
    {key:"deadline_prep",label:"Дедлайн подготовки",color:"#8B5CF6"},
    {key:"deadline_dev",label:"Дедлайн разработки",color:C.y},
    {key:"deadline_pub",label:"Дедлайн публикации",color:C.r},
    {key:"publish_date",label:"Дата публикации",color:C.g},
  ];

  return <>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16,marginBottom:isMobile?16:24}}>
      {[{l:"Всего",v:items.length,c:C.a},{l:"В работе",v:items.filter((x:any)=>x.status==="progress").length,c:C.y},{l:"Готово",v:items.filter((x:any)=>x.status==="ready").length,c:C.a},{l:"Опубликовано",v:items.filter((x:any)=>x.status==="published").length,c:C.g}].map((s,i)=><Card key={i} style={{padding:"20px 24px"}}><div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:13,color:C.t2,marginTop:4}}>{s.l}</div></Card>)}
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"2px solid "+C.bd}}>
      {[{id:"list",label:"Контент-план"},{id:"calendar",label:"Календарь"},{id:"stories",label:"📊 Карусели историй"}].map(t=><button key={t.id} onClick={()=>setTab(t.id as any)} style={{padding:"10px 20px",background:"none",border:"none",borderBottom:tab===t.id?"3px solid "+C.a:"3px solid transparent",color:tab===t.id?C.a:C.t2,fontSize:14,fontWeight:tab===t.id?600:400,cursor:"pointer",marginBottom:-2}}>{t.label}</button>)}
    </div>

    {/* LIST TAB */}
    {tab==="list"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:600}}>Контент-план</div>
        <Btn onClick={()=>{setShow(!show);setEditId(null);sF(emptyF());}}>+ Контент</Btn>
      </div>

      {/* Form */}
      {show&&<Card style={{marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:18}}>{editId?"Редактировать":"Добавить контент"}</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}}>
          {/* Cover upload */}
          <div style={{gridRow:"span 2",display:"flex",flexDirection:"column",gap:8}}>
            <label style={{fontSize:12,color:C.t2,fontWeight:600}}>Обложка</label>
            <label style={{cursor:"pointer",flex:1}}>
              <div style={{width:"100%",aspectRatio:"1",background:C.bg,borderRadius:12,border:"2px dashed "+C.bd,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                {coverUploading
                  ? <div style={{width:24,height:24,border:"3px solid "+C.bd,borderTopColor:C.a,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  : f.cover_url
                  ? <img src={f.cover_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="cover"/>
                  : <div style={{textAlign:"center",padding:8}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5" style={{marginBottom:4}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <div style={{fontSize:11,color:C.t2}}>Загрузить фото</div>
                    </div>
                }
              </div>
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadCover(e.target.files[0]);}}/>
            </label>
          </div>

          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Тема *</label><input value={f.topic} onChange={e=>sF({...f,topic:e.target.value})} style={iS}/></div>

          {/* Platform with icon */}
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Платформа</label>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 10px",border:"1px solid "+C.bd,borderRadius:8,background:C.ib,height:38}}>
              <PlatformIcon pid={f.platform} size={18}/>
              <select value={f.platform} onChange={e=>sF({...f,platform:e.target.value})} style={{flex:1,border:"none",background:"transparent",fontSize:13,outline:"none",fontFamily:"'Montserrat',sans-serif",cursor:"pointer"}}>
                {PLATS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Тип</label><select value={f.type} onChange={e=>sF({...f,type:e.target.value})} style={iS}>{CTYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Статус</label><select value={f.status} onChange={e=>sF({...f,status:e.target.value})} style={iS}>{CSTATS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Ссылка на контент</label><input value={f.content_url} onChange={e=>sF({...f,content_url:e.target.value})} placeholder="https://..." style={iS}/></div>

          {/* Deadlines */}
          {DEADLINES.map(d=><div key={d.key}>
            <label style={{fontSize:12,display:"block",marginBottom:6,fontWeight:600,color:d.color}}>{d.label}</label>
            <input type="datetime-local" value={f[d.key]} onChange={e=>sF({...f,[d.key]:e.target.value})} style={{...iS,borderColor:f[d.key]?d.color:C.bd}}/>
          </div>)}

          <div style={{gridColumn:"span 3"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Текст контента</label><textarea value={f.scenario} onChange={e=>sF({...f,scenario:e.target.value})} rows={3} style={{...iS,resize:"vertical"}}/></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:16}}><Btn onClick={sub}>{editId?"Сохранить":"Добавить"}</Btn><Btn primary={false} onClick={()=>{setShow(false);setEditId(null);}}>Отмена</Btn></div>
      </Card>}

      {/* Grouped list */}
      {items.length===0
        ? <Card style={{padding:"48px",textAlign:"center"}}><span style={{color:C.t2}}>Нет публикаций</span></Card>
        : Object.entries(groupedByMonth).map(([key,group])=><div key={key} style={{marginBottom:24}}>
            <div style={{fontSize:13,fontWeight:700,color:C.t2,letterSpacing:0.5,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
              {monthLabel(key)}
              <span style={{fontSize:11,fontWeight:500,background:C.bd,borderRadius:20,padding:"1px 8px",textTransform:"none"}}>{(group as any[]).length}</span>
            </div>
            <Card style={{padding:0,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:14,minWidth:isMobile?480:0}}>
                <tbody>{(group as any[]).map((x:any,i:number)=><tr key={x.id} style={{borderBottom:i<(group as any[]).length-1?"1px solid "+C.bd:"none"}}
                  onMouseEnter={e=>(e.currentTarget.style.background=C.bg)} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  {/* Cover thumbnail */}
                  <td style={{padding:"10px 12px",width:52}}>
                    <div style={{width:44,height:44,borderRadius:8,overflow:"hidden",background:C.bg,border:"1px solid "+C.bd,flexShrink:0,position:"relative"}}>
                      {x.cover_url?<img src={x.cover_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><PlatformIcon pid={x.platform} size={16}/></div>}
                    </div>
                  </td>
                  {/* Platform icon */}
                  <td style={{padding:"10px 8px",width:28}}><PlatformIcon pid={x.platform} size={20}/></td>
                  <td style={{padding:"10px 8px",minWidth:80}}><Tag label={pLbl(x.platform)} color={pCol(x.platform)}/></td>
                  <td style={{padding:"10px 8px",width:80,fontSize:12,color:C.t2}}>{x.type}</td>
                  <td style={{padding:"10px 12px",fontWeight:500}}>
                    {x.topic}
                    {x.scenario&&<div style={{fontSize:11,color:C.t2,marginTop:1,maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{x.scenario}</div>}
                  </td>
                  <td style={{padding:"10px 8px"}}><Tag label={csLbl(x.status)} color={csCol(x.status)}/></td>
                  <td style={{padding:"10px 8px",fontSize:11,color:C.t2,whiteSpace:"nowrap"}}>{x.date||""}</td>
                  <td style={{padding:"10px 10px"}}>
                    <div style={{display:"flex",gap:5,alignItems:"center"}}>
                      {/* View link button */}
                      {x.content_url
                        ? <a href={x.content_url} target="_blank" rel="noreferrer" style={{padding:"5px 10px",background:C.a+"12",color:C.a,borderRadius:7,fontSize:11,fontWeight:600,textDecoration:"none",whiteSpace:"nowrap",border:"1px solid "+C.a+"22"}}>Посмотреть</a>
                        : <span style={{padding:"5px 10px",background:C.bg,color:C.t2,borderRadius:7,fontSize:11,border:"1px solid "+C.bd,whiteSpace:"nowrap",opacity:0.5}}>Посмотреть</span>
                      }
                      <button onClick={()=>startEdit(x)} style={{width:28,height:28,borderRadius:6,border:"none",background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={12} color={C.a} sw={2}/></button>
                      <button onClick={()=>remove(x.id)} style={{width:28,height:28,borderRadius:6,border:"none",background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I path="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={12} color={C.r} sw={2}/></button>
                    </div>
                  </td>
                </tr>)}</tbody>
              </table></div>
            </Card>
          </div>)
      }
    </>}

    {/* CALENDAR TAB */}
    {tab==="calendar"&&<>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={()=>setCalMonth(m=>m.m===0?{y:m.y-1,m:11}:{y:m.y,m:m.m-1})} style={{width:36,height:36,border:"1px solid "+C.bd,borderRadius:10,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span style={{fontSize:16,fontWeight:600,minWidth:140,textAlign:"center"}}>{MS[calMonth.m]} {calMonth.y}</span>
        <button onClick={()=>setCalMonth(m=>m.m===11?{y:m.y+1,m:0}:{y:m.y,m:m.m+1})} style={{width:36,height:36,border:"1px solid "+C.bd,borderRadius:10,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"2px solid "+C.bd}}>
          {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d=><div key={d} style={{padding:"10px",textAlign:"center",fontSize:12,fontWeight:600,color:C.t2}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {calDays.map((d,i)=>{
            const dayItems=d?itemsForDay(d):[];
            const isT=d&&ds(d)===today();
            return <div key={i} style={{minHeight:110,padding:"6px",borderRight:i%7!==6?"1px solid "+C.bd:"none",borderBottom:"1px solid "+C.bd,background:isT?"rgba(37,99,235,0.03)":"transparent"}}>
              {d&&<>
                <div style={{fontSize:13,fontWeight:isT?700:400,color:isT?C.a:C.t1,marginBottom:5}}>{d.getDate()}</div>
                {dayItems.slice(0,3).map((x:any)=><div key={x.id} style={{marginBottom:4,borderRadius:6,overflow:"hidden",border:"1px solid "+C.bd,background:C.w}}>
                  {x.cover_url&&<img src={x.cover_url} style={{width:"100%",height:36,objectFit:"cover",display:"block"}} alt=""/>}
                  <div style={{padding:"3px 5px",display:"flex",alignItems:"center",gap:4}}>
                    <PlatformIcon pid={x.platform} size={10}/>
                    <span style={{fontSize:9,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,color:C.t1}}>{x.topic}</span>
                  </div>
                </div>)}
                {dayItems.length>3&&<div style={{fontSize:9,color:C.t2,textAlign:"center"}}>+{dayItems.length-3}</div>}
              </>}
            </div>;
          })}
        </div>
      </Card>
    </>}

    {tab==="stories"&&<StoriesCarouselTab userId={userId}/>}
  </>;
}

/* ============ STORIES CAROUSEL ============ */
function StoriesCarouselTab({userId}:{userId:string}){
  const carousels=useTable("story_carousels",userId);
  const items=useTable("story_items",userId);
  const[editTitleId,setEditTitleId]=useState<string|null>(null);
  const[editTitleVal,setEditTitleVal]=useState("");
  const[lightbox,setLightbox]=useState<string|null>(null);

  const addCarousel=async()=>{
    try{
      const title="Карусель "+(carousels.data.length+1);
      const newCar=await carousels.add({title});
      if(newCar?.id){
        for(let i=0;i<3;i++){
          await items.add({carousel_id:newCar.id,image_url:"",view_count:0,order_index:i});
        }
      }
    }catch(err){
      console.error("addCarousel error:",err);
    }
  };

  const addSlot=async(carouselId:string)=>{
    const existing=items.data.filter((x:any)=>x.carousel_id===carouselId);
    if(existing.length>=15)return;
    await items.add({carousel_id:carouselId,image_url:"",view_count:0,order_index:existing.length});
  };

  const saveTitle=async(id:string)=>{
    if(editTitleVal.trim())await carousels.update(id,{title:editTitleVal.trim()});
    setEditTitleId(null);
  };

  const[uploading,setUploading]=useState<string|null>(null);

  const uploadImage=async(slotId:string,file:File)=>{
    setUploading(slotId);
    try{
      // Compress via canvas before upload (max 900px, quality 0.8)
      const compressed=await new Promise<Blob>((resolve,reject)=>{
        const img=new Image();
        const objUrl=URL.createObjectURL(file);
        img.onload=()=>{
          const MAX=900;
          const scale=Math.min(1,MAX/Math.max(img.width,img.height));
          const w=Math.round(img.width*scale);
          const h=Math.round(img.height*scale);
          const canvas=document.createElement("canvas");
          canvas.width=w;canvas.height=h;
          canvas.getContext("2d")!.drawImage(img,0,0,w,h);
          URL.revokeObjectURL(objUrl);
          canvas.toBlob(b=>b?resolve(b):reject(new Error("Canvas blob failed")),"image/jpeg",0.8);
        };
        img.onerror=reject;
        img.src=objUrl;
      });

      const path=`${userId}/${slotId}_${Date.now()}.jpg`;
      const{error:upErr}=await supabase.storage.from("stories").upload(path,compressed,{upsert:true,contentType:"image/jpeg"});
      if(upErr)throw upErr;

      const{data}=supabase.storage.from("stories").getPublicUrl(path);
      await items.update(slotId,{image_url:data.publicUrl});
    }catch(err:any){
      console.error("Upload failed:",err?.message||err);
    }finally{
      setUploading(null);
    }
  };

  const updateViews=async(slotId:string,val:string)=>{
    await items.update(slotId,{view_count:+val||0});
  };

  const getCarouselItems=(carouselId:string)=>
    [...items.data.filter((x:any)=>x.carousel_id===carouselId)]
      .sort((a:any,b:any)=>a.order_index-b.order_index);

  const calcAnalytics=(slots:any[],key:"ig_view_count"|"tg_view_count")=>{
    const filled=slots.filter(s=>s[key]>0);
    if(filled.length<2)return null;
    const first=slots[0][key]||0;
    const last=slots[slots.length-1][key]||0;
    if(!first)return null;
    const retention=Math.round(last/first*100);
    const lost=first-last;
    let maxDrop=0,maxDropIdx=0;
    for(let i=1;i<slots.length;i++){
      const drop=(slots[i-1][key]||0)-(slots[i][key]||0);
      if(drop>maxDrop){maxDrop=drop;maxDropIdx=i;}
    }
    const avgDrop=slots.length>1?Math.round((first-last)/(slots.length-1)):0;
    return{retention,lost,maxDrop,maxDropIdx,first,last,avgDrop};
  };

  const IG_COLOR="#E1306C";
  const TG_COLOR="#0088CC";

  const RetentionRing=({pct,color,size=80}:{pct:number,color:string,size?:number})=>{
    const r=size*0.4;
    const circ=2*Math.PI*r;
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.bd} strokeWidth={size*0.09}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.09}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ*(1-Math.min(pct,100)/100)}
        style={{transition:"stroke-dashoffset 0.5s ease"}}/>
    </svg>;
  };

  const PlatformAnalytics=({slots,platform,color,icon}:{slots:any[],platform:"ig"|"tg",color:string,icon:React.ReactNode})=>{
    const key=platform==="ig"?"ig_view_count":"tg_view_count";
    const an=calcAnalytics(slots,key);
    const bg=color+"10";
    const border=color+"30";
    return <div style={{borderRadius:12,border:`1px solid ${border}`,overflow:"hidden"}}>
      <div style={{padding:"8px 12px",background:bg,display:"flex",alignItems:"center",gap:6,borderBottom:`1px solid ${border}`}}>
        {icon}
        <span style={{fontSize:11,fontWeight:700,color}}>{platform==="ig"?"Instagram":"Telegram"}</span>
      </div>
      {!an
        ? <div style={{padding:"10px 12px",fontSize:11,color:C.t2}}>Введи просмотры</div>
        : <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{position:"relative",width:56,height:56,flexShrink:0}}>
                <RetentionRing pct={an.retention} color={color} size={56}/>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                  <span style={{fontSize:11,fontWeight:800,color}}>{an.retention}%</span>
                </div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,color:C.t2}}>Дошло до конца</div>
                <div style={{fontSize:11,fontWeight:600,color:C.t1,marginTop:1}}>{an.first.toLocaleString("ru")} → {an.last.toLocaleString("ru")}</div>
                <div style={{fontSize:11,fontWeight:700,color:C.r,marginTop:1}}>-{an.lost.toLocaleString("ru")} зрителей</div>
              </div>
            </div>
            {an.maxDrop>0&&<div style={{background:color+"0A",borderRadius:8,padding:"7px 10px",border:`1px solid ${color}22`}}>
              <div style={{fontSize:10,fontWeight:600,color,marginBottom:2}}>Главный отвал</div>
              <div style={{fontSize:11,color:C.t1}}>Сторис #{an.maxDropIdx} → #{an.maxDropIdx+1}</div>
              <div style={{fontSize:11,fontWeight:700,color:C.r}}>-{an.maxDrop.toLocaleString("ru")} просмотров</div>
            </div>}
          </div>
      }
    </div>;
  };

  const IgIcon=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={IG_COLOR} strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill={IG_COLOR} stroke="none"/></svg>;
  const TgIcon=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TG_COLOR} strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>;

  return <>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div>
        <div style={{fontSize:18,fontWeight:700}}>Карусели историй</div>
        <div style={{fontSize:13,color:C.t2,marginTop:2}}>Аналитика удержания внимания — Instagram & Telegram</div>
      </div>
      <button onClick={addCarousel} style={{padding:"10px 20px",background:C.a,color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Новая карусель
      </button>
    </div>

    {carousels.data.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:C.t2}}>
      <div style={{fontSize:40,marginBottom:12}}>📊</div>
      <div style={{fontSize:16,fontWeight:600,marginBottom:8,color:C.t1}}>Нет каруселей</div>
      <div style={{fontSize:13}}>Создай карусель, загрузи сторис и введи просмотры для анализа</div>
    </div>}

    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {[...carousels.data].reverse().map((car:any)=>{
        const slots=getCarouselItems(car.id);
        const igAn=calcAnalytics(slots,"ig_view_count");
        const tgAn=calcAnalytics(slots,"tg_view_count");
        const maxIgViews=Math.max(...slots.map((s:any)=>s.ig_view_count||0),1);
        const maxTgViews=Math.max(...slots.map((s:any)=>s.tg_view_count||0),1);

        return <div key={car.id} style={{background:C.w,borderRadius:20,boxShadow:"0 4px 20px rgba(0,0,0,0.07)",border:"1px solid "+C.bd,overflow:"hidden"}}>
          {/* Header */}
          <div style={{padding:"14px 20px",borderBottom:"1px solid "+C.bd,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#FAFBFC"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {editTitleId===car.id
                ? <input autoFocus value={editTitleVal} onChange={e=>setEditTitleVal(e.target.value)}
                    onBlur={()=>saveTitle(car.id)} onKeyDown={e=>{if(e.key==="Enter")saveTitle(car.id);if(e.key==="Escape")setEditTitleId(null);}}
                    style={{...iS,padding:"6px 10px",fontSize:15,fontWeight:700,width:240}}/>
                : <span style={{fontSize:15,fontWeight:700,color:C.t1,cursor:"pointer"}} onDoubleClick={()=>{setEditTitleId(car.id);setEditTitleVal(car.title);}}>{car.title}</span>
              }
              <span style={{fontSize:11,color:C.t2,background:C.bd,borderRadius:20,padding:"2px 8px"}}>{slots.length}/15 сторис</span>
              <span style={{fontSize:11,color:C.t2,cursor:"pointer"}} onClick={()=>{setEditTitleId(car.id);setEditTitleVal(car.title);}}>✏️</span>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:11,color:C.t2}}>{new Date(car.created_at).toLocaleDateString("ru-RU")}</span>
              <button onClick={()=>carousels.remove(car.id)} style={{width:28,height:28,border:"none",background:C.r+"10",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.r} strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div style={{display:"flex",gap:0}}>
            {/* Analytics panel */}
            <div style={{width:240,flexShrink:0,padding:"16px 14px",borderRight:"1px solid "+C.bd,display:"flex",flexDirection:"column",gap:12,background:"#FAFBFC"}}>
              <PlatformAnalytics slots={slots} platform="ig" color={IG_COLOR} icon={<IgIcon/>}/>
              <PlatformAnalytics slots={slots} platform="tg" color={TG_COLOR} icon={<TgIcon/>}/>
            </div>

            {/* Stories strip */}
            <div style={{flex:1,overflowX:"auto",padding:"14px 14px 12px"}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start",minWidth:"max-content"}}>
                {slots.map((slot:any,idx:number)=>{
                  const igIsMax=igAn&&igAn.maxDrop>0&&idx===igAn.maxDropIdx-1;
                  const igIsAfter=igAn&&igAn.maxDrop>0&&idx===igAn.maxDropIdx;
                  const tgIsMax=tgAn&&tgAn.maxDrop>0&&idx===tgAn.maxDropIdx-1;
                  const tgIsAfter=tgAn&&tgAn.maxDrop>0&&idx===tgAn.maxDropIdx;
                  const anyMax=igIsMax||tgIsMax;
                  const anyAfter=igIsAfter||tgIsAfter;
                  const igBarH=slot.ig_view_count?Math.max(4,Math.round(slot.ig_view_count/maxIgViews*36)):0;
                  const tgBarH=slot.tg_view_count?Math.max(4,Math.round(slot.tg_view_count/maxTgViews*36)):0;

                  // Border color based on which platform has max drop
                  const borderColor=igIsMax||igIsAfter?IG_COLOR:tgIsMax||tgIsAfter?TG_COLOR:C.bd;

                  return <div key={slot.id} style={{display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
                    {/* Drop alert markers between cards */}
                    {igIsMax&&<div style={{position:"absolute",right:-14,top:16,zIndex:10,fontSize:13}}>🩷</div>}
                    {tgIsMax&&<div style={{position:"absolute",right:-14,top:igIsMax?32:16,zIndex:10,fontSize:13}}>💙</div>}

                    {/* Dual bar chart */}
                    <div style={{width:140,height:48,display:"flex",alignItems:"flex-end",justifyContent:"center",gap:4,marginBottom:4}}>
                      {(slot.ig_view_count>0||slot.tg_view_count>0)&&<>
                        <div style={{width:18,borderRadius:"3px 3px 0 0",background:igIsMax||igIsAfter?IG_COLOR:IG_COLOR+"99",height:igBarH,transition:"height 0.3s",minHeight:slot.ig_view_count>0?4:0}}/>
                        <div style={{width:18,borderRadius:"3px 3px 0 0",background:tgIsMax||tgIsAfter?TG_COLOR:TG_COLOR+"99",height:tgBarH,transition:"height 0.3s",minHeight:slot.tg_view_count>0?4:0}}/>
                      </>}
                    </div>

                    {/* Story card */}
                    <div style={{width:140,borderRadius:16,overflow:"hidden",
                      border:`2px solid ${borderColor}`,
                      boxShadow:(anyMax||anyAfter)?`0 0 0 3px ${borderColor}22`:"none",
                      transition:"border 0.2s",background:C.bg}}>
                      {/* Image */}
                      <div style={{width:140,height:190,background:(slot.image_url&&slot.image_url.startsWith("http"))?"transparent":"#F1F3F8",cursor:"pointer",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}
                        onClick={()=>(slot.image_url&&slot.image_url.startsWith("http"))&&!uploading&&setLightbox(slot.image_url)}>
                        {uploading===slot.id
                          ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                              <div style={{width:24,height:24,border:"3px solid "+C.bd,borderTopColor:C.a,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                              <span style={{fontSize:9,color:C.t2}}>Загрузка...</span>
                            </div>
                          : (slot.image_url&&slot.image_url.startsWith("http"))
                          ? <img src={slot.image_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={`Сторис ${idx+1}`}/>
                          : <label style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,width:"100%",height:"100%",justifyContent:"center"}}>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              <span style={{fontSize:11,color:C.t2,textAlign:"center",fontWeight:500}}>Загрузить фото</span>
                              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadImage(slot.id,e.target.files[0]);}}/>
                            </label>
                        }
                        {(slot.image_url&&slot.image_url.startsWith("http"))&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0)",transition:"background 0.2s"}} onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,0,0,0.3)")} onMouseLeave={e=>(e.currentTarget.style.background="rgba(0,0,0,0)")}>
                          <label style={{position:"absolute",bottom:4,right:4,cursor:"pointer",background:"rgba(0,0,0,0.5)",borderRadius:6,padding:"3px 5px"}}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadImage(slot.id,e.target.files[0]);}}/>
                          </label>
                        </div>}
                      </div>

                      {/* Number + dual inputs */}
                      <div style={{padding:"6px 8px 10px",background:C.w}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                          <div style={{fontSize:11,fontWeight:700,color:C.t2}}>Сторис #{idx+1}</div>
                          <button onClick={()=>items.remove(slot.id)}
                            style={{width:18,height:18,borderRadius:5,border:"none",background:C.r+"15",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}
                            title="Удалить сторис">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.r} strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                        {/* Instagram input */}
                        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:5,background:IG_COLOR+"0C",borderRadius:8,padding:"5px 7px",border:`1px solid ${IG_COLOR}22`}}>
                          <IgIcon/>
                          <input type="number" value={slot.ig_view_count||""} onChange={e=>items.update(slot.id,{ig_view_count:+e.target.value||0})}
                            placeholder="IG"
                            style={{flex:1,border:"none",background:"transparent",fontSize:11,outline:"none",fontFamily:"'Montserrat',sans-serif",color:C.t1,minWidth:0,textAlign:"center"}}/>
                        </div>
                        {/* Telegram input */}
                        <div style={{display:"flex",alignItems:"center",gap:4,background:TG_COLOR+"0C",borderRadius:8,padding:"5px 7px",border:`1px solid ${TG_COLOR}22`}}>
                          <TgIcon/>
                          <input type="number" value={slot.tg_view_count||""} onChange={e=>items.update(slot.id,{tg_view_count:+e.target.value||0})}
                            placeholder="TG"
                            style={{flex:1,border:"none",background:"transparent",fontSize:11,outline:"none",fontFamily:"'Montserrat',sans-serif",color:C.t1,minWidth:0,textAlign:"center"}}/>
                        </div>
                      </div>
                    </div>
                  </div>;
                })}

                {/* Add slot */}
                {slots.length<15&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",width:140,height:48+4+190+10+48+10}}>
                  <button onClick={()=>addSlot(car.id)} style={{width:56,height:56,borderRadius:16,border:"2px dashed "+C.bd,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2,fontSize:24,transition:"all 0.15s"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;(e.currentTarget as HTMLElement).style.color=C.a;}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.color=C.t2;}}>+</button>
                </div>}
              </div>

              {/* Dual progress bars */}
              {(igAn||tgAn)&&slots.length>1&&<div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
                {[{an:igAn,color:IG_COLOR,key:"ig_view_count",label:"Instagram"},{an:tgAn,color:TG_COLOR,key:"tg_view_count",label:"Telegram"}].map(({an,color,key,label})=>an&&<div key={label}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:10,color,fontWeight:600}}>{label}</span>
                    <span style={{fontSize:10,color:an.retention>=50?C.g:C.r,fontWeight:700}}>{an.retention}% досмотрели</span>
                  </div>
                  <div style={{display:"flex",gap:2,height:5,borderRadius:3,overflow:"hidden"}}>
                    {slots.map((s:any,i:number)=>{
                      const pct=s[key as string]&&an.first?s[key as string]/an.first:0;
                      const isHot=an.maxDrop>0&&(i===an.maxDropIdx-1||i===an.maxDropIdx);
                      return <div key={s.id} style={{flex:1,background:isHot?C.r:color,opacity:Math.max(0.12,pct),borderRadius:2}}/>;
                    })}
                  </div>
                </div>)}
              </div>}
            </div>
          </div>
        </div>;
      })}
    </div>

    {/* Lightbox */}
    {lightbox&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={()=>setLightbox(null)}>
      <img src={lightbox} style={{maxWidth:"80vw",maxHeight:"90vh",borderRadius:16,objectFit:"contain",boxShadow:"0 24px 80px rgba(0,0,0,0.5)"}} alt="preview"/>
      <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:20,right:24,width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
    </div>}
  </>;
}

/* ============ P&L ============ */
function PnlPage({userId}:{userId:string}){
  const isMobile=useIsMobile();
  const{data:tx,add,remove}=useTable("pnl",userId);
  const[show,setShow]=useState(false);
  const[f,sF]=useState({type:"income",amount:"",category:"Продажи",date:today(),comment:""});
  const sub=async()=>{if(!f.amount||+f.amount<=0)return;await add({...f,amount:+f.amount});sF({type:"income",amount:"",category:"Продажи",date:today(),comment:""});setShow(false);};
  const cm=today().substring(0,7);
  const cI=tx.filter((t:any)=>t.type==="income"&&t.date?.startsWith(cm)).reduce((s:number,t:any)=>s+(t.amount||0),0);
  const cE=tx.filter((t:any)=>t.type==="expense"&&t.date?.startsWith(cm)).reduce((s:number,t:any)=>s+(t.amount||0),0);
  const cP=cI-cE;
  const cats=["Продажи","Реклама","Зарплата","Аренда","Сервисы","Другое"];
  return <>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:isMobile?10:16,marginBottom:isMobile?12:24}}>
      {[{l:"Доходы",v:"+"+fmt$(cI)+" ₽",c:C.g},{l:"Расходы",v:fmt$(cE)+" ₽",c:C.r},{l:"Прибыль",v:(cP>=0?"+":"")+fmt$(cP)+" ₽",c:cP>=0?C.g:C.r}].map((s,i)=><Card key={i} style={{padding:"20px 24px"}}><div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:13,color:C.t2,marginTop:4}}>{s.l} (месяц)</div></Card>)}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><div style={{fontSize:18,fontWeight:600}}>Транзакции</div><Btn onClick={()=>setShow(!show)}>+ Транзакция</Btn></div>
    {show&&<Card style={{marginBottom:20}}><div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}}>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Тип</label><select value={f.type} onChange={e=>sF({...f,type:e.target.value})} style={iS}><option value="income">Доход</option><option value="expense">Расход</option></select></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Сумма</label><input type="number" value={f.amount} onChange={e=>sF({...f,amount:e.target.value})} style={iS}/></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Категория</label><select value={f.category} onChange={e=>sF({...f,category:e.target.value})} style={iS}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Дата</label><input type="date" value={f.date} onChange={e=>sF({...f,date:e.target.value})} style={iS}/></div>
      <div style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Комментарий</label><input value={f.comment} onChange={e=>sF({...f,comment:e.target.value})} style={iS}/></div>
    </div><div style={{display:"flex",gap:10,marginTop:16}}><Btn onClick={sub}>Добавить</Btn><Btn primary={false} onClick={()=>setShow(false)}>Отмена</Btn></div></Card>}
    <Card style={{padding:0,overflow:"hidden"}}>{tx.length===0?<div style={{padding:"48px",textAlign:"center",color:C.t2}}>Нет транзакций</div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{borderBottom:"2px solid "+C.bd}}>{["Дата","Тип","Сумма","Категория","Комментарий",""].map((h,i)=><th key={i} style={{padding:"14px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:C.t2,textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{tx.map((t:any)=><tr key={t.id} style={{borderBottom:"1px solid "+C.bd}}><td style={{padding:"14px 16px",fontSize:13}}>{t.date}</td><td style={{padding:"14px 16px"}}><Tag label={t.type==="income"?"Доход":"Расход"} color={t.type==="income"?C.g:C.r}/></td><td style={{padding:"14px 16px",fontWeight:600,color:t.type==="income"?C.g:C.r}}>{(t.type==="income"?"+":"-")+fmt$(t.amount)} ₽</td><td style={{padding:"14px 16px"}}>{t.category}</td><td style={{padding:"14px 16px",color:C.t2}}>{t.comment||"-"}</td><td style={{padding:"14px 8px"}}><button onClick={()=>remove(t.id)} style={{width:28,height:28,borderRadius:6,border:"none",background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I path="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={12} color={C.r} sw={2}/></button></td></tr>)}</tbody></table></div>}</Card>
  </>;
}

/* ============ MEDIA ============ */
function LineChart({data,color,label,width=280,height=120}:{data:number[],color:string,label:string,width?:number,height?:number}){
  const[hoverIdx,setHoverIdx]=useState<number|null>(null);
  if(data.length<2)return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:C.t2,fontSize:12}}>Мало данных</div>;
  const pad={t:10,r:10,b:24,l:40};
  const W=width-pad.l-pad.r, H=height-pad.t-pad.b;
  const min=Math.min(...data), max=Math.max(...data);
  const range=max-min||1;
  const pts=data.map((v,i)=>({x:pad.l+i/(data.length-1)*W, y:pad.t+H-(v-min)/range*H, v}));
  const path="M"+pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L");
  const area=path+` L${pts[pts.length-1].x.toFixed(1)},${(pad.t+H).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.t+H).toFixed(1)} Z`;
  return <svg width={width} height={height} style={{overflow:"visible"}}>
    {[0,0.5,1].map(f=>{
      const y=pad.t+H*(1-f);
      const v=min+range*f;
      return <g key={f}>
        <line x1={pad.l} x2={pad.l+W} y1={y} y2={y} stroke={C.bd} strokeWidth="1"/>
        <text x={pad.l-4} y={y+4} textAnchor="end" fontSize="9" fill={C.t2}>{v>=1000?(v/1000).toFixed(0)+"к":Math.round(v)}</text>
      </g>;
    })}
    <path d={area} fill={color} fillOpacity="0.08"/>
    <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={hoverIdx===i?5:3} fill={color} stroke="#fff" strokeWidth="1.5"
      style={{cursor:"pointer"}} onMouseEnter={()=>setHoverIdx(i)} onMouseLeave={()=>setHoverIdx(null)}/>)}
    {hoverIdx!==null&&<g>
      <rect x={pts[hoverIdx].x-28} y={pts[hoverIdx].y-26} width={56} height={18} rx={4} fill={C.dk} opacity="0.9"/>
      <text x={pts[hoverIdx].x} y={pts[hoverIdx].y-13} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">{fmt$(pts[hoverIdx].v)}</text>
    </g>}
  </svg>;
}

function BarChart({data,labels,color,width=280,height=120}:{data:number[],labels:string[],color:string,width?:number,height?:number}){
  const[hoverIdx,setHoverIdx]=useState<number|null>(null);
  if(!data.length)return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:C.t2,fontSize:12}}>Нет данных</div>;
  const pad={t:10,r:8,b:24,l:40};
  const W=width-pad.l-pad.r, H=height-pad.t-pad.b;
  const max=Math.max(...data,1);
  const bw=Math.max(4,W/data.length*0.6);
  const gap=W/data.length;
  return <svg width={width} height={height} style={{overflow:"visible"}}>
    {[0,0.5,1].map(f=>{
      const y=pad.t+H*(1-f);
      const v=max*f;
      return <g key={f}>
        <line x1={pad.l} x2={pad.l+W} y1={y} y2={y} stroke={C.bd} strokeWidth="1"/>
        <text x={pad.l-4} y={y+4} textAnchor="end" fontSize="9" fill={C.t2}>{v>=1000?(v/1000).toFixed(0)+"к":Math.round(v)}</text>
      </g>;
    })}
    {data.map((v,i)=>{
      const bh=Math.max(2,(v/max)*H);
      const x=pad.l+gap*i+gap/2-bw/2;
      const y=pad.t+H-bh;
      return <g key={i}>
        <rect x={x} y={y} width={bw} height={bh} rx={3} fill={hoverIdx===i?color:color+"bb"}
          style={{cursor:"pointer"}} onMouseEnter={()=>setHoverIdx(i)} onMouseLeave={()=>setHoverIdx(null)}/>
        {labels[i]&&<text x={x+bw/2} y={pad.t+H+14} textAnchor="middle" fontSize="9" fill={C.t2}>{labels[i]}</text>}
        {hoverIdx===i&&<g>
          <rect x={x+bw/2-28} y={y-22} width={56} height={18} rx={4} fill={C.dk} opacity="0.9"/>
          <text x={x+bw/2} y={y-9} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">{fmt$(v)}</text>
        </g>}
      </g>;
    })}
  </svg>;
}

function MediaPage({userId}:{userId:string}){
  const isMobile=useIsMobile();
  const{data,add,remove}=useTable("media",userId);
  const[show,setShow]=useState(false);
  const[period,setPeriod]=useState<"week"|"month"|"year"|"all">("month");
  const[f,sF]=useState({date:today(),ig:0,yt:0,tg:0,oth:0,ig_story:0,tg_story:0});
  const sub=async()=>{await add(f);sF({date:today(),ig:0,yt:0,tg:0,oth:0,ig_story:0,tg_story:0});setShow(false);};

  const sorted=useMemo(()=>[...data].sort((a:any,b:any)=>a.date?.localeCompare(b.date)),[data]);

  const filtered=useMemo(()=>{
    const now=new Date();
    const cutoff=new Date(now);
    if(period==="week") cutoff.setDate(now.getDate()-7);
    else if(period==="month") cutoff.setMonth(now.getMonth()-1);
    else if(period==="year") cutoff.setFullYear(now.getFullYear()-1);
    else return sorted;
    const cutStr=ds(cutoff);
    return sorted.filter((d:any)=>d.date>=cutStr);
  },[sorted,period]);

  const latest=sorted[sorted.length-1]||null;
  const prev=sorted[sorted.length-2]||null;

  const delta=(key:string)=>{
    if(!latest||!prev)return null;
    const d=(latest[key]||0)-(prev[key]||0);
    return d;
  };

  const PERIODS=[{id:"week",label:"Неделя"},{id:"month",label:"Месяц"},{id:"year",label:"Год"},{id:"all",label:"Всё время"}];
  const chartW=260;

  return <>
    <div style={{background:`linear-gradient(135deg,${C.dk},${C.da})`,borderRadius:16,padding:"24px 32px",marginBottom:24,color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:20,fontWeight:700}}>Медийность</div><div style={{fontSize:13,opacity:0.6,marginTop:4}}>Динамика аудитории и охватов</div></div>
      <Btn onClick={()=>setShow(!show)} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)"}}>+ Данные</Btn>
    </div>

    {/* Latest stats */}
    {latest&&<div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16,marginBottom:isMobile?12:24}}>
      {[{l:"Instagram",key:"ig",c:C.pk},{l:"YouTube",key:"yt",c:C.r},{l:"Telegram",key:"tg",c:C.a},{l:"Другие",key:"oth",c:C.t2}].map(p=>{
        const d=delta(p.key);
        return <Card key={p.key} style={{padding:"20px 24px"}}>
          <div style={{fontSize:24,fontWeight:700,color:p.c}}>{fmt$(latest[p.key]||0)}</div>
          <div style={{fontSize:13,color:C.t2,marginTop:4}}>{p.l}</div>
          {d!==null&&<div style={{fontSize:11,marginTop:6,color:d>=0?C.g:C.r,fontWeight:600}}>{d>=0?"+":""}{fmt$(d)} с прошлого раза</div>}
        </Card>;
      })}
    </div>}

    {/* Period selector */}
    <div style={{display:"flex",gap:4,marginBottom:20}}>
      {PERIODS.map(p=><button key={p.id} onClick={()=>setPeriod(p.id as any)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid "+(period===p.id?C.a:C.bd),background:period===p.id?C.a:"transparent",color:period===p.id?"#fff":C.t2,fontSize:13,fontWeight:period===p.id?600:400,cursor:"pointer"}}>{p.label}</button>)}
    </div>

    {show&&<Card style={{marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Добавить данные</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:14}}>
        <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Дата</label><input type="date" value={f.date} onChange={e=>sF({...f,date:e.target.value})} style={iS}/></div>
        {([["ig","Instagram (подписчики)"],["yt","YouTube (подписчики)"],["tg","Telegram (подписчики)"],["oth","Другие"]] as const).map(([k,l])=><div key={k}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{l}</label><input type="number" value={(f as any)[k]} onChange={e=>sF({...f,[k]:+e.target.value})} style={iS}/></div>)}
        {([["ig_story","Охват Stories IG"],["tg_story","Охват Telegram"]] as const).map(([k,l])=><div key={k} style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{l}</label><input type="number" value={(f as any)[k]} onChange={e=>sF({...f,[k]:+e.target.value})} style={iS}/></div>)}
      </div>
      <div style={{display:"flex",gap:10,marginTop:16}}><Btn onClick={sub}>Сохранить</Btn><Btn primary={false} onClick={()=>setShow(false)}>Отмена</Btn></div>
    </Card>}

    {filtered.length<2
      ? <Card style={{padding:"48px",textAlign:"center"}}><div style={{color:C.t2,fontSize:14}}>Добавь минимум 2 записи для построения графиков</div></Card>
      : <>
        {/* Audience growth */}
        <div style={{marginBottom:8,fontSize:16,fontWeight:700}}>Рост аудитории</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:16,marginBottom:24}}>
          {[{l:"Instagram",key:"ig",c:C.pk},{l:"YouTube",key:"yt",c:C.r},{l:"Telegram",key:"tg",c:C.a}].map(p=><Card key={p.key} style={{padding:"16px 20px"}}>
            <div style={{fontSize:13,fontWeight:600,color:p.c,marginBottom:12}}>{p.l}</div>
            <LineChart data={filtered.map((d:any)=>d[p.key]||0)} color={p.c} label={p.l} width={chartW} height={130}/>
          </Card>)}
        </div>

        {/* Reach */}
        <div style={{marginBottom:8,fontSize:16,fontWeight:700}}>Охваты</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:24}}>
          {[{l:"Stories Instagram",key:"ig_story",c:C.pk},{l:"Telegram",key:"tg_story",c:C.a}].map(p=>{
            const labels=filtered.map((d:any)=>d.date?.substring(5)||"");
            return <Card key={p.key} style={{padding:"16px 20px"}}>
              <div style={{fontSize:13,fontWeight:600,color:p.c,marginBottom:12}}>{p.l}</div>
              <BarChart data={filtered.map((d:any)=>d[p.key]||0)} labels={labels} color={p.c} width={chartW} height={130}/>
            </Card>;
          })}
        </div>
      </>
    }

    {/* Data table */}
    <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>История данных</div>
    <Card style={{padding:0,overflow:"hidden"}}>
      {sorted.length===0
        ? <div style={{padding:"48px",textAlign:"center",color:C.t2}}>Добавь первые данные</div>
        : <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead><tr style={{borderBottom:"2px solid "+C.bd}}>{["Дата","IG","YT","TG","Другие","Stories IG","Stories TG",""].map((h,i)=><th key={i} style={{padding:"12px 14px",textAlign:"left",fontSize:12,fontWeight:600,color:C.t2}}>{h}</th>)}</tr></thead>
            <tbody>{[...sorted].reverse().map((d:any)=><tr key={d.id} style={{borderBottom:"1px solid "+C.bd}}>
              <td style={{padding:"12px 14px",fontWeight:500}}>{d.date}</td>
              <td style={{padding:"12px 14px",color:C.pk,fontWeight:600}}>{fmt$(d.ig)}</td>
              <td style={{padding:"12px 14px",color:C.r,fontWeight:600}}>{fmt$(d.yt)}</td>
              <td style={{padding:"12px 14px",color:C.a,fontWeight:600}}>{fmt$(d.tg)}</td>
              <td style={{padding:"12px 14px"}}>{d.oth}</td>
              <td style={{padding:"12px 14px"}}>{d.ig_story}</td>
              <td style={{padding:"12px 14px"}}>{d.tg_story}</td>
              <td style={{padding:"12px 8px"}}><button onClick={()=>remove(d.id)} style={{width:28,height:28,borderRadius:6,border:"none",background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I path="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={12} color={C.r} sw={2}/></button></td>
            </tr>)}</tbody>
          </table></div>
      }
    </Card>
  </>;
}

/* ============ ADS ============ */
function AdsPage({userId}:{userId:string}){
  const isMobile=useIsMobile();
  const{data:camps,add,remove}=useTable("ads",userId);
  const[show,setShow]=useState(false);
  const[f,sF]=useState({name:"",platform:"Instagram",budget:"",spent:"",leads:"",revenue:"",reach:"",impressions:"",clicks:"",description:"",status:"active",period:""});
  const sub=async()=>{
    if(!f.name.trim())return;
    const budget=+f.budget||0;
    const spent=+f.spent||0;
    const leads=+f.leads||0;
    const impressions=+f.impressions||0;
    const clicks=+f.clicks||0;
    await add({...f,budget,spent,leads,revenue:+f.revenue||0,reach:+f.reach||0,impressions,clicks});
    sF({name:"",platform:"Instagram",budget:"",spent:"",leads:"",revenue:"",reach:"",impressions:"",clicks:"",description:"",status:"active",period:""});
    setShow(false);
  };

  const totalBudget=camps.reduce((s:number,c:any)=>s+(c.budget||0),0);
  const totalLeads=camps.reduce((s:number,c:any)=>s+(c.leads||0),0);
  const totalSpent=camps.reduce((s:number,c:any)=>s+(c.spent||0),0);
  const totalClicks=camps.reduce((s:number,c:any)=>s+(c.clicks||0),0);
  const totalImpressions=camps.reduce((s:number,c:any)=>s+(c.impressions||0),0);
  const avgCPL=totalLeads>0?Math.round(totalSpent/totalLeads):0;
  const avgCTR=totalImpressions>0?((totalClicks/totalImpressions)*100).toFixed(2):0;

  return <>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:16,marginBottom:isMobile?12:24}}>
      {[{l:"Общий бюджет",v:fmt$(totalBudget)+" ₽",c:C.a},{l:"Всего лидов",v:totalLeads,c:C.g},{l:"Средний CTR",v:avgCTR+"%",c:C.y},{l:"Средний CPL",v:avgCPL?fmt$(avgCPL)+" ₽":"–",c:C.pk}].map((s,i)=><Card key={i} style={{padding:"20px 24px"}}><div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:13,color:C.t2,marginTop:4}}>{s.l}</div></Card>)}
    </div>

    <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><div style={{fontSize:18,fontWeight:600}}>Рекламные кампании</div><Btn onClick={()=>setShow(!show)}>+ Кампания</Btn></div>
    {show&&<Card style={{marginBottom:20}}><div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}}>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Название</label><input value={f.name} onChange={e=>sF({...f,name:e.target.value})} style={iS}/></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Платформа</label><select value={f.platform} onChange={e=>sF({...f,platform:e.target.value})} style={iS}>{SRCS.map(s=><option key={s}>{s}</option>)}</select></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Статус</label><select value={f.status} onChange={e=>sF({...f,status:e.target.value})} style={iS}><option value="active">Активна</option><option value="paused">Пауза</option><option value="done">Завершена</option></select></div>
      {([["budget","Бюджет"],["spent","Потрачено"],["leads","Лиды"],["revenue","Выручка"],["reach","Охват"],["impressions","Показы"],["clicks","Клики"],["period","Период"]] as const).map(([k,l])=><div key={k}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{l}</label><input type={k==="period"?"text":"number"} value={(f as any)[k]} onChange={e=>sF({...f,[k]:e.target.value})} style={iS}/></div>)}
      <div style={{gridColumn:"span 3"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Описание</label><input value={f.description} onChange={e=>sF({...f,description:e.target.value})} style={iS}/></div>
    </div><div style={{display:"flex",gap:10,marginTop:16}}><Btn onClick={sub}>Добавить</Btn><Btn primary={false} onClick={()=>setShow(false)}>Отмена</Btn></div></Card>}

    <Card style={{padding:0,overflow:"hidden"}}>{camps.length===0?<div style={{padding:"48px",textAlign:"center",color:C.t2}}>Нет кампаний</div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{borderBottom:"2px solid "+C.bd}}>{["Название","Платформа","Бюджет","Потрачено","Показы","Клики","CTR","Лиды","CPL","Статус",""].map((h,i)=><th key={i} style={{padding:"12px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:C.t2,textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{camps.map((c:any)=>{
      const cpl=c.leads>0?Math.round(c.spent/c.leads):0;
      const ctr=c.impressions>0?((c.clicks||0)/c.impressions*100).toFixed(2):0;
      return<tr key={c.id} style={{borderBottom:"1px solid "+C.bd}}>
        <td style={{padding:"12px 14px",fontWeight:600}}>{c.name}{c.description&&<div style={{fontSize:11,color:C.t2,fontWeight:400}}>{c.description}</div>}</td>
        <td style={{padding:"12px 14px"}}>{c.platform}</td>
        <td style={{padding:"12px 14px"}}>{fmt$(c.budget)} ₽</td>
        <td style={{padding:"12px 14px"}}>{fmt$(c.spent)} ₽</td>
        <td style={{padding:"12px 14px"}}>{c.impressions?fmt$(c.impressions):"-"}</td>
        <td style={{padding:"12px 14px"}}>{c.clicks?fmt$(c.clicks):"-"}</td>
        <td style={{padding:"12px 14px",fontWeight:600,color:+ctr>2?C.g:+ctr>0.5?C.y:C.t2}}>{ctr?ctr+"%":"-"}</td>
        <td style={{padding:"12px 14px",fontWeight:600}}>{c.leads}</td>
        <td style={{padding:"12px 14px",fontWeight:600}}>{cpl?fmt$(cpl)+" ₽":"-"}</td>
        <td style={{padding:"12px 14px"}}><Tag label={c.status==="active"?"Активна":c.status==="paused"?"Пауза":"Готово"} color={c.status==="active"?C.g:c.status==="paused"?C.y:C.t2}/></td>
        <td style={{padding:"12px 8px"}}><button onClick={()=>remove(c.id)} style={{width:28,height:28,borderRadius:6,border:"none",background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I path="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={12} color={C.r} sw={2}/></button></td>
      </tr>;
    })}</tbody></table></div>}</Card>
  </>;
}

/* ============ CALLS ============ */
function CallsPage({userId}:{userId:string}){
  const isMobile=useIsMobile();
  const{data:calls,add,update,remove}=useTable("calls",userId);
  const[calDate,setCalDate]=useState(()=>new Date());
  const[calView,setCalView]=useState<"1d"|"3d"|"7d"|"month">("1d");
  const[modal,setModal]=useState(false);
  const[editCall,setEditCall]=useState<any|null>(null);
  const[f,sF]=useState({title:"",date:today(),time_start:"10:00",time_end:"11:00",goal:"Созвон с лидом",custom_goal:"",setter_name:"",responsible_name:"",link:"",description:""});
  const td=today();
  const HOURS=Array.from({length:17},(_,i)=>i+7);
  const SLOT_H=64;
  const COLORS_CALL=[C.a,"#8B5CF6",C.g,C.r,C.y,C.pk];

  const openCreate=(date:string,hour?:number)=>{
    const ts=hour!==undefined?String(hour).padStart(2,"0")+":00":"10:00";
    const te=hour!==undefined?String(hour+1).padStart(2,"0")+":00":"11:00";
    sF({title:"",date,time_start:ts,time_end:te,goal:"Созвон с лидом",custom_goal:"",setter_name:"",responsible_name:"",link:"",description:""});
    setEditCall(null);setModal(true);
  };

  const openEdit=(c:any)=>{
    sF({title:c.title||"",date:c.date||today(),time_start:c.time_start||"10:00",time_end:c.time_end||"11:00",goal:c.goal||"Созвон с лидом",custom_goal:c.custom_goal||"",setter_name:c.setter_name||"",responsible_name:c.responsible_name||"",link:c.link||"",description:c.description||""});
    setEditCall(c);setModal(true);
  };

  const sub=async()=>{
    if(!f.time_start)return;
    const payload={...f,custom_goal:f.goal==="Своя цель"?f.custom_goal:""};
    if(editCall){await update(editCall.id,payload);}
    else{await add(payload);}
    setModal(false);setEditCall(null);
  };

  const callLabel=(c:any)=>c.title||(c.goal==="Своя цель"?(c.custom_goal||"Созвон"):c.goal);
  const goalColor=(g:string)=>g==="Созвон с лидом"?C.y:g==="Созвон с клиентом"?C.g:g==="Созвон с командой"?C.a:C.pk;
  const callColor=(c:any)=>goalColor(c.goal);
  const timeToMin=(t:string)=>{const[h,m]=t.split(":").map(Number);return(h-7)*60+m;};

  // Get days for current view
  const viewDays=useMemo(()=>{
    const days:Date[]=[];
    if(calView==="month"){
      const y=calDate.getFullYear(),m=calDate.getMonth();
      const first=new Date(y,m,1);
      const startWd=first.getDay()===0?6:first.getDay()-1;
      for(let i=0;i<startWd;i++){const d=new Date(y,m,1-startWd+i);days.push(d);}
      for(let i=1;i<=new Date(y,m+1,0).getDate();i++)days.push(new Date(y,m,i));
      while(days.length%7!==0){const last=days[days.length-1];const d=new Date(last);d.setDate(d.getDate()+1);days.push(d);}
    }else{
      const n=calView==="1d"?1:calView==="3d"?3:7;
      const base=calView==="7d"?(() =>{const d=new Date(calDate);const dow=d.getDay()===0?6:d.getDay()-1;d.setDate(d.getDate()-dow);return d;})():calDate;
      for(let i=0;i<n;i++){const d=new Date(base);d.setDate(d.getDate()+i);days.push(d);}
    }
    return days;
  },[calDate,calView]);

  const callsForDay=(d:Date)=>calls.filter((c:any)=>c.date===ds(d)).sort((a:any,b:any)=>a.time_start.localeCompare(b.time_start));

  const changeDay=(delta:number)=>{
    const d=new Date(calDate);
    if(calView==="month"){d.setMonth(d.getMonth()+delta);}
    else if(calView==="7d"){d.setDate(d.getDate()+delta*7);}
    else{d.setDate(d.getDate()+delta*(calView==="3d"?3:1));}
    setCalDate(d);
  };

  const nowY=useMemo(()=>{
    const n=new Date();
    return Math.max(0,(n.getHours()-7)*SLOT_H+(n.getMinutes()/60)*SLOT_H);
  },[]);

  const upcoming5=useMemo(()=>{
    const nowStr=today()+"T"+new Date().toTimeString().substring(0,5);
    return calls
      .filter((c:any)=>!c.completed&&(c.date>td||(c.date===td&&(c.time_start||"00:00")>=new Date().toTimeString().substring(0,5))))
      .sort((a:any,b:any)=>a.date===b.date?a.time_start.localeCompare(b.time_start):a.date.localeCompare(b.date))
      .slice(0,5);
  },[calls,td]);

  const stats={total:calls.length,done:calls.filter((c:any)=>c.completed).length,today:calls.filter((c:any)=>c.date===td).length,upcoming:upcoming5.length};

  // header label
  const headerLabel=useMemo(()=>{
    if(calView==="month")return `${MS[calDate.getMonth()]} ${calDate.getFullYear()}`;
    if(calView==="7d"){const last=viewDays[viewDays.length-1];return `${viewDays[0]?.getDate()} — ${last?.getDate()} ${MS[calDate.getMonth()]}`;};
    if(calView==="3d")return `${viewDays[0]?.getDate()} — ${viewDays[2]?.getDate()} ${MS[calDate.getMonth()]}`;
    return `${calDate.getDate()} ${MR[calDate.getMonth()]} ${calDate.getFullYear()}`;
  },[calDate,calView,viewDays]);

  const WDS_SHORT=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  const WDS_FULL=["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];

  // Render time grid for 1/3/7 day views
  const renderTimeGrid=()=>{
    const cols=calView==="1d"?1:calView==="3d"?3:7;
    const dayWidth=cols===1?"100%":`${100/cols}%`;
    return <div style={{overflowY:"auto",maxHeight:"calc(100vh - 320px)"}}>
      <div style={{display:"flex"}}>
        {/* Time column */}
        <div style={{width:52,flexShrink:0}}>
          <div style={{height:28}}/>
          {HOURS.map(h=><div key={h} style={{height:SLOT_H,position:"relative"}}>
            <span style={{position:"absolute",top:-9,right:8,fontSize:10,color:C.t2,fontWeight:500}}>{String(h).padStart(2,"0")}:00</span>
          </div>)}
        </div>
        {/* Day columns */}
        {viewDays.map((d,ci)=>{
          const dStr=ds(d);
          const isToday=dStr===td;
          const dayCalls=callsForDay(d);
          return <div key={ci} style={{flex:1,borderLeft:"1px solid "+C.bd,minWidth:0}}>
            {/* Day header */}
            <div style={{height:28,display:"flex",alignItems:"center",justifyContent:"center",gap:6,borderBottom:"1px solid "+C.bd,background:isToday?C.a+"0A":"transparent"}}>
              <span style={{fontSize:11,color:C.t2}}>{WDS_SHORT[(d.getDay()+6)%7]}</span>
              <span style={{fontSize:13,fontWeight:isToday?700:500,width:22,height:22,borderRadius:"50%",background:isToday?C.a:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:isToday?"#fff":C.t1}}>{d.getDate()}</span>
            </div>
            {/* Hour slots */}
            <div style={{position:"relative"}}>
              {HOURS.map(h=><div key={h} style={{height:SLOT_H,borderBottom:"1px solid "+C.bd+"55",cursor:"pointer",background:"transparent",transition:"background 0.1s"}}
                onClick={()=>openCreate(dStr,h)}
                onMouseEnter={e=>(e.currentTarget.style.background=C.a+"05")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
              />)}
              {/* Now line */}
              {isToday&&<div style={{position:"absolute",left:0,right:0,top:nowY,height:2,background:C.r,zIndex:5}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:C.r,position:"absolute",left:-4,top:-3}}/>
              </div>}
              {/* Call blocks */}
              {dayCalls.map((c:any)=>{
                const top=timeToMin(c.time_start||"09:00")*(SLOT_H/60);
                const bot=c.time_end?timeToMin(c.time_end)*(SLOT_H/60):top+SLOT_H;
                const h=Math.max(bot-top,24);
                const cc=callColor(c);
                const isDone=c.completed;
                return <div key={c.id}
                  onClick={e=>{e.stopPropagation();openEdit(c);}}
                  style={{position:"absolute",left:3,right:3,top,height:h,
                    background:isDone?C.bg:cc+"18",
                    border:`1.5px solid ${isDone?C.bd:cc}`,
                    borderRadius:8,padding:"4px 8px",boxSizing:"border-box",
                    overflow:"hidden",cursor:"pointer",zIndex:10,
                    opacity:isDone?0.6:1,
                    boxShadow:isDone?"none":`0 2px 8px ${cc}28`,
                  }}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:4}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:isDone?C.t2:cc,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{callLabel(c)}</div>
                      {h>30&&<div style={{fontSize:10,color:C.t2}}>{c.time_start}{c.time_end?" - "+c.time_end:""}{c.responsible_name?" · "+c.responsible_name:""}</div>}
                    </div>
                    <button onClick={e=>{e.stopPropagation();update(c.id,{completed:!c.completed});}}
                      style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${isDone?C.g:C.bd}`,background:isDone?C.g:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                      {isDone&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  </div>
                </div>;
              })}
            </div>
          </div>;
        })}
      </div>
    </div>;
  };

  // Month grid view
  const renderMonthGrid=()=><div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"2px solid "+C.bd}}>
      {WDS_SHORT.map(d=><div key={d} style={{padding:"8px 0",textAlign:"center",fontSize:11,fontWeight:700,color:C.t2}}>{d}</div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
      {viewDays.map((d,i)=>{
        const dStr=ds(d);
        const isToday=dStr===td;
        const isCurrentMonth=d.getMonth()===calDate.getMonth();
        const dayCalls=callsForDay(d);
        return <div key={i} style={{minHeight:90,padding:"6px 8px",borderRight:i%7!==6?"1px solid "+C.bd:"none",borderBottom:"1px solid "+C.bd,background:isToday?C.a+"05":"transparent",cursor:"pointer"}}
          onClick={()=>{setCalDate(d);setCalView("1d");}}>
          <div style={{fontSize:13,fontWeight:isToday?700:400,
            width:22,height:22,borderRadius:"50%",background:isToday?C.a:"transparent",
            display:"flex",alignItems:"center",justifyContent:"center",color:isToday?"#fff":isCurrentMonth?C.t1:C.t2,
            marginBottom:4}}>{d.getDate()}</div>
          {dayCalls.slice(0,3).map((c:any)=><div key={c.id} style={{fontSize:10,padding:"2px 5px",borderRadius:4,background:callColor(c)+"18",color:callColor(c),marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:c.completed?"line-through":"none"}}>{callLabel(c)}</div>)}
          {dayCalls.length>3&&<div style={{fontSize:10,color:C.t2}}>+{dayCalls.length-3}</div>}
        </div>;
      })}
    </div>
  </div>;

  return <>
    {/* Stats bar */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:12,marginBottom:isMobile?12:20}}>
      {[{l:"Всего",v:stats.total,c:C.a},{l:"Сегодня",v:stats.today,c:C.y},{l:"Выполнено",v:stats.done,c:C.g},{l:"Предстоит",v:stats.upcoming,c:"#8B5CF6"}].map((s,i)=><div key={i} style={{background:C.w,borderRadius:14,padding:"14px 18px",boxShadow:C.sh}}>
        <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
        <div style={{fontSize:12,color:C.t2,marginTop:2}}>{s.l}</div>
      </div>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 300px",gap:16}}>
      {/* Main calendar */}
      <div style={{background:C.w,borderRadius:16,boxShadow:C.sh,overflow:"hidden"}}>
        {/* Calendar header */}
        <div style={{padding:"14px 16px",borderBottom:"1px solid "+C.bd,display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>changeDay(-1)} style={{width:32,height:32,border:"1px solid "+C.bd,borderRadius:8,background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
          <span style={{flex:1,textAlign:"center",fontSize:14,fontWeight:700}}>{headerLabel}</span>
          <button onClick={()=>changeDay(1)} style={{width:32,height:32,border:"1px solid "+C.bd,borderRadius:8,background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
          <button onClick={()=>{setCalDate(new Date());}} style={{padding:"6px 12px",fontSize:12,border:"1px solid "+C.bd,borderRadius:8,background:ds(calDate)===td?C.a:C.bg,color:ds(calDate)===td?"#fff":C.t2,cursor:"pointer",fontWeight:500}}>Сегодня</button>
          {/* View switcher */}
          <div style={{display:"flex",background:"#F2F2F7",borderRadius:8,padding:2,gap:1}}>
            {(([["1d","1д"],["3d","3д"],["7d","Нед"],["month","Мес"]] as const).filter(([v])=>!isMobile||v==="1d"||v==="month")).map(([v,l])=><button key={v} onClick={()=>setCalView(v)} style={{padding:"5px 10px",border:"none",borderRadius:6,background:calView===v?C.w:"transparent",fontSize:11,fontWeight:calView===v?700:400,color:calView===v?C.a:C.t2,cursor:"pointer",boxShadow:calView===v?"0 1px 3px rgba(0,0,0,0.1)":"none"}}>{l}</button>)}
          </div>
        </div>
        {/* Grid */}
        {calView==="month"?renderMonthGrid():renderTimeGrid()}
      </div>

      {/* Sidebar */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {/* Add button */}
        <button onClick={()=>openCreate(td)} style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${C.dk},${C.da})`,color:"#fff",border:"none",borderRadius:14,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новый созвон
        </button>

        {/* Upcoming */}
        <div style={{background:C.w,borderRadius:14,boxShadow:C.sh,padding:"14px 16px"}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>Ближайшие созвоны</span>
            <span style={{fontSize:11,color:C.t2,fontWeight:400}}>{upcoming5.length} из 5</span>
          </div>
          {upcoming5.length===0
            ? <div style={{fontSize:13,color:C.t2,textAlign:"center",padding:"20px 0"}}>Нет предстоящих</div>
            : upcoming5.map((c:any)=>{
                const isToday=c.date===td;
                const cc=callColor(c);
                return <div key={c.id} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:"1px solid "+C.bd,cursor:"pointer"}} onClick={()=>openEdit(c)}>
                  <div style={{width:3,borderRadius:2,background:cc,flexShrink:0,alignSelf:"stretch"}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{callLabel(c)}</div>
                    <div style={{fontSize:11,color:C.t2,marginTop:2}}>{isToday?"Сегодня":c.date} в {c.time_start}{c.responsible_name?" · "+c.responsible_name:""}</div>
                  </div>
                  {isToday&&<div style={{fontSize:10,fontWeight:700,color:C.y,flexShrink:0,alignSelf:"center"}}>!</div>}
                </div>;
              })
          }
        </div>

        {/* Quick stats: conversion */}
        {calls.length>0&&<div style={{background:C.w,borderRadius:14,boxShadow:C.sh,padding:"14px 16px"}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Конверсия</div>
          <div style={{fontSize:24,fontWeight:800,color:C.g,marginBottom:4}}>{calls.length>0?Math.round(stats.done/calls.length*100):0}%</div>
          <div style={{fontSize:12,color:C.t2,marginBottom:10}}>созвонов проведено</div>
          <div style={{height:6,background:C.bg,borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:(calls.length>0?stats.done/calls.length*100:0)+"%",background:C.g,borderRadius:3,transition:"width 0.4s"}}/>
          </div>
        </div>}
      </div>
    </div>

    {/* Modal */}
    {modal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget){setModal(false);setEditCall(null);}}}>
      <div style={{background:C.w,borderRadius:22,padding:isMobile?"20px 16px 16px":"28px 28px 24px",width:"100%",maxWidth:500,boxShadow:"0 32px 80px rgba(0,0,0,0.22)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontSize:17,fontWeight:700}}>{editCall?"Редактировать созвон":"Новый созвон"}</div>
          {editCall&&<button onClick={()=>{if(confirm("Удалить созвон?"))remove(editCall.id).then(()=>setModal(false));}} style={{fontSize:12,color:C.r,background:C.r+"10",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:600}}>Удалить</button>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Название созвона</label><input value={f.title} onChange={e=>sF({...f,title:e.target.value})} placeholder="Разбор воронки с Игнатом..." style={iS}/></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Дата</label><input type="date" value={f.date} onChange={e=>sF({...f,date:e.target.value})} style={iS}/></div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Начало</label><input type="time" value={f.time_start} onChange={e=>sF({...f,time_start:e.target.value})} style={iS}/></div>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Конец</label><input type="time" value={f.time_end} onChange={e=>sF({...f,time_end:e.target.value})} style={iS}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Сеттер</label><input value={f.setter_name} onChange={e=>sF({...f,setter_name:e.target.value})} placeholder="Кто назначил..." style={iS}/></div>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Ответственный</label><input value={f.responsible_name} onChange={e=>sF({...f,responsible_name:e.target.value})} placeholder="Кто проводит..." style={iS}/></div>
          </div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Тип созвона</label>
            <select value={f.goal} onChange={e=>sF({...f,goal:e.target.value})} style={iS}>
              {CALL_GOALS.map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          {f.goal==="Своя цель"&&<div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Название</label><input value={f.custom_goal} onChange={e=>sF({...f,custom_goal:e.target.value})} placeholder="Введи название..." style={iS}/></div>}
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Ссылка на встречу</label><input value={f.link} onChange={e=>sF({...f,link:e.target.value})} placeholder="zoom.us/j/..." style={iS}/></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Комментарий</label><textarea value={f.description} onChange={e=>sF({...f,description:e.target.value})} rows={2} style={{...iS,resize:"none"}}/></div>
          {editCall&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:C.bg,borderRadius:10}}>
            <button onClick={()=>{update(editCall.id,{completed:!editCall.completed});setEditCall({...editCall,completed:!editCall.completed});}} style={{width:22,height:22,borderRadius:6,border:`2px solid ${editCall.completed?C.g:C.bd}`,background:editCall.completed?C.g:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {editCall.completed&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
            <span style={{fontSize:13,fontWeight:500,color:editCall.completed?C.g:C.t2}}>{editCall.completed?"Созвон проведён":"Отметить как проведённый"}</span>
          </div>}
          {f.link&&<a href={f.link} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:C.a+"0F",borderRadius:10,color:C.a,fontSize:13,fontWeight:600,textDecoration:"none"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            Открыть ссылку на встречу
          </a>}
        </div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <Btn onClick={sub} style={{flex:1}}>{editCall?"Сохранить":"Создать"}</Btn>
          <Btn primary={false} onClick={()=>{setModal(false);setEditCall(null);}}>Отмена</Btn>
        </div>
      </div>
    </div>}
  </>;
}


/* ============ CALCULATOR ============ */
function CalcPage(){
  const isMobile=useIsMobile();
  const[goal,sGoal]=useState({amount:300000,period:"month"});
  const[p,sP]=useState({check:50000,convCall:30,convLead:40,convTraffic:5});
  const calc=(pr:any)=>{const sales=Math.ceil(goal.amount/pr.check);const calls=Math.ceil(sales/(pr.convCall/100));const leads=Math.ceil(calls/(pr.convLead/100));const reach=Math.ceil(leads/(pr.convTraffic/100));return{sales,calls,leads,reach};};
  const scenarios=[
    {label:"Пессимист",pr:{...p,convCall:p.convCall*0.6,convLead:p.convLead*0.6,convTraffic:p.convTraffic*0.6}},
    {label:"Реалист",pr:p},
    {label:"Оптимист",pr:{...p,convCall:Math.min(p.convCall*1.4,100),convLead:Math.min(p.convLead*1.4,100),convTraffic:Math.min(p.convTraffic*1.4,100)}},
  ];
  return <>
    <div style={{background:`linear-gradient(135deg,${C.dk},${C.da})`,borderRadius:16,padding:"28px 36px",marginBottom:24,color:"#fff"}}><div style={{fontSize:20,fontWeight:700}}>Калькулятор конверсий</div><div style={{fontSize:14,opacity:0.7,marginTop:4}}>Введи цель - платформа посчитает</div></div>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:20,marginBottom:isMobile?16:24}}>
      <Card><div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Цель</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Сумма</label><input type="number" value={goal.amount} onChange={e=>sGoal({...goal,amount:+e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Период</label><select value={goal.period} onChange={e=>sGoal({...goal,period:e.target.value})} style={iS}><option value="month">Месяц</option><option value="quarter">Квартал</option></select></div>
      </div></Card>
      <Card><div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Воронка</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Чек</label><input type="number" value={p.check} onChange={e=>sP({...p,check:+e.target.value||1})} style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Звонок→продажа %</label><input type="number" value={p.convCall} onChange={e=>sP({...p,convCall:+e.target.value||1})} style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Лид→звонок %</label><input type="number" value={p.convLead} onChange={e=>sP({...p,convLead:+e.target.value||1})} style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Трафик→лид %</label><input type="number" value={p.convTraffic} onChange={e=>sP({...p,convTraffic:+e.target.value||1})} style={iS}/></div>
      </div></Card>
    </div>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:16}}>
      {scenarios.map((sc,si)=>{const r=calc(sc.pr);return<Card key={si} style={{borderTop:"4px solid "+(si===0?C.r:si===1?C.y:C.g)}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:16,color:si===0?C.r:si===1?C.y:C.g}}>{sc.label}</div>
        {[{l:"Продаж",v:r.sales},{l:"Звонков",v:r.calls},{l:"Лидов",v:r.leads},{l:"Охват",v:fmt$(r.reach)}].map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+C.bd}}><span style={{fontSize:13,color:C.t2}}>{x.l}</span><span style={{fontSize:15,fontWeight:700}}>{x.v}</span></div>)}
      </Card>})}
    </div>
  </>;
}

/* ============ LINKS ============ */
function LinksPage({userId}:{userId:string}){
  const isMobile=useIsMobile();
  const{data:links,add,update,remove}=useTable("links",userId);
  const[showForm,setShowForm]=useState(false);
  const[editId,setEditId]=useState<string|null>(null);
  const[search,setSearch]=useState("");
  const[activeCategory,setActiveCategory]=useState("Все");
  const[f,sF]=useState({title:"",url:"",description:"",category:"Общее",color:C.a});

  const LINK_COLORS=[C.a,"#8B5CF6","#10B981","#EF4444","#F59E0B","#EC4899","#06B6D4","#F97316","#0F1E40"];
  const DEFAULT_CATS=["Общее","Работа","Соцсети","Инструменты","Обучение"];

  const allCategories=useMemo(()=>{
    const cats=new Set(links.map((l:any)=>l.category||"Общее"));
    DEFAULT_CATS.forEach(c=>cats.add(c));
    return["Все",...Array.from(cats)];
  },[links]);

  const filtered=useMemo(()=>{
    let res=links;
    if(activeCategory!=="Все") res=res.filter((l:any)=>(l.category||"Общее")===activeCategory);
    if(search){const q=search.toLowerCase();res=res.filter((l:any)=>l.title.toLowerCase().includes(q)||(l.description||"").toLowerCase().includes(q)||(l.url||"").toLowerCase().includes(q));}
    return res;
  },[links,activeCategory,search]);

  const grouped=useMemo(()=>{
    if(activeCategory!=="Все") return{[activeCategory]:filtered};
    const g:Record<string,any[]>={};
    filtered.forEach((l:any)=>{const c=l.category||"Общее";if(!g[c])g[c]=[];g[c].push(l);});
    return g;
  },[filtered,activeCategory]);

  const resetForm=()=>sF({title:"",url:"",description:"",category:"Общее",color:C.a});

  const sub=async()=>{
    if(!f.title.trim()||!f.url.trim())return;
    const url=f.url.startsWith("http")?f.url:"https://"+f.url;
    if(editId){await update(editId,{...f,url});setEditId(null);}
    else{await add({...f,url});}
    resetForm();setShowForm(false);
  };

  const startEdit=(l:any)=>{
    sF({title:l.title,url:l.url,description:l.description||"",category:l.category||"Общее",color:l.color||C.a});
    setEditId(l.id);setShowForm(true);
  };

  const openLink=(url:string)=>window.open(url,"_blank","noopener,noreferrer");

  const getFavicon=(url:string)=>{
    try{const u=new URL(url.startsWith("http")?url:"https://"+url);return`https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;}
    catch{return null;}
  };

  const formatDomain=(url:string)=>{
    try{const u=new URL(url.startsWith("http")?url:"https://"+url);return u.hostname.replace("www.","");}
    catch{return url;}
  };

  return <>
    {/* Header */}
    <div style={{background:`linear-gradient(135deg,${C.dk},${C.da})`,borderRadius:16,padding:"24px 32px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:20,fontWeight:700,color:"#fff"}}>База ссылок</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:4}}>{links.length} сохранено · Быстрый доступ к нужным сайтам</div>
      </div>
      <button onClick={()=>{setShowForm(!showForm);setEditId(null);resetForm();}} style={{padding:"10px 20px",background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.25)",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Добавить ссылку
      </button>
    </div>

    {/* Add/Edit form */}
    {showForm&&<div style={{background:C.w,borderRadius:16,padding:"22px 24px",marginBottom:24,boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid "+C.bd}}>
      <div style={{fontSize:15,fontWeight:700,marginBottom:18,color:C.t1}}>{editId?"Редактировать ссылку":"Новая ссылка"}</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Название *</label><input value={f.title} onChange={e=>sF({...f,title:e.target.value})} placeholder="Google Analytics" style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>URL *</label><input value={f.url} onChange={e=>sF({...f,url:e.target.value})} placeholder="analytics.google.com" style={iS}/></div>
        <div style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Описание</label><input value={f.description} onChange={e=>sF({...f,description:e.target.value})} placeholder="Краткое описание что это и зачем..." style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Категория</label>
          <input value={f.category} onChange={e=>sF({...f,category:e.target.value})} list="cats" style={iS} placeholder="Общее"/>
          <datalist id="cats">{DEFAULT_CATS.map(c=><option key={c} value={c}/>)}</datalist>
        </div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Цвет карточки</label>
          <div style={{display:"flex",gap:6,marginTop:4}}>
            {LINK_COLORS.map(c=><button key={c} onClick={()=>sF({...f,color:c})} style={{width:28,height:28,borderRadius:8,background:c,border:f.color===c?"3px solid #111":"3px solid transparent",cursor:"pointer",flexShrink:0}}/>)}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={sub} disabled={!f.title.trim()||!f.url.trim()} style={{padding:"10px 22px",background:C.a,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:f.title.trim()&&f.url.trim()?"pointer":"not-allowed",opacity:f.title.trim()&&f.url.trim()?1:0.5}}>{editId?"Сохранить":"Добавить"}</button>
        <button onClick={()=>{setShowForm(false);setEditId(null);resetForm();}} style={{padding:"10px 16px",background:C.bg,color:C.t2,border:"1px solid "+C.bd,borderRadius:10,fontSize:14,cursor:"pointer"}}>Отмена</button>
        {editId&&<button onClick={()=>{remove(editId);setShowForm(false);setEditId(null);resetForm();}} style={{padding:"10px 16px",background:C.r+"10",color:C.r,border:"1px solid "+C.r+"22",borderRadius:10,fontSize:14,cursor:"pointer",marginLeft:"auto"}}>Удалить</button>}
      </div>
    </div>}

    {/* Search + categories */}
    <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{position:"relative",flex:"0 0 260px"}}>
        <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по ссылкам..." style={{...iS,paddingLeft:34}}/>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {allCategories.map(cat=><button key={cat} onClick={()=>setActiveCategory(cat)} style={{padding:"7px 14px",borderRadius:20,border:"1px solid "+(activeCategory===cat?C.a:C.bd),background:activeCategory===cat?C.a:"transparent",color:activeCategory===cat?"#fff":C.t2,fontSize:12,fontWeight:activeCategory===cat?600:400,cursor:"pointer",whiteSpace:"nowrap"}}>{cat}</button>)}
      </div>
    </div>

    {/* Links grid */}
    {links.length===0
      ? <div style={{textAlign:"center",padding:"60px 20px",color:C.t2}}>
          <div style={{fontSize:48,marginBottom:16}}>🔗</div>
          <div style={{fontSize:18,fontWeight:600,marginBottom:8,color:C.t1}}>База ссылок пуста</div>
          <div style={{fontSize:14}}>Добавь первую ссылку — и она всегда будет под рукой</div>
        </div>
      : Object.entries(grouped).map(([category,items])=><div key={category} style={{marginBottom:28}}>
          {activeCategory==="Все"&&<div style={{fontSize:12,fontWeight:700,color:C.t2,letterSpacing:0.8,textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            {category}
            <span style={{fontSize:11,fontWeight:500,color:C.t2,background:C.bd,borderRadius:20,padding:"1px 8px",textTransform:"none",letterSpacing:0}}>{(items as any[]).length}</span>
          </div>}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
            {(items as any[]).map((l:any)=>{
              const favicon=getFavicon(l.url);
              const domain=formatDomain(l.url);
              const accent=l.color||C.a;
              return <div key={l.id} style={{background:C.w,borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",border:"1px solid "+C.bd,display:"flex",flexDirection:"column",transition:"box-shadow 0.2s, transform 0.15s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 6px 24px rgba(0,0,0,0.12)";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 2px 10px rgba(0,0,0,0.06)";(e.currentTarget as HTMLElement).style.transform="translateY(0)";}}>
                {/* Top accent bar */}
                <div style={{height:4,background:accent,flexShrink:0}}/>
                {/* Card body */}
                <div style={{padding:"16px 16px 12px",flex:1,display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    {/* Favicon */}
                    <div style={{width:36,height:36,borderRadius:10,background:accent+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                      {favicon
                        ? <img src={favicon} width={20} height={20} style={{objectFit:"contain"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                      }
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
                      <div style={{fontSize:11,color:C.t2,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{domain}</div>
                    </div>
                  </div>
                  {l.description&&<div style={{fontSize:12,color:C.t2,lineHeight:1.5,overflow:"hidden",maxHeight:"2.8em"}}>{l.description}</div>}
                </div>
                {/* Actions */}
                <div style={{padding:"10px 12px",borderTop:"1px solid "+C.bd,display:"flex",gap:6}}>
                  <button onClick={()=>openLink(l.url)} style={{flex:1,padding:"9px 0",background:accent,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,letterSpacing:0.3}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Открыть
                  </button>
                  <button onClick={()=>startEdit(l)} style={{width:36,height:36,borderRadius:9,border:"1px solid "+C.bd,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={()=>{if(navigator.clipboard)navigator.clipboard.writeText(l.url);}} title="Скопировать ссылку" style={{width:36,height:36,borderRadius:9,border:"1px solid "+C.bd,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  </button>
                </div>
              </div>;
            })}
          </div>
        </div>)
    }
  </>;
}

/* ============ FILES ============ */
function FilesPage({userId}:{userId:string}){
  const isMobile=useIsMobile();
  const{data:files,add,remove}=useTable("files",userId);
  const[showForm,setShowForm]=useState(false);
  const[dragging,setDragging]=useState(false);
  const[uploading,setUploading]=useState(false);
  const[fName,setFName]=useState("");
  const[search,setSearch]=useState("");

  const FILE_ICONS:Record<string,{color:string,label:string}>={
    pdf:{color:"#EF4444",label:"PDF"},
    doc:{color:"#2563EB",label:"DOC"},docx:{color:"#2563EB",label:"DOC"},
    xls:{color:"#10B981",label:"XLS"},xlsx:{color:"#10B981",label:"XLS"},
    ppt:{color:"#F59E0B",label:"PPT"},pptx:{color:"#F59E0B",label:"PPT"},
    jpg:{color:"#EC4899",label:"IMG"},jpeg:{color:"#EC4899",label:"IMG"},png:{color:"#EC4899",label:"IMG"},
    gif:{color:"#8B5CF6",label:"GIF"},webp:{color:"#EC4899",label:"IMG"},
    mp4:{color:"#06B6D4",label:"MP4"},mov:{color:"#06B6D4",label:"VID"},
    zip:{color:"#6B7280",label:"ZIP"},rar:{color:"#6B7280",label:"RAR"},
    txt:{color:"#9CA3AF",label:"TXT"},csv:{color:"#10B981",label:"CSV"},
  };

  const getExt=(name:string)=>name.split(".").pop()?.toLowerCase()||"";
  const getIcon=(name:string)=>FILE_ICONS[getExt(name)]||{color:C.t2,label:getExt(name).toUpperCase()||"?"};
  const fmtSize=(b:number)=>b>1024*1024?`${(b/1024/1024).toFixed(1)} МБ`:b>1024?`${(b/1024).toFixed(0)} КБ`:`${b} Б`;

  const uploadFile=async(file:File,customName?:string)=>{
    setUploading(true);
    try{
      const path=`${userId}/${Date.now()}_${file.name}`;
      const{error}=await supabase.storage.from("files").upload(path,file,{contentType:file.type});
      if(error)throw error;
      const{data}=supabase.storage.from("files").getPublicUrl(path);
      await add({name:customName||file.name,file_url:data.publicUrl,file_type:getExt(file.name),file_size:file.size});
      setShowForm(false);setFName("");
    }catch(e:any){console.error(e);alert("Ошибка загрузки: "+e.message);}
    finally{setUploading(false);}
  };

  const handleDrop=(e:React.DragEvent)=>{
    e.preventDefault();setDragging(false);
    const file=e.dataTransfer.files[0];
    if(file)uploadFile(file);
  };

  const openFile=(url:string)=>window.open(url,"_blank","noopener,noreferrer");

  const filtered=files.filter((f:any)=>f.name.toLowerCase().includes(search.toLowerCase()));

  return <>
    <div style={{background:`linear-gradient(135deg,${C.dk},${C.da})`,borderRadius:16,padding:isMobile?"16px":"24px 32px",marginBottom:isMobile?16:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:20,fontWeight:700,color:"#fff"}}>База файлов</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:4}}>{files.length} файлов · Облачное хранилище</div>
      </div>
      <button onClick={()=>setShowForm(!showForm)} style={{padding:"10px 20px",background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.25)",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Добавить файл
      </button>
    </div>

    {/* Upload form */}
    {showForm&&<div style={{background:C.w,borderRadius:16,padding:22,marginBottom:20,boxShadow:C.sh,border:"1px solid "+C.bd}}>
      <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>Загрузить файл</div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Название (необязательно)</label>
        <input value={fName} onChange={e=>setFName(e.target.value)} placeholder="Мой файл..." style={iS}/>
      </div>
      <div
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={handleDrop}
        style={{border:`2px dashed ${dragging?C.a:C.bd}`,borderRadius:12,padding:"32px 20px",textAlign:"center",background:dragging?C.a+"06":C.bg,transition:"all 0.2s"}}>
        {uploading
          ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,border:"3px solid "+C.bd,borderTopColor:C.a,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
              <span style={{fontSize:13,color:C.t2}}>Загрузка...</span>
            </div>
          : <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5" style={{marginBottom:8}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div style={{fontSize:14,color:C.t1,fontWeight:500,marginBottom:4}}>Перетащи файл сюда</div>
              <div style={{fontSize:12,color:C.t2,marginBottom:12}}>или</div>
              <label style={{padding:"9px 20px",background:C.a,color:"#fff",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",display:"inline-block"}}>
                Выбрать файл
                <input type="file" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadFile(e.target.files[0],fName||undefined);}}/>
              </label>
            </>
        }
      </div>
      <div style={{marginTop:12}}><Btn primary={false} onClick={()=>{setShowForm(false);setFName("");}}>Отмена</Btn></div>
    </div>}

    {/* Search */}
    <div style={{position:"relative",marginBottom:16,maxWidth:320}}>
      <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск файлов..." style={{...iS,paddingLeft:34}}/>
    </div>

    {/* Table */}
    <div style={{background:C.w,borderRadius:16,boxShadow:C.sh,overflow:"hidden"}}>
      {filtered.length===0
        ? <div style={{padding:"60px 20px",textAlign:"center",color:C.t2}}>
            <div style={{fontSize:40,marginBottom:12}}>📁</div>
            <div style={{fontSize:16,fontWeight:600,color:C.t1,marginBottom:6}}>{search?"Файлы не найдены":"База файлов пуста"}</div>
            <div style={{fontSize:13}}>Загрузи первый файл</div>
          </div>
        : <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:isMobile?12:14,minWidth:isMobile?500:0}}>
            <thead><tr style={{borderBottom:"2px solid "+C.bd,background:"#FAFBFC"}}>
              {["Название","Формат","Размер","Дата","Действия"].map((h,i)=><th key={i} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:0.5}}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map((f:any,i:number)=>{
              const icon=getIcon(f.name||"");
              const isImage=["jpg","jpeg","png","gif","webp"].includes(getExt(f.name||""));
              const isPdf=getExt(f.name||"")==="pdf";
              return <tr key={f.id} style={{borderBottom:i<filtered.length-1?"1px solid "+C.bd:"none",transition:"background 0.1s"}}
                onMouseEnter={e=>(e.currentTarget.style.background=C.bg)}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                <td style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:8,background:icon.color+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {isImage&&f.file_url
                        ? <img src={f.file_url} style={{width:36,height:36,borderRadius:8,objectFit:"cover"}} alt=""/>
                        : <span style={{fontSize:9,fontWeight:800,color:icon.color}}>{icon.label}</span>}
                    </div>
                    <span style={{fontWeight:500,color:C.t1}}>{f.name}</span>
                  </div>
                </td>
                <td style={{padding:"14px 16px"}}><span style={{fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:6,background:icon.color+"18",color:icon.color}}>{icon.label}</span></td>
                <td style={{padding:"14px 16px",color:C.t2,fontSize:12}}>{f.file_size?fmtSize(f.file_size):"-"}</td>
                <td style={{padding:"14px 16px",color:C.t2,fontSize:12}}>{new Date(f.created_at).toLocaleDateString("ru-RU")}</td>
                <td style={{padding:"14px 12px"}}>
                  <div style={{display:"flex",gap:6}}>
                    {(isImage||isPdf)&&<button onClick={()=>openFile(f.file_url)} title="Открыть" style={{width:32,height:32,border:"none",background:C.a+"12",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.a}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </button>}
                    <a href={f.file_url} download={f.name} title="Скачать" style={{width:32,height:32,border:"none",background:C.g+"12",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.g,textDecoration:"none"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </a>
                    <button onClick={()=>remove(f.id)} title="Удалить" style={{width:32,height:32,border:"none",background:C.r+"12",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.r}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>;
            })}</tbody>
          </table></div>
      }
    </div>
  </>;
}

/* ============ AI PAGE ============ */
const AI_AVATAR="/ai-avatar.png";
const MAX_CHATS=20;

type AIMsg={role:"user"|"assistant",content:string,file?:{name:string,data:string,type:string}};
type AIChat={id:string,title:string,msgs:AIMsg[],createdAt:number};

function AIPage(){
  const isMobile=useIsMobile();
  const[chats,setChats]=useState<AIChat[]>(()=>{
    try{const s=localStorage.getItem("ks_ai_chats");return s?JSON.parse(s):[];}catch{return[];}
  });
  const[activeChatId,setActiveChatId]=useState<string|null>(null);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const[sidebarOpen,setSidebarOpen]=useState(!isMobile);
  const[fileData,setFileData]=useState<{name:string,data:string,type:string}|null>(null);
  const bottomRef=useRef<HTMLDivElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  const activeChat=chats.find(c=>c.id===activeChatId)||null;
  const msgs=activeChat?.msgs||[];

  useEffect(()=>{
    try{localStorage.setItem("ks_ai_chats",JSON.stringify(chats));}catch{}
  },[chats]);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const newChat=()=>{
    const id=Date.now().toString();
    const chat:AIChat={id,title:"Новый чат",msgs:[],createdAt:Date.now()};
    setChats(prev=>{
      const updated=[chat,...prev].slice(0,MAX_CHATS);
      return updated;
    });
    setActiveChatId(id);
    setInput("");setErr("");setFileData(null);
  };

  const deleteChat=(id:string,e:React.MouseEvent)=>{
    e.stopPropagation();
    setChats(prev=>prev.filter(c=>c.id!==id));
    if(activeChatId===id)setActiveChatId(null);
  };

  const handleFile=async(file:File)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const result=e.target?.result as string;
      const isText=file.type.startsWith("text")||file.name.endsWith(".txt")||file.name.endsWith(".md")||file.name.endsWith(".csv");
      if(isText){
        setFileData({name:file.name,data:result,type:"text"});
      } else {
        const b64=result.split(",")[1];
        setFileData({name:file.name,data:b64,type:file.type});
      }
    };
    if(file.type.startsWith("text")||file.name.endsWith(".txt")||file.name.endsWith(".md")||file.name.endsWith(".csv")){
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const send=async(text?:string)=>{
    const q=(text||input).trim();
    if((!q&&!fileData)||loading)return;

    let chatId=activeChatId;
    if(!chatId){
      const id=Date.now().toString();
      chatId=id;
      const chat:AIChat={id,title:q.slice(0,30)||fileData?.name||"Чат",msgs:[],createdAt:Date.now()};
      setChats(prev=>[chat,...prev].slice(0,MAX_CHATS));
      setActiveChatId(id);
    }

    const userMsg:AIMsg={role:"user",content:q||`Файл: ${fileData?.name}`,..( fileData?{file:fileData}:{})};
    const newMsgs:AIMsg[]=[...msgs,userMsg];

    setChats(prev=>prev.map(c=>c.id===chatId?{...c,msgs:newMsgs,title:c.title==="Новый чат"?(q.slice(0,35)||c.title):c.title}:c));
    setInput("");setErr("");setFileData(null);
    setLoading(true);

    try{
      // Build API messages
      const apiMsgs=newMsgs.map(m=>{
        if(m.file&&m.file.type==="text"){
          return{role:m.role,content:`${m.content}\n\nСодержимое файла "${m.file.name}":\n${m.file.data}`};
        }
        return{role:m.role,content:m.content};
      });

      const res=await fetch("/api/ai",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:apiMsgs}),
      });
      if(!res.ok)throw new Error("API error "+res.status);
      const data=await res.json();
      const reply=data.content?.[0]?.text||data.choices?.[0]?.message?.content||"Нет ответа";
      const replyMsg:AIMsg={role:"assistant",content:reply};
      setChats(prev=>prev.map(c=>c.id===chatId?{...c,msgs:[...newMsgs,replyMsg]}:c));
    }catch(e:any){
      setErr("Ошибка: "+e.message);
      setChats(prev=>prev.map(c=>c.id===chatId?{...c,msgs:newMsgs.slice(0,-1)}:c));
    }finally{setLoading(false);}
  };

  const formatMsg=(text:string)=>text.split("\n").map((line,i,arr)=>{
    const parts=line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part,j)=>{
      if(part.startsWith("**")&&part.endsWith("**"))return <strong key={j}>{part.slice(2,-2)}</strong>;
      if(part.startsWith("`")&&part.endsWith("`"))return <code key={j} style={{background:"rgba(255,255,255,0.15)",borderRadius:4,padding:"1px 5px",fontSize:"0.9em",fontFamily:"monospace"}}>{part.slice(1,-1)}</code>;
      return part;
    });
    return <span key={i}>{parts}{i<arr.length-1&&<br/>}</span>;
  });

  const SUGGESTIONS=["Как увеличить конверсию в консалтинге?","Напиши скрипт для первого созвона с лидом","Какие метрики важны для онлайн-бизнеса?","Помоги составить оффер для клиента","Как выстроить систему продаж с нуля?","Идеи для контента про предпринимательство"];

  return <div style={{display:"flex",height:isMobile?"calc(100vh - 136px)":"calc(100vh - 120px)",gap:0,overflow:"hidden",borderRadius:16,border:"1px solid "+C.bd,background:C.w,boxShadow:"0 4px 24px rgba(0,0,0,0.07)"}}>

    {/* Chats sidebar */}
    {(sidebarOpen||!isMobile)&&<div style={{width:isMobile?"100%":240,flexShrink:0,background:"#F8F9FB",borderRight:"1px solid "+C.bd,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Sidebar header */}
      <div style={{padding:"14px 14px 10px",borderBottom:"1px solid "+C.bd}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <img src={AI_AVATAR} style={{width:32,height:32,borderRadius:8,objectFit:"cover"}} alt="AI"/>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.t1}}>Kirill Scales AI</div>
            <div style={{fontSize:10,color:C.t2}}>История чатов</div>
          </div>
        </div>
        <button onClick={newChat} style={{width:"100%",padding:"8px",background:C.a,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новый чат
        </button>
        <div style={{fontSize:10,color:C.t2,textAlign:"right",marginTop:6}}>{chats.length}/{MAX_CHATS} чатов</div>
      </div>

      {/* Chat list */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 8px"}}>
        {chats.length===0&&<div style={{padding:"24px 12px",textAlign:"center",fontSize:12,color:C.t2}}>Нет чатов. Начни новый!</div>}
        {chats.map(chat=><div key={chat.id} onClick={()=>{setActiveChatId(chat.id);if(isMobile)setSidebarOpen(false);}}
          style={{padding:"9px 10px",borderRadius:8,cursor:"pointer",marginBottom:2,display:"flex",alignItems:"center",gap:8,
            background:activeChatId===chat.id?C.a+"12":"transparent",
            border:activeChatId===chat.id?"1px solid "+C.a+"25":"1px solid transparent",
            transition:"all 0.15s"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={activeChatId===chat.id?C.a:C.t2} strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:activeChatId===chat.id?600:400,color:activeChatId===chat.id?C.a:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{chat.title}</div>
            <div style={{fontSize:10,color:C.t2,marginTop:1}}>{chat.msgs.length} сообщений</div>
          </div>
          <button onClick={e=>deleteChat(chat.id,e)} style={{width:20,height:20,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0.4,flexShrink:0,borderRadius:4}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.opacity="1";(e.currentTarget as HTMLElement).style.background=C.r+"15";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.opacity="0.4";(e.currentTarget as HTMLElement).style.background="transparent";}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.r} strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>)}
      </div>
    </div>}

    {/* Main chat area */}
    {(!isMobile||!sidebarOpen)&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Chat header */}
      <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.bd,display:"flex",alignItems:"center",gap:10,flexShrink:0,background:C.w}}>
        {isMobile&&<button onClick={()=>setSidebarOpen(true)} style={{width:32,height:32,border:"1px solid "+C.bd,borderRadius:8,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>}
        <img src={AI_AVATAR} style={{width:36,height:36,borderRadius:10,objectFit:"cover",flexShrink:0}} alt="AI"/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:C.t1}}>Kirill Scales AI</div>
          <div style={{fontSize:10,color:C.g,display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.g}}/>
            онлайн · Powered by the best AI's
          </div>
        </div>
        {activeChat&&<button onClick={()=>{setChats(prev=>prev.map(c=>c.id===activeChatId?{...c,msgs:[]}:c));setErr("");}}
          style={{padding:"5px 12px",background:C.bg,border:"1px solid "+C.bd,borderRadius:8,fontSize:11,color:C.t2,cursor:"pointer"}}>
          Очистить
        </button>}
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:14}}>
        {!activeChat&&<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:"20px 0"}}>
          <img src={AI_AVATAR} style={{width:72,height:72,borderRadius:20,objectFit:"cover",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}} alt="AI"/>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:700,color:C.t1,marginBottom:6}}>Kirill Scales AI</div>
            <div style={{fontSize:13,color:C.t2,lineHeight:1.6}}>Твой AI-ассистент по бизнесу и маркетингу.<br/>Начни новый чат или выбери существующий.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,width:"100%",maxWidth:560}}>
            {SUGGESTIONS.map((s,i)=><button key={i} onClick={()=>send(s)}
              style={{padding:"10px 14px",background:C.bg,border:"1px solid "+C.bd,borderRadius:10,fontSize:12,color:C.t1,cursor:"pointer",textAlign:"left",lineHeight:1.4,fontFamily:"'Montserrat',sans-serif",transition:"all 0.15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;(e.currentTarget as HTMLElement).style.background=C.a+"08";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.background=C.bg;}}>
              {s}
            </button>)}
          </div>
        </div>}

        {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8}}>
          {m.role==="assistant"&&<img src={AI_AVATAR} style={{width:28,height:28,borderRadius:7,objectFit:"cover",flexShrink:0,marginTop:2}} alt="AI"/>}
          <div style={{maxWidth:"78%"}}>
            {m.file&&<div style={{fontSize:11,color:C.t2,marginBottom:4,display:"flex",alignItems:"center",gap:4,justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {m.file.name}
            </div>}
            <div style={{
              padding:"11px 15px",
              borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
              background:m.role==="user"?`linear-gradient(135deg,${C.a},${C.da})`:"#1E293B",
              color:"#fff",fontSize:13,lineHeight:1.65,wordBreak:"break-word",
              boxShadow:m.role==="user"?"0 4px 12px "+C.a+"40":"0 4px 12px rgba(0,0,0,0.15)",
            }}>
              {m.role==="assistant"?formatMsg(m.content):m.content}
            </div>
          </div>
          {m.role==="user"&&<div style={{width:28,height:28,borderRadius:7,background:C.a+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.a} strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>}
        </div>)}

        {loading&&<div style={{display:"flex",alignItems:"center",gap:8}}>
          <img src={AI_AVATAR} style={{width:28,height:28,borderRadius:7,objectFit:"cover",flexShrink:0}} alt="AI"/>
          <div style={{padding:"12px 16px",background:"#1E293B",borderRadius:"16px 16px 16px 4px",display:"flex",gap:5,alignItems:"center"}}>
            {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.5)",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
          </div>
        </div>}

        {err&&<div style={{padding:"10px 14px",background:"#FEF2F2",borderRadius:10,fontSize:12,color:C.r,border:"1px solid "+C.r+"22"}}>{err}</div>}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"10px 12px",borderTop:"1px solid "+C.bd,background:C.w,flexShrink:0}}>
        {fileData&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.a+"0F",borderRadius:8,marginBottom:8,border:"1px solid "+C.a+"22"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.a} strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style={{fontSize:12,color:C.a,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fileData.name}</span>
          <button onClick={()=>setFileData(null)} style={{border:"none",background:"transparent",cursor:"pointer",color:C.t2,fontSize:14,lineHeight:1}}>×</button>
        </div>}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <input ref={fileRef} type="file" accept=".txt,.md,.csv,.pdf,image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0]);e.target.value="";}}/>
          <button onClick={()=>fileRef.current?.click()}
            style={{width:36,height:36,borderRadius:9,border:"1px solid "+C.bd,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;(e.currentTarget as HTMLElement).style.background=C.a+"08";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.background="transparent";}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder="Напиши сообщение... (Enter — отправить)"
            rows={1}
            style={{flex:1,border:"1px solid "+C.bd,outline:"none",resize:"none",fontSize:13,fontFamily:"'Montserrat',sans-serif",color:C.t1,background:C.bg,lineHeight:1.5,maxHeight:120,overflowY:"auto",borderRadius:10,padding:"9px 12px"}}
            onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,120)+"px";}}
            onFocus={e=>{e.currentTarget.style.borderColor=C.a;}}
            onBlur={e=>{e.currentTarget.style.borderColor=C.bd;}}
          />
          <button onClick={()=>send()} disabled={(!input.trim()&&!fileData)||loading}
            style={{width:36,height:36,borderRadius:9,border:"none",background:((input.trim()||fileData)&&!loading)?C.a:C.bd,cursor:((input.trim()||fileData)&&!loading)?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s"}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>}
  </div>;
}


  const isMobile=useIsMobile();
  const[msgs,setMsgs]=useState<{role:"user"|"assistant",content:string}[]>([]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const bottomRef=useRef<HTMLDivElement>(null);
  const inputRef=useRef<HTMLTextAreaElement>(null);

  const SUGGESTIONS=["Как увеличить конверсию в консалтинге?","Напиши скрипт для первого созвона с лидом","Какие метрики важны для онлайн-бизнеса?","Помоги составить оффер для клиента","Как выстроить систему продаж с нуля?","Идеи для контента про предпринимательство"];

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[msgs,loading]);

  const send=async(text?:string)=>{
    const q=(text||input).trim();
    if(!q||loading)return;
    setInput("");setErr("");
    const newMsgs:{role:"user"|"assistant",content:string}[]=[...msgs,{role:"user" as const,content:q}];
    setMsgs(newMsgs);
    setLoading(true);
    try{
      const res=await fetch("/api/ai",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:newMsgs}),
      });
      if(!res.ok)throw new Error("API error "+res.status);
      const data=await res.json();
      const reply=data.content?.[0]?.text||data.choices?.[0]?.message?.content||"Нет ответа";
      setMsgs(prev=>[...prev,{role:"assistant",content:reply}]);
    }catch(e:any){
      setErr("Ошибка: "+e.message);
      setMsgs(prev=>prev.slice(0,-1));
    }finally{setLoading(false);}
  };

  const clear=()=>{setMsgs([]);setErr("");};

  const formatMsg=(text:string)=>{
    // Simple markdown: bold, code blocks, newlines
    return text.split("\n").map((line,i)=>{
      const parts=line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part,j)=>{
        if(part.startsWith("**")&&part.endsWith("**"))return <strong key={j}>{part.slice(2,-2)}</strong>;
        if(part.startsWith("`")&&part.endsWith("`"))return <code key={j} style={{background:"rgba(255,255,255,0.15)",borderRadius:4,padding:"1px 5px",fontSize:"0.9em",fontFamily:"monospace"}}>{part.slice(1,-1)}</code>;
        return part;
      });
      return <span key={i}>{parts}{i<text.split("\n").length-1&&<br/>}</span>;
    });
  };

  return <div style={{display:"flex",flexDirection:"column",height:isMobile?"calc(100vh - 136px)":"calc(100vh - 120px)",maxWidth:860,margin:"0 auto"}}>
    {/* Header */}
    <div style={{background:`linear-gradient(135deg,${C.dk},${C.da})`,borderRadius:16,padding:isMobile?"14px 18px":"20px 28px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:12,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>✦</div>
        <div>
          <div style={{fontSize:isMobile?15:18,fontWeight:800,color:"#fff",letterSpacing:0.5}}>Kirill Scales AI</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:2}}>Powered by the best AI's in the world</div>
        </div>
      </div>
      {msgs.length>0&&<button onClick={clear} style={{padding:"6px 14px",background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,fontSize:12,cursor:"pointer"}}>Очистить</button>}
    </div>

    {/* Messages */}
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,paddingBottom:8}}>
      {msgs.length===0&&<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:"20px 0"}}>
        <div style={{fontSize:isMobile?13:15,color:C.t2,textAlign:"center",lineHeight:1.6}}>Привет! Я твой AI-ассистент.<br/>Спроси что угодно про бизнес, маркетинг или стратегию.</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,width:"100%",maxWidth:600}}>
          {SUGGESTIONS.map((s,i)=><button key={i} onClick={()=>send(s)}
            style={{padding:"10px 14px",background:C.w,border:"1px solid "+C.bd,borderRadius:12,fontSize:12,color:C.t1,cursor:"pointer",textAlign:"left",lineHeight:1.4,fontFamily:"'Montserrat',sans-serif",transition:"all 0.15s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;(e.currentTarget as HTMLElement).style.background=C.a+"08";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.background=C.w;}}>
            {s}
          </button>)}
        </div>
      </div>}

      {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
        {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:8,background:C.dk,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginRight:8,alignSelf:"flex-start",marginTop:2}}>✦</div>}
        <div style={{
          maxWidth:"80%",padding:"12px 16px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
          background:m.role==="user"?`linear-gradient(135deg,${C.a},${C.da})`:"#1E293B",
          color:"#fff",fontSize:13,lineHeight:1.6,wordBreak:"break-word",
          boxShadow:m.role==="user"?"0 4px 12px "+C.a+"40":"0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {m.role==="assistant"?formatMsg(m.content):m.content}
        </div>
      </div>)}

      {loading&&<div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:8,background:C.dk,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✦</div>
        <div style={{padding:"12px 16px",background:"#1E293B",borderRadius:"16px 16px 16px 4px",display:"flex",gap:5,alignItems:"center"}}>
          {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.5)",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
        </div>
      </div>}

      {err&&<div style={{padding:"10px 14px",background:"#FEF2F2",borderRadius:10,fontSize:12,color:C.r,border:"1px solid "+C.r+"22"}}>{err}</div>}
      <div ref={bottomRef}/>
    </div>

    {/* Input */}
    <div style={{marginTop:12,background:C.w,borderRadius:16,border:"1px solid "+C.bd,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-end"}}>
      <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
        placeholder="Напиши сообщение... (Enter — отправить, Shift+Enter — новая строка)"
        rows={1}
        style={{flex:1,border:"none",outline:"none",resize:"none",fontSize:13,fontFamily:"'Montserrat',sans-serif",color:C.t1,background:"transparent",lineHeight:1.5,maxHeight:120,overflowY:"auto"}}
        onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,120)+"px";}}
      />
      <button onClick={()=>send()} disabled={!input.trim()||loading}
        style={{width:38,height:38,borderRadius:10,border:"none",background:input.trim()&&!loading?C.a:C.bd,cursor:input.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  </div>;
}

/* ============ SCRIPT AI PAGE ============ */
const SCRIPT_SYSTEM=`Ты — Vissy Сценарий AI. Твоя единственная задача — помогать писать сценарии для видео. Ты не делаешь ничего другого: не переводишь тексты, не пишешь код, не отвечаешь на общие вопросы, не помогаешь с чем-либо кроме сценариев для видео.

Если пользователь просит что-то не связанное со сценариями, вежливо отказывай и возвращай разговор к теме: «Я специализируюсь только на написании сценариев для видео. Давай я помогу тебе создать сценарий! Это для Reels или для YouTube?»

Алгоритм работы:
1. Спроси: это короткое видео для Reels/TikTok или длинное для YouTube?
2. Задавай уточняющие вопросы по одному: тема видео → целевая аудитория → цель видео → стиль (серьёзный/лёгкий/провокационный).
3. После всех ответов пиши готовый сценарий.

Правила для Reels/короткого видео (до 60 сек):
— Хук [0–3 сек]: моментально цепляет. Провокационный вопрос, шокирующий факт или узнаваемая ситуация. Никаких «привет всем».
— Суть [3–55 сек]: одна чёткая мысль. Никакой воды. Быстрый темп. Короткие предложения.
— Призыв к действию [55–60 сек]: конкретное действие — подписаться, сохранить, написать в комментарии.

Правила для YouTube/длинного видео:
— Хук [0–15 сек]: смелое утверждение, проблема зрителя или тизер финала. Человек не должен уйти.
— Завязка и проблема [10–20% хронометража]: обозначь боль зрителя, пообещай решение.
— Основная часть [60–70% хронометража]: раскрой тему, примеры, истории, кейсы. Каждую минуту — ценность.
— Заключение и призыв [5–10% хронометража]: итог в 2–3 предложениях и конкретный призыв.

Всегда указывай тайминг каждого блока. Пиши сценарий чётко, структурированно, с разделением на блоки.`;

function ScriptAIPage(){
  const isMobile=useIsMobile();
  const WELCOME={role:"assistant" as const,content:"Привет! Я Vissy Сценарий AI — помогаю писать сценарии для видео.\n\nС чего начнём? Мы делаем **короткое видео для Reels/TikTok** или **длинное видео для YouTube**?"};
  const[msgs,setMsgs]=useState<{role:"user"|"assistant",content:string}[]>([WELCOME]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const[copied,setCopied]=useState(false);
  const bottomRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const lastScript=useMemo(()=>{
    const assistantMsgs=msgs.filter(m=>m.role==="assistant");
    for(let i=assistantMsgs.length-1;i>=0;i--){
      if(assistantMsgs[i].content.includes("[")&&assistantMsgs[i].content.length>200)
        return assistantMsgs[i].content;
    }
    return null;
  },[msgs]);

  const send=async(text?:string)=>{
    const q=(text||input).trim();
    if(!q||loading)return;
    setInput("");setErr("");
    const newMsgs:{role:"user"|"assistant",content:string}[]=[...msgs,{role:"user" as const,content:q}];
    setMsgs(newMsgs);
    setLoading(true);
    try{
      const res=await fetch("/api/ai",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:newMsgs,system:SCRIPT_SYSTEM}),
      });
      if(!res.ok)throw new Error("API error "+res.status);
      const data=await res.json();
      const reply=data.content?.[0]?.text||data.choices?.[0]?.message?.content||"Нет ответа";
      setMsgs(prev=>[...prev,{role:"assistant" as const,content:reply}]);
    }catch(e:any){
      setErr("Ошибка: "+e.message);
      setMsgs(prev=>prev.slice(0,-1));
    }finally{setLoading(false);}
  };

  const reset=()=>{setMsgs([WELCOME]);setErr("");setInput("");};

  const copy=async()=>{
    const text=lastScript||msgs.filter(m=>m.role==="assistant").map(m=>m.content).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);setTimeout(()=>setCopied(false),2000);
  };

  const download=()=>{
    const text=lastScript||msgs.filter(m=>m.role==="assistant").map(m=>m.content).join("\n\n");
    const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="scenario_vissy.txt";a.click();
    URL.revokeObjectURL(url);
  };

  const formatMsg=(text:string)=>text.split("\n").map((line,i)=>{
    const parts=line.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\])/g).map((part,j)=>{
      if(part.startsWith("**")&&part.endsWith("**"))return <strong key={j}>{part.slice(2,-2)}</strong>;
      if(part.startsWith("[")&&part.endsWith("]"))return <strong key={j} style={{color:"#60A5FA"}}>{part}</strong>;
      if(part.startsWith("`")&&part.endsWith("`"))return <code key={j} style={{background:"rgba(255,255,255,0.15)",borderRadius:4,padding:"1px 5px",fontSize:"0.9em",fontFamily:"monospace"}}>{part.slice(1,-1)}</code>;
      return part;
    });
    return <span key={i}>{parts}{i<text.split("\n").length-1&&<br/>}</span>;
  });

  return <div style={{display:"flex",flexDirection:"column",height:isMobile?"calc(100vh - 136px)":"calc(100vh - 120px)",maxWidth:860,margin:"0 auto"}}>
    {/* Header */}
    <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",borderRadius:16,padding:isMobile?"14px 18px":"20px 28px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:12,background:"rgba(99,102,241,0.3)",border:"1px solid rgba(99,102,241,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎬</div>
        <div>
          <div style={{fontSize:isMobile?15:18,fontWeight:800,color:"#fff",letterSpacing:0.5}}>Vissy Сценарий AI</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>Только сценарии. Только результат.</div>
        </div>
      </div>
      {/* Action buttons */}
      <div style={{display:"flex",gap:8}}>
        {msgs.length>1&&<>
          <button onClick={copy} style={{padding:"7px 14px",background:copied?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.08)",color:copied?"#10B981":"rgba(255,255,255,0.7)",border:"1px solid "+(copied?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.15)"),borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500}}>
            {copied?"✓ Скопировано":"Скопировать"}
          </button>
          {!isMobile&&<button onClick={download} style={{padding:"7px 14px",background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500}}>Скачать</button>}
          <button onClick={reset} style={{padding:"7px 14px",background:"rgba(99,102,241,0.2)",color:"#818CF8",border:"1px solid rgba(99,102,241,0.3)",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600}}>Новый сценарий</button>
        </>}
      </div>
    </div>

    {/* Messages */}
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,paddingBottom:8}}>
      {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8}}>
        {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#1a1a2e,#0f3460)",border:"1px solid rgba(99,102,241,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginTop:2}}>🎬</div>}
        <div style={{
          maxWidth:"82%",padding:"12px 16px",
          borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
          background:m.role==="user"?"linear-gradient(135deg,#6366F1,#4F46E5)":"#1E293B",
          color:"#fff",fontSize:13,lineHeight:1.7,wordBreak:"break-word",
          boxShadow:m.role==="user"?"0 4px 12px rgba(99,102,241,0.4)":"0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {formatMsg(m.content)}
        </div>
      </div>)}

      {loading&&<div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#1a1a2e,#0f3460)",border:"1px solid rgba(99,102,241,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🎬</div>
        <div style={{padding:"12px 16px",background:"#1E293B",borderRadius:"16px 16px 16px 4px",display:"flex",gap:5,alignItems:"center"}}>
          {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(99,102,241,0.7)",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
        </div>
      </div>}

      {err&&<div style={{padding:"10px 14px",background:"#FEF2F2",borderRadius:10,fontSize:12,color:C.r,border:"1px solid "+C.r+"22"}}>{err}</div>}
      <div ref={bottomRef}/>
    </div>

    {/* Quick replies for first message */}
    {msgs.length===1&&!loading&&<div style={{display:"flex",gap:8,marginBottom:8}}>
      {["📱 Reels / TikTok","🎥 YouTube"].map(opt=><button key={opt} onClick={()=>send(opt)}
        style={{flex:1,padding:"12px",background:"#1E293B",border:"1px solid rgba(99,102,241,0.3)",borderRadius:12,fontSize:13,color:"#fff",cursor:"pointer",fontWeight:600,transition:"all 0.15s"}}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(99,102,241,0.8)";(e.currentTarget as HTMLElement).style.background="#2D3748";}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(99,102,241,0.3)";(e.currentTarget as HTMLElement).style.background="#1E293B";}}>
        {opt}
      </button>)}
    </div>}

    {/* Input */}
    <div style={{marginTop:8,background:C.w,borderRadius:16,border:"1px solid "+C.bd,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-end"}}>
      <textarea value={input} onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
        placeholder="Напиши ответ... (Enter — отправить)"
        rows={1}
        style={{flex:1,border:"none",outline:"none",resize:"none",fontSize:13,fontFamily:"'Montserrat',sans-serif",color:C.t1,background:"transparent",lineHeight:1.5,maxHeight:120,overflowY:"auto"}}
        onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,120)+"px";}}
      />
      <button onClick={()=>send()} disabled={!input.trim()||loading}
        style={{width:38,height:38,borderRadius:10,border:"none",background:input.trim()&&!loading?"#6366F1":C.bd,cursor:input.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  </div>;
}

/* ============ PRODUCT AI PAGE ============ */
const PRODUCT_SYSTEM=`Ты — Vizzy Product AI. Твоя единственная задача — помогать онлайн-предпринимателям и креаторам создавать цифровые продукты: курсы, коучинговые программы, воркшопы, электронные книги, марафоны, мини-продукты.

Правило 1. Работаешь ТОЛЬКО с темой создания цифровых продуктов. Если человек спрашивает что-то другое — отказывай: «Я помогаю создавать цифровые продукты. Давай создадим твой продукт! Расскажи в какой теме ты эксперт?»

Правило 2. Задавай вопросы строго по одному. После каждого ответа пользователя — следующий вопрос. Вот порядок 7 вопросов:
1. Что ты умеешь делать лучше всего? В какой теме ты эксперт?
2. Кто твоя аудитория? Кому ты хочешь помочь?
3. Какую главную проблему решает твой продукт?
4. Какой результат получит человек после прохождения?
5. Какой формат? (Онлайн-курс / Коучинговая программа / Воркшоп / Электронная книга / Мини-продукт / Марафон)
6. Сколько времени у аудитории на прохождение? (1 день / Неделя / Месяц / 2 месяца)
7. Какой уровень аудитории? (Новички / Средний уровень / Эксперты)

Правило 3. После получения ответов на все 7 вопросов — генерируй полноценный продукт.

Правило 4. Что генерировать:
- Онлайн-курс: 3 варианта названий, позиционирование, 4-8 модулей с уроками, 5-7 результатов, описание ЦА, для кого НЕ подходит, 3 идеи бонусов, 3 варианта цен (эконом/стандарт/премиум), готовый текст для лендинга.
- Коучинговая программа: название, формат (кол-во сессий/периодичность), структура сессий, результаты, 3 пакета с ценами (базовый/стандарт/VIP), описание для продажи.
- Электронная книга/гайд: название, структура глав с описанием, тезисное содержание каждой главы, рекомендуемый объём, 3 варианта монетизации, описание для продажи.
- Марафон: название, структура по дням (тема + задание), формат проведения, результат, рекомендуемая цена, описание для продажи.

Правило 5. После генерации предложи доработку: «Хочешь доработать какой-то блок? Могу написать описание для Instagram, для Telegram, структуру лендинга или придумать новые названия.»

Правило 6. Стиль — профессиональный, конкретный, без воды, вдохновляющий.`;

const PRODUCT_QUESTIONS=["Что ты умеешь делать лучше всего? В какой теме ты эксперт?","Кто твоя аудитория? Кому ты хочешь помочь?","Какую главную проблему решает твой продукт?","Какой результат получит человек после прохождения?","Какой формат выбираем?","Сколько времени у аудитории на прохождение?","Какой уровень аудитории?"];

function ProductAIPage(){
  const isMobile=useIsMobile();
  const WELCOME={role:"assistant" as const,content:"Привет! Я Vizzy Product AI.\n\n**Создай свой цифровой продукт за 10 минут.**\n\nЯ задам тебе 7 вопросов и сгенерирую готовый продукт — курс, марафон, коучинг, книгу или воркшоп. Поехали!\n\n**Вопрос 1 из 7.**\nЧто ты умеешь делать лучше всего? В какой теме ты эксперт?"};
  const[msgs,setMsgs]=useState<{role:"user"|"assistant",content:string}[]>([WELCOME]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const[copied,setCopied]=useState(false);
  const[refining,setRefining]=useState(false);
  const[refineInput,setRefineInput]=useState("");
  const bottomRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  // Count answered questions by counting user messages
  const userMsgCount=msgs.filter(m=>m.role==="user").length;
  const questionNum=Math.min(userMsgCount+1,7);
  const progress=Math.min(userMsgCount/7,1);
  const isDone=userMsgCount>=7;

  const lastProduct=useMemo(()=>{
    const asMsgs=msgs.filter(m=>m.role==="assistant");
    for(let i=asMsgs.length-1;i>=0;i--){
      if(asMsgs[i].content.length>400)return asMsgs[i].content;
    }
    return null;
  },[msgs]);

  const send=async(text?:string)=>{
    const q=(text||input).trim();
    if(!q||loading)return;
    setInput("");setErr("");setRefining(false);setRefineInput("");
    const newMsgs:{role:"user"|"assistant",content:string}[]=[...msgs,{role:"user" as const,content:q}];
    setMsgs(newMsgs);
    setLoading(true);
    try{
      const res=await fetch("/api/ai",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:newMsgs,system:PRODUCT_SYSTEM}),
      });
      if(!res.ok)throw new Error("API error "+res.status);
      const data=await res.json();
      const reply=data.content?.[0]?.text||data.choices?.[0]?.message?.content||"Нет ответа";
      setMsgs(prev=>[...prev,{role:"assistant" as const,content:reply}]);
    }catch(e:any){
      setErr("Ошибка: "+e.message);
      setMsgs(prev=>prev.slice(0,-1));
    }finally{setLoading(false);}
  };

  const reset=()=>{setMsgs([WELCOME]);setErr("");setInput("");setRefining(false);};

  const copy=async()=>{
    const text=lastProduct||msgs.filter(m=>m.role==="assistant").map(m=>m.content).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);setTimeout(()=>setCopied(false),2000);
  };

  const download=()=>{
    const text=lastProduct||msgs.filter(m=>m.role==="assistant").map(m=>m.content).join("\n\n");
    const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="product_vizzy.txt";a.click();
    URL.revokeObjectURL(url);
  };

  const FORMATS=["Онлайн-курс","Коучинговая программа","Воркшоп","Электронная книга","Мини-продукт","Марафон"];
  const DURATIONS=["1 день","Неделя","Месяц","2 месяца"];
  const LEVELS=["Новички","Средний уровень","Эксперты"];

  const formatMsg=(text:string)=>text.split("\n").map((line,i,arr)=>{
    const parts=line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part,j)=>{
      if(part.startsWith("**")&&part.endsWith("**"))return <strong key={j}>{part.slice(2,-2)}</strong>;
      if(part.startsWith("`")&&part.endsWith("`"))return <code key={j} style={{background:"rgba(255,255,255,0.15)",borderRadius:4,padding:"1px 5px",fontSize:"0.9em",fontFamily:"monospace"}}>{part.slice(1,-1)}</code>;
      return part;
    });
    return <span key={i}>{parts}{i<arr.length-1&&<br/>}</span>;
  });

  // Quick reply options based on question number
  const quickReplies=userMsgCount===4?FORMATS:userMsgCount===5?DURATIONS:userMsgCount===6?LEVELS:null;

  const GRAD="linear-gradient(135deg,#0d1b2a,#1b2838,#0f2027)";
  const ACC="#F59E0B";
  const ACC2="#FBBF24";

  return <div style={{display:"flex",flexDirection:"column",height:isMobile?"calc(100vh - 136px)":"calc(100vh - 120px)",maxWidth:900,margin:"0 auto"}}>

    {/* Header */}
    <div style={{background:GRAD,borderRadius:16,padding:isMobile?"14px 16px":"20px 28px",marginBottom:16,border:"1px solid rgba(245,158,11,0.2)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isDone?12:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:12,background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📦</div>
          <div>
            <div style={{fontSize:isMobile?15:18,fontWeight:800,color:"#fff",letterSpacing:0.5}}>Vizzy Product AI</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>Создай цифровой продукт за 10 минут</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {msgs.length>1&&<>
            <button onClick={copy} style={{padding:"7px 14px",background:copied?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.06)",color:copied?"#10B981":"rgba(255,255,255,0.6)",border:"1px solid "+(copied?"rgba(16,185,129,0.3)":"rgba(255,255,255,0.12)"),borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500}}>
              {copied?"✓ Скопировано":"Скопировать"}
            </button>
            {!isMobile&&<button onClick={download} style={{padding:"7px 14px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,fontSize:12,cursor:"pointer"}}>Скачать</button>}
            {isDone&&<button onClick={()=>setRefining(!refining)} style={{padding:"7px 14px",background:refining?"rgba(245,158,11,0.25)":"rgba(255,255,255,0.06)",color:refining?ACC:"rgba(255,255,255,0.6)",border:"1px solid "+(refining?"rgba(245,158,11,0.4)":"rgba(255,255,255,0.12)"),borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500}}>Доработать блок</button>}
            <button onClick={reset} style={{padding:"7px 14px",background:"rgba(245,158,11,0.15)",color:ACC,border:"1px solid rgba(245,158,11,0.3)",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600}}>Новый продукт</button>
          </>}
        </div>
      </div>

      {/* Progress bar */}
      {!isDone&&userMsgCount>0&&<div style={{marginTop:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>Вопрос {questionNum} из 7</span>
          <span style={{fontSize:11,color:ACC}}>{Math.round(progress*100)}%</span>
        </div>
        <div style={{height:4,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden"}}>
          <div style={{width:progress*100+"%",height:"100%",background:`linear-gradient(90deg,${ACC},${ACC2})`,borderRadius:2,transition:"width 0.4s ease"}}/>
        </div>
        <div style={{display:"flex",gap:4,marginTop:8}}>
          {Array.from({length:7},(_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<userMsgCount?"rgba(245,158,11,0.8)":"rgba(255,255,255,0.1)",transition:"background 0.3s"}}/>)}
        </div>
      </div>}

      {isDone&&lastProduct&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,fontSize:12,color:"#10B981"}}>✓ Продукт сгенерирован — скопируй или скачай</div>}
    </div>

    {/* Refine input */}
    {refining&&<div style={{background:C.w,borderRadius:12,border:"1px solid "+ACC+"44",padding:"12px 16px",marginBottom:12,display:"flex",gap:10,alignItems:"center"}}>
      <input value={refineInput} onChange={e=>setRefineInput(e.target.value)}
        placeholder="Какой блок доработать? Например: переписать модули, названия, описание для Instagram..."
        style={{flex:1,border:"none",outline:"none",fontSize:13,fontFamily:"'Montserrat',sans-serif",color:C.t1,background:"transparent"}}
        onKeyDown={e=>{if(e.key==="Enter"&&refineInput.trim())send(refineInput);}}
      />
      <button onClick={()=>send(refineInput)} disabled={!refineInput.trim()||loading}
        style={{padding:"7px 16px",background:refineInput.trim()?ACC:C.bd,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>
        Отправить
      </button>
    </div>}

    {/* Messages */}
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,paddingBottom:8}}>
      {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8}}>
        {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:8,background:GRAD,border:"1px solid rgba(245,158,11,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginTop:2}}>📦</div>}
        <div style={{
          maxWidth:"82%",padding:"12px 16px",
          borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
          background:m.role==="user"?`linear-gradient(135deg,${ACC},#D97706)`:"#1E293B",
          color:"#fff",fontSize:13,lineHeight:1.7,wordBreak:"break-word",
          boxShadow:m.role==="user"?"0 4px 12px rgba(245,158,11,0.3)":"0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {formatMsg(m.content)}
        </div>
      </div>)}

      {loading&&<div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:8,background:GRAD,border:"1px solid rgba(245,158,11,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>📦</div>
        <div style={{padding:"12px 16px",background:"#1E293B",borderRadius:"16px 16px 16px 4px",display:"flex",gap:5,alignItems:"center"}}>
          {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(245,158,11,0.7)",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
        </div>
      </div>}

      {err&&<div style={{padding:"10px 14px",background:"#FEF2F2",borderRadius:10,fontSize:12,color:C.r,border:"1px solid "+C.r+"22"}}>{err}</div>}
      <div ref={bottomRef}/>
    </div>

    {/* Quick replies */}
    {quickReplies&&!loading&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
      {quickReplies.map(opt=><button key={opt} onClick={()=>send(opt)}
        style={{padding:"9px 16px",background:"#1E293B",border:"1px solid rgba(245,158,11,0.25)",borderRadius:10,fontSize:12,color:"#fff",cursor:"pointer",fontWeight:500,transition:"all 0.15s"}}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(245,158,11,0.7)";(e.currentTarget as HTMLElement).style.color=ACC;}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(245,158,11,0.25)";(e.currentTarget as HTMLElement).style.color="#fff";}}>
        {opt}
      </button>)}
    </div>}

    {/* Input */}
    {(!refining)&&<div style={{marginTop:8,background:C.w,borderRadius:16,border:"1px solid "+C.bd,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-end"}}>
      <textarea value={input} onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
        placeholder="Напиши ответ... (Enter — отправить)"
        rows={1}
        style={{flex:1,border:"none",outline:"none",resize:"none",fontSize:13,fontFamily:"'Montserrat',sans-serif",color:C.t1,background:"transparent",lineHeight:1.5,maxHeight:120,overflowY:"auto"}}
        onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,120)+"px";}}
      />
      <button onClick={()=>send()} disabled={!input.trim()||loading}
        style={{width:38,height:38,borderRadius:10,border:"none",background:input.trim()&&!loading?ACC:C.bd,cursor:input.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>}
  </div>;
}

/* ============ STORIES AI PAGE ============ */
const STORIES_SYSTEM=`Ты — Vizzy Stories AI. Создаёшь серии историй для Instagram и Telegram которые захватывают внимание и ведут к действию.

Правило 1. Только три вопроса — никогда не задаёшь больше. Не уточняешь лишнего. Если чего-то не хватает — додумываешь сам на основе скрина и ответов.

Правило 2. Вопросы строго по одному.

Правило 3. Никаких длинных тире в текстах историй. Никаких точек в конце строк на экране. Текст на экране — максимум 3 строки.

Правило 4. Пишешь умно и деловито. Адаптируешься под нишу пользователя. Психолог звучит иначе чем маркетолог.

Правило 5. Одна история — одна мысль. Никакого перегруза.

Правило 6. Серия от 10 до 15 историй. Подбираешь количество сам.

Правило 7. На нерелевантные запросы: «Я создаю серии историй. Загрузи скрин аккаунта и начнём»

Формат каждой истории строго такой:

История [N] из [TOTAL]

Цель — [одна фраза]

Текст на экране:
[максимум 3 строки, без точек в конце, без длинных тире]

Голос или текст за кадром:
[2-4 предложения, живо и цепляюще]

Визуал:
[конкретное описание — фон, шрифт, элементы]

Интерактив:
[опрос / вопрос в сторис / реакция / слайдер — конкретно]

Переход:
[одна фраза тянущая к следующей истории]

---

Что AI определяет сам по скрину: ниша, тон общения, аудитория, визуальный стиль, позиционирование.
Если скрин не загружен — предупреди что серия будет менее точной и попроси описать себя в двух словах.`;

function StoriesAIPage(){
  const isMobile=useIsMobile();
  const WELCOME={role:"assistant" as const,content:"Привет! Я Vizzy Stories AI.\n\nСоздаю серии историй для Instagram и Telegram которые захватывают внимание и продают.\n\n**Вопрос 1 из 3.**\nЗагрузи скрин своего аккаунта — главная страница или несколько постов. AI проанализирует нишу, стиль и аудиторию автоматически.\n\nЕсли нет скрина — напиши о себе в двух словах."};

  const[msgs,setMsgs]=useState<{role:"user"|"assistant",content:string}[]>([WELCOME]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const[copied,setCopied]=useState(false);
  const[image,setImage]=useState<string|null>(null);
  const[imageName,setImageName]=useState("");
  const[rewriteMode,setRewriteMode]=useState(false);
  const[rewriteInput,setRewriteInput]=useState("");
  const bottomRef=useRef<HTMLDivElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const userMsgCount=msgs.filter(m=>m.role==="user").length;
  const questionNum=Math.min(userMsgCount+1,3);
  const progress=Math.min(userMsgCount/3,1);
  const isDone=userMsgCount>=3;

  const lastSeries=useMemo(()=>{
    const asMsgs=msgs.filter(m=>m.role==="assistant");
    for(let i=asMsgs.length-1;i>=0;i--){
      if(asMsgs[i].content.includes("История")&&asMsgs[i].content.length>300)
        return asMsgs[i].content;
    }
    return null;
  },[msgs]);

  // Convert image file to base64
  const handleImage=async(file:File)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const b64=(e.target?.result as string).split(",")[1];
      setImage(b64);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const send=async(text?:string)=>{
    const q=(text||input).trim();
    if((!q&&!image)||loading)return;
    setInput("");setErr("");setRewriteMode(false);

    // Build message with optional image
    const userContent:any=image
      ?[{type:"image_url",image_url:{url:`data:image/jpeg;base64,${image}`}},{type:"text",text:q||"Вот скрин моего аккаунта"}]
      :q;

    const newMsgs:{role:"user"|"assistant",content:any}[]=[...msgs,{role:"user" as const,content:userContent}];
    // For display — show text version
    const displayMsgs:{role:"user"|"assistant",content:string}[]=[...msgs,{role:"user" as const,content:image?`📷 ${imageName||"скрин аккаунта"}${q?" — "+q:""}`:q}];
    setMsgs(displayMsgs);
    setImage(null);setImageName("");
    setLoading(true);

    try{
      // Send to API with image support
      const apiMessages=newMsgs.map(m=>({
        role:m.role,
        content:typeof m.content==="string"
          ?m.content
          :(m.content as any[]).map((c:any)=>
            c.type==="image_url"
              ?{type:"image_url",image_url:c.image_url}
              :{type:"text",text:c.text}
          )
      }));

      const res=await fetch("/api/ai",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:apiMessages,system:STORIES_SYSTEM,vision:true}),
      });
      if(!res.ok)throw new Error("API error "+res.status);
      const data=await res.json();
      const reply=data.content?.[0]?.text||data.choices?.[0]?.message?.content||"Нет ответа";
      setMsgs(prev=>[...prev,{role:"assistant" as const,content:reply}]);
    }catch(e:any){
      setErr("Ошибка: "+e.message);
      setMsgs(prev=>prev.slice(0,-1));
    }finally{setLoading(false);}
  };

  const reset=()=>{setMsgs([WELCOME]);setErr("");setInput("");setImage(null);setImageName("");setRewriteMode(false);};

  const copy=async()=>{
    const text=lastSeries||msgs.filter(m=>m.role==="assistant").map(m=>m.content).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);setTimeout(()=>setCopied(false),2000);
  };

  const download=()=>{
    const text=lastSeries||msgs.filter(m=>m.role==="assistant").map(m=>m.content).join("\n\n");
    const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="stories_vizzy.txt";a.click();
    URL.revokeObjectURL(url);
  };

  const GOALS=[
    {key:"А","label":"Продажа","desc":"14 дней — веду к покупке"},
    {key:"Б","label":"Прогрев","desc":"10 дней — строю доверие"},
    {key:"В","label":"Полный цикл","desc":"Прогрев + продажа"},
    {key:"Г","label":"Своя задача","desc":"Опишу сам"},
  ];

  const formatMsg=(text:string)=>text.split("\n").map((line,i,arr)=>{
    const isBold=line.startsWith("История ")||line.startsWith("Цель")||line.startsWith("Текст")||line.startsWith("Голос")||line.startsWith("Визуал")||line.startsWith("Интерактив")||line.startsWith("Переход");
    const parts=line.split(/(\*\*[^*]+\*\*)/g).map((p,j)=>
      p.startsWith("**")&&p.endsWith("**")?<strong key={j}>{p.slice(2,-2)}</strong>:p
    );
    return <span key={i} style={isBold?{color:"#93C5FD",fontWeight:700}:{}}>{parts}{i<arr.length-1&&<br/>}</span>;
  });

  const GRAD="linear-gradient(135deg,#0a0a1a,#12122a,#0d1117)";
  const ACC="#E879F9";
  const ACC2="#C026D3";

  return <div style={{display:"flex",flexDirection:"column",height:isMobile?"calc(100vh - 136px)":"calc(100vh - 120px)",maxWidth:900,margin:"0 auto"}}>

    {/* Header */}
    <div style={{background:GRAD,borderRadius:16,padding:isMobile?"14px 16px":"20px 28px",marginBottom:16,border:"1px solid rgba(232,121,249,0.2)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:!isDone&&userMsgCount>0?14:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:12,background:"rgba(232,121,249,0.15)",border:"1px solid rgba(232,121,249,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>✨</div>
          <div>
            <div style={{fontSize:isMobile?15:18,fontWeight:800,color:"#fff",letterSpacing:0.5}}>Vizzy Stories AI</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>Серии историй которые захватывают и продают</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {msgs.length>1&&<>
            <button onClick={copy} style={{padding:"7px 14px",background:copied?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.06)",color:copied?"#10B981":"rgba(255,255,255,0.6)",border:"1px solid "+(copied?"rgba(16,185,129,0.3)":"rgba(255,255,255,0.12)"),borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500}}>
              {copied?"✓ Скопировано":"Скопировать"}
            </button>
            {!isMobile&&<button onClick={download} style={{padding:"7px 14px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,fontSize:12,cursor:"pointer"}}>Скачать</button>}
            {isDone&&<button onClick={()=>setRewriteMode(!rewriteMode)} style={{padding:"7px 14px",background:rewriteMode?"rgba(232,121,249,0.2)":"rgba(255,255,255,0.06)",color:rewriteMode?ACC:"rgba(255,255,255,0.6)",border:"1px solid "+(rewriteMode?"rgba(232,121,249,0.4)":"rgba(255,255,255,0.12)"),borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500}}>Переписать историю</button>}
            <button onClick={reset} style={{padding:"7px 14px",background:"rgba(232,121,249,0.15)",color:ACC,border:"1px solid rgba(232,121,249,0.3)",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600}}>Новая серия</button>
          </>}
        </div>
      </div>

      {/* Progress bar - 3 questions */}
      {!isDone&&userMsgCount>0&&<div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>Вопрос {questionNum} из 3</span>
          <span style={{fontSize:11,color:ACC}}>{Math.round(progress*100)}%</span>
        </div>
        <div style={{height:4,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden"}}>
          <div style={{width:progress*100+"%",height:"100%",background:`linear-gradient(90deg,${ACC2},${ACC})`,borderRadius:2,transition:"width 0.4s ease"}}/>
        </div>
        <div style={{display:"flex",gap:6,marginTop:8}}>
          {[0,1,2].map(i=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<userMsgCount?"rgba(232,121,249,0.8)":"rgba(255,255,255,0.1)",transition:"background 0.3s"}}/>)}
        </div>
      </div>}

      {isDone&&lastSeries&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,fontSize:12,color:"#10B981"}}>✓ Серия готова — скопируй или скачай</div>}
    </div>

    {/* Rewrite input */}
    {rewriteMode&&<div style={{background:C.w,borderRadius:12,border:`1px solid ${ACC}44`,padding:"12px 16px",marginBottom:12,display:"flex",gap:10,alignItems:"center"}}>
      <input value={rewriteInput} onChange={e=>setRewriteInput(e.target.value)}
        placeholder="Укажи номер истории или что переписать. Например: переписать историю 4..."
        style={{flex:1,border:"none",outline:"none",fontSize:13,fontFamily:"'Montserrat',sans-serif",color:C.t1,background:"transparent"}}
        onKeyDown={e=>{if(e.key==="Enter"&&rewriteInput.trim()){send(rewriteInput);setRewriteInput("");}}}
      />
      <button onClick={()=>{send(rewriteInput);setRewriteInput("");}} disabled={!rewriteInput.trim()||loading}
        style={{padding:"7px 16px",background:rewriteInput.trim()?ACC:C.bd,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>
        Отправить
      </button>
    </div>}

    {/* Messages */}
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,paddingBottom:8}}>
      {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8}}>
        {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:8,background:GRAD,border:"1px solid rgba(232,121,249,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginTop:2}}>✨</div>}
        <div style={{
          maxWidth:"82%",padding:"12px 16px",
          borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
          background:m.role==="user"?`linear-gradient(135deg,${ACC2},#7C3AED)`:"#1E293B",
          color:"#fff",fontSize:13,lineHeight:1.7,wordBreak:"break-word",
          boxShadow:m.role==="user"?"0 4px 12px rgba(192,38,211,0.3)":"0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {formatMsg(m.content)}
        </div>
      </div>)}

      {loading&&<div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:8,background:GRAD,border:"1px solid rgba(232,121,249,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✨</div>
        <div style={{padding:"12px 16px",background:"#1E293B",borderRadius:"16px 16px 16px 4px",display:"flex",gap:5,alignItems:"center"}}>
          {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(232,121,249,0.7)",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
        </div>
      </div>}

      {err&&<div style={{padding:"10px 14px",background:"#FEF2F2",borderRadius:10,fontSize:12,color:C.r,border:"1px solid "+C.r+"22"}}>{err}</div>}
      <div ref={bottomRef}/>
    </div>

    {/* Goal quick replies — shown on question 2 */}
    {userMsgCount===1&&!loading&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:8,marginBottom:8}}>
      {GOALS.map(g=><button key={g.key} onClick={()=>send(`${g.key} — ${g.label}. ${g.desc}`)}
        style={{padding:"10px 12px",background:"#1E293B",border:"1px solid rgba(232,121,249,0.2)",borderRadius:10,fontSize:12,color:"#fff",cursor:"pointer",textAlign:"left",lineHeight:1.4,transition:"all 0.15s"}}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(232,121,249,0.7)";}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(232,121,249,0.2)";}}>
        <div style={{fontWeight:700,color:ACC,marginBottom:2}}>{g.key} — {g.label}</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{g.desc}</div>
      </button>)}
    </div>}

    {/* Input area */}
    {!rewriteMode&&<div style={{marginTop:8,background:C.w,borderRadius:16,border:"1px solid "+C.bd,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",padding:"10px 12px",display:"flex",gap:8,alignItems:"flex-end"}}>
      {/* Image upload button */}
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])handleImage(e.target.files[0]);}}/>
      <button onClick={()=>fileRef.current?.click()}
        style={{width:36,height:36,borderRadius:10,border:"1px solid "+(image?ACC:C.bd),background:image?ACC+"15":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
        {image
          ?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        }
      </button>
      {image&&<span style={{fontSize:11,color:ACC,flexShrink:0,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{imageName}</span>}
      <textarea value={input} onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
        placeholder={userMsgCount===0?"Загрузи скрин 📷 или напиши о себе...":"Напиши ответ... (Enter — отправить)"}
        rows={1}
        style={{flex:1,border:"none",outline:"none",resize:"none",fontSize:13,fontFamily:"'Montserrat',sans-serif",color:C.t1,background:"transparent",lineHeight:1.5,maxHeight:120,overflowY:"auto"}}
        onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,120)+"px";}}
      />
      <button onClick={()=>send()} disabled={(!input.trim()&&!image)||loading}
        style={{width:36,height:36,borderRadius:10,border:"none",background:(input.trim()||image)&&!loading?ACC:C.bd,cursor:(input.trim()||image)&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>}
  </div>;
}

/* ============ TOOLS (TIMER v2) ============ */
function ToolsPage(){
  const PRESETS=[15,25,45,60];
  const[selectedPreset,setSelectedPreset]=useState(25);
  const[customMins,setCustomMins]=useState("");
  const[useCustom,setUseCustom]=useState(false);
  const[time,setTime]=useState(25*60);
  const[running,setRunning]=useState(false);
  const[isBreak,setIsBreak]=useState(false);
  const[sessions,setSessions]=useState(0);

  const activeMins=useCustom&&+customMins>0?+customMins:selectedPreset;

  const resetTimer=()=>{
    setRunning(false);
    setIsBreak(false);
    setTime(activeMins*60);
  };

  useEffect(()=>{setTime(activeMins*60);},[activeMins]);

  useEffect(()=>{
    if(!running)return;
    const iv=setInterval(()=>{
      setTime(t=>{
        if(t<=1){
          clearInterval(iv);
          setRunning(false);
          if(!isBreak){setSessions(s=>s+1);setIsBreak(true);setTime(5*60);}
          else{setIsBreak(false);setTime(activeMins*60);}
          return 0;
        }
        return t-1;
      });
    },1000);
    return()=>clearInterval(iv);
  },[running,isBreak,activeMins]);

  const mm=String(Math.floor(time/60)).padStart(2,"0");
  const ss=String(time%60).padStart(2,"0");
  const progress=isBreak?(1-(time/(5*60)))*100:(1-(time/(activeMins*60)))*100;

  return <div style={{maxWidth:520,margin:"0 auto"}}>
    <div style={{background:`linear-gradient(135deg,${C.dk},${C.da})`,borderRadius:24,padding:"40px",textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",marginBottom:6,letterSpacing:1}}>{isBreak?"ОТДЫХ":"ФОКУС"}</div>
      <div style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:28}}>
        <svg width="180" height="180" style={{transform:"rotate(-90deg)"}}>
          <circle cx="90" cy="90" r="82" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
          <circle cx="90" cy="90" r="82" fill="none" stroke={isBreak?C.g:C.a} strokeWidth="8" strokeDasharray={2*Math.PI*82} strokeDashoffset={2*Math.PI*82*(1-progress/100)} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear"}}/>
        </svg>
        <div style={{position:"absolute",textAlign:"center"}}>
          <div style={{fontSize:52,fontWeight:800,color:"#fff",letterSpacing:3,fontVariantNumeric:"tabular-nums"}}>{mm}:{ss}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2}}>{activeMins} мин</div>
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"center"}}>
        <button onClick={()=>setRunning(!running)} disabled={running&&false} style={{padding:"14px 40px",background:running?"rgba(239,68,68,0.25)":C.a,color:running?"#fca5a5":"#fff",border:"none",borderRadius:14,fontSize:16,fontWeight:700,cursor:"pointer"}}>{running?"Пауза":"Старт"}</button>
        <button onClick={resetTimer} disabled={running} style={{padding:"14px 24px",background:"rgba(255,255,255,0.1)",color:running?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.6)",border:"none",borderRadius:14,fontSize:16,cursor:running?"not-allowed":"pointer"}}>Сброс</button>
      </div>
    </div>

    <Card style={{marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Длительность</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {PRESETS.map(m=><button key={m} onClick={()=>{if(!running){setSelectedPreset(m);setUseCustom(false);}}} disabled={running} style={{padding:"8px 16px",borderRadius:10,border:"2px solid "+((!useCustom&&selectedPreset===m)?C.a:C.bd),background:(!useCustom&&selectedPreset===m)?C.a+"12":"transparent",color:(!useCustom&&selectedPreset===m)?C.a:C.t1,fontWeight:600,fontSize:14,cursor:running?"not-allowed":"pointer",opacity:running?0.5:1}}>{m} мин</button>)}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input type="number" placeholder="Свои минуты..." value={customMins} onChange={e=>{if(!running){setCustomMins(e.target.value);setUseCustom(true);}}} disabled={running} min={1} max={180} style={{...iS,width:160,padding:"8px 12px",fontSize:14}}/>
        {useCustom&&+customMins>0&&<span style={{fontSize:13,color:C.a,fontWeight:600}}>{customMins} мин выбрано</span>}
      </div>
    </Card>

    <Card style={{textAlign:"center"}}><div style={{fontSize:48,fontWeight:800,color:C.a}}>{sessions}</div><div style={{fontSize:14,color:C.t2,marginTop:4}}>Сессий сегодня</div></Card>
  </div>;
}
