"use client";
// v2.3 — offer page
import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";

/* ============ THEME SYSTEM ============ */
const ThemeCtx=createContext<{dark:boolean;toggle:()=>void}>({dark:false,toggle:()=>{}});
const useTheme=()=>useContext(ThemeCtx);

const LIGHT={
  bg:"#F5F7FA",w:"#FFFFFF",a:"#2563EB",ah:"#1D4ED8",
  t1:"#111827",t2:"#6B7280",bd:"#E5E7EB",
  g:"#10B981",r:"#EF4444",y:"#F59E0B",
  sh:"0 2px 12px rgba(0,0,0,0.06)",ib:"#F9FAFB",
  pk:"#EC4899",lb:"#06B6D4",dk:"#1F1F1F",da:"#2F2F2F",
  glass:"rgba(255,255,255,0.8)",glassBd:"rgba(0,0,0,0.08)",
};

// Deep Dark Glass — референс Quantix
const DARK={
  bg:"#080B12",
  w:"#0F1420",          // тёмный цвет карточек (не прозрачный — для надёжности)
  a:"#4F8EF7",
  ah:"#3B82F6",
  t1:"#E8F0FF",
  t2:"#5A6A8A",
  bd:"rgba(255,255,255,0.07)",
  g:"#10B981",r:"#EF4444",y:"#F59E0B",
  sh:"0 8px 32px rgba(0,0,0,0.6)",
  ib:"#141927",         // тёмный инпут
  pk:"#EC4899",lb:"#06B6D4",
  dk:"#060810",
  da:"#0D1018",
  glass:"rgba(15,20,32,0.85)",
  glassBd:"rgba(255,255,255,0.07)",
};

let C:{[k:string]:string}={...LIGHT};
const applyTheme=(dark:boolean)=>{Object.assign(C,dark?DARK:LIGHT);};

/* ============ CONSTANTS ============ */
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
    label:"MY BUSINESS",
    alwaysOpen:true,
    items:[
      {id:"dashboard",label:"Dashboard",accent:"#4F8EF7",ic:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"},
      {id:"strategy",label:"War Room",accent:"#4F8EF7",ic:"M13 10V3L4 14h7v7l9-11h-7z"},
      {id:"crm",label:"CRM",accent:"#38BDF8",ic:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"},
      {id:"content",label:"Content",accent:"#A855F7",ic:"M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"},
      {id:"calls",label:"Calls",accent:"#38BDF8",ic:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"},
      {id:"offer",label:"Positioning",accent:"#F59E0B",ic:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"},
    ]
  },
  {
    label:"AI TOOLS",
    items:[
      {id:"ai",label:"Kirill Scales AI",ic:"M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",accent:"#A78BFA"},
      {id:"product",label:"Vizzy Product AI",ic:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",accent:"#34D399"},
      {id:"script",label:"Vizzy Copy AI",ic:"M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",accent:"#FB923C"},
      {id:"stories",label:"Vizzy Stories AI",ic:"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",accent:"gradient"},
    ]
  },
  {
    label:"OTHER",
    items:[
      {id:"links",label:"Links",accent:"#94A3B8",ic:"M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"},
      {id:"profile",label:"Settings",accent:"#94A3B8",ic:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z"},
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
// Input style — динамический, всегда читает актуальные цвета из C
// Вызывать как iS() — возвращает актуальные стили с учётом текущей темы
const iS = ():React.CSSProperties => ({
  width:"100%",padding:"11px 14px",
  border:"1px solid "+C.bd,
  borderRadius:10,fontSize:14,outline:"none",
  background:C.ib,
  color:C.t1,
  boxSizing:"border-box" as const,
  fontFamily:"'Inter',sans-serif",
  transition:"border-color 0.15s",
});
const Logo = ({s=28}:{s?:number}) => <img src="/logo.png" width={s} height={s} style={{objectFit:"contain",display:"block",flexShrink:0}} alt="Vizzy"/>;
const Brand = ({size="md"}:{size?:string}) => {
  const sz:any={sm:{f:12,sub:8,gap:1},md:{f:15,sub:9,gap:2},lg:{f:20,sub:11,gap:3}};
  const s=sz[size]||sz.md;
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",lineHeight:1.2}}><span style={{fontSize:s.f,fontWeight:800,color:"#fff",letterSpacing:2}}>VIZZY</span><span style={{fontSize:s.sub,fontWeight:300,color:"rgba(255,255,255,0.6)",letterSpacing:1.5,marginTop:s.gap}}>by Kirill Scales</span></div>;
};
const Btn = ({children,onClick,primary=true,style:sx,disabled}:{children:React.ReactNode,onClick?:()=>void,primary?:boolean,style?:React.CSSProperties,disabled?:boolean}) => {
  const{dark}=useTheme();
  return <button onClick={onClick} disabled={disabled} style={{
    padding:"10px 20px",
    background:primary
      ?(dark?"linear-gradient(135deg,#1E3A8A,#2563EB)":C.a)
      :(dark?"rgba(255,255,255,0.05)":C.bg),
    color:primary?"#fff":(dark?"rgba(255,255,255,0.6)":C.t2),
    border:primary?"none":`1px solid ${C.bd}`,
    borderRadius:10,fontSize:14,fontWeight:600,
    cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?0.5:1,
    boxShadow:primary&&dark?"0 0 20px rgba(37,99,235,0.3),inset 0 1px 0 rgba(255,255,255,0.1)":"none",
    transition:"all 0.2s ease",
    ...sx
  }}>{children}</button>;
};
const Tag = ({label,color}:{label:string,color:string}) => <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:color+"18",color}}>{label}</span>;

const Card = ({children,style:sx}:{children:React.ReactNode,style?:React.CSSProperties}) => {
  const{dark}=useTheme();
  return <div style={{
    background:dark?"#0F1420":C.w,
    borderRadius:16,padding:24,
    boxShadow:dark?"0 4px 24px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04)":C.sh,
    border:dark?"1px solid rgba(255,255,255,0.06)":"none",
    ...sx
  }}>{children}</div>;
};

// Inner panel — for things like kanban columns, table areas, empty states
const useCardStyle=(overrides?:React.CSSProperties):React.CSSProperties=>{
  const{dark}=useTheme();
  return{
    background:dark?"#0F1420":C.w,
    border:dark?"1px solid rgba(255,255,255,0.06)":"none",
    boxShadow:dark?"0 4px 24px rgba(0,0,0,0.4)":C.sh,
    borderRadius:16,
    ...overrides,
  };
};

// Kanban column style
const useColStyle=(isOver?:boolean):React.CSSProperties=>{
  const{dark}=useTheme();
  return{
    background:dark
      ?(isOver?"rgba(79,142,247,0.08)":"#0C1019")
      :(isOver?"#F0F6FF":"#F2F2F7"),
    border:dark
      ?(isOver?"2px solid rgba(79,142,247,0.4)":"2px solid rgba(255,255,255,0.04)")
      :(isOver?"2px solid #007AFF":"2px solid transparent"),
    boxShadow:dark
      ?(isOver?"0 0 20px rgba(79,142,247,0.12)":"0 2px 12px rgba(0,0,0,0.3)")
      :(isOver?"0 0 0 2px #007AFF,0 4px 20px rgba(0,122,255,0.15)":"0 1px 4px rgba(0,0,0,0.06)"),
    borderRadius:18,
  };
};


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
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.dk},${C.da},${C.a})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",padding:20}}>
      <div style={{background:C.w,borderRadius:24,padding:"48px 40px",width:"100%",maxWidth:420,boxShadow:"0 24px 80px rgba(0,0,0,0.25)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,background:C.dk,padding:"14px 28px",borderRadius:12}}>
            <Logo s={40}/><Brand size="lg"/>
          </div>
        </div>
        <div style={{fontSize:16,fontWeight:600,textAlign:"center",marginBottom:24,color:C.t1}}>Вход в платформу</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} style={iS()}/>
          <input placeholder="Пароль" type="password" value={pw} onChange={e=>setPw(e.target.value)} style={iS()} onKeyDown={e=>e.key==="Enter"&&login()}/>
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

/* ============ SIDEBAR — Deep Dark Glass ============ */
function Side({active,onNav,onLogout,collapsed:controlledCollapsed,onCollapsedChange}:{active:string,onNav:(id:string)=>void,onLogout:()=>void,collapsed?:boolean,onCollapsedChange?:(collapsed:boolean)=>void}){
  const{dark,toggle}=useTheme();
  const[localCollapsed,setLocalCollapsed]=useState(false);
  const collapsed=controlledCollapsed ?? localCollapsed;
  const setCollapsed=(next:boolean)=>{
    if(onCollapsedChange)onCollapsedChange(next);
    else setLocalCollapsed(next);
  };
  const activeGroupIdx=NAV_GROUPS.findIndex(g=>g.items.some(i=>i.id===active));
  const[openGroups,setOpenGroups]=useState<number[]>(()=>[activeGroupIdx>=0?activeGroupIdx:0]);

  const toggleGroup=(idx:number)=>{
    setOpenGroups(p=>p.includes(idx)?p.filter(i=>i!==idx):[...p,idx]);
  };

  const AI_ICONS:Record<string,string>={
    ai:"/icon-ai.png",script:"/icon-copy.png",
    product:"/icon-product.png",stories:"/icon-stories.png",
    design:"/icon-design.png",
  };

  const getAccent=(n:any)=>(n.accent==="gradient"?null:n.accent||null);

  const renderItem=(n:any)=>{
    const isActive=active===n.id;
    const accent=getAccent(n)||"#4F8EF7";
    const isGrad=n.accent==="gradient";
    const customIcon=AI_ICONS[n.id];
    // Parse accent to rgb for backgrounds
    const r=parseInt(accent.slice(1,3),16)||79;
    const g2=parseInt(accent.slice(3,5),16)||142;
    const b=parseInt(accent.slice(5,7),16)||247;

    return(
      <button key={n.id} onClick={()=>onNav(n.id)} title={collapsed?n.label:undefined}
        style={{
          display:"flex",alignItems:"center",gap:10,
          padding:collapsed?"9px 0":"7px 10px 7px 10px",
          justifyContent:collapsed?"center":"flex-start",
          borderRadius:11,
          cursor:"pointer",width:"100%",
          position:"relative",overflow:"hidden",
          transition:"all 0.25s cubic-bezier(0.4,0,0.2,1)",
          outline:"none",
          marginBottom:1,
          background:isActive
            ?("rgba("+r+","+g2+","+b+",0.13)")
            :"rgba(255,255,255,0.0)",
          backdropFilter:isActive?"blur(12px) saturate(1.6)":"none",
          WebkitBackdropFilter:isActive?"blur(12px) saturate(1.6)":"none",
          boxShadow:isActive
            ?("0 0 20px rgba("+r+","+g2+","+b+",0.2), inset 0 1px 0 rgba(255,255,255,0.08)")
            :"none",
          border:isActive
            ?("1px solid rgba("+r+","+g2+","+b+",0.25)")
            :"1px solid transparent",
        }}
        onMouseEnter={e=>{
          const el=e.currentTarget as HTMLElement;
          if(!isActive){
            el.style.background="rgba("+r+","+g2+","+b+",0.07)";
            el.style.backdropFilter="blur(8px)";
            (el.style as any).WebkitBackdropFilter="blur(8px)";
            el.style.border="1px solid rgba("+r+","+g2+","+b+",0.12)";
            el.style.transform="translateX(2px)";
          }
        }}
        onMouseLeave={e=>{
          const el=e.currentTarget as HTMLElement;
          if(!isActive){
            el.style.background="rgba(255,255,255,0)";
            el.style.backdropFilter="none";
            (el.style as any).WebkitBackdropFilter="none";
            el.style.border="1px solid transparent";
            el.style.transform="translateX(0)";
          }
        }}>

        {/* Active left glow bar — gradient */}
        {isActive&&<div style={{
          position:"absolute",left:0,top:"16%",bottom:"16%",width:3,
          borderRadius:"0 3px 3px 0",
          background:isGrad
            ?"linear-gradient(180deg,#86EFAC,#A78BFA)"
            :"linear-gradient(180deg,rgba("+r+","+g2+","+b+",1),rgba("+r+","+g2+","+b+",0.4))",
          boxShadow:"0 0 12px rgba("+r+","+g2+","+b+",0.8), 0 0 24px rgba("+r+","+g2+","+b+",0.4)",
        }}/>}

        {/* Shimmer overlay */}
        {isActive&&<div style={{
          position:"absolute",inset:0,borderRadius:11,
          background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.04) 50%,transparent 70%)",
          backgroundSize:"200% 100%",
          animation:"shimmer 4s ease-in-out infinite",
          pointerEvents:"none",
        }}/>}

        {/* Ambient glow blob on active */}
        {isActive&&<div style={{
          position:"absolute",right:-10,top:"50%",transform:"translateY(-50%)",
          width:50,height:50,borderRadius:"50%",
          background:"radial-gradient(circle,rgba("+r+","+g2+","+b+",0.15) 0%,transparent 70%)",
          pointerEvents:"none",
          filter:"blur(8px)",
        }}/>}

        {/* Icon wrapper — glass pill */}
        <div style={{
          width:26,height:26,borderRadius:8,flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",
          overflow:"hidden",
          background:customIcon?"transparent"
            :isActive
              ?isGrad
                ?"linear-gradient(135deg,rgba(134,239,172,0.3),rgba(167,139,250,0.3))"
                :"rgba("+r+","+g2+","+b+",0.2)"
              :`rgba(255,255,255,0.04)`,
          border:isActive
            ?"1px solid rgba("+r+","+g2+","+b+",0.35)"
            :"1px solid rgba(255,255,255,0.05)",
          boxShadow:isActive
            ?"0 0 10px rgba("+r+","+g2+","+b+",0.3), inset 0 1px 0 rgba(255,255,255,0.12)"
            :"none",
          transition:"all 0.25s",
        }}>
          {customIcon
            ?<img src={customIcon} width={26} height={26} style={{borderRadius:8,objectFit:"cover",opacity:isActive?1:0.5}} alt={n.label}/>
            :<I path={n.ic} size={13}
                color={isActive?(isGrad?"#c4f5d4":accent):"rgba(255,255,255,0.4)"}
                sw={isActive?2:1.5}/>
          }
        </div>

        {!collapsed&&<span style={{
          fontSize:12.5,fontWeight:isActive?600:400,flex:1,textAlign:"left",
          color:isActive
            ?(isGrad?"#c4f5d4":accent==="gradient"?"#86EFAC":accent)
            :"rgba(255,255,255,0.5)",
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
          transition:"color 0.2s",
          letterSpacing:isActive?0.1:0,
        }}>{n.label}</span>}

        {/* Active dot */}
        {!collapsed&&isActive&&<div style={{
          width:5,height:5,borderRadius:"50%",flexShrink:0,
          background:isGrad
            ?"linear-gradient(135deg,#86EFAC,#A78BFA)"
            :accent,
          boxShadow:"0 0 6px rgba("+r+","+g2+","+b+",0.8), 0 0 12px rgba("+r+","+g2+","+b+",0.5)",
        }}/>}
      </button>
    );
  };

  const SB_BG="linear-gradient(180deg,#06080F 0%,#080B14 50%,#060810 100%)";

  return(
    <div style={{
      width:collapsed?64:248,height:"100vh",
      background:SB_BG,
      display:"flex",flexDirection:"column",
      transition:"width 0.3s cubic-bezier(0.4,0,0.2,1)",
      position:"fixed",left:0,top:0,zIndex:100,
      overflowX:"hidden",overflowY:"hidden",
      borderRight:"1px solid rgba(255,255,255,0.05)",
    }}>
      <style>{`
        @keyframes shimmer{
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        @keyframes borderGlow{
          0%,100%{border-color:rgba(79,142,247,0.15)}
          50%{border-color:rgba(79,142,247,0.4)}
        }
        .sb-scroll::-webkit-scrollbar{width:2px}
        .sb-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.05);border-radius:2px}
      `}</style>

      {/* Top ambient glow */}
      <div style={{
        position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",
        width:200,height:120,
        background:"radial-gradient(ellipse,rgba(79,142,247,0.12) 0%,transparent 70%)",
        pointerEvents:"none",
      }}/>

      {/* Logo */}
      <div style={{
        padding:collapsed?"18px 0":"18px 16px",
        display:"flex",alignItems:"center",gap:10,
        justifyContent:collapsed?"center":"flex-start",
        borderBottom:"1px solid rgba(255,255,255,0.05)",
        flexShrink:0,position:"relative",
      }}>
        <div style={{
          width:36,height:36,borderRadius:10,
          background:"linear-gradient(135deg,#1a2340,#0d1428)",
          border:"1px solid rgba(79,142,247,0.3)",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 0 16px rgba(79,142,247,0.2),inset 0 1px 0 rgba(255,255,255,0.05)",
          flexShrink:0,
        }}>
          <Logo s={26}/>
        </div>
        {!collapsed&&<div style={{display:"flex",flexDirection:"column",lineHeight:1.2}}>
          <span style={{fontSize:14,fontWeight:800,color:"#E8F0FF",letterSpacing:1.5}}>VIZZY</span>
          <span style={{fontSize:8,color:"rgba(255,255,255,0.25)",letterSpacing:1}}>by Kirill Scales</span>
        </div>}
      </div>

      {/* Nav */}
      <div className="sb-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"10px 8px 0"}}>
        {NAV_GROUPS.map((group,gi)=>{
          const isOpen=collapsed||(group as any).alwaysOpen||!group.label||openGroups.includes(gi);
          const hasActiveItem=group.items.some(i=>i.id===active);
          const isAlwaysOpen=(group as any).alwaysOpen;

          return(
            <div key={gi} style={{marginBottom:6}}>
              {group.label&&!collapsed&&(
                isAlwaysOpen
                  // MAIN block — non-clickable label, no chevron
                  ?<div style={{padding:"8px 10px 4px"}}>
                    <span style={{
                      fontSize:9,fontWeight:700,
                      color:hasActiveItem
                        ?((group.items.find(i=>i.id===active)?.accent||"rgba(79,142,247,0.7)")+"bb")
                        :"rgba(255,255,255,0.18)",
                      letterSpacing:1.8,textTransform:"uppercase",
                    }}>{group.label}</span>
                  </div>
                  :<button onClick={()=>toggleGroup(gi)}
                    style={{
                      width:"100%",display:"flex",alignItems:"center",
                      justifyContent:"space-between",
                      padding:"8px 10px 4px",border:"none",
                      background:"transparent",cursor:"pointer",borderRadius:8,
                      transition:"background 0.15s",
                    }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.03)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
                    <span style={{
                      fontSize:9,fontWeight:700,
                      color:hasActiveItem
                        ?((group.items.find(i=>i.id===active)?.accent||"rgba(79,142,247,0.7)")+"bb")
                        :"rgba(255,255,255,0.18)",
                      letterSpacing:1.8,textTransform:"uppercase",
                    }}>{group.label}</span>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                      stroke={hasActiveItem?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.15)"}
                      strokeWidth="2.5"
                      style={{transform:isOpen?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.25s ease"}}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
              )}

              {group.label&&collapsed&&gi>0&&(
                <div style={{height:1,background:"rgba(255,255,255,0.04)",margin:"6px 10px"}}/>
              )}

              <div style={{
                display:"flex",flexDirection:"column",gap:2,
                maxHeight:isOpen?"600px":"0",
                overflow:"hidden",
                transition:"max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
              }}>
                {group.items.map(n=>renderItem(n))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={{
        padding:"10px 8px 12px",
        borderTop:"1px solid rgba(255,255,255,0.04)",
        flexShrink:0,display:"flex",flexDirection:"column",gap:4,
      }}>
        {/* Theme toggle */}
        <div style={{
          display:"flex",alignItems:"center",
          justifyContent:collapsed?"center":"space-between",
          padding:collapsed?"10px 0":"8px 10px",
        }}>
          {!collapsed&&<span style={{fontSize:10,color:"rgba(255,255,255,0.25)",letterSpacing:0.5}}>Тема интерфейса</span>}
          <button onClick={toggle}
            style={{
              width:48,height:26,borderRadius:13,flexShrink:0,
              background:dark
                ?"linear-gradient(90deg,#1E3A8A,#4F46E5)"
                :"rgba(255,255,255,0.1)",
              border:`1px solid ${dark?"rgba(79,142,247,0.4)":"rgba(255,255,255,0.1)"}`,
              cursor:"pointer",position:"relative",
              boxShadow:dark?"0 0 12px rgba(79,142,247,0.25)":"none",
              transition:"all 0.4s ease",
              outline:"none",
            }}>
            <div style={{
              position:"absolute",top:2,
              left:dark?24:2,
              width:20,height:20,borderRadius:"50%",
              background:dark?"#E0EAFF":"rgba(255,255,255,0.7)",
              transition:"left 0.35s cubic-bezier(0.4,0,0.2,1)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,
              boxShadow:dark?"0 0 8px rgba(79,142,247,0.6)":"0 1px 4px rgba(0,0,0,0.2)",
            }}>
              {dark?"🌙":"☀️"}
            </div>
          </button>
        </div>

        {/* Collapse */}
        <button onClick={()=>setCollapsed(!collapsed)}
          style={{
            width:"100%",display:"flex",alignItems:"center",gap:8,
            padding:collapsed?"10px 0":"7px 10px",
            justifyContent:collapsed?"center":"flex-start",
            border:"none",borderRadius:10,cursor:"pointer",
            background:"transparent",color:"rgba(255,255,255,0.25)",
            fontSize:12,transition:"all 0.15s",outline:"none",
          }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)";(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.55)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.25)";}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {collapsed?<polyline points="9 18 15 12 9 6"/>:<polyline points="15 18 9 12 15 6"/>}
          </svg>
          {!collapsed&&<span>Свернуть</span>}
        </button>

        {/* Logout */}
        <button onClick={onLogout}
          style={{
            width:"100%",display:"flex",alignItems:"center",gap:8,
            padding:collapsed?"10px 0":"7px 10px",
            justifyContent:collapsed?"center":"flex-start",
            border:"none",borderRadius:10,cursor:"pointer",
            background:"transparent",color:"rgba(255,255,255,0.2)",
            fontSize:12,transition:"all 0.15s",outline:"none",
          }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(239,68,68,0.08)";(e.currentTarget as HTMLElement).style.color="#EF4444";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.2)";}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed&&<span>Выйти</span>}
        </button>
      </div>
    </div>
  );
}

/* ============ MOBILE NAV ============ */
// Shows top 5 most important nav items + "More" drawer
const MOB_NAV_PRIMARY=["dashboard","strategy","crm","content","calls"];
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
  const{dark}=useTheme();
  const greeting = getGreeting();
  const displayName = name && name !== "User" ? name : "";
  if(isMobile) return <div style={{height:56,background:C.dk,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",position:"sticky",top:0,zIndex:50}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <Logo s={34}/>
      <div style={{display:"flex",flexDirection:"column",lineHeight:1.15}}>
        <span style={{color:"#fff",fontSize:11,fontWeight:800,letterSpacing:1.5}}>VIZZY</span>
        <span style={{color:"rgba(255,255,255,0.4)",fontSize:8,letterSpacing:1}}>by Kirill Scales</span>
      </div>
    </div>
    <div style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.7)"}}>{greeting}{displayName?", "+displayName:""}</div>
  </div>;
  return <div style={{
    height:64,
    background:dark
      ?"rgba(8,11,18,0.85)"
      :C.w,
    backdropFilter:dark?"blur(24px)":"none",
    WebkitBackdropFilter:dark?"blur(24px)":"none",
    borderBottom:`1px solid ${dark?"rgba(255,255,255,0.05)":C.bd}`,
    display:"flex",alignItems:"center",justifyContent:"space-between",
    padding:"0 32px",position:"sticky",top:0,zIndex:50,
    boxShadow:dark?"0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.3)":"none",
  }}>
    <div style={{fontSize:15,fontWeight:600,color:C.t1}}>{greeting}{displayName?", "+displayName:""}</div>
    <div style={{display:"inline-flex",alignItems:"center",gap:10,
      background:dark?"rgba(255,255,255,0.04)":"#1F1F1F",
      border:dark?"1px solid rgba(255,255,255,0.08)":"none",
      padding:"8px 20px",borderRadius:12,
      boxShadow:dark?"0 0 20px rgba(79,142,247,0.1),inset 0 1px 0 rgba(255,255,255,0.04)":"none",
    }}>
      <Logo s={28}/>
      <div style={{display:"flex",flexDirection:"column",lineHeight:1.15}}>
        <span style={{color:"#fff",fontSize:11,fontWeight:800,letterSpacing:1.5}}>VIZZY</span>
        <span style={{color:"rgba(255,255,255,0.5)",fontSize:8,fontWeight:300,letterSpacing:1}}>by Kirill Scales</span>
      </div>
    </div>
    <div style={{fontSize:13,color:C.t2}}>{fmtDate(new Date())}</div>
  </div>;
};

const Placeholder=({title,ic}:{title:string,ic:string})=><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"calc(100vh - 180px)",gap:20}}><div style={{width:80,height:80,borderRadius:20,background:C.a+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><I path={ic} size={36} color={C.a} sw={1.2}/></div><div style={{fontSize:22,fontWeight:700}}>{title}</div><Card style={{padding:"12px 24px"}}><span style={{fontSize:14,color:C.t2}}>Раздел скоро будет доступен</span></Card></div>;

/* ============ MAIN APP ============ */
export default function App() {
  const [user, setUser] = useState<any>(null);
  const APP_VERSION="v2.2"; // bump this to force-clear stale localStorage
  const VALID_PAGES=["dashboard","strategy","crm","calls","content","forms","offer","prices","icp","bizstrategy","team","links","profile","files","ai","script","product","stories","pnl","media","ads","calc","tools","mailings"];

  // Clear stale localStorage on version change
  useEffect(()=>{
    try{
      const storedVersion=localStorage.getItem("ff_version");
      if(storedVersion!==APP_VERSION){
        localStorage.removeItem("ff_page");
        localStorage.setItem("ff_version",APP_VERSION);
      }
    }catch{}
  },[]);

  const [page, setPage] = useState(()=>{
    try{
      // Check version first
      const storedVersion=localStorage.getItem("ff_version");
      if(storedVersion!==APP_VERSION)return "dashboard";
      const saved=localStorage.getItem("ff_page")||"dashboard";
      if(!VALID_PAGES.includes(saved)){
        localStorage.removeItem("ff_page");
        return "dashboard";
      }
      return saved;
    }catch{return "dashboard";}
  });

  useEffect(()=>{
    try{localStorage.setItem("ff_page",page);}catch{}
  },[page]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [dark, setDark] = useState<boolean>(()=>{
    try{return localStorage.getItem("ff_theme")==="dark";}catch{return false;}
  });

  // Apply theme tokens + body class
  useEffect(()=>{
    applyTheme(dark);
    document.body.classList.toggle("dark",dark);
    try{localStorage.setItem("ff_theme",dark?"dark":"light");}catch{}
  },[dark]);

  const toggleTheme=()=>setDark(d=>!d);

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

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,fontFamily:"'Inter',sans-serif"}}><div style={{fontSize:18,color:C.t2}}>Загрузка...</div></div>;
  if (!user) return <Auth onLogin={(u) => { setUser(u); loadProfile(u.id); }} />;

  const nav = NAV.find(n => n.id === page);

  return(
    <ThemeCtx.Provider value={{dark,toggle:toggleTheme}}>
      <AppLayout user={user} page={page} setPage={setPage} userName={userName} setUserName={setUserName} userAvatar={userAvatar} setUserAvatar={setUserAvatar} logout={logout} nav={nav} dark={dark}/>
    </ThemeCtx.Provider>
  );
}

// ── Error boundary for pages ──────────────────────────────
class PageErrorBoundary extends React.Component<{children:React.ReactNode,name:string},{err:Error|null}>{
  constructor(p:any){super(p);this.state={err:null};}
  static getDerivedStateFromError(e:Error){return{err:e};}
  render(){
    if(this.state.err)return(
      <div style={{padding:40,textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:18,fontWeight:700,marginBottom:8,color:"#EF4444"}}>Ошибка в разделе {this.props.name}</div>
        <div style={{fontSize:12,color:"#64748B",marginBottom:20,fontFamily:"monospace",maxWidth:600,margin:"0 auto 20px"}}>{this.state.err.message}</div>
        <button onClick={()=>this.setState({err:null})} style={{padding:"10px 20px",background:"#2563EB",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600}}>Обновить раздел</button>
      </div>
    );
    return this.props.children;
  }
}

function SafePage({name,children}:{name:string,children:React.ReactNode}){
  return<PageErrorBoundary name={name}>{children}</PageErrorBoundary>;
}

function AppLayout({user,page,setPage,userName,setUserName,userAvatar,setUserAvatar,logout,nav,dark}:any){
  const isMobile=useIsMobile();
  const[sideCollapsed,setSideCollapsed]=useState(false);
  const sideW=sideCollapsed?64:248;

  const pageContent=<>
    {page==="dashboard"&&<SafePage name="Dashboard"><DashPage userId={user.id} name={userName} avatar={userAvatar} onNav={setPage} onAvatarChange={async(url:string)=>{setUserAvatar(url);await supabase.from("profiles").upsert({id:user.id,avatar_url:url},{onConflict:"id"});}}/></SafePage>}
    {page==="strategy"&&<SafePage name="War Room"><StrategyPage userId={user.id}/></SafePage>}
    {page==="crm"&&<SafePage name="CRM"><CrmPage userId={user.id}/></SafePage>}
    {page==="calls"&&<SafePage name="Созвоны"><CallsPage userId={user.id}/></SafePage>}
    {page==="mailings"&&<SafePage name="Рассылки"><MailingsPage userId={user.id}/></SafePage>}
    {page==="content"&&<SafePage name="Контент"><ContentPage userId={user.id}/></SafePage>}
    {page==="pnl"&&<SafePage name="P&L"><PnlPage userId={user.id}/></SafePage>}
    {page==="media"&&<SafePage name="Медийность"><MediaPage userId={user.id}/></SafePage>}
    {page==="ads"&&<SafePage name="Реклама"><AdsPage userId={user.id}/></SafePage>}
    {page==="calc"&&<SafePage name="Калькулятор"><CalcPage/></SafePage>}
    {page==="tools"&&<SafePage name="Инструменты"><ToolsPage/></SafePage>}
    {page==="links"&&<SafePage name="База ссылок"><LinksPage userId={user.id}/></SafePage>}
    {page==="profile"&&<SafePage name="Настройки профиля"><ProfilePage user={user} name={userName} avatar={userAvatar} setName={setUserName} setAvatar={setUserAvatar}/></SafePage>}
    {page==="files"&&<SafePage name="Файлы"><FilesPage userId={user.id}/></SafePage>}
    {page==="ai"&&<SafePage name="AI"><Placeholder title="Kirill Scales AI" ic="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></SafePage>}
    {page==="script"&&<SafePage name="Copy AI"><CopyAIPage userId={user.id}/></SafePage>}
    {page==="product"&&<SafePage name="Product AI"><Placeholder title="Vizzy Product AI" ic="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></SafePage>}
    {page==="stories"&&<SafePage name="Stories AI"><Placeholder title="Vizzy Stories AI" ic="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></SafePage>}
    {page==="forms"&&<SafePage name="Forms"><FormsPage userId={user.id}/></SafePage>}
    {page==="prices"&&<SafePage name="Prices & Product"><PricesPage userId={user.id} onNav={setPage}/></SafePage>}
    {page==="icp"&&<SafePage name="ICP & IVP"><Placeholder title="ICP & IVP" ic="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></SafePage>}
    {page==="bizstrategy"&&<SafePage name="Strategy"><Placeholder title="Strategy" ic="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></SafePage>}
    {page==="team"&&<SafePage name="Team"><Placeholder title="Team" ic="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></SafePage>}
    {!["dashboard","strategy","crm","calls","mailings","content","pnl","media","ads","calc","tools","links","profile","files","ai","script","product","stories","design","offer","prices","icp","bizstrategy","team"].includes(page)&&nav&&<Placeholder title={nav.label} ic={nav.ic}/>}
  </>;

  return (
    <div style={{
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
      background:dark?"#080B12":C.bg,
      minHeight:"100vh",color:C.t1,
      position:"relative",
      transition:"background 0.5s ease, color 0.4s ease",
    }}>
      {/* Ambient glows — dark mode only */}
      {dark&&<>
        <div style={{position:"fixed",top:-200,left:"30%",width:700,height:700,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(37,99,235,0.07) 0%,transparent 65%)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"fixed",bottom:-200,right:"5%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(139,92,246,0.06) 0%,transparent 65%)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"fixed",top:"40%",left:"50%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(6,182,212,0.03) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>
      </>}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes burningGlow{0%,100%{box-shadow:0 0 12px rgba(239,68,68,0.2)}50%{box-shadow:0 0 24px rgba(239,68,68,0.4)}}
        @keyframes deferrableGlow{0%,100%{box-shadow:0 0 8px rgba(245,158,11,0.12)}50%{box-shadow:0 0 16px rgba(245,158,11,0.28)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 8px 2px rgba(74,222,128,0.3)}50%{box-shadow:0 0 20px 6px rgba(74,222,128,0.6)}}
        @keyframes stickerBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        @keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(120px) rotate(720deg);opacity:0}}
        @keyframes progressGlow{0%,100%{opacity:0.6}50%{opacity:1}}
        @keyframes accentPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes floatUp{0%{transform:translateY(4px);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes borderGlow{0%,100%{border-color:rgba(79,142,247,0.2)}50%{border-color:rgba(79,142,247,0.5)}}
        *{box-sizing:border-box;}
        body{overflow-x:hidden;margin:0;}
        *{transition:background-color 0.35s ease,border-color 0.35s ease,color 0.35s ease,box-shadow 0.35s ease;}
        input,textarea,select,button,svg,img{transition:none!important;}
        button{transition:background 0.15s ease,box-shadow 0.2s ease,transform 0.15s ease!important;}
        .sb-scroll::-webkit-scrollbar{width:2px}
        .sb-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:2px}

        /* ── DARK MODE GLOBAL OVERRIDES ── */
        body.dark {
          background:#080B12;
          color:#E8F0FF;
        }
        /* All white/light card surfaces */
        body.dark [data-card],
        body.dark .card-surface {
          background:#0F1420 !important;
          border:1px solid rgba(255,255,255,0.06) !important;
          color:#E8F0FF;
        }
        /* Kanban columns */
        body.dark .kanban-col {
          background:#0C1019 !important;
          border-color:rgba(255,255,255,0.05) !important;
        }
        /* Segment controls (F2F2F7 backgrounds) */
        body.dark .seg-ctrl {
          background:rgba(255,255,255,0.05) !important;
          border:1px solid rgba(255,255,255,0.06) !important;
        }
        /* Input fields */
        body.dark input,
        body.dark textarea,
        body.dark select {
          background:#141927 !important;
          border-color:rgba(255,255,255,0.08) !important;
          color:#E8F0FF !important;
        }
        body.dark input::placeholder,
        body.dark textarea::placeholder {
          color:rgba(255,255,255,0.2) !important;
        }
        /* Table rows */
        body.dark table {
          background:transparent !important;
        }
        body.dark thead tr {
          border-bottom:1px solid rgba(255,255,255,0.06) !important;
        }
        body.dark tbody tr:hover {
          background:rgba(255,255,255,0.03) !important;
        }
        /* Modals */
        body.dark [data-modal] {
          background:#0F1420 !important;
          border:1px solid rgba(255,255,255,0.08) !important;
          box-shadow:0 24px 60px rgba(0,0,0,0.7) !important;
        }
        /* Scrollbars */
        body.dark ::-webkit-scrollbar {width:4px;height:4px;}
        body.dark ::-webkit-scrollbar-track {background:rgba(255,255,255,0.02);}
        body.dark ::-webkit-scrollbar-thumb {background:rgba(255,255,255,0.08);border-radius:4px;}
        body.dark ::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.14);}
        /* Lead/task cards */
        body.dark .lead-card {
          background:#131926 !important;
          border:1px solid rgba(255,255,255,0.06) !important;
          box-shadow:0 2px 12px rgba(0,0,0,0.4) !important;
        }
        body.dark .lead-card:hover {
          border-color:rgba(79,142,247,0.25) !important;
          box-shadow:0 4px 20px rgba(0,0,0,0.5) !important;
        }
        /* Year map table */
        body.dark .yearmap-table {
          background:#0C1019 !important;
          border-color:rgba(255,255,255,0.05) !important;
        }
        /* Priority menus, dropdowns */
        body.dark .dropdown-menu {
          background:#131926 !important;
          border:1px solid rgba(255,255,255,0.08) !important;
          box-shadow:0 12px 40px rgba(0,0,0,0.6) !important;
        }
        /* Segment button active state */
        body.dark .seg-active {
          background:#0F1420 !important;
          box-shadow:0 1px 4px rgba(0,0,0,0.5) !important;
          color:#E8F0FF !important;
        }
        /* Stats cards on CRM, Content etc */
        body.dark .stat-card {
          background:#0F1420 !important;
          border:1px solid rgba(255,255,255,0.06) !important;
        }
        /* Empty state areas */
        body.dark .empty-state {
          background:#0C1019 !important;
          border:1px solid rgba(255,255,255,0.05) !important;
        }
        /* Board preview cards */
        body.dark .board-preview-card {
          background:#0F1420 !important;
          border:1px solid rgba(255,255,255,0.07) !important;
          box-shadow:0 4px 20px rgba(0,0,0,0.5) !important;
        }
        body.dark .board-preview-card:hover {
          border-color:rgba(79,142,247,0.3) !important;
          box-shadow:0 8px 32px rgba(79,142,247,0.08),0 0 0 1px rgba(79,142,247,0.15) !important;
        }
        /* Funnel cards in CRM */
        body.dark .funnel-card {
          background:#0F1420 !important;
          border:1px solid rgba(255,255,255,0.06) !important;
          box-shadow:0 4px 20px rgba(0,0,0,0.4) !important;
        }
        /* Notification/toast */
        body.dark .toast-panel {
          background:#131926 !important;
          border:1px solid rgba(255,255,255,0.08) !important;
        }
        /* Form new-item panels */
        body.dark .form-panel {
          background:#0E1521 !important;
          border:1px solid rgba(255,255,255,0.07) !important;
          border-radius:16px !important;
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>

      {isMobile ? <>
        <MobileNav active={page} onNav={setPage} onLogout={logout}/>
        <div style={{minHeight:"100vh",paddingBottom:80}}>
          <Head name={userName}/>
          <div style={{padding:"16px 16px 0"}}>{pageContent}</div>
        </div>
      </> : <>
        <Side active={page} onNav={setPage} onLogout={logout} collapsed={sideCollapsed} onCollapsedChange={setSideCollapsed}/>
        <div style={{marginLeft:sideW,width:`calc(100vw - ${sideW}px)`,minHeight:"100vh",transition:"margin-left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1)",overflowX:"hidden"}}>
          <Head name={userName}/>
          <div style={{padding:"28px 32px",width:"100%"}}>{pageContent}</div>
        </div>
      </>}
    </div>
  );
}


/* ============ PROFILE SETTINGS ============ */
function ProfilePage({user,name,avatar,setName,setAvatar}:{user:any,name:string,avatar:string,setName:(v:string)=>void,setAvatar:(v:string)=>void}){
  const isMobile=useIsMobile();
  const[localName,setLocalName]=useState(name||"");
  const[localAvatar,setLocalAvatar]=useState(avatar||"");
  const[saving,setSaving]=useState(false);
  const[msg,setMsg]=useState("");

  useEffect(()=>{setLocalName(name||"");},[name]);
  useEffect(()=>{setLocalAvatar(avatar||"");},[avatar]);

  const save=async()=>{
    const cleanName=localName.trim();
    if(cleanName.length<2){setMsg("Имя должно быть минимум 2 символа");return;}
    if(cleanName.length>60){setMsg("Имя слишком длинное. Максимум 60 символов");return;}
    setSaving(true);setMsg("");
    const payload={id:user.id,name:cleanName,avatar_url:localAvatar.trim()||null,updated_at:new Date().toISOString()};
    const{error}=await supabase.from("profiles").upsert(payload,{onConflict:"id"});
    setSaving(false);
    if(error){setMsg("Не удалось сохранить профиль: "+error.message);return;}
    setName(cleanName);setAvatar(localAvatar.trim());setMsg("Профиль сохранён");
  };

  return <div style={{maxWidth:760}}>
    <div style={{background:`linear-gradient(135deg,${C.dk},${C.da})`,borderRadius:16,padding:isMobile?18:28,marginBottom:20,display:"flex",alignItems:"center",gap:16}}>
      <div style={{width:64,height:64,borderRadius:18,background:"rgba(255,255,255,0.10)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:"1px solid rgba(255,255,255,0.12)"}}>
        {localAvatar?<img src={localAvatar} alt="Аватар" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{color:"#fff",fontSize:24,fontWeight:800}}>{(localName||user.email||"U").slice(0,1).toUpperCase()}</span>}
      </div>
      <div>
        <div style={{fontSize:isMobile?20:24,fontWeight:800,color:"#fff",marginBottom:4}}>Настройки профиля</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.55)"}}>Здесь можно поменять имя, которое отображается в платформе</div>
      </div>
    </div>

    <Card style={{display:"flex",flexDirection:"column",gap:16}}>
      <div>
        <label style={{display:"block",fontSize:12,color:C.t2,fontWeight:700,marginBottom:7}}>Имя</label>
        <input value={localName} onChange={e=>setLocalName(e.target.value)} placeholder="Например: Кирилл" maxLength={60} style={iS()}/>
      </div>
      <div>
        <label style={{display:"block",fontSize:12,color:C.t2,fontWeight:700,marginBottom:7}}>Ссылка на аватар, необязательно</label>
        <input value={localAvatar} onChange={e=>setLocalAvatar(e.target.value)} placeholder="https://..." style={iS()}/>
      </div>
      {msg&&<div style={{fontSize:13,color:msg.includes("сохран")?C.g:C.r,fontWeight:600}}>{msg}</div>}
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <Btn onClick={save} disabled={saving}>{saving?"Сохраняю...":"Сохранить профиль"}</Btn>
        <Btn primary={false} onClick={()=>{setLocalName(name||"");setLocalAvatar(avatar||"");setMsg("");}}>Сбросить</Btn>
      </div>
    </Card>
  </div>;
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
      .filter((c:any)=>c.date>=td&&c.time_start)
      .sort((a:any,b:any)=>a.date===b.date?(a.time_start||"").localeCompare(b.time_start||""):a.date.localeCompare(b.date))
      .slice(0,5);
  },[calls.data, td]);

  const minsUntilCall = (c:any) => {
    if(!c.time_start)return 999;
    const now = new Date();
    const parts = (c.time_start||"00:00").split(":");
    const h=parseInt(parts[0]||"0"), m2=parseInt(parts[1]||"0");
    const callTime = new Date(c.date);
    callTime.setHours(h, m2, 0, 0);
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
    <div onClick={()=>onNav("ai")} style={{marginTop:isMobile?12:16,background:`linear-gradient(135deg,${C.dk},#2a2a2a)`,borderRadius:16,padding:isMobile?"14px 16px":"18px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",transition:"transform 0.15s,box-shadow 0.15s"}}
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
                  <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2} style={{...iS(),resize:"none",fontSize:13}}/>
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
        <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))send();}} placeholder="Напиши комментарий... (Cmd+Enter для отправки)" rows={3} style={{...iS(),resize:"none",fontSize:13,marginBottom:10}}/>
        <button onClick={send} disabled={!text.trim()} style={{width:"100%",padding:"10px",background:C.a,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:text.trim()?"pointer":"not-allowed",opacity:text.trim()?1:0.5}}>Отправить</button>
      </div>
    </div>
  </div>;
}

// Year map (Gantt-style) — full rewrite
function YearMap({userId,goals,goalUpdate,goalAdd,goalTasks}:{userId:string,goals:any,goalUpdate:any,goalAdd:any,goalTasks:any}){
  // v3 — progress colors, drag reorder, resize bars, default 3 months
  const currentYear=new Date().getFullYear();
  const MONTHS_RU=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const[showForm,setShowForm]=useState(false);
  const[gf,sGf]=useState({name:"",description:"",color:C.a,start_date:"",end_date:""});
  const[editGoal,setEditGoal]=useState<any|null>(null);
  const[openGoalId,setOpenGoalId]=useState<string|null>(null);
  const[period,setPeriod]=useState<1|3|6|12>(3); // default 3 months
  const[viewYear,setViewYear]=useState(currentYear);
  const[startMonth,setStartMonth]=useState(()=>Math.max(0,new Date().getMonth()-1));

  // Row reorder drag
  const[rowDrag,setRowDrag]=useState<string|null>(null);
  const[rowOver,setRowOver]=useState<string|null>(null);
  const[goalOrder,setGoalOrder]=useState<string[]>([]);

  // Bar resize drag: {id, side:'left'|'right', startX, origDate}
  const barResizeRef=useRef<{id:string;side:"left"|"right";startX:number;origDate:string;containerW:number;containerLeft:number}|null>(null);
  const[resizingId,setResizingId]=useState<string|null>(null);

  const YEARS=[currentYear, currentYear+1, currentYear+2];
  const COLORS=[C.a,"#8B5CF6",C.g,C.r,C.y,C.pk,"#06B6D4","#F97316"];
  const PERIODS:Array<[number,string]>=[[1,"1 мес"],[3,"3 мес"],[6,"6 мес"],[12,"Год"]];

  const visibleGoals=useMemo(()=>{
    const all=goals.data.filter((g:any)=>!g.is_system_pinned);
    if(goalOrder.length===0)return all;
    const ordered=[...all].sort((a:any,b:any)=>{
      const ai=goalOrder.indexOf(a.id);
      const bi=goalOrder.indexOf(b.id);
      if(ai===-1&&bi===-1)return 0;
      if(ai===-1)return 1;
      if(bi===-1)return -1;
      return ai-bi;
    });
    return ordered;
  },[goals.data,goalOrder]);

  // Sync order when goals change
  useEffect(()=>{
    setGoalOrder(p=>{
      const ids=goals.data.filter((g:any)=>!g.is_system_pinned).map((g:any)=>g.id);
      if(p.length===0)return ids;
      const merged=[...p.filter((id:string)=>ids.includes(id)),...ids.filter((id:string)=>!p.includes(id))];
      return merged;
    });
  },[goals.data]);

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

  const now=new Date();
  const visibleMonths=useMemo(()=>{
    const months=[];
    for(let i=0;i<period;i++){
      const m=(startMonth+i)%12;
      const y=viewYear+Math.floor((startMonth+i)/12);
      months.push({m,y,label:MONTHS_RU[m]});
    }
    return months;
  },[period,startMonth,viewYear]);

  const navigatePeriod=(dir:number)=>{
    const next=startMonth+dir*period;
    if(next<0)setStartMonth(Math.max(0,startMonth-period));
    else setStartMonth(Math.min(11,next));
  };

  const goalToBar=(g:any)=>{
    if(!g.start_date||!g.end_date)return null;
    const start=new Date(g.start_date);
    const end=new Date(g.end_date);
    const vm=visibleMonths;
    if(!vm.length)return null;
    const rangeStart=new Date(vm[0].y,vm[0].m,1);
    const rangeEnd=new Date(vm[vm.length-1].y,vm[vm.length-1].m+1,0);
    if(end<rangeStart||start>rangeEnd)return null;
    const totalDays=(rangeEnd.getTime()-rangeStart.getTime())/(1000*60*60*24)+1;
    const barStart=Math.max(0,(start.getTime()-rangeStart.getTime())/(1000*60*60*24));
    const barEnd=Math.min(totalDays,(end.getTime()-rangeStart.getTime())/(1000*60*60*24)+1);
    return{left:(barStart/totalDays)*100,width:((barEnd-barStart)/totalDays)*100};
  };

  const todayCol=useMemo(()=>{
    const vm=visibleMonths;
    if(!vm.length)return -1;
    const rangeStart=new Date(vm[0].y,vm[0].m,1);
    const rangeEnd=new Date(vm[vm.length-1].y,vm[vm.length-1].m+1,0);
    if(now<rangeStart||now>rangeEnd)return -1;
    const total=(rangeEnd.getTime()-rangeStart.getTime())/(1000*60*60*24)+1;
    const elapsed=(now.getTime()-rangeStart.getTime())/(1000*60*60*24);
    return(elapsed/total)*100;
  },[visibleMonths]);

  // Progress-based bar color: 0%=red, 50%=orange/yellow, 100%=green
  const progressColor=(pct:number,achieved:boolean)=>{
    if(achieved||pct>=100)return{bg:"linear-gradient(90deg,#4ADE80,#16A34A)",shadow:"0 3px 14px rgba(74,222,128,0.5)"};
    if(pct>=75)return{bg:"linear-gradient(90deg,#86EFAC,#22C55E)",shadow:"0 3px 12px rgba(34,197,94,0.35)"};
    if(pct>=50)return{bg:"linear-gradient(90deg,#FDE68A,#F59E0B)",shadow:"0 3px 12px rgba(245,158,11,0.35)"};
    if(pct>=25)return{bg:"linear-gradient(90deg,#FCA5A5,#F97316)",shadow:"0 3px 12px rgba(249,115,22,0.35)"};
    return{bg:"linear-gradient(90deg,#FCA5A5,#EF4444)",shadow:"0 3px 12px rgba(239,68,68,0.35)"};
  };

  const goalProgress=(gid:string)=>{
    const tasks=(goalTasks?.data||[]).filter((t:any)=>t.goal_id===gid&&t.type!=="delegate");
    if(!tasks.length)return 0;
    return Math.round(tasks.filter((t:any)=>t.status==="done"||t.done).length/tasks.length*100);
  };

  // Convert pixel delta to date change
  const dateDeltaFromPx=(px:number,containerW:number)=>{
    const vm=visibleMonths;
    if(!vm.length)return 0;
    const rangeStart=new Date(vm[0].y,vm[0].m,1);
    const rangeEnd=new Date(vm[vm.length-1].y,vm[vm.length-1].m+1,0);
    const totalDays=(rangeEnd.getTime()-rangeStart.getTime())/(1000*60*60*24)+1;
    return Math.round((px/containerW)*totalDays);
  };

  const addDays=(dateStr:string,days:number)=>{
    const d=new Date(dateStr);
    d.setDate(d.getDate()+days);
    return d.toISOString().split("T")[0];
  };

  const periodLabel=useMemo(()=>{
    if(period===12)return`${viewYear}`;
    if(!visibleMonths.length)return"";
    const first=visibleMonths[0],last=visibleMonths[visibleMonths.length-1];
    return`${MONTHS_RU[first.m]} ${first.y} — ${MONTHS_RU[last.m]} ${last.y}`;
  },[period,visibleMonths,viewYear]);

  // Row reorder handlers
  const onRowDrop=(targetId:string)=>{
    if(!rowDrag||rowDrag===targetId)return;
    setGoalOrder(p=>{
      const arr=[...p];
      const fromIdx=arr.indexOf(rowDrag);
      const toIdx=arr.indexOf(targetId);
      if(fromIdx===-1||toIdx===-1)return arr;
      arr.splice(fromIdx,1);arr.splice(toIdx,0,rowDrag);
      return arr;
    });
    setRowDrag(null);setRowOver(null);
  };

  return <>
    {/* Controls */}
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      <h2 style={{margin:0,fontSize:20,fontWeight:700,color:C.t1}}>Карта года</h2>
      <div style={{flex:1}}/>
      {/* Year tabs */}
      <div style={{display:"flex",gap:4,background:C.ib,borderRadius:10,padding:3,border:"1px solid "+C.bd}}>
        {YEARS.map(y=><button key={y} onClick={()=>{setViewYear(y);setStartMonth(0);}} style={{padding:"5px 12px",border:"none",borderRadius:7,background:viewYear===y&&period===12?C.a:"transparent",color:viewYear===y&&period===12?"#fff":C.t2,fontSize:12,fontWeight:700,cursor:"pointer"}}>{y}</button>)}
      </div>
      {/* Period tabs */}
      <div style={{display:"flex",gap:4,background:C.ib,borderRadius:10,padding:3,border:"1px solid "+C.bd}}>
        {PERIODS.map(([p,l])=><button key={p} onClick={()=>{setPeriod(p as any);if(p===12)setStartMonth(0);else setStartMonth(Math.max(0,now.getMonth()-1));}} style={{padding:"5px 12px",border:"none",borderRadius:7,background:period===p?C.a:"transparent",color:period===p?"#fff":C.t2,fontSize:12,fontWeight:700,cursor:"pointer"}}>{l}</button>)}
      </div>
      <button onClick={()=>{setShowForm(!showForm);setEditGoal(null);}}
        style={{padding:"8px 18px",background:C.a,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 0 16px "+C.a+"30"}}>
        + Цель
      </button>
    </div>

    {/* Nav arrows for sub-year periods */}
    {period<12&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
      <button onClick={()=>navigatePeriod(-1)} style={{width:28,height:28,border:"1px solid "+C.bd,borderRadius:8,background:C.ib,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span style={{fontSize:13,fontWeight:600,color:C.t1}}>{periodLabel}</span>
      <button onClick={()=>navigatePeriod(1)} style={{width:28,height:28,border:"1px solid "+C.bd,borderRadius:8,background:C.ib,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>}

    {/* Add/Edit form */}
    {(showForm||editGoal)&&<div style={{background:C.w,borderRadius:14,padding:20,marginBottom:16,border:"1px solid "+C.bd}}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:14,color:C.t1}}>{editGoal?"Изменить цель":"Новая цель"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
        <div style={{gridColumn:"span 3"}}><label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4}}>Название</label>
          <input value={editGoal?editGoal.name:gf.name} onChange={e=>editGoal?setEditGoal({...editGoal,name:e.target.value}):sGf({...gf,name:e.target.value})} style={{...iS(),fontSize:13}}/></div>
        <div><label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4}}>Начало</label>
          <input type="date" value={editGoal?editGoal.start_date:gf.start_date} onChange={e=>editGoal?setEditGoal({...editGoal,start_date:e.target.value}):sGf({...gf,start_date:e.target.value})} style={{...iS(),fontSize:13}}/></div>
        <div><label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4}}>Конец (дедлайн)</label>
          <input type="date" value={editGoal?editGoal.end_date:gf.end_date} onChange={e=>editGoal?setEditGoal({...editGoal,end_date:e.target.value}):sGf({...gf,end_date:e.target.value})} style={{...iS(),fontSize:13}}/></div>
        <div><label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4}}>Цвет</label>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {COLORS.map(c=><button key={c} onClick={()=>editGoal?setEditGoal({...editGoal,color:c}):sGf({...gf,color:c})} style={{width:22,height:22,borderRadius:6,background:c,border:(editGoal?editGoal.color:gf.color)===c?"3px solid "+C.t1:"3px solid transparent",cursor:"pointer"}}/>)}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={editGoal?saveEdit:addGoal} style={{padding:"8px 18px",background:C.a,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer"}}>
          {editGoal?"Сохранить":"Создать"}
        </button>
        <button onClick={()=>{setShowForm(false);setEditGoal(null);}} style={{padding:"8px 14px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:9,fontSize:13,cursor:"pointer"}}>Отмена</button>
      </div>
    </div>}

    {/* Grid */}
    <div className="yearmap-table" style={{background:C.w,borderRadius:16,border:"1px solid "+C.bd,overflow:"hidden"}}
      onMouseMove={e=>{
        if(!barResizeRef.current)return;
        const{id,side,startX,origDate,containerW}=barResizeRef.current;
        const dx=e.clientX-startX;
        const days=dateDeltaFromPx(dx,containerW);
        if(days===0)return;
        const g=goals.data.find((gg:any)=>gg.id===id);
        if(!g)return;
        const newDate=addDays(origDate,days);
        if(side==="right"){
          if(newDate<=g.start_date)return;
          goalUpdate(id,{end_date:newDate,deadline:newDate});
        } else {
          if(newDate>=g.end_date)return;
          goalUpdate(id,{start_date:newDate});
        }
        barResizeRef.current.origDate=newDate;
        barResizeRef.current.startX=e.clientX;
      }}
      onMouseUp={()=>{barResizeRef.current=null;setResizingId(null);}}
      onMouseLeave={()=>{barResizeRef.current=null;setResizingId(null);}}>

      {/* Column headers */}
      <div style={{display:"flex",background:C.ib,borderBottom:"1px solid "+C.bd}}>
        <div style={{width:200,flexShrink:0,padding:"10px 14px",fontSize:11,fontWeight:700,color:C.t2,letterSpacing:0.5,borderRight:"1px solid "+C.bd}}>ЦЕЛЬ</div>
        {visibleMonths.map((vm,i)=>(
          <div key={i} style={{flex:1,textAlign:"center",padding:"10px 4px",fontSize:11,fontWeight:600,color:C.t2,borderRight:i<visibleMonths.length-1?"1px solid "+C.bd+"66":"none"}}>
            {vm.label}{period===12?"":" "+vm.y.toString().slice(2)}
          </div>
        ))}
      </div>

      {visibleGoals.length===0&&<div style={{padding:"60px 0",textAlign:"center",color:C.t2,fontSize:14}}>
        Нет целей. Нажми «+ Цель» чтобы добавить.
      </div>}

      {visibleGoals.map((g:any,idx:number)=>{
        const bar=goalToBar(g);
        const isOpen=openGoalId===g.id;
        const isLast=idx===visibleGoals.length-1;
        const pct=goalProgress(g.id);
        const gAchieved=g.is_achieved||pct>=100;
        const{bg:barBg,shadow:barShadow}=progressColor(pct,gAchieved);
        const isRowDragOver=rowOver===g.id&&rowDrag!==g.id;

        return <div key={g.id}
          style={{borderBottom:isLast?"none":"1px solid "+C.bd+"66",background:isRowDragOver?C.a+"06":"transparent",transition:"background 0.15s"}}
          onDragOver={e=>{e.preventDefault();setRowOver(g.id);}}
          onDrop={()=>onRowDrop(g.id)}
          onDragLeave={()=>setRowOver(null)}>

          <div style={{display:"flex",minHeight:52,alignItems:"stretch"}}>
            {/* Label — draggable for row reorder */}
            <div
              draggable
              onDragStart={()=>setRowDrag(g.id)}
              onDragEnd={()=>{setRowDrag(null);setRowOver(null);}}
              style={{width:200,flexShrink:0,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRight:"1px solid "+C.bd,cursor:"grab",background:isOpen?C.a+"06":"transparent",transition:"background 0.15s",userSelect:"none"}}
              onClick={()=>setOpenGoalId(isOpen?null:g.id)}>
              {/* Drag handle */}
              <div style={{flexShrink:0,color:C.t2,opacity:0.3,fontSize:12,cursor:"grab"}}>⠿</div>
              {/* Progress dot — color matches bar */}
              <div style={{width:9,height:9,borderRadius:"50%",flexShrink:0,
                background:gAchieved?"#16A34A":pct>=75?"#22C55E":pct>=50?"#F59E0B":pct>=25?"#F97316":"#EF4444",
                boxShadow:gAchieved?"0 0 6px rgba(22,163,74,0.6)":"none",
                transition:"background 0.4s",
              }}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                {g.start_date&&g.end_date&&(
                  <div style={{fontSize:10,color:C.t2,marginTop:1}}>{g.start_date.substring(5)} — {g.end_date.substring(5)}</div>
                )}
                {/* Progress bar mini */}
                <div style={{height:2,borderRadius:2,background:C.bd,marginTop:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:pct+"%",background:gAchieved?"#16A34A":pct>=50?"#F59E0B":"#EF4444",borderRadius:2,transition:"width 0.4s,background 0.4s"}}/>
                </div>
              </div>
              <span style={{fontSize:10,fontWeight:600,color:C.t2,flexShrink:0}}>{pct}%</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points={isOpen?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
            </div>

            {/* Timeline */}
            <div style={{flex:1,position:"relative",background:idx%2===0?"transparent":C.bd+"18"}}
              id={`ym-row-${g.id}`}>
              {visibleMonths.map((_,i)=>(
                <div key={i} style={{position:"absolute",left:`${i*(100/period)}%`,top:0,bottom:0,width:1,background:C.bd,opacity:0.35}}/>
              ))}
              {todayCol>=0&&<div style={{position:"absolute",left:`${todayCol}%`,top:0,bottom:0,width:2,background:"#EF4444",zIndex:3,borderRadius:1,opacity:0.7}}/>}

              {bar
                ?<div style={{
                    position:"absolute",top:"50%",transform:"translateY(-50%)",
                    left:`${bar.left}%`,width:`${bar.width}%`,
                    minWidth:8,height:30,
                    background:barBg,borderRadius:8,
                    display:"flex",alignItems:"center",
                    boxSizing:"border-box" as const,zIndex:2,
                    boxShadow:barShadow,
                    cursor:resizingId===g.id?"ew-resize":"pointer",
                    overflow:"visible",
                    transition:resizingId===g.id?"none":"box-shadow 0.3s",
                  }}>
                    {/* Left resize handle */}
                    <div
                      style={{position:"absolute",left:-4,top:0,bottom:0,width:10,cursor:"ew-resize",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center"}}
                      onMouseDown={e=>{
                        e.stopPropagation();
                        const row=document.getElementById(`ym-row-${g.id}`);
                        if(!row)return;
                        barResizeRef.current={id:g.id,side:"left",startX:e.clientX,origDate:g.start_date,containerW:row.clientWidth,containerLeft:row.getBoundingClientRect().left};
                        setResizingId(g.id);
                      }}>
                      <div style={{width:3,height:16,background:"rgba(255,255,255,0.5)",borderRadius:2}}/>
                    </div>

                    {/* Bar label */}
                    <div style={{flex:1,padding:"0 10px",overflow:"hidden"}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textShadow:"0 1px 3px rgba(0,0,0,0.3)",display:"block"}}>
                        {gAchieved?"🏆 ":""}{g.name}
                      </span>
                    </div>

                    {/* Right resize handle */}
                    <div
                      style={{position:"absolute",right:-4,top:0,bottom:0,width:10,cursor:"ew-resize",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center"}}
                      onMouseDown={e=>{
                        e.stopPropagation();
                        const row=document.getElementById(`ym-row-${g.id}`);
                        if(!row)return;
                        barResizeRef.current={id:g.id,side:"right",startX:e.clientX,origDate:g.end_date,containerW:row.clientWidth,containerLeft:row.getBoundingClientRect().left};
                        setResizingId(g.id);
                      }}>
                      <div style={{width:3,height:16,background:"rgba(255,255,255,0.5)",borderRadius:2}}/>
                    </div>
                  </div>
                :<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",paddingLeft:12}}>
                  <span style={{fontSize:10,color:C.t2,fontStyle:"italic",opacity:0.6}}>Вне диапазона</span>
                </div>}
            </div>
          </div>

          {/* Expanded detail */}
          {isOpen&&<div style={{borderTop:"1px solid "+C.bd,padding:"12px 16px",background:C.ib,display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:4}}>{g.name}</div>
              {g.description&&<div style={{fontSize:11,color:C.t2,marginBottom:6}}>{g.description}</div>}
              <div style={{display:"flex",gap:12,fontSize:11,color:C.t2,flexWrap:"wrap"}}>
                {g.start_date&&<span>Начало: <b style={{color:C.t1}}>{g.start_date}</b></span>}
                {g.end_date&&<span>Дедлайн: <b style={{color:C.t1}}>{g.end_date}</b></span>}
                <span>Прогресс: <b style={{color:pct>=100?C.g:pct>=50?C.y:C.r}}>{pct}%</b></span>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button onClick={()=>{setEditGoal({...g});setOpenGoalId(null);setShowForm(false);}}
                style={{padding:"6px 14px",fontSize:12,fontWeight:600,background:C.a+"14",color:C.a,border:"1px solid "+C.a+"33",borderRadius:8,cursor:"pointer"}}>Изменить</button>
              <button onClick={()=>goals.remove(g.id)}
                style={{padding:"6px 12px",fontSize:12,background:C.r+"10",color:C.r,border:"1px solid "+C.r+"22",borderRadius:8,cursor:"pointer"}}>Удалить</button>
            </div>
          </div>}
        </div>;
      })}

      {/* Today label */}
      {visibleGoals.length>0&&todayCol>=0&&<div style={{display:"flex",borderTop:"1px solid "+C.bd+"44"}}>
        <div style={{width:200,flexShrink:0}}/>
        <div style={{flex:1,position:"relative",height:18}}>
          <div style={{position:"absolute",left:`${todayCol}%`,transform:"translateX(-50%)",top:2,fontSize:9,fontWeight:700,color:"#EF4444",whiteSpace:"nowrap"}}>▲ Сегодня</div>
        </div>
      </div>}
    </div>
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
  const goalSubtasks=useTable("goal_subtasks",userId);
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
  const[editingTaskId,setEditingTaskId]=useState<string|null>(null);
  // Subtask state
  const[openSubtasks,setOpenSubtasks]=useState<string|null>(null); // task id
  const[showSTF,setShowSTF]=useState<string|null>(null); // task id
  const[stfText,setStfText]=useState("");
  // Goal drag-n-drop reorder
  const[goalDragId,setGoalDragId]=useState<string|null>(null);
  const[goalDragOver,setGoalDragOver]=useState<string|null>(null);
  const[goalOrder,setGoalOrder]=useState<string[]>([]);
  useEffect(()=>{
    const ids=goals.data.filter((g:any)=>!g.is_system_pinned).map((g:any)=>g.id);
    setGoalOrder(prev=>{
      if(prev.length===0||ids.some((id:string)=>!prev.includes(id))||prev.some((id:string)=>!ids.includes(id)))return ids;
      return prev;
    });
  },[goals.data]);
  const onGoalDragStart=(id:string)=>setGoalDragId(id);
  const onGoalDragOver=(id:string,e:React.DragEvent)=>{e.preventDefault();setGoalDragOver(id);};
  const onGoalDrop=(targetId:string)=>{
    if(!goalDragId||goalDragId===targetId){setGoalDragId(null);setGoalDragOver(null);return;}
    setGoalOrder(prev=>{
      const arr=[...prev];
      const fi=arr.indexOf(goalDragId),ti=arr.indexOf(targetId);
      if(fi<0||ti<0)return prev;
      arr.splice(fi,1);arr.splice(ti,0,goalDragId);
      return arr;
    });
    setGoalDragId(null);setGoalDragOver(null);
  };

  // Stable ref for gtf to avoid stale closures in AddTaskForm
  const gtfRef=useRef(gtf);
  gtfRef.current=gtf;

  // Edit task form — stable component, local state, no re-render on parent
  const EditTaskForm=useCallback(({task,goalId,onClose,goalTasks,TYPES}:any)=>{
    const[txt,setTxt]=useState(task.text||"");
    const[mins,setMins]=useState(task.mins||30);
    const[type,setType]=useState(task.type||"biz");
    const[date,setDate]=useState(task.date||"");
    const save=async()=>{
      if(!txt.trim())return;
      await goalTasks.update(task.id,{text:txt,mins:+mins,type,date:date||null});
      onClose();
    };
    return<div style={{padding:"12px 14px",borderRadius:10,background:"#EFF6FF",border:"2px solid "+C.a,marginBottom:6}}>
      <input autoFocus value={txt} onChange={e=>setTxt(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter")save();if(e.key==="Escape")onClose();}}
        style={{...iS(),padding:"7px 10px",fontSize:13,marginBottom:8,fontWeight:500}}/>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <div style={{display:"flex",flexDirection:"column",gap:2,flex:"0 0 75px"}}>
          <label style={{fontSize:10,color:C.t2,fontWeight:600}}>Минуты</label>
          <input type="number" value={mins} onChange={e=>setMins(+e.target.value)} min={30} max={480} step={5}
            style={{...iS(),padding:"6px 8px",fontSize:12}}/>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:2,flex:"0 0 130px"}}>
          <label style={{fontSize:10,color:C.t2,fontWeight:600}}>Дата</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{...iS(),padding:"6px 8px",fontSize:12}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={save} style={{flex:1,padding:"7px",background:C.a,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>
          ✓ Сохранить
        </button>
        <button onClick={onClose} style={{padding:"7px 14px",background:C.bg,border:"1px solid "+C.bd,borderRadius:8,fontSize:12,cursor:"pointer",color:C.t2}}>
          Отмена
        </button>
      </div>
    </div>;
  },[]);

  // Separate stable component for add-task form — avoids focus loss on re-render
  const AddTaskForm=useCallback(({goalId}:{goalId:string})=>{
    const[localText,setLocalText]=useState(gtfRef.current.text);
    const[localMins,setLocalMins]=useState(gtfRef.current.mins);
    const[localType,setLocalType]=useState(gtfRef.current.type);
    const[localDate,setLocalDate]=useState(gtfRef.current.date);
    const[localErr,setLocalErr]=useState("");
    const addLocal=async()=>{
      if(!localText.trim()){setLocalErr("Введи задачу");return;}
      if(localMins<30){setLocalErr("Минимум 30 минут");return;}
      const order=goalTasks.data.filter((t:any)=>t.goal_id===goalId).length;
      await goalTasks.add({goal_id:goalId,text:localText,mins:localMins,type:localType,date:localDate||null,done:false,status:"todo",sort_order:order});
      setShowGTF(null);
    };
    return<div style={{marginTop:8,padding:12,background:C.w,borderRadius:10,border:"1px solid "+C.bd}}>
      <input autoFocus placeholder="Название задачи" value={localText} onChange={e=>setLocalText(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter")addLocal();if(e.key==="Escape")setShowGTF(null);}}
        style={{...iS(),padding:"8px 10px",fontSize:12,marginBottom:8}}/>
      <div style={{display:"flex",gap:6,marginBottom:6}}>
        <input type="number" value={localMins} onChange={e=>setLocalMins(+e.target.value)} min={30} max={480} step={5} style={{...iS(),width:75,padding:"6px 8px",fontSize:12}}/>

        <input type="date" value={localDate} onChange={e=>setLocalDate(e.target.value)} style={{...iS(),width:130,padding:"6px 8px",fontSize:12}}/>
      </div>
      {localErr&&<div style={{fontSize:11,color:C.r,marginBottom:6}}>{localErr}</div>}
      <div style={{display:"flex",gap:6}}>
        <button onClick={addLocal} style={{flex:1,padding:"7px",background:C.a,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Добавить</button>
        <button onClick={()=>setShowGTF(null)} style={{padding:"7px 12px",background:C.bg,border:"1px solid "+C.bd,borderRadius:8,fontSize:12,cursor:"pointer"}}>Отмена</button>
      </div>
    </div>;
  },[showGTF,goalTasks,TYPES]);

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
    await goals.update(editGoalId,{name:editGoalData.name,description:editGoalData.description||null,color:editGoalData.color||C.a,start_date:editGoalData.start_date||null,end_date:editGoalData.end_date||null,deadline:editGoalData.end_date||null,...(!editGoalData.priority_manual?{priority:p}:{})});
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

  // ── Task urgency helpers ──
  const taskUrgency=(t:any):{kind:"burning"|"deferrable"|"normal",daysLeft:number|null}=>{
    if(t.status==="done"||t.done)return{kind:"normal",daysLeft:null};
    if(!t.date)return{kind:"normal",daysLeft:null};
    const diff=Math.ceil((new Date(t.date+"T23:59:59").getTime()-Date.now())/(1000*60*60*24));
    if(diff<0||diff<=1)return{kind:"burning",daysLeft:diff};
    if(diff>14&&t.status==="todo")return{kind:"deferrable",daysLeft:diff};
    return{kind:"normal",daysLeft:diff};
  };

  const goalProgress=(gid:string)=>{
    const tasks=goalTasks.data.filter((t:any)=>t.goal_id===gid&&t.type!=="delegate");
    if(!tasks.length)return 0;
    return Math.round(tasks.filter((t:any)=>t.status==="done"||t.done).length/tasks.length*100);
  };
  const prgColor=(p:number)=>p===100?"#16A34A":p>=75?"#84CC16":p>=50?C.y:p>=25?"#F97316":C.r;
  const prgGradient=(p:number)=>p===100
    ?"linear-gradient(90deg,#4ADE80,#16A34A,#4ADE80)"
    :p>=75?"linear-gradient(90deg,#BEF264,#84CC16)"
    :p>=50?"linear-gradient(90deg,#FDE68A,#EAB308)"
    :p>=25?"linear-gradient(90deg,#FED7AA,#F97316)"
    :"linear-gradient(90deg,#FCA5A5,#EF4444)";
  const prgSticker=(p:number)=>p===100?"🏆":p>=80?"🔥":p>=60?"💪":p>=40?"📈":p>=20?"🌱":"🎯";
  const prgStickerLabel=(p:number)=>p===100?"Цель достигнута!":p>=80?"Почти готово!":p>=60?"Хороший темп":p>=40?"В процессе":p>=20?"Начало положено":"Старт";

  if(!systemBlock&&goals.loading) return <div style={{padding:40,textAlign:"center",color:C.t2}}>Загрузка...</div>;

  // Confetti burst for 100% goals
  const ConfettiBurst=()=>(
    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:14,zIndex:10}}>
      {Array.from({length:18},(_,i)=>{
        const colors=["#FFD700","#FF6B6B","#4ADE80","#60A5FA","#F472B6","#A78BFA"];
        const color=colors[i%colors.length];
        const left=5+Math.random()*90;
        const delay=Math.random()*0.8;
        const dur=0.8+Math.random()*0.6;
        const size=5+Math.random()*7;
        return <div key={i} style={{
          position:"absolute",top:-10,left:`${left}%`,
          width:size,height:size,borderRadius:Math.random()>0.5?"50%":"2px",
          background:color,
          animation:`confettiFall ${dur}s ease-in ${delay}s forwards`,
        }}/>;
      })}
      <style>{`
        @keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(120px) rotate(720deg);opacity:0}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 8px 2px rgba(74,222,128,0.4)}50%{box-shadow:0 0 20px 6px rgba(74,222,128,0.7)}}
        @keyframes progressGlow{0%,100%{opacity:0.6}50%{opacity:1}}
        @keyframes stickerBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
      `}</style>
    </div>
  );

  const GoalCard=({g,isAchieved}:{g:any,isAchieved:boolean})=>{
    const p=goalProgress(g.id);
    const gTasks=[...goalTasks.data.filter((t:any)=>t.goal_id===g.id)].sort((a:any,b:any)=>(a.sort_order||0)-(b.sort_order||0));
    const isOpen=openGoal===g.id;
    const isEditing=editGoalId===g.id;
    const pr=PRIORITIES[(g.priority||"low") as keyof typeof PRIORITIES]||PRIORITIES.low;
    const{days,overdue}=calcAutoPriority(g.end_date||null);
    const isUrgent=pr.id==="urgent";
    const isPriorityMenuOpen=priorityMenu===g.id;
    const sticker=prgSticker(p);
    const doneTasks=gTasks.filter((t:any)=>t.status==="done"||t.done).length;

    const borderColor=isAchieved?"#4ADE80":(g.color||C.a);
    const cardBg=isAchieved?"linear-gradient(135deg,#F0FDF4,#DCFCE7)":C.w;

    return <div style={{background:isAchieved?"#F0FDF4":C.bg,borderRadius:14,overflow:"hidden",border:"1px solid "+(isAchieved?"#BBF7D0":C.bd),
      transition:"transform 0.2s,box-shadow 0.2s",borderLeft:`4px solid ${borderColor}`,
      position:"relative",
      boxShadow:isAchieved?"0 0 0 1px #BBF7D0, 0 4px 16px rgba(74,222,128,0.12)":"none",
      animation:isAchieved?"glowPulse 3s ease-in-out infinite":"none",
    }}>
      {isAchieved&&<ConfettiBurst/>}

      {isEditing&&<div style={{padding:"16px 18px",background:C.w,borderBottom:"1px solid "+C.bd}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Название</label><input value={editGoalData.name||""} onChange={e=>setEditGoalData({...editGoalData,name:e.target.value})} style={iS()}/></div>
          <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Начало</label><input type="date" value={editGoalData.start_date||""} onChange={e=>setEditGoalData({...editGoalData,start_date:e.target.value})} style={iS()}/></div>
          <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Конец</label><input type="date" value={editGoalData.end_date||""} onChange={e=>setEditGoalData({...editGoalData,end_date:e.target.value})} style={iS()}/></div>
          <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Цвет</label><div style={{display:"flex",gap:4,marginTop:2}}>{COLORS.map((c:string)=><button key={c} onClick={()=>setEditGoalData({...editGoalData,color:c})} style={{width:22,height:22,borderRadius:6,background:c,border:(editGoalData.color||C.a)===c?"3px solid #111":"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
          <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Описание</label><textarea value={editGoalData.description||""} onChange={e=>setEditGoalData({...editGoalData,description:e.target.value})} rows={2} style={{...iS(),resize:"none"}}/></div>
        </div>
        <div style={{display:"flex",gap:8}}><Btn onClick={saveGoalEdit}>Сохранить</Btn><Btn primary={false} onClick={()=>setEditGoalId(null)}>Отмена</Btn></div>
      </div>}

      {/* Goal header */}
      <div style={{padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:12,background:isAchieved?"transparent":C.w,cursor:"pointer"}} onClick={()=>setOpenGoal(isOpen?null:g.id)}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <span style={{fontSize:14,fontWeight:700,color:isAchieved?"#15803D":C.t1}}>{g.name}</span>
            {isAchieved&&<span style={{fontSize:10,fontWeight:700,background:"#4ADE8022",color:"#16A34A",borderRadius:20,padding:"2px 10px",border:"1px solid #4ADE8040"}}>✓ Достигнута</span>}
            {!isAchieved&&overdue&&<span style={{fontSize:10,fontWeight:700,background:C.r+"18",color:C.r,borderRadius:20,padding:"2px 8px"}}>Просрочена на {Math.abs(days||0)} дн.</span>}
            {!isAchieved&&!overdue&&days!==null&&days<=14&&<span style={{fontSize:10,color:pr.color,fontWeight:600}}>осталось {days} дн.</span>}
          </div>
          {g.start_date&&g.end_date&&<div style={{fontSize:11,color:C.t2,marginBottom:8}}>{g.start_date.substring(5)} — {g.end_date.substring(5)}</div>}

          {/* ── STYLED PROGRESS BAR ── */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {/* Sticker */}
            <div style={{fontSize:20,flexShrink:0,animation:"stickerBounce 2s ease-in-out infinite",filter:isAchieved?"drop-shadow(0 0 6px rgba(74,222,128,0.8))":"none"}}
              title={prgStickerLabel(p)}>{sticker}</div>

            {/* Bar container */}
            <div style={{flex:1,position:"relative",height:10,background:isAchieved?"#BBF7D055":"rgba(0,0,0,0.06)",borderRadius:99,overflow:"visible"}}>
              {/* Glow behind bar */}
              <div style={{position:"absolute",inset:0,borderRadius:99,background:prgGradient(p),opacity:0.25,filter:"blur(4px)",transform:"scaleY(2.5)",transformOrigin:"center"}}/>
              {/* Actual bar */}
              <div style={{
                position:"absolute",top:0,left:0,height:"100%",
                width:p+"%",borderRadius:99,
                background:prgGradient(p),
                transition:"width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow:"0 0 8px 1px "+prgColor(p)+"66",
              }}>
                {/* Shine */}
                <div style={{position:"absolute",top:1,left:4,right:8,height:3,borderRadius:99,background:"rgba(255,255,255,0.45)"}}/>
              </div>
              {/* Milestone dots */}
              {[25,50,75].map(m=>(
                <div key={m} style={{position:"absolute",top:"50%",left:m+"%",transform:"translate(-50%,-50%)",
                  width:p>=m?8:5,height:p>=m?8:5,borderRadius:"50%",
                  background:p>=m?prgColor(p):"rgba(0,0,0,0.15)",
                  border:p>=m?`2px solid white`:"none",
                  boxShadow:p>=m?"0 0 6px "+prgColor(m)+"88":"none",
                  transition:"all 0.4s",zIndex:2,
                }}/>
              ))}
            </div>

            {/* Percent badge */}
            <div style={{
              flexShrink:0,minWidth:52,textAlign:"center",
              padding:"3px 10px",borderRadius:20,
              background:isAchieved?"linear-gradient(135deg,#4ADE80,#16A34A)":prgGradient(p),
              boxShadow:"0 2px 8px "+prgColor(p)+"44",
              transition:"all 0.4s",
            }}>
              <span style={{fontSize:12,fontWeight:800,color:"#fff",textShadow:"0 1px 3px rgba(0,0,0,0.25)"}}>{p}%</span>
            </div>

            <span style={{fontSize:10,color:C.t2,whiteSpace:"nowrap",flexShrink:0}}>{doneTasks}/{gTasks.length}</span>
          </div>
        </div>

        <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}} onClick={e=>e.stopPropagation()}>
          {!isAchieved&&<div style={{position:"relative"}}>
            <button onClick={()=>setPriorityMenu(isPriorityMenuOpen?null:g.id)}
              style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,border:"1px solid "+pr.color+"33",background:pr.color+"10",cursor:"pointer",fontSize:11,fontWeight:600,color:pr.color}}>
              <span style={{animation:isUrgent?"pulse 1.5s ease-in-out infinite":"none"}}>{pr.icon}</span>
              <span>{pr.label}</span>
            </button>
            {isPriorityMenuOpen&&<div className="dropdown-menu" style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:C.w,border:"1px solid "+C.bd,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:100,minWidth:200,overflow:"hidden"}}>
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
          </div>}
          <button onClick={()=>{setEditGoalId(g.id);setEditGoalData({...g});setOpenGoal(null);}} style={{padding:"5px 10px",fontSize:12,background:C.a+"12",color:C.a,border:"1px solid "+C.a+"22",borderRadius:8,cursor:"pointer",fontWeight:500}}>Изм.</button>
          <button onClick={()=>goals.remove(g.id)} style={{width:26,height:26,fontSize:12,background:C.r+"10",color:C.r,border:"1px solid "+C.r+"22",borderRadius:8,cursor:"pointer"}}>×</button>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points={isOpen?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
        </div>
      </div>

      {/* Tasks */}
      {isOpen&&<div style={{padding:"10px 18px 14px"}}>
        {g.description&&<div style={{fontSize:12,color:C.t2,lineHeight:1.6,marginBottom:10,padding:"8px 12px",background:C.ib,borderRadius:8,borderLeft:"3px solid "+borderColor}}>{g.description}</div>}
        {gTasks.map((t:any,ti:number)=>{
          const isDone=t.status==="done"||t.done;
          const isEditing=editingTaskId===t.id;

          if(isEditing){
            return <EditTaskForm key={t.id} task={t} goalId={g.id} onClose={()=>setEditingTaskId(null)} goalTasks={goalTasks} TYPES={TYPES}/>;
          }

          const tSubtasks=goalSubtasks.data.filter((s:any)=>s.task_id===t.id).sort((a:any,b:any)=>(a.sort_order||0)-(b.sort_order||0));
          const doneSubtasks=tSubtasks.filter((s:any)=>s.done).length;
          const isStOpen=openSubtasks===t.id;
          const taskColor=t.type==="biz"?C.a:t.type==="delegate"?C.t2:C.y;
          return <div key={t.id} style={{marginBottom:6}}>
            {/* Task row */}
            <div
            style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:isStOpen?"10px 10px 0 0":10,
              background:isDone?"#F0FDF4":C.w,
              border:"1px solid "+C.bd,
              borderLeft:"3px solid "+taskColor,
              transition:"box-shadow 0.15s",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 2px 8px rgba(0,0,0,0.08)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="none";}}>
            {/* Move up/down buttons */}
            <div style={{display:"flex",flexDirection:"column",gap:1,flexShrink:0}}>
              <button onClick={async()=>{
                if(ti===0)return;
                const prev=gTasks[ti-1];
                await goalTasks.update(t.id,{sort_order:(prev.sort_order??ti-1)});
                await goalTasks.update(prev.id,{sort_order:(t.sort_order??ti)});
              }} disabled={ti===0}
                style={{width:16,height:16,border:"1px solid "+C.bd,borderRadius:3,background:C.w,cursor:ti===0?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:ti===0?0.25:0.6,padding:0}}
                title="Переместить выше">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
              </button>
              <button onClick={async()=>{
                if(ti===gTasks.length-1)return;
                const next=gTasks[ti+1];
                await goalTasks.update(t.id,{sort_order:(next.sort_order??ti+1)});
                await goalTasks.update(next.id,{sort_order:(t.sort_order??ti)});
              }} disabled={ti===gTasks.length-1}
                style={{width:16,height:16,border:"1px solid "+C.bd,borderRadius:3,background:C.w,cursor:ti===gTasks.length-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:ti===gTasks.length-1?0.25:0.6,padding:0}}
                title="Переместить ниже">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>

            {/* Checkbox */}
            <button onClick={()=>goalTasks.update(t.id,{status:nextStatus(t.status||"todo"),done:nextStatus(t.status||"todo")==="done"})}
              style={{width:18,height:18,minWidth:18,borderRadius:5,border:"2px solid "+(isDone?C.g:(t.status==="inprogress")?C.y:C.bd),background:isDone?C.g:(t.status==="inprogress")?C.y+"33":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {isDone&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              {t.status==="inprogress"&&<div style={{width:7,height:7,borderRadius:2,background:C.y}}/>}
            </button>

            {/* Text */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}>
                <span style={{fontSize:13,fontWeight:500,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:isDone?C.t2:C.t1}}>{t.text}</span>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:10,color:C.t2}}>{t.mins}м</span>
                {t.date&&<span style={{fontSize:10,color:C.t2}}>📅 {t.date.substring(5)}</span>}
                <Tag label={tsLbl(t.status||"todo")} color={tsCol(t.status||"todo")}/>
                {tSubtasks.length>0&&<span style={{fontSize:10,color:C.t2,background:C.ib,borderRadius:10,padding:"1px 7px",border:"1px solid "+C.bd}}>{doneSubtasks}/{tSubtasks.length} подзадач</span>}
              </div>
            </div>

            {/* Subtasks toggle */}
            <button onClick={()=>setOpenSubtasks(isStOpen?null:t.id)} title="Подзадачи"
              style={{width:26,height:26,borderRadius:7,border:"1px solid "+(isStOpen?taskColor+"44":C.bd),background:isStOpen?taskColor+"10":C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isStOpen?taskColor:C.t2} strokeWidth="2.5"><polyline points={isStOpen?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
            </button>

            {/* Edit button */}
            <button onClick={()=>setEditingTaskId(t.id)} title="Редактировать"
              style={{width:26,height:26,borderRadius:7,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:0.7,transition:"opacity 0.15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.opacity="1";(e.currentTarget as HTMLElement).style.borderColor=C.a;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.opacity="0.7";(e.currentTarget as HTMLElement).style.borderColor=C.bd;}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.a} strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>

            {/* Delete button */}
            <button onClick={()=>goalTasks.remove(t.id)} title="Удалить"
              style={{width:26,height:26,borderRadius:7,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:0.5,transition:"opacity 0.15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.opacity="1";(e.currentTarget as HTMLElement).style.borderColor=C.r;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.opacity="0.5";(e.currentTarget as HTMLElement).style.borderColor=C.bd;}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.r} strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </div>
            {/* Subtasks panel */}
            {isStOpen&&<div style={{borderLeft:"3px solid "+taskColor,borderRight:"1px solid "+C.bd,borderBottom:"1px solid "+C.bd,borderRadius:"0 0 10px 10px",padding:"8px 12px",background:C.ib}}>
              {tSubtasks.map((s:any)=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8,marginBottom:4,background:C.w,border:"1px solid "+C.bd}}>
                  <button onClick={()=>goalSubtasks.update(s.id,{done:!s.done})}
                    style={{width:15,height:15,minWidth:15,borderRadius:4,border:"2px solid "+(s.done?C.g:C.bd),background:s.done?C.g:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {s.done&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                  <span style={{flex:1,fontSize:12,color:s.done?C.t2:C.t1,textDecoration:s.done?"line-through":"none"}}>{s.text}</span>
                  <button onClick={()=>goalSubtasks.remove(s.id)}
                    style={{width:20,height:20,border:"none",background:"transparent",cursor:"pointer",color:C.r,fontSize:13,opacity:0.5,flexShrink:0}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.opacity="1";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.opacity="0.5";}}>×</button>
                </div>
              ))}
              {showSTF===t.id
                ?<div style={{display:"flex",gap:6,marginTop:4}}>
                  <input autoFocus placeholder="Название подзадачи" value={stfText} onChange={e=>setStfText(e.target.value)}
                    onKeyDown={async e=>{
                      if(e.key==="Enter"&&stfText.trim()){
                        await goalSubtasks.add({task_id:t.id,goal_id:g.id,text:stfText.trim(),done:false,sort_order:tSubtasks.length});
                        setStfText("");setShowSTF(null);
                      }
                      if(e.key==="Escape"){setStfText("");setShowSTF(null);}
                    }}
                    style={{...iS(),flex:1,padding:"6px 10px",fontSize:12}}/>
                  <button onClick={async()=>{
                    if(!stfText.trim())return;
                    await goalSubtasks.add({task_id:t.id,goal_id:g.id,text:stfText.trim(),done:false,sort_order:tSubtasks.length});
                    setStfText("");setShowSTF(null);
                  }} style={{padding:"6px 14px",background:C.a,color:"#fff",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600}}>+</button>
                  <button onClick={()=>{setStfText("");setShowSTF(null);}} style={{padding:"6px 10px",background:C.bg,border:"1px solid "+C.bd,borderRadius:8,fontSize:12,cursor:"pointer",color:C.t2}}>✕</button>
                </div>
                :<button onClick={()=>{setShowSTF(t.id);setStfText("");}} style={{width:"100%",padding:"5px",background:"transparent",border:"1px dashed "+C.bd,borderRadius:8,fontSize:11,color:C.t2,cursor:"pointer",marginTop:4}}>+ Подзадача</button>
              }
            </div>}
          </div>;
        })}
        {showGTF===g.id
          ? <AddTaskForm goalId={g.id}/>
          : <button onClick={()=>setShowGTF(g.id)} style={{width:"100%",padding:"8px",background:"transparent",border:"1px dashed "+C.bd,borderRadius:10,fontSize:12,color:C.t2,cursor:"pointer",marginTop:4}}>+ Задача</button>
        }
      </div>}
    </div>;
  };

  return <div className="yearmap-table" style={{background:C.w,borderRadius:20,boxShadow:"0 4px 24px rgba(0,0,0,0.07)",border:"1px solid "+C.bd,overflow:"hidden"}}>
    <style>{`
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      @keyframes burningGlow{0%,100%{box-shadow:0 0 12px rgba(239,68,68,0.18),0 0 0 1px rgba(239,68,68,0.12)}50%{box-shadow:0 0 22px rgba(239,68,68,0.32),0 0 0 1px rgba(239,68,68,0.22)}}
      @keyframes deferrableGlow{0%,100%{box-shadow:0 0 8px rgba(245,158,11,0.12)}50%{box-shadow:0 0 16px rgba(245,158,11,0.24)}}
    `}</style>
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
        <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Название *</label><input value={newGoal.name} onChange={e=>sNewGoal({...newGoal,name:e.target.value})} style={iS()} placeholder="Запустить воронку..."/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Начало</label><input type="date" value={newGoal.start_date} onChange={e=>sNewGoal({...newGoal,start_date:e.target.value})} style={iS()}/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Дедлайн</label><input type="date" value={newGoal.end_date} onChange={e=>sNewGoal({...newGoal,end_date:e.target.value})} style={iS()}/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Цвет</label><div style={{display:"flex",gap:5,marginTop:2}}>{COLORS.map((c:string)=><button key={c} onClick={()=>sNewGoal({...newGoal,color:c})} style={{width:26,height:26,borderRadius:7,background:c,border:newGoal.color===c?"3px solid #111":"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
        <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Описание</label><textarea value={newGoal.description} onChange={e=>sNewGoal({...newGoal,description:e.target.value})} rows={2} style={{...iS(),resize:"none"}}/></div>
      </div>
      <div style={{display:"flex",gap:8}}><Btn onClick={addChildGoal}>Создать</Btn><Btn primary={false} onClick={()=>setShowNewGoal(false)}>Отмена</Btn></div>
    </div>}

    {/* Goals list (active only) */}
    <div style={{padding:"16px 24px",display:"flex",flexDirection:"column",gap:16}}>
      {childGoals.filter((g:any)=>goalProgress(g.id)<100).length===0&&
        <div style={{padding:"32px 0",textAlign:"center",color:C.t2,fontSize:14}}>Создай первую цель</div>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {goalOrder.map(id=>{const g=goals.data.find((gg:any)=>gg.id===id);if(!g||goalProgress(g.id)>=100)return null;
          return <div key={g.id}
            draggable
            onDragStart={()=>onGoalDragStart(g.id)}
            onDragOver={e=>onGoalDragOver(g.id,e)}
            onDrop={()=>onGoalDrop(g.id)}
            onDragEnd={()=>{setGoalDragId(null);setGoalDragOver(null);}}
            style={{opacity:goalDragId===g.id?0.45:1,outline:goalDragOver===g.id&&goalDragId!==g.id?"2px dashed "+C.a:"none",borderRadius:14,transition:"opacity 0.15s"}}>
            <GoalCard g={g} isAchieved={false}/>
          </div>;
        })}
      </div>

      {/* ── Achieved section ── */}
      {childGoals.filter((g:any)=>goalProgress(g.id)===100).length>0&&(
        <div style={{marginTop:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:18}}>🏆</span>
            <span style={{fontSize:13,fontWeight:700,color:"#16A34A",textTransform:"uppercase",letterSpacing:0.5}}>Достигнутые</span>
            <span style={{fontSize:11,background:"#4ADE8020",color:"#16A34A",borderRadius:20,padding:"1px 8px",fontWeight:600}}>
              {childGoals.filter((g:any)=>goalProgress(g.id)===100).length}
            </span>
            <div style={{flex:1,height:1,background:"#4ADE8030"}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {childGoals.filter((g:any)=>goalProgress(g.id)===100).map((g:any)=>(
              <GoalCard key={g.id} g={g} isAchieved={true}/>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>;
}

function StrategyPage({userId}:{userId:string}){
  const kanban = useTable("kanban", userId);
  const goals = useTable("goals", userId);
  const goalTasks = useTable("goal_tasks", userId);
  const isMobile=useIsMobile();
  const[stratTab,setStratTab]=useState<"sprint"|"yearmap"|"calendar">("sprint");
  // ── Calendar state ──────────────────────────────────────────
  const calTasks=useTable("cal_tasks",userId);
  const[calMode,setCalMode]=useState<"month"|"week"|"day">("week");
  const[calDate,setCalDate]=useState(()=>new Date());
  const[calModal,setCalModal]=useState<any>(null); // null | "new" | task object
  const[calForm,setCalForm]=useState({text:"",description:"",date:"",start_time:"",end_time:""});

  // Merged tasks for calendar: calTasks + kanban (with date) + goalTasks (with date)
  const allCalTasks=useMemo(()=>{
    const cal=calTasks.data;
    // Helper: compute end_time from start_time + mins (inline parse, no dependency on timeToMin)
    const minsToEnd=(start:string,mins:number)=>{const[sh,sm]=(start||"10:00").split(":").map(Number);const e=sh*60+sm+(mins||60);return String(Math.floor(e/60)%24).padStart(2,"0")+":"+String(e%60).padStart(2,"0");};
    // Kanban tasks with date → show in calendar (height = duration in mins)
    const kb=kanban.data.filter((t:any)=>t.date).map((t:any)=>({
      ...t,_src:"kanban",
      start_time:t.start_time||"10:00",
      end_time:t.end_time||minsToEnd(t.start_time||"10:00",t.mins||60),
      auto_placed:!t.start_time,
    }));
    // Goal tasks with date (height = duration in mins)
    const gt=goalTasks.data.filter((t:any)=>t.date).map((t:any)=>({
      ...t,_src:"goal",
      start_time:t.start_time||"10:00",
      end_time:t.end_time||minsToEnd(t.start_time||"10:00",t.mins||60),
      auto_placed:!t.start_time,
    }));
    return[...cal,...kb,...gt];
  },[calTasks.data,kanban.data,goalTasks.data]);

  // Smart free-slot finder: finds first free 1h slot 10:00–18:00
  const findFreeSlot=(dateStr:string)=>{
    const busy=allCalTasks.filter((t:any)=>t.date===dateStr||t.start_date===dateStr);
    for(let h=10;h<18;h++){
      const slotStart=h*60,slotEnd=slotStart+60;
      const conflict=busy.some((t:any)=>{
        const ts=timeToMin(t.start_time||"10:00"),te=timeToMin(t.end_time||"11:00");
        return ts<slotEnd&&te>slotStart;
      });
      if(!conflict)return{start:`${String(h).padStart(2,"0")}:00`,end:`${String(h+1).padStart(2,"0")}:00`};
    }
    return{start:"10:00",end:"11:00"}; // fallback overlap
  };

  const openCalNew=(dateStr?:string,hour?:number)=>{
    const d=dateStr||today();
    if(hour!==undefined){
      setCalForm({text:"",description:"",date:d,start_time:`${String(hour).padStart(2,"0")}:00`,end_time:`${String(hour+1).padStart(2,"0")}:00`});
    } else {
      const slot=findFreeSlot(d);
      setCalForm({text:"",description:"",date:d,start_time:slot.start,end_time:slot.end});
    }
    setCalModal("new");
  };

  const saveCalTask=async()=>{
    if(!calForm.text.trim())return;
    const dateStr=calForm.date||today();
    const hasTime=!!(calForm.start_time&&calForm.end_time);
    const slot=hasTime?{start:calForm.start_time,end:calForm.end_time}:findFreeSlot(dateStr);
    const payload={
      text:calForm.text.trim(),
      description:calForm.description||"",
      date:dateStr,
      start_time:slot.start,
      end_time:slot.end,
      auto_placed:!hasTime,
      manually_placed:hasTime,
      status:"todo",
      done:false,
    };
    if(calModal==="new"){
      await calTasks.add(payload);
    } else if(calModal&&typeof calModal==="object"&&!calModal._src){
      // Only edit native cal_tasks, not kanban/goal
      await calTasks.update(calModal.id,{...payload,auto_placed:false,manually_placed:true});
    }
    setCalModal(null);
    setCalForm({text:"",description:"",date:"",start_time:"",end_time:""});
  };

  const navCal=(dir:number)=>{
    setCalDate(d=>{
      const nd=new Date(d);
      if(calMode==="day")nd.setDate(nd.getDate()+dir);
      else if(calMode==="week")nd.setDate(nd.getDate()+dir*7);
      else nd.setMonth(nd.getMonth()+dir);
      return nd;
    });
  };

  const calTitle=()=>{
    const MN=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    if(calMode==="month")return`${MN[calDate.getMonth()]} ${calDate.getFullYear()}`;
    if(calMode==="day"){const d=calDate;return`${d.getDate()} ${MN[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;}
    const sow=new Date(calDate);const dow=sow.getDay()===0?6:sow.getDay()-1;sow.setDate(sow.getDate()-dow);
    const eow=new Date(sow);eow.setDate(sow.getDate()+6);
    return`${sow.getDate()} ${MN[sow.getMonth()].slice(0,3)} — ${eow.getDate()} ${MN[eow.getMonth()].slice(0,3)} ${eow.getFullYear()}`;
  };

  // Calendar helpers
  const SLOT_H=56; // px per hour
  const CAL_START=7; // 07:00 (main visible start)
  const CAL_HOURS=17; // 07:00–24:00
  const CAL_EARLY=7;  // 00:00–07:00 (collapsible)
  const[calShowEarly,setCalShowEarly]=useState(false);
  const timeToMin=(t:string)=>{const[h,m]=(t||"00:00").split(":").map(Number);return h*60+m;};
  const minToTime=(m:number)=>`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
  const fmtDur=(mins:number)=>mins>=60?`${Math.floor(mins/60)}ч${mins%60?` ${mins%60}м`:""}`:` ${mins}м`;

  // Drag/resize refs — mounted once, no stale closure
  const calDragRef=useRef<any>(null);
  const calResizeRef=useRef<any>(null);
  const calDropRef=useRef<{dateStr:string;min:number}|null>(null);
  const allCalRef=useRef<any[]>([]);
  const[dragTaskId,setDragTaskId]=useState<string|null>(null);
  const[dropPreview,setDropPreview]=useState<{dateStr:string;min:number}|null>(null);
  const[resizing,setResizing]=useState(false);

  useEffect(()=>{allCalRef.current=allCalTasks;},[allCalTasks]);

  const doMoveTask=useCallback(async(id:string,dateStr:string,startMin:number,dur:number)=>{
    const t=allCalRef.current.find((x:any)=>x.id===id);
    if(!t)return;
    const s=minToTime(Math.max(CAL_START*60,startMin));
    const e=minToTime(Math.min((CAL_START+CAL_HOURS)*60,startMin+Math.max(30,dur)));
    if(t._src==="kanban")await kanban.update(id,{date:dateStr,start_time:s,end_time:e});
    else if(t._src==="goal")await goalTasks.update(id,{date:dateStr,start_time:s,end_time:e});
    else await calTasks.update(id,{date:dateStr,start_time:s,end_time:e,manually_placed:true,auto_placed:false});
  },[kanban,goalTasks,calTasks]);

  const doResizeTask=useCallback(async(id:string,startMin:number,endMin:number)=>{
    const t=allCalRef.current.find((x:any)=>x.id===id);
    if(!t)return;
    const e=minToTime(Math.max(startMin+15,Math.min((CAL_START+CAL_HOURS)*60,Math.round(endMin/15)*15)));
    if(t._src==="kanban")await kanban.update(id,{end_time:e});
    else if(t._src==="goal")await goalTasks.update(id,{end_time:e});
    else await calTasks.update(id,{end_time:e,manually_placed:true});
  },[kanban,goalTasks,calTasks]);

  useEffect(()=>{
    const onMove=(e:MouseEvent)=>{
      if(calDragRef.current){
        const{dur,origDate,colW,gridLeft,gridTop,days}=calDragRef.current;
        const relY=e.clientY-gridTop-48;
        const rawMin=Math.round(((relY/SLOT_H)*60+CAL_START*60)/15)*15;
        const startMin=Math.max(CAL_START*60,Math.min((CAL_START+CAL_HOURS-1)*60,rawMin));
        const relX=e.clientX-gridLeft-52;
        const colIdx=Math.max(0,Math.min(days.length-1,Math.floor(relX/colW)));
        const dateStr=days[colIdx]||origDate;
        calDropRef.current={dateStr,min:startMin};
        setDropPreview({dateStr,min:startMin});
        const el=document.getElementById(`ct-${calDragRef.current.id}`);
        if(el){el.style.top=Math.max(0,(startMin-CAL_START*60)/60*SLOT_H)+"px";el.style.opacity="0.4";el.style.pointerEvents="none";}
      }
      if(calResizeRef.current){
        const{id,startMin}=calResizeRef.current;
        const grid=document.getElementById("cal-grid-inner");
        if(!grid)return;
        const rect=grid.getBoundingClientRect();
        const relY=e.clientY-rect.top-48;
        const rawMin=Math.round(((relY/SLOT_H)*60+CAL_START*60)/15)*15;
        const endMin=Math.max(startMin+15,Math.min((CAL_START+CAL_HOURS)*60,rawMin));
        calResizeRef.current.endMin=endMin;
        setResizing(true);
        const el=document.getElementById(`ct-${id}`);
        if(el){
          el.style.height=Math.max(20,(endMin-startMin)/60*SLOT_H-2)+"px";
          const lbl=el.querySelector(".ct-lbl") as HTMLElement;
          if(lbl)lbl.textContent=`${minToTime(startMin)}–${minToTime(endMin)} · ${fmtDur(endMin-startMin)}`;
        }
      }
    };
    const onUp=async()=>{
      if(calDragRef.current){
        const{id,dur}=calDragRef.current;
        const el=document.getElementById(`ct-${id}`);
        if(el){el.style.opacity="1";el.style.pointerEvents="";el.style.top="";}
        if(calDropRef.current)await doMoveTask(id,calDropRef.current.dateStr,calDropRef.current.min,dur);
        calDragRef.current=null;calDropRef.current=null;
        setDragTaskId(null);setDropPreview(null);
      }
      if(calResizeRef.current){
        const{id,startMin,endMin}=calResizeRef.current;
        if(endMin)await doResizeTask(id,startMin,endMin);
        calResizeRef.current=null;setResizing(false);
      }
    };
    window.addEventListener("mousemove",onMove,{passive:true});
    window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[doMoveTask,doResizeTask]);
  const[showTF,setShowTF]=useState<string|null>(null);
  const[tf,sTf]=useState({text:"",mins:30,type:"biz"});
  const[tfErr,setTfErr]=useState("");
  const[recurModal,setRecurModal]=useState<{dayStr:string}|null>(null);
  const[recurForm,setRecurForm]=useState({text:"",mins:30,type:"biz",from:"",to:"",freq:"daily"});
  const[recurErr,setRecurErr]=useState("");
  const[recurLoading,setRecurLoading]=useState(false);
  const[showGF,setShowGF]=useState(false);
  const[gf,sGf]=useState({name:"",deadline:"",color:C.a});
  const[openGoal,setOpenGoal]=useState<string|null>(null);
  const[showGTF,setShowGTF]=useState<string|null>(null);
  const[gtf,sGtf]=useState({text:"",mins:30,type:"biz",date:""});
  const[scroll,setScroll]=useState(7);
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

  const days=useMemo(()=>{const d=[];for(let i=-7;i<14;i++){const dt=new Date();dt.setDate(dt.getDate()+i);d.push(ds(dt));}return d;},[]);
  const td=today();
  // scroll=7 puts today first
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

  const addRecurringTask=async()=>{
    setRecurErr("");
    if(!recurForm.text.trim()){setRecurErr("Введи название задачи");return;}
    if(!recurForm.from||!recurForm.to){setRecurErr("Укажи период");return;}
    if(recurForm.from>recurForm.to){setRecurErr("Дата начала позже конца");return;}
    setRecurLoading(true);
    const from=new Date(recurForm.from+"T00:00:00");
    const to=new Date(recurForm.to+"T00:00:00");
    const dates:string[]=[];
    const cur=new Date(from);
    while(cur<=to){
      const d=cur.getFullYear()+"-"+String(cur.getMonth()+1).padStart(2,"0")+"-"+String(cur.getDate()).padStart(2,"0");
      dates.push(d);
      if(recurForm.freq==="daily")cur.setDate(cur.getDate()+1);
      else if(recurForm.freq==="weekdays"){cur.setDate(cur.getDate()+1);while(cur.getDay()===0||cur.getDay()===6)cur.setDate(cur.getDate()+1);}
      else if(recurForm.freq==="weekly")cur.setDate(cur.getDate()+7);
    }
    await Promise.all(dates.map((d,i)=>kanban.add({text:recurForm.text,mins:recurForm.mins,type:recurForm.type,date:d,done:false,status:"todo",sort_order:kanban.data.filter((t:any)=>t.date===d).length+i,recurring:true})));
    setRecurLoading(false);
    setRecurModal(null);
    setRecurForm({text:"",mins:30,type:"biz",from:"",to:"",freq:"daily"});
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

  // ── TimeGrid (Week/Day view) ────────────────────────────────
  const TimeGrid=({days}:{days:string[]})=>{
    const tdStr=today();
    const nowMin=new Date().getHours()*60+new Date().getMinutes();
    const nowTop=((nowMin-CAL_START*60)/60)*SLOT_H;
    const tasksOnDay=(d:string)=>allCalTasks.filter((t:any)=>(t.date||t.start_date)===d);

    return<div id="cal-grid-outer" style={{display:"flex",flexDirection:"column",background:C.w,borderRadius:16,border:"1px solid "+C.bd,overflow:"hidden",userSelect:"none"}}>
      {/* Early hours toggle */}
      <button onClick={()=>setCalShowEarly(v=>!v)}
        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"6px 0",background:calShowEarly?"rgba(37,99,235,0.04)":C.bg,border:"none",borderBottom:"1px solid "+C.bd,cursor:"pointer",fontSize:11,color:C.t2,fontWeight:600,transition:"background 0.2s"}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={calShowEarly?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
        {calShowEarly?"Скрыть 00:00 – 07:00":"Показать 00:00 – 07:00"}
      </button>
      {/* Early hours (00–07) */}
      {calShowEarly&&<div id="cal-grid-early" style={{display:"flex",borderBottom:"2px solid "+C.bd,background:"rgba(0,0,0,0.015)"}}>
        <div style={{width:52,flexShrink:0,borderRight:"1px solid "+C.bd}}>
          {Array.from({length:CAL_EARLY},(_,i)=>i).map(h=>(
            <div key={h} style={{height:SLOT_H,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:8,paddingTop:2}}>
              <span style={{fontSize:10,color:C.t2}}>{String(h).padStart(2,"0")}:00</span>
            </div>
          ))}
        </div>
        <div style={{flex:1,display:"grid",gridTemplateColumns:`repeat(${days.length},1fr)`}}>
          {days.map((dateStr)=>{
            const earlyTasks=allCalTasks.filter((t:any)=>(t.date||t.start_date)===dateStr&&timeToMin(t.start_time||"10:00")<CAL_EARLY*60);
            return<div key={dateStr} style={{borderRight:"1px solid "+C.bd,position:"relative",height:CAL_EARLY*SLOT_H}}>
              {Array.from({length:CAL_EARLY},(_,i)=>(
                <div key={i} onClick={()=>!dragTaskId&&!resizing&&openCalNew(dateStr,i)}
                  style={{height:SLOT_H,borderBottom:"1px solid rgba(0,0,0,0.04)",cursor:"pointer"}}
                  onMouseEnter={e=>{if(!dragTaskId&&!resizing)(e.currentTarget as HTMLElement).style.background="rgba(37,99,235,0.03)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}/>
              ))}
              {earlyTasks.map((t:any,ti:number)=>{
                const st=timeToMin(t.start_time||"00:00");
                const et=timeToMin(t.end_time||"01:00");
                const topPx=Math.max(0,st/60*SLOT_H);
                const heightPx=Math.max(20,(et-st)/60*SLOT_H-2);
                const isDone=t.status==="done"||t.done;
                const color=isDone?"#22C55E":(t._src==="goal"?(goals.data.find((g:any)=>g.id===t.goal_id)?.color||C.a):typeColor(t.type||"biz"));
                return<div key={t.id} style={{position:"absolute",top:topPx,left:"2px",width:"94%",height:heightPx,background:color+"14",border:"1.5px solid "+color+"40",borderLeft:"3px solid "+color,borderRadius:7,padding:"3px 6px 3px 8px",overflow:"hidden",zIndex:ti+2,fontSize:10,color:color}}>
                  {t.text||t.title}
                </div>;
              })}
            </div>;
          })}
        </div>
      </div>}
      <div id="cal-grid-inner" style={{display:"flex"}}>
      {/* Time gutter */}
      <div style={{width:52,flexShrink:0,borderRight:"1px solid "+C.bd,paddingTop:48}}>
        {Array.from({length:CAL_HOURS},(_,i)=>i+CAL_START).map(h=>(
          <div key={h} style={{height:SLOT_H,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:8,paddingTop:2}}>
            <span style={{fontSize:10,color:C.t2}}>{h===24||h%24===0?"00":String(h).padStart(2,"0")}:00</span>
          </div>
        ))}
      </div>
      {/* Columns */}
      <div style={{flex:1,display:"grid",gridTemplateColumns:`repeat(${days.length},1fr)`}}>
        {days.map((dateStr,colIdx)=>{
          const isToday=dateStr===tdStr;
          const dt=new Date(dateStr+"T12:00:00");
          const dayTasks=tasksOnDay(dateStr);
          const isDrop=dropPreview?.dateStr===dateStr;
          return<div key={dateStr} style={{borderRight:"1px solid "+C.bd,position:"relative",background:isDrop?"rgba(37,99,235,0.02)":"transparent"}}>
            {/* Header */}
            <div style={{height:48,borderBottom:"1px solid "+C.bd,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"sticky",top:0,zIndex:5,background:isToday?"rgba(37,99,235,0.04)":C.w}}>
              <span style={{fontSize:10,color:isToday?C.a:C.t2,fontWeight:600,textTransform:"uppercase"}}>
                {["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][dt.getDay()]}
              </span>
              <div style={{width:28,height:28,borderRadius:"50%",background:isToday?C.a:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:14,fontWeight:700,color:isToday?"#fff":C.t1}}>{dt.getDate()}</span>
              </div>
            </div>
            {/* Hour slots */}
            <div style={{position:"relative",height:CAL_HOURS*SLOT_H}}>
              {Array.from({length:CAL_HOURS},(_,i)=>(
                <div key={i} onClick={()=>!dragTaskId&&!resizing&&openCalNew(dateStr,i+CAL_START)}
                  style={{height:SLOT_H,borderBottom:"1px solid rgba(0,0,0,0.04)",cursor:"pointer"}}
                  onMouseEnter={e=>{if(!dragTaskId&&!resizing)(e.currentTarget as HTMLElement).style.background="rgba(37,99,235,0.03)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}/>
              ))}
              {/* Drop preview line */}
              {isDrop&&dropPreview&&<div style={{position:"absolute",left:4,right:4,top:(dropPreview.min-CAL_START*60)/60*SLOT_H,height:2,background:C.a,borderRadius:2,zIndex:20,pointerEvents:"none",boxShadow:"0 0 8px "+C.a+"60"}}/>}
              {/* Now line */}
              {isToday&&nowTop>0&&nowTop<CAL_HOURS*SLOT_H&&(
                <div style={{position:"absolute",left:0,right:0,top:nowTop,zIndex:4,display:"flex",alignItems:"center",pointerEvents:"none"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:C.r,marginLeft:-4,flexShrink:0}}/>
                  <div style={{flex:1,height:2,background:C.r}}/>
                </div>
              )}
              {/* Task blocks */}
              {dayTasks.map((t:any,ti:number)=>{
                const st=timeToMin(t.start_time||"09:00");
                const et=timeToMin(t.end_time||"10:00");
                const topPx=Math.max(0,(st-CAL_START*60)/60*SLOT_H);
                const heightPx=Math.max(24,(et-st)/60*SLOT_H-2);
                const isDone=t.status==="done"||t.done;
                const isAuto=t.auto_placed&&!t.manually_placed;
                const color=isDone?"#22C55E":(t._src==="goal"?(goals.data.find((g:any)=>g.id===t.goal_id)?.color||C.a):typeColor(t.type||"biz"));
                const dur=et-st;
                // Overlap offset
                const prev=dayTasks.filter((_:any,j:number)=>j<ti&&timeToMin(dayTasks[j].start_time||"09:00")<et&&timeToMin(dayTasks[j].end_time||"10:00")>st);
                const off=prev.length;

                return<div key={t.id} id={`ct-${t.id}`}
                  style={{
                    position:"absolute",
                    top:topPx,left:off?(off*10)+"px":"2px",
                    width:off?"calc(90% - "+(off*10)+"px)":"94%",
                    height:heightPx,
                    background:isDone?"rgba(34,197,94,0.08)":color+"14",
                    border:isAuto?"1.5px dashed "+color+"55":"1.5px solid "+color+"40",
                    borderLeft:`3px solid ${color}`,
                    borderRadius:7,padding:"4px 6px 4px 8px",
                    cursor:"grab",overflow:"hidden",zIndex:ti+2,
                    opacity:dragTaskId===t.id?0.4:1,
                    transition:"box-shadow 0.15s",
                    boxShadow:isDone?"0 0 8px rgba(34,197,94,0.12)":"0 1px 3px rgba(0,0,0,0.07)",
                  }}
                  onMouseDown={e=>{
                    if((e.target as HTMLElement).classList.contains("cal-resize"))return;
                    if(e.button!==0)return;
                    e.preventDefault();
                    const grid=document.getElementById("cal-grid-inner");
                    if(!grid)return;
                    const rect=grid.getBoundingClientRect();
                    const colW=(rect.width-52)/days.length;
                    calDragRef.current={id:t.id,dur,origDate:dateStr,colW,gridLeft:rect.left,gridTop:rect.top,days};
                    setDragTaskId(t.id);
                  }}
                  onClick={e=>{if(!dragTaskId&&Math.abs(e.movementX)<3)setCalModal(t);}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 2px 14px "+color+"40";(e.currentTarget as HTMLElement).style.zIndex="50";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow=isDone?"0 0 8px rgba(34,197,94,0.12)":"0 1px 3px rgba(0,0,0,0.07)";(e.currentTarget as HTMLElement).style.zIndex=String(ti+2);}}>
                  {/* Checkbox */}
                  <div style={{display:"flex",alignItems:"flex-start",gap:5}}>
                    <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();
                      const done=!(t.status==="done"||t.done);
                      if(t._src==="kanban")kanban.update(t.id,{status:done?"done":"todo",done});
                      else if(t._src==="goal")goalTasks.update(t.id,{status:done?"done":"todo",done});
                      else calTasks.update(t.id,{status:done?"done":"todo",done});}}
                      style={{width:13,height:13,minWidth:13,borderRadius:3,border:"1.5px solid "+(isDone?"#22C55E":color),background:isDone?"#22C55E":"transparent",cursor:"pointer",marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                      {isDone&&<svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                    <div style={{flex:1,fontSize:11,fontWeight:700,color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:isDone?"line-through":"none",lineHeight:1.3}}>{t.text}</div>
                  </div>
                  {heightPx>32&&<div className="ct-lbl" style={{fontSize:9,color:color+"bb",paddingLeft:18,marginTop:2}}>{t.start_time}–{t.end_time} · {fmtDur(dur)}</div>}
                  {isAuto&&heightPx>44&&<div style={{fontSize:9,color:C.y,paddingLeft:18,fontStyle:"italic"}}>⚡ незапланировано</div>}
                  {/* Resize handle */}
                  <div className="cal-resize"
                    onMouseDown={e=>{e.stopPropagation();e.preventDefault();calResizeRef.current={id:t.id,startMin:st,endMin:et};setResizing(true);}}
                    style={{position:"absolute",bottom:0,left:0,right:0,height:10,cursor:"ns-resize",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{width:24,height:3,borderRadius:99,background:color+"50"}}/>
                  </div>
                </div>;
              })}
            </div>
          </div>;
        })}
      </div>
    </div></div>;
  };

  // ── CalendarView ──────────────────────────────────────────
  const CalendarView=()=>{
    const tdStr=today();
    if(calMode==="month"){
      const y=calDate.getFullYear(),m=calDate.getMonth();
      const firstDow=new Date(y,m,1).getDay();
      const offset=firstDow===0?6:firstDow-1;
      const daysInMonth=new Date(y,m+1,0).getDate();
      const cells:string[]=[];
      for(let i=0;i<offset;i++)cells.push("");
      for(let d=1;d<=daysInMonth;d++)cells.push(`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
      while(cells.length%7)cells.push("");
      return<div style={{background:C.w,borderRadius:16,border:"1px solid "+C.bd,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:C.ib,borderBottom:"1px solid "+C.bd}}>
          {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d=><div key={d} style={{textAlign:"center",padding:"10px 0",fontSize:11,fontWeight:700,color:C.t2}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {cells.map((d,i)=>{
            if(!d)return<div key={i} style={{minHeight:90,borderRight:"1px solid "+C.bd+"44",borderBottom:"1px solid "+C.bd+"44",background:C.ib,opacity:0.4}}/>;
            const dayT=allCalTasks.filter((t:any)=>(t.date||t.start_date)===d);
            const isToday=d===tdStr;
            return<div key={d} onClick={()=>openCalNew(d)}
              style={{minHeight:90,borderRight:"1px solid "+C.bd+"44",borderBottom:"1px solid "+C.bd+"44",padding:"6px 4px",cursor:"pointer",background:isToday?"rgba(37,99,235,0.03)":"transparent",transition:"background 0.1s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=isToday?"rgba(37,99,235,0.06)":C.ib;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=isToday?"rgba(37,99,235,0.03)":"transparent";}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:3}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:isToday?C.a:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?"#fff":C.t1}}>{parseInt(d.split("-")[2])}</span>
                </div>
              </div>
              {dayT.slice(0,3).map((t:any)=>{
                const isDone=t.status==="done"||t.done;
                const isAuto=t.auto_placed&&!t.manually_placed;
                const color=isDone?"#22C55E":(t._src==="goal"?(goals.data.find((g:any)=>g.id===t.goal_id)?.color||C.a):typeColor(t.type||"biz"));
                return<div key={t.id} onClick={e=>{e.stopPropagation();setCalModal(t);}}
                  style={{fontSize:10,padding:"2px 5px",borderRadius:4,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    background:isDone?"rgba(34,197,94,0.08)":color+"14",color,
                    border:isAuto?"1px dashed "+color+"40":"1px solid "+color+"25",
                    borderLeft:`2px solid ${color}`,textDecoration:isDone?"line-through":"none"}}>
                  {t.start_time&&<span style={{opacity:0.6,fontSize:9}}>{t.start_time} </span>}{t.text}
                </div>;
              })}
              {dayT.length>3&&<div style={{fontSize:9,color:C.t2,paddingLeft:4,cursor:"pointer"}}
                onClick={e=>{e.stopPropagation();setCalMode("day");setCalDate(new Date(d+"T12:00:00"));}}>
                +{dayT.length-3} ещё
              </div>}
            </div>;
          })}
        </div>
      </div>;
    }
    if(calMode==="week"){
      const sow=new Date(calDate);
      const dow=sow.getDay()===0?6:sow.getDay()-1;
      sow.setDate(sow.getDate()-dow);
      const days=Array.from({length:7},(_,i)=>{const d=new Date(sow);d.setDate(sow.getDate()+i);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;});
      return<div style={{overflowX:"auto"}}><div style={{minWidth:560}}><TimeGrid days={days}/></div></div>;
    }
    const d=calDate;
    const dStr=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    return<TimeGrid days={[dStr]}/>;
  };

  // ── Calendar modal ─────────────────────────────────────────
  const CalModal=()=>{
    if(!calModal)return null;
    const isNew=calModal==="new";
    const isView=!isNew&&typeof calModal==="object"&&!calModal._editing;
    const t=isView?calModal:null;
    const isDone=t&&(t.status==="done"||t.done);

    if(isView&&t){
      const color=isDone?"#22C55E":(t._src==="goal"?(goals.data.find((g:any)=>g.id===t.goal_id)?.color||C.a):typeColor(t.type||"biz"));
      return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setCalModal(null)}>
        <div style={{background:C.w,borderRadius:18,padding:28,width:"100%",maxWidth:420,border:"1px solid "+C.bd,boxShadow:"0 24px 60px rgba(0,0,0,0.35)"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:12,height:12,borderRadius:3,background:color,flexShrink:0}}/>
            <div style={{fontSize:17,fontWeight:700,color:C.t1,flex:1}}>{t.text}</div>
            <button onClick={()=>setCalModal(null)} style={{width:28,height:28,border:"1px solid "+C.bd,borderRadius:8,background:C.ib,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2}}>✕</button>
          </div>
          {t.description&&<div style={{fontSize:13,color:C.t2,marginBottom:12,lineHeight:1.6}}>{t.description}</div>}
          <div style={{display:"flex",gap:12,fontSize:12,color:C.t2,marginBottom:20,flexWrap:"wrap"}}>
            {(t.date||t.start_date)&&<span>{"📅 "+(t.date||t.start_date)}</span>}
            {t.start_time&&<span>{"🕐 "+t.start_time+"–"+t.end_time}</span>}
            {t._src==="kanban"&&<span>📋 Спринт</span>}
            {t._src==="goal"&&<span>🎯 Цель</span>}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setCalModal({...t,_editing:true})}
              style={{flex:1,padding:"9px",background:C.a+"14",color:C.a,border:"1px solid "+C.a+"30",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>
              {"✏️ Редактировать"}
            </button>
            {!t._src&&<button onClick={()=>{calTasks.remove(t.id);setCalModal(null);}}
              style={{padding:"9px 16px",background:C.r+"10",color:C.r,border:"1px solid "+C.r+"25",borderRadius:10,fontSize:13,cursor:"pointer"}}>
              {"🗑"}
            </button>}
          </div>
        </div>
      </div>;
    }

    return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setCalModal(null)}>
      <div style={{background:C.w,borderRadius:18,padding:28,width:"100%",maxWidth:460,border:"1px solid "+C.bd,boxShadow:"0 24px 60px rgba(0,0,0,0.35)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:17,fontWeight:700,color:C.t1,marginBottom:20}}>{isNew?"Новая задача":"Редактировать"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4}}>{"Название *"}</label>
            <input autoFocus value={calForm.text}
              onChange={e=>setCalForm(f=>({...f,text:e.target.value}))}
              onKeyDown={e=>{if(e.key==="Enter")saveCalTask();}}
              placeholder="Название задачи" style={{...iS(),fontSize:13}}/>
          </div>
          <div>
            <label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4}}>Описание</label>
            <textarea value={calForm.description}
              onChange={e=>setCalForm(f=>({...f,description:e.target.value}))}
              rows={2} placeholder="Опционально"
              style={{...iS(),fontSize:13,resize:"vertical" as const}}/>
          </div>
          <div>
            <label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4}}>Дата</label>
            <input type="date" value={calForm.date}
              onChange={e=>setCalForm(f=>({...f,date:e.target.value}))}
              style={{...iS(),fontSize:13}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4}}>Начало</label>
              <input type="time" value={calForm.start_time}
                onChange={e=>setCalForm(f=>({...f,start_time:e.target.value}))}
                style={{...iS(),fontSize:13}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4}}>Конец</label>
              <input type="time" value={calForm.end_time}
                onChange={e=>setCalForm(f=>({...f,end_time:e.target.value}))}
                style={{...iS(),fontSize:13}}/>
            </div>
          </div>
          <div style={{fontSize:10,color:C.t2}}>Пусто = автоматическое размещение 10:00–18:00</div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
          <button onClick={()=>setCalModal(null)}
            style={{padding:"9px 16px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:10,fontSize:13,cursor:"pointer"}}>
            Отмена
          </button>
          <button onClick={saveCalTask}
            style={{padding:"9px 22px",background:C.a,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 0 16px "+C.a+"40"}}>
            {isNew?"Создать":"Сохранить"}
          </button>
        </div>
      </div>
    </div>;
  };


  // init calForm when modal opens for edit
  useEffect(()=>{
    if(!calModal||calModal==="new")return;
    if(typeof calModal==="object"){
      setCalForm({
        text:calModal.text||"",
        description:calModal.description||"",
        date:calModal.date||calModal.start_date||today(),
        start_time:calModal.start_time||"",
        end_time:calModal.end_time||"",
      });
    }
  },[calModal]);

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

  // ── Task urgency (shared in StrategyPage) ──
  const taskUrgency=(t:any):{kind:"burning"|"deferrable"|"normal",daysLeft:number|null}=>{
    if(t.status==="done"||t.done)return{kind:"normal",daysLeft:null};
    if(!t.date)return{kind:"normal",daysLeft:null};
    const diff=Math.ceil((new Date(t.date+"T23:59:59").getTime()-Date.now())/(1000*60*60*24));
    if(diff<0||diff<=1)return{kind:"burning",daysLeft:diff};
    if(diff>14&&t.status==="todo")return{kind:"deferrable",daysLeft:diff};
    return{kind:"normal",daysLeft:diff};
  };
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
  const maxScroll=isMobile?days.length-1:days.length-4;

  const TaskItem=({t,showDate=false,dayStr}:{t:any,showDate?:boolean,dayStr?:string})=>{
    const status=t.status||"todo";
    const statusColor=tsCol(status);
    const isDone=status==="done";
    const isKanbanOver=kanbanOver===t.id;
    const isKanbanDragging=kanbanDrag===t.id;
    const canDrag=!t.fromGoal&&dayStr;
    if(editingTask===t.id){
      return <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",borderRadius:8,background:C.bg,borderLeft:"3px solid "+typeColor(t.type)}}>
        <input autoFocus value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEdit(t);if(e.key==="Escape")setEditingTask(null);}} style={{...iS(),padding:"4px 8px",fontSize:12,flex:1}}/>
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
        background:isDone?"#F0FDF4":C.bg,
        borderLeft:"3px solid "+typeColor(t.type),
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
        <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
          <span style={{fontSize:12,fontWeight:500,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</span>
        </div>
        <div style={{display:"flex",gap:6,marginTop:2}}><span style={{fontSize:10,color:C.t2}}>{t.mins}м</span>{t.fromGoal&&<span style={{fontSize:10,color:t.goalColor}}>★</span>}{showDate&&t.date&&<span style={{fontSize:10,color:taskUrgency(t).kind==="burning"?"#EF4444":C.t2,fontWeight:taskUrgency(t).kind==="burning"?700:400}}>{t.date.substring(5)}</span>}</div>
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

  // ── Vizzy AI EA Chat state ──
  const[vizzyOpen,setVizzyOpen]=useState(false);
  const[vizzyMessages,setVizzyMessages]=useState<{role:"user"|"assistant",text:string}[]>([
    {role:"assistant",text:"Привет! Я Vizzy AI — твой Executive Assistant. Помогу с задачами, стратегией и планированием. Что нужно?"}
  ]);
  const[vizzyInput,setVizzyInput]=useState("");
  const[vizzyLoading,setVizzyLoading]=useState(false);
  const vizzyBottomRef=useRef<HTMLDivElement>(null);
  const VIZZY_ACCENT="#A78BFA";

  const buildContext=()=>{
    if(stratTab==="sprint"){
      const taskList=kanban.data.map((t:any)=>`- ${t.text} (${tsLbl(t.status||"todo")}, ${t.mins}мин, ${t.date})`).join("\n");
      return`[Контекст: Текущий спринт]\n${taskList||"Задач нет"}`;
    }
    if(stratTab==="yearmap"){
      const goalList=goals.data.map((g:any)=>{
        const gTasks=goalTasks.data.filter((t:any)=>t.goal_id===g.id);
        return`Цель: ${g.name}\n  Задачи: ${gTasks.map((t:any)=>t.text).join(", ")||"нет"}`;
      }).join("\n");
      return`[Контекст: Карта года]\n${goalList||"Целей нет"}`;
    }
    return"";
  };

  const sendVizzy=async()=>{
    const txt=vizzyInput.trim();
    if(!txt||vizzyLoading)return;
    const ctx=buildContext();
    const userMsg={role:"user" as const,text:txt};
    setVizzyMessages(prev=>[...prev,userMsg]);
    setVizzyInput("");
    setVizzyLoading(true);
    const history=vizzyMessages.slice(-8).map(m=>({role:m.role,content:m.text}));
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          system:`Ты — Vizzy AI, строгий Executive Assistant. Отвечай чётко и по делу. Без воды. Используй короткие абзацы. Контекст платформы пользователя:\n${ctx}`,
          messages:[...history,{role:"user",content:txt}]
        })});
      const data=await res.json();
      const reply=data.content?.[0]?.text||"Нет ответа";
      setVizzyMessages(prev=>[...prev,{role:"assistant",text:reply}]);
    }catch{
      setVizzyMessages(prev=>[...prev,{role:"assistant",text:"Ошибка соединения. Попробуй ещё раз."}]);
    }
    setVizzyLoading(false);
  };

  useEffect(()=>{
    if(vizzyBottomRef.current)vizzyBottomRef.current.scrollIntoView({behavior:"smooth"});
  },[vizzyMessages]);

  return <>
    {/* Vizzy AI toggle tab */}
    <div onClick={()=>setVizzyOpen(!vizzyOpen)} style={{position:"fixed",right:vizzyOpen?376:0,top:"40%",transform:"translateY(-50%)",background:`linear-gradient(135deg,${VIZZY_ACCENT},#7C3AED)`,width:32,height:120,borderRadius:"12px 0 0 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"-4px 0 20px rgba(167,139,250,0.35)",zIndex:110,transition:"right 0.3s ease"}}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      <div style={{writingMode:"vertical-rl",textOrientation:"mixed",transform:"rotate(180deg)",fontSize:10,fontWeight:700,color:"#fff",letterSpacing:1}}>VIZZY AI</div>
    </div>

    {/* Vizzy AI EA Chat panel */}
    <div style={{position:"fixed",right:0,top:0,bottom:0,width:376,background:"#12101E",borderLeft:"1px solid rgba(167,139,250,0.18)",transform:vizzyOpen?"translateX(0)":"translateX(100%)",transition:"transform 0.3s ease",zIndex:105,display:"flex",flexDirection:"column",fontFamily:"'Inter',sans-serif"}}>

      {/* Header */}
      <div style={{padding:"16px 18px",borderBottom:"1px solid rgba(167,139,250,0.15)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(167,139,250,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#A78BFA,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",lineHeight:1.2}}>Vizzy AI</div>
            <div style={{fontSize:10,color:"rgba(167,139,250,0.7)",display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#10B981"}}/>
              Executive Assistant · {stratTab==="sprint"?"Спринт":"Карта года"}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setVizzyMessages([{role:"assistant",text:"История очищена. Чем могу помочь?"}])}
            title="Очистить чат"
            style={{width:28,height:28,borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
          <button onClick={()=>setVizzyOpen(false)} style={{width:28,height:28,borderRadius:7,border:"none",background:"rgba(255,255,255,0.07)",cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
      </div>

      {/* Quick action chips */}
      <div style={{padding:"8px 14px",borderBottom:"1px solid rgba(167,139,250,0.1)",display:"flex",gap:6,flexWrap:"wrap",flexShrink:0}}>
        {["Проанализируй задачи","Найди слабые места","Что делать дальше?","Оптимизируй план"].map(q=>(
          <button key={q} onClick={()=>{setVizzyInput(q);}}
            style={{padding:"4px 10px",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:20,fontSize:10,color:VIZZY_ACCENT,cursor:"pointer",fontWeight:500,whiteSpace:"nowrap"}}>
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
        {vizzyMessages.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",gap:3}}>
            {m.role==="assistant"&&(
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                <div style={{width:18,height:18,borderRadius:5,background:"linear-gradient(135deg,#A78BFA,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <span style={{fontSize:10,color:"rgba(167,139,250,0.6)",fontWeight:600}}>Vizzy AI</span>
              </div>
            )}
            <div style={{
              maxWidth:"88%",padding:"10px 13px",borderRadius:m.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",
              background:m.role==="user"?"linear-gradient(135deg,#A78BFA,#7C3AED)":"rgba(255,255,255,0.06)",
              border:m.role==="user"?"none":"1px solid rgba(255,255,255,0.08)",
              fontSize:13,color:m.role==="user"?"#fff":"rgba(255,255,255,0.88)",
              lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word",
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {vizzyLoading&&(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0"}}>
            <div style={{width:18,height:18,borderRadius:5,background:"linear-gradient(135deg,#A78BFA,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <div style={{display:"flex",gap:4}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:VIZZY_ACCENT,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={vizzyBottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"10px 14px",borderTop:"1px solid rgba(167,139,250,0.15)",background:"rgba(0,0,0,0.2)",flexShrink:0}}>
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea value={vizzyInput} onChange={e=>setVizzyInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendVizzy();}}}
            placeholder="Напиши вопрос... (Enter — отправить)"
            rows={1}
            style={{flex:1,border:"1px solid rgba(167,139,250,0.25)",outline:"none",resize:"none",fontSize:13,fontFamily:"'Inter',sans-serif",color:"#fff",background:"rgba(255,255,255,0.05)",lineHeight:1.5,maxHeight:100,overflowY:"auto",borderRadius:10,padding:"9px 12px",transition:"all 0.2s"}}
            onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,100)+"px";}}
          />
          <button onClick={sendVizzy} disabled={!vizzyInput.trim()||vizzyLoading}
            style={{width:36,height:36,borderRadius:9,border:"none",background:vizzyInput.trim()&&!vizzyLoading?"linear-gradient(135deg,#A78BFA,#7C3AED)":"rgba(255,255,255,0.08)",cursor:vizzyInput.trim()&&!vizzyLoading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>

    {/* Main content shifts when panel is open */}
    <div style={{marginRight:vizzyOpen?376:0,transition:"margin-right 0.3s ease"}}>

    {/* Tabs */}
    <div style={{display:"inline-flex",background:C.bg,borderRadius:12,padding:3,gap:2,marginBottom:24,border:"1px solid "+C.bd}}>
      <button style={tabStyle(stratTab==="sprint")} onClick={()=>setStratTab("sprint")}>Текущий спринт</button>
      <button style={tabStyle(stratTab==="yearmap")} onClick={()=>setStratTab("yearmap")}>Карта года</button>
      <button style={tabStyle(stratTab==="calendar")} onClick={()=>setStratTab("calendar")}>Календарь задач</button>
    </div>
    {stratTab==="yearmap"&&<YearMap userId={userId} goals={goals} goalUpdate={goals.update} goalAdd={goals.add} goalTasks={goalTasks}/>}

    {/* CALENDAR */}
    {stratTab==="calendar"&&<>
      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>navCal(-1)} style={{width:34,height:34,borderRadius:9,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={()=>navCal(1)} style={{width:34,height:34,borderRadius:9,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <span style={{fontSize:16,fontWeight:700,color:C.t1,minWidth:220}}>{calTitle()}</span>
          <button onClick={()=>setCalDate(new Date())}
            style={{padding:"6px 14px",background:C.a+"14",color:C.a,border:"1px solid "+C.a+"30",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            Сегодня
          </button>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{display:"flex",background:C.ib,borderRadius:9,padding:3,border:"1px solid "+C.bd,gap:2}}>
            {(["month","week","day"] as const).map(m=>(
              <button key={m} onClick={()=>setCalMode(m)}
                style={{padding:"6px 14px",borderRadius:7,border:"none",background:calMode===m?C.w:"transparent",color:calMode===m?C.t1:C.t2,fontSize:12,fontWeight:calMode===m?600:400,cursor:"pointer",boxShadow:calMode===m?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}}>
                {m==="month"?"Месяц":m==="week"?"Неделя":"День"}
              </button>
            ))}
          </div>
          <button onClick={()=>openCalNew()}
            style={{padding:"8px 18px",background:C.a,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 0 16px "+C.a+"30"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            + Задача
          </button>
        </div>
      </div>
      {/* Auto-placed banner */}

      <div style={{overflowY:"auto",maxHeight:"calc(100vh - 280px)"}}>
        <CalendarView/>
      </div>
      <CalModal/>
    </>}
    {stratTab==="sprint"&&<>
      {kanbanErrToast&&<div style={{position:"fixed",bottom:isMobile?72:24,left:"50%",transform:"translateX(-50%)",background:C.r,color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:500,zIndex:1000,boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>Не удалось сохранить порядок. Попробуйте ещё раз</div>}
      {/* Kanban */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:isMobile?16:18,fontWeight:700}}>Задачи на {isMobile?"день":"7 дней"}</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {isMobile&&<span style={{fontSize:12,color:C.t2,marginRight:4}}>{scroll+1} / 7</span>}
            <button onClick={()=>setScroll(Math.max(0,scroll-1))} disabled={scroll===0} style={{width:36,height:36,borderRadius:10,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:scroll===0?0.3:1}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
            <button onClick={()=>setScroll(7)} title="Сегодня" style={{height:36,padding:"0 10px",borderRadius:10,border:"1px solid "+C.bd,background:scroll===7?C.a+"15":C.w,cursor:"pointer",fontSize:11,color:scroll===7?C.a:C.t2,fontWeight:600}}>Сегодня</button>
            <button onClick={()=>setScroll(Math.min(maxScroll,scroll+1))} disabled={scroll>=maxScroll} style={{width:36,height:36,borderRadius:10,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:scroll>=maxScroll?0.3:1}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
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
                  <input placeholder="Задача" value={tf.text} onChange={e=>sTf({...tf,text:e.target.value})} style={{...iS(),padding:"8px 10px",fontSize:12,marginBottom:6}}/>
                  <div style={{display:"flex",gap:6,marginBottom:6}}>
                    <input type="number" value={tf.mins} onChange={e=>sTf({...tf,mins:+e.target.value})} min={15} max={480} step={15} style={{...iS(),padding:"6px 8px",fontSize:12,flex:1}} placeholder="Минут"/>
                  </div>
                  {tfErr&&<div style={{fontSize:11,color:C.r,marginBottom:4}}>{tfErr}</div>}
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>addTask(d)} style={{flex:1,padding:"6px",background:C.a,color:"#fff",border:"none",borderRadius:6,fontSize:12,cursor:"pointer"}}>+</button>
                    <button onClick={()=>{setShowTF(null);setRecurModal({dayStr:d});setRecurForm(f=>({...f,from:d,to:d}));}} title="Повторять задачу"
                      style={{padding:"6px 10px",background:"#7C3AED10",border:"1px solid #7C3AED30",borderRadius:6,fontSize:12,cursor:"pointer",color:"#7C3AED",fontWeight:600}}>🔁</button>
                    <button onClick={()=>setShowTF(null)} style={{padding:"6px 10px",background:C.bg,border:"1px solid "+C.bd,borderRadius:6,fontSize:12,cursor:"pointer"}}>×</button>
                  </div>
                </div>:<div style={{display:"flex",gap:6,marginTop:6}}>
                  <button onClick={()=>setShowTF(d)} style={{flex:1,padding:"6px",background:C.bg,border:"1px dashed "+C.bd,borderRadius:8,fontSize:12,color:C.t2,cursor:"pointer"}}>+ Задача</button>
                  <button onClick={()=>{setRecurModal({dayStr:d});setRecurForm(f=>({...f,from:d,to:d}));}} title="Повторять задачу"
                    style={{padding:"6px 10px",background:"#7C3AED10",border:"1px dashed #7C3AED40",borderRadius:8,fontSize:12,color:"#7C3AED",cursor:"pointer"}}>🔁</button>
                </div>}
              </div>
              {(()=>{
                const nonDel=st.tasks.filter((t:any)=>t.type!=="delegate");
                const done=nonDel.filter((t:any)=>t.status==="done"||t.done).length;
                const total=nonDel.length;
                const pct=total>0?Math.round(done/total*100):0;
                const allDone=total>0&&done===total;
                const barColor=pct===100?"#16A34A":pct>=60?"#22C55E":pct>=30?"#F59E0B":"#EF4444";
                const gradient=pct===100?"linear-gradient(90deg,#4ADE80,#16A34A)":pct>=60?"linear-gradient(90deg,#86EFAC,#22C55E)":pct>=30?"linear-gradient(90deg,#FDE68A,#F59E0B)":"linear-gradient(90deg,#FCA5A5,#EF4444)";
                if(total===0)return null;
                return <div style={{padding:"10px 14px",borderTop:"1px solid "+C.bd,background:allDone?"#F0FDF4":C.w,transition:"background 0.4s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18,flexShrink:0,transition:"all 0.4s"}} title={allDone?"Всё выполнено!":pct>0?"В процессе":"Не начато"}>
                      {allDone?"🏆":pct>=60?"💪":pct>=30?"😐":"😔"}
                    </span>
                    <div style={{flex:1,position:"relative",height:8,background:"rgba(0,0,0,0.06)",borderRadius:99,overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,height:"100%",width:pct+"%",background:gradient,borderRadius:99,transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:"0 0 6px "+barColor+"66"}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:barColor,flexShrink:0,minWidth:32,textAlign:"right",transition:"color 0.4s"}}>{done}/{total}</span>
                  </div>
                </div>;
              })()}
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

    {/* Recurring task modal */}
    {recurModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}} onClick={()=>setRecurModal(null)}>
      <div style={{width:"min(480px,100%)",background:C.w,borderRadius:20,overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.25)",border:"1px solid "+C.bd}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:"18px 22px",background:"linear-gradient(135deg,#7C3AED,#4F8EF7)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>🔁 Повторяющаяся задача</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>Создаст задачу на каждый день периода</div>
          </div>
          <button onClick={()=>setRecurModal(null)} style={{width:30,height:30,borderRadius:10,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",cursor:"pointer",color:"#fff",fontSize:18}}>×</button>
        </div>
        {/* Body */}
        <div style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:11,color:C.t2,fontWeight:600,display:"block",marginBottom:5}}>Название задачи *</label>
            <input value={recurForm.text} onChange={e=>setRecurForm({...recurForm,text:e.target.value})}
              placeholder="Публиковать видео в Instagram"
              style={{...iS(),padding:"10px 12px",fontSize:14}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:11,color:C.t2,fontWeight:600,display:"block",marginBottom:5}}>Начало *</label>
              <input type="date" value={recurForm.from} onChange={e=>setRecurForm({...recurForm,from:e.target.value})} style={{...iS(),padding:"9px 10px",fontSize:13}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:C.t2,fontWeight:600,display:"block",marginBottom:5}}>Конец *</label>
              <input type="date" value={recurForm.to} onChange={e=>setRecurForm({...recurForm,to:e.target.value})} style={{...iS(),padding:"9px 10px",fontSize:13}}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,color:C.t2,fontWeight:600,display:"block",marginBottom:5}}>Длительность (мин)</label>
            <input type="number" value={recurForm.mins} onChange={e=>setRecurForm({...recurForm,mins:+e.target.value})} min={15} max={480} step={15} style={{...iS(),padding:"9px 10px",fontSize:13}}/>
          </div>
          {/* Frequency selector */}
          <div>
            <label style={{fontSize:11,color:C.t2,fontWeight:600,display:"block",marginBottom:8}}>Частота повтора</label>
            <div style={{display:"flex",gap:8}}>
              {([["daily","Каждый день"],["weekdays","Будни"],["weekly","Раз в неделю"]] as [string,string][]).map(([val,lbl])=>(
                <button key={val} onClick={()=>setRecurForm({...recurForm,freq:val})}
                  style={{flex:1,padding:"8px 4px",borderRadius:10,border:"1px solid "+(recurForm.freq===val?"#7C3AED":""+C.bd),background:recurForm.freq===val?"#7C3AED10":"transparent",color:recurForm.freq===val?"#7C3AED":C.t2,fontSize:12,fontWeight:recurForm.freq===val?700:400,cursor:"pointer",transition:"all 0.15s"}}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          {/* Preview */}
          {recurForm.from&&recurForm.to&&recurForm.from<=recurForm.to&&(()=>{
            const from=new Date(recurForm.from+"T00:00:00");
            const to=new Date(recurForm.to+"T00:00:00");
            let count=0;const cur=new Date(from);
            while(cur<=to&&count<200){
              if(recurForm.freq==="weekdays"&&(cur.getDay()===0||cur.getDay()===6)){cur.setDate(cur.getDate()+1);continue;}
              count++;
              if(recurForm.freq==="daily"||recurForm.freq==="weekdays")cur.setDate(cur.getDate()+1);
              else cur.setDate(cur.getDate()+7);
            }
            return <div style={{padding:"10px 14px",background:"#7C3AED10",borderRadius:10,border:"1px solid #7C3AED20",fontSize:12,color:"#7C3AED",fontWeight:500}}>
              Будет создано <b>{count}</b> {count===1?"задача":count<5?"задачи":"задач"} · {recurForm.mins} мин каждая
            </div>;
          })()}
          {recurErr&&<div style={{fontSize:12,color:C.r,background:C.r+"10",padding:"8px 12px",borderRadius:8}}>{recurErr}</div>}
        </div>
        {/* Footer */}
        <div style={{padding:"14px 22px",borderTop:"1px solid "+C.bd,display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={()=>setRecurModal(null)} style={{padding:"10px 18px",background:C.bg,border:"1px solid "+C.bd,borderRadius:10,fontSize:13,cursor:"pointer",color:C.t2}}>Отмена</button>
          <button onClick={addRecurringTask} disabled={recurLoading}
            style={{padding:"10px 20px",background:recurLoading?"#9CA3AF":"linear-gradient(135deg,#7C3AED,#4F8EF7)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:recurLoading?"default":"pointer",display:"flex",alignItems:"center",gap:8}}>
            {recurLoading?<><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/> Создаю...</>:"🔁 Запустить повтор"}
          </button>
        </div>
      </div>
    </div>}

    </div>
  </>;
}

/* ============ CRM ============ */
const CRM_DEFAULT_STAGES=[
  {id:"new",label:"Новый",color:"#007AFF"},
  {id:"contact",label:"Взаимодействовали",color:"#AF52DE"},
  {id:"call",label:"Созвон",color:"#FF9500"},
  {id:"closed",label:"Закрыт",color:"#34C759"},
  {id:"rejected",label:"Отказ",color:"#FF3B30"},
];
const FUNNEL_COLORS=["#007AFF","#AF52DE","#FF9500","#34C759","#FF2D55","#5AC8FA","#FF3B30","#4CD964"];

function CrmPage({userId}:{userId:string}){
  const isMobile=useIsMobile();

  // Funnels stored in Supabase
  const funnels=useTable("crm_funnels",userId);

  // All leads across all funnels
  const allLeads=useTable("leads",userId);

  // Active funnel state — persisted in localStorage
  const[activeFunnelId,setActiveFunnelId]=useState<string|null>(()=>{
    try{return localStorage.getItem("ff_active_funnel_"+userId)||null;}catch{return null;}
  });

  // UI state
  const[screen,setScreen]=useState<"list"|"funnel">(()=>activeFunnelId?"funnel":"list");
  const[tab,setTab]=useState<"kanban"|"list">("kanban");
  const[search,setSearch]=useState("");
  const[show,setShow]=useState(false);
  const[dragId,setDragId]=useState<string|null>(null);
  const[dragOver,setDragOver]=useState<string|null>(null);
  const[openLead,setOpenLead]=useState<string|null>(null);
  const[expandedNote,setExpandedNote]=useState<string|null>(null);
  const[workPanelLead,setWorkPanelLead]=useState<any|null>(null);
  const[workPanelTab,setWorkPanelTab]=useState<"profile"|"touches">("profile");
  const[touchGenLoading,setTouchGenLoading]=useState(false);
  const[touchGenResult,setTouchGenResult]=useState<string>("");
  const[touchGenGoal,setTouchGenGoal]=useState("");
  const[editStageId,setEditStageId]=useState<string|null>(null);

  // Funnel modals
  const[newFunnelModal,setNewFunnelModal]=useState(false);
  const[newFunnelName,setNewFunnelName]=useState("");
  const[newFunnelDesc,setNewFunnelDesc]=useState("");
  const[newFunnelColor,setNewFunnelColor]=useState(FUNNEL_COLORS[0]);
  const[deleteFunnelId,setDeleteFunnelId]=useState<string|null>(null);
  const[editFunnelId,setEditFunnelId]=useState<string|null>(null);
  const[editFunnelName,setEditFunnelName]=useState("");

  // Lead form
  const emptyLead={name:"",contact:"",phone:"",email:"",source:"Instagram",status:"new",note:"",deal:"",avatar_url:"",pains:"",desires:"",objections:"",leverage:"",next_step:"",ai_report:""};
  const[f,sF]=useState<any>(emptyLead);
  const[avatarUpl,setAvatarUpl]=useState<string|null>(null); // uploading lead id or "new"

  // Touch templates / follow-up messages (stored locally per user)
  const touchStorageKey=`ff_crm_touchpoints_${userId}`;
  const[touchModalLeadId,setTouchModalLeadId]=useState<string|null>(null);
  const[openTouchItemId,setOpenTouchItemId]=useState<string|null>(null);
  const[touchSavedLeadId,setTouchSavedLeadId]=useState<string|null>(null);
  const[touchesByLead,setTouchesByLead]=useState<Record<string,any[]>>(()=>{
    try{return JSON.parse(localStorage.getItem(touchStorageKey)||"{}");}catch{return {};}
  });
  useEffect(()=>{
    try{localStorage.setItem(touchStorageKey,JSON.stringify(touchesByLead));}catch{}
  },[touchStorageKey,touchesByLead]);

  const uploadLeadAvatar=async(file:File,leadId:string|"new")=>{
    setAvatarUpl(leadId);
    try{
      const img=document.createElement("img");
      const obj=URL.createObjectURL(file);
      await new Promise<void>(res=>{img.onload=()=>res();img.src=obj;});
      const SIZE=200;
      const scale=Math.min(1,SIZE/Math.min(img.naturalWidth,img.naturalHeight));
      const w=Math.round(img.naturalWidth*scale);
      const h=Math.round(img.naturalHeight*scale);
      const canvas=document.createElement("canvas");
      // Crop to square from center
      const side=Math.min(w,h);
      canvas.width=side; canvas.height=side;
      const ctx=canvas.getContext("2d")!;
      ctx.drawImage(img,(w-side)/2*-1,(h-side)/2*-1,w,h);
      URL.revokeObjectURL(obj);
      const blob=await new Promise<Blob>((res,rej)=>canvas.toBlob(b=>b?res(b):rej(),"image/jpeg",0.88));
      const path=userId+"/lead_avatar_"+Date.now()+".jpg";
      const{error}=await supabase.storage.from("files").upload(path,blob,{upsert:true,contentType:"image/jpeg"});
      if(error)throw error;
      const{data}=supabase.storage.from("files").getPublicUrl(path);
      const url=data.publicUrl;
      if(leadId==="new"){
        sF((p:any)=>({...p,avatar_url:url}));
      } else {
        await allLeads.update(leadId,{avatar_url:url});
        setEditLeadData((p:any)=>({...p,avatar_url:url}));
      }
    }catch(e){console.error("avatar upload",e);}
    finally{setAvatarUpl(null);}
  };

  // Dynamic stages per funnel — stored in localStorage
  const stagesKey=(fid:string)=>"ff_crm_stages_"+userId+"_"+fid;
  const[funnelStages,setFunnelStages]=useState<Record<string,any[]>>(()=>{
    try{
      const obj:Record<string,any[]>={};
      // we'll load per-funnel lazily
      return obj;
    }catch{return {};}
  });
  const getStages=(funnelId:string):any[]=>{
    if(funnelStages[funnelId])return funnelStages[funnelId];
    try{
      const stored=localStorage.getItem(stagesKey(funnelId));
      if(stored)return JSON.parse(stored);
    }catch{}
    return CRM_DEFAULT_STAGES.map(s=>({...s}));
  };
  const saveStages=(funnelId:string,stages:any[])=>{
    setFunnelStages(p=>({...p,[funnelId]:stages}));
    try{localStorage.setItem(stagesKey(funnelId),JSON.stringify(stages));}catch{}
  };
  const stages=activeFunnelId?getStages(activeFunnelId):CRM_DEFAULT_STAGES;

  // Stage drag-n-drop
  const[stageDragId,setStageDragId]=useState<string|null>(null);
  const[stageDragOver,setStageDragOver]=useState<string|null>(null);
  const onStageDragStart=(id:string)=>setStageDragId(id);
  const onStageDragOver=(id:string,e:React.DragEvent)=>{e.preventDefault();setStageDragOver(id);};
  const onStageDrop=(targetId:string)=>{
    if(!stageDragId||!activeFunnelId||stageDragId===targetId){setStageDragId(null);setStageDragOver(null);return;}
    const arr=[...stages];
    const fi=arr.findIndex(s=>s.id===stageDragId);
    const ti=arr.findIndex(s=>s.id===targetId);
    if(fi<0||ti<0)return;
    const[moved]=arr.splice(fi,1);arr.splice(ti,0,moved);
    saveStages(activeFunnelId,arr);
    setStageDragId(null);setStageDragOver(null);
  };

  // Add new stage
  const addStage=()=>{
    if(!activeFunnelId)return;
    const id="stage_"+Date.now();
    const color=FUNNEL_COLORS[stages.length%FUNNEL_COLORS.length];
    const newStages=[...stages,{id,label:"Новый этап",color}];
    saveStages(activeFunnelId,newStages);
    setEditStageId(id);
  };

  // Delete stage
  const deleteStage=(stageId:string)=>{
    if(!activeFunnelId)return;
    const newStages=stages.filter(s=>s.id!==stageId);
    saveStages(activeFunnelId,newStages);
  };

  // Edit stage label
  const updateStageLabel=(stageId:string,label:string)=>{
    if(!activeFunnelId)return;
    const newStages=stages.map(s=>s.id===stageId?{...s,label}:s);
    saveStages(activeFunnelId,newStages);
  };

  // Edit stage color
  const updateStageColor=(stageId:string,color:string)=>{
    if(!activeFunnelId)return;
    const newStages=stages.map(s=>s.id===stageId?{...s,color}:s);
    saveStages(activeFunnelId,newStages);
  };

  const activeFunnel=funnels.data.find((fu:any)=>fu.id===activeFunnelId)||null;
  // Stage labels per funnel (legacy — keep for compat)
  const[stageLabels,setStageLabels]=useState<Record<string,Record<string,string>>>({});

  // Leads for the active funnel
  const leads=useMemo(()=>allLeads.data.filter((l:any)=>l.funnel_id===activeFunnelId),[allLeads.data,activeFunnelId]);

  const found=useMemo(()=>{
    if(!search)return leads;
    const q=search.toLowerCase();
    return leads.filter((l:any)=>l.name?.toLowerCase().includes(q)||(l.contact||"").toLowerCase().includes(q)||(l.phone||"").includes(q)||(l.email||"").toLowerCase().includes(q));
  },[leads,search]);


  const localIsoDate=(d=new Date())=>{
    const tz=d.getTimezoneOffset()*60000;
    return new Date(d.getTime()-tz).toISOString().slice(0,10);
  };

  const createDefaultTouchRows=()=>[1,2,3].map(i=>({
    id:`touch_${Date.now()}_${i}_${Math.random().toString(36).slice(2,6)}`,
    message:"",date:"",time:"",sent:false
  }));

  const ensureTouchRows=(leadId:string)=>{
    const current=touchesByLead[leadId]||[];
    if(current.length>0)return current;
    const base=createDefaultTouchRows();
    setTouchesByLead(prev=>({...prev,[leadId]:base}));
    return base;
  };

  const openTouchModal=(leadId:string)=>{
    const rows=ensureTouchRows(leadId);
    setTouchModalLeadId(leadId);
    setOpenTouchItemId(rows[0]?.id||null);
  };

  const closeTouchModal=()=>{
    setTouchModalLeadId(null);
    setOpenTouchItemId(null);
  };

  const updateTouch=(leadId:string,touchId:string,patch:any)=>{
    setTouchesByLead(prev=>({
      ...prev,
      [leadId]:(prev[leadId]||[]).map((item:any)=>item.id===touchId?{...item,...patch}:item)
    }));
  };

  const addTouchRow=(leadId:string)=>{
    setTouchesByLead(prev=>({
      ...prev,
      [leadId]:[...(prev[leadId]||[]),{id:`touch_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,message:"",date:"",time:"",sent:false}]
    }));
  };

  const removeTouchRow=(leadId:string,touchId:string)=>{
    setTouchesByLead(prev=>({
      ...prev,
      [leadId]:(prev[leadId]||[]).filter((item:any)=>item.id!==touchId)
    }));
  };

  const saveTouchRows=(leadId:string)=>{
    setTouchSavedLeadId(leadId);
    window.setTimeout(()=>setTouchSavedLeadId(prev=>prev===leadId?null:prev),1500);
  };

  const todayTouchAgenda=useMemo(()=>{
    const today=localIsoDate();
    return leads.flatMap((lead:any)=>((touchesByLead[lead.id]||[]) as any[])
      .filter((touch:any)=>String(touch.message||"").trim() && touch.date && !touch.sent && touch.date<=today)
      .map((touch:any,idx:number)=>({
        lead,
        touch,
        touchIndex: idx+1,
        overdue: touch.date<today
      })))
      .sort((a:any,b:any)=>`${a.touch.date||""} ${a.touch.time||"99:99"}`.localeCompare(`${b.touch.date||""} ${b.touch.time||"99:99"}`));
  },[leads,touchesByLead]);

  const touchModalLead=useMemo(()=>leads.find((lead:any)=>lead.id===touchModalLeadId)||null,[leads,touchModalLeadId]);
  const touchModalRows=touchModalLeadId?(touchesByLead[touchModalLeadId]||[]):[];

  const openFunnel=(id:string)=>{
    setActiveFunnelId(id);
    try{localStorage.setItem("ff_active_funnel_"+userId,id);}catch{}
    setScreen("funnel");
  };

  const backToList=()=>{
    setScreen("list");
    setActiveFunnelId(null);
    try{localStorage.removeItem("ff_active_funnel_"+userId);}catch{}
  };

  const createFunnel=async()=>{
    if(!newFunnelName.trim())return;
    try{
      const inserted=await funnels.add({name:newFunnelName.trim(),description:newFunnelDesc.trim(),color:newFunnelColor});
      setNewFunnelModal(false);
      setNewFunnelName("");setNewFunnelDesc("");setNewFunnelColor(FUNNEL_COLORS[0]);
      if(inserted?.id)openFunnel(inserted.id);
    }catch(e:any){
      alert("Ошибка создания воронки: "+e.message+"\n\nПроверь что таблица crm_funnels создана в Supabase.");
    }
  };

  const deleteFunnel=async()=>{
    if(!deleteFunnelId)return;
    // Remove all leads in this funnel
    const fLeads=allLeads.data.filter((l:any)=>l.funnel_id===deleteFunnelId);
    await Promise.all(fLeads.map((l:any)=>allLeads.remove(l.id)));
    await funnels.remove(deleteFunnelId);
    setDeleteFunnelId(null);
    if(activeFunnelId===deleteFunnelId)backToList();
  };

  const sub=async()=>{
    if(!f.name.trim()||!activeFunnelId)return;
    await allLeads.add({...f,deal:f.deal?+f.deal:null,funnel_id:activeFunnelId});
    sF(emptyLead);setShow(false);
  };

  const totalD=leads.filter((l:any)=>l.status==="closed"&&l.deal).reduce((s:number,l:any)=>s+(l.deal||0),0);

  const onDragStart=(id:string,e:React.DragEvent)=>{setDragId(id);e.dataTransfer.effectAllowed="move";};
  const onDragOver=(stageId:string,e:React.DragEvent)=>{e.preventDefault();e.dataTransfer.dropEffect="move";setDragOver(stageId);};
  const onDrop=(stageId:string)=>{if(dragId)allLeads.update(dragId,{status:stageId});setDragId(null);setDragOver(null);};
  const onDragEnd=()=>{setDragId(null);setDragOver(null);};

  const stCol=(id:string)=>stages.find(s=>s.id===id)?.color||C.t2;
  const stLbl=(id:string)=>stages.find(s=>s.id===id)?.label||id;

  const{dark:isDark}=useTheme();

  const tabSt=(active:boolean):React.CSSProperties=>({
    flex:1,padding:"8px 0",border:"none",borderRadius:8,
    background:active?(isDark?"rgba(79,142,247,0.15)":"#fff"):"transparent",
    color:active?(isDark?"#4F8EF7":C.t1):C.t2,
    fontSize:13,fontWeight:active?600:400,cursor:"pointer",
    boxShadow:active?(isDark?`0 0 16px rgba(79,142,247,0.2)`:"0 1px 4px rgba(0,0,0,0.12)"):"none",
    transition:"all 0.2s",
    borderBottom:active?(isDark?"2px solid #4F8EF7":"2px solid transparent"):"2px solid transparent",
  });

  // Edit lead state
  const[editLeadId,setEditLeadId]=useState<string|null>(null);
  const[editLeadData,setEditLeadData]=useState<any>({});
  const[deleteConfirmId,setDeleteConfirmId]=useState<string|null>(null);

  const openEditLead=(l:any)=>{
    setEditLeadId(l.id);
    setEditLeadData({name:l.name||"",contact:l.contact||"",phone:l.phone||"",email:l.email||"",note:l.note||"",deal:l.deal||"",source:l.source||"Instagram",avatar_url:l.avatar_url||"",pains:l.pains||"",desires:l.desires||"",objections:l.objections||"",leverage:l.leverage||"",next_step:l.next_step||"",ai_report:l.ai_report||""});
  };

  const[aiReportLoading,setAiReportLoading]=useState<string|null>(null);
  const[crmToast,setCrmToast]=useState<string|null>(null);
  const showCrmToast=(msg:string,ms=5000)=>{setCrmToast(msg);setTimeout(()=>setCrmToast(null),ms);};

  const generateAiReport=async(l:any)=>{
    setAiReportLoading(l.id);
    try{
      const prompt="Ты — аналитик продаж, поведенческий психолог и стратег по работе с клиентами.\nНа основе всей информации о лиде составь краткий, но глубокий отчёт для CRM. Не пересказывай информацию. Анализируй её.\n\nДанные лида:\nИмя: "+(l.name||"—")+"\nКонтакт: "+(l.contact||"—")+"\nИсточник: "+(l.source||"—")+"\nСумма сделки: "+(l.deal?""+l.deal+" ₽":"—")+"\nОписание: "+(l.note||"—")+"\nБоли: "+(l.pains||"—")+"\nЖелания: "+(l.desires||"—")+"\nВозражения: "+(l.objections||"—")+"\nРычаги давления: "+(l.leverage||"—")+"\nСледующий шаг: "+(l.next_step||"—")+"\n\nСтруктура отчёта (строго придерживайся):\n\n##ПОРТРЕТ##\nКто этот человек. Чем занимается. На каком этапе находится. Что им движет на самом деле.\n\n##ЭМОЦИИ##\nЧто он думает о себе. Что он думает о своём бизнесе. Что он думает о нас.\n\n##ВЕРОЯТНОСТЬ##\nВероятность покупки: X%\nПочему купит: ...\nПочему не купит: ...\nКлючевые факторы: ...\n\n##РИСКИ##\n1. ...\n2. ...\n3. ...\n\n##ШАГИ##\nШаг 1: [название] — [объяснение почему]\nШаг 2: [название] — [объяснение почему]\nШаг 3: [название] — [объяснение почему]\n\nПиши по-русски, коротко и аналитично. Только сам отчёт, без вступлений.";
      const resp=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
      const data=await resp.json();
      const text=data.choices?.[0]?.message?.content||data.content?.[0]?.text||"";
      if(text){
        await allLeads.update(l.id,{ai_report:text});
        showCrmToast("Отчёт сформирован. Если не появился — перезагрузите страницу.");
      }
    }catch(e){console.error(e);showCrmToast("Ошибка при формировании отчёта.");}
    setAiReportLoading(null);
  };

  const generateTouchpoint=async(l:any)=>{
    if(!l.ai_report){setTouchGenResult("__no_report__");return;}
    setTouchGenLoading(true);setTouchGenResult("");
    try{
      const prompt="Ты — эксперт по работе с клиентами. На основе данных о лиде и поставленной цели сгенерируй 3 варианта касания.\n\nДанные о лиде:\n"+l.ai_report+"\n\nЦель касания: "+(touchGenGoal||"продвинуть лида вперёд по воронке")+"\n\nГлавная задача — не написать красивый текст, а повысить вероятность достижения указанной цели.\n\nТребования к стилю:\n- писать как живой человек\n- никаких ИИ-конструкций\n- никаких клише и шаблонов\n- никаких фраз вроде надеюсь, у вас всё хорошо\n- никаких чрезмерных продаж\n- уважительный тон\n- деловой стиль\n- короткие и понятные предложения\n- естественный русский язык\n- не использовать длинные тире\n- не использовать эмодзи\n- избегать канцелярита\n- клиент не должен чувствовать, что ему продают\n\nФормат ответа (строго):\n\n##В1##\nНазвание: Рациональный\nЦель: [цель этого касания]\nТекст:\n[сам текст касания]\n\n##В2##\nНазвание: Экспертный\nЦель: [цель этого касания]\nТекст:\n[сам текст касания]\n\n##В3##\nНазвание: Человеческий\nЦель: [цель этого касания]\nТекст:\n[сам текст касания]\n\nТолько сами касания. Никаких комментариев до или после.";
      const resp=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
      const data=await resp.json();
      const text=data.choices?.[0]?.message?.content||data.content?.[0]?.text||"";
      setTouchGenResult(text);
    }catch(e){setTouchGenResult("Ошибка генерации. Попробуй ещё раз.");}
    setTouchGenLoading(false);
  };

  const saveEditLead=async()=>{
    if(!editLeadId)return;
    await allLeads.update(editLeadId,{...editLeadData,deal:editLeadData.deal?+editLeadData.deal:null});
    setEditLeadId(null);
  };

  // Build "write" URL from contact field
  const getWriteUrl=(l:any):string|null=>{
    const c=(l.contact||l.phone||l.email||"").trim();
    if(!c)return null;
    if(c.includes("t.me/")||c.includes("telegram"))return c.startsWith("http")?c:"https://"+c;
    if(c.includes("instagram.com")||c.includes("instagram"))return c.startsWith("http")?c:"https://"+c;
    if(c.includes("wa.me")||c.includes("whatsapp"))return c.startsWith("http")?c:"https://"+c;
    if(c.match(/^\+?[\d\s\-()]{7,}$/)){
      const digits=c.replace(/\D/g,"");
      return"https://wa.me/"+digits;
    }
    if(c.includes("@")&&!c.includes("/"))return"mailto:"+c;
    if(c.startsWith("http"))return c;
    return"https://"+c;
  };

  const leadCard=(l:any,stageColor:string)=>{
    const isOpen=openLead===l.id;
    const isEditing=editLeadId===l.id;

    return <div key={l.id}>
      {/* ── Edit modal is rendered globally so it also works from List view */}
      {false&&isEditing&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setEditLeadId(null)}>
          <div style={{background:C.w,borderRadius:18,padding:28,width:"100%",maxWidth:480,border:"1px solid "+C.bd,boxShadow:"0 24px 60px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:C.t1,marginBottom:20}}>✏️ Редактировать лида</div>

            {/* Avatar upload in modal */}
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
              <label style={{cursor:"pointer",flexShrink:0}}>
                <div style={{width:72,height:72,borderRadius:"50%",background:C.ib,border:"2px dashed "+C.bd,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative",transition:"border-color 0.15s"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;}}>
                  {avatarUpl===editLeadId
                    ?<div style={{width:22,height:22,border:"2px solid "+C.bd,borderTopColor:C.a,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                    :editLeadData.avatar_url
                    ?<img src={editLeadData.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="avatar"/>
                    :<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  }
                  <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0)",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.2s"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(0,0,0,0.35)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(0,0,0,0)";}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{opacity:0}}
                      onMouseEnter={e=>{(e.currentTarget as SVGElement).style.opacity="1";}}
                      onMouseLeave={e=>{(e.currentTarget as SVGElement).style.opacity="0";}}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>
                </div>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0]&&editLeadId)uploadLeadAvatar(e.target.files[0],editLeadId);}}/>
              </label>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{editLeadData.name||"Лид"}</div>
                <div style={{fontSize:11,color:C.t2,marginTop:2}}>Нажми на фото чтобы изменить</div>
                {editLeadData.avatar_url&&<button onClick={()=>setEditLeadData({...editLeadData,avatar_url:""})}
                  style={{fontSize:10,color:C.r,background:"transparent",border:"none",cursor:"pointer",padding:0,marginTop:4}}>✕ Удалить фото</button>}
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              {([["name","Имя *"],["contact","Контакт"],["phone","Телефон"],["email","Email"],["deal","Сделка, ₽"],["source","Источник"]] as const).map(([k,label])=>(
                <div key={k}>
                  <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>{label}</label>
                  <input type={k==="deal"?"number":"text"} value={editLeadData[k]||""} onChange={e=>setEditLeadData({...editLeadData,[k]:e.target.value})}
                    style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const,fontFamily:"'Inter',sans-serif"}}/>
                </div>
              ))}
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>Описание лида</label>
              <textarea value={editLeadData.note||""} onChange={e=>setEditLeadData({...editLeadData,note:e.target.value})} rows={5}
                placeholder="Подробный конспект по лиду: боль, ситуация, договорённости, следующий шаг..."
                style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,resize:"vertical",fontFamily:"'Inter',sans-serif",boxSizing:"border-box" as const}}/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setEditLeadId(null)} style={{padding:"9px 16px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:10,fontSize:13,cursor:"pointer"}}>Отмена</button>
              <button onClick={saveEditLead} style={{padding:"9px 20px",background:C.a,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 0 16px "+C.a+"40"}}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteConfirmId===l.id&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setDeleteConfirmId(null)}>
          <div style={{background:C.w,borderRadius:18,padding:28,width:"100%",maxWidth:380,textAlign:"center",border:"1px solid "+C.bd,boxShadow:"0 24px 60px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
            <div style={{fontSize:16,fontWeight:700,color:C.t1,marginBottom:8}}>Удалить лида «{l.name}»?</div>
            <div style={{fontSize:13,color:C.t2,marginBottom:6,lineHeight:1.6}}>Это действие <strong>нельзя отменить</strong>.<br/>Все данные по этому лиду будут удалены безвозвратно.</div>
            <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"center"}}>
              <button onClick={()=>setDeleteConfirmId(null)} style={{padding:"10px 20px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:10,fontSize:13,fontWeight:500,cursor:"pointer"}}>Отмена</button>
              <button onClick={()=>{allLeads.remove(l.id);setDeleteConfirmId(null);setOpenLead(null);}}
                style={{padding:"10px 22px",background:"linear-gradient(135deg,#FF6B9D,#E91E8C)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 0 20px rgba(233,30,140,0.4)"}}>
                🗑 Удалить навсегда
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lead card ── */}
      <div draggable onDragStart={e=>onDragStart(l.id,e)} onDragEnd={onDragEnd}
        onClick={()=>setOpenLead(isOpen?null:l.id)}
        style={{
          background:C.w,borderRadius:11,padding:"11px 12px",marginBottom:6,
          cursor:"grab",userSelect:"none",boxSizing:"border-box" as const,
          border:"1px solid "+C.bd,
          borderLeft:`3px solid ${stageColor}`,
          opacity:dragId===l.id?0.4:1,
          animation:"leadPulse 4s ease-in-out infinite",
          position:"relative",overflow:"hidden",
        }}
        onMouseEnter={e=>{
          const el=e.currentTarget as HTMLElement;
          el.style.borderColor=stageColor+"60";
          el.style.boxShadow="0 0 16px "+stageColor+"18";
          el.style.animationPlayState="paused";
        }}
        onMouseLeave={e=>{
          const el=e.currentTarget as HTMLElement;
          el.style.borderColor=C.bd;
          el.style.borderLeftColor=stageColor;
          el.style.boxShadow="none";
          el.style.animationPlayState="running";
        }}>

        {/* Subtle shimmer bg */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,"+stageColor+"04,transparent)",pointerEvents:"none",borderRadius:11}}/>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,minWidth:0,position:"relative"}}>
          {/* Avatar */}
          <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,overflow:"hidden",background:stageColor+"20",border:"2px solid "+stageColor+"30",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {l.avatar_url
              ?<img src={l.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={l.name}/>
              :<span style={{fontSize:12,fontWeight:700,color:stageColor}}>{(l.name||"?")[0].toUpperCase()}</span>
            }
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:13,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
            {(l.phone||l.email||l.contact)&&<div style={{fontSize:11,color:C.t2,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.phone||l.email||l.contact}</div>}
          </div>
          {l.deal&&<div style={{fontSize:11,fontWeight:600,color:C.g,flexShrink:0,whiteSpace:"nowrap"}}>{fmt$(l.deal)}₽</div>}
        </div>

        {isOpen&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+C.bd,position:"relative"}}>
          {/* Clean: only 3 action buttons */}
          <div style={{display:"flex",gap:6,alignItems:"stretch"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>{setWorkPanelLead(l);setWorkPanelTab("profile");setTouchGenResult("");setTouchGenGoal("");}}
              style={{flex:1,padding:"9px 10px",background:"linear-gradient(135deg,#7C3AED,#4F8EF7)",color:"#fff",border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 14px rgba(124,58,237,0.25)"}}>
              Работать с лидом
            </button>
            <button onClick={()=>openEditLead(l)}
              style={{padding:"9px 14px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:10,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              ✏️
            </button>
            <button onClick={()=>setDeleteConfirmId(l.id)}
              style={{padding:"9px 14px",background:"#FFF1F2",color:"#E91E8C",border:"1px solid #FECDD3",borderRadius:10,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              🗑
            </button>
          </div>
        </div>}
      </div>
    </div>;
  };

  // ── WORK PANEL (side drawer) ──────────────────────────────────────
  const WorkPanel=()=>{
    const l=workPanelLead;
    if(!l)return null;
    const stageColor=stages.find((s:any)=>s.id===l.status)?.color||C.a;
    const writeUrl=getWriteUrl(l);
    const hasReport=!!l.ai_report;

    // ── Parse AI report into sections ──
    const parseReport=(raw:string)=>{
      const get=(tag:string)=>raw.split("##"+tag+"##")[1]?.split("##")[0]?.trim()||"";
      return{portrait:get("ПОРТРЕТ"),emotions:get("ЭМОЦИИ"),probability:get("ВЕРОЯТНОСТЬ"),risks:get("РИСКИ"),steps:get("ШАГИ")};
    };

    // ── Parse touch variants ──
    const parseTouches=(raw:string)=>{
      return["В1","В2","В3"].map(tag=>{
        const block=raw.split("##"+tag+"##")[1]?.split("##")[0]?.trim()||"";
        if(!block)return null;
        const name=block.match(/Название:\s*(.+)/)?.[1]?.trim()||"";
        const goal=block.match(/Цель:\s*(.+)/)?.[1]?.trim()||"";
        const text=block.split("Текст:")[1]?.trim()||"";
        return{name,goal,text};
      }).filter(Boolean);
    };

    const ReportBlock=({color,border,title,children}:{color:string,border:string,title:string,children:React.ReactNode})=>(
      <div style={{padding:"12px 14px",background:color,border:"1px solid "+border,borderRadius:12,borderLeft:"3px solid "+border.replace("40","").replace("50","").replace("30","")}}>
        <div style={{fontSize:10,fontWeight:800,color:border.replace("40","").replace("50","").replace("30",""),marginBottom:7,textTransform:"uppercase",letterSpacing:0.6}}>{title}</div>
        <div style={{fontSize:12,color:C.t1,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{children}</div>
      </div>
    );

    return<div style={{position:"fixed",inset:0,zIndex:500,display:"flex"}} onClick={()=>setWorkPanelLead(null)}>
      <div style={{flex:1,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(4px)"}}/>
      <div style={{width:"min(520px,100vw)",background:C.w,boxShadow:"-8px 0 48px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:"20px 22px 16px",background:"linear-gradient(135deg,"+stageColor+"15,"+stageColor+"05)",borderBottom:"1px solid "+C.bd,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
            <div style={{width:50,height:50,borderRadius:"50%",flexShrink:0,overflow:"hidden",background:stageColor+"20",border:"2px solid "+stageColor+"40",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {l.avatar_url?<img src={l.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={l.name}/>
                :<span style={{fontSize:20,fontWeight:800,color:stageColor}}>{(l.name||"?")[0].toUpperCase()}</span>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:17,fontWeight:800,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
              {(l.contact||l.phone||l.email)&&<div style={{fontSize:12,color:C.t2,marginTop:2}}>{l.contact||l.phone||l.email}</div>}
              {l.deal&&<div style={{fontSize:12,fontWeight:700,color:"#16A34A",marginTop:2}}>{fmt$(l.deal)} ₽</div>}
            </div>
            <button onClick={()=>setWorkPanelLead(null)} style={{width:32,height:32,borderRadius:10,border:"1px solid "+C.bd,background:C.bg,cursor:"pointer",fontSize:18,color:C.t2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
          </div>
          <div style={{display:"flex",gap:8}}>
            {writeUrl&&<a href={writeUrl} target="_blank" rel="noreferrer"
              style={{flex:1,padding:"9px 12px",background:"linear-gradient(135deg,#22C55E,#16A34A)",color:"#fff",border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,textDecoration:"none"}}>
              ✉ Написать лиду
            </a>}
            <button onClick={()=>{openTouchModal(l.id);}}
              style={{flex:1,padding:"9px 12px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              📋 История касаний
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid "+C.bd,flexShrink:0,background:C.w}}>
          {([["profile","Профиль"],["touches","Сгенерировать касание"]] as const).map(([tab,lbl])=>(
            <button key={tab} onClick={()=>setWorkPanelTab(tab)}
              style={{flex:1,padding:"13px 0",border:"none",background:"transparent",borderBottom:"2px solid "+(workPanelTab===tab?stageColor:"transparent"),color:workPanelTab===tab?stageColor:C.t2,fontSize:12,fontWeight:workPanelTab===tab?700:400,cursor:"pointer",transition:"all 0.15s"}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"18px 22px",display:"flex",flexDirection:"column",gap:14}}>

          {/* ── PROFILE TAB ── */}
          {workPanelTab==="profile"&&<>
            {/* Description */}
            {l.note&&<div>
              <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Описание</div>
              <div style={{fontSize:12,color:C.t1,lineHeight:1.65,background:C.ib,borderRadius:9,padding:"10px 12px",borderLeft:"3px solid "+stageColor,whiteSpace:"pre-wrap"}}>{l.note}</div>
            </div>}

            {/* 5 editable fields */}
            {([
              {key:"pains",label:"Боли",ph:"Что болит, что мешает, что не устраивает"},
              {key:"desires",label:"Желания",ph:"Чего хочет достичь, какой результат ожидает"},
              {key:"objections",label:"Возражения",ph:"Сомнения, страхи, причины не покупать"},
              {key:"leverage",label:"На что давить",ph:"Триггеры, ценности, что важно для решения"},
              {key:"next_step",label:"Следующий шаг",ph:"Конкретное действие: созвон, оффер, дожим..."},
            ] as const).map(({key,label,ph})=>{
              const val=l[key]||"";
              return<div key={key}>
                <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>{label}</div>
                <textarea defaultValue={val} placeholder={ph} rows={2}
                  onBlur={async e=>{const v=e.target.value;if(v!==val)await allLeads.update(l.id,{[key]:v});}}
                  style={{width:"100%",padding:"9px 12px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,background:C.ib,color:C.t1,resize:"none",fontFamily:"Inter,sans-serif",lineHeight:1.6,outline:"none",boxSizing:"border-box" as const,transition:"border-color 0.15s"}}
                  onFocus={e=>{e.target.style.borderColor=stageColor;}}
                  onBlurCapture={e=>{e.target.style.borderColor=C.bd;}}/>
              </div>;
            })}

            {/* AI Report */}
            <div style={{borderTop:"1px solid "+C.bd,paddingTop:14}}>
              <button disabled={aiReportLoading===l.id}
                onClick={async()=>{await generateAiReport(l);setWorkPanelLead((prev:any)=>prev?{...prev,...allLeads.data.find((x:any)=>x.id===l.id)}:prev);}}
                style={{width:"100%",padding:"11px 14px",background:aiReportLoading===l.id?"#6D28D9":"linear-gradient(135deg,#7C3AED,#4F8EF7)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:aiReportLoading===l.id?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 0 16px rgba(124,58,237,0.2)"}}>
                {aiReportLoading===l.id?<><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/> Формирую отчёт...</>:"Сформировать отчёт через ИИ"}
              </button>

              {l.ai_report&&(()=>{
                const r=parseReport(l.ai_report);
                return<div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>
                  {r.portrait&&<div style={{padding:"12px 14px",background:"#EFF6FF",border:"1px solid #93C5FD",borderRadius:12,borderLeft:"3px solid #3B82F6"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#1D4ED8",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6}}>Портрет лида</div>
                    <div style={{fontSize:12,color:"#1E3A5F",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{r.portrait}</div>
                  </div>}
                  {r.emotions&&<div style={{padding:"12px 14px",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:12,borderLeft:"3px solid #F97316"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#C2410C",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6}}>Эмоциональное состояние</div>
                    <div style={{fontSize:12,color:"#7C2D12",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{r.emotions}</div>
                  </div>}
                  {r.probability&&<div style={{padding:"12px 14px",background:"#F0F9FF",border:"1px solid #7DD3FC",borderRadius:12,borderLeft:"3px solid #0EA5E9"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#0369A1",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6}}>Вероятность покупки</div>
                    <div style={{fontSize:12,color:"#0C4A6E",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{r.probability}</div>
                  </div>}
                  {r.risks&&<div style={{padding:"12px 14px",background:"#FFF1F2",border:"1px solid #FECDD3",borderRadius:12,borderLeft:"3px solid #F43F5E"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#BE123C",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6}}>Риски потери лида</div>
                    <div style={{fontSize:12,color:"#881337",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{r.risks}</div>
                  </div>}
                  {r.steps&&<div style={{padding:"12px 14px",background:"#FAF5FF",border:"1px solid #D8B4FE",borderRadius:12,borderLeft:"3px solid #7C3AED"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#6D28D9",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6}}>Оптимальный следующий шаг</div>
                    <div style={{fontSize:12,color:"#4C1D95",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{r.steps}</div>
                  </div>}
                </div>;
              })()}
            </div>
          </>}

          {/* ── TOUCHES TAB ── */}
          {workPanelTab==="touches"&&<>
            {!hasReport&&<div style={{padding:"14px 16px",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:12,fontSize:12,color:"#C2410C",lineHeight:1.7}}>
              Для генерации касания нужен отчёт ИИ. Перейди во вкладку Профиль и сначала сформируй его.
            </div>}
            <div>
              <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Цель касания</div>
              <textarea value={touchGenGoal} onChange={e=>setTouchGenGoal(e.target.value)} rows={2}
                placeholder="Например: закрыть на звонок, дожать до оплаты, отработать возражение, напомнить о себе..."
                style={{width:"100%",padding:"10px 12px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,background:C.ib,color:C.t1,resize:"none",fontFamily:"Inter,sans-serif",outline:"none",boxSizing:"border-box" as const,lineHeight:1.6}}/>
            </div>
            <button disabled={touchGenLoading||!hasReport}
              onClick={()=>generateTouchpoint(workPanelLead)}
              style={{width:"100%",padding:"11px 14px",background:!hasReport?"#9CA3AF":touchGenLoading?"#6D28D9":"linear-gradient(135deg,#7C3AED,#4F8EF7)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:(!hasReport||touchGenLoading)?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {touchGenLoading?<><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/> Генерирую касания...</>:"Сгенерировать касание"}
            </button>

            {touchGenResult&&touchGenResult!=="__no_report__"&&(()=>{
              const touches=parseTouches(touchGenResult);
              const colors=[
                {bg:"#EFF6FF",border:"#93C5FD",accent:"#1D4ED8"},
                {bg:"#FAF5FF",border:"#D8B4FE",accent:"#6D28D9"},
                {bg:"#F0FDF4",border:"#86EFAC",accent:"#15803D"},
              ];
              return<div style={{display:"flex",flexDirection:"column",gap:12}}>
                {touches.map((t:any,i:number)=>{
                  const c=colors[i]||colors[0];
                  return<div key={i} style={{padding:"14px 16px",background:c.bg,border:"1px solid "+c.border,borderRadius:12,borderLeft:"3px solid "+c.accent}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:800,color:c.accent,textTransform:"uppercase",letterSpacing:0.5}}>{t.name}</div>
                        {t.goal&&<div style={{fontSize:11,color:c.accent,opacity:0.7,marginTop:2}}>Цель: {t.goal}</div>}
                      </div>
                    </div>
                    <div style={{fontSize:12,color:C.t1,lineHeight:1.8,whiteSpace:"pre-wrap",marginBottom:10}}>{t.text}</div>
                    <button
                      onClick={()=>{navigator.clipboard.writeText(t.text).catch(()=>{});}}
                      title="Скопировать текст"
                      style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"rgba(255,255,255,0.7)",border:"1px solid "+c.border,borderRadius:7,cursor:"pointer",fontSize:11,color:c.accent,fontWeight:600}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      Скопировать
                    </button>
                  </div>;
                })}
              </div>;
            })()}
            {touchGenResult==="__no_report__"&&<div style={{padding:"14px 16px",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:12,fontSize:12,color:"#C2410C"}}>
              Сначала сформируй отчёт ИИ во вкладке Профиль.
            </div>}
          </>}
        </div>
      </div>
    </div>;
  };
  // ── SCREEN: FUNNEL LIST ──────────────────────────────────────────
  if(screen==="list"){
    return <>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:24,fontWeight:800,color:C.t1}}>CRM</h1>
          <div style={{fontSize:13,color:C.t2,marginTop:2}}>Выбери воронку продаж или создай новую</div>
        </div>
        <button onClick={()=>setNewFunnelModal(true)}
          style={{padding:"10px 20px",background:"#007AFF",color:"#fff",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новая воронка
        </button>
      </div>

      {funnels.loading
        ?<div style={{textAlign:"center",padding:60,color:C.t2}}>Загрузка...</div>
        :funnels.data.length===0
        ?<div style={{textAlign:"center",padding:"80px 32px",background:C.w,borderRadius:20,border:"1px solid "+C.bd}} className="empty-state">
            <div style={{fontSize:48,marginBottom:16}}>🎯</div>
            <div style={{fontSize:18,fontWeight:700,color:C.t1,marginBottom:8}}>Воронок пока нет</div>
            <div style={{fontSize:14,color:C.t2,marginBottom:24}}>Создай первую воронку продаж для управления лидами</div>
            <button onClick={()=>setNewFunnelModal(true)} style={{padding:"12px 24px",background:C.a,color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer"}}>
              + Создать воронку
            </button>
          </div>
        :<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
            {funnels.data.map((fu:any)=>{
              const fuLeads=allLeads.data.filter((l:any)=>l.funnel_id===fu.id);
              const fuClosed=fuLeads.filter((l:any)=>l.status==="closed");
              const fuRevenue=fuClosed.reduce((s:number,l:any)=>s+(l.deal||0),0);
              const convRate=fuLeads.length?Math.round((fuClosed.length/fuLeads.length)*100):0;
              const accentColor=fu.color||C.a;
              return <div key={fu.id}
                onClick={()=>openFunnel(fu.id)}
                style={{
                  background:C.w,borderRadius:18,padding:"20px",cursor:"pointer",
                  border:"1px solid "+C.bd,
                  transition:"all 0.25s ease",position:"relative",overflow:"hidden",
                  boxShadow:`0 4px 20px rgba(0,0,0,0.08)`,
                }}
                onMouseEnter={e=>{
                  const el=e.currentTarget as HTMLElement;
                  el.style.transform="translateY(-3px)";
                  el.style.boxShadow="0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px "+accentColor+"30, 0 0 20px "+accentColor+"15";
                  el.style.borderColor=accentColor+"40";
                }}
                onMouseLeave={e=>{
                  const el=e.currentTarget as HTMLElement;
                  el.style.transform="translateY(0)";
                  el.style.boxShadow="0 4px 20px rgba(0,0,0,0.08)";
                  el.style.borderColor=C.bd;
                }}>

                {/* Top accent line */}
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+accentColor+","+accentColor+"88,transparent)",borderRadius:"18px 18px 0 0"}}/>

                {/* Top right actions */}
                <div style={{position:"absolute",top:12,right:12,display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>{setEditFunnelId(fu.id);setEditFunnelName(fu.name);}}
                    style={{width:26,height:26,borderRadius:8,border:"1px solid "+C.bd,background:C.ib,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2,fontSize:12,transition:"all 0.15s"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;(e.currentTarget as HTMLElement).style.color=C.a;}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.color=C.t2;}}>✎</button>
                  <button onClick={()=>setDeleteFunnelId(fu.id)}
                    style={{width:26,height:26,borderRadius:8,border:"1px solid "+C.bd,background:C.ib,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.r+"60";(e.currentTarget as HTMLElement).style.background=C.r+"10";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.background=C.ib;}}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.r} strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </div>

                {/* Funnel icon + name */}
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,paddingRight:64}}>
                  <div style={{
                    width:36,height:36,borderRadius:10,flexShrink:0,
                    background:"linear-gradient(135deg,"+accentColor+"20,"+accentColor+"08)",
                    border:"1px solid "+accentColor+"30",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    boxShadow:"0 0 12px "+accentColor+"20",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fu.name}</div>
                    {fu.description&&<div style={{fontSize:11,color:C.t2,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fu.description}</div>}
                  </div>
                </div>

                {/* Stats — minimal */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                  {[
                    {label:"Лидов",value:fuLeads.length},
                    {label:"Закрыто",value:fuClosed.length},
                    {label:"Конверсия",value:convRate+"%"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:C.ib,borderRadius:10,padding:"10px 8px",textAlign:"center",border:"1px solid "+C.bd}}>
                      <div style={{fontSize:17,fontWeight:700,color:C.t1,lineHeight:1.2}}>{s.value}</div>
                      <div style={{fontSize:10,color:C.t2,marginTop:3}}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Revenue */}
                {fuRevenue>0&&<div style={{fontSize:12,color:C.g,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:C.g,boxShadow:`0 0 6px ${C.g}`}}/>
                  {fmt$(fuRevenue)} ₽ закрытых сделок
                </div>}

                {/* Stage distribution bar */}
                <div style={{display:"flex",gap:2,height:3,borderRadius:4,overflow:"hidden",marginBottom:14}}>
                  {CRM_DEFAULT_STAGES.map(stage=>{
                    const cnt=fuLeads.filter((l:any)=>l.status===stage.id).length;
                    const pct=fuLeads.length?cnt/fuLeads.length:0;
                    return pct>0?<div key={stage.id} style={{flex:pct,background:stage.color,borderRadius:4,opacity:0.7}}/>:null;
                  })}
                  {fuLeads.length===0&&<div style={{flex:1,background:C.bd,borderRadius:4}}/>}
                </div>

                {/* Footer */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:C.t2}}>Открыть воронку</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" style={{opacity:0.7}}><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>;
            })}

            {/* Add card */}
            <div onClick={()=>setNewFunnelModal(true)}
              style={{
                background:"transparent",borderRadius:18,padding:"20px",cursor:"pointer",
                border:"1px dashed "+C.bd,
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                gap:10,minHeight:200,transition:"all 0.2s",
              }}
              onMouseEnter={e=>{
                const el=e.currentTarget as HTMLElement;
                el.style.borderColor=C.a;
                el.style.background=C.a+"06";
                el.style.boxShadow="0 0 20px "+C.a+"10";
              }}
              onMouseLeave={e=>{
                const el=e.currentTarget as HTMLElement;
                el.style.borderColor=C.bd;
                el.style.background="transparent";
                el.style.boxShadow="none";
              }}>
              <div style={{width:40,height:40,borderRadius:12,background:C.ib,border:"1px solid "+C.bd,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div style={{fontSize:13,fontWeight:500,color:C.t2}}>Новая воронка</div>
            </div>
          </div>
      }

      {/* ── New funnel modal ── */}
      {newFunnelModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setNewFunnelModal(false)}>
          <div style={{background:"#fff",borderRadius:20,padding:32,width:"100%",maxWidth:440,boxShadow:"0 24px 60px rgba(0,0,0,0.18)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:18,fontWeight:700,marginBottom:20,color:"#1C1C1E"}}>Новая воронка продаж</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Название *</label>
                <input autoFocus value={newFunnelName} onChange={e=>setNewFunnelName(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")createFunnel();}}
                  placeholder="Например: Основная воронка, Instagram, B2B..." style={iS()}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Описание (необязательно)</label>
                <input value={newFunnelDesc} onChange={e=>setNewFunnelDesc(e.target.value)} placeholder="Краткое описание..." style={iS()}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:8}}>Цвет воронки</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {FUNNEL_COLORS.map(color=>(
                    <button key={color} onClick={()=>setNewFunnelColor(color)}
                      style={{width:32,height:32,borderRadius:10,background:color,border:newFunnelColor===color?"3px solid #1C1C1E":"3px solid transparent",cursor:"pointer",transition:"border 0.1s"}}/>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
              <button onClick={()=>setNewFunnelModal(false)} style={{padding:"10px 18px",background:"#F2F2F7",color:"#8E8E93",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Отмена</button>
              <button onClick={createFunnel} disabled={!newFunnelName.trim()} style={{padding:"10px 20px",background:newFunnelName.trim()?"#007AFF":"#C6C6C8",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:newFunnelName.trim()?"pointer":"default"}}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit funnel name ── */}
      {editFunnelId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setEditFunnelId(null)}>
          <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:380}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:16}}>Переименовать воронку</div>
            <input autoFocus value={editFunnelName} onChange={e=>setEditFunnelName(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"){funnels.update(editFunnelId,{name:editFunnelName});setEditFunnelId(null);}}}
              style={iS()}/>
            <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}>
              <button onClick={()=>setEditFunnelId(null)} style={{padding:"9px 16px",background:"#F2F2F7",color:"#8E8E93",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Отмена</button>
              <button onClick={()=>{funnels.update(editFunnelId,{name:editFunnelName});setEditFunnelId(null);}} style={{padding:"9px 18px",background:"#007AFF",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteFunnelId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setDeleteFunnelId(null)}>
          <div style={{background:"#fff",borderRadius:20,padding:28,maxWidth:360,width:"100%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Удалить воронку?</div>
            <div style={{fontSize:13,color:C.t2,marginBottom:20}}>Все лиды в этой воронке тоже будут удалены. Отменить нельзя.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setDeleteFunnelId(null)} style={{padding:"10px 20px",background:"#F2F2F7",color:"#8E8E93",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Отмена</button>
              <button onClick={deleteFunnel} style={{padding:"10px 20px",background:"#FF3B30",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </>;
  }

  // ── SCREEN: FUNNEL INNER ─────────────────────────────────────────
  return <>
    <WorkPanel/>
    {crmToast&&<div style={{position:"fixed",bottom:28,right:28,background:"#16A34A",color:"#fff",padding:"13px 20px",borderRadius:14,fontSize:13,fontWeight:600,zIndex:600,boxShadow:"0 8px 28px rgba(22,163,74,0.35)",display:"flex",alignItems:"center",gap:10,maxWidth:340,lineHeight:1.5}}>✓ {crmToast}</div>}
    {touchModalLead&&touchModalLeadId&&(
      <div style={{position:"fixed",inset:0,background:"rgba(5,8,15,0.62)",zIndex:320,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?12:24,backdropFilter:"blur(8px)"}} onClick={closeTouchModal}>
        <div style={{width:"100%",maxWidth:860,maxHeight:"88dvh",background:C.w,border:"1px solid "+C.bd,borderRadius:24,boxShadow:"0 28px 80px rgba(0,0,0,0.36)",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:isMobile?18:24,borderBottom:"1px solid "+C.bd,background:"linear-gradient(135deg, rgba(79,70,229,0.10), rgba(124,58,237,0.08), transparent)",position:"relative"}}>
            <button onClick={closeTouchModal} style={{position:"absolute",right:16,top:16,width:34,height:34,borderRadius:12,border:"1px solid "+C.bd,background:C.w,color:C.t2,cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
            <div style={{display:"flex",alignItems:"center",gap:14,paddingRight:42}}>
              <div style={{width:48,height:48,borderRadius:16,background:"linear-gradient(135deg,#4F46E5,#7C3AED)",boxShadow:"0 0 28px rgba(124,58,237,0.30)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:22}}>✨</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:isMobile?20:24,fontWeight:900,color:C.t1,lineHeight:1.15}}>Касания</div>
                <div style={{fontSize:13,color:C.t2,marginTop:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{touchModalLead.name||"Лид"} · {activeFunnel?.name||"CRM"}</div>
              </div>
            </div>
          </div>

          <div style={{padding:isMobile?14:22,overflowY:"auto",display:"grid",gap:12,background:C.ib}}>
            <div style={{background:C.w,border:"1px solid "+C.bd,borderRadius:18,padding:isMobile?14:16,display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:12,flexDirection:isMobile?"column":"row"}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:C.t1}}>План касаний по лиду</div>
                <div style={{fontSize:12,color:C.t2,marginTop:4,lineHeight:1.5}}>Открывай нужное касание, прописывай сообщение, дату и время отправки. Все касания не раскрываются сразу, чтобы карточка оставалась чистой.</div>
              </div>
              {touchSavedLeadId===touchModalLeadId&&<div style={{fontSize:12,fontWeight:800,color:"#16A34A",padding:"8px 12px",borderRadius:999,background:"#22C55E10",border:"1px solid #22C55E25",whiteSpace:"nowrap"}}>Сохранено</div>}
            </div>

            {touchModalRows.map((touch:any,index:number)=>{
              const isOpen=openTouchItemId===touch.id;
              const isFilled=String(touch.message||"").trim().length>0;
              return <div key={touch.id} style={{background:C.w,border:"1px solid "+(isOpen?"rgba(124,58,237,0.36)":C.bd),borderRadius:18,overflow:"hidden",boxShadow:isOpen?"0 14px 36px rgba(124,58,237,0.10)":"none"}}>
                <button onClick={()=>setOpenTouchItemId(isOpen?null:touch.id)} style={{width:"100%",padding:isMobile?14:16,background:isOpen?"linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.06))":"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,textAlign:"left"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
                    <div style={{width:34,height:34,borderRadius:12,background:isFilled?"linear-gradient(135deg,#4F46E5,#7C3AED)":"rgba(124,58,237,0.10)",color:isFilled?"#fff":"#6D48F7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0}}>{index+1}</div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:900,color:C.t1}}>{`Касание ${index+1}`}</div>
                      <div style={{fontSize:12,color:C.t2,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:isMobile?220:520}}>{isFilled?touch.message:"Сообщение ещё не заполнено"}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    {(touch.date||touch.time)&&<span style={{fontSize:11,fontWeight:800,color:touch.sent?"#16A34A":"#6D48F7",padding:"6px 9px",borderRadius:999,background:touch.sent?"#22C55E10":"rgba(124,58,237,0.08)",border:"1px solid "+(touch.sent?"#22C55E25":"rgba(124,58,237,0.16)"),display:isMobile?"none":"inline-block"}}>{touch.sent?"Отправлено":"Запланировано"}</span>}
                    <span style={{fontSize:18,color:C.t2,transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}}>⌄</span>
                  </div>
                </button>

                {isOpen&&<div style={{padding:isMobile?14:18,borderTop:"1px solid "+C.bd,display:"grid",gap:14}}>
                  <div>
                    <label style={{display:"block",fontSize:12,fontWeight:800,color:C.t2,marginBottom:7}}>Текст сообщения</label>
                    <textarea value={touch.message||""} onChange={e=>updateTouch(touchModalLeadId!,touch.id,{message:e.target.value,sent:false})} placeholder="Напиши follow-up, напоминание или готовое сообщение для отправки..." rows={5}
                      style={{width:"100%",padding:"14px 15px",border:"1px solid "+C.bd,borderRadius:14,fontSize:14,outline:"none",background:C.ib,color:C.t1,resize:"vertical",fontFamily:"Inter, sans-serif",lineHeight:1.55,boxSizing:"border-box" as const}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:800,color:C.t2,marginBottom:7}}>Дата отправки</label>
                      <input type="date" value={touch.date||""} onChange={e=>updateTouch(touchModalLeadId!,touch.id,{date:e.target.value,sent:false})} style={{width:"100%",padding:"12px 13px",border:"1px solid "+C.bd,borderRadius:14,fontSize:14,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const,fontFamily:"Inter, sans-serif"}}/>
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:800,color:C.t2,marginBottom:7}}>Время отправки</label>
                      <input type="time" value={touch.time||""} onChange={e=>updateTouch(touchModalLeadId!,touch.id,{time:e.target.value,sent:false})} style={{width:"100%",padding:"12px 13px",border:"1px solid "+C.bd,borderRadius:14,fontSize:14,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const,fontFamily:"Inter, sans-serif"}}/>
                    </div>
                  </div>

                  {isFilled&&<div style={{display:"grid",gap:8}}>
                    <div style={{fontSize:12,fontWeight:800,color:C.t2}}>Предпросмотр</div>
                    <div style={{maxWidth:"100%",padding:"12px 15px",borderRadius:"18px 18px 18px 6px",background:"linear-gradient(135deg,#4F46E5,#7C3AED)",color:"#fff",fontSize:14,lineHeight:1.55,boxShadow:"0 0 22px rgba(124,58,237,0.18)",whiteSpace:"pre-wrap",wordBreak:"break-word",opacity:touch.sent?0.72:1,boxSizing:"border-box" as const}}>{touch.message}</div>
                  </div>}

                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                    <button onClick={()=>updateTouch(touchModalLeadId!,touch.id,{sent:!touch.sent})} style={{padding:"10px 13px",borderRadius:12,border:"1px solid "+(touch.sent?"#22C55E35":"rgba(124,58,237,0.20)"),background:touch.sent?"#22C55E10":"rgba(124,58,237,0.08)",color:touch.sent?"#16A34A":"#6D48F7",fontSize:12,fontWeight:900,cursor:"pointer"}}>{touch.sent?"✓ Отправлено":"Отметить отправленным"}</button>
                    {touchModalRows.length>1&&<button onClick={()=>removeTouchRow(touchModalLeadId!,touch.id)} style={{padding:"10px 13px",borderRadius:12,border:"1px solid rgba(239,68,68,0.22)",background:"rgba(239,68,68,0.08)",color:"#EF4444",fontSize:12,fontWeight:800,cursor:"pointer"}}>Удалить касание</button>}
                  </div>
                </div>}
              </div>
            })}
          </div>

          <div style={{padding:isMobile?14:18,borderTop:"1px solid "+C.bd,background:C.w,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
            <button onClick={()=>{const newTouch={id:`touch_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,message:"",date:"",time:"",sent:false};setTouchesByLead(prev=>({...prev,[touchModalLeadId!]:[...(prev[touchModalLeadId!]||[]),newTouch]}));setOpenTouchItemId(newTouch.id);}} style={{padding:"11px 14px",background:"transparent",color:"#6D48F7",border:"1px dashed rgba(124,58,237,0.30)",borderRadius:13,fontSize:13,fontWeight:900,cursor:"pointer"}}>+ Добавить касание</button>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={closeTouchModal} style={{padding:"11px 16px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:13,fontSize:13,fontWeight:800,cursor:"pointer"}}>Закрыть</button>
              <button onClick={()=>saveTouchRows(touchModalLeadId!)} style={{padding:"11px 18px",background:"linear-gradient(135deg,#4F46E5,#7C3AED)",color:"#fff",border:"none",borderRadius:13,fontSize:13,fontWeight:900,cursor:"pointer",boxShadow:"0 0 22px rgba(124,58,237,0.24)"}}>Сохранить касания</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Global edit lead modal: works from Kanban and List views ── */}
    {editLeadId&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setEditLeadId(null)}>
        <div style={{background:C.w,borderRadius:20,padding:isMobile?20:28,width:"100%",maxWidth:520,maxHeight:"calc(100dvh - 40px)",overflowY:"auto",border:"1px solid "+C.bd,boxShadow:"0 24px 60px rgba(0,0,0,0.4)",boxSizing:"border-box" as const}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:20}}>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.t1}}>✏️ Редактировать лида</div>
              <div style={{fontSize:11,color:C.t2,marginTop:3}}>Изменения сохранятся в текущей воронке и будут видны в канбане и списке.</div>
            </div>
            <button onClick={()=>setEditLeadId(null)} style={{width:32,height:32,borderRadius:10,border:"1px solid "+C.bd,background:C.ib,color:C.t2,cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
            <label style={{cursor:"pointer",flexShrink:0}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:C.ib,border:"2px dashed "+C.bd,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative",transition:"border-color 0.15s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;}}>
                {avatarUpl===editLeadId
                  ?<div style={{width:22,height:22,border:"2px solid "+C.bd,borderTopColor:C.a,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  :editLeadData.avatar_url
                  ?<img src={editLeadData.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="avatar"/>
                  :<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                }
              </div>
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0]&&editLeadId)uploadLeadAvatar(e.target.files[0],editLeadId);}}/>
            </label>
            <div style={{minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{editLeadData.name||"Лид"}</div>
              <div style={{fontSize:11,color:C.t2,marginTop:2}}>Нажми на фото, чтобы изменить</div>
              {editLeadData.avatar_url&&<button onClick={()=>setEditLeadData({...editLeadData,avatar_url:""})}
                style={{fontSize:10,color:C.r,background:"transparent",border:"none",cursor:"pointer",padding:0,marginTop:5}}>✕ Удалить фото</button>}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
            {([["name","Имя *"],["contact","Контакт"],["phone","Телефон"],["email","Email"],["deal","Сделка, ₽"],["source","Источник"]] as const).map(([k,label])=>(
              <div key={k}>
                <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>{label}</label>
                <input type={k==="deal"?"number":"text"} value={editLeadData[k]||""} onChange={e=>setEditLeadData({...editLeadData,[k]:e.target.value})}
                  style={{width:"100%",padding:"10px 12px",border:"1px solid "+C.bd,borderRadius:11,fontSize:12,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const,fontFamily:"Inter, sans-serif"}}/>
              </div>
            ))}
          </div>
          <div style={{marginBottom:18}}>
            <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>📋 Описание лида</label>
            <textarea value={editLeadData.note||""} onChange={e=>setEditLeadData({...editLeadData,note:e.target.value})} rows={4}
              placeholder="Подробный конспект по лиду: откуда пришёл, в чём боль, что обсуждали, договорённости, следующий шаг..."
              style={{width:"100%",padding:"10px 12px",border:"1px solid "+C.bd,borderRadius:11,fontSize:12,outline:"none",background:C.ib,color:C.t1,resize:"vertical",fontFamily:"Inter, sans-serif",boxSizing:"border-box" as const,lineHeight:1.6}}/>
          </div>
          {/* 5 CRM fields */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:700,color:C.t1,marginBottom:10,paddingBottom:6,borderBottom:"1px solid "+C.bd}}>🧠 Профиль лида</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {([
                {k:"pains",l:"😣 Боли",ph:"Что болит, что мешает"},
                {k:"desires",l:"✨ Желания",ph:"Чего хочет достичь"},
                {k:"objections",l:"🚧 Возражения",ph:"Сомнения, страхи, причины не купить"},
                {k:"leverage",l:"🎯 На что давить",ph:"Триггеры, ценности, что важно"},
                {k:"next_step",l:"👉 Следующий шаг",ph:"Конкретное следующее действие"},
              ] as const).map(({k,l,ph})=>(
                <div key={k}>
                  <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>{l}</label>
                  <textarea value={editLeadData[k]||""} onChange={e=>setEditLeadData({...editLeadData,[k]:e.target.value})} rows={2}
                    placeholder={ph}
                    style={{width:"100%",padding:"8px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,resize:"none",fontFamily:"Inter, sans-serif",boxSizing:"border-box" as const,lineHeight:1.55}}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
            <button onClick={()=>setEditLeadId(null)} style={{padding:"10px 16px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:11,fontSize:13,cursor:"pointer",fontWeight:600}}>Отмена</button>
            <button onClick={saveEditLead} disabled={!String(editLeadData.name||"").trim()} style={{padding:"10px 20px",background:String(editLeadData.name||"").trim()?"linear-gradient(135deg,"+C.a+","+C.ah+")":C.bd,color:"#fff",border:"none",borderRadius:11,fontSize:13,fontWeight:800,cursor:String(editLeadData.name||"").trim()?"pointer":"default",boxShadow:String(editLeadData.name||"").trim()?"0 0 18px "+C.a+"35":"none"}}>Сохранить</button>
          </div>
        </div>
      </div>
    )}

    {/* Breadcrumb + funnel switcher */}
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,flexWrap:"wrap"}}>
      <button onClick={backToList}
        style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:C.ib,border:"1px solid "+C.bd,borderRadius:9,fontSize:12,fontWeight:600,color:C.t2,cursor:"pointer",flexShrink:0,transition:"all 0.15s"}}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;(e.currentTarget as HTMLElement).style.color=C.a;}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.color=C.t2;}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Воронки
      </button>
      <div style={{display:"flex",gap:6,overflowX:"auto",flex:1,scrollbarWidth:"none"}}>
        {funnels.data.map((fu:any)=>{
          const isAct=fu.id===activeFunnelId;
          const cnt=allLeads.data.filter((l:any)=>l.funnel_id===fu.id).length;
          const ac=fu.color||C.a;
          return <button key={fu.id} onClick={()=>openFunnel(fu.id)}
            style={{padding:"6px 14px",borderRadius:9,border:"1px solid "+(isAct?ac+"50":C.bd),whiteSpace:"nowrap",fontSize:12,fontWeight:isAct?700:400,cursor:"pointer",flexShrink:0,background:isAct?ac+"12":"transparent",color:isAct?ac:C.t2,boxShadow:isAct?"0 0 12px "+ac+"20":"none",transition:"all 0.15s"}}>
            {fu.name}
            <span style={{marginLeft:5,fontSize:10,opacity:0.7,background:isAct?ac+"25":C.bd,borderRadius:10,padding:"1px 6px"}}>{cnt}</span>
          </button>;
        })}
        <button onClick={()=>setNewFunnelModal(true)}
          style={{padding:"6px 12px",borderRadius:9,border:"1px dashed "+C.bd,background:"transparent",fontSize:12,color:C.t2,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap",transition:"all 0.15s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;(e.currentTarget as HTMLElement).style.color=C.a;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.color=C.t2;}}>
          + Воронка
        </button>
      </div>
    </div>

    {/* Stats */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:20}}>
      {[
        {l:"Всего",v:leads.length},
        {l:"В работе",v:leads.filter((l:any)=>!["closed","rejected"].includes(l.status)).length},
        {l:"Закрыто",v:leads.filter((l:any)=>l.status==="closed").length},
        {l:"Сделки",v:fmt$(totalD)+" ₽"},
      ].map((s,i)=>(
        <div key={i} style={{background:C.w,borderRadius:14,padding:"14px 16px",border:"1px solid "+C.bd,transition:"all 0.2s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a+"30";(e.currentTarget as HTMLElement).style.boxShadow="0 0 16px "+C.a+"10";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.boxShadow="none";}}>
          <div style={{fontSize:20,fontWeight:700,color:C.t1,marginBottom:2,lineHeight:1.2}}>{s.v}</div>
          <div style={{fontSize:11,color:C.t2}}>{s.l}</div>
        </div>
      ))}
    </div>

    {/* Today agenda */}
    <div style={{background:C.w,borderRadius:18,padding:isMobile?16:18,border:"1px solid "+C.bd,marginBottom:18,boxShadow:"0 0 22px rgba(124,58,237,0.08)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg, rgba(79,70,229,0.06), rgba(124,58,237,0.02) 45%, transparent 70%)",pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:12,marginBottom:todayTouchAgenda.length?14:0,flexDirection:isMobile?"column":"row",position:"relative"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:34,height:34,borderRadius:12,background:"linear-gradient(135deg,#4F46E5,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 18px rgba(124,58,237,0.28)",color:"#fff",fontSize:16}}>✉️</div>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.t1}}>Кому сегодня, что нужно отправить</div>
              <div style={{fontSize:12,color:C.t2,marginTop:2}}>{activeFunnel?.name?`Воронка: ${activeFunnel.name}`:"Текущая воронка"}</div>
            </div>
          </div>
        </div>
        <div style={{padding:"7px 12px",borderRadius:999,background:"linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.12))",border:"1px solid rgba(124,58,237,0.18)",fontSize:12,fontWeight:700,color:"#5B46F5",whiteSpace:"nowrap"}}>
          {todayTouchAgenda.length?`${todayTouchAgenda.length} задач на сегодня`:"На сегодня касаний нет"}
        </div>
      </div>

      {todayTouchAgenda.length>0
        ?<div style={{display:"grid",gap:10,position:"relative"}}>
          {todayTouchAgenda.slice(0,8).map((item:any,idx:number)=>{
            const accent=item.overdue?"#EF4444":"#7C3AED";
            return <div key={item.touch.id} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,1.2fr) minmax(0,2fr) auto",gap:10,alignItems:"center",padding:"12px 14px",background:C.ib,borderRadius:14,border:"1px solid "+accent+"22"}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.lead.name||`Лид ${idx+1}`}</div>
                <div style={{fontSize:11,color:C.t2,marginTop:3}}>{item.lead.source||"Без источника"} · {`Касание ${item.touchIndex}`}</div>
              </div>
              <div style={{minWidth:0}}>
                <div style={{display:"inline-block",maxWidth:"100%",padding:"9px 12px",borderRadius:"16px 16px 16px 6px",background:"linear-gradient(135deg,#4F46E5,#7C3AED)",color:"#fff",fontSize:12,lineHeight:1.45,boxShadow:"0 0 18px rgba(124,58,237,0.18)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.touch.message}</div>
              </div>
              <div style={{display:"flex",alignItems:isMobile?"stretch":"center",gap:8,justifyContent:isMobile?"flex-start":"flex-end",flexWrap:"wrap"}}>
                <div style={{fontSize:11,fontWeight:700,color:accent,padding:"7px 10px",borderRadius:999,background:accent+"10",border:"1px solid "+accent+"25"}}>{item.overdue?"Просрочено":"Сегодня"}{item.touch.time?` · ${item.touch.time}`:""}</div>
                <button onClick={()=>updateTouch(item.lead.id,item.touch.id,{sent:true})} style={{padding:"7px 10px",border:"1px solid #22C55E30",borderRadius:999,background:"#22C55E10",color:"#16A34A",fontSize:11,fontWeight:800,cursor:"pointer"}}>Отметить отправленным</button>
              </div>
            </div>
          })}
          {todayTouchAgenda.length>8&&<div style={{fontSize:11,color:C.t2,paddingLeft:4}}>Показаны первые 8 касаний. Остальные сохраняются внутри карточек лидов.</div>}
        </div>
        :<div style={{position:"relative",padding:"8px 2px 2px",fontSize:12,color:C.t2,lineHeight:1.6}}>Запланируй касания внутри карточек лидов — и здесь автоматически появится список, кому и что нужно отправить именно сегодня по этой воронке.</div>}
    </div>

    {/* Tabs */}
    <div style={{display:"flex",background:C.ib,borderRadius:10,padding:3,marginBottom:20,gap:2,border:"1px solid "+C.bd}}>
      <button style={tabSt(tab==="kanban")} onClick={()=>setTab("kanban")}>Канбан</button>
      <button style={tabSt(tab==="list")} onClick={()=>setTab("list")}>Список лидов</button>
    </div>

    {/* KANBAN */}
    {tab==="kanban"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:11,color:C.t2}}>Перетаскивай карточки между этапами. Нажми ✎ чтобы переименовать.</div>
        <button onClick={()=>setShow(!show)} style={{padding:"8px 16px",background:C.a,color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",boxShadow:"0 0 16px "+C.a+"30",transition:"all 0.2s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 0 24px "+C.a+"50";(e.currentTarget as HTMLElement).style.transform="translateY(-1px)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 0 16px "+C.a+"30";(e.currentTarget as HTMLElement).style.transform="none";}}>
          + Лид
        </button>
      </div>

      {show&&<div style={{background:C.w,borderRadius:14,padding:18,marginBottom:18,border:"1px solid "+C.bd}} className="form-panel">
        <div style={{fontSize:14,fontWeight:600,marginBottom:14,color:C.t1}}>Новый лид</div>
        <div style={{display:"flex",gap:14,marginBottom:14,alignItems:"flex-start"}}>
          {/* Avatar upload */}
          <label style={{cursor:"pointer",flexShrink:0}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:C.ib,border:"2px dashed "+C.bd,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative",transition:"border-color 0.15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;}}>
              {avatarUpl==="new"
                ?<div style={{width:20,height:20,border:"2px solid "+C.bd,borderTopColor:C.a,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                :f.avatar_url
                ?<img src={f.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="avatar"/>
                :<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              }
            </div>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadLeadAvatar(e.target.files[0],"new");}}/>
          </label>
          <div style={{fontSize:10,color:C.t2,paddingTop:20,lineHeight:1.5}}>Аватар лида<br/><span style={{opacity:0.6}}>Нажми чтобы загрузить</span></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:10}}>
          {([["name","Имя *"],["contact","Контакт"],["phone","Телефон"],["email","Email"],["note","Описание лида"],["deal","Сделка, ₽"]] as const).map(([k,l])=>(
            <div key={k}>
              <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>{l}</label>
              <input type={k==="deal"?"number":"text"} value={(f as any)[k]} onChange={e=>sF({...f,[k]:e.target.value})}
                style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const,fontFamily:"'Inter',sans-serif"}}/>
            </div>
          ))}
          <div>
            <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>Источник</label>
            <select value={f.source} onChange={e=>sF({...f,source:e.target.value})} style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const}}>
              {SRCS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>Этап</label>
            <select value={f.status} onChange={e=>sF({...f,status:e.target.value})} style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const}}>
              {stages.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={sub} style={{padding:"9px 18px",background:C.a,color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer"}}>Добавить</button>
          <button onClick={()=>setShow(false)} style={{padding:"9px 14px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:9,fontSize:12,cursor:"pointer"}}>Отмена</button>
        </div>
      </div>}

      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:16,alignItems:"flex-start",scrollbarWidth:"none"}}>
        {stages.map(stage=>{
          const stageLeads=leads.filter((l:any)=>l.status===stage.id);
          const isOver=dragOver===stage.id;
          const isStageDragOver=stageDragOver===stage.id&&stageDragId!==stage.id;
          const isDefaultStage=CRM_DEFAULT_STAGES.some(s=>s.id===stage.id);
          return <div key={stage.id}
            draggable
            onDragStart={e=>{e.stopPropagation();onStageDragStart(stage.id);}}
            onDragOver={e=>{onStageDragOver(stage.id,e);onDragOver(stage.id,e);}}
            onDrop={e=>{e.stopPropagation();onStageDrop(stage.id);onDrop(stage.id);}}
            onDragLeave={()=>{setDragOver(null);setStageDragOver(null);}}
            onDragEnd={()=>{setStageDragId(null);setStageDragOver(null);}}
            style={{minWidth:228,width:228,flexShrink:0,background:isOver?C.a+"06":C.ib,borderRadius:14,padding:"0 0 10px",
              border:"1px solid "+(isStageDragOver?stage.color+"80":isOver?C.a+"40":C.bd),
              boxShadow:isStageDragOver?"0 0 16px "+stage.color+"30":isOver?"0 0 20px "+C.a+"15":"none",
              opacity:stageDragId===stage.id?0.45:1,
              transition:"all 0.2s",cursor:"grab"}}>
            <div style={{padding:"11px 11px 8px",borderBottom:"1px solid "+C.bd}}>
              {editStageId===stage.id
                ?<div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <input autoFocus defaultValue={stage.label}
                      onBlur={e=>{updateStageLabel(stage.id,e.target.value||stage.label);setEditStageId(null);}}
                      onKeyDown={e=>{if(e.key==="Enter"){updateStageLabel(stage.id,(e.target as HTMLInputElement).value||stage.label);setEditStageId(null);}if(e.key==="Escape")setEditStageId(null);}}
                      style={{width:"100%",fontSize:12,fontWeight:600,padding:"4px 8px",border:"1px solid "+stage.color,borderRadius:7,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const}}/>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {FUNNEL_COLORS.map(c=><button key={c} onClick={()=>updateStageColor(stage.id,c)}
                        style={{width:16,height:16,borderRadius:"50%",background:c,border:stage.color===c?"2px solid "+C.t1:"1px solid transparent",cursor:"pointer",padding:0}}/>)}
                    </div>
                    {!isDefaultStage&&<button onClick={()=>{deleteStage(stage.id);setEditStageId(null);}}
                      style={{fontSize:10,color:C.r,background:"transparent",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>
                      Удалить этот этап
                    </button>}
                  </div>
                :<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:stage.color,boxShadow:"0 0 6px "+stage.color+"80",flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:600,color:C.t1}}>{stage.label}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:10,fontWeight:700,color:stage.color,background:stage.color+"18",borderRadius:20,padding:"1px 6px"}}>{stageLeads.length}</span>
                      <button onClick={()=>setEditStageId(stage.id)} title="Настроить этап"
                        style={{width:20,height:20,border:"none",background:"transparent",cursor:"pointer",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",color:C.t2,fontSize:11,opacity:0.5}}>✎</button>
                    </div>
                  </div>
              }
            </div>
            <div style={{padding:"8px 8px 0"}}>
              {stageLeads.length===0&&!isOver&&<div style={{padding:"18px 0",textAlign:"center",color:C.t2,fontSize:11,opacity:0.4}}>Нет лидов</div>}
              {stageLeads.map(l=>leadCard(l,stage.color))}
              {isOver&&dragId&&<div style={{height:44,borderRadius:9,border:"1px dashed "+stage.color,background:stage.color+"08",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11,color:stage.color}}>Перетащи сюда</span></div>}
            </div>
          </div>;
        })}
        {/* Add stage button */}
        <div style={{minWidth:180,flexShrink:0,display:"flex",alignItems:"flex-start",paddingTop:4}}>
          <button onClick={addStage}
            style={{width:"100%",padding:"10px 14px",background:"transparent",border:"1px dashed "+C.bd,borderRadius:14,fontSize:12,color:C.t2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;(e.currentTarget as HTMLElement).style.color=C.a;(e.currentTarget as HTMLElement).style.background=C.a+"08";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.color=C.t2;(e.currentTarget as HTMLElement).style.background="transparent";}}>
            + Добавить этап
          </button>
        </div>
      </div>
    </>}


    {/* LIST */}
    {tab==="list"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,gap:12}}>
        <input placeholder="Поиск по имени, телефону, email..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{...iS(),maxWidth:300,borderRadius:9,fontSize:12,padding:"8px 12px",background:C.ib,border:"1px solid "+C.bd}}/>
        <button onClick={()=>setShow(!show)} style={{padding:"8px 16px",background:C.a,color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",boxShadow:"0 0 16px "+C.a+"30",transition:"all 0.2s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-1px)";(e.currentTarget as HTMLElement).style.boxShadow="0 0 24px "+C.a+"50";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="none";(e.currentTarget as HTMLElement).style.boxShadow="0 0 16px "+C.a+"30";}}>
          + Лид
        </button>
      </div>
      {show&&<div style={{background:C.w,borderRadius:14,padding:18,marginBottom:16,border:"1px solid "+C.bd}} className="form-panel">
        <div style={{fontSize:14,fontWeight:600,marginBottom:14,color:C.t1}}>Новый лид</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {([["name","Имя *"],["contact","Контакт"],["phone","Телефон"],["email","Email"],["note","Описание лида"],["deal","Сделка, ₽"]] as const).map(([k,l])=>(
            <div key={k}>
              <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>{l}</label>
              <input type={k==="deal"?"number":"text"} value={(f as any)[k]} onChange={e=>sF({...f,[k]:e.target.value})}
                style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const,fontFamily:"'Inter',sans-serif"}}/>
            </div>
          ))}
          <div>
            <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>Источник</label>
            <select value={f.source} onChange={e=>sF({...f,source:e.target.value})} style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const}}>
              {SRCS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={sub} style={{padding:"9px 18px",background:C.a,color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer"}}>Добавить</button>
          <button onClick={()=>setShow(false)} style={{padding:"9px 14px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:9,fontSize:12,cursor:"pointer"}}>Отмена</button>
        </div>
      </div>}
      <div style={{background:C.w,borderRadius:14,overflow:"hidden",border:"1px solid "+C.bd}}>
        {found.length===0
          ?<div style={{padding:48,textAlign:"center",color:C.t2,fontSize:13}}>Нет лидов</div>
          :found.map((l:any,i:number)=>(
            <div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<found.length-1?"1px solid "+C.bd:"none",transition:"background 0.1s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=C.ib;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
              {/* Avatar — same as kanban */}
              <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,overflow:"hidden",background:stCol(l.status)+"18",border:"2px solid "+stCol(l.status)+"30",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {l.avatar_url
                  ?<img src={l.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={l.name}/>
                  :<span style={{fontSize:13,fontWeight:700,color:stCol(l.status)}}>{(l.name||"?")[0]?.toUpperCase()}</span>
                }
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
                <div style={{fontSize:11,color:C.t2,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.phone||l.email||l.contact||l.source}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                {l.deal&&<span style={{fontSize:11,fontWeight:600,color:C.g}}>{fmt$(l.deal)}₽</span>}
                <span style={{fontSize:10,fontWeight:600,padding:"2px 9px",borderRadius:20,background:stCol(l.status)+"14",color:stCol(l.status),border:"1px solid "+stCol(l.status)+"25"}}>{stLbl(l.status)}</span>
                {/* Написать */}
                {getWriteUrl(l)&&<a href={getWriteUrl(l)!} target="_blank" rel="noreferrer"
                  style={{padding:"5px 12px",background:"linear-gradient(135deg,#22C55E14,#16A34A10)",color:"#16A34A",border:"1px solid #22C55E30",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",textDecoration:"none",transition:"all 0.15s",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="linear-gradient(135deg,#22C55E,#16A34A)";(e.currentTarget as HTMLElement).style.color="#fff";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="linear-gradient(135deg,#22C55E14,#16A34A10)";(e.currentTarget as HTMLElement).style.color="#16A34A";}}>
                  ✉️ Написать
                </a>}
                {/* Edit */}
                <button onClick={()=>openEditLead(l)} style={{width:28,height:28,borderRadius:7,border:"1px solid "+C.bd,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=C.a+"10";(e.currentTarget as HTMLElement).style.borderColor=C.a+"40";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";(e.currentTarget as HTMLElement).style.borderColor=C.bd;}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.a} strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                {/* Delete */}
                <button onClick={()=>allLeads.remove(l.id)} style={{width:28,height:28,borderRadius:7,border:"1px solid "+C.bd,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.r+"50";(e.currentTarget as HTMLElement).style.background=C.r+"10";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.background="transparent";}}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.r} strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </>}

    {/* New funnel modal (also accessible from within funnel) */}
    {newFunnelModal&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setNewFunnelModal(false)}>
        <div style={{background:"#fff",borderRadius:20,padding:32,width:"100%",maxWidth:440,boxShadow:"0 24px 60px rgba(0,0,0,0.18)"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>Новая воронка продаж</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Название *</label>
              <input autoFocus value={newFunnelName} onChange={e=>setNewFunnelName(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")createFunnel();}} placeholder="Например: Instagram, B2B, Партнёры..." style={iS()}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Описание</label>
              <input value={newFunnelDesc} onChange={e=>setNewFunnelDesc(e.target.value)} placeholder="Краткое описание..." style={iS()}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:8}}>Цвет</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {FUNNEL_COLORS.map(color=>(
                  <button key={color} onClick={()=>setNewFunnelColor(color)}
                    style={{width:32,height:32,borderRadius:10,background:color,border:newFunnelColor===color?"3px solid #1C1C1E":"3px solid transparent",cursor:"pointer"}}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
            <button onClick={()=>setNewFunnelModal(false)} style={{padding:"10px 18px",background:"#F2F2F7",color:"#8E8E93",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>Отмена</button>
            <button onClick={createFunnel} disabled={!newFunnelName.trim()} style={{padding:"10px 20px",background:newFunnelName.trim()?"#007AFF":"#C6C6C8",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:newFunnelName.trim()?"pointer":"default"}}>Создать</button>
          </div>
        </div>
      </div>
    )}
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
  const emptyF=()=>({platform:"instagram",type:"Пост",topic:"",status:"idea",date:"",link:"",scenario:"",cover_url:"",content_url:"",publish_date:""});
  const[f,sF]=useState<any>(emptyF());
  const[calMonth,setCalMonth]=useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()};});

  const uploadCover=async(file:File)=>{
    setCoverUploading(true);
    try{
      const compressed=await new Promise<Blob>((resolve,reject)=>{
        const img=document.createElement("img");
        const obj=URL.createObjectURL(file);
        img.onload=()=>{
          // Preserve ORIGINAL proportions — no forced 1:1 crop
          const MAX=1200;
          const scale=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
          const w=Math.round(img.naturalWidth*scale);
          const h=Math.round(img.naturalHeight*scale);
          const canvas=document.createElement("canvas");
          canvas.width=w; canvas.height=h;
          canvas.getContext("2d")!.drawImage(img,0,0,w,h);
          URL.revokeObjectURL(obj);
          canvas.toBlob(b=>b?resolve(b):reject(),"image/jpeg",0.88);
        };
        img.onerror=reject; img.src=obj;
      });
      const path=userId+"/content_"+Date.now()+".jpg";
      const{error}=await supabase.storage.from("files").upload(path,compressed,{upsert:true,contentType:"image/jpeg"});
      if(error)throw error;
      const{data}=supabase.storage.from("files").getPublicUrl(path);
      sF((prev:any)=>({...prev,cover_url:data.publicUrl}));
    }catch(e){console.error(e);}
    finally{setCoverUploading(false);}
  };

  const downloadPDF=(item:any)=>{
    const win=window.open("","_blank");
    if(!win)return;
    const escapedScenario=(item.scenario||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    win.document.write("<!DOCTYPE html><html><head><meta charset='utf-8'><title>"+item.topic+"</title>"
      +"<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#1a1a2e;line-height:1.6;}"
      +"h1{font-size:26px;font-weight:800;margin-bottom:8px;}"
      +".meta{font-size:13px;color:#666;margin-bottom:24px;}"
      +".badge{background:#f0f4ff;color:#2563eb;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;margin-right:8px;}"
      +".content{background:#f8f9fa;border-radius:8px;padding:16px;font-size:14px;white-space:pre-wrap;line-height:1.8;}"
      +"img{max-width:100%;border-radius:8px;margin-bottom:16px;max-height:360px;object-fit:cover;width:100%;}"
      +"</style></head><body>"
      +(item.cover_url?"<img src='"+item.cover_url+"'/>":"")
      +"<h1>"+item.topic+"</h1>"
      +"<div class='meta'><span class='badge'>"+item.platform+"</span><span class='badge'>"+item.type+"</span>"+(item.date?" &nbsp;📅 "+item.date:"")+"</div>"
      +(item.scenario?"<div style='font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px'>ТЕКСТ / СЦЕНАРИЙ</div><div class='content'>"+escapedScenario+"</div>":"")
      +(item.content_url?"<p style='margin-top:16px'><a href='"+item.content_url+"'>"+item.content_url+"</a></p>":"")
      +"<script>window.onload=function(){window.print();}<\/script>"
      +"</body></html>");
    win.document.close();
  };

  const sub=async()=>{
    if(!f.topic.trim())return;
    const payload={
      platform:f.platform||"instagram",
      type:f.type||"Пост",
      topic:f.topic.trim(),
      status:f.status||"idea",
      date:f.publish_date||"",
      publish_date:f.publish_date||"",
      link:f.content_url||"",
      content_url:f.content_url||"",
      scenario:f.scenario||"",
      cover_url:f.cover_url||"",
      deadline_prep:null,
      deadline_dev:null,
      deadline_pub:null,
    };
    if(editId){await update(editId,payload);setEditId(null);}
    else{await add(payload);}
    sF(emptyF());setShow(false);
  };

  const startEdit=(item:any)=>{
    const publishDate=item.publish_date||item.date||"";
    sF({platform:item.platform||"instagram",type:item.type||"Пост",topic:item.topic||"",status:item.status||"idea",date:publishDate,link:item.content_url||item.link||"",scenario:item.scenario||"",cover_url:item.cover_url||"",content_url:item.content_url||item.link||"",publish_date:publishDate});
    setEditId(item.id);setShow(true);
  };

  const[calDragId,setCalDragId]=useState<string|null>(null);
  const[calDragOver,setCalDragOver]=useState<string|null>(null); // dateStr

  const onCalDragStart=(id:string,e:React.DragEvent)=>{
    setCalDragId(id);
    e.dataTransfer.effectAllowed="move";
  };
  const onCalDragEnd=()=>{setCalDragId(null);setCalDragOver(null);};
  const onCalDayDragOver=(dateStr:string,e:React.DragEvent)=>{e.preventDefault();e.dataTransfer.dropEffect="move";setCalDragOver(dateStr);};
  const onCalDayDrop=async(dateStr:string,e:React.DragEvent)=>{
    e.preventDefault();
    if(calDragId&&calDragId!==dateStr){
      await update(calDragId,{date:dateStr,publish_date:dateStr});
    }
    setCalDragId(null);setCalDragOver(null);
  };

  const CONTENT_STAGES=[
    {id:"idea",label:"💡 Идея",color:"#8B5CF6",hint:"Концепции и темы ждут своей очереди"},
    {id:"progress",label:"🎬 Разработка",color:"#F59E0B",hint:"Съёмка, написание текста, сбор материала"},
    {id:"ready",label:"✂️ Реализация",color:"#3B82F6",hint:"Монтаж, дизайн, финальная правка"},
    {id:"published",label:"🚀 Опубликовано",color:"#10B981",hint:"Вышло в свет — собирает реакции"},
  ];
  const[kanbanDrag,setKanbanDrag]=useState<string|null>(null);
  const[kanbanOver,setKanbanOver]=useState<string|null>(null);

  const onKanbanDragStart=(id:string)=>setKanbanDrag(id);
  const onKanbanDragEnd=()=>{setKanbanDrag(null);setKanbanOver(null);};
  const onKanbanDragOver=(stageId:string,e:React.DragEvent)=>{e.preventDefault();setKanbanOver(stageId);};
  const onKanbanDrop=async(stageId:string)=>{
    if(kanbanDrag&&kanbanDrag!==stageId){
      await update(kanbanDrag,{status:stageId});
    }
    setKanbanDrag(null);setKanbanOver(null);
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

  const[platformFilter,setPlatformFilter]=useState<string>("all");

  const PLATFORM_FILTERS=[
    {id:"all",label:"Все",icon:"🌐"},
    {id:"youtube",label:"YouTube",icon:"▶️"},
    {id:"instagram",label:"Instagram",icon:"📸"},
    {id:"telegram",label:"Telegram",icon:"✈️"},
    {id:"tiktok",label:"TikTok",icon:"🎵"},
    {id:"other",label:"Другое",icon:"📦"},
  ];

  const filteredItems=useMemo(()=>{
    if(platformFilter==="all")return items;
    if(platformFilter==="other"){
      const known=["youtube","instagram","telegram","tiktok"];
      return items.filter((x:any)=>!known.includes((x.platform||"").toLowerCase()));
    }
    return items.filter((x:any)=>(x.platform||"").toLowerCase()===platformFilter);
  },[items,platformFilter]);

  return <>
    {/* ── Platform filter bar ── */}
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
      {PLATFORM_FILTERS.map(pf=>{
        const cnt=pf.id==="all"?items.length
          :pf.id==="other"?items.filter((x:any)=>!["youtube","instagram","telegram","tiktok"].includes((x.platform||"").toLowerCase())).length
          :items.filter((x:any)=>(x.platform||"").toLowerCase()===pf.id).length;
        const isActive=platformFilter===pf.id;
        return<button key={pf.id} onClick={()=>setPlatformFilter(pf.id)}
          style={{
            display:"flex",alignItems:"center",gap:6,
            padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",
            fontSize:12,fontWeight:isActive?700:400,
            background:isActive?C.a:C.ib,
            color:isActive?"#fff":C.t2,
            boxShadow:isActive?"0 0 14px "+C.a+"40":"none",
            transition:"all 0.18s",
          }}
          onMouseEnter={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background=C.bd;}}
          onMouseLeave={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background=C.ib;}}>
          <span>{pf.icon}</span>
          {pf.label}
          {cnt>0&&<span style={{
            background:isActive?"rgba(255,255,255,0.25)":C.a+"20",
            color:isActive?"#fff":C.a,
            borderRadius:20,padding:"0 7px",fontSize:11,fontWeight:700,
          }}>{cnt}</span>}
        </button>;
      })}
    </div>

    {/* ── Dashboard stats ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12,marginBottom:24}}>
      {CONTENT_STAGES.map(stage=>{
        const cnt=filteredItems.filter((x:any)=>x.status===stage.id).length;
        const total=filteredItems.length;
        const pct=total?Math.round(cnt/total*100):0;
        const isMax=cnt>0&&cnt===Math.max(...CONTENT_STAGES.map(s=>filteredItems.filter((x:any)=>x.status===s.id).length));
        return<div key={stage.id} style={{background:C.w,borderRadius:14,padding:"16px 18px",border:"1px solid "+(isMax?stage.color+"40":C.bd),boxShadow:isMax?"0 0 20px "+stage.color+"15":"none",transition:"all 0.2s"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:13,color:C.t2,fontWeight:500}}>{stage.label}</span>
            {isMax&&cnt>0&&<span style={{fontSize:10,background:stage.color+"18",color:stage.color,borderRadius:20,padding:"2px 7px",fontWeight:600}}>больше всего</span>}
          </div>
          <div style={{fontSize:26,fontWeight:800,color:stage.color,marginBottom:6}}>{cnt}</div>
          <div style={{height:4,borderRadius:4,background:C.bd,overflow:"hidden"}}>
            <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+stage.color+","+stage.color+"bb)",borderRadius:4,transition:"width 0.4s"}}/>
          </div>
          <div style={{fontSize:10,color:C.t2,marginTop:4}}>{pct}% от всех</div>
        </div>;
      })}
    </div>

    {/* ── Tabs ── */}
    <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"2px solid "+C.bd}}>
      {[{id:"list",label:"📋 Канбан"},{id:"calendar",label:"Календарь"},{id:"stories",label:"📊 Карусели историй"}].map(t=><button key={t.id} onClick={()=>setTab(t.id as any)} style={{padding:"10px 20px",background:"none",border:"none",borderBottom:tab===t.id?"3px solid "+C.a:"3px solid transparent",color:tab===t.id?C.a:C.t2,fontSize:14,fontWeight:tab===t.id?600:400,cursor:"pointer",marginBottom:-2}}>{t.label}</button>)}
    </div>

    {/* ── KANBAN TAB ── */}
    {tab==="list"&&<>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:C.t1}}>Контент-план</div>
          <div style={{fontSize:12,color:C.t2,marginTop:2}}>Перетаскивай карточки между этапами</div>
        </div>
        <button onClick={()=>{setShow(!show);setEditId(null);sF(emptyF());}}
          style={{padding:"9px 18px",background:C.a,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 0 16px "+C.a+"30"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          + Контент
        </button>
      </div>

      {/* Form */}
      {show&&<Card style={{marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:18}}>{editId?"Редактировать":"Добавить контент"}</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}}>
          {/* Cover upload — preserves aspect ratio */}
          <div style={{gridRow:"span 2",display:"flex",flexDirection:"column",gap:8}}>
            <label style={{fontSize:12,color:C.t2,fontWeight:600}}>Обложка</label>
            <label style={{cursor:"pointer",flex:1}}>
              <div style={{width:"100%",minHeight:120,background:C.ib,borderRadius:12,border:"2px dashed "+C.bd,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                {coverUploading
                  ? <div style={{width:24,height:24,border:"3px solid "+C.bd,borderTopColor:C.a,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  : f.cover_url
                  ? <img src={f.cover_url} style={{width:"100%",height:"100%",objectFit:"contain",display:"block"}} alt="cover"/>
                  : <div style={{textAlign:"center",padding:16}}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5" style={{marginBottom:6}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <div style={{fontSize:11,color:C.t2}}>Загрузить фото</div>
                      <div style={{fontSize:10,color:C.t2,opacity:0.6,marginTop:2}}>Сохраняется в оригинальных пропорциях</div>
                    </div>
                }
              </div>
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadCover(e.target.files[0]);}}/>
            </label>
            {f.cover_url&&<button onClick={()=>sF({...f,cover_url:""})} style={{fontSize:11,color:C.r,background:"transparent",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>✕ Удалить обложку</button>}
          </div>

          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Тема *</label><input value={f.topic} onChange={e=>sF({...f,topic:e.target.value})} style={iS()}/></div>

          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Платформа</label>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 10px",border:"1px solid "+C.bd,borderRadius:8,background:C.ib,height:38}}>
              <PlatformIcon pid={f.platform} size={18}/>
              <select value={f.platform} onChange={e=>sF({...f,platform:e.target.value})} style={{flex:1,border:"none",background:"transparent",fontSize:13,outline:"none",fontFamily:"'Inter',sans-serif",cursor:"pointer",color:C.t1}}>
                {PLATS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Тип</label><select value={f.type} onChange={e=>sF({...f,type:e.target.value})} style={iS()}>{CTYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Статус</label><select value={f.status} onChange={e=>sF({...f,status:e.target.value})} style={iS()}>{CSTATS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Дата публикации</label><input type="date" value={f.publish_date||""} onChange={e=>sF({...f,publish_date:e.target.value,date:e.target.value})} style={iS()}/></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Ссылка на контент</label><input value={f.content_url} onChange={e=>sF({...f,content_url:e.target.value})} placeholder="https://..." style={iS()}/></div>

          {/* Scenario / content text — full width, large */}
          <div style={{gridColumn:isMobile?"1 / -1":"span 3"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <label style={{fontSize:12,color:C.t2,fontWeight:600}}>Сценарий / Текст контента</label>
              <span style={{fontSize:10,color:C.t2,opacity:0.6}}>{f.scenario?.length||0} символов</span>
            </div>
            <textarea value={f.scenario} onChange={e=>sF({...f,scenario:e.target.value})}
              rows={8} placeholder={"Напиши сценарий, текст поста, хэштеги, описание видео...\n\nМожно структурировать:\n• Крючок: ...\n• Основная мысль: ...\n• Призыв к действию: ..."}
              style={{...iS(),resize:"vertical",lineHeight:"1.6",fontFamily:"'Inter',sans-serif"}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
          <Btn onClick={sub}>{editId?"Сохранить":"Добавить"}</Btn>
          {editId&&f.scenario&&<button onClick={()=>downloadPDF({...f,id:editId})}
            style={{padding:"9px 16px",background:"linear-gradient(135deg,#16A34A,#15803D)",color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 0 12px rgba(22,163,74,0.3)"}}>
            📄 Скачать PDF
          </button>}
          <Btn primary={false} onClick={()=>{setShow(false);setEditId(null);}}>Отмена</Btn>
        </div>
      </Card>}

      {/* KANBAN BOARD */}
      <div style={{display:"flex",gap:14,overflowX:"auto",alignItems:"flex-start",paddingBottom:16,scrollbarWidth:"none"}}>
        {CONTENT_STAGES.map(stage=>{
          const stageItems=filteredItems.filter((x:any)=>x.status===stage.id);
          const isOver=kanbanOver===stage.id;
          return<div key={stage.id}
            onDragOver={e=>onKanbanDragOver(stage.id,e)}
            onDrop={()=>onKanbanDrop(stage.id)}
            onDragLeave={()=>setKanbanOver(null)}
            style={{
              minWidth:260,width:260,flexShrink:0,
              background:isOver?C.a+"06":C.ib,
              borderRadius:14,
              border:"1px solid "+(isOver?stage.color+"50":C.bd),
              boxShadow:isOver?"0 0 20px "+stage.color+"15":"none",
              transition:"all 0.2s",
              overflow:"hidden",
            }}>
            {/* Column header */}
            <div style={{padding:"14px 14px 10px",borderBottom:"1px solid "+C.bd}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:stage.color,boxShadow:"0 0 6px "+stage.color+"80"}}/>
                  <span style={{fontSize:13,fontWeight:700,color:C.t1}}>{stage.label}</span>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:stage.color,background:stage.color+"15",borderRadius:20,padding:"2px 8px"}}>{stageItems.length}</span>
              </div>
              <div style={{fontSize:10,color:C.t2,lineHeight:1.4}}>{stage.hint}</div>
            </div>

            {/* Cards */}
            <div style={{padding:"10px 10px",display:"flex",flexDirection:"column",gap:8,minHeight:80}}>
              {stageItems.length===0&&!isOver&&(
                <div style={{padding:"20px 0",textAlign:"center",color:C.t2,fontSize:11,opacity:0.4}}>Пусто</div>
              )}
              {stageItems.map((x:any)=>(
                <div key={x.id}
                  draggable
                  onDragStart={()=>onKanbanDragStart(x.id)}
                  onDragEnd={onKanbanDragEnd}
                  style={{
                    background:C.w,borderRadius:10,padding:"12px 12px",
                    border:"1px solid "+C.bd,
                    borderLeft:"3px solid "+stage.color,
                    cursor:"grab",
                    opacity:kanbanDrag===x.id?0.4:1,
                    transition:"all 0.15s",
                    boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                    animation:"leadPulse 5s ease-in-out infinite",
                  }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px "+stage.color+"20";(e.currentTarget as HTMLElement).style.borderColor=stage.color+"60";(e.currentTarget as HTMLElement).style.animationPlayState="paused";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 1px 4px rgba(0,0,0,0.06)";(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.borderLeftColor=stage.color;(e.currentTarget as HTMLElement).style.animationPlayState="running";}}>

                  {/* Card top: platform + type */}
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
                    {x.cover_url
                      ?<img src={x.cover_url} style={{width:28,height:28,borderRadius:6,objectFit:"cover",flexShrink:0}} alt=""/>
                      :<div style={{width:28,height:28,borderRadius:6,background:C.ib,border:"1px solid "+C.bd,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><PlatformIcon pid={x.platform} size={14}/></div>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{x.topic}</div>
                      <div style={{fontSize:10,color:C.t2,marginTop:1}}>{x.type} · <span style={{color:pCol(x.platform)}}>{pLbl(x.platform)}</span></div>
                    </div>
                  </div>

                  {/* Scenario preview */}
                  {x.scenario&&<div style={{fontSize:11,color:C.t2,lineHeight:1.4,marginBottom:8,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any}}>{x.scenario}</div>}

                  {/* Date + actions */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
                    {x.date?<span style={{fontSize:10,color:C.t2}}>📅 {x.date}</span>:<span/>}
                    <div style={{display:"flex",gap:4}}>
                      {x.content_url&&<a href={x.content_url} target="_blank" rel="noreferrer"
                        style={{width:24,height:24,borderRadius:6,background:C.a+"12",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none"}}
                        onClick={e=>e.stopPropagation()}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.a} strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>}
                      {x.scenario&&<button onClick={e=>{e.stopPropagation();downloadPDF(x);}}
                        title="Скачать PDF"
                        style={{width:24,height:24,borderRadius:6,border:"none",background:"#16A34A12",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                      </button>}
                      <button onClick={e=>{e.stopPropagation();startEdit(x);}}
                        style={{width:24,height:24,borderRadius:6,border:"none",background:C.ib,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.a} strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={e=>{e.stopPropagation();remove(x.id);}}
                        style={{width:24,height:24,borderRadius:6,border:"none",background:C.ib,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.r} strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Move to next stage quick button */}
                  {stage.id!=="published"&&(()=>{
                    const nextIdx=CONTENT_STAGES.findIndex(s=>s.id===stage.id)+1;
                    const next=CONTENT_STAGES[nextIdx];
                    return next?<button
                      onMouseDown={e=>e.stopPropagation()}
                      onClick={e=>{e.stopPropagation();update(x.id,{status:next.id});}}
                      style={{marginTop:8,width:"100%",padding:"5px 0",background:next.color+"10",border:"1px solid "+next.color+"25",borderRadius:7,fontSize:10,color:next.color,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=next.color+"20";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=next.color+"10";}}>
                      → {next.label}
                    </button>:null;
                  })()}
                </div>
              ))}

              {/* Drop zone indicator */}
              {isOver&&kanbanDrag&&(
                <div style={{height:60,borderRadius:10,border:"1px dashed "+stage.color,background:stage.color+"06",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:11,color:stage.color}}>Перетащи сюда</span>
                </div>
              )}
            </div>
          </div>;
        })}
      </div>
    </>}

    {/* CALENDAR TAB */}
    {tab==="calendar"&&<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setCalMonth(m=>m.m===0?{y:m.y-1,m:11}:{y:m.y,m:m.m-1})} style={{width:34,height:34,border:"1px solid "+C.bd,borderRadius:9,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
          <span style={{fontSize:16,fontWeight:700,color:C.t1,minWidth:160,textAlign:"center"}}>{MS[calMonth.m]} {calMonth.y}</span>
          <button onClick={()=>setCalMonth(m=>m.m===11?{y:m.y+1,m:0}:{y:m.y,m:m.m+1})} style={{width:34,height:34,border:"1px solid "+C.bd,borderRadius:9,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
          <button onClick={()=>setCalMonth({y:new Date().getFullYear(),m:new Date().getMonth()})} style={{padding:"6px 12px",background:C.a+"14",color:C.a,border:"1px solid "+C.a+"30",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Сегодня</button>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,color:C.t2,opacity:0.6}}>Перетащи карточку на нужный день</span>
          {CONTENT_STAGES.map(s=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.t2}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:s.color}}/>
              {s.label.replace(/[^\s]+\s/,"")}
            </div>
          ))}
        </div>
      </div>

      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"2px solid "+C.bd,background:C.ib}}>
          {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d=>(
            <div key={d} style={{padding:"10px",textAlign:"center",fontSize:11,fontWeight:700,color:C.t2,letterSpacing:0.5}}>{d}</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {calDays.map((d,i)=>{
            const dateStr=d?ds(d):"";
            const dayItems=d?itemsForDay(d):[];
            const isT=d&&dateStr===today();
            const isDragOver=calDragOver===dateStr&&!!dateStr;
            const isDraggingDay=calDragId&&dayItems.some((x:any)=>x.id===calDragId);

            return<div key={i}
              onDragOver={e=>{if(d)onCalDayDragOver(dateStr,e);}}
              onDrop={e=>{if(d)onCalDayDrop(dateStr,e);}}
              onDragLeave={e=>{
                // Only clear if leaving the cell entirely
                if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){
                  setCalDragOver(null);
                }
              }}
              onClick={()=>{if(d&&!calDragId){sF({...emptyF(),publish_date:dateStr,date:dateStr});setShow(true);setTab("list");}}}
              style={{
                minHeight:110,padding:"6px",
                borderRight:i%7!==6?"1px solid "+C.bd+"66":"none",
                borderBottom:"1px solid "+C.bd+"66",
                background:isDragOver?"rgba(37,99,235,0.08)":(isT?"rgba(37,99,235,0.03)":"transparent"),
                cursor:d?"pointer":"default",
                transition:"background 0.15s",
                outline:isDragOver?"2px dashed "+C.a:"none",
                outlineOffset:-2,
                position:"relative",
              }}
              onMouseEnter={e=>{if(d&&!calDragId)(e.currentTarget as HTMLElement).style.background=isT?"rgba(37,99,235,0.06)":C.ib;}}
              onMouseLeave={e=>{if(!isDragOver)(e.currentTarget as HTMLElement).style.background=isT?"rgba(37,99,235,0.03)":"transparent";}}>

              {/* Drop indicator */}
              {isDragOver&&<div style={{position:"absolute",inset:2,borderRadius:6,border:"2px dashed "+C.a,background:C.a+"06",pointerEvents:"none",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:10,color:C.a,fontWeight:600}}>📅 Перенести сюда</span>
              </div>}

              {d&&<>
                <div style={{display:"flex",justifyContent:"center",marginBottom:4}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:isT?C.a:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:12,fontWeight:isT?700:400,color:isT?"#fff":C.t1}}>{d.getDate()}</span>
                  </div>
                </div>
                {dayItems.slice(0,3).map((x:any)=>{
                  const stage=CONTENT_STAGES.find(s=>s.id===x.status);
                  const col=stage?.color||C.a;
                  const isDragging=calDragId===x.id;
                  return<div key={x.id}
                    draggable
                    onDragStart={e=>{e.stopPropagation();onCalDragStart(x.id,e);}}
                    onDragEnd={e=>{e.stopPropagation();onCalDragEnd();}}
                    onClick={e=>{e.stopPropagation();if(!calDragId)startEdit(x);}}
                    style={{
                      marginBottom:3,borderRadius:5,overflow:"hidden",
                      border:"1px solid "+col+"30",
                      background:isDragging?"rgba(0,0,0,0.05)":col+"10",
                      borderLeft:"2px solid "+col,
                      cursor:"grab",padding:"2px 5px",
                      opacity:isDragging?0.35:1,
                      transform:isDragging?"scale(0.97)":"none",
                      transition:"opacity 0.15s,transform 0.15s",
                      userSelect:"none",
                    }}>
                    {x.cover_url&&!isDragging&&(
                      <img src={x.cover_url} style={{width:"100%",height:28,objectFit:"cover",display:"block",borderRadius:"2px 2px 0 0",marginBottom:2}} alt=""/>
                    )}
                    <div style={{display:"flex",alignItems:"center",gap:3}}>
                      <PlatformIcon pid={x.platform} size={9}/>
                      <span style={{fontSize:9,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,color:C.t1,fontWeight:500}}>{x.topic}</span>
                    </div>
                  </div>;
                })}
                {dayItems.length>3&&(
                  <div style={{fontSize:9,color:C.t2,textAlign:"center",cursor:"pointer",padding:"2px 0"}}
                    onClick={e=>e.stopPropagation()}>
                    +{dayItems.length-3} ещё
                  </div>
                )}
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
            {an.maxDrop>0&&<div style={{background:color+"0A",borderRadius:8,padding:"7px 10px",border:"1px solid "+color+"22"}}>
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

        return <div key={car.id} style={{background:C.w,borderRadius:20,boxShadow:C.sh,border:"1px solid "+C.bd,overflow:"hidden"}}>
          {/* Header */}
          <div style={{padding:"14px 20px",borderBottom:"1px solid "+C.bd,display:"flex",alignItems:"center",justifyContent:"space-between",background:C.ib}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {editTitleId===car.id
                ? <input autoFocus value={editTitleVal} onChange={e=>setEditTitleVal(e.target.value)}
                    onBlur={()=>saveTitle(car.id)} onKeyDown={e=>{if(e.key==="Enter")saveTitle(car.id);if(e.key==="Escape")setEditTitleId(null);}}
                    style={{...iS(),padding:"6px 10px",fontSize:15,fontWeight:700,width:240}}/>
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
            <div style={{width:240,flexShrink:0,padding:"16px 14px",borderRight:"1px solid "+C.bd,display:"flex",flexDirection:"column",gap:12,background:C.ib}}>
              <PlatformAnalytics slots={slots} platform="ig" color={IG_COLOR} icon={<IgIcon/>}/>
              <PlatformAnalytics slots={slots} platform="tg" color={TG_COLOR} icon={<TgIcon/>}/>
            </div>

            {/* Stories strip */}
            <div style={{flex:1,overflowX:"auto",padding:"14px 14px 12px",background:C.bg}}>
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
                  const borderColor=igIsMax||igIsAfter?IG_COLOR:tgIsMax||tgIsAfter?TG_COLOR:C.bd;

                  return <div key={slot.id} style={{display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
                    {igIsMax&&<div style={{position:"absolute",right:-14,top:16,zIndex:10,fontSize:13}}>🩷</div>}
                    {tgIsMax&&<div style={{position:"absolute",right:-14,top:igIsMax?32:16,zIndex:10,fontSize:13}}>💙</div>}

                    {/* Bar chart */}
                    <div style={{width:140,height:48,display:"flex",alignItems:"flex-end",justifyContent:"center",gap:4,marginBottom:4}}>
                      {(slot.ig_view_count>0||slot.tg_view_count>0)&&<>
                        <div style={{width:18,borderRadius:"3px 3px 0 0",background:igIsMax||igIsAfter?IG_COLOR:IG_COLOR+"99",height:igBarH,transition:"height 0.3s",minHeight:slot.ig_view_count>0?4:0}}/>
                        <div style={{width:18,borderRadius:"3px 3px 0 0",background:tgIsMax||tgIsAfter?TG_COLOR:TG_COLOR+"99",height:tgBarH,transition:"height 0.3s",minHeight:slot.tg_view_count>0?4:0}}/>
                      </>}
                    </div>

                    {/* Story card */}
                    <div style={{width:140,borderRadius:16,overflow:"hidden",
                      border:`2px solid ${borderColor}`,
                      boxShadow:(anyMax||anyAfter)?"0 0 0 3px "+borderColor+"22":C.sh,
                      transition:"border 0.2s",background:C.w}}>

                      {/* Image area */}
                      <div style={{
                        width:140,height:190,
                        background:C.ib,
                        cursor:"pointer",position:"relative",
                        display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"
                      }}
                        onClick={()=>(slot.image_url&&slot.image_url.startsWith("http"))&&!uploading&&setLightbox(slot.image_url)}>
                        {uploading===slot.id
                          ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                              <div style={{width:24,height:24,border:"3px solid "+C.bd,borderTopColor:C.a,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                              <span style={{fontSize:9,color:C.t2}}>Загрузка...</span>
                            </div>
                          : (slot.image_url&&slot.image_url.startsWith("http"))
                          ? <img src={slot.image_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={`Сторис ${idx+1}`}/>
                          : <label style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,width:"100%",height:"100%",justifyContent:"center"}}>
                              <div style={{width:44,height:44,borderRadius:12,background:C.bd,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              </div>
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

                      {/* Number + inputs */}
                      <div style={{padding:"8px 8px 10px",background:C.w,borderTop:"1px solid "+C.bd}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                          <div style={{fontSize:11,fontWeight:700,color:C.t2}}>Сторис #{idx+1}</div>
                          <button onClick={()=>items.remove(slot.id)}
                            style={{width:18,height:18,borderRadius:5,border:"none",background:C.r+"15",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.r} strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:5,background:IG_COLOR+"12",borderRadius:8,padding:"5px 7px",border:"1px solid "+IG_COLOR+"25"}}>
                          <IgIcon/>
                          <input type="number" value={slot.ig_view_count||""} onChange={e=>items.update(slot.id,{ig_view_count:+e.target.value||0})}
                            placeholder="IG"
                            style={{flex:1,border:"none",background:"transparent",fontSize:11,outline:"none",fontFamily:"'Inter',sans-serif",color:C.t1,minWidth:0,textAlign:"center"}}/>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:4,background:TG_COLOR+"12",borderRadius:8,padding:"5px 7px",border:"1px solid "+TG_COLOR+"25"}}>
                          <TgIcon/>
                          <input type="number" value={slot.tg_view_count||""} onChange={e=>items.update(slot.id,{tg_view_count:+e.target.value||0})}
                            placeholder="TG"
                            style={{flex:1,border:"none",background:"transparent",fontSize:11,outline:"none",fontFamily:"'Inter',sans-serif",color:C.t1,minWidth:0,textAlign:"center"}}/>
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
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Тип</label><select value={f.type} onChange={e=>sF({...f,type:e.target.value})} style={iS()}><option value="income">Доход</option><option value="expense">Расход</option></select></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Сумма</label><input type="number" value={f.amount} onChange={e=>sF({...f,amount:e.target.value})} style={iS()}/></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Категория</label><select value={f.category} onChange={e=>sF({...f,category:e.target.value})} style={iS()}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Дата</label><input type="date" value={f.date} onChange={e=>sF({...f,date:e.target.value})} style={iS()}/></div>
      <div style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Комментарий</label><input value={f.comment} onChange={e=>sF({...f,comment:e.target.value})} style={iS()}/></div>
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
        <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Дата</label><input type="date" value={f.date} onChange={e=>sF({...f,date:e.target.value})} style={iS()}/></div>
        {([["ig","Instagram (подписчики)"],["yt","YouTube (подписчики)"],["tg","Telegram (подписчики)"],["oth","Другие"]] as const).map(([k,l])=><div key={k}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{l}</label><input type="number" value={(f as any)[k]} onChange={e=>sF({...f,[k]:+e.target.value})} style={iS()}/></div>)}
        {([["ig_story","Охват Stories IG"],["tg_story","Охват Telegram"]] as const).map(([k,l])=><div key={k} style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{l}</label><input type="number" value={(f as any)[k]} onChange={e=>sF({...f,[k]:+e.target.value})} style={iS()}/></div>)}
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
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Название</label><input value={f.name} onChange={e=>sF({...f,name:e.target.value})} style={iS()}/></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Платформа</label><select value={f.platform} onChange={e=>sF({...f,platform:e.target.value})} style={iS()}>{SRCS.map(s=><option key={s}>{s}</option>)}</select></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Статус</label><select value={f.status} onChange={e=>sF({...f,status:e.target.value})} style={iS()}><option value="active">Активна</option><option value="paused">Пауза</option><option value="done">Завершена</option></select></div>
      {([["budget","Бюджет"],["spent","Потрачено"],["leads","Лиды"],["revenue","Выручка"],["reach","Охват"],["impressions","Показы"],["clicks","Клики"],["period","Период"]] as const).map(([k,l])=><div key={k}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{l}</label><input type={k==="period"?"text":"number"} value={(f as any)[k]} onChange={e=>sF({...f,[k]:e.target.value})} style={iS()}/></div>)}
      <div style={{gridColumn:"span 3"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Описание</label><input value={f.description} onChange={e=>sF({...f,description:e.target.value})} style={iS()}/></div>
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

  const callsForDay=(d:Date)=>calls.filter((c:any)=>c.date===ds(d)).sort((a:any,b:any)=>(a.time_start||"").localeCompare(b.time_start||""));

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
      .sort((a:any,b:any)=>a.date===b.date?(a.time_start||"").localeCompare(b.time_start||""):a.date.localeCompare(b.date))
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
                    boxShadow:isDone?"none":"0 2px 8px "+cc+"28",
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
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Название созвона</label><input value={f.title} onChange={e=>sF({...f,title:e.target.value})} placeholder="Разбор воронки с Игнатом..." style={iS()}/></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Дата</label><input type="date" value={f.date} onChange={e=>sF({...f,date:e.target.value})} style={iS()}/></div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Начало</label><input type="time" value={f.time_start} onChange={e=>sF({...f,time_start:e.target.value})} style={iS()}/></div>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Конец</label><input type="time" value={f.time_end} onChange={e=>sF({...f,time_end:e.target.value})} style={iS()}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Сеттер</label><input value={f.setter_name} onChange={e=>sF({...f,setter_name:e.target.value})} placeholder="Кто назначил..." style={iS()}/></div>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Ответственный</label><input value={f.responsible_name} onChange={e=>sF({...f,responsible_name:e.target.value})} placeholder="Кто проводит..." style={iS()}/></div>
          </div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Тип созвона</label>
            <select value={f.goal} onChange={e=>sF({...f,goal:e.target.value})} style={iS()}>
              {CALL_GOALS.map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          {f.goal==="Своя цель"&&<div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Название</label><input value={f.custom_goal} onChange={e=>sF({...f,custom_goal:e.target.value})} placeholder="Введи название..." style={iS()}/></div>}
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Ссылка на встречу</label><input value={f.link} onChange={e=>sF({...f,link:e.target.value})} placeholder="zoom.us/j/..." style={iS()}/></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Комментарий</label><textarea value={f.description} onChange={e=>sF({...f,description:e.target.value})} rows={2} style={{...iS(),resize:"none"}}/></div>
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
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Сумма</label><input type="number" value={goal.amount} onChange={e=>sGoal({...goal,amount:+e.target.value})} style={iS()}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Период</label><select value={goal.period} onChange={e=>sGoal({...goal,period:e.target.value})} style={iS()}><option value="month">Месяц</option><option value="quarter">Квартал</option></select></div>
      </div></Card>
      <Card><div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Воронка</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Чек</label><input type="number" value={p.check} onChange={e=>sP({...p,check:+e.target.value||1})} style={iS()}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Звонок→продажа %</label><input type="number" value={p.convCall} onChange={e=>sP({...p,convCall:+e.target.value||1})} style={iS()}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Лид→звонок %</label><input type="number" value={p.convLead} onChange={e=>sP({...p,convLead:+e.target.value||1})} style={iS()}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Трафик→лид %</label><input type="number" value={p.convTraffic} onChange={e=>sP({...p,convTraffic:+e.target.value||1})} style={iS()}/></div>
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

  const LINK_COLORS=[C.a,"#8B5CF6","#10B981","#EF4444","#F59E0B","#EC4899","#06B6D4","#F97316","#1F1F1F"];
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
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Название *</label><input value={f.title} onChange={e=>sF({...f,title:e.target.value})} placeholder="Google Analytics" style={iS()}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>URL *</label><input value={f.url} onChange={e=>sF({...f,url:e.target.value})} placeholder="analytics.google.com" style={iS()}/></div>
        <div style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Описание</label><input value={f.description} onChange={e=>sF({...f,description:e.target.value})} placeholder="Краткое описание что это и зачем..." style={iS()}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Категория</label>
          <input value={f.category} onChange={e=>sF({...f,category:e.target.value})} list="cats" style={iS()} placeholder="Общее"/>
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
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по ссылкам..." style={{...iS(),paddingLeft:34}}/>
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
        <input value={fName} onChange={e=>setFName(e.target.value)} placeholder="Мой файл..." style={iS()}/>
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
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск файлов..." style={{...iS(),paddingLeft:34}}/>
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

/* ============ AI CHAT BASE ============ */
const AI_AVATAR="/ai-avatar.png";
const MAX_CHATS=20;

type AIMsg={role:"user"|"assistant",content:string,file?:{name:string,data:string,type:string}};
type AIChat={id:string,title:string,msgs:AIMsg[],createdAt:number};

interface AIChatTheme{
  bg:string; sbBg:string; sbActiveBg:string; sbActiveBorder:string;
  headerBg:string; headerGlow:string; headerBorderColor:string;
  avatarBorder:string; avatarGlow:string;
  userMsgBg:string; userMsgBorder:string; userMsgText:string; userMsgGlow:string;
  aiMsgBg:string; aiMsgBorder:string; aiMsgGlow:string;
  inputBg:string; inputBorderFocus:string; inputGlow:string;
  btnBg:string; btnGlow:string;
  dotColor:string; accentColor:string; textColor:string;
  onlineDot:string;
}

const AI_THEMES:Record<string,AIChatTheme>={
  ai:{
    bg:"#0A0E1A",sbBg:"#080D18",sbActiveBg:"#111827",sbActiveBorder:"#00C2FF",
    headerBg:"linear-gradient(180deg,#0D1533,#0A0E1A)",headerGlow:"0 4px 30px rgba(0,194,255,0.15)",headerBorderColor:"rgba(0,194,255,0.15)",
    avatarBorder:"#00C2FF",avatarGlow:"0 0 16px rgba(0,194,255,0.5)",
    userMsgBg:"#1A2744",userMsgBorder:"rgba(0,194,255,0.3)",userMsgText:"#E8F4FF",userMsgGlow:"0 2px 12px rgba(0,194,255,0.12)",
    aiMsgBg:"#0F1628",aiMsgBorder:"rgba(0,194,255,0.15)",aiMsgGlow:"0 2px 20px rgba(0,194,255,0.08)",
    inputBg:"#111827",inputBorderFocus:"#00C2FF",inputGlow:"0 0 12px rgba(0,194,255,0.25)",
    btnBg:"linear-gradient(135deg,#0066FF,#00C2FF)",btnGlow:"0 4px 16px rgba(0,194,255,0.4)",
    dotColor:"#00C2FF",accentColor:"#00C2FF",textColor:"#fff",onlineDot:"#00C2FF",
  },
  script:{
    bg:"#130A00",sbBg:"#0A0500",sbActiveBg:"#1A0D00",sbActiveBorder:"#FF8C00",
    headerBg:"linear-gradient(180deg,#1F0F00,#130A00)",headerGlow:"0 4px 30px rgba(255,100,0,0.2)",headerBorderColor:"rgba(255,140,0,0.2)",
    avatarBorder:"#FF8C00",avatarGlow:"0 0 16px rgba(255,140,0,0.5)",
    userMsgBg:"linear-gradient(135deg,#2A1500,#1F1000)",userMsgBorder:"rgba(255,140,0,0.35)",userMsgText:"#FFE8CC",userMsgGlow:"0 2px 15px rgba(255,100,0,0.15)",
    aiMsgBg:"#1A0D00",aiMsgBorder:"rgba(255,140,0,0.15)",aiMsgGlow:"0 2px 12px rgba(255,100,0,0.08)",
    inputBg:"#0F0800",inputBorderFocus:"#FF8C00",inputGlow:"0 0 12px rgba(255,140,0,0.3)",
    btnBg:"linear-gradient(135deg,#FF8C00,#FF5500)",btnGlow:"0 4px 16px rgba(255,100,0,0.4)",
    dotColor:"#FF8C00",accentColor:"#FF8C00",textColor:"#fff",onlineDot:"#FF8C00",
  },
  product:{
    bg:"#0C0A1A",sbBg:"#08061A",sbActiveBg:"#13103A",sbActiveBorder:"#7B61FF",
    headerBg:"linear-gradient(180deg,#130F2A,#0C0A1A)",headerGlow:"0 4px 30px rgba(123,97,255,0.2)",headerBorderColor:"rgba(123,97,255,0.2)",
    avatarBorder:"#7B61FF",avatarGlow:"0 0 16px rgba(168,255,0,0.3), 0 0 32px rgba(123,97,255,0.3)",
    userMsgBg:"linear-gradient(135deg,#1A1535,#0F1A10)",userMsgBorder:"rgba(123,97,255,0.4)",userMsgText:"#EEE8FF",userMsgGlow:"0 2px 16px rgba(123,97,255,0.15)",
    aiMsgBg:"#100E20",aiMsgBorder:"rgba(168,255,0,0.15)",aiMsgGlow:"0 2px 12px rgba(168,255,0,0.08)",
    inputBg:"#0A0818",inputBorderFocus:"#7B61FF",inputGlow:"0 0 12px rgba(123,97,255,0.3)",
    btnBg:"linear-gradient(135deg,#7B61FF,#A8FF00)",btnGlow:"0 4px 16px rgba(123,97,255,0.4)",
    dotColor:"#7B61FF",accentColor:"#A8FF00",textColor:"#fff",onlineDot:"#A8FF00",
  },
  stories:{
    bg:"#120018",sbBg:"#0A0010",sbActiveBg:"#1A0025",sbActiveBorder:"#CC00FF",
    headerBg:"linear-gradient(180deg,#200030,#120018)",headerGlow:"0 4px 40px rgba(204,0,255,0.25)",headerBorderColor:"rgba(204,0,255,0.2)",
    avatarBorder:"#CC00FF",avatarGlow:"0 0 20px rgba(204,0,255,0.6)",
    userMsgBg:"linear-gradient(135deg,#2A0040,#1A0030)",userMsgBorder:"rgba(204,0,255,0.4)",userMsgText:"#F5CCFF",userMsgGlow:"0 2px 20px rgba(204,0,255,0.2)",
    aiMsgBg:"#180025",aiMsgBorder:"rgba(255,68,204,0.2)",aiMsgGlow:"0 2px 16px rgba(204,0,255,0.1)",
    inputBg:"#0E0018",inputBorderFocus:"#CC00FF",inputGlow:"0 0 16px rgba(204,0,255,0.35)",
    btnBg:"linear-gradient(135deg,#CC00FF,#FF44CC)",btnGlow:"0 4px 16px rgba(204,0,255,0.5)",
    dotColor:"#CC00FF",accentColor:"#FF44CC",textColor:"#fff",onlineDot:"#CC00FF",
  },
};

const AI_CONFIG:{[k:string]:{name:string,avatar:string,storageKey:string,welcome?:string,suggestions?:string[]}}={
  ai:{name:"Kirill Scales AI",avatar:"/icon-ai.png",storageKey:"ks_ai_chats",
    welcome:"Привет! Я твой AI-ассистент по бизнесу и маркетингу.\n\nСпрашивай что угодно — стратегия, продажи, контент, офферы.",
    suggestions:["Как увеличить конверсию в консалтинге?","Напиши скрипт для первого созвона с лидом","Какие метрики важны для онлайн-бизнеса?","Помоги составить оффер для клиента","Как выстроить систему продаж с нуля?","Идеи для контента про предпринимательство"]},
  script:{name:"Vizzy Copy AI",avatar:"/icon-copy.png",storageKey:"copy_ai_chats",
    welcome:"Привет! Я Vizzy Copy AI — пишу сценарии для видео.\n\nМы делаем **короткое видео для Reels/TikTok** или **длинное для YouTube**?",
    suggestions:["Reels — до 60 секунд","YouTube — длинное видео"]},
  product:{name:"Vizzy Product AI",avatar:"/icon-product.png",storageKey:"product_ai_chats",
    welcome:"Привет! Я Vizzy Product AI.\n\n**Создай цифровой продукт за 10 минут.**\n\nЯ задам 7 вопросов и сгенерирую готовый продукт.\n\n**Вопрос 1 из 7.** Что ты умеешь делать лучше всего? В какой теме ты эксперт?"},
  stories:{name:"Vizzy Stories AI",avatar:"/icon-stories.png",storageKey:"stories_ai_chats",
    welcome:"Привет! Я Vizzy Stories AI.\n\nСоздаю серии историй для Instagram и Telegram.\n\n**Вопрос 1 из 3.** Загрузи скрин аккаунта или опиши себя в двух словах.",
    suggestions:["📱 Reels / TikTok","🎥 YouTube","📸 Instagram Stories","📢 Telegram"]},
};

const AI_BETA_WARNING="AI-функции работают только при открытом окне. Они всё ещё в beta-версии, поэтому ответы могут глючить, теряться или работать нестабильно.";

function AiBetaNotice({theme}:{theme:AIChatTheme}){return <div style={{margin:"10px 16px 0",padding:"10px 12px",borderRadius:10,background:"rgba(245,158,11,0.10)",border:"1px solid rgba(245,158,11,0.25)",color:"#FBBF24",fontSize:11,lineHeight:1.45,fontWeight:500}}>
  ⚠️ {AI_BETA_WARNING}
</div>;}

function AIChatBase({pageId,system}:{pageId:string,system?:string}){
  const isMobile=useIsMobile();
  const theme=AI_THEMES[pageId]||AI_THEMES.ai;
  const config=AI_CONFIG[pageId]||AI_CONFIG.ai;

  const[chats,setChats]=useState<AIChat[]>([]);
  const[activeChatId,setActiveChatId]=useState<string|null>(null);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const[sidebarOpen,setSidebarOpen]=useState(true);
  const[fileData,setFileData]=useState<{name:string,data:string,type:string}|null>(null);
  const bottomRef=useRef<HTMLDivElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    try{const s=localStorage.getItem(config.storageKey);if(s)setChats(JSON.parse(s));}catch{}
    setSidebarOpen(!isMobile);
  },[]);

  const activeChat=chats.find(c=>c.id===activeChatId)||null;
  const msgs=activeChat?.msgs||[];

  useEffect(()=>{
    try{localStorage.setItem(config.storageKey,JSON.stringify(chats));}catch{}
  },[chats]);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const newChat=()=>{
    if(chats.length>=MAX_CHATS){alert("Лимит 20 диалогов. Удали старый чтобы создать новый");return;}
    const id=Date.now().toString();
    const chat:AIChat={id,title:"Новый чат",msgs:[],createdAt:Date.now()};
    setChats(prev=>[chat,...prev]);
    setActiveChatId(id);setInput("");setErr("");setFileData(null);
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
      const isText=file.type.startsWith("text")||file.name.endsWith(".txt")||file.name.endsWith(".md")||file.name.endsWith(".csv")||file.name.endsWith(".docx");
      setFileData({name:file.name,data:isText?result:(result.split(",")[1]||""),type:isText?"text":file.type});
    };
    if(file.type.startsWith("text")||[".txt",".md",".csv"].some(e=>file.name.endsWith(e))){
      reader.readAsText(file);
    } else {reader.readAsDataURL(file);}
  };

  const send=async(text?:string)=>{
    const q=(text||input).trim();
    if((!q&&!fileData)||loading)return;
    let chatId=activeChatId;
    if(!chatId){
      if(chats.length>=MAX_CHATS){alert("Лимит 20 диалогов. Удали старый чтобы создать новый");return;}
      const id=Date.now().toString();chatId=id;
      const chat:AIChat={id,title:q.slice(0,30)||fileData?.name||"Чат",msgs:[],createdAt:Date.now()};
      setChats(prev=>[chat,...prev]);setActiveChatId(id);
    }
    const userMsg:AIMsg={role:"user",content:q||("Файл: "+(fileData?.name||"")),file:fileData||undefined};
    const newMsgs:AIMsg[]=[...msgs,userMsg];
    setChats(prev=>prev.map(c=>c.id===chatId?{...c,msgs:newMsgs,title:c.title==="Новый чат"?(q.slice(0,35)||c.title):c.title}:c));
    setInput("");setErr("");setFileData(null);setLoading(true);
    try{
      const apiMsgs=newMsgs.map(m=>({role:m.role,content:m.file&&m.file.type==="text"?m.content+"\n\nФайл "+m.file.name+":\n"+m.file.data:m.content}));
      const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:apiMsgs,...(system?{system}:{})})});
      if(!res.ok)throw new Error("API error "+res.status);
      const data=await res.json();
      const reply=data.content?.[0]?.text||data.choices?.[0]?.message?.content||"Нет ответа";
      setChats(prev=>prev.map(c=>c.id===chatId?{...c,msgs:[...newMsgs,{role:"assistant" as const,content:reply}]}:c));
    }catch(e:any){setErr("Ошибка: "+e.message);setChats(prev=>prev.map(c=>c.id===chatId?{...c,msgs:newMsgs.slice(0,-1)}:c));}
    finally{setLoading(false);}
  };

  const formatMsg=(text:string)=>text.split("\n").map((line,i,arr)=>{
    const parts=line.split(/(\*\*[^*]+\*\*|\u0060[^\u0060]+\u0060)/g).map((part,j)=>{
      if(part.startsWith("**")&&part.endsWith("**"))return <strong key={j}>{part.slice(2,-2)}</strong>;
      if(part.startsWith("`")&&part.endsWith("`"))return <code key={j} style={{background:"rgba(255,255,255,0.15)",borderRadius:4,padding:"1px 5px",fontSize:"0.9em",fontFamily:"monospace"}}>{part.slice(1,-1)}</code>;
      return part;
    });
    return <span key={i}>{parts}{i<arr.length-1&&<br/>}</span>;
  });

  const ac=theme.accentColor;

  return <div style={{display:"flex",height:isMobile?"calc(100vh - 136px)":"calc(100vh - 120px)",overflow:"hidden",borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",background:theme.bg,boxShadow:"0 8px 40px rgba(0,0,0,0.4)"}}>
    <style>{`
      @keyframes avatarPulse{0%,100%{opacity:0.6}50%{opacity:1}}
      @keyframes dotBlink{0%,100%{opacity:1}50%{opacity:0.3}}
      @keyframes msgSlideIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}
      @keyframes aiMsgIn{from{transform:scale(0.97);opacity:0}to{transform:scale(1);opacity:1}}
      .ai-chat-input:focus{border-color:${theme.inputBorderFocus}!important;box-shadow:${theme.inputGlow}!important;}
      .ai-send-btn:hover{transform:scale(1.05);box-shadow:${theme.btnGlow}!important;}
      .ai-file-btn:hover{transform:scale(1.1);}
      .ai-chat-item:hover .ai-delete-btn{opacity:1!important;}
      .ai-suggestion-btn:hover{border-color:${ac}!important;background:${ac}15!important;}
    `}</style>

    {/* Sidebar */}
    {(sidebarOpen||!isMobile)&&<div style={{width:isMobile?"100%":220,flexShrink:0,background:theme.sbBg,borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"14px 12px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <img src={config.avatar} style={{width:30,height:30,borderRadius:8,objectFit:"cover",border:"1.5px solid "+theme.avatarBorder,boxShadow:theme.avatarGlow}} alt=""/>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>{config.name}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>История диалогов</div>
          </div>
        </div>
        <button onClick={newChat} style={{width:"100%",padding:"8px",background:theme.btnBg,color:pageId==="product"?"#0A0818":"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:theme.btnGlow}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новый диалог
        </button>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",textAlign:"right",marginTop:5}}>{chats.length}/{MAX_CHATS}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px"}}>
        {chats.length===0&&<div style={{padding:"20px 8px",textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.25)"}}>Нет диалогов</div>}
        {chats.map(chat=><div key={chat.id} className="ai-chat-item" onClick={()=>{setActiveChatId(chat.id);if(isMobile)setSidebarOpen(false);}}
          style={{padding:"9px 10px",borderRadius:7,cursor:"pointer",marginBottom:2,display:"flex",alignItems:"center",gap:7,
            background:activeChatId===chat.id?theme.sbActiveBg:"transparent",
            borderLeft:activeChatId===chat.id?"3px solid "+theme.sbActiveBorder:"3px solid transparent",
            transition:"all 0.15s",position:"relative"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={activeChatId===chat.id?theme.sbActiveBorder:"rgba(255,255,255,0.3)"} strokeWidth="2" style={{flexShrink:0}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:activeChatId===chat.id?600:400,color:activeChatId===chat.id?"#fff":"rgba(255,255,255,0.6)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{chat.title}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginTop:1}}>{chat.msgs.length} сообщ.</div>
          </div>
          <button className="ai-delete-btn" onClick={e=>deleteChat(chat.id,e)}
            style={{width:18,height:18,border:"none",background:"rgba(255,59,48,0.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,flexShrink:0,borderRadius:4,transition:"opacity 0.15s"}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>)}
      </div>
    </div>}

    {/* Main area */}
    {(!isMobile||!sidebarOpen)&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:theme.bg}}>
      {/* Header */}
      <div style={{padding:"12px 16px",background:theme.headerBg,borderBottom:"1px solid "+theme.headerBorderColor,display:"flex",alignItems:"center",gap:10,flexShrink:0,boxShadow:theme.headerGlow}}>
        {isMobile&&<button onClick={()=>setSidebarOpen(true)} style={{width:30,height:30,border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>}
        <div style={{position:"relative",flexShrink:0}}>
          <img src={config.avatar} style={{width:36,height:36,borderRadius:10,objectFit:"cover",border:"2px solid "+theme.avatarBorder,boxShadow:theme.avatarGlow,animation:"avatarPulse 2s ease-in-out infinite"}} alt=""/>
          <div style={{position:"absolute",bottom:0,right:0,width:9,height:9,borderRadius:"50%",background:theme.onlineDot,border:"2px solid "+theme.bg,animation:"dotBlink 2s ease-in-out infinite"}}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{config.name}</div>
          <div style={{fontSize:10,color:theme.onlineDot,display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:theme.onlineDot}}/>
            онлайн · Powered by the best AI's
          </div>
        </div>
        {activeChat&&<button onClick={()=>{setChats(prev=>prev.map(c=>c.id===activeChatId?{...c,msgs:[]}:c));setErr("");}}
          style={{padding:"4px 10px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,fontSize:10,color:"rgba(255,255,255,0.5)",cursor:"pointer"}}>
          Очистить
        </button>}
      </div>
      <AiBetaNotice theme={theme}/>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
        {!activeChat&&<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:"20px 0",minHeight:"60%"}}>
          <img src={config.avatar} style={{width:68,height:68,borderRadius:18,objectFit:"cover",border:"2px solid "+theme.avatarBorder,boxShadow:theme.avatarGlow}} alt=""/>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:17,fontWeight:700,color:"#fff",marginBottom:4}}>{config.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>Начни новый диалог или выбери из истории</div>
          </div>
          {config.suggestions&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:7,width:"100%",maxWidth:520}}>
            {config.suggestions.map((s,i)=><button key={i} className="ai-suggestion-btn" onClick={()=>send(s)}
              style={{padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,fontSize:11,color:"rgba(255,255,255,0.65)",cursor:"pointer",textAlign:"left",lineHeight:1.4,fontFamily:"'Inter',sans-serif",transition:"all 0.15s"}}>
              {s}
            </button>)}
          </div>}
        </div>}

        {/* Welcome message for active empty chat */}
        {activeChat&&msgs.length===0&&config.welcome&&<div style={{display:"flex",justifyContent:"flex-start",alignItems:"flex-start",gap:8}}>
          <img src={config.avatar} style={{width:26,height:26,borderRadius:7,objectFit:"cover",flexShrink:0,marginTop:2,border:"1.5px solid "+theme.avatarBorder}} alt=""/>
          <div style={{maxWidth:"78%",padding:"11px 14px",borderRadius:"18px 18px 18px 4px",background:theme.aiMsgBg,border:"1px solid "+theme.aiMsgBorder,color:"#fff",fontSize:13,lineHeight:1.65,wordBreak:"break-word",boxShadow:theme.aiMsgGlow}}>
            {formatMsg(config.welcome)}
            {config.suggestions&&pageId!=="ai"&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
              {config.suggestions.map((s,i)=><button key={i} onClick={()=>send(s)}
                style={{padding:"6px 12px",background:ac+"15",border:"1px solid "+ac+"30",borderRadius:20,fontSize:11,color:ac,cursor:"pointer",fontWeight:500,fontFamily:"'Inter',sans-serif",transition:"all 0.15s"}}>
                {s}
              </button>)}
            </div>}
          </div>
        </div>}

        {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8,animation:m.role==="user"?"msgSlideIn 0.2s ease-out":"aiMsgIn 0.25s ease-out"}}>
          {m.role==="assistant"&&<img src={config.avatar} style={{width:26,height:26,borderRadius:7,objectFit:"cover",flexShrink:0,marginTop:2,border:"1.5px solid "+theme.avatarBorder}} alt=""/>}
          <div style={{maxWidth:"78%"}}>
            {m.file&&<div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:3,display:"flex",alignItems:"center",gap:4,justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {m.file.name}
            </div>}
            <div style={{
              padding:"11px 14px",
              borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
              background:m.role==="user"?theme.userMsgBg:theme.aiMsgBg,
              border:"1px solid "+(m.role==="user"?theme.userMsgBorder:theme.aiMsgBorder),
              color:m.role==="user"?theme.userMsgText:"#fff",
              fontSize:13,lineHeight:1.65,wordBreak:"break-word",
              boxShadow:m.role==="user"?theme.userMsgGlow:theme.aiMsgGlow,
            }}>
              {m.role==="assistant"?formatMsg(m.content):m.content}
            </div>
          </div>
          {m.role==="user"&&<div style={{width:26,height:26,borderRadius:7,background:ac+"22",border:"1.5px solid "+ac+"44",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>}
        </div>)}

        {loading&&<div style={{display:"flex",alignItems:"center",gap:8}}>
          <img src={config.avatar} style={{width:26,height:26,borderRadius:7,objectFit:"cover",border:"1.5px solid "+theme.avatarBorder}} alt=""/>
          <div style={{padding:"11px 14px",background:theme.aiMsgBg,border:"1px solid "+theme.aiMsgBorder,borderRadius:"18px 18px 18px 4px",display:"flex",gap:5,alignItems:"center",boxShadow:theme.aiMsgGlow}}>
            {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:theme.dotColor,animation:`pulse 1.2s ease-in-out ${i*0.15}s infinite`}}/>)}
          </div>
        </div>}

        {err&&<div style={{padding:"10px 14px",background:"rgba(255,59,48,0.1)",borderRadius:10,fontSize:12,color:"#FF3B30",border:"1px solid rgba(255,59,48,0.2)"}}>{err}</div>}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,0.06)",background:theme.headerBg,flexShrink:0}}>
        {fileData&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:ac+"15",borderRadius:8,marginBottom:8,border:"1px solid "+ac+"30"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style={{fontSize:11,color:ac,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fileData.name}</span>
          <button onClick={()=>setFileData(null)} style={{border:"none",background:"transparent",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:14,lineHeight:1}}>×</button>
        </div>}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <input ref={fileRef} type="file" accept=".txt,.md,.csv,.pdf,.docx,image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0]);e.target.value="";}}/>
          <button className="ai-file-btn" onClick={()=>fileRef.current?.click()} title="Загрузить файл"
            style={{width:34,height:34,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s",color:theme.dotColor}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder="Напиши сообщение... (Enter — отправить)"
            rows={1} className="ai-chat-input"
            style={{flex:1,border:"1px solid rgba(255,255,255,0.1)",outline:"none",resize:"none",fontSize:13,fontFamily:"'Inter',sans-serif",color:"#fff",background:theme.inputBg,lineHeight:1.5,maxHeight:120,overflowY:"auto",borderRadius:10,padding:"9px 12px",transition:"border-color 0.2s,box-shadow 0.2s"}}
            onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,120)+"px";}}
          />
          <button className="ai-send-btn" onClick={()=>send()} disabled={(!input.trim()&&!fileData)||loading}
            style={{width:34,height:34,borderRadius:8,border:"none",background:((input.trim()||fileData)&&!loading)?theme.btnBg:"rgba(255,255,255,0.08)",cursor:((input.trim()||fileData)&&!loading)?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={pageId==="product"&&(input.trim()||fileData)&&!loading?"#0A0818":"#fff"} strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>}
  </div>;
}

function AIPage(){return <AIChatBase pageId="ai"/>;}



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

function ScriptAIPage(){return <AIChatBase pageId="script" system={SCRIPT_SYSTEM}/>;}

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

function ProductAIPage(){return <AIChatBase pageId="product" system={PRODUCT_SYSTEM}/>;}

/* ============ STORIES AI PAGE ============ */
const STORIES_SYSTEM_V2=`Ты — Vizzy Stories AI. Специализируешься ТОЛЬКО на создании сценариев для Stories и каруселей. На любые другие запросы отвечай: «Я создаю сценарии для Stories и каруселей. Давай создадим твой!»

ЗАДАЧА: По данным от пользователя генерируй готовый сценарий по слайдам.

СТРУКТУРА ВЫВОДА — строго такой формат для каждого слайда:

---
**Слайд [N] — [название роли: Хук / Проблема / Инсайт / Решение / Доказательство / CTA]**

📱 Текст на слайде:
[1–2 короткие строки, макс 120 символов, без точек в конце]

🎙 Подпись/озвучка:
[1–2 предложения — живо, по делу]

🎨 Визуал:
[фон, цвет, эмодзи, фото — конкретно]

💬 Интерактив (если цель — вовлечение):
[опрос / вопрос / реакция / слайдер]
---

ПРАВИЛА:
1. Слайд 1 — всегда хук. Дай 2-3 варианта хука на выбор.
2. Слайды 2–(N-2) — проблема → инсайт → решение/польза → доказательство/кейс.
3. Последний слайд — CTA. Дай 2-3 варианта CTA на выбор.
4. Максимум 120 символов текст на слайде.
5. Без воды, без длинных абзацев, логика: хук → ценность → CTA.
6. Тон строго соответствует выбранному пользователем.
7. Без мата. Без гарантий типа "вы точно заработаете".
8. После генерации предложи: доработать слайд, изменить тон, добавить интерактив, сгенерировать новый вариант хука или CTA.`;

const STORIES_QUESTIONS=[
  {id:"topic",label:"Тема",placeholder:"О чём сторис? Например: как я вышел на 500к/мес"},
  {id:"goal",label:"Цель",options:["Вовлечение","Прогрев","Продажа","Анонс","Экспертность"]},
  {id:"audience",label:"Целевая аудитория",placeholder:"Кто читает? Например: предприниматели 25-40 лет"},
  {id:"tone",label:"Тон",options:["Дружелюбно","Экспертно","Дерзко","Минимализм"]},
  {id:"format",label:"Формат",options:["Instagram Stories","Telegram Stories","Карусель поста"]},
  {id:"slides",label:"Кол-во слайдов",options:["5","6","7","8","9","10","11","12"],default:"7"},
  {id:"product",label:"Продукт/оффер",placeholder:"Что продаём? (необязательно)"},
  {id:"rules",label:"Ограничения",placeholder:"Например: на «ты», без обещаний (необязательно)"},
];

function StoriesAIPage(){
  const isMobile=useIsMobile();
  const theme=AI_THEMES.stories;
  const ac="#CC00FF";

  const[step,setStep]=useState<"form"|"chat">("form");
  const[form,setForm]=useState<Record<string,string>>({slides:"7"});
  const[chats,setChats]=useState<AIChat[]>([]);
  const[activeChatId,setActiveChatId]=useState<string|null>(null);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const[copied,setCopied]=useState(false);
  const[sidebarOpen,setSidebarOpen]=useState(true);
  const bottomRef=useRef<HTMLDivElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    try{const s=localStorage.getItem("stories_ai_chats_v2");if(s)setChats(JSON.parse(s));}catch{}
    setSidebarOpen(!isMobile);
  },[]);
  useEffect(()=>{try{localStorage.setItem("stories_ai_chats_v2",JSON.stringify(chats));}catch{};},[chats]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[chats,loading,activeChatId]);

  const activeChat=chats.find(c=>c.id===activeChatId)||null;
  const msgs=activeChat?.msgs||[];

  const lastScript=useMemo(()=>{
    const am=msgs.filter(m=>m.role==="assistant");
    for(let i=am.length-1;i>=0;i--){if(am[i].content.includes("Слайд")&&am[i].content.length>300)return am[i].content;}
    return null;
  },[msgs]);

  const buildPrompt=()=>{
    const f=form;
    return `Создай сценарий Stories по следующим данным:

Тема: ${f.topic||"не указана"}
Цель: ${f.goal||"вовлечение"}
ЦА: ${f.audience||"не указана"}
Тон: ${f.tone||"дружелюбно"}
Формат: ${f.format||"Instagram Stories"}
Кол-во слайдов: ${f.slides||"7"}
Продукт/оффер: ${f.product||"не указан"}
Ограничения: ${f.rules||"нет"}

Сгенерируй полный сценарий по всем слайдам строго по формату.`;
  };

  const startGeneration=async()=>{
    if(!form.topic?.trim()){setErr("Укажи тему сторис");return;}
    setErr("");
    const id=Date.now().toString();
    const title=(form.topic||"Сторис").slice(0,35);
    const chat:AIChat={id,title,msgs:[],createdAt:Date.now()};
    setChats(prev=>[chat,...prev].slice(0,MAX_CHATS));
    setActiveChatId(id);
    setStep("chat");
    setLoading(true);
    const prompt=buildPrompt();
    const userMsg:AIMsg={role:"user",content:prompt};
    const newMsgs=[userMsg];
    setChats(prev=>prev.map(c=>c.id===id?{...c,msgs:newMsgs}:c));
    try{
      const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:newMsgs,system:STORIES_SYSTEM_V2})});
      if(!res.ok)throw new Error("API error "+res.status);
      const data=await res.json();
      const reply=data.content?.[0]?.text||data.choices?.[0]?.message?.content||"Нет ответа";
      setChats(prev=>prev.map(c=>c.id===id?{...c,msgs:[...newMsgs,{role:"assistant" as const,content:reply}]}:c));
    }catch(e:any){setErr("Ошибка: "+e.message);}
    finally{setLoading(false);}
  };

  const send=async()=>{
    const q=input.trim();if(!q||loading)return;
    let chatId=activeChatId;
    if(!chatId){const id=Date.now().toString();chatId=id;setChats(prev=>[{id,title:q.slice(0,35),msgs:[],createdAt:Date.now()},...prev].slice(0,MAX_CHATS));setActiveChatId(id);}
    const newMsgs:AIMsg[]=[...msgs,{role:"user" as const,content:q}];
    setChats(prev=>prev.map(c=>c.id===chatId?{...c,msgs:newMsgs}:c));
    setInput("");setLoading(true);
    try{
      const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:newMsgs,system:STORIES_SYSTEM_V2})});
      if(!res.ok)throw new Error("API error "+res.status);
      const data=await res.json();
      const reply=data.content?.[0]?.text||data.choices?.[0]?.message?.content||"Нет ответа";
      setChats(prev=>prev.map(c=>c.id===chatId?{...c,msgs:[...newMsgs,{role:"assistant" as const,content:reply}]}:c));
    }catch(e:any){setErr("Ошибка: "+e.message);}
    finally{setLoading(false);}
  };

  const copy=async()=>{
    const text=lastScript||msgs.filter(m=>m.role==="assistant").map(m=>m.content).join("\n\n");
    await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000);
  };

  const download=()=>{
    const text=lastScript||msgs.filter(m=>m.role==="assistant").map(m=>m.content).join("\n\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));a.download="stories_vizzy.txt";a.click();
  };

  const newScenario=()=>{setStep("form");setForm({slides:"7"});setActiveChatId(null);setErr("");setInput("");};

  const formatMsg=(text:string)=>text.split("\n").map((line,i,arr)=>{
    const isBold=line.startsWith("**")&&line.endsWith("**");
    const isLabel=line.startsWith("📱")||line.startsWith("🎙")||line.startsWith("🎨")||line.startsWith("💬")||line.startsWith("---");
    const parts=line.split(/(\*\*[^*]+\*\*)/g).map((p,j)=>
      p.startsWith("**")&&p.endsWith("**")?<strong key={j} style={{color:ac}}>{p.slice(2,-2)}</strong>:p
    );
    return <span key={i} style={isLabel?{color:ac,fontWeight:600}:isBold?{color:ac}:{}}>{parts}{i<arr.length-1&&<br/>}</span>;
  });

  const GRAD="linear-gradient(135deg,#200030,#120018)";

  return <div style={{display:"flex",height:isMobile?"calc(100vh - 136px)":"calc(100vh - 120px)",overflow:"hidden",borderRadius:16,border:"1px solid rgba(204,0,255,0.15)",background:theme.bg,boxShadow:"0 8px 40px rgba(0,0,0,0.4)"}}>
    <style>{`.stories-input:focus{border-color:${ac}!important;box-shadow:0 0 12px rgba(204,0,255,0.3)!important;}.stories-send:hover{transform:scale(1.05);}.stories-chat-item:hover .stories-del{opacity:1!important;}.stories-opt:hover{border-color:${ac}!important;background:rgba(204,0,255,0.1)!important;}`}</style>

    {/* Sidebar */}
    {(sidebarOpen||!isMobile)&&<div style={{width:isMobile?"100%":220,flexShrink:0,background:theme.sbBg,borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"14px 12px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <img src="/icon-stories.png" style={{width:30,height:30,borderRadius:8,objectFit:"cover",border:"1.5px solid "+ac,boxShadow:"0 0 12px rgba(204,0,255,0.4)"}} alt=""/>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>Vizzy Stories AI</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>Сценарии сторис</div>
          </div>
        </div>
        <button onClick={newScenario} style={{width:"100%",padding:"8px",background:"linear-gradient(135deg,#CC00FF,#FF44CC)",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 4px 16px rgba(204,0,255,0.4)"}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новый сценарий
        </button>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",textAlign:"right",marginTop:5}}>{chats.length}/{MAX_CHATS}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px"}}>
        {chats.length===0&&<div style={{padding:"20px 8px",textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.25)"}}>Нет сценариев</div>}
        {chats.map(chat=><div key={chat.id} className="stories-chat-item" onClick={()=>{setActiveChatId(chat.id);setStep("chat");if(isMobile)setSidebarOpen(false);}}
          style={{padding:"9px 10px",borderRadius:7,cursor:"pointer",marginBottom:2,display:"flex",alignItems:"center",gap:7,
            background:activeChatId===chat.id?theme.sbActiveBg:"transparent",
            borderLeft:activeChatId===chat.id?"3px solid "+ac:"3px solid transparent",transition:"all 0.15s",position:"relative"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={activeChatId===chat.id?ac:"rgba(255,255,255,0.3)"} strokeWidth="2" style={{flexShrink:0}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:activeChatId===chat.id?600:400,color:activeChatId===chat.id?"#fff":"rgba(255,255,255,0.6)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{chat.title}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginTop:1}}>{chat.msgs.length} сообщ.</div>
          </div>
          <button className="stories-del" onClick={e=>{e.stopPropagation();setChats(prev=>prev.filter(c=>c.id!==chat.id));if(activeChatId===chat.id){setActiveChatId(null);setStep("form");}}}
            style={{width:18,height:18,border:"none",background:"rgba(255,59,48,0.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,flexShrink:0,borderRadius:4,transition:"opacity 0.15s"}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>)}
      </div>
    </div>}

    {/* Main */}
    {(!isMobile||!sidebarOpen)&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:theme.bg}}>
      {/* Header */}
      <div style={{padding:"12px 16px",background:GRAD,borderBottom:"1px solid rgba(204,0,255,0.15)",display:"flex",alignItems:"center",gap:10,flexShrink:0,boxShadow:"0 4px 40px rgba(204,0,255,0.25)"}}>
        {isMobile&&<button onClick={()=>setSidebarOpen(true)} style={{width:30,height:30,border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>}
        <div style={{position:"relative",flexShrink:0}}>
          <img src="/icon-stories.png" style={{width:36,height:36,borderRadius:10,objectFit:"cover",border:"2px solid "+ac,boxShadow:"0 0 20px rgba(204,0,255,0.6)",animation:"avatarPulse 2s ease-in-out infinite"}} alt=""/>
          <div style={{position:"absolute",bottom:0,right:0,width:9,height:9,borderRadius:"50%",background:ac,border:"2px solid "+theme.bg,animation:"dotBlink 2s ease-in-out infinite"}}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>Vizzy Stories AI</div>
          <div style={{fontSize:10,color:ac,display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:ac}}/> Сценарии для Stories и каруселей
          </div>
        </div>
        {step==="chat"&&lastScript&&<div style={{display:"flex",gap:6}}>
          <button onClick={copy} style={{padding:"5px 10px",background:copied?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.06)",color:copied?"#10B981":"rgba(255,255,255,0.6)",border:"1px solid "+(copied?"rgba(16,185,129,0.3)":"rgba(255,255,255,0.1)"),borderRadius:7,fontSize:10,cursor:"pointer",fontWeight:500}}>{copied?"✓ Скопировано":"Скопировать"}</button>
          {!isMobile&&<button onClick={download} style={{padding:"5px 10px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,fontSize:10,cursor:"pointer"}}>Скачать</button>}
        </div>}
      </div>
      <AiBetaNotice theme={theme}/>

      {/* Form or Chat */}
      {step==="form"
        ? <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
            <div style={{maxWidth:560,margin:"0 auto"}}>
              <div style={{textAlign:"center",marginBottom:24}}>
                <img src="/icon-stories.png" style={{width:56,height:56,borderRadius:14,objectFit:"cover",border:"2px solid "+ac,boxShadow:"0 0 20px rgba(204,0,255,0.5)",marginBottom:12}} alt=""/>
                <div style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:4}}>Визzy Stories AI</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Заполни форму — получи готовый сценарий по слайдам</div>
              </div>

              {STORIES_QUESTIONS.map(q=><div key={q.id} style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>{q.label}{q.id==="topic"||q.id==="audience"?" *":""}</label>
                {q.options
                  ? <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {q.options.map(opt=><button key={opt} className="stories-opt" onClick={()=>setForm(f=>({...f,[q.id]:opt}))}
                        style={{padding:"7px 14px",background:form[q.id]===opt?"rgba(204,0,255,0.2)":"rgba(255,255,255,0.04)",border:"1px solid "+(form[q.id]===opt?ac:"rgba(255,255,255,0.1)"),borderRadius:20,fontSize:12,color:form[q.id]===opt?ac:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"all 0.15s",fontFamily:"'Inter',sans-serif",fontWeight:form[q.id]===opt?600:400}}>
                        {opt}
                      </button>)}
                    </div>
                  : <input value={form[q.id]||""} onChange={e=>setForm(f=>({...f,[q.id]:e.target.value}))}
                      placeholder={q.placeholder} className="stories-input"
                      style={{width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,fontSize:13,color:"#fff",outline:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box",transition:"all 0.2s"}}/>
                }
              </div>)}

              {err&&<div style={{padding:"10px 14px",background:"rgba(255,59,48,0.1)",borderRadius:10,fontSize:12,color:"#FF3B30",border:"1px solid rgba(255,59,48,0.2)",marginBottom:12}}>{err}</div>}

              <button onClick={startGeneration} disabled={loading||!form.topic?.trim()}
                style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#CC00FF,#FF44CC)",color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 8px 24px rgba(204,0,255,0.4)",transition:"all 0.15s",opacity:loading||!form.topic?.trim()?0.5:1}}>
                {loading?"Генерирую сценарий...":"✨ Сгенерировать сценарий"}
              </button>
            </div>
          </div>

        : <><div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
            {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8}}>
              {m.role==="assistant"&&<img src="/icon-stories.png" style={{width:26,height:26,borderRadius:7,objectFit:"cover",flexShrink:0,marginTop:2,border:"1.5px solid "+ac}} alt=""/>}
              <div style={{maxWidth:"82%",padding:"11px 14px",
                borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
                background:m.role==="user"?"linear-gradient(135deg,#2A0040,#1A0030)":theme.aiMsgBg,
                border:"1px solid "+(m.role==="user"?"rgba(204,0,255,0.4)":theme.aiMsgBorder),
                color:m.role==="user"?"#F5CCFF":"#fff",fontSize:13,lineHeight:1.7,wordBreak:"break-word",
                boxShadow:m.role==="user"?"0 2px 20px rgba(204,0,255,0.2)":theme.aiMsgGlow,
              }}>
                {m.role==="assistant"?formatMsg(m.content):m.content}
              </div>
              {m.role==="user"&&<div style={{width:26,height:26,borderRadius:7,background:"rgba(204,0,255,0.15)",border:"1.5px solid rgba(204,0,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>}
            </div>)}

            {loading&&<div style={{display:"flex",alignItems:"center",gap:8}}>
              <img src="/icon-stories.png" style={{width:26,height:26,borderRadius:7,objectFit:"cover",border:"1.5px solid "+ac}} alt=""/>
              <div style={{padding:"11px 14px",background:theme.aiMsgBg,border:"1px solid "+theme.aiMsgBorder,borderRadius:"18px 18px 18px 4px",display:"flex",gap:5,alignItems:"center"}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:ac,animation:`pulse 1.2s ease-in-out ${i*0.15}s infinite`}}/>)}
              </div>
            </div>}
            {err&&<div style={{padding:"10px 14px",background:"rgba(255,59,48,0.1)",borderRadius:10,fontSize:12,color:"#FF3B30",border:"1px solid rgba(255,59,48,0.2)"}}>{err}</div>}
            <div ref={bottomRef}/>
          </div>

          {/* Quick actions */}
          {lastScript&&!loading&&<div style={{padding:"8px 12px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:6,flexWrap:"wrap",background:"rgba(255,255,255,0.02)"}}>
            {["Перепиши хук","Другой CTA","Добавь интерактив","Измени тон"].map(a=><button key={a} onClick={()=>{setInput(a);}}
              style={{padding:"5px 12px",background:"rgba(204,0,255,0.1)",border:"1px solid rgba(204,0,255,0.25)",borderRadius:20,fontSize:11,color:ac,cursor:"pointer",fontWeight:500}}>
              {a}
            </button>)}
          </div>}

          {/* Input */}
          <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,0.06)",background:"linear-gradient(180deg,#200030,#120018)",flexShrink:0}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <textarea value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                placeholder="Доработай слайд, измени тон, добавь интерактив..."
                rows={1} className="stories-input"
                style={{flex:1,border:"1px solid rgba(255,255,255,0.1)",outline:"none",resize:"none",fontSize:13,fontFamily:"'Inter',sans-serif",color:"#fff",background:"rgba(255,255,255,0.04)",lineHeight:1.5,maxHeight:100,overflowY:"auto",borderRadius:10,padding:"9px 12px",transition:"all 0.2s"}}
                onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,100)+"px";}}
              />
              <button className="stories-send" onClick={send} disabled={!input.trim()||loading}
                style={{width:34,height:34,borderRadius:8,border:"none",background:input.trim()&&!loading?"linear-gradient(135deg,#CC00FF,#FF44CC)":"rgba(255,255,255,0.08)",cursor:input.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </>
      }
    </div>}
  </div>;
}

/* ============ MAILINGS ============ */
const MAILING_GOALS_AI=["Знакомство с новым лидом","Презентация продукта/услуги","Реактивация «уснувшего» клиента","Специальное предложение/акция","Напоминание о событии/вебинаре","Запрос обратной связи"];
const MAILING_TONES=["Дружелюбный","Официальный","Продающий","Информационный","Нейтральный"];
const MAILING_CHANNELS=["Личные сообщения (Соцсети)","Email"];
const MAILING_STATUSES=[{id:"planned",label:"Запланирована",color:"#F59E0B"},{id:"sent",label:"Отправлена",color:"#10B981"}];
const msCol=(s:string)=>(MAILING_STATUSES.find(x=>x.id===s)||{color:"#6B7280"}).color;
const msLbl=(s:string)=>(MAILING_STATUSES.find(x=>x.id===s)||{label:s}).label;
const EMPTY_MAILING={recipient:"",goal:"",scheduled_at:"",status:"planned",chat_url:"",content:""};

function MailingsPage({userId}:{userId:string}){
  const{data:mailings,loading,add,update,remove}=useTable("mailings",userId);
  const[modal,setModal]=useState<any>(null);
  const[form,setForm]=useState<any>(EMPTY_MAILING);
  const[deleteId,setDeleteId]=useState<string|null>(null);
  const[aiOpen,setAiOpen]=useState(false);
  const[aiGoal,setAiGoal]=useState("");
  const[aiChannel,setAiChannel]=useState("Личные сообщения (Соцсети)");
  const[aiTone,setAiTone]=useState("");
  const[aiCount,setAiCount]=useState(1);
  const[aiExtra,setAiExtra]=useState("");
  const[aiLoading,setAiLoading]=useState(false);
  const[aiResult,setAiResult]=useState<string[]>([]);
  const[copied,setCopied]=useState<number|null>(null);
  const AI_ACCENT="#A78BFA";

  const openNew=(prefill?:any)=>{setForm(prefill||{...EMPTY_MAILING});setModal("new");};
  const openEdit=(m:any)=>{setForm({...m,scheduled_at:m.scheduled_at?m.scheduled_at.slice(0,16):""});setModal(m);};
  const closeModal=()=>{setModal(null);setForm(EMPTY_MAILING);};

  const save=async()=>{
    const payload={recipient:form.recipient,goal:form.goal,scheduled_at:form.scheduled_at||null,status:form.status||"planned",chat_url:form.chat_url||"",content:form.content||""};
    if(modal==="new"){await add(payload);}else{await update(modal.id,payload);}
    closeModal();
  };

  const confirmDelete=async()=>{if(deleteId){await remove(deleteId);setDeleteId(null);}};

  const copyText=(i:number)=>{
    navigator.clipboard.writeText(aiResult[i]).then(()=>{setCopied(i);setTimeout(()=>setCopied(null),2000);});
  };

  const generateAI=async()=>{
    if(!aiGoal||!aiTone)return;
    setAiLoading(true);setAiResult([]);
    const prompt=`Ты — профессиональный копирайтер. Напиши рассылку для клиента.\nЦель: ${aiGoal}\nКанал: ${aiChannel}\nТон: ${aiTone}\nКоличество сообщений: ${aiCount}\nДополнительно: ${aiExtra||"нет"}\n${aiCount>1?`Раздели рассылку на ${aiCount} отдельных сообщений. Каждое начинай с "Сообщение N:" (где N — номер).`:"Напиши одно чёткое сообщение."}\nТолько текст сообщений, без пояснений.`;
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const text=data.content?.[0]?.text||"";
      if(aiCount>1){
        const parts=text.split(/Сообщение \d+:/i).filter((p:string)=>p.trim());
        setAiResult(parts.map((p:string)=>p.trim()));
      }else{setAiResult([text.trim()]);}
    }catch(e){setAiResult(["Ошибка генерации. Попробуйте снова."]);}
    setAiLoading(false);
  };

  const useGeneratedForNew=()=>{openNew({...EMPTY_MAILING,goal:aiGoal,content:aiResult.join("\n\n---\n\n")});};

  const fmtDt=(s:string)=>{
    if(!s)return"—";
    const d=new Date(s);
    return d.toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric"})+" "+d.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"});
  };

  return(
    <div style={{position:"relative",minHeight:"calc(100vh - 64px)"}}>
      <div style={{marginRight:aiOpen?364:0,transition:"margin-right 0.3s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <h1 style={{margin:0,fontSize:24,fontWeight:800}}>Рассылки</h1>
          <Btn onClick={()=>openNew()} style={{display:"flex",alignItems:"center",gap:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Создать рассылку
          </Btn>
        </div>

        {loading
          ?<div style={{textAlign:"center",padding:60,color:C.t2}}>Загрузка...</div>
          :mailings.length===0
          ?<Card style={{textAlign:"center",padding:"60px 32px"}}>
              <div style={{fontSize:40,marginBottom:16}}>📬</div>
              <div style={{fontSize:16,fontWeight:600,color:C.t1,marginBottom:8}}>Рассылок пока нет</div>
              <div style={{fontSize:14,color:C.t2,marginBottom:24}}>Нажмите «Создать рассылку», чтобы начать</div>
              <Btn onClick={()=>openNew()}>+ Создать рассылку</Btn>
            </Card>
          :<Card style={{padding:0,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid "+C.bd}}>
                      {["Кому","Цель","Дата","Статус","Контакт / Чат","Действия"].map(h=>(
                        <th key={h} style={{padding:"14px 16px",textAlign:"left",fontWeight:600,color:C.t2,fontSize:12,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mailings.map((m:any,i:number)=>(
                      <tr key={m.id} style={{borderBottom:i<mailings.length-1?"1px solid "+C.bd:"none",transition:"background 0.1s"}}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=C.ib;}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
                        <td style={{padding:"14px 16px",fontWeight:600,color:C.t1}}>{m.recipient||"—"}</td>
                        <td style={{padding:"14px 16px"}}>
                          <span style={{background:C.a+"14",color:C.a,padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:500}}>{m.goal||"—"}</span>
                        </td>
                        <td style={{padding:"14px 16px",color:C.t2,whiteSpace:"nowrap"}}>{fmtDt(m.scheduled_at)}</td>
                        <td style={{padding:"14px 16px"}}>
                          <span onClick={()=>update(m.id,{status:m.status==="planned"?"sent":"planned"})}
                            style={{background:msCol(m.status)+"20",color:msCol(m.status),padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                            {msLbl(m.status)}
                          </span>
                        </td>
                        <td style={{padding:"14px 16px"}}>
                          {m.chat_url
                            ?<a href={m.chat_url} target="_blank" rel="noreferrer"
                                style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",background:C.a+"14",color:C.a,borderRadius:8,fontSize:12,fontWeight:600,textDecoration:"none",whiteSpace:"nowrap"}}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                Перейти в чат
                              </a>
                            :<span style={{color:C.t2,fontSize:12}}>—</span>
                          }
                        </td>
                        <td style={{padding:"14px 16px"}}>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>openEdit(m)} title="Редактировать"
                              style={{width:32,height:32,borderRadius:8,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a;}}
                              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;}}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.a} strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={()=>setDeleteId(m.id)} title="Удалить"
                              style={{width:32,height:32,borderRadius:8,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.r;}}
                              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;}}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.r} strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
        }
      </div>

      {/* AI TAB */}
      <div onClick={()=>setAiOpen(!aiOpen)} style={{position:"fixed",right:aiOpen?360:0,top:"50%",transform:"translateY(-50%)",background:`linear-gradient(135deg,${AI_ACCENT},#7C3AED)`,width:32,height:120,borderRadius:"12px 0 0 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"-4px 0 20px rgba(167,139,250,0.35)",zIndex:110,transition:"right 0.3s ease"}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <div style={{writingMode:"vertical-rl",textOrientation:"mixed",transform:"rotate(180deg)",fontSize:10,fontWeight:700,color:"#fff",letterSpacing:1}}>VIZZY AI</div>
      </div>

      {/* AI PANEL */}
      <div style={{position:"fixed",right:0,top:0,bottom:0,width:360,background:"#1A1030",borderLeft:"1px solid rgba(167,139,250,0.2)",transform:aiOpen?"translateX(0)":"translateX(100%)",transition:"transform 0.3s ease",zIndex:105,display:"flex",flexDirection:"column",fontFamily:"'Inter',sans-serif",overflowY:"auto"}}>
        <div style={{padding:"20px 20px 16px",borderBottom:"1px solid rgba(167,139,250,0.15)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#A78BFA,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>Vizzy AI</div>
                <div style={{fontSize:11,color:"rgba(167,139,250,0.7)"}}>Генератор рассылок</div>
              </div>
            </div>
            <button onClick={()=>setAiOpen(false)} style={{width:28,height:28,borderRadius:7,border:"none",background:"rgba(255,255,255,0.07)",cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{marginTop:10,padding:"10px 14px",background:"rgba(167,139,250,0.1)",borderRadius:10,fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>
            👋 Я помогу сделать рассылку! Заполни параметры и нажми «Сгенерировать».
          </div>
        </div>

        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:14,flex:1}}>
          {/* Goal */}
          <div>
            <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:6}}>Цель рассылки *</label>
            <select value={aiGoal} onChange={e=>setAiGoal(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:10,fontSize:13,color:aiGoal?"#fff":"rgba(255,255,255,0.4)",outline:"none",fontFamily:"'Inter',sans-serif"}}>
              <option value="" style={{background:"#1A1030"}}>Выберите цель...</option>
              {MAILING_GOALS_AI.map(g=><option key={g} value={g} style={{background:"#1A1030"}}>{g}</option>)}
            </select>
          </div>
          {/* Channel */}
          <div>
            <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:8}}>Канал *</label>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {MAILING_CHANNELS.map(ch=>(
                <label key={ch} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                  <div onClick={()=>setAiChannel(ch)} style={{width:18,height:18,borderRadius:"50%",border:"2px solid "+(aiChannel===ch?AI_ACCENT:"rgba(255,255,255,0.2)"),background:aiChannel===ch?AI_ACCENT:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                    {aiChannel===ch&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
                  </div>
                  <span style={{fontSize:13,color:"rgba(255,255,255,0.8)"}}>{ch}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Tone */}
          <div>
            <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:6}}>Тон рассылки *</label>
            <select value={aiTone} onChange={e=>setAiTone(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:10,fontSize:13,color:aiTone?"#fff":"rgba(255,255,255,0.4)",outline:"none",fontFamily:"'Inter',sans-serif"}}>
              <option value="" style={{background:"#1A1030"}}>Выберите тон...</option>
              {MAILING_TONES.map(t=><option key={t} value={t} style={{background:"#1A1030"}}>{t}</option>)}
            </select>
          </div>
          {/* Count */}
          <div>
            <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:8}}>Кол-во сообщений: <span style={{color:AI_ACCENT}}>{aiCount}</span></label>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>setAiCount(n)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"2px solid "+(aiCount===n?AI_ACCENT:"rgba(255,255,255,0.12)"),background:aiCount===n?"rgba(167,139,250,0.2)":"transparent",color:aiCount===n?AI_ACCENT:"rgba(255,255,255,0.5)",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all 0.15s"}}>{n}</button>
              ))}
            </div>
          </div>
          {/* Extra */}
          <div>
            <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:6}}>Доп. информация</label>
            <textarea value={aiExtra} onChange={e=>setAiExtra(e.target.value)} rows={3}
              placeholder="Имя клиента, название продукта, условия акции..."
              style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:10,fontSize:12,color:"#fff",outline:"none",resize:"vertical",fontFamily:"'Inter',sans-serif",lineHeight:1.5}}/>
          </div>

          <button onClick={generateAI} disabled={!aiGoal||!aiTone||aiLoading}
            style={{padding:"12px 0",background:(!aiGoal||!aiTone||aiLoading)?"rgba(167,139,250,0.2)":`linear-gradient(135deg,${AI_ACCENT},#7C3AED)`,border:"none",borderRadius:12,fontSize:14,fontWeight:700,color:(!aiGoal||!aiTone||aiLoading)?"rgba(255,255,255,0.4)":"#fff",cursor:(!aiGoal||!aiTone||aiLoading)?"not-allowed":"pointer",transition:"all 0.2s"}}>
            {aiLoading
              ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:"spin 0.8s linear infinite"}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  Генерирую...
                </span>
              :"✨ Сгенерировать текст"
            }
          </button>

          {aiResult.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.5}}>Результат</div>
              {aiResult.map((txt,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:12,padding:"14px 14px 10px"}}>
                  {aiResult.length>1&&<div style={{fontSize:11,fontWeight:700,color:AI_ACCENT,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Сообщение {i+1}</div>}
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.7,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{txt}</div>
                  <button onClick={()=>copyText(i)}
                    style={{marginTop:10,display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:7,fontSize:11,color:copied===i?"#10B981":AI_ACCENT,cursor:"pointer",fontWeight:500}}>
                    {copied===i
                      ?<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Скопировано</>
                      :<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Копировать</>
                    }
                  </button>
                </div>
              ))}
              <button onClick={useGeneratedForNew}
                style={{padding:"11px 0",background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:12,fontSize:13,fontWeight:600,color:"#10B981",cursor:"pointer",marginTop:4}}>
                📋 Создать рассылку на основе этого
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREATE/EDIT */}
      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={closeModal}>
          <div data-modal="" style={{background:C.w,borderRadius:20,padding:32,width:"100%",maxWidth:500,boxShadow:"0 24px 60px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:18,fontWeight:700,marginBottom:24}}>{modal==="new"?"Новая рассылка":"Редактировать рассылку"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Кому (получатель) *</label>
                <input autoFocus placeholder="Иван Петров / Сегмент: Новые лиды" value={form.recipient} onChange={e=>setForm({...form,recipient:e.target.value})} style={iS()}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Цель рассылки *</label>
                <input placeholder="Прогрев, Продажа курса, Реактивация..." value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})} style={iS()}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Дата и время</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e=>setForm({...form,scheduled_at:e.target.value})} style={iS()}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Статус</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={iS()}>
                    {MAILING_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Ссылка на чат (Instagram, Telegram...)</label>
                <input placeholder="https://t.me/username" value={form.chat_url} onChange={e=>setForm({...form,chat_url:e.target.value})} style={iS()}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Текст / Контент рассылки</label>
                <textarea rows={4} placeholder="Текст сообщения..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})} style={{...iS(),resize:"vertical"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
              <Btn onClick={closeModal} primary={false}>Отмена</Btn>
              <Btn onClick={save} disabled={!form.recipient||!form.goal}>Сохранить</Btn>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {deleteId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setDeleteId(null)}>
          <div style={{background:C.w,borderRadius:16,padding:28,maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 16px 40px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Удалить рассылку?</div>
            <div style={{fontSize:14,color:C.t2,marginBottom:24}}>Это действие нельзя отменить.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <Btn onClick={()=>setDeleteId(null)} primary={false}>Отмена</Btn>
              <Btn onClick={confirmDelete} style={{background:C.r}}>Удалить</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ============ VISITEXT — LIGHT WORD-LIKE EDITOR ============ */
type VisiTextDoc={id:string;title:string;html:string;fontSize:number;lineHeight:string;pageCount:number;createdAt:number;updatedAt:number};
const VISITEXT_MAX_DOCS=30;
const VISITEXT_MAX_PAGES=500;
const VISITEXT_A4_HEIGHT=1123;
const VISITEXT_HIGHLIGHTS=[
  {name:"Лимон",color:"#FEF3C7"},
  {name:"Мята",color:"#D1FAE5"},
  {name:"Небо",color:"#DBEAFE"},
  {name:"Роза",color:"#FCE7F3"},
  {name:"Лаванда",color:"#EDE9FE"},
];

const visitextContent=(doc:Partial<VisiTextDoc>)=>JSON.stringify({
  html:doc.html||"<p>Начни писать здесь...</p>",
  fontSize:doc.fontSize||16,
  lineHeight:doc.lineHeight||"1.5",
});
const visitextStamp=(v:any)=>v?new Date(v).getTime():Date.now();
const parseVisiTextDoc=(row:any):VisiTextDoc=>{
  let parsed:any=null;
  try{parsed=JSON.parse(row?.content||"");}catch{}
  const html=typeof parsed?.html==="string"?parsed.html:(row?.content||"<p>Начни писать здесь...</p>");
  return{
    id:row.id,
    title:row.title||"Без названия",
    html,
    fontSize:Number(parsed?.fontSize||16),
    lineHeight:String(parsed?.lineHeight||"1.5"),
    pageCount:Number(row.page_count||1),
    createdAt:visitextStamp(row.created_at),
    updatedAt:visitextStamp(row.updated_at||row.created_at),
  };
};

function VisiTextPage({userId}:{userId:string}){
  const {dark}=useTheme();
  const isMobile=useIsMobile();
  const editorRef=useRef<HTMLDivElement|null>(null);
  const fileRef=useRef<HTMLInputElement|null>(null);
  const saveTimer=useRef<any>(null);
  const historyPast=useRef<{items:BItem[];lines:BLine[]}[]>([]);
  const historyFuture=useRef<{items:BItem[];lines:BLine[]}[]>([]);
  const historySkip=useRef(false);
  const seededRef=useRef(false);
  const vt=useTable("visitext_docs",userId);
  const docs=useMemo(()=>vt.data.map(parseVisiTextDoc),[vt.data]);
  const [activeId,setActiveId]=useState<string|null>(null);
  const [pages,setPages]=useState(1);
  const [notice,setNotice]=useState("");

  const activeDoc=docs.find(d=>d.id===activeId)||docs[0]||null;

  useEffect(()=>{
    if(!activeId&&docs[0])setActiveId(docs[0].id);
    if(activeId&&!docs.some(d=>d.id===activeId))setActiveId(docs[0]?.id||null);
  },[docs,activeId]);

  useEffect(()=>{
    if(vt.loading||seededRef.current||docs.length>0)return;
    seededRef.current=true;
    vt.add({
      title:"Мой первый документ",
      content:visitextContent({html:"<h1>Мой первый документ</h1><p>Начни писать здесь...</p>",fontSize:16,lineHeight:"1.5"}),
      page_count:1,
    }).then((row:any)=>{if(row)setActiveId(row.id);});
  },[vt.loading,docs.length]);

  useEffect(()=>{
    if(!activeDoc||!editorRef.current)return;
    editorRef.current.innerHTML=activeDoc.html||"";
    requestAnimationFrame(()=>calcPages());
  },[activeDoc?.id]);

  const calcPages=()=>{
    const el=editorRef.current;
    if(!el)return 1;
    const next=Math.max(1,Math.ceil(el.scrollHeight/VISITEXT_A4_HEIGHT));
    setPages(next);
    if(next>VISITEXT_MAX_PAGES)setNotice("Лимит одного документа — 500 страниц. Сократи текст или изображения, чтобы сохранить изменения.");
    return next;
  };

  const patchActive=async(patch:Partial<VisiTextDoc>)=>{
    if(!activeDoc)return;
    const next={...activeDoc,...patch,updatedAt:Date.now()};
    const pageCount=patch.pageCount||calcPages();
    if(pageCount>VISITEXT_MAX_PAGES){setNotice("Лимит одного документа — 500 страниц. Изменения не сохранены.");return;}
    try{
      await vt.update(activeDoc.id,{
        title:next.title||"Без названия",
        content:visitextContent(next),
        page_count:pageCount,
      });
    }catch(e){
      console.error("visitext save",e);
      setNotice("Не удалось сохранить документ в Supabase. Проверь таблицу visitext_docs и RLS-политики.");
    }
  };

  const persistContent=(immediate=false)=>{
    const el=editorRef.current;
    if(!el||!activeDoc)return;
    const p=calcPages();
    if(p>VISITEXT_MAX_PAGES)return;
    const html=el.innerHTML;
    if(immediate){patchActive({html,pageCount:p});return;}
    clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>patchActive({html,pageCount:p}),450);
  };

  const runCmd=(cmd:string,value?:string)=>{
    editorRef.current?.focus();
    try{document.execCommand(cmd,false,value);}catch{}
    persistContent(true);
  };

  const changeFontSize=(size:number)=>{
    patchActive({fontSize:size});
    setTimeout(()=>persistContent(true),0);
  };

  const changeLineHeight=(lh:string)=>{
    patchActive({lineHeight:lh});
    setTimeout(()=>persistContent(true),0);
  };

  const createDoc=async()=>{
    if(docs.length>=VISITEXT_MAX_DOCS){setNotice("Можно создать максимум 30 документов в Vizzy Text.");return;}
    const row=await vt.add({
      title:"Документ "+(docs.length+1),
      content:visitextContent({html:"<p>Начни писать здесь...</p>",fontSize:16,lineHeight:"1.5"}),
      page_count:1,
    });
    if(row){setActiveId(row.id);setNotice("Создан новый документ.");}
    else setNotice("Не удалось создать документ в Supabase.");
  };

  const duplicateDoc=async()=>{
    if(!activeDoc)return;
    if(docs.length>=VISITEXT_MAX_DOCS){setNotice("Можно создать максимум 30 документов в Vizzy Text.");return;}
    const row=await vt.add({
      title:activeDoc.title+" — копия",
      content:visitextContent(activeDoc),
      page_count:activeDoc.pageCount||pages||1,
    });
    if(row)setActiveId(row.id);
    else setNotice("Не удалось создать копию документа.");
  };

  const deleteDoc=async()=>{
    if(!activeDoc)return;
    if(docs.length<=1){setNotice("Нельзя удалить последний документ.");return;}
    if(!confirm("Удалить документ «"+activeDoc.title+"»?"))return;
    await vt.remove(activeDoc.id);
    const next=docs.filter(d=>d.id!==activeDoc.id);
    setActiveId(next[0]?.id||null);
  };

  const renameDoc=(title:string)=>patchActive({title:title||"Без названия"});

  const insertImage=(file:File)=>{
    if(!file.type.startsWith("image/"))return;
    if(file.size>2.5*1024*1024){setNotice("Изображение слишком большое. Для стабильной работы выбери файл до 2.5 МБ.");return;}
    const reader=new FileReader();
    reader.onload=()=>{
      const src=String(reader.result||"");
      const html=`<p><img src="${src}" style="max-width:100%;height:auto;border-radius:10px;display:block;margin:18px auto;box-shadow:0 8px 24px rgba(15,23,42,0.12);" /></p><p><br></p>`;
      runCmd("insertHTML",html);
      requestAnimationFrame(()=>persistContent(true));
    };
    reader.readAsDataURL(file);
  };

  const exportHtml=()=>{
    if(!activeDoc)return;
    persistContent(true);
    const blob=new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>${activeDoc.title}</title><style>body{font-family:Inter,Arial,sans-serif;background:#f3f4f6;padding:32px}.page{width:794px;min-height:1123px;background:#fff;margin:0 auto;padding:72px;box-shadow:0 10px 40px rgba(0,0,0,.12);font-size:${activeDoc.fontSize}px;line-height:${activeDoc.lineHeight}}</style></head><body><div class="page">${editorRef.current?.innerHTML||activeDoc.html}</div></body></html>`],{type:"text/html;charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download=(activeDoc.title||"visitext")+".html";a.click();URL.revokeObjectURL(a.href);
  };

  const toolBtn=(label:string,onClick:()=>void,active=false,style?:React.CSSProperties)=><button onClick={onClick} style={{height:34,minWidth:34,padding:"0 10px",borderRadius:9,border:"1px solid "+(active?C.a:C.bd),background:active?C.a:(dark?"rgba(255,255,255,0.04)":"#fff"),color:active?"#fff":C.t1,fontSize:13,fontWeight:700,cursor:"pointer",...style}}>{label}</button>;

  if(vt.loading)return <Card><div style={{fontSize:15,color:C.t2}}>Загружаю документы Vizzy Text из Supabase...</div></Card>;

  return <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"280px 1fr",gap:20,alignItems:"start"}}>
    <Card style={{padding:0,overflow:"hidden",position:isMobile?"relative":"sticky",top:20}}>
      <div style={{padding:18,borderBottom:"1px solid "+C.bd,background:dark?"rgba(255,255,255,0.02)":"#F8FAFC"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:C.t1}}>Vizzy Text</div>
            <div style={{fontSize:12,color:C.t2,marginTop:2}}>Word-like редактор · Supabase · A4</div>
          </div>
          <div style={{fontSize:11,fontWeight:800,color:docs.length>=VISITEXT_MAX_DOCS?C.r:C.a,background:(docs.length>=VISITEXT_MAX_DOCS?C.r:C.a)+"12",borderRadius:999,padding:"5px 9px"}}>{docs.length}/{VISITEXT_MAX_DOCS}</div>
        </div>
        <Btn onClick={createDoc} disabled={docs.length>=VISITEXT_MAX_DOCS} style={{width:"100%",padding:"10px 12px"}}>+ Новый документ</Btn>
      </div>
      <div style={{maxHeight:isMobile?220:"calc(100vh - 260px)",overflowY:"auto",padding:10}}>
        {docs.map(d=>{
          const isAct=d.id===activeDoc?.id;
          return <button key={d.id} onClick={()=>setActiveId(d.id)} style={{width:"100%",textAlign:"left",border:"1px solid "+(isAct?C.a:C.bd),background:isAct?(dark?"rgba(79,142,247,0.16)":"#EFF6FF"):(dark?"rgba(255,255,255,0.025)":"#fff"),borderRadius:12,padding:12,marginBottom:8,cursor:"pointer"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:34,height:44,borderRadius:5,background:"#fff",border:"1px solid #E5E7EB",boxShadow:"0 2px 6px rgba(0,0,0,0.08)",flexShrink:0}}/>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:isAct?C.a:C.t1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.title||"Без названия"}</div>
                <div style={{fontSize:11,color:C.t2,marginTop:4}}>изменён {new Date(d.updatedAt).toLocaleDateString("ru-RU")}</div>
              </div>
            </div>
          </button>;
        })}
      </div>
    </Card>

    <div style={{minWidth:0}}>
      <Card style={{padding:16,marginBottom:16,position:"sticky",top:14,zIndex:20,backdropFilter:"blur(18px)",background:dark?"rgba(15,20,32,0.92)":"rgba(255,255,255,0.92)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <input value={activeDoc?.title||""} onChange={e=>renameDoc(e.target.value)} placeholder="Название документа" style={{...iS(),width:260,fontWeight:700}}/>
          <select value={activeDoc?.fontSize||16} onChange={e=>changeFontSize(+e.target.value)} style={{...iS(),width:112}}>
            {[12,14,16,18,20,24,28,32,36,48].map(s=><option key={s} value={s}>{s}px</option>)}
          </select>
          <select value={activeDoc?.lineHeight||"1.5"} onChange={e=>changeLineHeight(e.target.value)} style={{...iS(),width:142}}>
            <option value="1">Интервал 1.0</option><option value="1.15">Интервал 1.15</option><option value="1.5">Интервал 1.5</option><option value="2">Интервал 2.0</option><option value="2.5">Интервал 2.5</option>
          </select>
          <div style={{width:1,height:28,background:C.bd}}/>
          {toolBtn("B",()=>runCmd("bold"),false,{fontWeight:900})}
          {toolBtn("I",()=>runCmd("italic"),false,{fontStyle:"italic"})}
          {toolBtn("U",()=>runCmd("underline"),false,{textDecoration:"underline"})}
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"0 4px"}}>
            {VISITEXT_HIGHLIGHTS.map(h=><button key={h.color} title={h.name} onClick={()=>runCmd("backColor",h.color)} style={{width:26,height:26,borderRadius:8,border:"1px solid rgba(0,0,0,0.08)",background:h.color,cursor:"pointer",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.8)"}}/>)}
          </div>
          {toolBtn("✕ маркер",()=>runCmd("removeFormat"),false,{fontWeight:600,minWidth:78})}
          <div style={{width:1,height:28,background:C.bd}}/>
          {toolBtn("Фото",()=>fileRef.current?.click(),false,{minWidth:62})}
          {toolBtn("Копия",duplicateDoc,false,{minWidth:64})}
          {toolBtn("HTML",exportHtml,false,{minWidth:58})}
          {toolBtn("Удалить",deleteDoc,false,{minWidth:72,color:C.r})}
        </div>
      </Card>

      {notice&&<div style={{marginBottom:14,padding:"11px 14px",borderRadius:12,background:(notice.includes("Лимит")||notice.includes("максимум")||notice.includes("большой")||notice.includes("Не удалось")?C.r:C.a)+"12",color:notice.includes("Лимит")||notice.includes("максимум")||notice.includes("большой")||notice.includes("Не удалось")?C.r:C.a,fontSize:13,fontWeight:700,display:"flex",justifyContent:"space-between",gap:12}}><span>{notice}</span><button onClick={()=>setNotice("")} style={{border:"none",background:"transparent",color:"inherit",cursor:"pointer",fontWeight:900}}>×</button></div>}

      <div style={{display:"flex",justifyContent:"center",padding:"10px 0 28px",overflowX:"auto"}}>
        <div style={{position:"relative"}}>
          <div style={{position:isMobile?"relative":"absolute",right:isMobile?"auto":-78,top:isMobile?0:10,display:"flex",flexDirection:isMobile?"row":"column",gap:8,alignItems:"center",justifyContent:isMobile?"center":"flex-start",marginBottom:isMobile?10:0}}>
            <div style={{padding:"8px 10px",borderRadius:10,background:dark?"#0F1420":"#fff",border:"1px solid "+C.bd,boxShadow:C.sh,fontSize:11,fontWeight:800,color:pages>VISITEXT_MAX_PAGES?C.r:C.t2,whiteSpace:"nowrap"}}>{pages} / {VISITEXT_MAX_PAGES} стр.</div>
            <div style={{fontSize:10,color:C.t2,writingMode:isMobile?"horizontal-tb":"vertical-rl",textTransform:"uppercase",letterSpacing:1}}>A4 лист</div>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={()=>persistContent(false)}
            onBlur={()=>persistContent(true)}
            onPaste={e=>{
              const files=Array.from(e.clipboardData.files||[]);
              const img=files.find(f=>f.type.startsWith("image/"));
              if(img){e.preventDefault();insertImage(img);return;}
            }}
            style={{
              width:isMobile?"min(794px, calc(100vw - 48px))":794,minHeight:isMobile?Math.round(VISITEXT_A4_HEIGHT*0.72):VISITEXT_A4_HEIGHT,background:"#fff",color:"#111827",
              padding:isMobile?"36px":"72px",outline:"none",borderRadius:2,
              boxShadow:dark?"0 24px 80px rgba(0,0,0,0.55)":"0 20px 70px rgba(15,23,42,0.18)",
              border:"1px solid #E5E7EB",fontFamily:"'Inter',Arial,sans-serif",
              fontSize:activeDoc?.fontSize||16,lineHeight:activeDoc?.lineHeight||"1.5",
              overflowWrap:"break-word",wordBreak:"break-word",caretColor:C.a,
            }}
          />
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)insertImage(f);e.currentTarget.value="";}}/>
    </div>
  </div>;
}

/* ============ SHEETS v3 — Full Excel-like per TZ ============ */
const SH_MAX_WB=30;
const SH_MAX_SHEETS=5;
const SH_ROWS=2000;
const SH_COLS=500;
const SH_DEF_COL=100;
const SH_DEF_ROW=24;
const SH_HDR_H=26;
const SH_HDR_W=52;
const SH_UNDO_DEPTH=20;

function shColNm(i:number):string{let s="",n=i;do{s=String.fromCharCode(65+(n%26))+s;n=Math.floor(n/26)-1;}while(n>=0);return s;}
function shColIx(name:string):number{let n=0;for(let i=0;i<name.length;i++)n=n*26+(name.charCodeAt(i)-64);return n-1;}
function shKey(r:number,c:number):string{return r+","+c;}
function shRef(r:number,c:number):string{return shColNm(c)+(r+1);}

type SHFmt={bold?:boolean;italic?:boolean;align?:"left"|"center"|"right";bg?:string;color?:string;};
type SHCell={v:string;f:string|null;fmt:SHFmt;};
type SHSheet={id:string;name:string;data:Record<string,SHCell>;cw:Record<number,number>;rh:Record<number,number>;};
type SHWb={id:string;name:string;sheets:SHSheet[];si:number;};

function shBid(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}
function shMkSheet(name:string):SHSheet{return{id:shBid(),name,data:{},cw:{},rh:{}};}
function shMkWb(name:string):SHWb{return{id:shBid(),name,sheets:[shMkSheet("Лист 1")],si:0};}

// ── Formula engine ──────────────────────────────────────────
function shCalc(formula:string,data:Record<string,SHCell>,depth=0):string{
  if(depth>50)return"#ЦИКЛ!";
  if(!formula.startsWith("="))return formula;
  let expr=formula.slice(1).trim();

  const res=(ref:string):number=>{
    const m=ref.match(/^([A-Z]+)(\d+)$/i);
    if(!m)return 0;
    const cell=data[shKey(parseInt(m[2])-1,shColIx(m[1].toUpperCase()))];
    if(!cell||!cell.v&&!cell.f)return 0;
    const raw=cell.f?shCalc(cell.f,data,depth+1):cell.v;
    const n=parseFloat(raw);return isNaN(n)?0:n;
  };

  const expandRange=(a:string,b:string):number[]=>{
    const ma=a.match(/^([A-Z]+)(\d+)$/i),mb=b.match(/^([A-Z]+)(\d+)$/i);
    if(!ma||!mb)return[];
    const c1=shColIx(ma[1].toUpperCase()),r1=parseInt(ma[2])-1;
    const c2=shColIx(mb[1].toUpperCase()),r2=parseInt(mb[2])-1;
    const vals:number[]=[];
    for(let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++)
      for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++)
        vals.push(res(shRef(r,c)));
    return vals;
  };

  // Normalise RU→EN
  expr=expr.replace(/СУММ/gi,"SUM").replace(/СРЗНАЧ|СРЕДНЕЕ/gi,"AVG")
    .replace(/МАКС/gi,"MAX").replace(/МИН/gi,"MIN").replace(/СЧЁТ/gi,"COUNT")
    .replace(/ЕСЛИ/gi,"IF");

  // SUM/AVG/MAX/MIN/COUNT with range A1:B5
  const mRange=expr.match(/^(SUM|AVG|AVERAGE|MAX|MIN|COUNT)\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
  if(mRange){
    const fn=mRange[1].toUpperCase(),vals=expandRange(mRange[2],mRange[3]);
    if(!vals.length)return"0";
    if(fn==="SUM")return String(vals.reduce((s,v)=>s+v,0));
    if(fn==="AVG"||fn==="AVERAGE")return String(+(vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(10));
    if(fn==="MAX")return String(Math.max(...vals));
    if(fn==="MIN")return String(Math.min(...vals));
    if(fn==="COUNT")return String(vals.filter(v=>v!==0).length);
  }

  // SUM(A1;B2;C3) semicolon list
  const mList=expr.match(/^(SUM|AVG|MAX|MIN)\(([^)]+)\)$/i);
  if(mList){
    const vals=mList[2].split(/[;,]/).map(p=>{
      const pt=p.trim();
      return/^[A-Z]+\d+$/i.test(pt)?res(pt):parseFloat(pt)||0;
    });
    const fn=mList[1].toUpperCase();
    if(fn==="SUM")return String(vals.reduce((s,v)=>s+v,0));
    if(fn==="AVG")return vals.length?String(+(vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(10)):"0";
    if(fn==="MAX")return String(Math.max(...vals));
    if(fn==="MIN")return String(Math.min(...vals));
  }

  // General arithmetic: =A1+B2*3/(C1-1)
  try{
    const math=expr.toUpperCase().replace(/([A-Z]+\d+)/g,r=>`(${res(r)})`);
    // eslint-disable-next-line no-new-func
    const result=new Function("return "+math)();
    if(!isFinite(result))return"#ДЕЛ/0!";
    if(isNaN(result))return"#ЗНАЧ!";
    // Clean up floating point noise
    const s=String(+result.toFixed(10));
    return s;
  }catch{return"#ОШИБКА!";}
}

// Shift formula refs for fill handle / copy-paste
function shShift(formula:string,dr:number,dc:number):string{
  if(!formula.startsWith("="))return formula;
  return formula.replace(/([A-Z]+)(\d+)/g,(_,col,row)=>{
    const nc=Math.max(0,shColIx(col)+dc);
    const nr=Math.max(0,parseInt(row)-1+dr);
    return shColNm(nc)+(nr+1);
  });
}

function SheetsPage({userId}:{userId:string}){
  const{dark}=useTheme();

  // ── Workbooks ──
  const[wbs,setWbs]=useState<SHWb[]>([]);
  const[activeWbId,setActiveWbId]=useState<string|null>(null);
  const[loading,setLoading]=useState(true);
  const[newWbModal,setNewWbModal]=useState(false);
  const[newWbName,setNewWbName]=useState("");
  const[toast,setToast]=useState<string|null>(null);
  const saveTimer=useRef<any>(null);
  const toastTimer=useRef<any>(null);

  // ── Selection ──
  const[sel,setSel]=useState<{r:number;c:number}>({r:0,c:0});
  const[selRange,setSelRange]=useState<{r1:number;c1:number;r2:number;c2:number}|null>(null);
  const[editing,setEditing]=useState(false);
  const[editVal,setEditVal]=useState("");
  // Formula click mode: when typing a formula, clicking a cell inserts its ref
  const[formulaMode,setFormulaMode]=useState(false);
  const[formulaRef,setFormulaRef]=useState<{r:number;c:number}|null>(null); // highlighted ref cell

  // ── Drag selection ──
  const[dragSel,setDragSel]=useState(false);
  const[dragSelStart,setDragSelStart]=useState<{r:number;c:number}|null>(null);

  // ── Fill handle ──
  const[fillDrag,setFillDrag]=useState(false);
  const[fillEnd,setFillEnd]=useState<{r:number;c:number}|null>(null);

  // ── Resize ──
  const resizingCol=useRef<{col:number;startX:number;startW:number}|null>(null);
  const resizingRow=useRef<{row:number;startY:number;startH:number}|null>(null);

  // ── Undo stack ──
  const undoStack=useRef<Record<string,SHCell>[]>([]);
  const pushUndo=(data:Record<string,SHCell>)=>{
    undoStack.current=[{...data},...undoStack.current.slice(0,SH_UNDO_DEPTH-1)];
  };

  // ── Clipboard ──
  const clipRef=useRef<{cells:Record<string,SHCell>;dr:number;dc:number}|null>(null);

  // ── Scroll / virtual ──
  const[scrollTop,setScrollTop]=useState(0);
  const[scrollLeft,setScrollLeft]=useState(0);
  const gridRef=useRef<HTMLDivElement>(null);
  const cellInputRef=useRef<HTMLInputElement>(null);
  const formulaBarRef=useRef<HTMLInputElement>(null);

  // Visible range
  const visH=typeof window!=="undefined"?window.innerHeight-64-46-32-34:600;
  const visW=typeof window!=="undefined"?window.innerWidth-248-SH_HDR_W:800;
  const visR0=Math.max(0,Math.floor(scrollTop/SH_DEF_ROW)-2);
  const visR1=Math.min(SH_ROWS-1,visR0+Math.ceil(visH/SH_DEF_ROW)+4);
  const visC0=Math.max(0,Math.floor(scrollLeft/SH_DEF_COL)-1);
  const visC1=Math.min(SH_COLS-1,visC0+Math.ceil(visW/SH_DEF_COL)+3);

  const wb=wbs.find(w=>w.id===activeWbId)||null;
  const sheet=wb?(wb.sheets[wb.si]||wb.sheets[0]):null;
  const data=sheet?.data||{};

  const showToast=(msg:string)=>{setToast(msg);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(null),2500);};

  // Get column width / row height
  const cw=(c:number)=>sheet?.cw[c]||SH_DEF_COL;
  const rh=(r:number)=>sheet?.rh[r]||SH_DEF_ROW;

  // ── Persist ──
  useEffect(()=>{
    const saved=localStorage.getItem(`ff_sheets3_${userId}`);
    if(saved){try{const d=JSON.parse(saved);setWbs(d);if(d.length)setActiveWbId(d[0].id);}catch{}}
    setLoading(false);
  },[userId]);

  const persist=(ws:SHWb[])=>{
    clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{try{localStorage.setItem(`ff_sheets3_${userId}`,JSON.stringify(ws));}catch{}},1000);
  };

  const updWbs=(fn:(p:SHWb[])=>SHWb[])=>setWbs(p=>{const n=fn(p);persist(n);return n;});

  const updSheet=(fn:(s:SHSheet)=>SHSheet)=>{
    if(!wb)return;
    const si=wb.si;
    updWbs(ws=>ws.map(w=>w.id===activeWbId?{...w,sheets:w.sheets.map((s,i)=>i===si?fn(s):s)}:w));
  };

  const updData=(fn:(d:Record<string,SHCell>)=>Record<string,SHCell>,addUndo=true)=>{
    if(addUndo)pushUndo(data);
    updSheet(s=>({...s,data:fn(s.data)}));
  };

  const getCell=(r:number,c:number):SHCell=>data[shKey(r,c)]||{v:"",f:null,fmt:{}};
  const display=(r:number,c:number):string=>{
    const cell=data[shKey(r,c)];
    if(!cell)return"";
    return cell.f?shCalc(cell.f,data):cell.v;
  };

  // ── Commit edit ──
  const commitEdit=useCallback(()=>{
    if(!editing)return;
    const k=shKey(sel.r,sel.c);
    const isF=editVal.startsWith("=");
    pushUndo(data);
    updSheet(s=>{
      const nd={...s.data};
      const cell:SHCell={...(nd[k]||{v:"",f:null,fmt:{}}),f:isF?editVal:null,v:isF?shCalc(editVal,s.data):editVal};
      if(!cell.v&&!cell.f){delete nd[k];}else{nd[k]=cell;}
      return{...s,data:nd};
    });
    setEditing(false);setFormulaMode(false);setFormulaRef(null);
  },[editing,editVal,sel,data]);

  const startEdit=(r:number,c:number,init?:string)=>{
    const cell=getCell(r,c);
    setSel({r,c});setSelRange(null);
    const v=init!==undefined?init:(cell.f||cell.v||"");
    setEditVal(v);
    setEditing(true);
    setFormulaMode(v.startsWith("="));
    setTimeout(()=>cellInputRef.current?.focus(),10);
  };

  // ── Fill handle drag ──
  const applyFill=(endR:number,endC:number)=>{
    const srcRange=selRange||{r1:sel.r,c1:sel.c,r2:sel.r,c2:sel.c};
    const{r1,c1,r2,c2}=srcRange;
    pushUndo(data);
    updSheet(s=>{
      const nd={...s.data};
      // Determine direction and fill
      if(endR>r2){ // fill down
        for(let r=r2+1;r<=endR;r++){
          const dr=r-r1;
          for(let c=c1;c<=c2;c++){
            const src=nd[shKey(r1+(r-r2-1)%(r2-r1+1),c)]||{v:"",f:null,fmt:{}};
            const dc=0;
            const nf=src.f?shShift(src.f,dr,dc):null;
            nd[shKey(r,c)]={...src,f:nf,v:nf?shCalc(nf,nd):src.v};
          }
        }
      } else if(endR<r1){ // fill up
        for(let r=r1-1;r>=endR;r--){
          const dr=r-r2;
          for(let c=c1;c<=c2;c++){
            const src=nd[shKey(r2-(r1-r-1)%(r2-r1+1),c)]||{v:"",f:null,fmt:{}};
            const nf=src.f?shShift(src.f,dr,0):null;
            nd[shKey(r,c)]={...src,f:nf,v:nf?shCalc(nf,nd):src.v};
          }
        }
      } else if(endC>c2){ // fill right
        for(let c=c2+1;c<=endC;c++){
          const dc=c-c1;
          for(let r=r1;r<=r2;r++){
            const src=nd[shKey(r,c1+(c-c2-1)%(c2-c1+1))]||{v:"",f:null,fmt:{}};
            const nf=src.f?shShift(src.f,0,dc):null;
            nd[shKey(r,c)]={...src,f:nf,v:nf?shCalc(nf,nd):src.v};
          }
        }
      } else if(endC<c1){ // fill left
        for(let c=c1-1;c>=endC;c--){
          const dc=c-c2;
          for(let r=r1;r<=r2;r++){
            const src=nd[shKey(r,c2-(c1-c-1)%(c2-c1+1))]||{v:"",f:null,fmt:{}};
            const nf=src.f?shShift(src.f,0,dc):null;
            nd[shKey(r,c)]={...src,f:nf,v:nf?shCalc(nf,nd):src.v};
          }
        }
      }
      return{...s,data:nd};
    });
  };

  // ── Undo ──
  const undo=()=>{
    if(!undoStack.current.length)return;
    const prev=undoStack.current[0];
    undoStack.current=undoStack.current.slice(1);
    updSheet(s=>({...s,data:prev}));
    showToast("↩ Отменено");
  };

  // ── Copy/paste ──
  const copySelection=()=>{
    const{r1=sel.r,c1=sel.c,r2=sel.r,c2=sel.c}=selRange||{r1:sel.r,c1:sel.c,r2:sel.r,c2:sel.c};
    const cells:Record<string,SHCell>={};
    for(let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++)
      for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++){
        const k=shKey(r,c);if(data[k])cells[shKey(r-Math.min(r1,r2),c-Math.min(c1,c2))]=data[k];
      }
    clipRef.current={cells,dr:Math.min(r1,r2),dc:Math.min(c1,c2)};
    showToast("📋 Скопировано");
  };

  const paste=()=>{
    if(!clipRef.current)return;
    const{cells}=clipRef.current;
    pushUndo(data);
    updSheet(s=>{
      const nd={...s.data};
      Object.entries(cells).forEach(([k,cell])=>{
        const[dr,dc]=k.split(",").map(Number);
        const nr=sel.r+dr,nc=sel.c+dc;
        if(nr<SH_ROWS&&nc<SH_COLS){
          const nf=cell.f?shShift(cell.f,dr,dc):null;
          nd[shKey(nr,nc)]={...cell,f:nf,v:nf?shCalc(nf,nd):cell.v};
        }
      });
      return{...s,data:nd};
    });
    showToast("📌 Вставлено");
  };

  // ── Format ──
  const fmt=(key:keyof SHFmt,val:any)=>{
    const{r1=sel.r,c1=sel.c,r2=sel.r,c2=sel.c}=selRange||{r1:sel.r,c1:sel.c,r2:sel.r,c2:sel.c};
    updData(d=>{
      const nd={...d};
      for(let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++)
        for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++){
          const k=shKey(r,c);
          nd[k]={...(nd[k]||{v:"",f:null,fmt:{}}),fmt:{...(nd[k]?.fmt||{}),[key]:val}};
        }
      return nd;
    },false);
  };

  // ── WB management ──
  const createWb=()=>{
    if(wbs.length>=SH_MAX_WB){showToast(`⚠ Лимит ${SH_MAX_WB} таблиц`);return;}
    const w=shMkWb(newWbName.trim()||`Таблица ${wbs.length+1}`);
    // Empty by default per TZ
    updWbs(p=>[...p,w]);
    setActiveWbId(w.id);setNewWbModal(false);setNewWbName("");
    showToast("✅ Таблица создана");
  };
  const deleteWb=(id:string)=>{if(!confirm("Удалить таблицу?"))return;updWbs(p=>p.filter(w=>w.id!==id));if(activeWbId===id)setActiveWbId(null);};

  // ── Sheet tabs ──
  const addSheet=()=>{
    if(!wb)return;
    if(wb.sheets.length>=SH_MAX_SHEETS){showToast(`⚠ Лимит ${SH_MAX_SHEETS} листов`);return;}
    const s=shMkSheet(`Лист ${wb.sheets.length+1}`);
    updWbs(ws=>ws.map(w=>w.id===activeWbId?{...w,sheets:[...w.sheets,s],si:w.sheets.length}:w));
  };
  const switchSheet=(i:number)=>{
    updWbs(ws=>ws.map(w=>w.id===activeWbId?{...w,si:i}:w));
    setSel({r:0,c:0});setSelRange(null);setEditing(false);
  };
  const deleteSheet=(i:number)=>{
    if(!wb||wb.sheets.length<=1){showToast("⚠ Нельзя удалить последний лист");return;}
    updWbs(ws=>ws.map(w=>w.id===activeWbId?{...w,sheets:w.sheets.filter((_,j)=>j!==i),si:Math.min(w.si,w.sheets.length-2)}:w));
  };

  // ── Excel export ──
  const exportExcel=()=>{
    if(!wb)return;
    const loadAndExport=()=>{
      const XLSX=(window as any).XLSX;
      const xlWb=XLSX.utils.book_new();
      wb.sheets.forEach(s=>{
        let maxR=0,maxC=0;
        Object.keys(s.data).forEach(k=>{const[r,c]=k.split(",").map(Number);if(r>maxR)maxR=r;if(c>maxC)maxC=c;});
        const arr:any[][]=[];
        for(let r=0;r<=maxR;r++){
          const row:any[]=[];
          for(let c=0;c<=maxC;c++){const cell=s.data[shKey(r,c)];const val=cell?(cell.f?shCalc(cell.f,s.data):cell.v):"";const n=parseFloat(val);row.push(val===""?null:!isNaN(n)?n:val);}
          arr.push(row);
        }
        const xlSheet=XLSX.utils.aoa_to_sheet(arr);
        xlSheet["!cols"]=Array(maxC+1).fill({wch:14});
        XLSX.utils.book_append_sheet(xlWb,xlSheet,s.name);
      });
      XLSX.writeFile(xlWb,`${wb.name}.xlsx`);
      showToast(`✅ ${wb.name}.xlsx`);
    };
    if((window as any).XLSX){loadAndExport();}
    else{const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";sc.onload=loadAndExport;document.head.appendChild(sc);}
  };

  // ── Auto-scroll to sel ──
  useEffect(()=>{
    if(!gridRef.current)return;
    const el=gridRef.current;
    const colOffset=Array.from({length:sel.c},(_,i)=>cw(i)).reduce((s,v)=>s+v,0);
    const rowOffset=Array.from({length:sel.r},(_,i)=>rh(i)).reduce((s,v)=>s+v,0);
    if(colOffset<el.scrollLeft)el.scrollLeft=colOffset;
    else if(colOffset+cw(sel.c)>el.scrollLeft+el.clientWidth-SH_HDR_W)el.scrollLeft=colOffset+cw(sel.c)-el.clientWidth+SH_HDR_W+20;
    if(rowOffset<el.scrollTop)el.scrollTop=rowOffset;
    else if(rowOffset+rh(sel.r)>el.scrollTop+el.clientHeight-SH_HDR_H)el.scrollTop=rowOffset+rh(sel.r)-el.clientHeight+SH_HDR_H+10;
  },[sel]);

  // ── Keyboard ──
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if(!wb)return;
      const tag=(e.target as HTMLElement).tagName;

      if(editing){
        if(e.key==="Enter"){e.preventDefault();commitEdit();setSel(s=>({r:Math.min(SH_ROWS-1,s.r+1),c:s.c}));}
        else if(e.key==="Tab"){e.preventDefault();commitEdit();setSel(s=>({r:s.r,c:Math.min(SH_COLS-1,s.c+1)}));}
        else if(e.key==="Escape"){setEditing(false);setFormulaMode(false);setFormulaRef(null);}
        return;
      }
      if(tag==="INPUT"||tag==="TEXTAREA")return;

      if((e.ctrlKey||e.metaKey)&&e.key==="z"){e.preventDefault();undo();return;}
      if((e.ctrlKey||e.metaKey)&&e.key==="c"){e.preventDefault();copySelection();return;}
      if((e.ctrlKey||e.metaKey)&&e.key==="v"){e.preventDefault();paste();return;}
      if((e.ctrlKey||e.metaKey)&&e.key==="a"){e.preventDefault();setSelRange({r1:0,c1:0,r2:SH_ROWS-1,c2:SH_COLS-1});return;}
      if((e.ctrlKey||e.metaKey)&&e.key==="e"){e.preventDefault();exportExcel();return;}

      const mv=(dr:number,dc:number)=>setSel(s=>({r:Math.max(0,Math.min(SH_ROWS-1,s.r+dr)),c:Math.max(0,Math.min(SH_COLS-1,s.c+dc))}));
      if(e.key==="ArrowUp"){e.preventDefault();mv(-1,0);setSelRange(null);}
      else if(e.key==="ArrowDown"){e.preventDefault();mv(1,0);setSelRange(null);}
      else if(e.key==="ArrowLeft"){e.preventDefault();mv(0,-1);setSelRange(null);}
      else if(e.key==="ArrowRight"){e.preventDefault();mv(0,1);setSelRange(null);}
      else if(e.key==="Tab"){e.preventDefault();mv(0,1);}
      else if(e.key==="Enter"){startEdit(sel.r,sel.c);}
      else if(e.key==="F2"){e.preventDefault();startEdit(sel.r,sel.c);}
      else if(e.key==="Delete"||e.key==="Backspace"){
        pushUndo(data);
        updData(d=>{const nd={...d};delete nd[shKey(sel.r,sel.c)];return nd;},false);
      }
      else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){startEdit(sel.r,sel.c,e.key);}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[editing,editVal,sel,selRange,wb,sheet,data]);

  // ── Colors ──
  const bg=dark?"#080B12":"#F8FAFC";
  const surfBg=dark?"#0C1019":"#FFFFFF";
  const hdrBg=dark?"#0C1019":"#F1F5F9";
  const cellBd=dark?"rgba(255,255,255,0.05)":"#E2E8F0";
  const hdrBd=dark?"rgba(255,255,255,0.08)":"#CBD5E1";
  const selBg=dark?"rgba(79,142,247,0.18)":"rgba(37,99,235,0.1)";
  const selBd=dark?"#4F8EF7":"#2563EB";
  const rangeBg=dark?"rgba(79,142,247,0.08)":"rgba(37,99,235,0.04)";
  const formulaBarVal=editing?(editVal):(data[shKey(sel.r,sel.c)]?.f||data[shKey(sel.r,sel.c)]?.v||"");
  const selCell=getCell(sel.r,sel.c);

  // Fill handle preview range
  const fillPreview=fillDrag&&fillEnd?
    (fillEnd.r>=(selRange?selRange.r2:sel.r)&&fillEnd.c>=(selRange?selRange.c2:sel.c)
      ?{r1:selRange?selRange.r2+1:sel.r+1,c1:selRange?selRange.c1:sel.c,r2:fillEnd.r,c2:selRange?selRange.c2:sel.c}
      :fillEnd.r<(selRange?selRange.r1:sel.r)
      ?{r1:fillEnd.r,c1:selRange?selRange.c1:sel.c,r2:selRange?selRange.r1-1:sel.r-1,c2:selRange?selRange.c2:sel.c}
      :fillEnd.c>(selRange?selRange.c2:sel.c)
      ?{r1:selRange?selRange.r1:sel.r,c1:selRange?selRange.c2+1:sel.c+1,r2:selRange?selRange.r2:sel.r,c2:fillEnd.c}
      :{r1:selRange?selRange.r1:sel.r,c1:fillEnd.c,r2:selRange?selRange.r2:sel.r,c2:selRange?selRange.c1-1:sel.c-1})
    :null;

  // Accumulate col positions for virtual scroll
  const colX=useMemo(()=>{
    const xs:number[]=[];let x=0;
    for(let c=0;c<SH_COLS;c++){xs.push(x);x+=cw(c);}
    return xs;
  },[sheet?.cw]);

  const rowY=useMemo(()=>{
    const ys:number[]=[];let y=0;
    for(let r=0;r<SH_ROWS;r++){ys.push(y);y+=rh(r);}
    return ys;
  },[sheet?.rh]);

  const totalW=colX[SH_COLS-1]+(cw(SH_COLS-1));
  const totalH=rowY[SH_ROWS-1]+(rh(SH_ROWS-1));

  // ── LIST SCREEN ──
  if(!activeWbId||!wb){
    return <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:24,fontWeight:800,color:C.t1}}>Таблицы</h1>
          <div style={{fontSize:13,color:C.t2,marginTop:2}}>{wbs.length}/{SH_MAX_WB} таблиц · Excel-совместимые с формулами</div>
        </div>
        <button onClick={()=>setNewWbModal(true)} disabled={wbs.length>=SH_MAX_WB}
          style={{padding:"10px 20px",background:wbs.length>=SH_MAX_WB?"#374151":C.a,color:"#fff",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:wbs.length>=SH_MAX_WB?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новая таблица
        </button>
      </div>

      {loading?<div style={{textAlign:"center",padding:60,color:C.t2}}>Загрузка...</div>
      :wbs.length===0
      ?<div style={{textAlign:"center",padding:"80px 32px",background:surfBg,borderRadius:20,border:"1px solid "+C.bd}}>
          <div style={{fontSize:48,marginBottom:12}}>📊</div>
          <div style={{fontSize:18,fontWeight:700,color:C.t1,marginBottom:8}}>Таблиц пока нет</div>
          <div style={{fontSize:14,color:C.t2,marginBottom:24}}>Формулы, fill handle, Ctrl+Z, экспорт в Excel</div>
          <button onClick={()=>setNewWbModal(true)} style={{padding:"12px 28px",background:C.a,color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Создать таблицу</button>
        </div>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
          {wbs.map(w=>(
            <div key={w.id} onClick={()=>setActiveWbId(w.id)}
              style={{background:surfBg,borderRadius:16,overflow:"hidden",border:"1px solid "+C.bd,cursor:"pointer",transition:"all 0.2s",boxShadow:dark?"0 4px 20px rgba(0,0,0,0.4)":C.sh}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLElement).style.boxShadow=dark?"0 8px 32px rgba(79,142,247,0.12)":"0 8px 28px rgba(0,0,0,0.12)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="none";(e.currentTarget as HTMLElement).style.boxShadow=dark?"0 4px 20px rgba(0,0,0,0.4)":C.sh;}}>
              <div style={{height:100,background:dark?"#0C1019":"#F0FDF4",padding:"10px",display:"flex",flexDirection:"column",gap:3,overflow:"hidden",borderBottom:"1px solid "+C.bd}}>
                {[0,1,2,3].map(r=><div key={r} style={{display:"flex",gap:2}}>
                  {[0,1,2,3,4].map(c=>{
                    const cell=w.sheets[0]?.data[shKey(r,c)];
                    const val=cell?(cell.f?shCalc(cell.f,w.sheets[0].data):cell.v):"";
                    return <div key={c} style={{flex:1,height:14,borderRadius:2,border:"0.5px solid "+cellBd,background:val?(dark?"rgba(79,142,247,0.07)":"rgba(37,99,235,0.04)"):"transparent",fontSize:8,overflow:"hidden",padding:"0 2px",lineHeight:"14px",color:C.t2,fontFamily:"monospace"}}>{val}</div>;
                  })}
                </div>)}
              </div>
              <div style={{padding:"14px 16px"}}>
                <div style={{fontSize:15,fontWeight:700,color:C.t1,marginBottom:3}}>{w.name}</div>
                <div style={{fontSize:11,color:C.t2,marginBottom:14}}>{w.sheets.length} лист{w.sheets.length===1?"":"а"} · {Object.keys(w.sheets[0]?.data||{}).length} ячеек</div>
                <div style={{display:"flex",gap:8}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>setActiveWbId(w.id)} style={{flex:1,padding:"7px",fontSize:12,background:C.a+"12",color:C.a,border:"1px solid "+C.a+"25",borderRadius:9,cursor:"pointer",fontWeight:600}}>✏️ Открыть</button>
                  <button onClick={()=>deleteWb(w.id)} style={{padding:"7px 12px",fontSize:12,background:C.r+"10",color:C.r,border:"1px solid "+C.r+"25",borderRadius:9,cursor:"pointer"}}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>}

      {newWbModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setNewWbModal(false)}>
        <div style={{background:surfBg,borderRadius:20,padding:32,width:380,border:"1px solid "+C.bd,boxShadow:"0 24px 60px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:18,fontWeight:700,marginBottom:16,color:C.t1}}>📊 Новая таблица</div>
          <input autoFocus value={newWbName} onChange={e=>setNewWbName(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")createWb();if(e.key==="Escape")setNewWbModal(false);}}
            placeholder="Название таблицы..."
            style={{width:"100%",padding:"11px 14px",border:"1px solid "+C.bd,borderRadius:10,fontSize:14,outline:"none",background:dark?"#141927":C.ib,color:C.t1,fontFamily:"'Inter',sans-serif",boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
            <Btn onClick={()=>setNewWbModal(false)} primary={false}>Отмена</Btn>
            <Btn onClick={createWb}>Создать</Btn>
          </div>
        </div>
      </div>}

      {toast&&<div style={{position:"fixed",bottom:24,right:24,background:dark?"#1E293B":"#1F2937",color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:500,zIndex:500,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>{toast}</div>}
    </div>;
  }

  // ── GRID SCREEN ──
  return <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 64px)",margin:"-28px -32px",overflow:"hidden",fontFamily:"monospace"}}
    onMouseUp={()=>{
      setDragSel(false);
      if(fillDrag&&fillEnd){applyFill(fillEnd.r,fillEnd.c);}
      setFillDrag(false);setFillEnd(null);
    }}>

    <style>{`
      @keyframes excelGlow{0%,100%{box-shadow:0 0 14px rgba(22,163,74,0.4)}50%{box-shadow:0 0 24px rgba(22,163,74,0.7)}}
      @keyframes formulaDash{to{stroke-dashoffset:-12}}
      .fill-cursor{cursor:crosshair!important;}
      .resize-col-cursor{cursor:col-resize!important;}
      .resize-row-cursor{cursor:row-resize!important;}
    `}</style>

    {/* ── TOOLBAR ── */}
    <div style={{height:46,background:surfBg,borderBottom:"1px solid "+C.bd,display:"flex",alignItems:"center",padding:"0 10px",gap:8,flexShrink:0,zIndex:50,overflowX:"auto"}}>
      {/* Back */}
      <button onClick={()=>{commitEdit();setActiveWbId(null);setSel({r:0,c:0});setEditing(false);}}
        style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"transparent",border:"1px solid "+C.bd,borderRadius:8,fontSize:12,fontWeight:600,color:C.t2,cursor:"pointer",flexShrink:0}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Таблицы
      </button>

      {/* WB name */}
      <input value={wb.name} onChange={e=>updWbs(ws=>ws.map(w=>w.id===activeWbId?{...w,name:e.target.value}:w))}
        style={{fontSize:14,fontWeight:700,color:C.t1,background:"transparent",border:"1px solid transparent",borderRadius:7,padding:"4px 8px",outline:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",minWidth:140,flexShrink:0}}
        onFocus={e=>{(e.target as HTMLInputElement).style.borderColor=C.bd;}}
        onBlur={e=>{(e.target as HTMLInputElement).style.borderColor="transparent";}}/>

      <div style={{width:1,height:20,background:C.bd,flexShrink:0}}/>

      {/* Bold, Italic */}
      {[
        {l:"B",tip:"Жирный (Ctrl+B)",fn:()=>fmt("bold",!selCell.fmt.bold),on:selCell.fmt.bold,s:{fontWeight:800}},
        {l:"I",tip:"Курсив",fn:()=>fmt("italic",!selCell.fmt.italic),on:selCell.fmt.italic,s:{fontStyle:"italic"}},
      ].map((b:any,i)=>(
        <button key={i} onClick={b.fn} title={b.tip}
          style={{width:28,height:28,border:"1px solid "+(b.on?C.a:C.bd),borderRadius:7,background:b.on?C.a+"20":"transparent",color:b.on?C.a:C.t2,cursor:"pointer",fontSize:13,flexShrink:0,...b.s}}>
          {b.l}
        </button>
      ))}

      {/* Align */}
      {(["left","center","right"] as const).map(a=>(
        <button key={a} onClick={()=>fmt("align",a)}
          style={{width:28,height:28,border:"1px solid "+(selCell.fmt.align===a?C.a:C.bd),borderRadius:7,background:selCell.fmt.align===a?C.a+"20":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:selCell.fmt.align===a?C.a:C.t2,flexShrink:0}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {a==="left"&&<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></>}
            {a==="center"&&<><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>}
            {a==="right"&&<><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
      ))}

      {/* Cell bg */}
      <div style={{display:"flex",gap:3,alignItems:"center",flexShrink:0}}>
        <span style={{fontSize:10,color:C.t2}}>Фон:</span>
        {(["","#FEF08A","#BBF7D0","#BFDBFE","#FED7AA","#FECACA","#E9D5FF"] as string[]).map(c=>(
          <button key={c} onClick={()=>fmt("bg",c||undefined)}
            style={{width:16,height:16,borderRadius:3,background:c||"transparent",border:selCell.fmt.bg===c?"2px solid "+C.a:"1px solid "+C.bd,cursor:"pointer",flexShrink:0}}/>
        ))}
      </div>

      <div style={{width:1,height:20,background:C.bd,flexShrink:0}}/>

      {/* Undo */}
      <button onClick={undo} title="Отменить (Ctrl+Z)"
        style={{width:28,height:28,border:"1px solid "+C.bd,borderRadius:7,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2,flexShrink:0}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M3 13A9 9 0 1 0 5.93 6.36"/></svg>
      </button>

      <div style={{flex:1}}/>

      {/* Autosave */}
      <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.g,flexShrink:0}}>
        <div style={{width:5,height:5,borderRadius:"50%",background:C.g}}/>Сохранено
      </div>

      {/* Export Excel — glowing green */}
      <button onClick={exportExcel}
        style={{display:"flex",alignItems:"center",gap:7,padding:"0 14px",height:32,borderRadius:8,border:"none",background:"linear-gradient(135deg,#16A34A,#15803D)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",animation:"excelGlow 2.5s ease-in-out infinite",whiteSpace:"nowrap",flexShrink:0}}
        onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="translateY(-1px)";el.style.animationPlayState="paused";el.style.boxShadow="0 0 24px rgba(22,163,74,0.7)";}}
        onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="none";el.style.animationPlayState="running";el.style.boxShadow="";}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Выгрузить в Excel
      </button>
    </div>

    {/* ── FORMULA BAR ── */}
    <div style={{height:32,background:surfBg,borderBottom:"1px solid "+C.bd,display:"flex",alignItems:"center",padding:"0 10px",gap:8,flexShrink:0}}>
      <div style={{minWidth:56,height:22,background:C.a+"15",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.a,flexShrink:0,fontFamily:"monospace"}}>
        {shColNm(sel.c)}{sel.r+1}
      </div>
      <div style={{width:1,height:18,background:C.bd,flexShrink:0}}/>
      <span style={{fontSize:12,color:C.t2,fontFamily:"monospace",fontStyle:"italic",flexShrink:0}}>fx</span>
      <input ref={formulaBarRef}
        value={formulaBarVal}
        onChange={e=>{
          const v=e.target.value;
          if(!editing){setEditing(true);}
          setEditVal(v);
          setFormulaMode(v.startsWith("="));
        }}
        onFocus={()=>{
          if(!editing){
            setEditVal(data[shKey(sel.r,sel.c)]?.f||data[shKey(sel.r,sel.c)]?.v||"");
            setEditing(true);
          }
        }}
        onBlur={()=>{setTimeout(commitEdit,100);}}
        onKeyDown={e=>{
          if(e.key==="Enter"){e.preventDefault();commitEdit();}
          if(e.key==="Escape"){setEditing(false);setFormulaMode(false);}
        }}
        placeholder="Введи значение или =A1+B2, =СУММ(A1:A10)"
        style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:12,fontFamily:"monospace",color:C.t1,padding:0}}
      />
    </div>

    {/* ── GRID ── */}
    <div ref={gridRef} style={{flex:1,overflow:"auto",position:"relative",background:bg,cursor:fillDrag?"crosshair":"default"}}
      onScroll={e=>{setScrollTop((e.target as HTMLDivElement).scrollTop);setScrollLeft((e.target as HTMLDivElement).scrollLeft);}}
      onMouseMove={e=>{
        if(dragSel&&dragSelStart){
          // find cell under mouse
          const rect=(e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const mx=e.clientX-rect.left+scrollLeft-SH_HDR_W;
          const my=e.clientY-rect.top+scrollTop-SH_HDR_H;
          // find col
          let c=0,cx=0;
          while(c<SH_COLS-1&&cx+cw(c)<=mx)cx+=cw(c++);
          let r=0,ry=0;
          while(r<SH_ROWS-1&&ry+rh(r)<=my)ry+=rh(r++);
          setSelRange({r1:dragSelStart.r,c1:dragSelStart.c,r2:r,c2:c});
        }
        if(fillDrag){
          const rect=(e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const mx=e.clientX-rect.left+scrollLeft-SH_HDR_W;
          const my=e.clientY-rect.top+scrollTop-SH_HDR_H;
          let c=0,cx=0;while(c<SH_COLS-1&&cx+cw(c)<=mx)cx+=cw(c++);
          let r=0,ry=0;while(r<SH_ROWS-1&&ry+rh(r)<=my)ry+=rh(r++);
          setFillEnd({r,c});
        }
        // Column resize
        if(resizingCol.current){
          const{col,startX,startW}=resizingCol.current;
          const newW=Math.max(24,startW+(e.clientX-startX));
          updSheet(s=>({...s,cw:{...s.cw,[col]:newW}}));
        }
        // Row resize
        if(resizingRow.current){
          const{row,startY,startH}=resizingRow.current;
          const newH=Math.max(12,startH+(e.clientY-startY));
          updSheet(s=>({...s,rh:{...s.rh,[row]:newH}}));
        }
      }}
      onMouseUp={()=>{resizingCol.current=null;resizingRow.current=null;}}>

      {/* Canvas size */}
      <div style={{width:SH_HDR_W+totalW,height:SH_HDR_H+totalH,position:"relative"}}>

        {/* ── Column headers ── */}
        <div style={{position:"sticky",top:0,zIndex:25,left:0,display:"flex"}}>
          {/* Corner */}
          <div style={{width:SH_HDR_W,height:SH_HDR_H,background:hdrBg,border:"1px solid "+hdrBd,flexShrink:0,position:"sticky",left:0,zIndex:30,cursor:"default"}}
            onClick={()=>setSelRange({r1:0,c1:0,r2:SH_ROWS-1,c2:SH_COLS-1})}/>
          {/* Visible col headers */}
          <div style={{position:"absolute",left:SH_HDR_W+colX[visC0],display:"flex"}}>
            {Array.from({length:visC1-visC0+1},(_,i)=>{
              const c=visC0+i;
              const isSel=sel.c===c&&!selRange;
              const inRange=selRange&&c>=Math.min(selRange.c1,selRange.c2)&&c<=Math.max(selRange.c1,selRange.c2);
              return <div key={c} style={{width:cw(c),height:SH_HDR_H,background:isSel||inRange?C.a+"14":hdrBg,border:"1px solid "+hdrBd,borderLeft:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:isSel||inRange?C.a:C.t2,userSelect:"none",flexShrink:0,position:"relative"}}
                onClick={()=>{setSel(s=>({...s,c}));setSelRange({r1:0,c1:c,r2:SH_ROWS-1,c2:c});}}>
                {shColNm(c)}
                {/* Col resize handle */}
                <div style={{position:"absolute",right:0,top:0,bottom:0,width:4,cursor:"col-resize",zIndex:5}}
                  onMouseDown={e=>{e.preventDefault();e.stopPropagation();resizingCol.current={col:c,startX:e.clientX,startW:cw(c)};}}/>
              </div>;
            })}
          </div>
        </div>

        {/* ── Rows ── */}
        <div style={{position:"absolute",top:SH_HDR_H,left:0,width:"100%"}}>
          <div style={{position:"absolute",top:rowY[visR0],left:0,width:"100%"}}>
            {Array.from({length:visR1-visR0+1},(_,ri)=>{
              const r=visR0+ri;
              const isSel=sel.r===r&&!selRange;
              const inRangeRow=selRange&&r>=Math.min(selRange.r1,selRange.r2)&&r<=Math.max(selRange.r1,selRange.r2);
              return <div key={r} style={{display:"flex",height:rh(r)}}>
                {/* Row header */}
                <div style={{width:SH_HDR_W,height:rh(r),background:isSel||inRangeRow?C.a+"14":hdrBg,border:"1px solid "+hdrBd,borderTop:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:isSel||inRangeRow?C.a:C.t2,flexShrink:0,userSelect:"none",position:"relative",left:0,zIndex:15,cursor:"default"} as React.CSSProperties}
                  onClick={()=>{setSel(s=>({...s,r}));setSelRange({r1:r,c1:0,r2:r,c2:SH_COLS-1});}}>
                  {r+1}
                  {/* Row resize handle */}
                  <div style={{position:"absolute",bottom:0,left:0,right:0,height:4,cursor:"row-resize",zIndex:5}}
                    onMouseDown={e=>{e.preventDefault();e.stopPropagation();resizingRow.current={row:r,startY:e.clientY,startH:rh(r)};}}/>
                </div>

                {/* Cells */}
                <div style={{position:"absolute",left:SH_HDR_W+colX[visC0],display:"flex",height:rh(r)}}>
                  {Array.from({length:visC1-visC0+1},(_,ci)=>{
                    const c=visC0+ci;
                    const k=shKey(r,c);
                    const cell=data[k]||{v:"",f:null,fmt:{}};
                    const isSel2=sel.r===r&&sel.c===c;
                    const inRange=selRange&&r>=Math.min(selRange.r1,selRange.r2)&&r<=Math.max(selRange.r1,selRange.r2)&&c>=Math.min(selRange.c1,selRange.c2)&&c<=Math.max(selRange.c1,selRange.c2);
                    const inFillPreview=fillPreview&&r>=fillPreview.r1&&r<=fillPreview.r2&&c>=fillPreview.c1&&c<=fillPreview.c2;
                    // Formula ref highlight
                    const isFormulaRef=formulaRef&&formulaRef.r===r&&formulaRef.c===c;
                    const val=display(r,c);
                    const isErr=val.startsWith("#");

                    // Fill handle position — bottom right of selection
                    const selR2=selRange?Math.max(selRange.r1,selRange.r2):sel.r;
                    const selC2=selRange?Math.max(selRange.c1,selRange.c2):sel.c;
                    const showFillHandle=isSel2&&!selRange||(!editing&&selRange&&r===selR2&&c===selC2);

                    return <div key={c}
                      style={{
                        width:cw(c),height:rh(r),flexShrink:0,
                        border:"1px solid "+(isFormulaRef?"#3B82F6":cellBd),
                        borderLeft:c===visC0?"1px solid "+cellBd:"none",
                        borderTop:"none",
                        background:isFormulaRef?"rgba(59,130,246,0.1)":isSel2?selBg:inRange?rangeBg:inFillPreview?"rgba(180,180,180,0.15)":(cell.fmt.bg||"transparent"),
                        outline:isSel2?`2px solid ${selBd}`:"none",
                        outlineOffset:-1,
                        position:"relative",
                        cursor:formulaMode&&!isSel2?"cell":"default",
                        overflow:"hidden",
                      }}
                      onClick={e=>{
                        // Formula click mode — insert ref
                        if(formulaMode&&editing&&!isSel2){
                          e.stopPropagation();
                          const ref=shRef(r,c);
                          // Insert at cursor or append
                          const inp=formulaBarRef.current||cellInputRef.current;
                          const pos=inp?.selectionStart??editVal.length;
                          const newVal=editVal.slice(0,pos)+ref+editVal.slice(inp?.selectionEnd??pos);
                          setEditVal(newVal);
                          setFormulaRef({r,c});
                          // Highlight ref in formula bar
                          setTimeout(()=>{inp?.focus();inp?.setSelectionRange(pos+ref.length,pos+ref.length);},10);
                          return;
                        }
                        if(dragSel)return;
                        if(e.shiftKey&&sel){setSelRange({r1:sel.r,c1:sel.c,r2:r,c2:c});return;}
                        commitEdit();setSel({r,c});setSelRange(null);setEditing(false);setFormulaMode(false);setFormulaRef(null);
                      }}
                      onDoubleClick={()=>startEdit(r,c)}
                      onMouseDown={e=>{
                        if(e.shiftKey){setSelRange({r1:sel.r,c1:sel.c,r2:r,c2:c});return;}
                        commitEdit();setSel({r,c});setSelRange(null);setEditing(false);setFormulaMode(false);setFormulaRef(null);
                        setDragSel(true);setDragSelStart({r,c});
                      }}>

                      {isSel2&&editing
                        ?<input ref={cellInputRef} autoFocus value={editVal}
                            onChange={e=>{setEditVal(e.target.value);setFormulaMode(e.target.value.startsWith("="));}}
                            onBlur={()=>{setTimeout(commitEdit,150);}}
                            onKeyDown={e=>{
                              if(e.key==="Enter"){e.preventDefault();commitEdit();setSel(s=>({r:Math.min(SH_ROWS-1,s.r+1),c:s.c}));}
                              if(e.key==="Tab"){e.preventDefault();commitEdit();setSel(s=>({r:s.r,c:Math.min(SH_COLS-1,s.c+1)}));}
                              if(e.key==="Escape"){setEditing(false);setFormulaMode(false);setFormulaRef(null);}
                              e.stopPropagation();
                            }}
                            style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none",outline:"none",background:dark?"#141927":"#fff",fontFamily:"monospace",fontSize:12,padding:"0 4px",color:C.t1,zIndex:10,fontWeight:cell.fmt.bold?700:400,fontStyle:cell.fmt.italic?"italic":"normal",textAlign:cell.fmt.align||"left"}}/>
                        :<div style={{padding:"0 4px",fontSize:12,lineHeight:rh(r)+"px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:cell.fmt.bold?700:400,fontStyle:cell.fmt.italic?"italic":"normal",textAlign:cell.fmt.align||(val&&!isNaN(Number(val))?"right":"left"),color:isErr?"#EF4444":(cell.fmt.color||C.t1),fontFamily:"monospace"}}>
                            {val}
                          </div>
                      }

                      {/* Fill handle */}
                      {showFillHandle&&!editing&&<div
                        style={{position:"absolute",bottom:-3,right:-3,width:8,height:8,background:selBd,borderRadius:1,cursor:"crosshair",zIndex:20,border:"1px solid "+surfBg}}
                        onMouseDown={e=>{e.stopPropagation();e.preventDefault();setFillDrag(true);setFillEnd({r,c});}}/>}

                      {/* Formula ref animated border */}
                      {isFormulaRef&&<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="calc(100% - 2)" height="calc(100% - 2)" fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="6 3" style={{animation:"formulaDash 0.5s linear infinite"}}/>
                      </svg>}
                    </div>;
                  })}
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>

    {/* ── SHEET TABS ── */}
    <div style={{height:34,background:surfBg,borderTop:"1px solid "+C.bd,display:"flex",alignItems:"center",overflowX:"auto",flexShrink:0}}>
      {wb.sheets.map((s,i)=>(
        <div key={s.id}
          style={{display:"flex",alignItems:"center",gap:5,padding:"0 14px",height:"100%",fontSize:12,fontWeight:wb.si===i?600:400,color:wb.si===i?C.a:C.t2,borderRight:"1px solid "+C.bd,borderBottom:wb.si===i?"2px solid "+C.a:"2px solid transparent",cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",background:wb.si===i?(dark?"rgba(79,142,247,0.08)":"rgba(37,99,235,0.05)"):"transparent",flexShrink:0}}
          onClick={()=>switchSheet(i)}
          onDoubleClick={()=>{const n=prompt("Переименовать:",s.name);if(n)updWbs(ws=>ws.map(w=>w.id===activeWbId?{...w,sheets:w.sheets.map((sh,j)=>j===i?{...sh,name:n}:sh)}:w));}}>
          {s.name}
          {wb.sheets.length>1&&<button onClick={e=>{e.stopPropagation();deleteSheet(i);}}
            style={{width:14,height:14,border:"none",background:"transparent",cursor:"pointer",color:C.t2,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:3,padding:0,lineHeight:1}}>×</button>}
        </div>
      ))}
      <button onClick={addSheet} style={{padding:"0 12px",height:"100%",fontSize:13,color:C.t2,background:"transparent",border:"none",cursor:"pointer",flexShrink:0,borderRight:"1px solid "+C.bd}}>
        + Лист
      </button>
      <div style={{flex:1}}/>
      <div style={{padding:"0 12px",fontSize:10,color:C.t2,fontFamily:"monospace",whiteSpace:"nowrap"}}>
        Ctrl+Z · Ctrl+C/V · Ctrl+A · Ctrl+E=Excel · F2=ред. · Del=очистить
      </div>
    </div>

    {toast&&<div style={{position:"fixed",bottom:24,right:24,background:dark?"#1E293B":"#1F2937",color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:500,zIndex:500,boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>{toast}</div>}
  </div>;
}

/* ============ TOOLS (TIMER v2) ============ *//* ============ TOOLS (TIMER v2) ============ */
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
        <input type="number" placeholder="Свои минуты..." value={customMins} onChange={e=>{if(!running){setCustomMins(e.target.value);setUseCustom(true);}}} disabled={running} min={1} max={180} style={{...iS(),width:160,padding:"8px 12px",fontSize:14}}/>
        {useCustom&&+customMins>0&&<span style={{fontSize:13,color:C.a,fontWeight:600}}>{customMins} мин выбрано</span>}
      </div>
    </Card>

    <Card style={{textAlign:"center"}}><div style={{fontSize:48,fontWeight:800,color:C.a}}>{sessions}</div><div style={{fontSize:14,color:C.t2,marginTop:4}}>Сессий сегодня</div></Card>
  </div>;
}

/* ============ BOARD (MIRO-style v2) ============ */
const BOARD_STICKY_PALETTE=["#FEF9A6","#FFE568","#FDBA74","#FB8B8F","#F5B7E6","#ED78D1","#A7C7F7","#9B8CF5","#89D9F0","#76A7EA","#6EDBD2","#54D37D","#C8EB8D","#A8E64F","#F8FAFC","#1F2937"];
const BOARD_DRAW_COLORS=["#EF4444","#2563EB","#111827","#22C55E","#06B6D4","#FACC15","#7C3AED"];
const BOARD_PALETTE=["#FEF08A","#BBF7D0","#BFDBFE","#FED7AA","#F9A8D4","#E9D5FF","#FECACA","#A7F3D0","#ffffff","#F1F5F9","#1E293B","#7C3AED","#2563EB","#DC2626","#16A34A","#D97706"];
const BOARD_FONTS=[
  {id:"Inter",label:"Inter"},
  {id:"Inter, sans-serif",label:"Inter"},
  {id:"Arial, sans-serif",label:"Arial"},
  {id:"Georgia, serif",label:"Georgia"},
  {id:"Courier New, monospace",label:"Mono"},
];
const MAX_BOARDS=20;
const MAX_BOARD_ITEMS=420;
const MAX_DRAW_PATH_CHARS=9000;

type BItemType="sticky"|"text"|"image"|"link"|"shape"|"draw"|"external_card"|"doc"|"table"|"icon";
type LineStyle="solid"|"dashed"|"dotted";
type ArrowTip="none"|"arrow"|"double";
type DrawMode="pen"|"pencil"|"pointer";

interface BItem{
  id:string; type:BItemType;
  x:number; y:number; w:number; h:number;
  text?:string; color?:string;
  fontSize?:number; fontBold?:boolean; fontItalic?:boolean; fontFamily?:string;
  shapeKind?:"rect"|"circle"|"diamond"|"triangle"|"parallelogram"|"square"|"cloud"|"pentagon";
  shapeText?:string; // text inside shape
  imageUrl?:string; imageW?:number; imageH?:number;
  linkUrl?:string; linkTitle?:string; linkFavicon?:string;
  zIndex?:number;
  drawPath?:string; drawColor?:string; drawThickness?:number;
  externalSource?:"crm"|"content";
  externalId?:string;
  externalType?:"lead"|"content";
  externalTitle?:string;
  externalSubtitle?:string;
  externalMeta?:string;
  externalStatus?:string;
  externalPlatform?:string;
  iconKey?:string;
  iconLabel?:string;
  iconGlyph?:string;
  iconCategory?:"emoji"|"social"|"business";
  iconStyle?:"emoji"|"outline"|"glyph";
}

interface BLine{
  id:string;
  fromId:string; toId:string;
  fromAnchor?:"top"|"bottom"|"left"|"right";
  toAnchor?:"top"|"bottom"|"left"|"right";
  color?:string; thickness?:number; style?:LineStyle; arrow?:ArrowTip;
}

interface BBoard{
  id:string; name:string; created_at:string;
}

// ── helpers ──
const bid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);

const safeNum=(value:any,fallback:number)=>{
  const n=Number(value);
  return Number.isFinite(n)?n:fallback;
};

const isValidBoardItem=(it:any):it is BItem=>{
  return !!it&&typeof it==="object"&&typeof it.id==="string"&&it.id.trim().length>0&&typeof it.type==="string";
};

const normalizeBoardItems=(raw:any[]):BItem[]=>{
  const seen=new Set<string>();
  return (Array.isArray(raw)?raw:[])
    .filter(isValidBoardItem)
    .filter((it:any)=>{
      if(seen.has(it.id))return false;
      seen.add(it.id);
      return true;
    })
    .slice(0,MAX_BOARD_ITEMS)
    .map((it:any,index:number)=>{
      const type=(it.type||"sticky") as BItemType;
      const w=safeNum(it.w,type==="text"?180:type==="external_card"?260:200);
      const h=safeNum(it.h,type==="text"?50:type==="external_card"?140:160);
      return {
        ...it,
        id:String(it.id),
        type,
        x:safeNum(it.x,120+index*8),
        y:safeNum(it.y,120+index*8),
        w:Math.max(20,w),
        h:Math.max(20,h),
        zIndex:safeNum(it.zIndex,index),
        text:typeof it.text==="string"?it.text:(it.text==null?"":String(it.text)),
        color:it.color||"",
        fontSize:safeNum(it.fontSize,14),
        fontBold:!!it.fontBold,
        fontItalic:!!it.fontItalic,
        fontFamily:it.fontFamily||"Inter",
      } as BItem;
    });
};

const normalizeBoardLines=(raw:any[],validItemIds?:Set<string>):BLine[]=>{
  const seen=new Set<string>();
  return (Array.isArray(raw)?raw:[])
    .filter((ln:any)=>!!ln&&typeof ln==="object"&&typeof ln.id==="string"&&typeof ln.fromId==="string"&&typeof ln.toId==="string")
    .filter((ln:any)=>{
      if(seen.has(ln.id))return false;
      if(validItemIds&&(!validItemIds.has(ln.fromId)||!validItemIds.has(ln.toId)))return false;
      seen.add(ln.id);
      return true;
    })
    .map((ln:any)=>({
      ...ln,
      id:String(ln.id),
      fromId:String(ln.fromId),
      toId:String(ln.toId),
      color:ln.color||"#64748B",
      thickness:Math.max(1,safeNum(ln.thickness,2)),
      style:ln.style||"solid",
      arrow:ln.arrow||"arrow",
    } as BLine));
};

function itemCenter(it:BItem){return{x:it.x+it.w/2,y:it.y+it.h/2};}

function parseExternalCardPayload(raw?:string){
  try{
    const p=JSON.parse(raw||"{}");
    return p&&typeof p==="object"?p:{};
  }catch{return {};}
}

function externalCardPayload(it:BItem){
  return JSON.stringify({
    source:it.externalSource,
    externalId:it.externalId,
    externalType:it.externalType,
    title:it.externalTitle||it.text||"Карточка",
    subtitle:it.externalSubtitle||"",
    meta:it.externalMeta||"",
    status:it.externalStatus||"",
    color:it.color||"#7C3AED",
    platform:it.externalPlatform||"",
  });
}

function parseBoardIconPayload(raw?:string){
  try{
    const p=JSON.parse(raw||"{}");
    return p&&typeof p==="object"?p:{};
  }catch{return {};}
}

function boardIconPayload(it:BItem){
  return JSON.stringify({
    key:it.iconKey||"",
    label:it.iconLabel||"",
    glyph:it.iconGlyph||"",
    category:it.iconCategory||"emoji",
    style:it.iconStyle||"emoji",
  });
}

const BOARD_EMOJI_ICONS=[
  ["smile","Улыбка","😀","улыбка smile happy"],["joy","Радость","😃","радость joy happy"],["grin","Сильная радость","😄","радость grin happy"],["beaming","Довольный","😁","довольный beaming grin"],["laugh","Смех","😆","смех laugh"],["tears","Смех до слёз","😂","смех слез tears laugh"],["rofl","Ржёт","🤣","ржёт rofl laugh"],["blush","Милая улыбка","😊","милая улыбка blush"],["angel","Ангел","😇","ангел angel"],["slight","Спокойная улыбка","🙂","спокойная улыбка slight"],["upside","Ирония","🙃","ирония upside down"],["wink","Подмигивание","😉","подмигивание wink"],["relieved","Спокойствие","😌","спокойствие calm relieved"],["heart-eyes","Влюблённость","😍","влюблённость love heart eyes"],["loving","Любовь","🥰","любовь loving hearts"],["kiss","Поцелуй","😘","поцелуй kiss"],["cool","Крутой","😎","крутой cool"],["star-struck","Восторг","🤩","восторг star struck"],["party","Праздник","🥳","праздник party"],["smirk","Самодовольный","😏","самодовольный smirk"],["neutral","Нейтральный","😐","нейтральный neutral"],["expressionless","Без эмоций","😑","без эмоций expressionless"],["silent","Молчание","😶","молчание silence"],["thinking","Думает","🤔","думает thinking"],["salute","Салют","🫡","салют salute"],["raised-brow","Сомнение","🤨","сомнение raised brow"],["grimace","Неловкость","😬","неловкость grimace"],["roll-eyes","Закатил глаза","🙄","закатил глаза roll eyes"],["surprised","Удивление","😮","удивление surprised"],["hushed","Шок","😯","шок hushed"],["astonished","Сильное удивление","😲","сильное удивление astonished"],["flushed","Смущение","😳","смущение flushed"],["pleading","Просьба","🥺","просьба pleading"],["cry","Грусть","😢","грусть cry sad"],["sob","Плач","😭","плач sob cry"],["triumph","Злость","😤","злость angry"],["angry","Гнев","😡","гнев angry"],["mindblown","Взрыв мозга","🤯","взрыв мозга mind blown"],["sleep","Сон","😴","сон sleep"],["sick","Болезнь","🤒","болезнь sick"],["thumbsup","Лайк","👍","лайк like thumbs up"],["thumbsdown","Дизлайк","👎","дизлайк thumbs down"],["clap","Аплодисменты","👏","аплодисменты clap"],["hooray","Ура","🙌","ура hooray"],["handshake","Рукопожатие","🤝","рукопожатие handshake"],["muscle","Сила","💪","сила muscle"],["peace","Мир","✌️","мир peace"],["crossed","Надежда","🤞","надежда crossed fingers"],["ok","Окей","👌","окей ok"],["pinched","Акцент","🤌","акцент pinched fingers"],["call","Позвони","🤙","позвони call me"],["wave","Привет","👋","привет wave"],["point-right","Указание вправо","👉","вправо point right"],["point-left","Указание влево","👈","влево point left"],["up","Важно","☝️","важно up"],["down","Вниз","👇","вниз down"],["pray","Спасибо / просьба","🙏","спасибо просьба pray"],["heart-hands","Сердце руками","🫶","сердце руками heart hands"],["stop","Стоп","🖐️","стоп hand"],["write","Пишу","✍️","пишу write"],["heart-red","Сердце","❤️","сердце red heart"],["heart-orange","Оранжевое сердце","🧡","оранжевое сердце orange heart"],["heart-yellow","Жёлтое сердце","💛","желтое сердце yellow heart"],["heart-green","Зелёное сердце","💚","зеленое сердце green heart"],["heart-blue","Синее сердце","💙","синее сердце blue heart"],["heart-purple","Фиолетовое сердце","💜","фиолетовое сердце purple heart"],["heart-black","Чёрное сердце","🖤","черное сердце black heart"],["heart-white","Белое сердце","🤍","белое сердце white heart"],["heart-broken","Разбитое сердце","💔","разбитое сердце broken heart"],["fire","Огонь","🔥","огонь fire hot"],["sparkles","Искра","✨","искра sparkles"],["star","Звезда","⭐","звезда star"],["dizzy","Сияние","💫","сияние dizzy"],["zap","Молния","⚡","молния lightning"],["boom","Взрыв","💥","взрыв boom"],["hundred","Сто процентов","💯","сто процентов hundred"],["check","Готово","✅","готово check"],["cross","Ошибка","❌","ошибка cross"],["bang","Важно","❗","важно exclamation"],["question","Вопрос","❓","вопрос question"],["idea","Идея","💡","идея lightbulb"],["brain","Мозг","🧠","мозг brain"],["eyes","Внимание","👀","внимание eyes"],["target","Цель","🎯","цель target"],["rocket","Рост / запуск","🚀","рост запуск rocket"],["trophy","Победа","🏆","победа trophy"],["gold","Первое место","🥇","первое место gold"],["pin","Закрепить","📌","закрепить pin"],["location","Метка","📍","метка location"],["note","Заметка","📝","заметка note"],["document","Документ","📄","документ file"],["chart","График","📊","график chart"],["trend-up","Рост","📈","рост chart up"],["trend-down","Падение","📉","падение chart down"],["money","Деньги","💰","деньги money"],["diamond","Премиум","💎","премиум diamond"],["tools","Инструменты","🛠️","инструменты tools"],["settings","Настройки","⚙️","настройки settings"],["puzzle","Элемент","🧩","элемент puzzle"],["image","Изображение","🖼️","изображение image picture"]
].map(([key,label,glyph,search])=>({key:`emoji-${key}`,label,glyph,search,category:"emoji" as const,style:"emoji" as const,defaultColor:"#111827"}));

const BOARD_SOCIAL_ICONS=[
  ["instagram","Instagram","IG","instagram инстаграм", "#111827"],["tiktok","TikTok","TT","tiktok тикток", "#111827"],["youtube","YouTube","YT","youtube ютуб", "#111827"],["telegram","Telegram","TG","telegram телеграм", "#111827"],["whatsapp","WhatsApp","WA","whatsapp ватсап", "#111827"],["facebook","Facebook","f","facebook фейсбук", "#111827"],["x","X / Twitter","X","x twitter твиттер", "#111827"],["linkedin","LinkedIn","in","linkedin линкедин", "#111827"],["vk","VK","VK","vk вконтакте", "#111827"],["discord","Discord","DS","discord дискорд", "#111827"],["twitch","Twitch","TW","twitch твич", "#111827"],["snapchat","Snapchat","SC","snapchat снапчат", "#111827"],["pinterest","Pinterest","P","pinterest пинтерест", "#111827"],["reddit","Reddit","R","reddit реддит", "#111827"],["threads","Threads","@","threads тредс", "#111827"],["behance","Behance","Be","behance беханс", "#111827"],["dribbble","Dribbble","Dr","dribbble дрибббл", "#111827"],["github","GitHub","GH","github гитхаб", "#111827"],["medium","Medium","M","medium медиум", "#111827"],["spotify","Spotify","SP","spotify спотифай", "#111827"]
].map(([key,label,glyph,search,defaultColor])=>({key:`social-${key}`,label,glyph,search,category:"social" as const,style:"outline" as const,defaultColor}));

const BOARD_BUSINESS_ICONS=[
  ["document","Документ","📄","документ file"],["table","Таблица","▦","таблица table grid"],["presentation","Презентация","▣","презентация slides"],["folder","Папка","🗂","папка folder"],["file","Файл","◫","файл file"],["note","Заметка","📝","заметка note"],["checklist","Чеклист","☑","чеклист checklist"],["calendar","Календарь","🗓","календарь calendar"],["clock","Часы","◷","часы clock time"],["bookmark","Закладка","🔖","закладка bookmark"],["money","Деньги","₽","деньги money ruble"],["card","Карта оплаты","💳","карта оплаты card"],["growth","График роста","↗","рост growth chart"],["decline","График падения","↘","падение decline chart"],["funnel","Воронка продаж","⏷","воронка funnel"],["target","Цель","◎","цель target"],["cup","Кубок","🏆","кубок trophy"],["diamond","Бриллиант","◆","бриллиант diamond"],["rocket","Ракета","🚀","ракета rocket"],["magnet","Магнит","🧲","магнит magnet"],["message","Сообщение","✉","сообщение message"],["chat","Чат","💬","чат chat"],["comment","Комментарий","🗨","комментарий comment"],["notification","Уведомление","🔔","уведомление notification bell"],["mail","Почта","✉️","почта mail"],["phone","Телефон","☎","телефон phone"],["microphone","Микрофон","🎤","микрофон microphone"],["camera","Камера","📷","камера camera"],["video","Видеозвонок","🎥","видеозвонок video"],["volume","Громкость","🔊","громкость volume"],["plus","Плюс","＋","плюс plus"],["minus","Минус","－","минус minus"],["check","Галочка","✓","галочка check"],["cross","Крестик","✕","крестик cross"],["arrow-right","Стрелка вправо","→","стрелка вправо arrow right"],["arrow-up","Стрелка вверх","↑","стрелка вверх arrow up"],["link","Ссылка","🔗","ссылка link"],["lock","Замок","🔒","замок lock"],["settings","Настройки","⚙","настройки settings"],["search","Поиск","⌕","поиск search"]
].map(([key,label,glyph,search])=>({key:`business-${key}`,label,glyph,search,category:"business" as const,style:"glyph" as const,defaultColor:"#2563EB"}));

const BOARD_ICON_LIBRARY=[...BOARD_EMOJI_ICONS,...BOARD_SOCIAL_ICONS,...BOARD_BUSINESS_ICONS];

function renderBoardLibraryIcon(icon:{glyph?:string;label?:string;category?:"emoji"|"social"|"business";style?:"emoji"|"outline"|"glyph";defaultColor?:string},color?:string,size=28){
  const col=color||icon.defaultColor||"#111827";
  if(icon.category==="emoji"||icon.style==="emoji"){
    return <span style={{fontSize:size,lineHeight:1,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{icon.glyph||"✨"}</span>;
  }
  if(icon.category==="social"||icon.style==="outline"){
    return <div style={{width:size,height:size,borderRadius:Math.max(10,Math.round(size*0.28)),border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",color:col,fontSize:Math.max(11,Math.round(size*0.32)),fontWeight:900,lineHeight:1,letterSpacing:-0.3,background:"rgba(255,255,255,0.9)",boxSizing:"border-box"}}>{icon.glyph||"IG"}</div>;
  }
  return <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",color:col,fontSize:size,fontWeight:900,lineHeight:1}}>{icon.glyph||"◎"}</div>;
}

function BoardPage({userId}:{userId:string}){
  const crmFunnels=useTable("crm_funnels",userId);
  const crmLeads=useTable("leads",userId);
  const contentRows=useTable("content",userId);

  // Board list
  const[boards,setBoards]=useState<BBoard[]>([]);
  const[activeBoardId,setActiveBoardId]=useState<string|null>(null);
  const[loadingBoards,setLoadingBoards]=useState(true);
  const[newBoardName,setNewBoardName]=useState("");
  const[newBoardModal,setNewBoardModal]=useState(false);
  const[renamingId,setRenamingId]=useState<string|null>(null);
  const[renameVal,setRenameVal]=useState("");
  const[deletingId,setDeletingId]=useState<string|null>(null);

  // Canvas items & lines
  const[items,setItems]=useState<BItem[]>([]);
  const[lines,setLines]=useState<BLine[]>([]);
  const[loadingCanvas,setLoadingCanvas]=useState(false);
  const[saved,setSaved]=useState(true);
  const saveTimer=useRef<any>(null);
  const historyPast=useRef<{items:BItem[];lines:BLine[]}[]>([]);
  const historyFuture=useRef<{items:BItem[];lines:BLine[]}[]>([]);
  const historySkip=useRef(false);

  // Tool state
  const[tool,setTool]=useState<"select"|"pan"|"sticky"|"text"|"image"|"link"|"shape"|"line"|"draw">("select");
  const[toolPanel,setToolPanel]=useState<null|"create"|"sticky"|"icons"|"shape"|"draw">(null);
  const[shapeKind,setShapeKind]=useState<"rect"|"circle"|"diamond"|"triangle"|"parallelogram"|"square"|"cloud"|"pentagon">("rect");
  const[drawColor,setDrawColor]=useState("#2563EB");
  const[drawThickness,setDrawThickness]=useState(3);
  const[drawMode,setDrawMode]=useState<DrawMode>("pen");
  const drawingRef=useRef<{path:string;startX:number;startY:number;pointCount:number}|null>(null);
  const[isDrawing,setIsDrawing]=useState(false);
  const[drawPreview,setDrawPreview]=useState("");
  const[pointerTrail,setPointerTrail]=useState<{path:string;startX:number;startY:number;color:string;thickness:number}|null>(null);

  // Live refs — always up to date, no stale closures in handlers
  const itemsRef=useRef<BItem[]>([]);
  const linesRef=useRef<BLine[]>([]);
  const selRef=useRef<Set<string>>(new Set());
  const selLineRef=useRef<string|null>(null);

  // Anchor hover for smart connectors
  const[hoverAnchor,setHoverAnchor]=useState<{id:string;side:"top"|"bottom"|"left"|"right"}|null>(null);
  const[connectorDrag,setConnectorDrag]=useState<{fromId:string;fromAnchor:"top"|"bottom"|"left"|"right";mx:number;my:number}|null>(null);

  // Custom color picker for sticky
  const[stickyColorPick,setStickyColorPick]=useState<string|null>(null);
  const[customColorInput,setCustomColorInput]=useState("#FEF08A");

  // Selection
  const[selectedIds,setSelectedIds]=useState<Set<string>>(new Set());
  const[selectedLineId,setSelectedLineId]=useState<string|null>(null);

  // Edit
  const[editingId,setEditingId]=useState<string|null>(null);
  const[editText,setEditText]=useState("");

  // Canvas transform
  const[zoom,setZoom]=useState(1);
  const[pan,setPan]=useState({x:0,y:0});
  const canvasRef=useRef<HTMLDivElement>(null);

  // Drag / resize / pan
  const dragState=useRef<{ids:string[];startMx:number;startMy:number;startPos:Record<string,{x:number,y:number}>}|null>(null);
  const resizeState=useRef<{id:string;startMx:number;startMy:number;startW:number;startH:number}|null>(null);
  const panState=useRef<{startMx:number;startMy:number;startPx:number;startPy:number}|null>(null);

  // Marquee (rubber-band) selection
  const marqueeRef=useRef<{startX:number;startY:number}|null>(null);
  const[marqueeRect,setMarqueeRect]=useState<{x:number;y:number;w:number;h:number}|null>(null);

  // Doc/Table side panel
  const[docPanelId,setDocPanelId]=useState<string|null>(null);

  // Line drawing
  const[lineFrom,setLineFrom]=useState<string|null>(null);

  // Color picker
  const[colorTarget,setColorTarget]=useState<"item"|"line"|null>(null);
  const[shapeColorOpen,setShapeColorOpen]=useState(false);

  // Link modal
  const[linkModal,setLinkModal]=useState(false);
  const[linkUrl,setLinkUrl]=useState("");
  const[linkLoading,setLinkLoading]=useState(false);
  const[linkClickPos,setLinkClickPos]=useState({x:200,y:200});

  // Image input ref
  const imgInputRef=useRef<HTMLInputElement>(null);
  const[imgClickPos,setImgClickPos]=useState({x:200,y:200});

  // External cards side panel
  const[externalPanel,setExternalPanel]=useState(false);
  const[externalSource,setExternalSource]=useState<"crm"|"content">("crm");
  const[externalSearch,setExternalSearch]=useState("");
  const[externalFunnelId,setExternalFunnelId]=useState<string>("all");
  const[externalDropHint,setExternalDropHint]=useState(false);
  const[expandedExternalItemId,setExpandedExternalItemId]=useState<string|null>(null);

  const[iconTab,setIconTab]=useState<"emoji"|"social"|"business">("emoji");
  const[iconSearch,setIconSearch]=useState("");
  const[recentIconKeys,setRecentIconKeys]=useState<string[]>([]);
  const[favoriteIconKeys,setFavoriteIconKeys]=useState<string[]>([]);

  // Sync live refs on every state change
  useEffect(()=>{itemsRef.current=items;},[items]);
  useEffect(()=>{linesRef.current=lines;},[lines]);
  useEffect(()=>{selRef.current=selectedIds;},[selectedIds]);
  useEffect(()=>{selLineRef.current=selectedLineId;},[selectedLineId]);

  // ── Load boards ──
  useEffect(()=>{
    (async()=>{
      const{data}=await supabase.from("boards").select("*").eq("user_id",userId).order("created_at");
      if(data)setBoards(data);
      setLoadingBoards(false);
    })();
  },[userId]);

  // ── Load canvas when board changes ──
  useEffect(()=>{
    if(!activeBoardId){setItems([]);setLines([]);return;}
    setLoadingCanvas(true);
    (async()=>{
      const[{data:its},{data:lns}]=await Promise.all([
        supabase.from("board_items").select("*").eq("board_id",activeBoardId).order("z_index"),
        supabase.from("board_lines").select("*").eq("board_id",activeBoardId),
      ]);
      const mappedItems=normalizeBoardItems((its||[]).map((d:any):BItem=>{
        const ext=d?.type==="external_card"?parseExternalCardPayload(d.text):{};
        const icon=d?.type==="icon"?parseBoardIconPayload(d.text):{};
        return {
          id:d?.id,type:d?.type,x:d?.x,y:d?.y,w:d?.w,h:d?.h,
          text:d?.type==="external_card"?(ext.title||d?.link_title||"Карточка"):(d?.type==="icon"?(icon.label||""):(d?.text||"")),color:d?.color||ext.color||"",fontSize:d?.font_size||14,
          fontBold:d?.font_bold||false,fontItalic:d?.font_italic||false,fontFamily:d?.type!=="link"?(d?.link_favicon||"Inter"):"Inter",
          shapeKind:d?.shape_kind||"rect",imageUrl:d?.image_url||"",
          linkUrl:d?.link_url||"",linkTitle:d?.link_title||"",linkFavicon:d?.link_favicon||"",
          zIndex:d?.z_index||0,
          drawPath:d?.draw_path||undefined,drawColor:d?.draw_color||undefined,drawThickness:d?.draw_thickness||undefined,
          externalSource:ext.source,externalId:ext.externalId,externalType:ext.externalType,externalTitle:ext.title,externalSubtitle:ext.subtitle,externalMeta:ext.meta,externalStatus:ext.status,externalPlatform:ext.platform,
          iconKey:icon.key,iconLabel:icon.label,iconGlyph:icon.glyph,iconCategory:icon.category,iconStyle:icon.style,
        } as BItem;
      }));
      const mappedItemIds=new Set(mappedItems.map(i=>i.id));
      const mappedLines=normalizeBoardLines((lns||[]).map((d:any):BLine=>({
        id:d?.id,fromId:d?.from_id,toId:d?.to_id,
        color:d?.color||"#64748B",thickness:d?.thickness||2,
        style:d?.style||"solid",arrow:d?.arrow||"arrow",
      })),mappedItemIds);
      setItems(mappedItems);
      setLines(mappedLines);
      // Sync refs
      itemsRef.current=mappedItems;
      linesRef.current=mappedLines;
      setLoadingCanvas(false);
    })();
  },[activeBoardId]);

  // ── Auto-save (upsert-based — no full delete on every save) ──
  const triggerSave=(newItems:BItem[],newLines:BLine[])=>{
    const cleanItems=normalizeBoardItems(newItems as any[]);
    const validItemIds=new Set(cleanItems.map(i=>i.id));
    const cleanLines=normalizeBoardLines(newLines as any[],validItemIds);
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{
      if(!activeBoardId)return;
      try{
        const itemRows=cleanItems.map((it,i)=>({
          id:it.id,board_id:activeBoardId,user_id:userId,type:it.type,
          x:Math.round(it.x),y:Math.round(it.y),w:Math.round(it.w),h:Math.round(it.h),
          text:it.type==="external_card"?externalCardPayload(it):it.type==="icon"?boardIconPayload(it):(it.text||""),color:it.color||"",font_size:it.fontSize||14,
          font_bold:it.fontBold||false,font_italic:it.fontItalic||false,
          shape_kind:it.shapeKind||null,image_url:it.imageUrl||"",
          link_url:it.linkUrl||"",link_title:it.linkTitle||"",link_favicon:it.type==="link"?(it.linkFavicon||""):(it.fontFamily||"Inter"),
          z_index:i,draw_path:it.drawPath||null,draw_color:it.drawColor||null,draw_thickness:it.drawThickness||null,
        }));
        const lineRows=cleanLines.map(ln=>({
          id:ln.id,board_id:activeBoardId,user_id:userId,
          from_id:ln.fromId,to_id:ln.toId,
          color:ln.color||"#64748B",thickness:ln.thickness||2,style:ln.style||"solid",arrow:ln.arrow||"arrow",
        }));
        // Fetch current IDs to find deleted ones
        const[{data:dbIt},{data:dbLn}]=await Promise.all([
          supabase.from("board_items").select("id").eq("board_id",activeBoardId),
          supabase.from("board_lines").select("id").eq("board_id",activeBoardId),
        ]);
        const curItemIds=new Set(cleanItems.map(i=>i.id));
        const curLineIds=new Set(cleanLines.map(l=>l.id));
        const delIt=(dbIt||[]).filter((r:any)=>!curItemIds.has(r.id)).map((r:any)=>r.id);
        const delLn=(dbLn||[]).filter((r:any)=>!curLineIds.has(r.id)).map((r:any)=>r.id);
        await Promise.all([
          delIt.length?supabase.from("board_items").delete().in("id",delIt):null,
          delLn.length?supabase.from("board_lines").delete().in("id",delLn):null,
          itemRows.length?supabase.from("board_items").upsert(itemRows,{onConflict:"id"}):null,
          lineRows.length?supabase.from("board_lines").upsert(lineRows,{onConflict:"id"}):null,
        ].filter(Boolean));
        setSaved(true);
      }catch{setSaved(false);}
    },900);
  };

  const pushBoardHistory=()=>{
    if(historySkip.current)return;
    historyPast.current=[{items:normalizeBoardItems(itemsRef.current as any[]),lines:normalizeBoardLines(linesRef.current as any[],new Set(normalizeBoardItems(itemsRef.current as any[]).map(i=>i.id)))},...historyPast.current.slice(0,2)];
    historyFuture.current=[];
  };

  const restoreBoardSnapshot=(snap:{items:BItem[];lines:BLine[]})=>{
    historySkip.current=true;
    const cleanItems=normalizeBoardItems(snap.items as any[]);
    const validIds=new Set(cleanItems.map(i=>i.id));
    const cleanLines=normalizeBoardLines(snap.lines as any[],validIds);
    itemsRef.current=cleanItems;linesRef.current=cleanLines;
    setItems(cleanItems);setLines(cleanLines);triggerSave(cleanItems,cleanLines);
    window.setTimeout(()=>{historySkip.current=false;},0);
  };

  const undoBoard=()=>{
    const prev=historyPast.current.shift();
    if(!prev)return;
    historyFuture.current=[{items:normalizeBoardItems(itemsRef.current as any[]),lines:normalizeBoardLines(linesRef.current as any[],new Set(itemsRef.current.map(i=>i.id)))},...historyFuture.current.slice(0,2)];
    restoreBoardSnapshot(prev);
  };

  const redoBoard=()=>{
    const next=historyFuture.current.shift();
    if(!next)return;
    historyPast.current=[{items:normalizeBoardItems(itemsRef.current as any[]),lines:normalizeBoardLines(linesRef.current as any[],new Set(itemsRef.current.map(i=>i.id)))},...historyPast.current.slice(0,2)];
    restoreBoardSnapshot(next);
  };

  const updItems=(next:BItem[])=>{
    pushBoardHistory();
    const clean=normalizeBoardItems(next as any[]);
    const validIds=new Set(clean.map(i=>i.id));
    const cleanLines=normalizeBoardLines(linesRef.current as any[],validIds);
    itemsRef.current=clean;linesRef.current=cleanLines;setItems(clean);setLines(cleanLines);triggerSave(clean,cleanLines);
  };
  const updLines=(next:BLine[])=>{
    pushBoardHistory();
    const validIds=new Set(itemsRef.current.map(i=>i.id));
    const clean=normalizeBoardLines(next as any[],validIds);
    linesRef.current=clean;setLines(clean);triggerSave(itemsRef.current,clean);
  };
  const updBoth=(ni:BItem[],nl:BLine[])=>{
    pushBoardHistory();
    const cleanItems=normalizeBoardItems(ni as any[]);
    const validIds=new Set(cleanItems.map(i=>i.id));
    const cleanLines=normalizeBoardLines(nl as any[],validIds);
    itemsRef.current=cleanItems;linesRef.current=cleanLines;setItems(cleanItems);setLines(cleanLines);triggerSave(cleanItems,cleanLines);
  };

  // ── Board management ──
  const createBoard=async()=>{
    const name=newBoardName.trim()||"Новая доска";
    if(boards.length>=MAX_BOARDS){alert(`Максимум ${MAX_BOARDS} досок`);return;}
    const{data}=await supabase.from("boards").insert({user_id:userId,name}).select().single();
    if(data){setBoards(p=>[...p,data]);setActiveBoardId(data.id);}
    setNewBoardModal(false);setNewBoardName("");
  };

  const deleteBoard=async()=>{
    if(!deletingId)return;
    await Promise.all([
      supabase.from("board_items").delete().eq("board_id",deletingId),
      supabase.from("board_lines").delete().eq("board_id",deletingId),
      supabase.from("boards").delete().eq("id",deletingId),
    ]);
    setBoards(p=>p.filter(b=>b.id!==deletingId));
    if(activeBoardId===deletingId){setActiveBoardId(null);setItems([]);setLines([]);}
    setDeletingId(null);
  };

  const renameBoard=async()=>{
    if(!renamingId)return;
    await supabase.from("boards").update({name:renameVal}).eq("id",renamingId);
    setBoards(p=>p.map(b=>b.id===renamingId?{...b,name:renameVal}:b));
    setRenamingId(null);
  };

  // ── Canvas coords ──
  const toCanvas=(mx:number,my:number)=>{
    const rect=canvasRef.current!.getBoundingClientRect();
    return{x:(mx-rect.left-pan.x)/zoom,y:(my-rect.top-pan.y)/zoom};
  };

  // ── Add item helper ──
  const addItem=(partial:Partial<BItem>&{type:BItemType},cx:number,cy:number)=>{
    const base=normalizeBoardItems(itemsRef.current as any[]);
    if(base.length>=MAX_BOARD_ITEMS){alert(`На одной доске максимум ${MAX_BOARD_ITEMS} элементов. Удали лишнее или создай новую доску.`);return null as any;}
    const it:BItem={id:bid(),x:cx-100,y:cy-80,w:200,h:160,zIndex:base.length,fontFamily:"Inter",...partial};
    const next=[...base,it];
    updItems(next);
    setSelectedIds(new Set([it.id]));
    setTool("select");setShapeColorOpen(false);
    return it;
  };

  const addBoardDoc=(cx=360,cy=260)=>addItem({type:"doc",text:"Новый документ",color:"#EEF2FF",w:240,h:110,fontSize:16,fontBold:true},cx,cy);
  const addBoardTable=(cx=380,cy=280)=>addItem({type:"table",text:"Новая таблица",color:"#ECFDF5",w:260,h:130,fontSize:16,fontBold:true},cx,cy);
  const addStickyWithColor=(color:string,cx=360,cy=260)=>addItem({type:"sticky",text:"",color,w:200,h:180,fontFamily:"Inter"},cx,cy);
  const iconByKey=useMemo(()=>Object.fromEntries(BOARD_ICON_LIBRARY.map(icon=>[icon.key,icon])),[] as any);
  const filteredLibraryIcons=useMemo(()=>{
    const q=iconSearch.trim().toLowerCase();
    return BOARD_ICON_LIBRARY.filter(icon=>icon.category===iconTab).filter(icon=>!q||`${icon.label} ${icon.search} ${icon.key}`.toLowerCase().includes(q));
  },[iconTab,iconSearch]);
  const favoriteIcons=useMemo(()=>favoriteIconKeys.map(k=>iconByKey[k]).filter(Boolean),[favoriteIconKeys,iconByKey]);
  const recentIcons=useMemo(()=>recentIconKeys.map(k=>iconByKey[k]).filter(Boolean),[recentIconKeys,iconByKey]);
  const rememberRecentIcon=(key:string)=>setRecentIconKeys(prev=>[key,...prev.filter(x=>x!==key)].slice(0,12));
  const toggleFavoriteIcon=(key:string)=>setFavoriteIconKeys(prev=>prev.includes(key)?prev.filter(x=>x!==key):[key,...prev].slice(0,24));
  const addBoardIcon=(icon:any,cx=360,cy=260)=>{
    rememberRecentIcon(icon.key);
    return addItem({type:"icon",text:icon.label,color:icon.defaultColor||"#111827",w:icon.category==="emoji"?92:96,h:icon.category==="emoji"?92:110,fontSize:icon.category==="emoji"?46:18,fontBold:true,iconKey:icon.key,iconLabel:icon.label,iconGlyph:icon.glyph,iconCategory:icon.category,iconStyle:icon.style},cx,cy);
  };
  const addShapeFromMenu=(kind:BItem["shapeKind"],cx=400,cy=300)=>{
    if(kind==="parallelogram"){return addItem({type:"shape",shapeKind:"parallelogram",color:"#60A5FA",w:190,h:95,text:""},cx,cy);}
    return addItem({type:"shape",shapeKind:kind||"rect",color:"#60A5FA",w:kind==="circle"?130:kind==="triangle"?140:170,h:kind==="circle"?130:kind==="triangle"?120:100,text:""},cx,cy);
  };

  const updateSelectedShapeColor=(nextColor:string)=>{
    const selectedId=[...selectedIds][0];
    if(!selectedId)return;
    const next=itemsRef.current.map(item=>item.id===selectedId&&item.type==="shape"?{...item,color:nextColor}:item);
    updItems(next);
    setCustomColorInput(nextColor);
  };

  const getContentImage=(item:any)=>item.cover_url||item.image_url||item.thumbnail_url||item.photo_url||item.media_url||item.preview_url||"";
  const getContentPlatform=(item:any)=>String(item.platform||item.source||"other").toLowerCase();

  const platformColor=(pid:string)=>{
    const p=String(pid||"").toLowerCase();
    if(p.includes("instagram"))return "#E1306C";
    if(p.includes("youtube"))return "#FF0000";
    if(p.includes("telegram"))return "#29B6F6";
    if(p.includes("vk"))return "#4C75A3";
    return "#64748B";
  };

  const externalCards=useMemo(()=>{
    const q=externalSearch.trim().toLowerCase();
    if(externalSource==="crm"){
      return crmLeads.data
        .filter((lead:any)=>externalFunnelId==="all"||lead.funnel_id===externalFunnelId)
        .filter((lead:any)=>!q||[lead.name,lead.contact,lead.phone,lead.email,lead.source].some(v=>String(v||"").toLowerCase().includes(q)))
        .map((lead:any)=>({
          source:"crm" as const,
          externalType:"lead" as const,
          id:lead.id,
          title:lead.name||"Без имени",
          subtitle:lead.contact||lead.phone||lead.email||"CRM-лид",
          meta:[lead.source,lead.deal?`${lead.deal} ₽`:""].filter(Boolean).join(" · "),
          status:lead.status||"",
          color:"#38BDF8",
          imageUrl:lead.avatar_url||lead.photo_url||lead.image_url||"",
          platform:"crm",
          raw:lead,
        }));
    }
    return contentRows.data
      .filter((item:any)=>!q||[item.topic,item.type,item.platform,item.status,item.date].some(v=>String(v||"").toLowerCase().includes(q)))
      .map((item:any)=>({
        source:"content" as const,
        externalType:"content" as const,
        id:item.id,
        title:item.topic||item.type||"Контент",
        subtitle:[item.platform,item.type].filter(Boolean).join(" · ")||"Контент-карточка",
        meta:[item.status,item.date||item.publish_date].filter(Boolean).join(" · "),
        status:item.status||"",
        color:platformColor(getContentPlatform(item))||"#A855F7",
        imageUrl:getContentImage(item),
        platform:getContentPlatform(item),
        raw:item,
      }));
  },[externalSource,externalSearch,externalFunnelId,crmLeads.data,contentRows.data]);

  const addExternalCardToBoard=(card:any,clientX?:number,clientY?:number)=>{
    const center=canvasRef.current&&clientX&&clientY?toCanvas(clientX,clientY):{x:320+itemsRef.current.length*18,y:260+itemsRef.current.length*18};
    const it=addItem({
      type:"external_card",
      w:card.imageUrl?286:260,h:card.imageUrl?176:138,
      color:card.color||"#7C3AED",
      text:card.title,
      imageUrl:card.imageUrl||"",
      externalSource:card.source,
      externalId:card.id,
      externalType:card.externalType,
      externalTitle:card.title,
      externalSubtitle:card.subtitle,
      externalMeta:card.meta,
      externalStatus:card.status,
      externalPlatform:card.platform||"",
    },center.x,center.y);
    if(it){setExternalPanel(false);setExternalDropHint(false);}
  };

  const refreshExternalCards=()=>{
    const next=normalizeBoardItems(items as any[]).map(it=>{
      if(it.type!=="external_card")return it;
      if(it.externalSource==="crm"){
        const lead=crmLeads.data.find((l:any)=>l.id===it.externalId);
        if(!lead)return it;
        return {...it,text:lead.name||it.text,imageUrl:lead.avatar_url||lead.photo_url||lead.image_url||it.imageUrl||"",externalTitle:lead.name||it.externalTitle,externalSubtitle:lead.contact||lead.phone||lead.email||"CRM-лид",externalMeta:[lead.source,lead.deal?`${lead.deal} ₽`:""].filter(Boolean).join(" · "),externalStatus:lead.status||"",externalPlatform:"crm"};
      }
      const c=contentRows.data.find((x:any)=>x.id===it.externalId);
      if(!c)return it;
      return {...it,text:c.topic||c.type||it.text,imageUrl:getContentImage(c)||it.imageUrl||"",externalTitle:c.topic||c.type||it.externalTitle,externalSubtitle:[c.platform,c.type].filter(Boolean).join(" · ")||"Контент-карточка",externalMeta:[c.status,c.date||c.publish_date].filter(Boolean).join(" · "),externalStatus:c.status||"",externalPlatform:getContentPlatform(c)};
    });
    updItems(next);
  };

  // ── Canvas click ──
  const onCanvasClick=(e:React.MouseEvent)=>{
    if(e.button!==0)return;
    const tgt=e.target as HTMLElement;
    const onCanvas=tgt===canvasRef.current||tgt.classList.contains("board-bg-dot");
    if(tool==="select"){
      // Only clear selection if click (not after marquee drag)
      if(onCanvas&&selRef.current.size===0){setSelectedIds(new Set());setSelectedLineId(null);}
      // If there's a selection and user clicks empty space, clear it
      if(onCanvas&&selRef.current.size>0&&marqueeRect===null){setSelectedIds(new Set());setSelectedLineId(null);selRef.current=new Set();}
      return;
    }
    if(tool==="pan")return;
    if(!onCanvas)return;
    const{x,y}=toCanvas(e.clientX,e.clientY);

    if(tool==="sticky"){
      const it=addItem({type:"sticky",text:"",color:BOARD_PALETTE[0],w:200,h:180,fontFamily:"Inter"},x,y);
      if(it)setTimeout(()=>{setEditingId(it.id);setEditText("");},60);
    } else if(tool==="text"){
      const it=addItem({type:"text",text:"Текст",color:"#1E293B",w:180,h:50,fontSize:16,fontFamily:"Inter"},x,y);
      if(it)setTimeout(()=>{setEditingId(it.id);setEditText("Текст");},60);
    } else if(tool==="shape"){
      const it=addItem({type:"shape",shapeKind,color:"#3B82F6",w:160,h:110,text:"",shapeText:"",fontFamily:"Inter",fontSize:14},x,y);
      if(it)setTimeout(()=>{setEditingId(it.id);setEditText("");},60);
    } else if(tool==="link"){
      setLinkClickPos({x,y});setLinkModal(true);
    } else if(tool==="image"){
      setImgClickPos({x,y});imgInputRef.current?.click();
    }
  };

  // ── Mouse down on item ──
  const onItemDown=(e:React.MouseEvent,id:string)=>{
    if(editingId===id)return;
    e.stopPropagation();

    // Line tool: pick source/target
    if(tool==="line"){
      if(!lineFrom){setLineFrom(id);return;}
      if(lineFrom===id){setLineFrom(null);return;}
      const nl:BLine={id:bid(),fromId:lineFrom,toId:id,color:"#64748B",thickness:2,style:"solid",arrow:"arrow"};
      updLines([...lines,nl]);
      setLineFrom(null);setTool("select");
      return;
    }

    setSelectedLineId(null);
    const newSel=new Set(selectedIds.has(id)?selectedIds:[id]);
    setSelectedIds(newSel);

    const safeStartItems=normalizeBoardItems(items as any[]);
    const startPos:Record<string,{x:number,y:number}>={};
    newSel.forEach(sid=>{const it=safeStartItems.find(i=>i.id===sid);if(it)startPos[sid]={x:it.x,y:it.y};});
    const ids=[...newSel].filter(id=>!!startPos[id]);
    dragState.current=ids.length?{ids,startMx:e.clientX,startMy:e.clientY,startPos}:null;
  };

  // ── Mouse down on canvas (pan) ──
  const onCanvasDown=(e:React.MouseEvent)=>{
    const tgt=e.target as HTMLElement;
    const onBg=tgt===canvasRef.current||tgt.classList.contains("board-bg-dot");

    // RIGHT button always pans
    if(e.button===2){
      e.preventDefault();
      panState.current={startMx:e.clientX,startMy:e.clientY,startPx:pan.x,startPy:pan.y};
      return;
    }
    if(e.button!==0)return;

    if(tool==="draw"&&onBg){
      const{x,y}=toCanvas(e.clientX,e.clientY);
      drawingRef.current={path:`M0,0`,startX:x,startY:y,pointCount:0};
      setIsDrawing(true);setDrawPreview("M0,0");
      return;
    }
    // Pan tool - left pans
    if(tool==="pan"&&onBg){
      panState.current={startMx:e.clientX,startMy:e.clientY,startPx:pan.x,startPy:pan.y};
      return;
    }
    // Select tool + left on background = start marquee
    if(tool==="select"&&onBg){
      const{x,y}=toCanvas(e.clientX,e.clientY);
      marqueeRef.current={startX:x,startY:y};
      setMarqueeRect({x,y,w:0,h:0});
      // DON'T clear selection here - clear only when marquee actually moves
      return;
    }
  };

  const onMouseMove=(e:React.MouseEvent)=>{
    const drag=dragState.current;
    if(drag){
      if(!Array.isArray(drag.ids)||!drag.startPos){dragState.current=null;return;}
      const dx=(e.clientX-drag.startMx)/zoom;
      const dy=(e.clientY-drag.startMy)/zoom;
      const dragIds=new Set(drag.ids.filter((id:any)=>typeof id==="string"&&id));
      setItems(prev=>normalizeBoardItems(prev as any[]).map(it=>dragIds.has(it.id)&&drag.startPos[it.id]?{...it,x:drag.startPos[it.id].x+dx,y:drag.startPos[it.id].y+dy}:it));
    } else if(resizeState.current){
      const dx=(e.clientX-resizeState.current.startMx)/zoom;
      const dy=(e.clientY-resizeState.current.startMy)/zoom;
      const it0=items.find(i=>i.id===resizeState.current!.id);
      // Preserve aspect ratio for images
      if(it0?.type==="image"&&it0.imageW&&it0.imageH){
        const ratio=it0.imageW/it0.imageH;
        const newW=Math.max(60,resizeState.current.startW+dx);
        setItems(prev=>normalizeBoardItems(prev as any[]).map(it=>it.id===resizeState.current!.id?{...it,w:newW,h:Math.max(40,newW/ratio)}:it));
      } else {
        setItems(prev=>normalizeBoardItems(prev as any[]).map(it=>it.id===resizeState.current!.id?{...it,w:Math.max(60,resizeState.current!.startW+dx),h:Math.max(40,resizeState.current!.startH+dy)}:it));
      }
    } else if(panState.current){
      setPan({x:panState.current.startPx+(e.clientX-panState.current.startMx),y:panState.current.startPy+(e.clientY-panState.current.startMy)});
    } else if(marqueeRef.current){
      const{x:cx,y:cy}=toCanvas(e.clientX,e.clientY);
      const{startX:sx,startY:sy}=marqueeRef.current;
      const rx=Math.min(cx,sx),ry=Math.min(cy,sy);
      const rw=Math.abs(cx-sx),rh=Math.abs(cy-sy);
      setMarqueeRect({x:rx,y:ry,w:rw,h:rh});
      // Select all items intersecting the rect
      if(rw>6||rh>6){
        const sel=new Set(
          normalizeBoardItems(itemsRef.current as any[])
            .filter(it=>it.x<rx+rw&&it.x+it.w>rx&&it.y<ry+rh&&it.y+it.h>ry)
            .map(it=>it.id)
        );
        setSelectedIds(sel);
        selRef.current=sel;
      }
    } else if(isDrawing&&drawingRef.current){
      const{x,y}=toCanvas(e.clientX,e.clientY);
      const dx=x-drawingRef.current.startX;
      const dy=y-drawingRef.current.startY;
      drawingRef.current.pointCount=(drawingRef.current.pointCount||0)+1;
      const step=drawMode==="pencil"?2:drawMode==="pointer"?4:3;
      const stateStep=drawMode==="pencil"?4:drawMode==="pointer"?8:6;
      if(drawingRef.current.pointCount%step===0&&drawingRef.current.path.length<MAX_DRAW_PATH_CHARS){
        const newPath=drawingRef.current.path+` L${dx.toFixed(1)},${dy.toFixed(1)}`;
        drawingRef.current.path=newPath;
        if(drawingRef.current.pointCount%stateStep===0){setDrawPreview(newPath);}
      }
    } else if(connectorDrag){
      // Update live connector preview via state
      const{x,y}=toCanvas(e.clientX,e.clientY);
      setConnectorDrag(d=>d?{...d,mx:x,my:y}:null);
    }
  };

  const onMouseUp=(e:React.MouseEvent)=>{
    const hadDrag=!!dragState.current;
    const hadResize=!!resizeState.current;
    if(hadDrag||hadResize)triggerSave(normalizeBoardItems(items as any[]),lines);
    dragState.current=null;resizeState.current=null;panState.current=null;
    // Finish marquee — keep selection, just hide the rect
    marqueeRef.current=null;
    setMarqueeRect(null);

    // Finish drawing
    if(isDrawing&&drawingRef.current&&drawPreview.length>4){
      const{startX,startY}=drawingRef.current;
      if(drawMode==="pointer"){
        setPointerTrail({path:drawPreview,startX,startY,color:drawColor,thickness:Math.max(4,drawThickness+2)});
        window.setTimeout(()=>setPointerTrail(null),900);
      }else{
        const coords=drawPreview.match(/-?\d+\.?\d*/g)?.map(Number)||[];
        const xs=coords.filter((_,i)=>i%2===0),ys=coords.filter((_,i)=>i%2===1);
        const minX=Math.min(0,...xs),minY=Math.min(0,...ys);
        const maxX=Math.max(0,...xs),maxY=Math.max(0,...ys);
        const w=Math.max(40,maxX-minX),h=Math.max(40,maxY-minY);
        const base=normalizeBoardItems(itemsRef.current as any[]);
        const it:BItem={id:bid(),type:"draw",x:startX+minX,y:startY+minY,w,h,drawPath:drawPreview.slice(0,MAX_DRAW_PATH_CHARS),drawColor:drawMode==="pencil"?"rgba(30,41,59,0.75)":drawColor,drawThickness:drawMode==="pencil"?Math.max(1,drawThickness-1):drawThickness,zIndex:base.length};
        updItems([...base,it]);
      }
    }
    setIsDrawing(false);drawingRef.current=null;setDrawPreview("");

    // Finish connector drag — snap to nearest anchor
    if(connectorDrag){
      const{fromId,fromAnchor,mx,my}=connectorDrag;
      type AnchorHit={id:string;side:"top"|"bottom"|"left"|"right";dist:number};
      let best:AnchorHit|null=null;
      normalizeBoardItems(items as any[]).filter(i=>i.id!==fromId).forEach(it=>{
        const{side,dist}=nearestAnchor(it,mx,my);
        if(dist<40&&(!best||dist<best.dist))best={id:it.id,side,dist};
      });
      if(best!==null){
        const b=best as AnchorHit;
        const nl:BLine={id:bid(),fromId,toId:b.id,fromAnchor,toAnchor:b.side,color:"#64748B",thickness:2,style:"solid",arrow:"arrow"};
        updLines([...lines,nl]);
      }
      setConnectorDrag(null);
    }
  };

  const onWheel=(e:React.WheelEvent)=>{
    e.preventDefault();
    const f=e.deltaY>0?0.94:1.06;
    setZoom(z=>Math.min(3,Math.max(0.2,z*f)));
  };

  // ── Delete selected ──
  const deleteSelected=()=>{
    if(selLineRef.current){updLines(linesRef.current.filter(l=>l.id!==selLineRef.current));setSelectedLineId(null);selLineRef.current=null;return;}
    if(selRef.current.size===0)return;
    const ni=itemsRef.current.filter(i=>!selRef.current.has(i.id));
    const nl=linesRef.current.filter(l=>!selRef.current.has(l.fromId)&&!selRef.current.has(l.toId));
    updBoth(ni,nl);setSelectedIds(new Set());selRef.current=new Set();
  };

  // ── Z order ──
  const bringForward=(id:string)=>updItems(itemsRef.current.map((it,i)=>it.id===id?{...it,zIndex:(itemsRef.current.length+1)}:it));
  const sendBackward=(id:string)=>updItems(itemsRef.current.map(it=>it.id===id?{...it,zIndex:-1}:it));

  // ── Duplicate ──
  const duplicateSelected=()=>{
    const clones:BItem[]=[];
    selRef.current.forEach(id=>{
      const it=itemsRef.current.find(i=>i.id===id);
      if(it)clones.push({...it,id:bid(),x:it.x+20,y:it.y+20});
    });
    if(clones.length){const next=[...itemsRef.current,...clones];updItems(next);setSelectedIds(new Set(clones.map(c=>c.id)));selRef.current=new Set(clones.map(c=>c.id));}
  };

  const[imgUploading,setImgUploading]=useState(false);

  // ── Upload image from file (shared by drag-drop, paste, file picker) ──
  const uploadImageFile=async(file:File,cx:number,cy:number)=>{
    if(!file.type.startsWith("image/"))return;
    if(file.size>20*1024*1024){alert("Файл слишком большой (макс 20 МБ)");return;}
    setImgUploading(true);
    try{
      const compressed=await new Promise<Blob>((res,rej)=>{
        const img=document.createElement("img");
        const obj=URL.createObjectURL(file);
        img.onload=()=>{
          const MAX=1400;
          const scale=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
          const w=Math.round(img.naturalWidth*scale);
          const h=Math.round(img.naturalHeight*scale);
          const canvas=document.createElement("canvas");
          canvas.width=w;canvas.height=h;
          canvas.getContext("2d")!.drawImage(img,0,0,w,h);
          URL.revokeObjectURL(obj);
          canvas.toBlob(b=>{
            if(b){(b as any)._w=w;(b as any)._h=h;res(b);}else rej();
          },"image/jpeg",0.88);
        };
        img.onerror=rej;img.src=obj;
      });
      const w=(compressed as any)._w||400;
      const h=(compressed as any)._h||300;
      const path=userId+"/board_"+bid()+"_"+Date.now()+".jpg";
      const{error}=await supabase.storage.from("files").upload(path,compressed,{contentType:"image/jpeg",upsert:false});
      if(error)throw error;
      const{data}=supabase.storage.from("files").getPublicUrl(path);
      const maxW=320;const scale2=w>maxW?maxW/w:1;
      addItem({type:"image",imageUrl:data.publicUrl,imageW:w,imageH:h,w:Math.round(w*scale2),h:Math.round(h*scale2)},cx,cy);
    }catch(err){console.error(err);alert("Ошибка загрузки");}
    finally{setImgUploading(false);}
  };

  // ── External drag-drop onto canvas ──
  const onCanvasDragOver=(e:React.DragEvent)=>{
    if(e.dataTransfer.types.includes("application/x-vizzy-card")||e.dataTransfer.types.includes("application/x-vizzy-icon")||e.dataTransfer.types.includes("vizzy/sticky-color")||e.dataTransfer.types.includes("Files")){
      e.preventDefault();
      e.dataTransfer.dropEffect="copy";
      if(e.dataTransfer.types.includes("application/x-vizzy-card"))setExternalDropHint(true);
    }
  };
  const onCanvasDrop=async(e:React.DragEvent)=>{
    e.preventDefault();
    setExternalDropHint(false);
    const rawCard=e.dataTransfer.getData("application/x-vizzy-card");
    if(rawCard){
      try{addExternalCardToBoard(JSON.parse(rawCard),e.clientX,e.clientY);}catch{}
      return;
    }
    const rect=canvasRef.current!.getBoundingClientRect();
    const cx=(e.clientX-rect.left-pan.x)/zoom;
    const cy=(e.clientY-rect.top-pan.y)/zoom;
    const rawIcon=e.dataTransfer.getData("application/x-vizzy-icon");
    if(rawIcon){
      try{addBoardIcon(JSON.parse(rawIcon),cx,cy);}catch{}
      return;
    }
    const stickyColor=e.dataTransfer.getData("vizzy/sticky-color");
    if(stickyColor){addStickyWithColor(stickyColor,cx,cy);return;}
    const files=Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith("image/"));
    if(!files.length)return;
    for(let i=0;i<files.length;i++){
      await uploadImageFile(files[i],cx+i*20,cy+i*20);
    }
  };

  // ── File input handler ──
  const onImageFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return;
    e.target.value="";
    await uploadImageFile(file,imgClickPos.x,imgClickPos.y);
  };

  // ── Clipboard paste (Ctrl+V) ──
  useEffect(()=>{
    const onPaste=async(e:ClipboardEvent)=>{
      const tag=(e.target as HTMLElement).tagName;
      if(tag==="INPUT"||tag==="TEXTAREA")return;
      if(!activeBoardId)return;
      const items2=Array.from(e.clipboardData?.items||[]);
      const imgItem=items2.find(i=>i.type.startsWith("image/"));
      if(imgItem){
        e.preventDefault();
        const file=imgItem.getAsFile();
        if(file){
          // Place in center of current view
          const rect=canvasRef.current?.getBoundingClientRect();
          const cx=rect?(rect.width/2-pan.x)/zoom:400;
          const cy=rect?(rect.height/2-pan.y)/zoom:300;
          await uploadImageFile(file,cx,cy);
        }
      }
    };
    window.addEventListener("paste",onPaste);
    return()=>window.removeEventListener("paste",onPaste);
  },[activeBoardId,pan,zoom]);

  // ── Link fetch ──
  const fetchLink=async()=>{
    let url=linkUrl.trim();
    if(!url)return;
    if(!/^https?:\/\//i.test(url))url="https://"+url;
    setLinkLoading(true);
    let title=url,favicon="";
    try{
      const domain=new URL(url).hostname;
      favicon=`https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      title=domain;
    }catch{}
    addItem({type:"link",linkUrl:url,linkTitle:title,linkFavicon:favicon,w:240,h:72},linkClickPos.x,linkClickPos.y);
    setLinkLoading(false);setLinkModal(false);setLinkUrl("");
  };

  // ── Keyboard shortcuts ──
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if(editingId)return;
      const tag=(e.target as HTMLElement).tagName;
      if(tag==="INPUT"||tag==="TEXTAREA")return;
      const k=e.key;
      if(k==="v"||k==="V")setTool("select");
      if(k==="h"||k==="H")setTool("pan");
      if(k==="s"||k==="S")setTool("sticky");
      if(k==="t"||k==="T")setTool("text");
      if(k==="i"||k==="I")setTool("image");
      if(k==="l"||k==="L")setTool("link");
      if(k==="f"||k==="F")setTool("shape");
      if(k==="c"||k==="C")setTool("line");
      if(k==="m"||k==="M")setTool("draw");
      if((k==="Delete"||k==="Backspace"))deleteSelected();
      if(k==="Escape"){setSelectedIds(new Set());setSelectedLineId(null);setEditingId(null);setLineFrom(null);setTool("select");}
      if((e.ctrlKey||e.metaKey)&&k==="d"){e.preventDefault();duplicateSelected();}
      if((e.ctrlKey||e.metaKey)&&(k==="="||k==="+"))setZoom(z=>Math.min(4,z*1.2));
      if((e.ctrlKey||e.metaKey)&&k==="-")setZoom(z=>Math.max(0.15,z*0.8));
      if((e.ctrlKey||e.metaKey)&&k==="0"){setZoom(1);setPan({x:0,y:0});}
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[editingId]);

  // Get anchor point position on item
  const anchorPos=(it:BItem,side:"top"|"bottom"|"left"|"right")=>{
    if(side==="top")return{x:it.x+it.w/2,y:it.y};
    if(side==="bottom")return{x:it.x+it.w/2,y:it.y+it.h};
    if(side==="left")return{x:it.x,y:it.y+it.h/2};
    return{x:it.x+it.w,y:it.y+it.h/2};
  };

  // Find nearest anchor on item to a point
  const nearestAnchor=(it:BItem,px:number,py:number):{side:"top"|"bottom"|"left"|"right",dist:number}=>{
    const sides=(["top","bottom","left","right"] as const).map(side=>{
      const p=anchorPos(it,side);
      return{side,dist:Math.hypot(p.x-px,p.y-py)};
    });
    return sides.reduce((a,b)=>a.dist<b.dist?a:b);
  };

  // ── SVG line rendering ──
  const svgLines=useMemo(()=>{
    const safeItems=normalizeBoardItems(items as any[]);
    const safeItemIds=new Set(safeItems.map(i=>i.id));
    const safeLines=normalizeBoardLines(lines as any[],safeItemIds);
    return safeLines.map(ln=>{
      const from=safeItems.find(i=>i.id===ln.fromId);
      const to=safeItems.find(i=>i.id===ln.toId);
      if(!from||!to)return null;
      // Use anchor points if defined, else centers
      const a=ln.fromAnchor?anchorPos(from,ln.fromAnchor):itemCenter(from);
      const b=ln.toAnchor?anchorPos(to,ln.toAnchor):itemCenter(to);
      const col=ln.color||"#64748B";
      const thick=ln.thickness||2;
      const dashArr=ln.style==="dashed"?`${thick*4} ${thick*3}`:ln.style==="dotted"?`${thick} ${thick*3}`:"none";
      const markerId=`arr-${ln.id}`;
      const markerStartId=`arr-start-${ln.id}`;
      const isSel=selectedLineId===ln.id;
      return(
        <g key={ln.id}>
          {(ln.arrow==="arrow"||ln.arrow==="double")&&<defs><marker id={markerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill={col}/></marker>{ln.arrow==="double"&&<marker id={markerStartId} markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto-start-reverse"><polygon points="10 0, 0 3.5, 10 7" fill={col}/></marker>}</defs>}
          {/* Hit area */}
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={16} style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();setSelectedLineId(ln.id);setSelectedIds(new Set());}}/>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isSel?"#2563EB":col} strokeWidth={isSel?thick+2:thick} strokeDasharray={dashArr} markerStart={ln.arrow==="double"?`url(#${markerStartId})`:"none"} markerEnd={(ln.arrow==="arrow"||ln.arrow==="double")?`url(#${markerId})`:"none"} strokeLinecap="round" style={{pointerEvents:"none"}}/>
        </g>
      );
    });
  },[lines,items,selectedLineId]);

  // ── Render shape ──
  const renderShapeFill=(it:BItem)=>{
    const c=it.color||"#3B82F6";
    const textStyle:React.CSSProperties={
      position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:it.fontFamily||"Inter",fontSize:it.fontSize||13,fontWeight:it.fontBold?800:600,fontStyle:it.fontItalic?"italic":"normal",color:"#fff",
      textAlign:"center",padding:"4px 8px",wordBreak:"break-word",
      textShadow:"0 1px 3px rgba(0,0,0,0.4)",pointerEvents:"none",lineHeight:1.3,
    };
    const txt=it.shapeText||it.text||"";
    switch(it.shapeKind){
      case"square":return<div style={{width:"100%",height:"100%",background:c,borderRadius:8,boxShadow:"0 4px 20px "+c+"55",position:"relative"}}>
        {txt&&<div style={textStyle}>{txt}</div>}
      </div>;
      case"circle":return<div style={{width:"100%",height:"100%",background:c,borderRadius:"50%",boxShadow:"0 4px 20px "+c+"55",position:"relative"}}>
        {txt&&<div style={{...textStyle,borderRadius:"50%"}}>{txt}</div>}
      </div>;
      case"diamond":return<div style={{width:"100%",height:"100%",background:c,clipPath:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)",boxShadow:"0 4px 20px "+c+"55",position:"relative"}}>
        {txt&&<div style={textStyle}>{txt}</div>}
      </div>;
      case"triangle":return<div style={{width:"100%",height:"100%",background:c,clipPath:"polygon(50% 0%,100% 100%,0% 100%)",position:"relative"}}>
        {txt&&<div style={{...textStyle,paddingTop:"40%"}}>{txt}</div>}
      </div>;
      case"cloud":return<div style={{width:"100%",height:"100%",background:c,clipPath:"ellipse(45% 34% at 50% 55%)",borderRadius:999,boxShadow:"0 4px 20px "+c+"55",position:"relative"}}>
        {txt&&<div style={textStyle}>{txt}</div>}
      </div>;
      case"pentagon":return<div style={{width:"100%",height:"100%",background:c,clipPath:"polygon(50% 0%,96% 35%,78% 100%,22% 100%,4% 35%)",boxShadow:"0 4px 20px "+c+"55",position:"relative"}}>
        {txt&&<div style={textStyle}>{txt}</div>}
      </div>;
      case"parallelogram":return<div style={{width:"100%",height:"100%",background:c,clipPath:"polygon(15% 0%,100% 0%,85% 100%,0% 100%)",boxShadow:"0 4px 20px "+c+"55",position:"relative"}}>
        {txt&&<div style={textStyle}>{txt}</div>}
      </div>;
      default:return<div style={{width:"100%",height:"100%",background:c,borderRadius:10,boxShadow:"0 4px 20px "+c+"55",position:"relative"}}>
        {txt&&<div style={textStyle}>{txt}</div>}
      </div>;
    }
  };

  const safeItemsForSelection=normalizeBoardItems(items as any[]);
  const sel1=selectedIds.size===1?safeItemsForSelection.find(i=>i.id==[...selectedIds][0]):null;
  const selLine=lines.find(l=>l.id===selectedLineId);

  const cursorMap:Record<string,string>={select:"default",pan:"grab",sticky:"cell",text:"text",image:"cell",link:"cell",shape:"crosshair",line:"crosshair",draw:"crosshair"};

  // ── If no board selected → show board list ──
  const activeBoard=boards.find(b=>b.id===activeBoardId);

  const expandedExternalItem=expandedExternalItemId
    ?safeItemsForSelection.find(i=>i.id===expandedExternalItemId&&i.type==="external_card")||null
    :null;
  const expandedExternalRecord=expandedExternalItem?.externalSource==="crm"
    ?crmLeads.data.find((lead:any)=>lead.id===expandedExternalItem.externalId)||null
    :expandedExternalItem?.externalSource==="content"
      ?contentRows.data.find((row:any)=>row.id===expandedExternalItem.externalId)||null
      :null;
  const normalizeDetailValue=(value:any)=>{
    if(value===null||value===undefined||value==="")return "—";
    if(typeof value==="number")return Number.isFinite(value)?String(value):"—";
    if(typeof value==="boolean")return value?"Да":"Нет";
    return String(value);
  };
  const externalDetailRows=expandedExternalItem
    ?expandedExternalItem.externalSource==="crm"
      ?[
        {label:"Имя",value:expandedExternalRecord?.name||expandedExternalItem.externalTitle||expandedExternalItem.text},
        {label:"Контакт",value:expandedExternalRecord?.contact||expandedExternalItem.externalSubtitle},
        {label:"Телефон",value:expandedExternalRecord?.phone},
        {label:"Email",value:expandedExternalRecord?.email},
        {label:"Источник",value:expandedExternalRecord?.source},
        {label:"Статус",value:expandedExternalRecord?.status||expandedExternalItem.externalStatus},
        {label:"Сделка",value:expandedExternalRecord?.deal?`${expandedExternalRecord.deal} ₽`:""},
        {label:"Заметка",value:expandedExternalRecord?.note},
        {label:"Создан",value:expandedExternalRecord?.created_at},
      ]
      :[
        {label:"Тема",value:expandedExternalRecord?.topic||expandedExternalItem.externalTitle||expandedExternalItem.text},
        {label:"Платформа",value:expandedExternalRecord?.platform||expandedExternalItem.externalPlatform},
        {label:"Тип",value:expandedExternalRecord?.type},
        {label:"Статус",value:expandedExternalRecord?.status||expandedExternalItem.externalStatus},
        {label:"Дата публикации",value:expandedExternalRecord?.publish_date||expandedExternalRecord?.date},
        {label:"Ссылка",value:expandedExternalRecord?.content_url||expandedExternalRecord?.link},
        {label:"Сценарий / текст",value:expandedExternalRecord?.scenario},
        {label:"Создан",value:expandedExternalRecord?.created_at},
      ]
    :[];
  const expandedExternalImage=expandedExternalItem?.externalSource==="content"
    ?getContentImage(expandedExternalRecord||{})||expandedExternalItem?.imageUrl||""
    :expandedExternalRecord?.avatar_url||expandedExternalRecord?.photo_url||expandedExternalRecord?.image_url||expandedExternalItem?.imageUrl||"";

  if(!activeBoardId||!activeBoard){
    return(
      <div style={{padding:32}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <h1 style={{margin:0,fontSize:24,fontWeight:800}}>Доски</h1>
            <div style={{fontSize:13,color:C.t2,marginTop:2}}>{boards.length}/{MAX_BOARDS} досок использовано</div>
          </div>
          <button onClick={()=>boards.length>=MAX_BOARDS?alert(`Максимум ${MAX_BOARDS} досок`):setNewBoardModal(true)}
            style={{padding:"10px 20px",background:boards.length>=MAX_BOARDS?"#E2E8F0":"#2563EB",color:boards.length>=MAX_BOARDS?C.t2:"#fff",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:boards.length>=MAX_BOARDS?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Новая доска
          </button>
        </div>

        {loadingBoards
          ?<div style={{textAlign:"center",padding:60,color:C.t2}}>Загрузка...</div>
          :boards.length===0
          ?<div style={{textAlign:"center",padding:"80px 32px",background:"#fff",borderRadius:20,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}} className="empty-state">
              <div style={{fontSize:48,marginBottom:12}}>🎨</div>
              <div style={{fontSize:18,fontWeight:700,color:C.t1,marginBottom:8}}>Досок пока нет</div>
              <div style={{fontSize:14,color:C.t2,marginBottom:24}}>Создай первую доску для мозговых штурмов и планирования</div>
              <button onClick={()=>setNewBoardModal(true)} style={{padding:"12px 24px",background:"#2563EB",color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Создать доску</button>
            </div>
          :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
              {boards.map(b=>(
                <div key={b.id} onClick={()=>setActiveBoardId(b.id)}
                  className="board-preview-card"
                  style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.07)",cursor:"pointer",transition:"box-shadow 0.2s,transform 0.15s"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 8px 28px rgba(0,0,0,0.13)";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 2px 12px rgba(0,0,0,0.07)";(e.currentTarget as HTMLElement).style.transform="translateY(0)";}}>
                  {/* Preview area */}
                  <div style={{height:140,background:"linear-gradient(135deg,#F0F9FF,#E0F2FE)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>🎨</div>
                  <div style={{padding:"14px 16px"}}>
                    {renamingId===b.id
                      ?<input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter")renameBoard();if(e.key==="Escape")setRenamingId(null);}}
                          onBlur={renameBoard}
                          style={{...iS(),fontSize:14,fontWeight:700,padding:"4px 8px"}} onClick={e=>e.stopPropagation()}/>
                      :<div style={{fontSize:15,fontWeight:700,color:C.t1,marginBottom:4}}>{b.name}</div>
                    }
                    <div style={{fontSize:11,color:C.t2,marginBottom:12}}>{new Date(b.created_at).toLocaleDateString("ru-RU")}</div>
                    <div style={{display:"flex",gap:8}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>{setRenamingId(b.id);setRenameVal(b.name);}}
                        style={{flex:1,padding:"7px 0",fontSize:12,fontWeight:600,background:"#F1F5F9",color:C.t2,border:"none",borderRadius:8,cursor:"pointer"}}>✎ Переим.</button>
                      <button onClick={()=>setDeletingId(b.id)}
                        style={{padding:"7px 10px",fontSize:12,background:"#FFF1F1",color:"#EF4444",border:"1px solid #FCA5A5",borderRadius:8,cursor:"pointer"}}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Add tile */}
              {boards.length<MAX_BOARDS&&<div onClick={()=>setNewBoardModal(true)}
                style={{background:"transparent",borderRadius:16,border:"2px dashed #CBD5E1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,minHeight:240,cursor:"pointer",transition:"border-color 0.15s,background 0.15s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#2563EB";(e.currentTarget as HTMLElement).style.background="#F0F6FF";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#CBD5E1";(e.currentTarget as HTMLElement).style.background="transparent";}}>
                <div style={{width:44,height:44,borderRadius:14,background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>+</div>
                <div style={{fontSize:13,fontWeight:600,color:C.t2}}>Новая доска</div>
              </div>}
            </div>
        }

        {/* New board modal */}
        {newBoardModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setNewBoardModal(false)}>
            <div style={{background:"#fff",borderRadius:20,padding:32,width:380,boxShadow:"0 24px 60px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:18,fontWeight:700,marginBottom:16}}>Новая доска</div>
              <input autoFocus value={newBoardName} onChange={e=>setNewBoardName(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")createBoard();}}
                placeholder="Название доски..." style={iS()}/>
              <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
                <Btn onClick={()=>setNewBoardModal(false)} primary={false}>Отмена</Btn>
                <Btn onClick={createBoard}>Создать</Btn>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deletingId&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setDeletingId(null)}>
            <div style={{background:"#fff",borderRadius:20,padding:28,width:360,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Удалить доску?</div>
              <div style={{fontSize:13,color:C.t2,marginBottom:20}}>Все элементы будут удалены навсегда.</div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <Btn onClick={()=>setDeletingId(null)} primary={false}>Отмена</Btn>
                <Btn onClick={deleteBoard} style={{background:"#EF4444"}}>Удалить</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── CANVAS SCREEN ──
  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 64px)",overflow:"hidden",background:"#F8FAFC",position:"relative",userSelect:"none"}}>

      {/* ── TOP BAR ── */}
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:60,display:"flex",alignItems:"center",padding:"8px 12px",background:"rgba(255,255,255,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(0,0,0,0.06)",gap:10,overflowX:"auto"}}>
        {/* Back */}
        <button onClick={()=>{setSaved(true);setActiveBoardId(null);setSelectedIds(new Set());setEditingId(null);setLineFrom(null);setTool("select");}}
          style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#F1F5F9",border:"none",borderRadius:9,fontSize:13,fontWeight:600,color:C.t2,cursor:"pointer"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Доски
        </button>

        <div style={{fontSize:14,fontWeight:700,color:C.t1,flex:1}}>{activeBoard.name}</div>

        <button onClick={()=>setExternalPanel(true)}
          style={{display:"flex",alignItems:"center",gap:7,padding:"8px 12px",border:"1px solid #DDD6FE",background:"linear-gradient(135deg,#F5F3FF,#EEF2FF)",color:"#6D28D9",borderRadius:10,fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 0 14px rgba(124,58,237,0.12)"}}>
          ＋ Добавить карточку
        </button>
        <button onClick={refreshExternalCards} title="Обновить данные внешних карточек"
          style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",border:"1px solid #E2E8F0",background:"#fff",color:C.t2,borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
          ↻ Обновить
        </button>

        {/* Main tools moved to the left Miro-style toolbar */}
        {/* Draw tool options */}
        {tool==="draw"&&(
          <div style={{display:"flex",gap:6,alignItems:"center",background:"#F1F5F9",borderRadius:10,padding:"4px 8px"}}>
            {([{id:"pen",label:"Ручка",icon:"🖊"},{id:"pencil",label:"Карандаш",icon:"✏️"},{id:"pointer",label:"Указка",icon:"☄️"}] as {id:DrawMode;label:string;icon:string}[]).map(m=>(
              <button key={m.id} onClick={()=>setDrawMode(m.id)} title={m.label} style={{height:28,padding:"0 8px",borderRadius:7,border:"1px solid "+(drawMode===m.id?"#2563EB":"#E2E8F0"),background:drawMode===m.id?"#EFF6FF":"#fff",fontSize:12,fontWeight:700,color:drawMode===m.id?"#2563EB":C.t2,cursor:"pointer"}}>{m.icon}</button>
            ))}
            {/* Color swatch → opens picker */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setStickyColorPick(stickyColorPick==="__draw__"?null:"__draw__")}
                style={{width:24,height:24,borderRadius:6,background:drawColor,border:"2px solid rgba(0,0,0,0.15)",cursor:"pointer",flexShrink:0}}/>
              {stickyColorPick==="__draw__"&&(
                <div style={{position:"absolute",top:"calc(100%+6px)",left:0,background:"#fff",borderRadius:12,padding:10,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",zIndex:300,width:160,border:"1px solid #E2E8F0"}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                    {BOARD_PALETTE.map(c=><button key={c} onClick={()=>{setDrawColor(c);setStickyColorPick(null);}}
                      style={{width:22,height:22,borderRadius:5,background:c,border:drawColor===c?"2px solid #2563EB":"1px solid #E2E8F0",cursor:"pointer"}}/>)}
                  </div>
                  <input type="color" value={drawColor} onChange={e=>setDrawColor(e.target.value)} style={{width:"100%",height:26,border:"none",cursor:"pointer",borderRadius:5}}/>
                </div>
              )}
            </div>
            <span style={{fontSize:10,color:C.t2}}>Толщина:</span>
            {([{v:2,label:"Тонкая"},{v:4,label:"Средняя"},{v:8,label:"Толстая"}] as {v:number,label:string}[]).map(t=>(
              <button key={t.v} onClick={()=>setDrawThickness(t.v)} title={t.label}
                style={{width:30,height:28,borderRadius:7,border:"1px solid "+(drawThickness===t.v?"#2563EB":"#E2E8F0"),background:drawThickness===t.v?"#EFF6FF":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:16,height:t.v,background:drawThickness===t.v?"#2563EB":"#64748B",borderRadius:t.v,transition:"all 0.15s"}}/>
              </button>
            ))}
          </div>
        )}

        {/* Shape kind picker */}
        {tool==="shape"&&(
          <div style={{display:"flex",gap:3,background:"#F1F5F9",borderRadius:9,padding:"3px"}}>
            {(["rect","square","circle","diamond","triangle","parallelogram"] as const).map(sk=>(
              <button key={sk} onClick={()=>setShapeKind(sk)}
                style={{width:30,height:30,borderRadius:7,border:"none",fontSize:15,background:shapeKind===sk?"#fff":"transparent",cursor:"pointer",boxShadow:shapeKind===sk?"0 1px 4px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {sk==="rect"?"▬":sk==="square"?"■":sk==="circle"?"●":sk==="diamond"?"◆":sk==="triangle"?"▲":"▱"}
              </button>
            ))}
          </div>
        )}

        {/* Line tool: show source hint */}
        {tool==="line"&&<span style={{fontSize:12,color:"#2563EB",fontWeight:600}}>{lineFrom?"Клик по второму элементу":"Клик по первому элементу"}</span>}

        {/* Zoom */}
        <div style={{display:"flex",alignItems:"center",gap:4,background:"#F1F5F9",borderRadius:9,padding:"3px 8px"}}>
          <button onClick={()=>setZoom(z=>Math.max(0.15,z*0.8))} style={{width:24,height:28,border:"none",background:"transparent",cursor:"pointer",fontSize:16,color:C.t2,fontWeight:700}}>−</button>
          <span style={{fontSize:12,fontWeight:700,color:C.t1,minWidth:40,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
          <button onClick={()=>setZoom(z=>Math.min(4,z*1.2))} style={{width:24,height:28,border:"none",background:"transparent",cursor:"pointer",fontSize:16,color:C.t2,fontWeight:700}}>+</button>
          <button onClick={()=>{setZoom(1);setPan({x:0,y:0});}} style={{padding:"2px 6px",border:"none",background:"transparent",cursor:"pointer",fontSize:10,fontWeight:600,color:C.t2}}>⌂</button>
        </div>

        {/* Save indicator */}
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:C.t2}}>
          {imgUploading&&<div style={{display:"flex",alignItems:"center",gap:5,color:"#F59E0B"}}>
            <div style={{width:12,height:12,border:"2px solid #F59E0B",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
            Загрузка фото...
          </div>}
          {!imgUploading&&<>
            <div style={{width:6,height:6,borderRadius:"50%",background:saved?"#10B981":"#F59E0B",transition:"background 0.3s"}}/>
            {saved?"Сохранено":"Сохранение..."}
          </>}
        </div>
      </div>

      {/* ── LEFT MIRO-STYLE TOOLBAR ── */}
      <div style={{position:"absolute",left:14,top:86,zIndex:130,display:"flex",flexDirection:"column",gap:10,alignItems:"center"}}>
        <div style={{width:58,height:58,borderRadius:22,background:"linear-gradient(135deg,#4F46E5,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:24,boxShadow:"0 18px 36px rgba(79,70,229,0.28)",border:"1px solid rgba(255,255,255,0.7)"}}>✦</div>
        <div style={{width:54,background:"rgba(255,255,255,0.96)",border:"1px solid rgba(15,23,42,0.08)",boxShadow:"0 14px 34px rgba(15,23,42,0.12)",borderRadius:16,padding:6,display:"flex",flexDirection:"column",gap:5,alignItems:"center"}}>
          {[
            {id:"select",label:"Курсор",icon:"➤",on:()=>{setTool("select");setToolPanel(null);}},
            {id:"create",label:"Документ / таблица",icon:"▣+",on:()=>{setTool("select");setToolPanel(toolPanel==="create"?null:"create");}},
            {id:"sticky",label:"Стикеры",icon:"◰",on:()=>{setTool("sticky");setToolPanel(toolPanel==="sticky"?null:"sticky");}},
            {id:"icons",label:"Иконки",icon:"◫",on:()=>{setTool("select");setToolPanel(toolPanel==="icons"?null:"icons");}},
            {id:"text",label:"Текст",icon:"T",on:()=>{setTool("text");setToolPanel(null);}},
            {id:"shape",label:"Фигуры и стрелки",icon:"▧↗",on:()=>{setTool("shape");setToolPanel(toolPanel==="shape"?null:"shape");}},
            {id:"draw",label:"Рисование",icon:"✎",on:()=>{setTool("draw");setToolPanel(toolPanel==="draw"?null:"draw");}},
            {id:"image",label:"Изображение",icon:"＋",on:()=>{setTool("image");setToolPanel(null);setImgClickPos({x:400,y:300});imgInputRef.current?.click();}},
          ].map((b:any)=><button key={b.id} title={b.label} onClick={b.on} style={{width:42,height:42,borderRadius:10,border:"none",background:(tool===b.id||toolPanel===b.id)?"#E8EDFF":"transparent",color:(tool===b.id||toolPanel===b.id)?"#3155E7":"#1F2937",cursor:"pointer",fontSize:b.id==="text"?27:20,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s"}}>{b.icon}</button>)}
          <div style={{width:34,height:1,background:"#E5E7EB",margin:"4px 0"}}/>
          <button title="Добавить внешнюю карточку" onClick={()=>setExternalPanel(true)} style={{width:42,height:42,borderRadius:10,border:"none",background:"#111827",color:"#fff",cursor:"pointer",fontSize:22,fontWeight:900}}>+</button>
        </div>
        <div style={{width:54,background:"rgba(255,255,255,0.96)",border:"1px solid rgba(15,23,42,0.08)",boxShadow:"0 14px 34px rgba(15,23,42,0.12)",borderRadius:16,padding:6,display:"flex",flexDirection:"column",gap:5,alignItems:"center"}}>
          <button title="Назад на 1 шаг" onClick={undoBoard} style={{width:42,height:42,borderRadius:10,border:"none",background:"transparent",cursor:"pointer",fontSize:24,color:historyPast.current.length?"#111827":"#A3AAB8"}}>↶</button>
          <button title="Вперёд на 1 шаг" onClick={redoBoard} style={{width:42,height:42,borderRadius:10,border:"none",background:"transparent",cursor:"pointer",fontSize:24,color:historyFuture.current.length?"#111827":"#A3AAB8"}}>↷</button>
        </div>
      </div>

      {toolPanel==="create"&&<div style={{position:"absolute",left:86,top:184,zIndex:135,width:250,background:"#fff",borderRadius:18,padding:14,boxShadow:"0 22px 55px rgba(15,23,42,.16)",border:"1px solid #E5E7EB"}}>
        <button onClick={()=>{addBoardDoc();setToolPanel(null);}} style={{width:"100%",padding:"14px 14px",border:"none",borderRadius:13,background:"#EEF2FF",fontSize:14,fontWeight:800,color:"#3730A3",cursor:"pointer",marginBottom:10,textAlign:"left"}}>📄 Создать документ Docs</button>
        <button onClick={()=>{addBoardTable();setToolPanel(null);}} style={{width:"100%",padding:"14px 14px",border:"none",borderRadius:13,background:"#ECFDF5",fontSize:14,fontWeight:800,color:"#047857",cursor:"pointer",textAlign:"left"}}>▦ Создать таблицу</button>
        <div style={{fontSize:11,color:C.t2,marginTop:10,lineHeight:1.45}}>Эти элементы появляются на доске как быстрые карточки и дальше могут быть связаны с Vizzy Text / Vizzy Tables.</div>
      </div>}

      {toolPanel==="sticky"&&<div style={{position:"absolute",left:86,top:238,zIndex:135,width:216,background:"#fff",borderRadius:18,padding:14,boxShadow:"0 22px 55px rgba(15,23,42,.16)",border:"1px solid #E5E7EB"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
          {BOARD_STICKY_PALETTE.map(c=><button key={c} draggable onDragStart={e=>e.dataTransfer.setData("vizzy/sticky-color",c)} onClick={()=>addStickyWithColor(c)} title="Клик — добавить, перетащи — разместить" style={{height:72,borderRadius:2,background:c,border:"1px solid rgba(15,23,42,.18)",boxShadow:"0 7px 18px rgba(15,23,42,.12)",cursor:"grab"}}/>)}
        </div>
        <button onClick={()=>addStickyWithColor(BOARD_STICKY_PALETTE[0])} style={{marginTop:12,width:"100%",height:42,border:"none",borderRadius:10,background:"#E5E7EB",fontSize:14,fontWeight:800,cursor:"pointer"}}>✦ Generate</button>
        <button onClick={()=>addStickyWithColor(BOARD_STICKY_PALETTE[1])} style={{marginTop:8,width:"100%",height:42,border:"none",borderRadius:10,background:"#E5E7EB",fontSize:14,fontWeight:800,cursor:"pointer"}}>▱ Stack</button>
      </div>}

      {toolPanel==="icons"&&<div style={{position:"absolute",left:86,top:292,zIndex:135,width:392,maxHeight:"72vh",overflow:"hidden",background:"#fff",borderRadius:20,padding:14,boxShadow:"0 22px 55px rgba(15,23,42,.16)",border:"1px solid #E5E7EB",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div>
            <div style={{fontSize:16,fontWeight:900,color:C.t1}}>Иконки</div>
            <div style={{fontSize:11,color:C.t2,marginTop:3}}>Эмодзи, соцсети и бизнес-иконки. Клик — добавить, drag & drop — разместить.</div>
          </div>
          <div style={{fontSize:11,fontWeight:800,color:"#6366F1",padding:"6px 10px",borderRadius:999,background:"#EEF2FF"}}>{filteredLibraryIcons.length}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {([{id:"emoji",label:"Эмодзи"},{id:"social",label:"Соцсети"},{id:"business",label:"Бизнес"}] as const).map(tab=><button key={tab.id} onClick={()=>setIconTab(tab.id)} style={{height:38,borderRadius:12,border:"1px solid "+(iconTab===tab.id?"#C7D2FE":"#E5E7EB"),background:iconTab===tab.id?"#EEF2FF":"#fff",color:iconTab===tab.id?"#3730A3":"#475569",fontSize:13,fontWeight:800,cursor:"pointer"}}>{tab.label}</button>)}
        </div>
        <input value={iconSearch} onChange={e=>setIconSearch(e.target.value)} placeholder="Поиск по названию..." style={{width:"100%",height:40,border:"1px solid #E2E8F0",borderRadius:12,padding:"0 12px",fontSize:13,outline:"none"}}/>
        <div style={{overflowY:"auto",paddingRight:4,display:"flex",flexDirection:"column",gap:12}}>
          {favoriteIcons.filter((icon:any)=>icon.category===iconTab).length>0&&<div>
            <div style={{fontSize:11,fontWeight:900,color:"#64748B",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Избранные</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:8}}>
              {favoriteIcons.filter((icon:any)=>icon.category===iconTab).map((icon:any)=><button key={icon.key} draggable onDragStart={e=>e.dataTransfer.setData("application/x-vizzy-icon",JSON.stringify(icon))} onClick={()=>addBoardIcon(icon)} style={{height:52,borderRadius:12,border:"1px solid #E5E7EB",background:"#FFFBEB",display:"flex",alignItems:"center",justifyContent:"center",cursor:"grab",position:"relative"}} title={icon.label}><div style={{position:"absolute",top:4,right:5,fontSize:11,color:"#F59E0B"}}>★</div>{renderBoardLibraryIcon(icon,undefined,icon.category==="emoji"?28:26)}</button>)}
            </div>
          </div>}

          {recentIcons.filter((icon:any)=>icon.category===iconTab).length>0&&<div>
            <div style={{fontSize:11,fontWeight:900,color:"#64748B",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Недавние</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:8}}>
              {recentIcons.filter((icon:any)=>icon.category===iconTab).map((icon:any)=><button key={icon.key} draggable onDragStart={e=>e.dataTransfer.setData("application/x-vizzy-icon",JSON.stringify(icon))} onClick={()=>addBoardIcon(icon)} style={{height:52,borderRadius:12,border:"1px solid #E5E7EB",background:"#F8FAFC",display:"flex",alignItems:"center",justifyContent:"center",cursor:"grab",position:"relative"}} title={icon.label}><button onClick={e=>{e.stopPropagation();toggleFavoriteIcon(icon.key);}} style={{position:"absolute",top:4,right:4,width:16,height:16,border:"none",background:"transparent",cursor:"pointer",fontSize:11,color:favoriteIconKeys.includes(icon.key)?"#F59E0B":"#CBD5E1",padding:0}}>★</button>{renderBoardLibraryIcon(icon,undefined,icon.category==="emoji"?28:26)}</button>)}
            </div>
          </div>}

          <div>
            <div style={{fontSize:11,fontWeight:900,color:"#64748B",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>{iconTab==="emoji"?"Эмодзи":iconTab==="social"?"Соцсети":"Бизнес"}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:8}}>
              {filteredLibraryIcons.map((icon:any)=><button key={icon.key} draggable onDragStart={e=>e.dataTransfer.setData("application/x-vizzy-icon",JSON.stringify(icon))} onClick={()=>addBoardIcon(icon)} style={{height:56,borderRadius:14,border:"1px solid #E5E7EB",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"grab",position:"relative",boxShadow:"0 2px 8px rgba(15,23,42,0.04)"}} title={icon.label}><button onClick={e=>{e.stopPropagation();toggleFavoriteIcon(icon.key);}} style={{position:"absolute",top:4,right:4,width:16,height:16,border:"none",background:"transparent",cursor:"pointer",fontSize:11,color:favoriteIconKeys.includes(icon.key)?"#F59E0B":"#CBD5E1",padding:0}}>★</button>{renderBoardLibraryIcon(icon,undefined,icon.category==="emoji"?30:28)}</button>)}
            </div>
          </div>

          {filteredLibraryIcons.length===0&&<div style={{padding:"22px 12px",textAlign:"center",fontSize:13,color:C.t2}}>Ничего не найдено. Попробуй другой запрос.</div>}
        </div>
      </div>}


      {toolPanel==="shape"&&<div style={{position:"absolute",left:86,top:346,zIndex:135,width:284,background:"#fff",borderRadius:18,padding:12,boxShadow:"0 22px 55px rgba(15,23,42,.16)",border:"1px solid #E5E7EB"}}>
        {[
          {label:"Line",icon:"╱",act:()=>{setTool("line");setShapeKind("rect");setToolPanel(null);}},
          {label:"Arrow",icon:"↗",act:()=>{setTool("line");setShapeKind("rect");setToolPanel(null);}},
          {label:"Rectangle",icon:"□",act:()=>{setTool("shape");setShapeKind("rect");setToolPanel(null);}},
          {label:"Oval",icon:"○",act:()=>{setTool("shape");setShapeKind("circle");setToolPanel(null);}},
          {label:"Rhombus",icon:"◇",act:()=>{setTool("shape");setShapeKind("diamond");setToolPanel(null);}},
          {label:"Triangle",icon:"△",act:()=>{setTool("shape");setShapeKind("triangle");setToolPanel(null);}},
          {label:"Cloud",icon:"☁",act:()=>{setTool("shape");setShapeKind("cloud");setToolPanel(null);}},
          {label:"Pentagon",icon:"⬟",act:()=>{setTool("shape");setShapeKind("pentagon");setToolPanel(null);}},
        ].map((s:any)=><button key={s.label} onClick={s.act} style={{width:"100%",height:42,border:"none",borderRadius:10,background:(tool==="shape"&&s.label.toLowerCase().includes(shapeKind||""))?"#E8EDFF":"transparent",display:"flex",alignItems:"center",gap:14,padding:"0 12px",fontSize:15,fontWeight:650,color:"#1F2937",cursor:"pointer",textAlign:"left"}}><span style={{width:24,fontSize:21}}>{s.icon}</span>{s.label}</button>)}
      </div>}

      {toolPanel==="draw"&&<div style={{position:"absolute",left:86,top:400,zIndex:135,width:78,background:"#fff",borderRadius:18,padding:10,boxShadow:"0 22px 55px rgba(15,23,42,.16)",border:"1px solid #E5E7EB",display:"flex",flexDirection:"column",gap:9,alignItems:"center"}}>
        {([{id:"pencil",icon:"✐",label:"Карандаш"},{id:"pen",icon:"✎",label:"Ручка"},{id:"pointer",icon:"☄",label:"Указка"}] as {id:DrawMode;icon:string;label:string}[]).map(m=><button key={m.id} title={m.label} onClick={()=>{setTool("draw");setDrawMode(m.id);}} style={{width:46,height:46,borderRadius:12,border:"none",background:drawMode===m.id?"#E8EDFF":"transparent",color:drawMode===m.id?"#3155E7":"#1F2937",fontSize:24,cursor:"pointer"}}>{m.icon}</button>)}
        <div style={{width:38,height:1,background:"#E5E7EB",margin:"2px 0"}}/>
        {BOARD_DRAW_COLORS.map(c=><button key={c} onClick={()=>setDrawColor(c)} style={{width:36,height:36,borderRadius:"50%",background:c,border:drawColor===c?"3px solid #3155E7":"2px solid #E5E7EB",boxShadow:"inset 0 0 0 3px #fff",cursor:"pointer"}}/>)}
      </div>}

      {/* ── MULTI-SELECTION TOOLBAR — shown when 2+ items selected ── */}
      {selectedIds.size>1&&!selLine&&(
        <div style={{
          position:"absolute",top:56,left:"50%",transform:"translateX(-50%)",
          zIndex:120,display:"flex",gap:6,alignItems:"center",
          background:"rgba(255,255,255,0.98)",backdropFilter:"blur(12px)",
          borderRadius:12,padding:"8px 14px",
          boxShadow:"0 4px 24px rgba(0,0,0,0.13)",border:"1px solid rgba(0,0,0,0.07)",
        }}>
          <span style={{fontSize:12,fontWeight:700,color:"#2563EB",marginRight:4}}>
            {selectedIds.size} объектов
          </span>
          <div style={{width:1,height:18,background:"#E2E8F0"}}/>
          <button onClick={duplicateSelected} title="Дублировать выбранное"
            style={{padding:"4px 10px",border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:600,color:"#1E293B",display:"flex",alignItems:"center",gap:4}}>
            ⧉ Дублировать
          </button>
          <button onClick={()=>{
            // Group move - move all together
            const ids=[...selectedIds];
            const startPos:Record<string,{x:number;y:number}>={};
            items.filter(i=>ids.includes(i.id)).forEach(i=>{startPos[i.id]={x:i.x,y:i.y};});
            // Already selectable, just show hint
          }} style={{display:"none"}}>_</button>
          <button onClick={deleteSelected}
            style={{padding:"4px 10px",border:"1px solid #FCA5A5",borderRadius:7,background:"#FFF1F1",cursor:"pointer",fontSize:11,fontWeight:600,color:"#EF4444",display:"flex",alignItems:"center",gap:4}}>
            🗑 Удалить все
          </button>
          <button onClick={()=>{setSelectedIds(new Set());selRef.current=new Set();}}
            style={{width:24,height:24,border:"1px solid #E2E8F0",borderRadius:6,background:"transparent",cursor:"pointer",fontSize:11,color:"#64748B",display:"flex",alignItems:"center",justifyContent:"center"}}>
            ✕
          </button>
        </div>
      )}

      {/* ── FLOATING CONTEXT TOOLBAR — stays visible while editing text ── */}
      {(sel1||selLine)&&(
        <div style={{
          position:"absolute",
          top:sel1?Math.max(56,pan.y+(sel1.y*zoom)-62):60,
          left:sel1?pan.x+((sel1.x+sel1.w/2)*zoom):"50%",
          transform:"translateX(-50%)",
          zIndex:120,
          display:"flex",
          gap:6,
          background:"rgba(255,255,255,0.98)",
          backdropFilter:"blur(14px)",
          WebkitBackdropFilter:"blur(14px)",
          borderRadius:14,
          padding:"7px 9px",
          boxShadow:"0 12px 36px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.08)",
          border:"1px solid rgba(15,23,42,0.08)",
          alignItems:"center",
          flexWrap:"nowrap",
          maxWidth:"calc(100vw - 360px)",
          overflow:"visible",
          scrollbarWidth:"none",
        }}>

          {sel1&&["sticky","text","shape"].includes(sel1.type)&&<div style={{width:34,height:34,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#0F172A",background:"#F8FAFC",border:"1px solid #E2E8F0",flexShrink:0}}>T</div>}

          {/* Color */}
          <div style={{position:"relative",flexShrink:0}}>
            <button onClick={()=>{setColorTarget(colorTarget?null:sel1?"item":"line");setShapeColorOpen(false);}}
              style={{width:34,height:34,borderRadius:10,background:sel1?sel1.color||"#FEF08A":selLine?.color||"#64748B",border:"2px solid rgba(0,0,0,0.12)",cursor:"pointer",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.45)",flexShrink:0}}/>
            {colorTarget&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,background:"#fff",borderRadius:12,padding:10,boxShadow:"0 8px 24px rgba(0,0,0,0.14)",width:172,zIndex:200,border:"1px solid #E2E8F0"}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                  {BOARD_PALETTE.map(c=>(
                    <button key={c} onClick={()=>{
                      if(sel1)updItems(itemsRef.current.map(it=>it.id===sel1.id?{...it,color:c}:it));
                      else if(selLine)updLines(linesRef.current.map(l=>l.id===selLine.id?{...l,color:c}:l));
                      setColorTarget(null);
                    }} style={{width:24,height:24,borderRadius:6,background:c,border:"1px solid rgba(0,0,0,0.1)",cursor:"pointer"}}/>
                  ))}
                </div>
                {/* HEX input */}
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:10,color:"#64748B",fontWeight:500}}>HEX</span>
                  <input value={customColorInput} onChange={e=>setCustomColorInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"){if(sel1)updItems(itemsRef.current.map(it=>it.id===sel1.id?{...it,color:customColorInput}:it));else if(selLine)updLines(linesRef.current.map(l=>l.id===selLine.id?{...l,color:customColorInput}:l));setColorTarget(null);}}}
                    style={{flex:1,padding:"4px 7px",border:"1px solid #E2E8F0",borderRadius:7,fontSize:12,outline:"none",fontFamily:"monospace"}} placeholder="#000000"/>
                </div>
                {/* Native color picker */}
                <input type="color" value={customColorInput} onChange={e=>{
                  setCustomColorInput(e.target.value);
                  if(sel1)updItems(itemsRef.current.map(it=>it.id===sel1.id?{...it,color:e.target.value}:it));
                  else if(selLine)updLines(linesRef.current.map(l=>l.id===selLine.id?{...l,color:e.target.value}:l));
                }} style={{width:"100%",height:28,border:"none",cursor:"pointer",borderRadius:7}}/>
              </div>
            )}
          </div>

          {sel1?.type==="shape"&&(
            <div style={{position:"relative",flexShrink:0}}>
              <button onClick={(e)=>{e.stopPropagation();setShapeColorOpen(v=>!v);setColorTarget(null);}} title="Цвет фигуры"
                style={{height:34,padding:"0 12px",borderRadius:10,border:"1px solid #E2E8F0",background:shapeColorOpen?"#EFF6FF":"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:800,color:shapeColorOpen?"#2563EB":"#0F172A",whiteSpace:"nowrap",boxShadow:shapeColorOpen?"0 4px 14px rgba(37,99,235,0.12)":"none"}}>
                <span style={{width:18,height:18,borderRadius:6,background:sel1.color||"#3B82F6",border:"2px solid rgba(15,23,42,0.14)",boxShadow:"inset 0 0 0 2px rgba(255,255,255,0.55)"}}/>
                Цвет фигуры
              </button>
            </div>
          )}

          {/* Item-specific controls */}
          {sel1&&["sticky","text","shape"].includes(sel1.type)&&<>
            <select value={sel1.fontFamily||"Inter"} onChange={e=>updItems(items.map(it=>it.id===sel1.id?{...it,fontFamily:e.target.value}:it))}
              style={{height:34,border:"1px solid #E2E8F0",borderRadius:10,background:"#fff",fontSize:13,fontWeight:500,color:C.t1,outline:"none",minWidth:132,maxWidth:160,padding:"0 8px",flexShrink:0}}>
              {BOARD_FONTS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <button onClick={()=>updItems(items.map(it=>it.id===sel1.id?{...it,fontSize:Math.max(8,(it.fontSize||14)-2)}:it))}
              style={{width:32,height:34,border:"1px solid #E2E8F0",borderRadius:10,background:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0}}>A−</button>
            <span style={{height:34,minWidth:36,padding:"0 8px",border:"1px solid #E2E8F0",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.t1,fontWeight:600,background:"#fff",flexShrink:0}}>{sel1.fontSize||14}</span>
            <button onClick={()=>updItems(items.map(it=>it.id===sel1.id?{...it,fontSize:Math.min(72,(it.fontSize||14)+2)}:it))}
              style={{width:32,height:34,border:"1px solid #E2E8F0",borderRadius:10,background:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0}}>A+</button>
            <button onClick={()=>updItems(items.map(it=>it.id===sel1.id?{...it,fontBold:!it.fontBold}:it))}
              style={{width:34,height:34,border:"1px solid #E2E8F0",borderRadius:10,background:sel1.fontBold?"#EFF6FF":"#fff",cursor:"pointer",fontSize:16,fontWeight:900,color:sel1.fontBold?"#2563EB":C.t1,flexShrink:0}}>B</button>
            <button onClick={()=>updItems(items.map(it=>it.id===sel1.id?{...it,fontItalic:!it.fontItalic}:it))}
              style={{width:34,height:34,border:"1px solid #E2E8F0",borderRadius:10,background:sel1.fontItalic?"#EFF6FF":"#fff",cursor:"pointer",fontSize:16,fontStyle:"italic",fontWeight:700,color:sel1.fontItalic?"#2563EB":C.t1,flexShrink:0}}>I</button>
          </>}

          {/* Line controls */}
          {selLine&&<>
            <div style={{width:1,background:"#E2E8F0",height:20}}/>
            {([1,2,4] as number[]).map(th=>(
              <button key={th} onClick={()=>updLines(lines.map(l=>l.id===selLine.id?{...l,thickness:th}:l))}
                style={{width:32,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:selLine.thickness===th?"#EFF6FF":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{height:th,width:20,background:selLine.thickness===th?"#2563EB":"#64748B",borderRadius:1}}/>
              </button>
            ))}
            {(["solid","dashed","dotted"] as LineStyle[]).map(st=>(
              <button key={st} onClick={()=>updLines(lines.map(l=>l.id===selLine.id?{...l,style:st}:l))}
                style={{padding:"4px 8px",border:"1px solid #E2E8F0",borderRadius:7,background:selLine.style===st?"#EFF6FF":"transparent",cursor:"pointer",fontSize:11,fontWeight:600,color:selLine.style===st?"#2563EB":C.t1}}>
                {st==="solid"?"—":st==="dashed"?"--":"··"}
              </button>
            ))}
            {(["none","arrow","double"] as ArrowTip[]).map(ar=>(
              <button key={ar} onClick={()=>updLines(lines.map(l=>l.id===selLine.id?{...l,arrow:ar}:l))}
                style={{padding:"4px 8px",border:"1px solid #E2E8F0",borderRadius:7,background:selLine.arrow===ar?"#EFF6FF":"transparent",cursor:"pointer",fontSize:13,color:selLine.arrow===ar?"#2563EB":C.t1}}>
                {ar==="none"?"—":ar==="arrow"?"→":"↔"}
              </button>
            ))}
          </>}

          {/* Layer controls (items only) */}
          {sel1&&<>
            <div style={{width:1,background:"#E2E8F0",height:20}}/>
            <button onClick={()=>bringForward(sel1.id)} title="На передний план" style={{width:26,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",fontSize:12}}>↑</button>
            <button onClick={()=>sendBackward(sel1.id)} title="На задний план" style={{width:26,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",fontSize:12}}>↓</button>
          </>}

          {/* Edit text */}
          {sel1&&!["image","link","draw"].includes(sel1.type)&&(
            <button onClick={()=>{if(editingId===sel1.id){setEditingId(null);return;}setEditingId(sel1.id);setEditText(sel1.type==="shape"?(sel1.shapeText||sel1.text||""):(sel1.text||""));}}
              style={{height:34,padding:"0 12px",border:"1px solid #E2E8F0",borderRadius:10,background:editingId===sel1.id?"#EFF6FF":"#fff",cursor:"pointer",fontSize:12,fontWeight:700,color:editingId===sel1.id?"#2563EB":C.t1,whiteSpace:"nowrap",flexShrink:0}}>{editingId===sel1.id?"✓ Готово":"✏️ Текст"}</button>
          )}

          {/* Duplicate */}
          {sel1&&<button onClick={duplicateSelected} title="Дублировать (Ctrl+D)" style={{width:26,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",fontSize:14}}>⧉</button>}

          {/* Delete */}
          <button onClick={deleteSelected} style={{width:26,height:26,border:"1px solid #FCA5A5",borderRadius:7,background:"#FFF1F1",cursor:"pointer",fontSize:12,color:"#EF4444"}}>🗑</button>
        </div>
      )}

      {shapeColorOpen&&sel1?.type==="shape"&&(
        <div
          onMouseDown={e=>e.stopPropagation()}
          onClick={e=>e.stopPropagation()}
          style={{
            position:"absolute",
            top:Math.max(92,pan.y+((sel1.y+sel1.h)*zoom)+12),
            left:pan.x+(sel1.x*zoom),
            width:220,
            zIndex:520,
            background:"#fff",
            border:"1px solid #E2E8F0",
            borderRadius:16,
            padding:12,
            boxShadow:"0 22px 55px rgba(15,23,42,0.22)",
          }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:10}}>
            <div>
              <div style={{fontSize:12,fontWeight:900,color:"#0F172A"}}>Цвет фигуры</div>
              <div style={{fontSize:10,color:"#64748B",marginTop:2}}>Заливка выбранной фигуры</div>
            </div>
            <button onClick={()=>setShapeColorOpen(false)} style={{width:24,height:24,border:"1px solid #E2E8F0",borderRadius:8,background:"#fff",cursor:"pointer",color:"#64748B",fontSize:14,lineHeight:1}}>×</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:7,marginBottom:12}}>
            {BOARD_PALETTE.map(color=>(
              <button key={color} onClick={()=>{updateSelectedShapeColor(color);setShapeColorOpen(false);}} title={color}
                style={{width:26,height:26,borderRadius:8,background:color,border:color.toLowerCase()===(sel1.color||"").toLowerCase()?"2px solid #2563EB":"1px solid rgba(15,23,42,0.16)",cursor:"pointer",boxShadow:color==="#ffffff"?"inset 0 0 0 1px #CBD5E1":"none"}}/>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <input type="color" value={sel1.color||"#3B82F6"} onChange={e=>updateSelectedShapeColor(e.target.value)} style={{width:42,height:34,border:"none",cursor:"pointer",borderRadius:8,padding:0,background:"transparent"}}/>
            <input value={sel1.color||"#3B82F6"} onChange={e=>updateSelectedShapeColor(e.target.value)} placeholder="#3B82F6"
              style={{flex:1,height:34,border:"1px solid #E2E8F0",borderRadius:10,padding:"0 10px",fontSize:12,fontFamily:"monospace",outline:"none",color:"#0F172A"}}/>
          </div>
        </div>
      )}


      {/* ── CANVAS ── */}
      <div ref={canvasRef} className="board-bg"
        style={{position:"absolute",inset:0,top:48,cursor:cursorMap[tool]||"default",overflow:"hidden"}}
        onClick={onCanvasClick}
        onMouseDown={onCanvasDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onDragOver={onCanvasDragOver}
        onDrop={onCanvasDrop}
        onContextMenu={e=>e.preventDefault()}>

        {/* Dot grid */}
        <svg className="board-bg-dot" style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="bgdots" x={(pan.x%(28*zoom))} y={(pan.y%(28*zoom))} width={28*zoom} height={28*zoom} patternUnits="userSpaceOnUse">
              <circle cx={14*zoom} cy={14*zoom} r={Math.max(0.8,1.2*zoom)} fill="#CBD5E1" opacity="0.6"/>
            </pattern>
          </defs>
          <rect className="board-bg-dot" width="100%" height="100%" fill="url(#bgdots)"/>
        </svg>

        {/* Transform layer */}
        <div style={{position:"absolute",top:0,left:0,transformOrigin:"0 0",transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>

          {/* Lines SVG */}
          <svg style={{position:"absolute",top:-5000,left:-5000,width:20000,height:20000,pointerEvents:"none",overflow:"visible"}} xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(5000,5000)" style={{pointerEvents:"visibleStroke"}}>
              {svgLines}

              {/* Connector drag preview */}
              {connectorDrag&&(()=>{
                const from=items.find(i=>i.id===connectorDrag.fromId);
                if(!from)return null;
                const a=anchorPos(from,connectorDrag.fromAnchor);
                return <g>
                  <line x1={a.x} y1={a.y} x2={connectorDrag.mx} y2={connectorDrag.my} stroke="#2563EB" strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round"/>
                  <circle cx={connectorDrag.mx} cy={connectorDrag.my} r="5" fill="#2563EB" opacity="0.7"/>
                </g>;
              })()}

              {/* Pointer trail */}
              {pointerTrail&&(
                <g transform={`translate(${pointerTrail.startX},${pointerTrail.startY})`} style={{opacity:0.7,transition:"opacity 0.8s"}}>
                  <path d={pointerTrail.path} fill="none" stroke={pointerTrail.color} strokeWidth={pointerTrail.thickness} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 6"/>
                </g>
              )}

              {/* Draw preview */}
              {isDrawing&&drawPreview&&drawingRef.current&&(
                <g transform={`translate(${drawingRef.current.startX},${drawingRef.current.startY})`}>
                  <path d={drawPreview} fill="none" stroke={drawMode==="pencil"?"rgba(30,41,59,0.75)":drawColor} strokeWidth={drawMode==="pointer"?Math.max(4,drawThickness+2):drawMode==="pencil"?Math.max(1,drawThickness-1):drawThickness} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={drawMode==="pointer"?"10 6":"none"}/>
                </g>
              )}
            </g>
          </svg>

          {/* Items */}
          {normalizeBoardItems(items as any[]).sort((a,b)=>(a.zIndex||0)-(b.zIndex||0)).map(it=>{
            const isSel=selectedIds.has(it.id);
            const isEdit=editingId===it.id;
            const isLineSrc=lineFrom===it.id;

            return(
              <div key={it.id}
                onMouseDown={e=>onItemDown(e,it.id)}
                onDoubleClick={e=>{e.stopPropagation();if(it.type!=="image"){setEditingId(it.id);setEditText(it.type==="shape"?(it.shapeText||it.text||""):(it.text||""));setSelectedIds(new Set([it.id]));}}}
                style={{
                  position:"absolute",left:it.x,top:it.y,width:it.w,height:it.h,
                  cursor:tool==="line"?"crosshair":(dragState.current&&Array.isArray(dragState.current.ids)&&dragState.current.ids.includes(it.id))?"grabbing":"grab",
                  zIndex:(it.zIndex||0)+5,
                  outline:isSel?"2px solid #2563EB":isLineSrc?"2px solid #F59E0B":"none",
                  outlineOffset:isSel||isLineSrc?3:0,
                  borderRadius:it.type==="sticky"?4:it.type==="shape"?0:10,
                  transition:"outline 0.1s",
                }}>

                {/* ── STICKY ── */}
                {it.type==="sticky"&&(
                  <div style={{width:"100%",height:"100%",background:it.color||BOARD_PALETTE[0],borderRadius:4,boxShadow:"2px 6px 20px rgba(0,0,0,0.13),0 1px 3px rgba(0,0,0,0.07)",padding:"10px 12px 16px",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",bottom:0,right:0,width:22,height:22,background:"rgba(0,0,0,0.07)",clipPath:"polygon(100% 0,100% 100%,0 100%)"}}/>
                    {isEdit
                      ?<textarea autoFocus value={editText} onChange={e=>setEditText(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Escape"||(e.key==="Enter"&&e.ctrlKey)){const next=items.map(i=>i.id===it.id?{...i,text:editText}:i);updItems(next);setEditingId(null);}}}
                          onBlur={()=>{const next=items.map(i=>i.id===it.id?{...i,text:editText}:i);updItems(next);setEditingId(null);}}
                          style={{flex:1,border:"none",background:"transparent",resize:"none",outline:"none",fontFamily:it.fontFamily||"Inter",fontSize:it.fontSize||14,fontWeight:it.fontBold?700:400,fontStyle:it.fontItalic?"italic":"normal",color:"rgba(0,0,0,0.8)",lineHeight:1.55}}/>
                      :<div style={{flex:1,fontFamily:it.fontFamily||"Inter",fontSize:it.fontSize||14,fontWeight:it.fontBold?700:400,fontStyle:it.fontItalic?"italic":"normal",color:"rgba(0,0,0,0.8)",lineHeight:1.55,wordBreak:"break-word",whiteSpace:"pre-wrap",overflow:"hidden"}}>{it.text||<span style={{opacity:0.35,fontStyle:"italic"}}>Двойной клик для ввода...</span>}</div>
                    }
                  </div>
                )}

                {/* ── TEXT ── */}
                {it.type==="text"&&(
                  <div style={{width:"100%",height:"100%",display:"flex",alignItems:"flex-start",padding:4}}>
                    {isEdit
                      ?<textarea autoFocus value={editText} onChange={e=>setEditText(e.target.value)}
                          onBlur={()=>{const next=items.map(i=>i.id===it.id?{...i,text:editText}:i);updItems(next);setEditingId(null);}}
                          onKeyDown={e=>{if(e.key==="Escape"){const next=items.map(i=>i.id===it.id?{...i,text:editText}:i);updItems(next);setEditingId(null);}}}
                          style={{flex:1,border:"none",background:"transparent",resize:"none",outline:"none",fontFamily:it.fontFamily||"Inter",fontSize:it.fontSize||16,fontWeight:it.fontBold?700:400,fontStyle:it.fontItalic?"italic":"normal",color:it.color||"#1E293B",lineHeight:1.4,width:"100%",minHeight:"100%"}}/>
                      :<div style={{fontFamily:it.fontFamily||"Inter",fontSize:it.fontSize||16,fontWeight:it.fontBold?700:400,fontStyle:it.fontItalic?"italic":"normal",color:it.color||"#1E293B",lineHeight:1.4,wordBreak:"break-word",whiteSpace:"pre-wrap",width:"100%"}}>{it.text||"Текст"}</div>
                    }
                  </div>
                )}

                {/* ── DOCUMENT / TABLE QUICK CARDS ── */}
                {(it.type==="doc"||it.type==="table")&&(
                  <div
                    onClick={e=>{e.stopPropagation();setDocPanelId(it.id);}}
                    style={{width:"100%",height:"100%",borderRadius:16,
                      background:it.type==="doc"?"linear-gradient(135deg,#EEF2FF,#FFFFFF)":"linear-gradient(135deg,#ECFDF5,#FFFFFF)",
                      border:"1px solid "+(it.type==="doc"?"#C7D2FE":"#A7F3D0"),
                      boxShadow:docPanelId===it.id?"0 0 0 2.5px #2563EB, 0 10px 26px rgba(15,23,42,.12)":"0 10px 26px rgba(15,23,42,.10)",
                      padding:16,display:"flex",alignItems:"center",gap:12,
                      boxSizing:"border-box" as const,cursor:"pointer",transition:"box-shadow 0.15s"}}
                    onMouseEnter={e=>{if(docPanelId!==it.id)(e.currentTarget as HTMLElement).style.boxShadow="0 14px 32px rgba(15,23,42,0.18)";}}
                    onMouseLeave={e=>{if(docPanelId!==it.id)(e.currentTarget as HTMLElement).style.boxShadow="0 10px 26px rgba(15,23,42,0.10)";}}>
                    <div style={{width:44,height:44,borderRadius:14,background:it.type==="doc"?"#4F46E5":"#10B981",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:23,flexShrink:0}}>{it.type==="doc"?"📄":"▦"}</div>
                    <div style={{minWidth:0,flex:1}}>
                      <div style={{fontSize:15,fontWeight:900,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.text||(it.type==="doc"?"Документ":"Таблица")}</div>
                      <div style={{fontSize:11,color:C.t2,marginTop:4}}>{it.type==="doc"?"Нажми чтобы редактировать":"Нажми чтобы открыть таблицу"}</div>
                    </div>
                    <div style={{fontSize:16,color:it.type==="doc"?"#4F46E5":"#10B981",opacity:0.5,flexShrink:0}}>→</div>
                  </div>
                )}

                {/* ── ICON ── */}
                {it.type==="icon"&&(
                  <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:6,boxSizing:"border-box"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:it.iconCategory==="emoji"?"100%":"auto",flex:it.iconCategory==="emoji"?1:undefined}}>
                      {renderBoardLibraryIcon({glyph:it.iconGlyph,label:it.iconLabel,category:it.iconCategory,style:it.iconStyle,defaultColor:it.color||"#111827"},it.color||undefined,Math.max(24,Math.round(Math.min(it.w,it.h)*(it.iconCategory==="emoji"?0.62:0.48))))}
                    </div>
                    {it.iconCategory!=="emoji"&&it.iconLabel&&it.h>82&&(
                      <div style={{fontSize:Math.max(9,Math.min(13,Math.round(it.w/8))),fontWeight:800,color:"#334155",textAlign:"center",lineHeight:1.15,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.iconLabel}</div>
                    )}
                  </div>
                )}

                {/* ── IMAGE ── */}
                {it.type==="image"&&it.imageUrl&&(
                  <div style={{width:"100%",height:"100%",borderRadius:10,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.12)"}}>
                    <img src={it.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"contain",display:"block",pointerEvents:"none",imageRendering:"auto"}}/>
                  </div>
                )}

                {/* ── DRAW ── */}
                {it.type==="draw"&&it.drawPath&&(
                  <svg width={it.w} height={it.h} viewBox={`0 0 ${it.w} ${it.h}`} style={{overflow:"visible",pointerEvents:"none"}}>
                    <path d={it.drawPath} fill="none" stroke={it.drawColor||"#2563EB"} strokeWidth={it.drawThickness||3} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}

                {/* ── LINK ── */}
                {it.type==="link"&&(
                  <a href={it.linkUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                    style={{width:"100%",height:"100%",borderRadius:12,background:"#fff",boxShadow:"0 3px 16px rgba(0,0,0,0.10)",display:"flex",alignItems:"center",gap:12,padding:"0 16px",textDecoration:"none",border:"1px solid #E2E8F0",overflow:"hidden"}}>
                    {it.linkFavicon&&<img src={it.linkFavicon} alt="" style={{width:20,height:20,flexShrink:0,borderRadius:4}}/>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.linkTitle||it.linkUrl}</div>
                      <div style={{fontSize:10,color:"#2563EB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{it.linkUrl}</div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}

                {/* ── EXTERNAL CARD ── */}
                {it.type==="external_card"&&(
                  <div style={{width:"100%",height:"100%",borderRadius:18,background:"#fff",border:"1px solid #E2E8F0",boxShadow:"0 12px 32px rgba(15,23,42,0.12)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
                    <div style={{height:6,background:`linear-gradient(90deg, ${it.color||"#7C3AED"}, #60A5FA)`}}/>
                    {it.imageUrl&&<div style={{height:54,position:"relative",background:"#F8FAFC",overflow:"hidden",flexShrink:0}}>
                      <img src={it.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg, rgba(15,23,42,0.02), rgba(15,23,42,0.18))"}}/>
                      <div style={{position:"absolute",right:8,bottom:8,width:28,height:28,borderRadius:10,background:"rgba(255,255,255,0.92)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 18px rgba(15,23,42,0.18)",overflow:"hidden"}}>
                        {it.externalSource==="content"?<PlatformIcon pid={it.externalPlatform||"other"} size={18}/>:<span style={{fontSize:15}}>👤</span>}
                      </div>
                    </div>}
                    <div style={{padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start",flex:1,minHeight:0}}>
                      <div style={{width:38,height:38,borderRadius:13,background:(it.color||"#7C3AED")+"18",border:"1px solid "+(it.color||"#7C3AED")+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,overflow:"hidden"}}>
                        {it.imageUrl&&it.externalSource==="crm"?<img src={it.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:it.externalSource==="content"?<PlatformIcon pid={it.externalPlatform||"other"} size={22}/>:<span>👤</span>}
                      </div>
                      <div style={{minWidth:0,flex:1}}>
                        <div style={{fontSize:12,fontWeight:900,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.externalTitle||it.text||"Карточка"}</div>
                        <div style={{fontSize:10,color:C.t2,marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.externalSubtitle||"Связанная карточка"}</div>
                        {it.externalMeta&&<div style={{fontSize:10,color:C.t2,marginTop:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.externalMeta}</div>}
                      </div>
                    </div>
                    <div style={{padding:"8px 12px",borderTop:"1px solid #F1F5F9",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                      <span style={{fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:.7,color:it.color||"#7C3AED",display:"flex",alignItems:"center",gap:5}}>
                        {it.externalSource==="content"&&<PlatformIcon pid={it.externalPlatform||"other"} size={13}/>}
                        {it.externalSource==="crm"?"CRM":"Контент"}
                      </span>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6,minWidth:0}}>
                        {it.externalStatus&&<span style={{fontSize:9,fontWeight:800,padding:"3px 7px",borderRadius:999,background:(it.color||"#7C3AED")+"12",color:it.color||"#7C3AED",maxWidth:92,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.externalStatus}</span>}
                        <button
                          onMouseDown={e=>e.stopPropagation()}
                          onClick={e=>{e.stopPropagation();setExpandedExternalItemId(it.id);}}
                          style={{padding:"4px 8px",border:"1px solid #E2E8F0",borderRadius:999,background:"#fff",color:it.color||"#7C3AED",fontSize:9,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(15,23,42,0.06)"}}>Раскрыть</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SHAPE ── */}
                {it.type==="shape"&&!isEdit&&renderShapeFill(it)}
                {it.type==="shape"&&isEdit&&(
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>
                    <textarea autoFocus value={editText} onChange={e=>setEditText(e.target.value)}
                      onBlur={()=>{const next=items.map(i=>i.id===it.id?{...i,text:editText,shapeText:editText}:i);updItems(next);setEditingId(null);}}
                      onKeyDown={e=>{if(e.key==="Escape"){const next=items.map(i=>i.id===it.id?{...i,text:editText,shapeText:editText}:i);updItems(next);setEditingId(null);}e.stopPropagation();}}
                      placeholder="Текст..."
                      style={{width:"80%",maxHeight:"70%",border:"none",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",borderRadius:8,resize:"none",outline:"none",fontFamily:it.fontFamily||"Inter",fontSize:it.fontSize||13,fontWeight:it.fontBold?800:600,fontStyle:it.fontItalic?"italic":"normal",color:"#fff",textAlign:"center",padding:"8px",lineHeight:1.4}}/>
                  </div>
                )}

                {/* Resize handle */}
                {isSel&&!isEdit&&it.type!=="draw"&&(
                  <div onMouseDown={e=>{e.stopPropagation();resizeState.current={id:it.id,startMx:e.clientX,startMy:e.clientY,startW:it.w,startH:it.h};}}
                    style={{position:"absolute",bottom:-5,right:-5,width:14,height:14,background:"#2563EB",borderRadius:3,cursor:"se-resize",zIndex:50,border:"2px solid #fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
                )}

                {/* Smart connector anchor points — show on hover/select */}
                {(isSel||hoverAnchor?.id===it.id)&&tool!=="draw"&&(
                  <>
                    {(["top","bottom","left","right"] as const).map(side=>{
                      const isTop=side==="top",isBot=side==="bottom",isLeft=side==="left";
                      const sx=isLeft?-6:side==="right"?it.w-8:it.w/2-6;
                      const sy=isTop?-6:isBot?it.h-8:it.h/2-6;
                      const isHov=hoverAnchor?.id===it.id&&hoverAnchor?.side===side;
                      return <div key={side}
                        onMouseEnter={()=>setHoverAnchor({id:it.id,side})}
                        onMouseLeave={()=>setHoverAnchor(null)}
                        onMouseDown={e=>{
                          e.stopPropagation();
                          const{x,y}=toCanvas(e.clientX,e.clientY);
                          setConnectorDrag({fromId:it.id,fromAnchor:side,mx:x,my:y});
                        }}
                        style={{
                          position:"absolute",left:sx,top:sy,
                          width:14,height:14,borderRadius:"50%",
                          background:isHov?"#2563EB":"#fff",
                          border:"2px solid #2563EB",
                          cursor:"crosshair",zIndex:60,
                          boxShadow:isHov?"0 0 8px rgba(37,99,235,0.5)":"0 1px 3px rgba(0,0,0,0.2)",
                          transition:"all 0.12s",
                        }}/>;
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Marquee selection rect */}
        {marqueeRect&&(marqueeRect.w>4||marqueeRect.h>4)&&(
          <div style={{
            position:"absolute",
            left:marqueeRect.x*zoom+pan.x,
            top:marqueeRect.y*zoom+pan.y,
            width:marqueeRect.w*zoom,
            height:marqueeRect.h*zoom,
            border:"1.5px dashed #2563EB",
            background:"rgba(37,99,235,0.06)",
            borderRadius:3,
            pointerEvents:"none",
            zIndex:9998,
          }}/>
        )}

        {/* Empty hint */}
        {normalizeBoardItems(items as any[]).length===0&&!loadingCanvas&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
            <div style={{fontSize:48,marginBottom:12}}>🎨</div>
            <div style={{fontSize:16,fontWeight:700,color:"#94A3B8",marginBottom:6}}>Доска пуста</div>
            <div style={{fontSize:13,color:"#CBD5E1",maxWidth:260,textAlign:"center",lineHeight:1.6}}>Выбери инструмент в панели сверху и кликни на холст</div>
          </div>
        )}
        {loadingCanvas&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:14,color:C.t2}}>Загрузка...</div>
          </div>
        )}
      </div>

      {/* Doc/Table side panel */}
      {(()=>{
        const docItem=docPanelId?normalizeBoardItems(items as any[]).find(i=>i.id===docPanelId):null;
        if(!docItem)return null;
        const isDoc=docItem.type==="doc";

        const exportPDF=()=>{
          const win=window.open("","_blank");
          if(!win)return;
          if(isDoc){
            const html=(docItem as any).docContent||"<p>Пустой документ</p>";
            win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docItem.text||"Документ"}</title>
            <style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#1a1a2e;line-height:1.7;font-size:15px;}
            h1{font-size:24px;font-weight:800;}h2{font-size:18px;font-weight:700;}
            @media print{body{margin:0;}}</style></head><body>
            <h1>${docItem.text||"Документ"}</h1>${html}
            <script>window.onload=function(){window.print()}<\/script></body></html>`);
          } else {
            const raw=(docItem as any).tableData;
            const rows:string[][]=raw?JSON.parse(raw):[];
            const tblHtml=rows.map((row,ri)=>`<tr>${row.map(c=>`<${ri===0?"th":"td"} style="border:1px solid #ddd;padding:8px 12px;${ri===0?"background:#f0fdf4;font-weight:700;":""}">${c||""}</${ri===0?"th":"td"}>`).join("")}</tr>`).join("");
            win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docItem.text||"Таблица"}</title>
            <style>body{font-family:Arial,sans-serif;margin:32px;color:#1a1a2e;}
            table{border-collapse:collapse;width:100%;font-size:13px;}
            @media print{body{margin:0;}}</style></head><body>
            <h1 style="font-size:20px;font-weight:800;margin-bottom:16px">${docItem.text||"Таблица"}</h1>
            <table>${tblHtml}</table>
            <script>window.onload=function(){window.print()}<\/script></body></html>`);
          }
          win.document.close();
        };

        const raw=(docItem as any).tableData;
        const tableRows:string[][]=raw?JSON.parse(raw):Array.from({length:5},()=>Array(4).fill(""));
        const saveTable=(nr:string[][])=>{
          const next=normalizeBoardItems(items as any[]).map(i=>i.id===docItem.id?{...i,tableData:JSON.stringify(nr)}:i);
          setItems(next);clearTimeout((window as any)._tblTimer);
          (window as any)._tblTimer=setTimeout(()=>triggerSave(next,lines),1500);
        };

        return <div style={{
          position:"absolute",top:48,right:0,bottom:0,
          width:Math.min(520,Math.round(window.innerWidth*0.42)),
          zIndex:95,background:"#fff",
          borderLeft:"1px solid #E2E8F0",
          boxShadow:"-20px 0 50px rgba(15,23,42,0.12)",
          display:"flex",flexDirection:"column",
        }}>
          {/* Header */}
          <div style={{padding:"12px 16px",borderBottom:"1px solid #E2E8F0",display:"flex",alignItems:"center",gap:10,background:"#FAFAFA",flexShrink:0}}>
            <div style={{width:32,height:32,borderRadius:9,background:isDoc?"#4F46E5":"#10B981",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
              {isDoc?"📄":"▦"}
            </div>
            <input value={docItem.text||""} onChange={e=>{
              const next=normalizeBoardItems(items as any[]).map(i=>i.id===docItem.id?{...i,text:e.target.value}:i);
              setItems(next);clearTimeout((window as any)._titleTimer);
              (window as any)._titleTimer=setTimeout(()=>triggerSave(next,lines),1500);
            }} style={{flex:1,border:"none",background:"transparent",fontSize:15,fontWeight:700,color:"#1E293B",outline:"none",fontFamily:"'Inter',sans-serif"}}
            placeholder={isDoc?"Название документа":"Название таблицы"}/>
            <button onClick={exportPDF} title="Скачать PDF"
              style={{padding:"5px 12px",background:"linear-gradient(135deg,#16A34A,#15803D)",color:"#fff",border:"none",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
              📄 PDF
            </button>
            <button onClick={()=>setDocPanelId(null)}
              style={{width:28,height:28,border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",color:"#64748B",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          </div>

          {/* Doc editor */}
          {isDoc&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"6px 12px",borderBottom:"1px solid #F1F5F9",display:"flex",gap:3,flexWrap:"wrap",background:"#FAFAFA",flexShrink:0}}>
              {([{c:"bold",l:"B",s:{fontWeight:900}},{c:"italic",l:"I",s:{fontStyle:"italic"}},{c:"underline",l:"U",s:{textDecoration:"underline"}}] as {c:string;l:string;s:any}[]).map(b=>(
                <button key={b.c} onMouseDown={e=>{e.preventDefault();document.execCommand(b.c);}}
                  style={{width:26,height:26,borderRadius:5,border:"1px solid #E2E8F0",background:"transparent",cursor:"pointer",fontSize:12,...b.s,color:"#1E293B"}}>{b.l}</button>
              ))}
              <div style={{width:1,height:20,background:"#E2E8F0",margin:"0 3px",alignSelf:"center"}}/>
              {["h1","h2","p"].map(t=>(
                <button key={t} onMouseDown={e=>{e.preventDefault();document.execCommand("formatBlock",false,t);}}
                  style={{padding:"3px 7px",borderRadius:5,border:"1px solid #E2E8F0",background:"transparent",cursor:"pointer",fontSize:10,fontWeight:600,color:"#64748B"}}>{t.toUpperCase()}</button>
              ))}
              <div style={{width:1,height:20,background:"#E2E8F0",margin:"0 3px",alignSelf:"center"}}/>
              <button onMouseDown={e=>{e.preventDefault();document.execCommand("insertUnorderedList");}}
                style={{padding:"3px 7px",borderRadius:5,border:"1px solid #E2E8F0",background:"transparent",cursor:"pointer",fontSize:10,color:"#64748B"}}>• Список</button>
              <button onMouseDown={e=>{e.preventDefault();document.execCommand("insertOrderedList");}}
                style={{padding:"3px 7px",borderRadius:5,border:"1px solid #E2E8F0",background:"transparent",cursor:"pointer",fontSize:10,color:"#64748B"}}>1. Нум.</button>
            </div>
            <div contentEditable suppressContentEditableWarning
              onInput={e=>{
                const h=(e.currentTarget as HTMLElement).innerHTML;
                const next=normalizeBoardItems(items as any[]).map(i=>i.id===docItem.id?{...i,docContent:h}:i);
                setItems(next);clearTimeout((window as any)._docTimer);
                (window as any)._docTimer=setTimeout(()=>triggerSave(next,lines),1500);
              }}
              dangerouslySetInnerHTML={{__html:(docItem as any).docContent||"<p>Начни писать здесь...</p>"}}
              style={{flex:1,padding:"20px 22px",outline:"none",fontSize:14,lineHeight:1.8,color:"#1E293B",overflowY:"auto",fontFamily:"'Inter',sans-serif"}}/>
          </div>}

          {/* Table editor */}
          {!isDoc&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"7px 14px",borderBottom:"1px solid #F1F5F9",display:"flex",gap:6,flexWrap:"wrap",background:"#FAFAFA",flexShrink:0}}>
              {[
                {l:"+ Строка",fn:()=>saveTable([...tableRows,Array(tableRows[0]?.length||4).fill("")]),color:"#10B981"},
                {l:"+ Столбец",fn:()=>saveTable(tableRows.map(r=>[...r,""])),color:"#10B981"},
                ...(tableRows.length>1?[{l:"− Строку",fn:()=>saveTable(tableRows.slice(0,-1)),color:"#EF4444"}]:[]),
                ...((tableRows[0]?.length||0)>1?[{l:"− Столбец",fn:()=>saveTable(tableRows.map(r=>r.slice(0,-1))),color:"#EF4444"}]:[]),
              ].map((btn,i)=>(
                <button key={i} onClick={btn.fn}
                  style={{padding:"4px 10px",borderRadius:6,border:"1px solid #E2E8F0",background:"#fff",cursor:"pointer",fontSize:11,fontWeight:600,color:btn.color}}>
                  {btn.l}
                </button>
              ))}
            </div>
            <div style={{flex:1,overflow:"auto",padding:12}}>
              <table style={{borderCollapse:"collapse",width:"100%",fontSize:13}}>
                <tbody>
                  {tableRows.map((row,ri)=>(
                    <tr key={ri}>
                      {row.map((cell,ci)=>(
                        <td key={ci} style={{border:"1px solid #E2E8F0",padding:0,background:ri===0?"#F0FDF4":"#fff",minWidth:80}}>
                          <input value={cell} onChange={e=>{
                            const nr=tableRows.map((r,r2)=>r2===ri?r.map((c,c2)=>c2===ci?e.target.value:c):r);
                            saveTable(nr);
                          }} style={{width:"100%",padding:"7px 9px",border:"none",background:"transparent",fontSize:12,fontFamily:"'Inter',sans-serif",fontWeight:ri===0?700:400,color:"#1E293B",outline:"none",boxSizing:"border-box" as const}}/>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>}
        </div>;
      })()}

      {externalDropHint&&(
        <div style={{position:"absolute",inset:0,top:48,zIndex:55,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{padding:"18px 26px",borderRadius:18,background:"rgba(124,58,237,0.92)",color:"#fff",fontSize:15,fontWeight:900,boxShadow:"0 18px 50px rgba(124,58,237,0.35)"}}>Отпусти карточку на доску</div>
        </div>
      )}

      {externalPanel&&(
        <div style={{position:"absolute",top:48,right:0,bottom:0,width:360,zIndex:90,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(14px)",borderLeft:"1px solid #E2E8F0",boxShadow:"-16px 0 40px rgba(15,23,42,0.10)",display:"flex",flexDirection:"column"}}>
          <div style={{padding:18,borderBottom:"1px solid #E2E8F0"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:14}}>
              <div>
                <div style={{fontSize:18,fontWeight:900,color:C.t1}}>Добавить карточку</div>
                <div style={{fontSize:12,color:C.t2,marginTop:3}}>Перетащи или нажми «Добавить»</div>
              </div>
              <button onClick={()=>setExternalPanel(false)} style={{width:32,height:32,borderRadius:10,border:"1px solid #E2E8F0",background:"#fff",cursor:"pointer",fontSize:16,color:C.t2}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {([{"id":"crm","label":"CRM"},{"id":"content","label":"Контент"}] as const).map(s=>(
                <button key={s.id} onClick={()=>{setExternalSource(s.id);setExternalSearch("");}}
                  style={{padding:"10px 12px",borderRadius:12,border:"1px solid "+(externalSource===s.id?"#7C3AED":"#E2E8F0"),background:externalSource===s.id?"linear-gradient(135deg,#F5F3FF,#EEF2FF)":"#fff",color:externalSource===s.id?"#6D28D9":C.t2,fontSize:12,fontWeight:900,cursor:"pointer"}}>{s.label}</button>
              ))}
            </div>
            {externalSource==="crm"&&(
              <select value={externalFunnelId} onChange={e=>setExternalFunnelId(e.target.value)} style={{width:"100%",padding:"10px 12px",border:"1px solid #E2E8F0",borderRadius:12,background:"#fff",fontSize:12,fontWeight:700,color:C.t1,outline:"none",marginBottom:10}}>
                <option value="all">Все воронки</option>
                {crmFunnels.data.map((f:any)=><option key={f.id} value={f.id}>{f.name||"Воронка"}</option>)}
              </select>
            )}
            <input value={externalSearch} onChange={e=>setExternalSearch(e.target.value)} placeholder={externalSource==="crm"?"Поиск лида...":"Поиск контента..."}
              style={{width:"100%",boxSizing:"border-box",padding:"11px 13px",border:"1px solid #E2E8F0",borderRadius:12,outline:"none",fontSize:13,background:"#F8FAFC",color:C.t1}}/>
          </div>
          <div style={{padding:14,overflowY:"auto",flex:1,display:"grid",gap:10,alignContent:"start"}}>
            {(externalSource==="crm"?crmLeads.loading:contentRows.loading)
              ?<div style={{padding:30,textAlign:"center",fontSize:13,color:C.t2}}>Загрузка карточек...</div>
              :externalCards.length===0
              ?<div style={{padding:30,textAlign:"center",fontSize:13,color:C.t2}}>Ничего не найдено</div>
              :externalCards.slice(0,80).map((card:any)=>(
                <div key={`${card.source}_${card.id}`} draggable
                  onDragStart={e=>{e.dataTransfer.setData("application/x-vizzy-card",JSON.stringify(card));e.dataTransfer.effectAllowed="copy";}}
                  style={{background:"#fff",border:"1px solid #E2E8F0",borderLeft:"4px solid "+card.color,borderRadius:14,padding:12,cursor:"grab",boxShadow:"0 4px 16px rgba(15,23,42,0.05)"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    <div style={{width:42,height:42,borderRadius:13,background:card.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,overflow:"hidden",border:"1px solid "+card.color+"22",position:"relative"}}>
                      {card.imageUrl?<img src={card.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:card.source==="content"?<PlatformIcon pid={card.platform||"other"} size={24}/>:<span>👤</span>}
                      {card.source==="content"&&card.imageUrl&&<div style={{position:"absolute",right:-1,bottom:-1,width:18,height:18,borderRadius:7,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(15,23,42,0.16)"}}><PlatformIcon pid={card.platform||"other"} size={13}/></div>}
                    </div>
                    <div style={{minWidth:0,flex:1}}>
                      <div style={{fontSize:13,fontWeight:900,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.title}</div>
                      <div style={{fontSize:11,color:C.t2,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.subtitle}</div>
                      {card.meta&&<div style={{fontSize:10,color:C.t2,marginTop:7,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.meta}</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:12}}>
                    <button onClick={()=>addExternalCardToBoard(card)} style={{flex:1,padding:"8px 10px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#7C3AED,#2563EB)",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer",boxShadow:"0 0 14px rgba(124,58,237,0.22)"}}>Добавить</button>
                    <button onClick={()=>alert(card.source==="crm"?"Открой раздел CRM для полной карточки лида":"Открой раздел Контент для полной карточки")} style={{padding:"8px 10px",border:"1px solid #E2E8F0",borderRadius:10,background:"#fff",color:C.t2,fontSize:11,fontWeight:800,cursor:"pointer"}}>Источник</button>
                  </div>
                </div>
              ))}
          </div>
          <div style={{padding:"12px 16px",borderTop:"1px solid #E2E8F0",fontSize:11,color:C.t2,lineHeight:1.5}}>Карточка на доске хранит связь с оригиналом: источник, ID, тип и отображаемые поля. Кнопка «Обновить» подтягивает свежие данные.</div>
        </div>
      )}

      {expandedExternalItem&&(<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.58)",zIndex:320,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}} onClick={()=>setExpandedExternalItemId(null)}>
        <div style={{width:"min(620px,100%)",maxHeight:"86vh",overflow:"hidden",background:"#fff",borderRadius:24,boxShadow:"0 28px 80px rgba(15,23,42,0.34)",border:"1px solid rgba(226,232,240,0.9)",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
          <div style={{height:8,background:`linear-gradient(90deg, ${expandedExternalItem.color||"#7C3AED"}, #60A5FA)`}}/>
          <div style={{padding:22,borderBottom:"1px solid #E2E8F0",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
            <div style={{display:"flex",gap:14,minWidth:0,alignItems:"center"}}>
              <div style={{width:58,height:58,borderRadius:18,background:(expandedExternalItem.color||"#7C3AED")+"16",border:"1px solid "+(expandedExternalItem.color||"#7C3AED")+"30",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                {expandedExternalImage?<img src={expandedExternalImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:expandedExternalItem.externalSource==="content"?<PlatformIcon pid={expandedExternalItem.externalPlatform||"other"} size={30}/>:<span style={{fontSize:24}}>👤</span>}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:.8,color:expandedExternalItem.color||"#7C3AED",marginBottom:5}}>{expandedExternalItem.externalSource==="crm"?"CRM-лид":"Контент-карточка"}</div>
                <div style={{fontSize:22,fontWeight:950,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{expandedExternalItem.externalTitle||expandedExternalItem.text||"Карточка"}</div>
                <div style={{fontSize:13,color:C.t2,marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{expandedExternalItem.externalSubtitle||"Связанная карточка"}</div>
              </div>
            </div>
            <button onClick={()=>setExpandedExternalItemId(null)} style={{width:34,height:34,borderRadius:12,border:"1px solid #E2E8F0",background:"#F8FAFC",cursor:"pointer",fontSize:18,color:C.t2,flexShrink:0}}>×</button>
          </div>
          <div style={{padding:22,overflowY:"auto",display:"grid",gap:12}}>
            {!expandedExternalRecord&&<div style={{padding:"12px 14px",borderRadius:14,background:"#FFFBEB",border:"1px solid #FDE68A",color:"#92400E",fontSize:12,lineHeight:1.5}}>Оригинальная запись не найдена или ещё не загружена. Ниже показаны данные, сохранённые в карточке на доске.</div>}
            {externalDetailRows.map(row=>{
              const value=normalizeDetailValue(row.value);
              const isLong=value.length>90;
              const isLink=/^https?:\/\//i.test(value)||value.startsWith("mailto:");
              return <div key={row.label} style={{display:"grid",gridTemplateColumns:"150px 1fr",gap:14,padding:"12px 14px",borderRadius:14,background:"#F8FAFC",border:"1px solid #E2E8F0"}}>
                <div style={{fontSize:11,fontWeight:900,color:C.t2,textTransform:"uppercase",letterSpacing:.5}}>{row.label}</div>
                {isLink?<a href={value} target="_blank" rel="noreferrer" style={{fontSize:13,fontWeight:700,color:expandedExternalItem.color||"#2563EB",wordBreak:"break-all"}}>{value}</a>:<div style={{fontSize:13,fontWeight:600,color:C.t1,lineHeight:1.55,whiteSpace:isLong?"pre-wrap":"normal",wordBreak:"break-word"}}>{value}</div>}
              </div>;
            })}
          </div>
          <div style={{padding:"14px 22px",borderTop:"1px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,background:"#F8FAFC"}}>
            <div style={{fontSize:11,color:C.t2}}>Данные подтягиваются из текущей CRM/Контент-таблицы по сохранённому ID.</div>
            <button onClick={()=>setExpandedExternalItemId(null)} style={{padding:"10px 16px",border:"none",borderRadius:12,background:"linear-gradient(135deg,#7C3AED,#2563EB)",color:"#fff",fontSize:12,fontWeight:900,cursor:"pointer"}}>Закрыть</button>
          </div>
        </div>
      </div>)}

      {/* ── Link modal ── */}
      {linkModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setLinkModal(false)}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:380}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:14}}>🔗 Добавить ссылку</div>
            <input autoFocus value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="https://example.com"
              onKeyDown={e=>{if(e.key==="Enter")fetchLink();if(e.key==="Escape")setLinkModal(false);}}
              style={iS()}/>
            <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"flex-end"}}>
              <Btn onClick={()=>setLinkModal(false)} primary={false}>Отмена</Btn>
              <Btn onClick={fetchLink} disabled={!linkUrl.trim()||linkLoading}>{linkLoading?"Загрузка...":"Добавить"}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Image file input */}
      <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/gif" style={{display:"none"}} onChange={onImageFile}/>

      {/* Status bar */}
      <div style={{position:"absolute",bottom:10,left:16,zIndex:50,background:"rgba(255,255,255,0.88)",backdropFilter:"blur(6px)",borderRadius:10,padding:"5px 12px",fontSize:10,color:C.t2,border:"1px solid rgba(0,0,0,0.06)",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
        V-выбор · H-пан · S-стикер · T-текст · I-фото · L-ссылка · F-фигура · C-линия · M-рисование · Иконки — в левой панели · Del-удалить · Ctrl+D-дублировать
      </div>
    </div>
  );
}

/* ============ OFFER POSITION PAGE ============ */
function OfferPage({userId}:{userId:string}){
  const{dark}=useTheme();
  const[activeOffer,setActiveOffer]=useState<any>(null);
  const[history,setHistory]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[mode,setMode]=useState<"view"|"choose"|"manual"|"paste"|"quiz"|"generating"|"result"|"history"|"editPos">("view");
  const[manualText,setManualText]=useState("");
  const[posText,setPosText]=useState("");
  const[quizStep,setQuizStep]=useState(0);
  const[quizAnswers,setQuizAnswers]=useState<string[]>(Array(8).fill(""));
  const[generatedOffer,setGeneratedOffer]=useState("");
  const[displayedOffer,setDisplayedOffer]=useState("");
  const[copied,setCopied]=useState(false);
  const[copiedPos,setCopiedPos]=useState(false);
  const[saving,setSaving]=useState(false);
  const[aiError,setAiError]=useState("");

  useEffect(()=>{if(userId)loadData();},[userId]);

  const loadData=async()=>{
    setLoading(true);
    const{data:curr}=await supabase.from("user_offers").select("*").eq("user_id",userId).eq("is_archived",false).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(curr)setActiveOffer(curr);
    const{data:hist}=await supabase.from("user_offers").select("*").eq("user_id",userId).eq("is_archived",true).order("created_at",{ascending:false}).limit(20);
    if(hist)setHistory(hist);
    setLoading(false);
  };

  const saveOffer=async(offerText:string,positioningText?:string)=>{
    setSaving(true);
    if(activeOffer)await supabase.from("user_offers").update({is_archived:true}).eq("id",activeOffer.id);
    const{data:newOffer}=await supabase.from("user_offers").insert({
      user_id:userId,offer_text:offerText,
      positioning_text:positioningText??activeOffer?.positioning_text??"",
      is_archived:false,
    }).select().single();
    if(newOffer){if(activeOffer)setHistory(prev=>[activeOffer,...prev]);setActiveOffer(newOffer);}
    setSaving(false);setMode("view");
  };

  const savePositioning=async(pt:string)=>{
    setSaving(true);
    if(activeOffer){
      await supabase.from("user_offers").update({positioning_text:pt}).eq("id",activeOffer.id);
      setActiveOffer({...activeOffer,positioning_text:pt});
    }else{
      const{data:n}=await supabase.from("user_offers").insert({user_id:userId,offer_text:"",positioning_text:pt,is_archived:false}).select().single();
      if(n)setActiveOffer(n);
    }
    setSaving(false);setMode("view");
  };

  const generateWithAI=async()=>{
    setMode("generating");setAiError("");
    const userPrompt=`Данные пользователя:\nЦелевой клиент: ${quizAnswers[0]}\nГлавная боль клиента: ${quizAnswers[1]}\nРезультат для клиента: ${quizAnswers[2]}\nСрок достижения результата: ${quizAnswers[3]}\nУникальный метод: ${quizAnswers[4]}\nГлавный страх клиента: ${quizAnswers[5]}\nГарантия: ${quizAnswers[6]}\nОграничение или дедлайн: ${quizAnswers[7]}\n\nСоставь сильный оффер на основе этих данных.`;
    try{
      const res=await fetch("https://api.deepseek.com/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`},
        body:JSON.stringify({
          model:"deepseek-chat",max_tokens:800,temperature:0.7,
          messages:[
            {role:"system",content:"Ты эксперт по маркетингу и формированию сильных офферов. Твоя задача — на основе ответов пользователя составить мощный, конкретный, продающий оффер для его бизнеса.\n\nПравила:\n- Оффер от первого лица или в формате ценностного предложения.\n- Никаких общих слов — только конкретика, цифры, сроки.\n- Структура: кто клиент, результат, срок, механизм, закрытие страха, гарантия.\n- Длина: 2-4 предложения. Максимально емко.\n- Язык: живой, без канцелярщины.\n- В конце короткая версия одним предложением.\n\nФормат: сначала полный оффер, затем с новой строки «Короткая версия:» и слоган."},
            {role:"user",content:userPrompt}
          ],
        }),
      });
      const data=await res.json();
      const text=data.choices?.[0]?.message?.content||"";
      if(!text){setAiError("ИИ не вернул ответ. Попробуй ещё раз.");setMode("quiz");return;}
      setGeneratedOffer(text);setDisplayedOffer(text);setMode("result");
    }catch(e){setAiError("Ошибка генерации. Проверь API ключ или попробуй ещё раз.");setMode("quiz");}
  };

  const QUESTIONS=[
    {q:"Кто твой клиент? Опиши максимально конкретно.",hint:"Не «предприниматели», а например «владельцы малого бизнеса с выручкой от 500к в месяц»",multi:true},
    {q:"Какую главную проблему или боль ты решаешь для этого клиента?",hint:"Что его реально беспокоит прямо сейчас",multi:true},
    {q:"Какой конкретный результат получает клиент после работы с тобой?",hint:"В цифрах, сроках, измеримых показателях",multi:true},
    {q:"За какой срок достигается этот результат?",hint:"Например: за 30 дней, за 3 месяца",multi:false},
    {q:"Через что именно ты достигаешь этого результата?",hint:"Твой уникальный метод, инструмент, система, подход",multi:true},
    {q:"Какой главный страх или барьер есть у клиента перед покупкой?",hint:"Что он боится или в чём сомневается",multi:true},
    {q:"Какие гарантии ты готов дать клиенту?",hint:"Если пока нет — напиши «нет»",multi:false},
    {q:"Есть ли ограничение по количеству клиентов или срок действия предложения?",hint:"Если да — укажи его",multi:false},
  ];

  const copyText=(text:string,setter:(v:boolean)=>void)=>{
    navigator.clipboard.writeText(text);setter(true);setTimeout(()=>setter(false),2000);
  };

  const BackBtn=({to}:{to:typeof mode})=>(
    <button onClick={()=>setMode(to)} style={{background:"none",border:"none",cursor:"pointer",color:C.t2,fontSize:13,marginBottom:28,display:"flex",alignItems:"center",gap:6,padding:0}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      Назад
    </button>
  );

  const CopyIcon=({done}:{done:boolean})=>done
    ?<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    :<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;

  const PrimaryBtn=({children,onClick,disabled,grad="blue"}:{children:React.ReactNode,onClick?:()=>void,disabled?:boolean,grad?:string})=>{
    const bg=grad==="purple"?"linear-gradient(135deg,#7C3AED,#A855F7)":"linear-gradient(135deg,#2563EB,#4F46E5)";
    return<button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"16px",borderRadius:14,border:"none",background:disabled?"rgba(255,255,255,0.06)":bg,color:disabled?C.t2:"#fff",fontSize:15,fontWeight:700,cursor:disabled?"not-allowed":"pointer",boxShadow:disabled?"none":"0 4px 20px rgba(37,99,235,0.3)",transition:"all 0.2s",opacity:disabled?0.7:1}}>{children}</button>;
  };

  const SecondaryBtn=({children,onClick}:{children:React.ReactNode,onClick?:()=>void})=>(
    <button onClick={onClick} style={{width:"100%",padding:"16px",borderRadius:14,border:`1.5px solid ${dark?"rgba(255,255,255,0.1)":C.bd}`,background:"transparent",color:C.t1,fontSize:15,fontWeight:600,cursor:"pointer"}}>{children}</button>
  );

  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",color:C.t2,fontSize:14}}>Загрузка...</div>;

  /* ── VIEW ── */
  if(mode==="view")return(
    <div style={{maxWidth:720,margin:"0 auto",padding:"32px 24px",display:"flex",flexDirection:"column",gap:20}}>
      <div style={{marginBottom:4}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:C.t2,textTransform:"uppercase",marginBottom:6}}>Vizzy App · Offer Position</div>
        <div style={{fontSize:24,fontWeight:900,color:C.t1}}>Штаб твоего позиционирования</div>
      </div>

      {/* Offer card */}
      <div style={{background:dark?"rgba(79,142,247,0.06)":"#fff",border:`1.5px solid ${dark?"rgba(79,142,247,0.22)":"#BFDBFE"}`,borderRadius:20,padding:28,boxShadow:dark?"0 0 40px rgba(79,142,247,0.08)":C.sh,position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#4F8EF7",textTransform:"uppercase"}}>YOUR OFFER</span>
          {activeOffer?.offer_text&&<button onClick={()=>copyText(activeOffer.offer_text,setCopied)} style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,color:copied?"#10B981":C.t2}}><CopyIcon done={copied}/></button>}
        </div>
        {activeOffer?.offer_text
          ?<div style={{fontSize:20,fontWeight:700,color:C.t1,lineHeight:1.6}}>{activeOffer.offer_text}</div>
          :<div style={{fontSize:16,color:C.t2,fontStyle:"italic",lineHeight:1.6}}>Твой оффер ещё не сформирован. Давай это исправим.</div>
        }
      </div>

      {/* Positioning card */}
      <div style={{background:dark?"rgba(168,85,247,0.05)":"#fff",border:`1.5px solid ${dark?"rgba(168,85,247,0.18)":"#EDE9FE"}`,borderRadius:20,padding:28,boxShadow:dark?"0 0 30px rgba(168,85,247,0.06)":C.sh,position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#A855F7",textTransform:"uppercase"}}>YOUR POSITIONING</span>
          {activeOffer?.positioning_text&&<button onClick={()=>copyText(activeOffer.positioning_text,setCopiedPos)} style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,color:copiedPos?"#10B981":C.t2}}><CopyIcon done={copiedPos}/></button>}
        </div>
        {activeOffer?.positioning_text
          ?<div style={{fontSize:16,fontWeight:500,color:C.t1,lineHeight:1.65}}>{activeOffer.positioning_text}</div>
          :<div style={{fontSize:15,color:C.t2,fontStyle:"italic",lineHeight:1.6}}>Позиционирование ещё не заполнено. Кто ты, для кого, чем отличаешься.</div>
        }
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <PrimaryBtn onClick={()=>setMode("choose")}>Редактировать оффер</PrimaryBtn>
        <SecondaryBtn onClick={()=>{setPosText(activeOffer?.positioning_text||"");setMode("editPos");}}>Редактировать позиционирование</SecondaryBtn>
      </div>

      {history.length>0&&<button onClick={()=>setMode("history")} style={{alignSelf:"center",background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.t2,textDecoration:"underline",padding:8}}>
        История офферов ({history.length})
      </button>}
    </div>
  );

  /* ── CHOOSE ── */
  if(mode==="choose")return(
    <div style={{maxWidth:720,margin:"0 auto",padding:"32px 24px"}}>
      <BackBtn to="view"/>
      <div style={{fontSize:22,fontWeight:800,color:C.t1,marginBottom:6}}>Как хочешь заполнить оффер?</div>
      <div style={{fontSize:14,color:C.t2,marginBottom:28}}>Выбери способ</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[
          {id:"manual",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,bg:"#DBEAFE",title:"Написать самостоятельно",sub:"Я знаю свой оффер. Просто введу его.",accent:false},
          {id:"paste",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,bg:"#F3F4F6",title:"Вставить готовый текст",sub:"У меня есть текст. Просто вставлю его.",accent:false},
          {id:"quiz",icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,bg:"linear-gradient(135deg,#2563EB,#4F46E5)",title:"Сформировать с ИИ",sub:"Составить оффер с помощью ИИ — ответь на 8 вопросов.",accent:true},
        ].map(opt=>(
          <button key={opt.id} onClick={()=>{
            if(opt.id==="manual"){setManualText(activeOffer?.offer_text||"");setMode("manual");}
            else if(opt.id==="paste"){setManualText("");setMode("paste");}
            else{setQuizStep(0);setQuizAnswers(Array(8).fill(""));setMode("quiz");}
          }} style={{
            padding:24,borderRadius:18,cursor:"pointer",textAlign:"left",
            display:"flex",gap:16,alignItems:"flex-start",
            background:opt.accent?(dark?"rgba(79,142,247,0.1)":"#EFF6FF"):(dark?"#0F1420":"#fff"),
            border:opt.accent?`1.5px solid rgba(79,142,247,0.3)`:`1px solid ${dark?"rgba(255,255,255,0.07)":C.bd}`,
            boxShadow:opt.accent?"0 4px 24px rgba(79,142,247,0.12)":C.sh,
          }}>
            <div style={{width:44,height:44,borderRadius:12,background:opt.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{opt.icon}</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:C.t1,marginBottom:4}}>{opt.title}</div>
              <div style={{fontSize:13,color:C.t2}}>{opt.sub}</div>
              {opt.id==="quiz"&&<div style={{fontSize:11,color:"#4F8EF7",fontWeight:700,marginTop:6}}>8 вопросов · ИИ составит оффер за тебя</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  /* ── MANUAL / PASTE ── */
  if(mode==="manual"||mode==="paste")return(
    <div style={{maxWidth:720,margin:"0 auto",padding:"32px 24px"}}>
      <BackBtn to="choose"/>
      <div style={{fontSize:22,fontWeight:800,color:C.t1,marginBottom:6}}>{mode==="manual"?"Введи свой оффер":"Вставь готовый текст"}</div>
      <div style={{fontSize:14,color:C.t2,marginBottom:24}}>{mode==="manual"?"Напиши текст оффера в поле ниже":"Скопируй и вставь свой оффер"}</div>
      <textarea value={manualText} onChange={e=>setManualText(e.target.value)} autoFocus
        placeholder={mode==="manual"?"Мы помогаем [кому] достичь [результат] за [срок] через [метод]...":"Вставь текст оффера сюда..."}
        style={{width:"100%",minHeight:180,padding:16,border:`1.5px solid ${dark?"rgba(79,142,247,0.25)":"#BFDBFE"}`,borderRadius:14,fontSize:16,background:dark?"#0F1420":C.ib,color:C.t1,outline:"none",resize:"vertical" as const,lineHeight:1.6,fontFamily:"'Inter',sans-serif",boxSizing:"border-box" as const}}/>
      <div style={{marginTop:14}}><PrimaryBtn onClick={()=>saveOffer(manualText.trim())} disabled={!manualText.trim()||saving}>{saving?"Сохраняем...":"Сохранить оффер"}</PrimaryBtn></div>
    </div>
  );

  /* ── EDIT POSITIONING ── */
  if(mode==="editPos")return(
    <div style={{maxWidth:720,margin:"0 auto",padding:"32px 24px"}}>
      <BackBtn to="view"/>
      <div style={{fontSize:22,fontWeight:800,color:C.t1,marginBottom:6}}>Твоё позиционирование</div>
      <div style={{fontSize:14,color:C.t2,marginBottom:24}}>Кто ты, для кого, чем отличаешься от других</div>
      <textarea value={posText} onChange={e=>setPosText(e.target.value)} autoFocus
        placeholder="Например: Я бизнес-стратег для онлайн-предпринимателей с доходом от 500к. Помогаю выйти из операционки. В отличие от коучей — работаю с цифрами и процессами."
        style={{width:"100%",minHeight:160,padding:16,border:`1.5px solid ${dark?"rgba(168,85,247,0.25)":"#DDD6FE"}`,borderRadius:14,fontSize:15,background:dark?"#0F1420":C.ib,color:C.t1,outline:"none",resize:"vertical" as const,lineHeight:1.6,fontFamily:"'Inter',sans-serif",boxSizing:"border-box" as const}}/>
      <div style={{marginTop:14}}><PrimaryBtn onClick={()=>savePositioning(posText.trim())} disabled={!posText.trim()||saving} grad="purple">{saving?"Сохраняем...":"Сохранить позиционирование"}</PrimaryBtn></div>
    </div>
  );

  /* ── QUIZ ── */
  if(mode==="quiz"){
    const q=QUESTIONS[quizStep];
    const answer=quizAnswers[quizStep];
    const canNext=answer.trim().length>0;
    const isLast=quizStep===7;
    const setAnswer=(v:string)=>{const a=[...quizAnswers];a[quizStep]=v;setQuizAnswers(a);};
    return(
      <div style={{maxWidth:640,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={()=>quizStep===0?setMode("choose"):setQuizStep(s=>s-1)} style={{background:"none",border:"none",cursor:"pointer",color:C.t2,fontSize:13,marginBottom:28,display:"flex",alignItems:"center",gap:6,padding:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {quizStep===0?"Назад к выбору":"Предыдущий вопрос"}
        </button>

        <div style={{marginBottom:32}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:11,color:C.t2,fontWeight:600}}>Вопрос {quizStep+1} из 8</span>
            <span style={{fontSize:11,color:"#4F8EF7",fontWeight:700}}>{Math.round(((quizStep+1)/8)*100)}%</span>
          </div>
          <div style={{height:4,background:dark?"rgba(255,255,255,0.06)":"#E5E7EB",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${((quizStep+1)/8)*100}%`,background:"linear-gradient(90deg,#2563EB,#4F46E5)",borderRadius:4,transition:"width 0.4s ease"}}/>
          </div>
          <div style={{display:"flex",gap:4,marginTop:10}}>
            {QUESTIONS.map((_,i)=>(
              <div key={i} style={{flex:1,height:3,borderRadius:3,background:i<quizStep?"#4F8EF7":i===quizStep?(dark?"rgba(79,142,247,0.4)":"#BFDBFE"):(dark?"rgba(255,255,255,0.05)":"#E5E7EB"),transition:"background 0.3s"}}/>
            ))}
          </div>
        </div>

        <div style={{fontSize:21,fontWeight:800,color:C.t1,lineHeight:1.45,marginBottom:8}}>{q.q}</div>
        {q.hint&&<div style={{fontSize:13,color:C.t2,marginBottom:22,lineHeight:1.5,fontStyle:"italic"}}>{q.hint}</div>}

        {q.multi
          ?<textarea value={answer} onChange={e=>setAnswer(e.target.value)} autoFocus placeholder="Твой ответ..."
              style={{width:"100%",minHeight:130,padding:16,border:`1.5px solid ${dark?"rgba(79,142,247,0.28)":"#BFDBFE"}`,borderRadius:14,fontSize:15,background:dark?"#0F1420":C.ib,color:C.t1,outline:"none",resize:"none" as const,lineHeight:1.6,fontFamily:"'Inter',sans-serif",boxSizing:"border-box" as const}}/>
          :<input value={answer} onChange={e=>setAnswer(e.target.value)} autoFocus placeholder="Твой ответ..."
              onKeyDown={e=>e.key==="Enter"&&canNext&&(isLast?generateWithAI():setQuizStep(s=>s+1))}
              style={{width:"100%",padding:16,border:`1.5px solid ${dark?"rgba(79,142,247,0.28)":"#BFDBFE"}`,borderRadius:14,fontSize:15,background:dark?"#0F1420":C.ib,color:C.t1,outline:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box" as const}}/>
        }

        {aiError&&<div style={{marginTop:12,padding:"10px 14px",borderRadius:10,background:"#FEF2F2",color:C.r,fontSize:13}}>{aiError}</div>}

        <div style={{marginTop:20}}>
          <PrimaryBtn disabled={!canNext} onClick={()=>isLast?generateWithAI():setQuizStep(s=>s+1)}>
            {isLast?"✨ Сформировать оффер":"Далее →"}
          </PrimaryBtn>
        </div>
      </div>
    );
  }

  /* ── GENERATING ── */
  if(mode==="generating")return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"65vh",gap:24}}>
      <div style={{width:88,height:88,borderRadius:24,background:"linear-gradient(135deg,#2563EB,#4F46E5)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 48px rgba(37,99,235,0.4)",animation:"pulse 1.5s ease-in-out infinite"}}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:20,fontWeight:800,color:C.t1,marginBottom:8}}>ИИ формирует твой оффер</div>
        <div style={{fontSize:14,color:C.t2}}>Обычно занимает 10–15 секунд...</div>
      </div>
    </div>
  );

  /* ── RESULT ── */
  if(mode==="result")return(
    <div style={{maxWidth:720,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#4F8EF7",textTransform:"uppercase",marginBottom:8}}>Готово ✨</div>
      <div style={{fontSize:22,fontWeight:900,color:C.t1,marginBottom:24}}>ИИ составил твой оффер</div>
      <div style={{background:dark?"rgba(79,142,247,0.06)":"#F0F7FF",border:`1.5px solid ${dark?"rgba(79,142,247,0.22)":"#BFDBFE"}`,borderRadius:20,padding:28,marginBottom:24,minHeight:120,boxShadow:"0 0 40px rgba(79,142,247,0.08)"}}>
        <div style={{fontSize:17,fontWeight:600,color:C.t1,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{displayedOffer}<span style={{opacity:displayedOffer.length<generatedOffer.length?1:0,animation:"pulse 0.8s infinite"}}>▌</span></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <PrimaryBtn onClick={()=>saveOffer(generatedOffer)} disabled={saving}>{saving?"Сохраняем...":"Сохранить оффер"}</PrimaryBtn>
        <SecondaryBtn onClick={()=>{setQuizStep(7);setMode("quiz");}}>Изменить ответы</SecondaryBtn>
        <button onClick={generateWithAI} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:"transparent",color:C.t2,fontSize:13,fontWeight:500,cursor:"pointer"}}>Переформулировать ещё раз</button>
      </div>
    </div>
  );

  /* ── HISTORY ── */
  if(mode==="history")return(
    <div style={{maxWidth:720,margin:"0 auto",padding:"32px 24px"}}>
      <BackBtn to="view"/>
      <div style={{fontSize:22,fontWeight:800,color:C.t1,marginBottom:20}}>История офферов</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {history.map((h:any)=>(
          <div key={h.id} style={{background:dark?"#0F1420":"#fff",border:`1px solid ${dark?"rgba(255,255,255,0.07)":C.bd}`,borderRadius:16,padding:20}}>
            <div style={{fontSize:11,color:C.t2,marginBottom:8,fontWeight:600}}>
              {new Date(h.created_at).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}
            </div>
            <div style={{fontSize:14,color:C.t1,lineHeight:1.6,marginBottom:12}}>{h.offer_text||"—"}</div>
            <button onClick={()=>saveOffer(h.offer_text,h.positioning_text)} style={{fontSize:12,color:"#4F8EF7",background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:700}}>
              Восстановить этот оффер →
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return null;
}

/* ============ PRICES & PRODUCTS PAGE ============ */
function PricesPage({userId,onNav}:{userId:string,onNav:(id:string)=>void}){
  const{dark}=useTheme();
  const[products,setProducts]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[mode,setMode]=useState<"list"|"add"|"detail">("list");
  const[selected,setSelected]=useState<any>(null);

  // Form state
  const[form,setForm]=useState({name:"",description:"",targetAudience:"",logoUrl:""});
  const[prices,setPrices]=useState<{name:string,price:string}[]>([{name:"",price:""}]);
  const[pains,setPains]=useState<string[]>([""]); 
  const[offer,setOffer]=useState("");
  const[marketing,setMarketing]=useState("");
  const[funnel,setFunnel]=useState("");
  const[genLoading,setGenLoading]=useState<{offer:boolean,marketing:boolean,funnel:boolean}>({offer:false,marketing:false,funnel:false});
  const[displayOffer,setDisplayOffer]=useState("");
  const[displayMkt,setDisplayMkt]=useState("");
  const[displayFunnel,setDisplayFunnel]=useState("");
  const[saving,setSaving]=useState(false);
  const[formErr,setFormErr]=useState("");
  const[logoLoading,setLogoLoading]=useState(false);
  const logoRef=useRef<HTMLInputElement>(null);

  // Detail inline edit
  const[editField,setEditField]=useState<string|null>(null);
  const[editVal,setEditVal]=useState("");
  const[detailPrices,setDetailPrices]=useState<any[]>([]);
  const[detailPains,setDetailPains]=useState<string[]>([]);

  useEffect(()=>{if(userId)loadProducts();},[userId]);

  const loadProducts=async()=>{
    setLoading(true);
    const{data}=await supabase.from("user_products").select("*").eq("user_id",userId).order("created_at",{ascending:false});
    setProducts(data||[]);
    setLoading(false);
  };

  const resetForm=()=>{
    setForm({name:"",description:"",targetAudience:"",logoUrl:""});
    setPrices([{name:"",price:""}]);
    setPains([""]);
    setOffer("");setMarketing("");setFunnel("");
    setDisplayOffer("");setDisplayMkt("");setDisplayFunnel("");
    setFormErr("");
  };

  const typewrite=(text:string,setter:(v:string)=>void)=>{
    setter(text);
  };

  const callAI=async(type:"offer"|"marketing"|"funnel")=>{
    if(!form.name.trim()||!form.description.trim()){setFormErr("Заполни название и описание продукта перед генерацией.");return;}
    setFormErr("");
    setGenLoading(p=>({...p,[type]:true}));
    const systemPrompts={
      offer:"Ты эксперт по маркетингу и продажам. Составь сильный продающий оффер для продукта. Конкретно, без общих слов, фокус на результат. 2-4 предложения + короткая версия одним предложением.",
      marketing:"Ты эксперт по маркетингу. Разработай маркетинговую систему для продукта: каналы трафика, контентная стратегия, прогрев аудитории, механики конверсии. Структурировано и конкретно.",
      funnel:"Ты эксперт по воронкам продаж. Разработай пошаговую воронку: от первого касания до повторной продажи. На каждом этапе: что происходит, инструмент, цель. Структурировано.",
    };
    const userPrompt=`Название продукта: ${form.name}\nОписание: ${form.description}\nЦелевая аудитория: ${form.targetAudience}\nГлавные боли: ${pains.filter(Boolean).join(", ")}\nЦена: ${prices.map(p=>p.name?`${p.name} — ${p.price}`:p.price).filter(Boolean).join(", ")}\n\n${type==="offer"?"Составь сильный оффер.":type==="marketing"?"Разработай маркетинговую систему.":"Разработай воронку продаж."}`;
    try{
      const res=await fetch("https://api.deepseek.com/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`},
        body:JSON.stringify({model:"deepseek-chat",max_tokens:1000,temperature:0.7,messages:[{role:"system",content:systemPrompts[type]},{role:"user",content:userPrompt}]}),
      });
      const data=await res.json();
      const text=data.choices?.[0]?.message?.content||"";
      if(type==="offer"){setOffer(text);typewrite(text,setDisplayOffer);}
      else if(type==="marketing"){setMarketing(text);typewrite(text,setDisplayMkt);}
      else{setFunnel(text);typewrite(text,setDisplayFunnel);}
    }catch(e){setFormErr("Ошибка генерации. Попробуй ещё раз.");}
    setGenLoading(p=>({...p,[type]:false}));
  };

  const uploadLogo=async(file:File)=>{
    setLogoLoading(true);
    const ext=file.name.split(".").pop();
    const path=`products/${userId}/${Date.now()}.${ext}`;
    const{error}=await supabase.storage.from("avatars").upload(path,file,{upsert:true});
    if(!error){
      const{data:urlData}=supabase.storage.from("avatars").getPublicUrl(path);
      setForm(f=>({...f,logoUrl:urlData.publicUrl}));
    }
    setLogoLoading(false);
  };

  const saveProduct=async()=>{
    if(!form.name.trim()){setFormErr("Введи название продукта.");return;}
    setSaving(true);
    const{data:p}=await supabase.from("user_products").insert({
      user_id:userId,
      name:form.name,description:form.description,
      logo_url:form.logoUrl,
      target_audience:form.targetAudience,
      prices:prices.filter(p=>p.price),
      pains:pains.filter(Boolean),
      offer_text:offer,marketing_system:marketing,sales_funnel:funnel,
      is_archived:false,
    }).select().single();
    if(p){setProducts(prev=>[p,...prev]);setSelected(p);setMode("detail");resetForm();}
    setSaving(false);
  };

  const saveDetailField=async(field:string,value:any)=>{
    await supabase.from("user_products").update({[field]:value}).eq("id",selected.id);
    const updated={...selected,[field]:value};
    setSelected(updated);
    setProducts(prev=>prev.map(p=>p.id===selected.id?updated:p));
    setEditField(null);
  };

  const archiveProduct=async(id:string)=>{
    await supabase.from("user_products").update({is_archived:true}).eq("id",id);
    setProducts(prev=>prev.map(p=>p.id===id?{...p,is_archived:true}:p));
    if(selected?.id===id)setMode("list");
  };

  const C2=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
  const PencilI=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

  const SectionLabel=({children,color="#4F8EF7"}:{children:React.ReactNode,color?:string})=>(
    <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color,textTransform:"uppercase" as const,marginBottom:10}}>{children}</div>
  );

  const GenBtn=({type,label,icon}:{type:"offer"|"marketing"|"funnel",label:string,icon:React.ReactNode})=>{
    const loading=genLoading[type];
    const done=type==="offer"?!!offer:type==="marketing"?!!marketing:!!funnel;
    return(
      <button onClick={()=>callAI(type)} disabled={loading}
        style={{flex:1,padding:"13px 10px",borderRadius:12,border:`1.5px solid ${dark?"rgba(79,142,247,0.3)":"#BFDBFE"}`,
          background:loading?(dark?"rgba(79,142,247,0.08)":"#EFF6FF"):(done?(dark?"rgba(16,185,129,0.08)":"#F0FDF4"):(dark?"rgba(79,142,247,0.06)":"#F8FAFF")),
          color:done?"#10B981":C.a,cursor:loading?"not-allowed":"pointer",
          display:"flex",flexDirection:"column" as const,alignItems:"center",gap:6,fontSize:12,fontWeight:700,transition:"all 0.2s"}}>
        <div style={{fontSize:18}}>{loading?"⏳":done?"✅":icon}</div>
        {loading?"Генерирую...":done?"Перегенерировать":label}
      </button>
    );
  };

  const GenField=({label,display,full,field}:{label:string,display:string,full:string,field:"offer"|"marketing"|"funnel"})=>{
    const setter=field==="offer"?setOffer:field==="marketing"?setMarketing:setFunnel;
    const[copied,setCopied]=useState(false);
    if(!full&&!display)return(
      <div style={{padding:16,borderRadius:12,border:`1px dashed ${dark?"rgba(255,255,255,0.08)":C.bd}`,color:C.t2,fontSize:13,textAlign:"center" as const}}>
        Нажми кнопку выше чтобы сгенерировать
      </div>
    );
    return(
      <div style={{marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,fontWeight:700,color:C.t2,textTransform:"uppercase" as const,letterSpacing:1}}>{label}</span>
          <button onClick={()=>{navigator.clipboard.writeText(full);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
            style={{background:"none",border:"none",cursor:"pointer",color:copied?"#10B981":C.t2,fontSize:11,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>
            <C2/>{copied?"Скопировано":"Копировать"}
          </button>
        </div>
        <textarea value={full} onChange={e=>setter(e.target.value)}
          style={{width:"100%",minHeight:110,padding:14,border:`1.5px solid ${dark?"rgba(79,142,247,0.2)":"#DBEAFE"}`,borderRadius:12,fontSize:14,background:dark?"#0A0F1A":C.ib,color:C.t1,outline:"none",resize:"vertical" as const,lineHeight:1.65,fontFamily:"'Inter',sans-serif",boxSizing:"border-box" as const}}/>
      </div>
    );
  };

  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",color:C.t2,fontSize:14}}>Загрузка...</div>;

  /* ── EMPTY STATE ── */
  const active=products.filter(p=>!p.is_archived);
  if(mode==="list"&&active.length===0)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"calc(100vh - 120px)",gap:20,padding:24}}>
      <div style={{width:88,height:88,borderRadius:24,background:dark?"rgba(245,158,11,0.1)":"#FFFBEB",display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px solid ${dark?"rgba(245,158,11,0.25)":"#FDE68A"}`}}>
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:24,fontWeight:900,color:C.t1,marginBottom:8}}>Products & Prices</div>
        <div style={{fontSize:15,color:C.t2,maxWidth:380,lineHeight:1.6}}>Добавь свои продукты и услуги. Храни офферы, цены и маркетинговые системы в одном месте.</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:380}}>
        <button onClick={()=>{resetForm();setMode("add");}}
          style={{padding:"16px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#D97706,#F59E0B)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 4px 20px rgba(245,158,11,0.3)"}}>
          <PencilI/>Добавить продукт вручную
        </button>
        <button onClick={()=>onNav("product")}
          style={{padding:"16px",borderRadius:14,border:`1.5px solid ${dark?"rgba(52,211,153,0.3)":"#A7F3D0"}`,background:dark?"rgba(52,211,153,0.06)":"#F0FDF4",color:"#34D399",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Создать продукт с ИИ
        </button>
      </div>
    </div>
  );

  /* ── PRODUCT LIST ── */
  if(mode==="list")return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:C.t2,textTransform:"uppercase",marginBottom:4}}>Vizzy App</div>
          <div style={{fontSize:24,fontWeight:900,color:C.t1}}>Products & Prices</div>
        </div>
        <button onClick={()=>{resetForm();setMode("add");}}
          style={{padding:"11px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#D97706,#F59E0B)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(245,158,11,0.3)"}}>
          <span style={{fontSize:18}}>+</span>Добавить продукт
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
        {active.map((p:any)=>(
          <button key={p.id} onClick={()=>{setSelected(p);setDetailPrices(p.prices||[]);setDetailPains(p.pains||[]);setMode("detail");}}
            style={{background:dark?"#0F1420":"#fff",border:`1px solid ${dark?"rgba(255,255,255,0.07)":C.bd}`,borderRadius:18,padding:20,cursor:"pointer",textAlign:"left",boxShadow:C.sh,transition:"all 0.2s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLElement).style.boxShadow="0 8px 32px rgba(0,0,0,0.12)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(0)";(e.currentTarget as HTMLElement).style.boxShadow=C.sh;}}>
            <div style={{width:52,height:52,borderRadius:14,background:dark?"rgba(245,158,11,0.1)":"#FFFBEB",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,overflow:"hidden",border:`1px solid ${dark?"rgba(245,158,11,0.2)":"#FDE68A"}`}}>
              {p.logo_url?<img src={p.logo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
            </div>
            <div style={{fontSize:16,fontWeight:800,color:C.t1,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
            <div style={{fontSize:13,color:C.t2,lineHeight:1.5,marginBottom:12,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any}}>{p.description}</div>
            {p.prices?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {p.prices.slice(0,2).map((pr:any,i:number)=>(
                <span key={i} style={{fontSize:12,fontWeight:700,color:"#F59E0B",background:dark?"rgba(245,158,11,0.1)":"#FFFBEB",padding:"4px 10px",borderRadius:8,border:"1px solid rgba(245,158,11,0.2)"}}>{pr.name?`${pr.name}: `:""}{pr.price}</span>
              ))}
              {p.prices.length>2&&<span style={{fontSize:12,color:C.t2}}>+{p.prices.length-2}</span>}
            </div>}
          </button>
        ))}
      </div>
      {products.filter((p:any)=>p.is_archived).length>0&&(
        <div style={{marginTop:32,paddingTop:24,borderTop:`1px solid ${dark?"rgba(255,255,255,0.06)":C.bd}`}}>
          <div style={{fontSize:11,color:C.t2,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Архив</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
            {products.filter((p:any)=>p.is_archived).map((p:any)=>(
              <div key={p.id} style={{background:dark?"#080C14":"#F8FAFC",border:`1px solid ${dark?"rgba(255,255,255,0.04)":C.bd}`,borderRadius:16,padding:16,opacity:0.6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontSize:14,fontWeight:600,color:C.t2}}>{p.name}</div>
                <button onClick={async()=>{await supabase.from("user_products").update({is_archived:false}).eq("id",p.id);loadProducts();}}
                  style={{fontSize:11,color:C.a,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>Восстановить</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ── ADD FORM ── */
  if(mode==="add")return(
    <div style={{maxWidth:760,margin:"0 auto",padding:"32px 24px"}}>
      <button onClick={()=>setMode("list")} style={{background:"none",border:"none",cursor:"pointer",color:C.t2,fontSize:13,marginBottom:24,display:"flex",alignItems:"center",gap:6,padding:0}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Назад
      </button>
      <div style={{fontSize:22,fontWeight:900,color:C.t1,marginBottom:28}}>Новый продукт</div>

      {/* Section 1 */}
      <div style={{background:dark?"#0F1420":"#fff",borderRadius:20,padding:24,marginBottom:16,border:`1px solid ${dark?"rgba(255,255,255,0.06)":C.bd}`,boxShadow:C.sh}}>
        <SectionLabel color="#F59E0B">Основная информация</SectionLabel>

        {/* Logo upload */}
        <div style={{marginBottom:20}}>
          <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadLogo(e.target.files[0]);}}/>
          <button onClick={()=>logoRef.current?.click()}
            style={{width:80,height:80,borderRadius:16,border:`2px dashed ${dark?"rgba(245,158,11,0.3)":"#FDE68A"}`,background:dark?"rgba(245,158,11,0.06)":"#FFFBEB",cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {form.logoUrl?<img src={form.logoUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:logoLoading?<div style={{fontSize:11,color:C.t2}}>...</div>:<div style={{textAlign:"center"}}><div style={{fontSize:22}}>📦</div><div style={{fontSize:9,color:C.t2,marginTop:2}}>Логотип</div></div>}
          </button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Название продукта *" style={iS()}/>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Описание продукта — что включает, как работает, что получает клиент *" rows={3} style={{...iS(),resize:"vertical" as const,minHeight:90}}/>
        </div>

        {/* Prices */}
        <div style={{marginTop:16}}>
          <div style={{fontSize:12,fontWeight:700,color:C.t2,marginBottom:8}}>Ценовые тарифы</div>
          {prices.map((pr,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
              <input value={pr.name} onChange={e=>{const p=[...prices];p[i]={...p[i],name:e.target.value};setPrices(p);}} placeholder="Название тарифа (необязательно)" style={{...iS(),flex:1,padding:"9px 12px"}}/>
              <input value={pr.price} onChange={e=>{const p=[...prices];p[i]={...p[i],price:e.target.value};setPrices(p);}} placeholder="Цена" style={{...iS(),width:140,padding:"9px 12px"}}/>
              {prices.length>1&&<button onClick={()=>setPrices(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:C.r,fontSize:18,padding:"0 4px"}}>×</button>}
            </div>
          ))}
          {prices.length<6&&<button onClick={()=>setPrices(p=>[...p,{name:"",price:""}])} style={{fontSize:12,color:C.a,background:"none",border:"none",cursor:"pointer",fontWeight:700,padding:0}}>+ Добавить тариф</button>}
        </div>
      </div>

      {/* Section 2 */}
      <div style={{background:dark?"#0F1420":"#fff",borderRadius:20,padding:24,marginBottom:16,border:`1px solid ${dark?"rgba(255,255,255,0.06)":C.bd}`,boxShadow:C.sh}}>
        <SectionLabel color="#A855F7">Целевая аудитория и боли</SectionLabel>
        <textarea value={form.targetAudience} onChange={e=>setForm(f=>({...f,targetAudience:e.target.value}))} placeholder="Кто твой идеальный клиент для этого продукта? Опиши конкретно." rows={2} style={{...iS(),resize:"vertical" as const,minHeight:70,marginBottom:14}}/>
        <div style={{fontSize:12,fontWeight:700,color:C.t2,marginBottom:8}}>Главные боли аудитории</div>
        {pains.map((pain,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
            <input value={pain} onChange={e=>{const p=[...pains];p[i]=e.target.value;setPains(p);}} placeholder={i===0?"Например: Нет стабильного потока клиентов":"Ещё одна боль..."} style={{...iS(),flex:1,padding:"9px 12px"}}/>
            {pains.length>1&&<button onClick={()=>setPains(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:C.r,fontSize:18,padding:"0 4px"}}>×</button>}
          </div>
        ))}
        {pains.length<10&&<button onClick={()=>setPains(p=>[...p,""])} style={{fontSize:12,color:C.a,background:"none",border:"none",cursor:"pointer",fontWeight:700,padding:0}}>+ Добавить боль</button>}
      </div>

      {/* Section 3 — AI Generation */}
      <div style={{background:dark?"rgba(79,142,247,0.05)":"#F8FAFF",borderRadius:20,padding:24,marginBottom:16,border:`1.5px solid ${dark?"rgba(79,142,247,0.15)":"#DBEAFE"}`,boxShadow:"0 4px 24px rgba(79,142,247,0.06)"}}>
        <SectionLabel color="#4F8EF7">Сгенерировать с ИИ</SectionLabel>
        <div style={{fontSize:13,color:C.t2,marginBottom:16}}>Заполни поля выше и нажми нужную кнопку. ИИ сделает остальное.</div>
        {formErr&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FEF2F2",color:C.r,fontSize:13,marginBottom:14}}>{formErr}</div>}
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          <GenBtn type="offer" label="Оффер" icon="⚡"/>
          <GenBtn type="marketing" label="Маркетинг" icon="📊"/>
          <GenBtn type="funnel" label="Воронка" icon="🔽"/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <GenField label="Offer" display={displayOffer} full={offer} field="offer"/>
          <GenField label="Marketing System" display={displayMkt} full={marketing} field="marketing"/>
          <GenField label="Sales Funnel" display={displayFunnel} full={funnel} field="funnel"/>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <button onClick={saveProduct} disabled={saving||!form.name.trim()}
          style={{width:"100%",padding:"16px",borderRadius:14,border:"none",background:form.name.trim()?"linear-gradient(135deg,#D97706,#F59E0B)":"rgba(255,255,255,0.06)",color:form.name.trim()?"#fff":C.t2,fontSize:15,fontWeight:700,cursor:form.name.trim()?"pointer":"not-allowed",boxShadow:form.name.trim()?"0 4px 20px rgba(245,158,11,0.3)":"none"}}>
          {saving?"Сохраняем...":"Сохранить продукт"}
        </button>
        <button onClick={()=>setMode("list")} style={{width:"100%",padding:"14px",borderRadius:14,border:`1px solid ${dark?"rgba(255,255,255,0.08)":C.bd}`,background:"transparent",color:C.t2,fontSize:14,fontWeight:500,cursor:"pointer"}}>Отмена</button>
      </div>
    </div>
  );

  /* ── PRODUCT DETAIL ── */
  if(mode==="detail"&&selected){
    const s=selected;
    const InlineEdit=({field,value,multiline,label,color="#4F8EF7"}:{field:string,value:string,multiline?:boolean,label:string,color?:string})=>{
      const isEditing=editField===field;
      return(
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:2,color,textTransform:"uppercase" as const}}>{label}</span>
            <button onClick={()=>{setEditField(isEditing?null:field);setEditVal(value||"");}}
              style={{background:"none",border:"none",cursor:"pointer",color:isEditing?C.a:C.t2,padding:4}}>
              <PencilI/>
            </button>
            {isEditing&&<button onClick={()=>saveDetailField(field,editVal)} style={{fontSize:11,color:"#10B981",background:"none",border:"none",cursor:"pointer",fontWeight:700}}>Сохранить</button>}
          </div>
          {isEditing
            ?multiline
              ?<textarea value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus rows={4} style={{...iS(),resize:"vertical" as const,minHeight:100}}/>
              :<input value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus style={iS()}/>
            :<div style={{fontSize:15,color:value?C.t1:C.t2,lineHeight:1.65,fontStyle:value?"normal":"italic"}}>{value||"Не заполнено"}</div>
          }
        </div>
      );
    };

    return(
      <div style={{maxWidth:760,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={()=>setMode("list")} style={{background:"none",border:"none",cursor:"pointer",color:C.t2,fontSize:13,marginBottom:24,display:"flex",alignItems:"center",gap:6,padding:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Все продукты
        </button>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
          <div style={{width:64,height:64,borderRadius:18,background:dark?"rgba(245,158,11,0.1)":"#FFFBEB",display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px solid ${dark?"rgba(245,158,11,0.2)":"#FDE68A"}`,overflow:"hidden",flexShrink:0}}>
            {s.logo_url?<img src={s.logo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:24,fontWeight:900,color:C.t1,marginBottom:4}}>{s.name}</div>
            <div style={{fontSize:13,color:C.t2}}>{new Date(s.created_at).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
          <button onClick={()=>archiveProduct(s.id)} style={{fontSize:11,color:C.t2,background:"none",border:`1px solid ${dark?"rgba(255,255,255,0.08)":C.bd}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:600,flexShrink:0}}>Архивировать</button>
        </div>

        {/* Prices */}
        {(s.prices?.length>0)&&(
          <div style={{marginBottom:24}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#F59E0B",textTransform:"uppercase",marginBottom:10}}>Тарифы</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              {s.prices.map((pr:any,i:number)=>(
                <div key={i} style={{padding:"12px 18px",borderRadius:12,background:dark?"rgba(245,158,11,0.08)":"#FFFBEB",border:`1.5px solid ${dark?"rgba(245,158,11,0.2)":"#FDE68A"}`}}>
                  {pr.name&&<div style={{fontSize:11,color:"#D97706",fontWeight:700,marginBottom:2}}>{pr.name}</div>}
                  <div style={{fontSize:18,fontWeight:900,color:"#F59E0B"}}>{pr.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{background:dark?"#0F1420":"#fff",borderRadius:20,padding:24,border:`1px solid ${dark?"rgba(255,255,255,0.06)":C.bd}`,boxShadow:C.sh,marginBottom:16}}>
          <InlineEdit field="description" value={s.description} multiline label="Описание" color="#4F8EF7"/>
          <InlineEdit field="target_audience" value={s.target_audience} multiline label="Целевая аудитория" color="#A855F7"/>
          {s.pains?.length>0&&(
            <div style={{marginBottom:24}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#EC4899",textTransform:"uppercase",marginBottom:10}}>Боли аудитории</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {s.pains.map((pain:string,i:number)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:dark?"rgba(236,72,153,0.06)":"#FFF1F8",border:`1px solid ${dark?"rgba(236,72,153,0.15)":"#FCE7F3"}`}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#EC4899",flexShrink:0}}/>
                    <span style={{fontSize:13,color:C.t1}}>{pain}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{background:dark?"rgba(79,142,247,0.05)":"#F8FAFF",borderRadius:20,padding:24,border:`1.5px solid ${dark?"rgba(79,142,247,0.12)":"#DBEAFE"}`,boxShadow:"0 4px 24px rgba(79,142,247,0.05)"}}>
          <InlineEdit field="offer_text" value={s.offer_text} multiline label="Offer" color="#4F8EF7"/>
          <InlineEdit field="marketing_system" value={s.marketing_system} multiline label="Marketing System" color="#34D399"/>
          <InlineEdit field="sales_funnel" value={s.sales_funnel} multiline label="Sales Funnel" color="#F59E0B"/>
        </div>
      </div>
    );
  }

  return null;
}

/* ============ FORMS PAGE ============ */
type Question={id:string,type:string,label:string,required:boolean,options:string[]};
type FormData={id:string,user_id:string,title:string,description:string,slug:string,questions:Question[],completion_title:string,completion_subtitle:string,completion_url:string,completion_btn_label:string,accent_color:string,is_active:boolean,created_at:string};

function FormsPage({userId}:{userId:string}){
  const{dark}=useTheme();
  const[tab,setTab]=useState<"list"|"builder"|"analytics">("list");
  const[forms,setForms]=useState<FormData[]>([]);
  const[loading,setLoading]=useState(true);
  const[selectedForm,setSelectedForm]=useState<FormData|null>(null);
  const[responses,setResponses]=useState<any[]>([]);
  const[views,setViews]=useState(0);
  const[clicks,setClicks]=useState(0);
  const[saving,setSaving]=useState(false);
  const[copied,setCopied]=useState<string|null>(null);

  // Builder state
  const[builderStep,setBuilderStep]=useState<1|2|3>(1);
  const[editId,setEditId]=useState<string|null>(null);
  const[bTitle,setBTitle]=useState("");
  const[bDesc,setBDesc]=useState("");
  const[bAccent,setBAccent]=useState("#10B981");
  const[bQuestions,setBQuestions]=useState<Question[]>([]);
  const[bCompTitle,setBCompTitle]=useState("Спасибо за ответы!");
  const[bCompSub,setBCompSub]=useState("");
  const[bCompUrl,setBCompUrl]=useState("");
  const[bCompBtn,setBCompBtn]=useState("Перейти");

  useEffect(()=>{if(userId)loadForms();},[userId]);

  const loadForms=async()=>{
    setLoading(true);
    const{data}=await supabase.from("forms").select("*").eq("user_id",userId).order("created_at",{ascending:false});
    setForms((data||[]) as FormData[]);
    setLoading(false);
  };

  const loadAnalytics=async(form:FormData)=>{
    setSelectedForm(form);
    const[{data:resp},{data:vw},{data:cl}]=await Promise.all([
      supabase.from("form_responses").select("*").eq("form_id",form.id).order("created_at",{ascending:false}),
      supabase.from("form_views").select("id").eq("form_id",form.id),
      supabase.from("form_clicks").select("id").eq("form_id",form.id),
    ]);
    setResponses(resp||[]);
    setViews((vw as any)?.length||0);
    setClicks((cl as any)?.length||0);
    setTab("analytics");
  };

  const openBuilder=(form?:FormData)=>{
    if(form){
      setEditId(form.id);setBTitle(form.title);setBDesc(form.description);
      setBAccent(form.accent_color||"#10B981");
      setBQuestions(form.questions||[]);
      setBCompTitle(form.completion_title||"Спасибо!");
      setBCompSub(form.completion_subtitle||"");
      setBCompUrl(form.completion_url||"");
      setBCompBtn(form.completion_btn_label||"Перейти");
    }else{
      setEditId(null);setBTitle("");setBDesc("");setBAccent("#10B981");
      setBQuestions([]);setBCompTitle("Спасибо за ответы!");setBCompSub("");setBCompUrl("");setBCompBtn("Перейти");
    }
    setBuilderStep(1);setTab("builder");
  };

  const addQuestion=()=>{
    const q:Question={id:Date.now().toString(),type:"text",label:"",required:false,options:["",""]};
    setBQuestions(prev=>[...prev,q]);
  };

  const updateQ=(id:string,patch:Partial<Question>)=>setBQuestions(prev=>prev.map(q=>q.id===id?{...q,...patch}:q));
  const removeQ=(id:string)=>setBQuestions(prev=>prev.filter(q=>q.id!==id));
  const moveQ=(i:number,dir:-1|1)=>{
    const arr=[...bQuestions];const j=i+dir;
    if(j<0||j>=arr.length)return;
    [arr[i],arr[j]]=[arr[j],arr[i]];setBQuestions(arr);
  };

  const saveForm=async()=>{
    if(!bTitle.trim())return;
    setSaving(true);
    const slug=editId?(forms.find(f=>f.id===editId)?.slug||`f-${Date.now()}`):`f-${Math.random().toString(36).slice(2,8)}`;
    const payload={
      user_id:userId,title:bTitle,description:bDesc,slug,
      questions:bQuestions,accent_color:bAccent,
      completion_title:bCompTitle,completion_subtitle:bCompSub,
      completion_url:bCompUrl,completion_btn_label:bCompBtn,
      is_active:true,
    };
    if(editId){
      await supabase.from("forms").update(payload).eq("id",editId);
    }else{
      await supabase.from("forms").insert(payload);
    }
    await loadForms();setSaving(false);setTab("list");
  };

  const toggleActive=async(form:FormData)=>{
    await supabase.from("forms").update({is_active:!form.is_active}).eq("id",form.id);
    setForms(prev=>prev.map(f=>f.id===form.id?{...f,is_active:!f.is_active}:f));
  };

  const deleteForm=async(id:string)=>{
    if(!confirm("Удалить форму и все ответы?"))return;
    await supabase.from("form_responses").delete().eq("form_id",id);
    await supabase.from("form_views").delete().eq("form_id",id);
    await supabase.from("form_clicks").delete().eq("form_id",id);
    await supabase.from("forms").delete().eq("id",id);
    setForms(prev=>prev.filter(f=>f.id!==id));
  };

  const deleteResponse=async(responseId:string)=>{
    await supabase.from("form_responses").delete().eq("id",responseId);
    setResponses(prev=>prev.filter(r=>r.id!==responseId));
  };

  const deleteAllResponses=async()=>{
    if(!selectedForm||!confirm("Удалить все ответы? Это нельзя отменить."))return;
    await supabase.from("form_responses").delete().eq("form_id",selectedForm.id);
    setResponses([]);
  };

  const copyLink=(slug:string)=>{
    const url=`${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);setCopied(slug);setTimeout(()=>setCopied(null),2000);
  };

  const exportCSV=()=>{
    if(!selectedForm||!responses.length)return;
    const qs=selectedForm.questions.map(q=>q.label);
    const header=["Дата",...qs,"Email"].join(",");
    const rows=responses.map(r=>{
      const date=new Date(r.created_at).toLocaleDateString("ru-RU");
      const vals=qs.map(q=>{
        const ans=r.answers?.find((a:any)=>a.question_label===q);
        const v=Array.isArray(ans?.answer)?ans.answer.join("; "):(ans?.answer||"");
        return `"${String(v).replace(/"/g,'""')}"`;
      });
      return[date,...vals,r.respondent_email||""].join(",");
    });
    const csv=[header,...rows].join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download=`${selectedForm.title}-responses.csv`;a.click();
  };

  const QTYPES=[
    {id:"text",label:"Короткий текст",ic:"✏️"},
    {id:"textarea",label:"Длинный текст",ic:"📝"},
    {id:"radio",label:"Один вариант",ic:"🔘"},
    {id:"checkbox",label:"Несколько вариантов",ic:"☑️"},
    {id:"scale",label:"Шкала 1–10",ic:"📊"},
    {id:"email",label:"Email",ic:"📧"},
    {id:"phone",label:"Телефон",ic:"📞"},
  ];

  // ── Design tokens ──
  const gl={
    card:dark?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.82)",
    cardBorder:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",
    input:dark?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.9)",
    inputBorder:dark?"rgba(255,255,255,0.10)":"rgba(0,0,0,0.10)",
    sh:"0 1px 3px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06)",
    pill:(active:boolean)=>active
      ?(dark?"rgba(255,255,255,0.10)":"rgba(0,0,0,0.06)")
      :"transparent",
    blur:"blur(20px) saturate(160%)",
  };
  const gInput:React.CSSProperties={width:"100%",padding:"10px 13px",borderRadius:10,border:`1px solid ${gl.inputBorder}`,background:gl.input,backdropFilter:gl.blur,color:C.t1,fontSize:14,outline:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box",transition:"border-color 0.15s"};

  const Chip=({children,color}:{children:React.ReactNode,color?:string})=>(
    <span style={{fontSize:11,fontWeight:600,color:color||C.t2,background:color?`${color}14`:(dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)"),padding:"3px 9px",borderRadius:20,letterSpacing:0.2}}>{children}</span>
  );

  const GhostBtn=({children,onClick,icon}:{children?:React.ReactNode,onClick?:()=>void,icon?:React.ReactNode})=>(
    <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:9,border:`1px solid ${gl.cardBorder}`,background:gl.card,backdropFilter:gl.blur,color:C.t1,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap" as const}}>
      {icon}{children}
    </button>
  );

  const PrimaryBtn=({children,onClick,disabled,small}:{children:React.ReactNode,onClick?:()=>void,disabled?:boolean,small?:boolean})=>(
    <button onClick={onClick} disabled={disabled}
      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:small?"8px 16px":"11px 20px",borderRadius:10,border:"none",background:disabled?(dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"):"#18181B",color:disabled?C.t2:"#fff",fontSize:small?12:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",transition:"opacity 0.15s",opacity:disabled?0.5:1,whiteSpace:"nowrap" as const}}>
      {children}
    </button>
  );

  const SectionCard=({children,style}:{children:React.ReactNode,style?:React.CSSProperties})=>(
    <div style={{background:gl.card,backdropFilter:gl.blur,border:`1px solid ${gl.cardBorder}`,borderRadius:16,padding:22,boxShadow:gl.sh,...style}}>
      {children}
    </div>
  );

  const FieldLabel=({children}:{children:React.ReactNode})=>(
    <div style={{fontSize:11,fontWeight:600,color:C.t2,marginBottom:6,letterSpacing:0.3}}>{children}</div>
  );

  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",color:C.t2,fontSize:14}}>Загрузка...</div>;

  return(
    <div style={{maxWidth:840,margin:"0 auto",padding:"36px 24px",fontFamily:"'Inter',sans-serif"}}>

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:C.t1,letterSpacing:-0.3}}>Forms</div>
          <div style={{fontSize:13,color:C.t2,marginTop:2}}>Создавай формы и собирай ответы</div>
        </div>
        {tab==="list"&&(
          <PrimaryBtn onClick={()=>openBuilder()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Новая форма
          </PrimaryBtn>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{display:"flex",gap:2,padding:"4px",background:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",backdropFilter:gl.blur,borderRadius:12,marginBottom:28,width:"fit-content",border:`1px solid ${gl.cardBorder}`}}>
        {([["list","Формы"],["builder","Конструктор"],selectedForm&&["analytics","Аналитика"]] as any[]).filter(Boolean).map(([id,label]:string[])=>(
          <button key={id} onClick={()=>setTab(id as typeof tab)}
            style={{padding:"7px 16px",borderRadius:9,border:"none",cursor:"pointer",fontSize:13,fontWeight:tab===id?700:500,background:tab===id?(dark?"rgba(255,255,255,0.09)":"#fff"):"transparent",color:tab===id?C.t1:C.t2,transition:"all 0.15s",boxShadow:tab===id?(dark?"none":"0 1px 3px rgba(0,0,0,0.08)"):"none"}}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ LIST ══ */}
      {tab==="list"&&(
        forms.length===0
          ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:"80px 24px",textAlign:"center"}}>
            <div style={{width:56,height:56,borderRadius:16,background:dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",border:`1px solid ${gl.cardBorder}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <div>
              <div style={{fontSize:17,fontWeight:700,color:C.t1,marginBottom:6}}>Форм пока нет</div>
              <div style={{fontSize:14,color:C.t2,maxWidth:320}}>Создай первую форму и получи ссылку для рассылки</div>
            </div>
            <PrimaryBtn onClick={()=>openBuilder()}>Создать форму</PrimaryBtn>
          </div>
          :<SectionCard style={{padding:0,overflow:"hidden"}}>
            {/* Table header */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px 100px 80px 160px",padding:"10px 18px",borderBottom:`1px solid ${gl.cardBorder}`}}>
              {["Название","Вопросы","Ответы","Статус",""].map(h=>(
                <div key={h} style={{fontSize:11,fontWeight:600,color:C.t2,letterSpacing:0.4}}>{h}</div>
              ))}
            </div>
            {forms.map((form,i)=>(
              <div key={form.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 100px 80px 160px",padding:"13px 18px",borderBottom:i<forms.length-1?`1px solid ${gl.cardBorder}`:"none",alignItems:"center",transition:"background 0.12s"}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=dark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.01)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:C.t1,marginBottom:2}}>{form.title}</div>
                  {form.description&&<div style={{fontSize:12,color:C.t2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,maxWidth:260}}>{form.description}</div>}
                </div>
                <div style={{fontSize:13,color:C.t2}}>{form.questions?.length||0}</div>
                <div style={{fontSize:13,color:C.t2}}>—</div>
                <div>
                  <Chip color={form.is_active?"#16A34A":undefined}>{form.is_active?"Активна":"Откл."}</Chip>
                </div>
                <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                  <GhostBtn onClick={()=>copyLink(form.slug)} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>}>
                    {copied===form.slug?"Скопировано":"Ссылка"}
                  </GhostBtn>
                  <GhostBtn onClick={()=>loadAnalytics(form)} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}>Ответы</GhostBtn>
                  <GhostBtn onClick={()=>openBuilder(form)} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}/>
                  <button onClick={()=>toggleActive(form)} style={{padding:"7px 8px",borderRadius:9,border:`1px solid ${gl.cardBorder}`,background:gl.card,cursor:"pointer",color:C.t2,fontSize:11,fontWeight:600}}>{form.is_active?"Откл.":"Вкл."}</button>
                  <button onClick={()=>deleteForm(form.id)} style={{padding:"7px 8px",borderRadius:9,border:"1px solid rgba(239,68,68,0.15)",background:"transparent",cursor:"pointer",color:"#EF4444",fontSize:12}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </SectionCard>
      )}

      {/* ══ BUILDER ══ */}
      {tab==="builder"&&(
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          {/* Steps */}
          <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:4}}>
            {([{n:1,label:"Настройки"},{n:2,label:"Вопросы"},{n:3,label:"Финал"}] as const).map(({n,label},i)=>(
              <React.Fragment key={n}>
                <button onClick={()=>setBuilderStep(n)} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",padding:"6px 12px",borderRadius:8,transition:"background 0.12s"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                  <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,background:builderStep===n?"#18181B":(builderStep>n?(dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.06)"):(dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)")),color:builderStep===n?"#fff":(builderStep>n?C.t1:C.t2),border:builderStep>n&&builderStep!==n?`1px solid ${gl.cardBorder}`:"none",transition:"all 0.2s"}}>
                    {builderStep>n?<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>:n}
                  </div>
                  <span style={{fontSize:13,fontWeight:builderStep===n?700:500,color:builderStep===n?C.t1:C.t2}}>{label}</span>
                </button>
                {i<2&&<div style={{flex:1,height:1,background:gl.cardBorder,maxWidth:40}}/>}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1 */}
          {builderStep===1&&(
            <SectionCard>
              <FieldLabel>Название формы *</FieldLabel>
              <input value={bTitle} onChange={e=>setBTitle(e.target.value)} placeholder="Например: Анкета квалификации клиента" style={{...gInput,marginBottom:14,fontSize:16,fontWeight:600}}/>
              <FieldLabel>Описание (видит пользователь)</FieldLabel>
              <textarea value={bDesc} onChange={e=>setBDesc(e.target.value)} placeholder="Расскажи зачем нужна эта форма..." rows={3} style={{...gInput,resize:"vertical" as const,minHeight:80,marginBottom:16}}/>
              <FieldLabel>Акцентный цвет</FieldLabel>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <input type="color" value={bAccent} onChange={e=>setBAccent(e.target.value)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${gl.cardBorder}`,cursor:"pointer",padding:2,background:"transparent"}}/>
                <span style={{fontSize:12,color:C.t2,fontFamily:"monospace"}}>{bAccent}</span>
              </div>
              <div style={{marginTop:20}}>
                <PrimaryBtn onClick={()=>setBuilderStep(2)} disabled={!bTitle.trim()}>Далее — Вопросы →</PrimaryBtn>
              </div>
            </SectionCard>
          )}

          {/* Step 2 */}
          {builderStep===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {bQuestions.length===0&&(
                <div style={{padding:"48px 24px",border:`1px dashed ${gl.cardBorder}`,borderRadius:14,textAlign:"center",color:C.t2}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{margin:"0 auto 10px",display:"block"}}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Вопросов пока нет</div>
                  <div style={{fontSize:12}}>Добавь первый вопрос ниже</div>
                </div>
              )}
              {bQuestions.map((q,i)=>(
                <SectionCard key={q.id} style={{padding:18}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <span style={{fontSize:12,fontWeight:700,color:C.t2,minWidth:24}}>Q{i+1}</span>
                    <select value={q.type} onChange={e=>updateQ(q.id,{type:e.target.value})}
                      style={{...gInput,width:"auto",flex:"none",padding:"6px 10px",fontSize:12,cursor:"pointer"}}>
                      {QTYPES.map(t=><option key={t.id} value={t.id}>{t.ic} {t.label}</option>)}
                    </select>
                    <label style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.t2,cursor:"pointer",marginLeft:"auto",whiteSpace:"nowrap" as const}}>
                      <input type="checkbox" checked={q.required} onChange={e=>updateQ(q.id,{required:e.target.checked})} style={{accentColor:"#18181B"}}/>
                      Обязательный
                    </label>
                    <div style={{display:"flex",gap:2}}>
                      <button onClick={()=>moveQ(i,-1)} disabled={i===0} style={{width:26,height:26,borderRadius:6,border:`1px solid ${gl.cardBorder}`,background:"transparent",cursor:"pointer",color:C.t2,fontSize:12,opacity:i===0?0.3:1,display:"flex",alignItems:"center",justifyContent:"center"}}>↑</button>
                      <button onClick={()=>moveQ(i,1)} disabled={i===bQuestions.length-1} style={{width:26,height:26,borderRadius:6,border:`1px solid ${gl.cardBorder}`,background:"transparent",cursor:"pointer",color:C.t2,fontSize:12,opacity:i===bQuestions.length-1?0.3:1,display:"flex",alignItems:"center",justifyContent:"center"}}>↓</button>
                      <button onClick={()=>removeQ(q.id)} style={{width:26,height:26,borderRadius:6,border:"1px solid rgba(239,68,68,0.15)",background:"transparent",cursor:"pointer",color:"#EF4444",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                    </div>
                  </div>
                  <input value={q.label} onChange={e=>updateQ(q.id,{label:e.target.value})} placeholder={`Текст вопроса ${i+1}...`} style={gInput}/>
                  {(q.type==="radio"||q.type==="checkbox")&&(
                    <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${gl.cardBorder}`}}>
                      <FieldLabel>Варианты</FieldLabel>
                      {q.options.map((opt,oi)=>(
                        <div key={oi} style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
                          <span style={{fontSize:12,color:C.t2,width:16,textAlign:"center" as const,flexShrink:0}}>{oi+1}</span>
                          <input value={opt} onChange={e=>{const o=[...q.options];o[oi]=e.target.value;updateQ(q.id,{options:o});}} placeholder={`Вариант ${oi+1}`} style={{...gInput,padding:"7px 10px"}}/>
                          {q.options.length>2&&<button onClick={()=>{const o=q.options.filter((_,j)=>j!==oi);updateQ(q.id,{options:o});}} style={{background:"none",border:"none",cursor:"pointer",color:C.t2,fontSize:16,padding:"0 4px"}}>×</button>}
                        </div>
                      ))}
                      {q.options.length<8&&<button onClick={()=>updateQ(q.id,{options:[...q.options,""]})} style={{fontSize:12,color:C.t2,background:"none",border:"none",cursor:"pointer",padding:0,marginTop:2}}>+ Добавить вариант</button>}
                    </div>
                  )}
                </SectionCard>
              ))}
              <button onClick={addQuestion}
                style={{padding:"12px",borderRadius:12,border:`1px dashed ${gl.cardBorder}`,background:"transparent",color:C.t2,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.15s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Добавить вопрос
              </button>
              <div style={{display:"flex",gap:10}}>
                <GhostBtn onClick={()=>setBuilderStep(1)}>← Назад</GhostBtn>
                <div style={{flex:1}}/>
                <PrimaryBtn onClick={()=>setBuilderStep(3)} disabled={bQuestions.length===0}>Далее — Финал →</PrimaryBtn>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {builderStep===3&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <SectionCard>
                <FieldLabel>Заголовок финального экрана</FieldLabel>
                <input value={bCompTitle} onChange={e=>setBCompTitle(e.target.value)} placeholder="Спасибо за ответы!" style={{...gInput,marginBottom:12}}/>
                <FieldLabel>Подзаголовок</FieldLabel>
                <input value={bCompSub} onChange={e=>setBCompSub(e.target.value)} placeholder="Мы свяжемся с тобой в течение 24 часов" style={{...gInput,marginBottom:12}}/>
                <FieldLabel>Ссылка для кнопки</FieldLabel>
                <input value={bCompUrl} onChange={e=>setBCompUrl(e.target.value)} placeholder="https://t.me/username" style={{...gInput,marginBottom:12}}/>
                <FieldLabel>Текст кнопки</FieldLabel>
                <input value={bCompBtn} onChange={e=>setBCompBtn(e.target.value)} placeholder="Перейти в Telegram" style={gInput}/>
              </SectionCard>

              {/* Preview */}
              <SectionCard style={{padding:32,textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:600,color:C.t2,letterSpacing:1,textTransform:"uppercase" as const,marginBottom:20}}>Превью финала</div>
                <div style={{width:40,height:40,borderRadius:12,background:`${bAccent}14`,border:`1px solid ${bAccent}30`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={bAccent} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{fontSize:19,fontWeight:800,color:C.t1,marginBottom:6}}>{bCompTitle||"Спасибо!"}</div>
                {bCompSub&&<div style={{fontSize:13,color:C.t2,marginBottom:16}}>{bCompSub}</div>}
                {bCompUrl&&<div style={{display:"inline-block",padding:"10px 22px",borderRadius:9,background:"#18181B",color:"#fff",fontSize:13,fontWeight:600}}>{bCompBtn||"Перейти"}</div>}
              </SectionCard>

              <div style={{display:"flex",gap:10}}>
                <GhostBtn onClick={()=>setBuilderStep(2)}>← Назад</GhostBtn>
                <div style={{flex:1}}/>
                <PrimaryBtn onClick={saveForm} disabled={saving||!bTitle.trim()}>
                  {saving?"Сохраняем...":(editId?"Сохранить изменения":"Сохранить и получить ссылку")}
                </PrimaryBtn>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ANALYTICS ══ */}
      {tab==="analytics"&&selectedForm&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:17,fontWeight:700,color:C.t1}}>{selectedForm.title}</div>
              <div style={{fontSize:12,color:C.t2,marginTop:2,fontFamily:"monospace"}}>{`${window.location.origin}/f/${selectedForm.slug}`}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <GhostBtn onClick={()=>copyLink(selectedForm.slug)} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>}>
                {copied===selectedForm.slug?"Скопировано":"Ссылка"}
              </GhostBtn>
              {responses.length>0&&<GhostBtn onClick={exportCSV} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>CSV</GhostBtn>}
              {responses.length>0&&<button onClick={deleteAllResponses} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:9,border:"1px solid rgba(239,68,68,0.2)",background:"transparent",color:"#EF4444",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                Удалить все
              </button>}
            </div>
          </div>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              {label:"Всего ответов",value:responses.length},
              {label:"За 7 дней",value:responses.filter(r=>new Date(r.created_at)>new Date(Date.now()-7*864e5)).length},
              {label:"За 30 дней",value:responses.filter(r=>new Date(r.created_at)>new Date(Date.now()-30*864e5)).length},
            ].map(({label,value})=>(
              <SectionCard key={label} style={{padding:16}}>
                <div style={{fontSize:11,color:C.t2,fontWeight:600,marginBottom:6}}>{label}</div>
                <div style={{fontSize:24,fontWeight:800,color:C.t1}}>{value}</div>
              </SectionCard>
            ))}
            {/* Conversion card with sub-metrics */}
            <SectionCard style={{padding:16}}>
              <div style={{fontSize:11,color:C.t2,fontWeight:600,marginBottom:6}}>Конверсия</div>
              <div style={{fontSize:24,fontWeight:800,color:C.t1,marginBottom:10}}>
                {clicks&&views?`${Math.round(clicks/views*100)}%`:"—"}
              </div>
              <div style={{display:"flex",flexDirection:"column" as const,gap:5}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",borderRadius:7,background:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"}}>
                  <span style={{fontSize:10,color:C.t2,fontWeight:500}}>👁 Просмотров</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.t1}}>{views}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",borderRadius:7,background:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"}}>
                  <span style={{fontSize:10,color:C.t2,fontWeight:500}}>🎯 Нажали кнопку</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.t1}}>{clicks}</span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Charts */}
          {selectedForm.questions.filter((q:Question)=>q.type==="radio"||q.type==="checkbox").map((q:Question)=>{
            const counts:Record<string,number>={};
            q.options.filter(Boolean).forEach(o=>{counts[o]=0;});
            responses.forEach(r=>{
              const ans=r.answers?.find((a:any)=>a.question_id===q.id);
              if(!ans)return;
              const vals=Array.isArray(ans.answer)?ans.answer:[ans.answer];
              vals.forEach((v:string)=>{counts[v]=(counts[v]||0)+1;});
            });
            const max=Math.max(...Object.values(counts),1);
            return(
              <SectionCard key={q.id}>
                <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:16}}>{q.label}</div>
                {Object.entries(counts).map(([opt,cnt])=>(
                  <div key={opt} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:13,color:C.t1}}>{opt}</span>
                      <span style={{fontSize:12,color:C.t2,fontWeight:600}}>{cnt} · {responses.length?Math.round(cnt/responses.length*100):0}%</span>
                    </div>
                    <div style={{height:5,background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(cnt/max)*100}%`,background:C.t1,borderRadius:3,transition:"width 0.5s ease",opacity:0.7}}/>
                    </div>
                  </div>
                ))}
              </SectionCard>
            );
          })}

          {/* Table */}
          {responses.length===0
            ?<SectionCard style={{padding:48,textAlign:"center"}}>
              <div style={{color:C.t2,fontSize:13}}>Ответов пока нет</div>
            </SectionCard>
            :<SectionCard style={{padding:0,overflow:"hidden"}}>
              <div style={{overflowX:"auto" as const}}>
                <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${gl.cardBorder}`}}>
                      <th style={{padding:"11px 16px",textAlign:"left" as const,fontSize:11,fontWeight:600,color:C.t2,whiteSpace:"nowrap" as const}}>Дата</th>
                      {selectedForm.questions.map((q:Question)=>(
                        <th key={q.id} style={{padding:"11px 16px",textAlign:"left" as const,fontSize:11,fontWeight:600,color:C.t2,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{q.label.slice(0,28)}{q.label.length>28?"…":""}</th>
                      ))}
                      <th style={{padding:"11px 16px",width:40}}/>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((r,ri)=>(
                      <tr key={r.id} style={{borderBottom:ri<responses.length-1?`1px solid ${gl.cardBorder}`:"none"}}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=dark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.01)"}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                        <td style={{padding:"11px 16px",color:C.t2,whiteSpace:"nowrap" as const,fontSize:12}}>{new Date(r.created_at).toLocaleDateString("ru-RU")}</td>
                        {selectedForm.questions.map((q:Question)=>{
                          const ans=r.answers?.find((a:any)=>a.question_id===q.id);
                          const val=Array.isArray(ans?.answer)?ans.answer.join(", "):(ans?.answer||"—");
                          return<td key={q.id} style={{padding:"11px 16px",color:C.t1,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{val}</td>;
                        })}
                        <td style={{padding:"11px 16px"}}>
                          <button onClick={()=>deleteResponse(r.id)} title="Удалить ответ"
                            style={{width:26,height:26,borderRadius:7,border:"1px solid rgba(239,68,68,0.15)",background:"transparent",cursor:"pointer",color:"#EF4444",display:"flex",alignItems:"center",justifyContent:"center",opacity:0.6,transition:"opacity 0.15s"}}
                            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity="1"}
                            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity="0.6"}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          }
        </div>
      )}
    </div>
  );
}

/* ============ COPY AI PAGE ============ */
const COPY_TOOLS=[
  {id:"text-booster",name:"Text Booster",desc:"Проверяет и усиливает текст. Глубокий аудит с пошаговой инструкцией.",tag:"Редактура",ic:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"},
  {id:"sales-master",name:"Sales Master",desc:"Генерирует убедительные слоганы, призывы к действию и сценарии продаж.",tag:"Продажи",ic:"M13 10V3L4 14h7v7l9-11h-7z"},
  {id:"profit-planner",name:"Profit Planner",desc:"Разрабатывает стратегию монетизации на основе текущих показателей профиля.",tag:"Стратегия",ic:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"},
  {id:"no-ai-text",name:"NO AI Text",desc:"Убирает эффект генерации текста — делает его живым и человеческим.",tag:"Редактура",ic:"M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"},
  {id:"story-master",name:"Story Master",desc:"Берёт историю и переписывает её в другом жанре или стиле, сохраняя смыслы.",tag:"Сторителлинг",ic:"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"},
  {id:"reels-master",name:"Reels Master",desc:"Генерирует вирусные посты, цитаты и треды для коротких видео.",tag:"Контент",ic:"M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"},
  {id:"style-master",name:"Style Master",desc:"Изучает фирменный тон голоса и создаёт тексты, звучащие как вы.",tag:"Стиль",ic:"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"},
  {id:"ad-master",name:"Ad Master",desc:"Предлагает нестандартные рекламные ходы для продвижения продукта.",tag:"Реклама",ic:"M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"},
  {id:"youtube-master",name:"YouTube Master",desc:"Преобразует текст в готовый скрипт для диктора с ритмом и паузами.",tag:"Видео",ic:"M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
  {id:"dna-transformer",name:"DNA Transformer",desc:"Подгоняет любой текст под брендовые стандарты и ценности.",tag:"Бренд",ic:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"},
  {id:"icp-master",name:"ICP Master",desc:"Помогает составить портрет идеальных покупателей, готовых платить больше.",tag:"Аудитория",ic:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"},
  {id:"send-magnet",name:"Send Magnet",desc:"Генератор тем и текстов для рассылки, повышающих открываемость.",tag:"Рассылка",ic:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"},
];

const TAG_COLORS:Record<string,string>={
  "Редактура":"#6366F1","Продажи":"#10B981","Стратегия":"#F59E0B",
  "Сторителлинг":"#EC4899","Контент":"#8B5CF6","Стиль":"#14B8A6",
  "Реклама":"#F97316","Видео":"#EF4444","Бренд":"#3B82F6",
  "Аудитория":"#06B6D4","Рассылка":"#84CC16",
};

function CopyAIPage({userId}:{userId:string}){
  const{dark}=useTheme();
  const[search,setSearch]=useState("");
  const[filter,setFilter]=useState<"all"|"fav"|"my">("all");
  const[favs,setFavs]=useState<Set<string>>(()=>{
    try{return new Set(JSON.parse(localStorage.getItem("copyai_favs")||"[]"));}
    catch{return new Set();}
  });
  const[selected,setSelected]=useState<typeof COPY_TOOLS[0]|null>(null);

  const toggleFav=(id:string,e:React.MouseEvent)=>{
    e.stopPropagation();
    setFavs(prev=>{
      const next=new Set(prev);
      next.has(id)?next.delete(id):next.add(id);
      localStorage.setItem("copyai_favs",JSON.stringify([...next]));
      return next;
    });
  };

  const filtered=COPY_TOOLS.filter(t=>{
    if(filter==="fav"&&!favs.has(t.id))return false;
    if(search&&!t.name.toLowerCase().includes(search.toLowerCase())&&!t.desc.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });

  const bd=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)";
  const cardBg=dark?"rgba(255,255,255,0.03)":"#fff";

  if(selected)return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"36px 24px"}}>
      <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:C.t2,fontSize:13,fontWeight:500,marginBottom:28,padding:0}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Назад к инструментам
      </button>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
        <div style={{width:52,height:52,borderRadius:14,background:dark?"rgba(255,255,255,0.05)":"#F8FAFC",border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.5"><path d={selected.ic}/></svg>
        </div>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:C.t1,letterSpacing:"-0.02em",marginBottom:4}}>{selected.name}</div>
          <span style={{fontSize:11,fontWeight:600,color:TAG_COLORS[selected.tag]||C.t2,background:`${TAG_COLORS[selected.tag]||"#888"}18`,padding:"3px 9px",borderRadius:20}}>{selected.tag}</span>
        </div>
      </div>
      <div style={{background:cardBg,border:`1px solid ${bd}`,borderRadius:16,padding:24,marginBottom:16}}>
        <div style={{fontSize:11,color:C.t2,fontWeight:600,marginBottom:8,letterSpacing:0.3,textTransform:"uppercase" as const}}>Описание</div>
        <div style={{fontSize:15,color:C.t1,lineHeight:1.7}}>{selected.desc}</div>
      </div>
      <div style={{background:cardBg,border:`1px solid ${bd}`,borderRadius:16,padding:24}}>
        <div style={{fontSize:11,color:C.t2,fontWeight:600,marginBottom:16,letterSpacing:0.3,textTransform:"uppercase" as const}}>Инструмент</div>
        <div style={{padding:40,border:`1px dashed ${bd}`,borderRadius:12,textAlign:"center" as const,color:C.t2}}>
          <div style={{fontSize:13,fontWeight:500}}>Функционал в разработке</div>
          <div style={{fontSize:12,marginTop:4,opacity:0.6}}>Скоро будет доступно</div>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:960,margin:"0 auto",padding:"36px 24px"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28}}>
        <div>
          <div style={{fontSize:26,fontWeight:800,color:C.t1,letterSpacing:"-0.025em",marginBottom:4}}>Инструменты Копирайтинга</div>
          <div style={{fontSize:14,color:C.t2}}>{COPY_TOOLS.length} инструментов · Vizzy Copy AI</div>
        </div>
        <button style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:11,border:"none",background:"#2563EB",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0,letterSpacing:"-0.01em"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Создать свой
        </button>
      </div>

      {/* Search + filters */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <div style={{position:"relative" as const,flex:1,maxWidth:320}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" as const}}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Найти инструмент..."
            style={{width:"100%",padding:"9px 12px 9px 34px",borderRadius:10,border:`1px solid ${bd}`,background:dark?"rgba(255,255,255,0.04)":"#fff",color:C.t1,fontSize:13,outline:"none",boxSizing:"border-box" as const,fontFamily:"'Inter',sans-serif"}}/>
        </div>
        <div style={{display:"flex",gap:2,padding:"3px",background:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",borderRadius:10,border:`1px solid ${bd}`}}>
          {([["all","Все"],["fav","Любимые"],["my","Мои"]] as const).map(([id,label])=>(
            <button key={id} onClick={()=>setFilter(id)}
              style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:filter===id?700:500,background:filter===id?(dark?"rgba(255,255,255,0.09)":"#fff"):"transparent",color:filter===id?C.t1:C.t2,transition:"all 0.15s",boxShadow:filter===id&&!dark?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>
              {label}{id==="fav"&&favs.size>0?` (${favs.size})`:""}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length===0
        ?<div style={{padding:"60px 24px",textAlign:"center" as const,color:C.t2}}>
          <div style={{fontSize:14,fontWeight:500}}>Ничего не найдено</div>
        </div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {filtered.map(tool=>(
            <button key={tool.id} onClick={()=>setSelected(tool)}
              style={{background:cardBg,border:`1px solid ${bd}`,borderRadius:14,padding:20,cursor:"pointer",textAlign:"left" as const,transition:"all 0.15s",position:"relative" as const}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-1px)";(e.currentTarget as HTMLElement).style.boxShadow=dark?"0 4px 20px rgba(0,0,0,0.3)":"0 4px 20px rgba(0,0,0,0.08)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(0)";(e.currentTarget as HTMLElement).style.boxShadow="none";}}>

              {/* Star */}
              <button onClick={e=>toggleFav(tool.id,e)}
                style={{position:"absolute",top:14,right:14,background:"none",border:"none",cursor:"pointer",color:favs.has(tool.id)?"#F59E0B":C.t2,opacity:favs.has(tool.id)?1:0.4,transition:"all 0.15s",padding:2}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.opacity="1";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.opacity=favs.has(tool.id)?"1":"0.4";}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill={favs.has(tool.id)?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>

              {/* Icon */}
              <div style={{width:40,height:40,borderRadius:11,background:dark?"rgba(255,255,255,0.05)":"#F8FAFC",border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="1.6"><path d={tool.ic}/></svg>
              </div>

              {/* Tag */}
              <div style={{marginBottom:8}}>
                <span style={{fontSize:10,fontWeight:600,color:TAG_COLORS[tool.tag]||C.t2,background:`${TAG_COLORS[tool.tag]||"#888"}15`,padding:"2px 8px",borderRadius:20,letterSpacing:0.2}}>{tool.tag}</span>
              </div>

              {/* Name */}
              <div style={{fontSize:15,fontWeight:700,color:C.t1,marginBottom:6,letterSpacing:"-0.01em"}}>{tool.name}</div>

              {/* Desc */}
              <div style={{fontSize:13,color:C.t2,lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any}}>{tool.desc}</div>
            </button>
          ))}
        </div>
      }
    </div>
  );
}
