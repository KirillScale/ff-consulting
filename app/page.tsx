"use client";
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
      {id:"mailings",label:"Рассылки",ic:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"},
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
      {id:"sheets",label:"Таблицы",ic:"M3 10h18M3 6h18M3 14h18M3 18h18M10 3v18M6 3v18"},
      {id:"tools",label:"Инструменты",ic:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"},
      {id:"links",label:"База ссылок",ic:"M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"},
      {id:"board",label:"Доска",ic:"M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"},
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

// Input style hook
const useIS=():React.CSSProperties=>{
  const{dark}=useTheme();
  return{
    width:"100%",padding:"11px 14px",
    border:`1px solid ${dark?"rgba(255,255,255,0.08)":C.bd}`,
    borderRadius:10,fontSize:14,outline:"none",
    background:dark?"#141927":C.ib,
    color:C.t1,boxSizing:"border-box",
    fontFamily:"'Montserrat',sans-serif",
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
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.dk},${C.da},${C.a})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Montserrat',sans-serif",padding:20}}>
      <div style={{background:C.w,borderRadius:24,padding:"48px 40px",width:"100%",maxWidth:420,boxShadow:"0 24px 80px rgba(0,0,0,0.25)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,background:C.dk,padding:"14px 28px",borderRadius:12}}>
            <Logo s={40}/><Brand size="lg"/>
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

/* ============ SIDEBAR — Deep Dark Glass ============ */
function Side({active,onNav,onLogout}:{active:string,onNav:(id:string)=>void,onLogout:()=>void}){
  const{dark,toggle}=useTheme();
  const[collapsed,setCollapsed]=useState(false);
  const activeGroupIdx=NAV_GROUPS.findIndex(g=>g.items.some(i=>i.id===active));
  const[openGroups,setOpenGroups]=useState<number[]>(()=>[activeGroupIdx>=0?activeGroupIdx:0]);

  const toggleGroup=(idx:number)=>{
    setOpenGroups(p=>p.includes(idx)?p.filter(i=>i!==idx):[...p,idx]);
  };

  const AI_ICONS:Record<string,string>={
    ai:"/icon-ai.png",script:"/icon-copy.png",
    product:"/icon-product.png",stories:"/icon-stories.png",
  };

  const getAccent=(n:any)=>(n.accent==="gradient"?null:n.accent||null);

  const renderItem=(n:any)=>{
    const isActive=active===n.id;
    const accent=getAccent(n);
    const isGrad=n.accent==="gradient";
    const customIcon=AI_ICONS[n.id];
    const iconColor=isActive?"#fff":accent||"rgba(255,255,255,0.45)";

    return(
      <button key={n.id} onClick={()=>onNav(n.id)} title={collapsed?n.label:undefined}
        style={{
          display:"flex",alignItems:"center",gap:10,
          padding:collapsed?"10px 0":"8px 10px",
          justifyContent:collapsed?"center":"flex-start",
          border:"none",
          borderRadius:12,
          cursor:"pointer",width:"100%",
          background:isActive
            ? `rgba(${accent?hexToRgb(accent):"79,142,247"},0.12)`
            : "transparent",
          position:"relative",overflow:"hidden",
          transition:"all 0.2s ease",
          outline:"none",
        }}
        onMouseEnter={e=>{
          const el=e.currentTarget as HTMLElement;
          if(!isActive){
            el.style.background="rgba(255,255,255,0.04)";
            el.style.transform="translateX(2px)";
          }
          const c=accent||"#4F8EF7";
          el.style.boxShadow=`0 0 16px ${c}18`;
        }}
        onMouseLeave={e=>{
          const el=e.currentTarget as HTMLElement;
          el.style.background=isActive?`rgba(79,142,247,0.12)`:"transparent";
          el.style.transform="translateX(0)";
          el.style.boxShadow=isActive?`0 0 20px rgba(79,142,247,0.15)`:"none";
        }}>

        {/* Active left glow bar */}
        {isActive&&<div style={{
          position:"absolute",left:0,top:"18%",bottom:"18%",width:3,
          borderRadius:"0 3px 3px 0",
          background:accent||"#4F8EF7",
          boxShadow:`0 0 10px ${accent||"#4F8EF7"},0 0 20px ${accent||"#4F8EF7"}66`,
        }}/>}

        {/* Shimmer overlay on active */}
        {isActive&&<div style={{
          position:"absolute",inset:0,borderRadius:12,
          background:"linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.03) 50%,transparent 100%)",
          backgroundSize:"200% 100%",
          animation:"shimmer 3s ease-in-out infinite",
          pointerEvents:"none",
        }}/>}

        {/* Icon wrapper */}
        <div style={{
          width:26,height:26,borderRadius:8,flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",
          overflow:"hidden",
          background:customIcon?"transparent"
            :isActive
              ?(isGrad?"linear-gradient(135deg,#86EFAC,#A78BFA)":accent?accent+"30":"rgba(79,142,247,0.25)")
              :"rgba(255,255,255,0.04)",
          border:isActive?`1px solid ${accent||"#4F8EF7"}33`:"1px solid rgba(255,255,255,0.04)",
          boxShadow:isActive&&accent?`0 0 12px ${accent}40,inset 0 1px 0 rgba(255,255,255,0.1)`
            :isActive?"0 0 12px rgba(79,142,247,0.4),inset 0 1px 0 rgba(255,255,255,0.1)":"none",
          transition:"all 0.2s",
        }}>
          {customIcon
            ?<img src={customIcon} width={26} height={26} style={{borderRadius:8,objectFit:"cover",opacity:isActive?1:0.55}} alt={n.label}/>
            :<I path={n.ic} size={13} color={isGrad&&isActive?"#fff":iconColor} sw={isActive?2:1.5}/>
          }
        </div>

        {!collapsed&&<span style={{
          fontSize:12.5,fontWeight:isActive?600:400,flex:1,textAlign:"left",
          color:isActive?(isGrad?"#86EFAC":accent||"#E0EAFF"):"rgba(255,255,255,0.6)",
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
          letterSpacing:isActive?0.1:0,
        }}>{n.label}</span>}

        {/* Active dot */}
        {!collapsed&&isActive&&<div style={{
          width:5,height:5,borderRadius:"50%",
          background:accent||"#4F8EF7",flexShrink:0,
          boxShadow:`0 0 6px ${accent||"#4F8EF7"},0 0 12px ${accent||"#4F8EF7"}88`,
        }}/>}
      </button>
    );
  };

  // helper: hex color → "r,g,b"
  function hexToRgb(hex:string){
    const r=parseInt(hex.slice(1,3),16);
    const g=parseInt(hex.slice(3,5),16);
    const b=parseInt(hex.slice(5,7),16);
    return`${r},${g},${b}`;
  }

  const SB_BG=dark
    ?"linear-gradient(180deg,#06080F 0%,#080B14 50%,#060810 100%)"
    :"linear-gradient(180deg,#111420 0%,#12141A 100%)";

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
          const isOpen=collapsed||openGroups.includes(gi);
          const hasActiveItem=group.items.some(i=>i.id===active);

          return(
            <div key={gi} style={{marginBottom:6}}>
              {group.label&&!collapsed&&(
                <button onClick={()=>toggleGroup(gi)}
                  style={{
                    width:"100%",display:"flex",alignItems:"center",
                    justifyContent:"space-between",
                    padding:"7px 10px 4px",border:"none",
                    background:"transparent",cursor:"pointer",borderRadius:8,
                    transition:"background 0.15s",
                  }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.03)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
                  <span style={{
                    fontSize:9,fontWeight:700,
                    color:hasActiveItem?"rgba(79,142,247,0.7)":"rgba(255,255,255,0.22)",
                    letterSpacing:1.5,textTransform:"uppercase",
                  }}>{group.label}</span>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                    stroke={hasActiveItem?"rgba(79,142,247,0.5)":"rgba(255,255,255,0.2)"}
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
  const [page, setPage] = useState("dashboard");
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

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,fontFamily:"'Montserrat',sans-serif"}}><div style={{fontSize:18,color:C.t2}}>Загрузка...</div></div>;
  if (!user) return <Auth onLogin={(u) => { setUser(u); loadProfile(u.id); }} />;

  const nav = NAV.find(n => n.id === page);

  return(
    <ThemeCtx.Provider value={{dark,toggle:toggleTheme}}>
      <AppLayout user={user} page={page} setPage={setPage} userName={userName} userAvatar={userAvatar} setUserAvatar={setUserAvatar} logout={logout} nav={nav} dark={dark}/>
    </ThemeCtx.Provider>
  );
}

function AppLayout({user,page,setPage,userName,userAvatar,setUserAvatar,logout,nav,dark}:any){
  const isMobile=useIsMobile();
  const[sideCollapsed,setSideCollapsed]=useState(false);
  const sideW=sideCollapsed?60:240;

  const pageContent=<>
    {page === "dashboard" && <DashPage userId={user.id} name={userName} avatar={userAvatar} onNav={setPage} onAvatarChange={async(url:string)=>{setUserAvatar(url);await supabase.from("profiles").upsert({id:user.id,avatar_url:url},{onConflict:"id"});}}/>}
    {page === "strategy" && <StrategyPage userId={user.id}/>}
    {page === "crm" && <CrmPage userId={user.id}/>}
    {page === "calls" && <CallsPage userId={user.id}/>}
    {page === "mailings" && <MailingsPage userId={user.id}/>}
    {page === "content" && <ContentPage userId={user.id}/>}
    {page === "pnl" && <PnlPage userId={user.id}/>}
    {page === "sheets" && <SheetsPage userId={user.id}/>}
    {page === "media" && <MediaPage userId={user.id}/>}
    {page === "ads" && <AdsPage userId={user.id}/>}
    {page === "calc" && <CalcPage/>}
    {page === "tools" && <ToolsPage/>}
    {page === "links" && <LinksPage userId={user.id}/>}
    {page === "board" && <BoardPage userId={user.id}/>}
    {page === "files" && <FilesPage userId={user.id}/>}
    {page === "ai" && <AIPage/>}
    {page === "script" && <ScriptAIPage/>}
    {page === "product" && <ProductAIPage/>}
    {page === "stories" && <StoriesAIPage/>}
    {!["dashboard","strategy","crm","calls","mailings","content","pnl","sheets","media","ads","calc","tools","links","board","files","ai","script","product","stories"].includes(page) && nav && <Placeholder title={nav.label} ic={nav.ic}/>}
  </>;

  return (
    <div style={{
      fontFamily:"'Montserrat',-apple-system,BlinkMacSystemFont,sans-serif",
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
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
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
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>

      {isMobile ? <>
        <MobileNav active={page} onNav={setPage} onLogout={logout}/>
        <div style={{minHeight:"100vh",paddingBottom:80}}>
          <Head name={userName}/>
          <div style={{padding:"16px 16px 0"}}>{pageContent}</div>
        </div>
      </> : <>
        <Side active={page} onNav={setPage} onLogout={logout}/>
        <div style={{marginLeft:sideW,minHeight:"100vh",transition:"margin-left 0.25s cubic-bezier(0.4,0,0.2,1)"}}>
          <Head name={userName}/>
          <div style={{padding:"28px 32px"}}>{pageContent}</div>
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
        style={{padding:"8px 18px",background:C.a,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:`0 0 16px ${C.a}30`}}>
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
          <input value={editGoal?editGoal.name:gf.name} onChange={e=>editGoal?setEditGoal({...editGoal,name:e.target.value}):sGf({...gf,name:e.target.value})} style={{...iS,fontSize:13}}/></div>
        <div><label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4}}>Начало</label>
          <input type="date" value={editGoal?editGoal.start_date:gf.start_date} onChange={e=>editGoal?setEditGoal({...editGoal,start_date:e.target.value}):sGf({...gf,start_date:e.target.value})} style={{...iS,fontSize:13}}/></div>
        <div><label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4}}>Конец (дедлайн)</label>
          <input type="date" value={editGoal?editGoal.end_date:gf.end_date} onChange={e=>editGoal?setEditGoal({...editGoal,end_date:e.target.value}):sGf({...gf,end_date:e.target.value})} style={{...iS,fontSize:13}}/></div>
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
        style={{...iS,padding:"7px 10px",fontSize:13,marginBottom:8,fontWeight:500}}/>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <div style={{display:"flex",flexDirection:"column",gap:2,flex:"0 0 75px"}}>
          <label style={{fontSize:10,color:C.t2,fontWeight:600}}>Минуты</label>
          <input type="number" value={mins} onChange={e=>setMins(+e.target.value)} min={30} max={480} step={5}
            style={{...iS,padding:"6px 8px",fontSize:12}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>
          <label style={{fontSize:10,color:C.t2,fontWeight:600}}>Тип</label>
          <select value={type} onChange={e=>setType(e.target.value)} style={{...iS,padding:"6px 8px",fontSize:12}}>
            {TYPES.map((t:any)=><option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:2,flex:"0 0 130px"}}>
          <label style={{fontSize:10,color:C.t2,fontWeight:600}}>Дата</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{...iS,padding:"6px 8px",fontSize:12}}/>
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
        style={{...iS,padding:"8px 10px",fontSize:12,marginBottom:8}}/>
      <div style={{display:"flex",gap:6,marginBottom:6}}>
        <input type="number" value={localMins} onChange={e=>setLocalMins(+e.target.value)} min={30} max={480} step={5} style={{...iS,width:75,padding:"6px 8px",fontSize:12}}/>
        <select value={localType} onChange={e=>setLocalType(e.target.value)} style={{...iS,flex:1,padding:"6px 8px",fontSize:12}}>
          {TYPES.map((t:any)=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <input type="date" value={localDate} onChange={e=>setLocalDate(e.target.value)} style={{...iS,width:130,padding:"6px 8px",fontSize:12}}/>
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

    const borderColor=isAchieved?"#4ADE80":pr.color;
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
          <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Название</label><input value={editGoalData.name||""} onChange={e=>setEditGoalData({...editGoalData,name:e.target.value})} style={iS}/></div>
          <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Начало</label><input type="date" value={editGoalData.start_date||""} onChange={e=>setEditGoalData({...editGoalData,start_date:e.target.value})} style={iS}/></div>
          <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Конец</label><input type="date" value={editGoalData.end_date||""} onChange={e=>setEditGoalData({...editGoalData,end_date:e.target.value})} style={iS}/></div>
          <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Цвет</label><div style={{display:"flex",gap:4,marginTop:2}}>{COLORS.map((c:string)=><button key={c} onClick={()=>setEditGoalData({...editGoalData,color:c})} style={{width:22,height:22,borderRadius:6,background:c,border:(editGoalData.color||C.a)===c?"3px solid #111":"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
          <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Описание</label><textarea value={editGoalData.description||""} onChange={e=>setEditGoalData({...editGoalData,description:e.target.value})} rows={2} style={{...iS,resize:"none"}}/></div>
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
                boxShadow:`0 0 8px 1px ${prgColor(p)}66`,
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
                  boxShadow:p>=m?`0 0 6px ${prgColor(m)}88`:"none",
                  transition:"all 0.4s",zIndex:2,
                }}/>
              ))}
            </div>

            {/* Percent badge */}
            <div style={{
              flexShrink:0,minWidth:52,textAlign:"center",
              padding:"3px 10px",borderRadius:20,
              background:isAchieved?"linear-gradient(135deg,#4ADE80,#16A34A)":prgGradient(p),
              boxShadow:`0 2px 8px ${prgColor(p)}44`,
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
              style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,border:`1px solid ${pr.color}33`,background:pr.color+"10",cursor:"pointer",fontSize:11,fontWeight:600,color:pr.color}}>
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
        {gTasks.map((t:any,ti:number)=>{
          const isDone=t.status==="done"||t.done;
          const isEditing=editingTaskId===t.id;

          if(isEditing){
            return <EditTaskForm key={t.id} task={t} goalId={g.id} onClose={()=>setEditingTaskId(null)} goalTasks={goalTasks} TYPES={TYPES}/>;
          }

          return <div key={t.id}
            style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,
              background:isDone?"#F0FDF4":
                taskUrgency(t).kind==="burning"?"#FFF1F1":
                taskUrgency(t).kind==="deferrable"?"#FFFBEB":C.w,
              marginBottom:6,
              border:"1px solid "+(
                taskUrgency(t).kind==="burning"?"#FCA5A5":
                taskUrgency(t).kind==="deferrable"?"#FDE68A":C.bd),
              borderLeft:"3px solid "+(
                taskUrgency(t).kind==="burning"?"#EF4444":
                taskUrgency(t).kind==="deferrable"?"#F59E0B":
                t.type==="biz"?C.a:t.type==="delegate"?C.t2:C.y),
              transition:"box-shadow 0.15s",
              boxShadow:
                taskUrgency(t).kind==="burning"?"0 0 12px rgba(239,68,68,0.18), 0 0 0 1px rgba(239,68,68,0.12)":
                taskUrgency(t).kind==="deferrable"?"0 0 8px rgba(245,158,11,0.12)":"none",
              animation:taskUrgency(t).kind==="burning"?"burningGlow 2s ease-in-out infinite":"none",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 2px 8px rgba(0,0,0,0.08)";}}
            onMouseLeave={e=>{
              const u=taskUrgency(t);
              (e.currentTarget as HTMLElement).style.boxShadow=
                u.kind==="burning"?"0 0 12px rgba(239,68,68,0.18)":
                u.kind==="deferrable"?"0 0 8px rgba(245,158,11,0.12)":"none";
            }}>
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
                {taskUrgency(t).kind==="burning"&&!isDone&&(
                  <span style={{fontSize:10,fontWeight:800,color:"#EF4444",background:"#FEE2E2",borderRadius:6,padding:"1px 7px",whiteSpace:"nowrap",letterSpacing:0.3,border:"1px solid #FCA5A5"}}>
                    🔥 ГОРИТ{taskUrgency(t).daysLeft!==null&&taskUrgency(t).daysLeft!<0?` (${Math.abs(taskUrgency(t).daysLeft!)} дн. назад)`:taskUrgency(t).daysLeft===0?" (сегодня)":""}
                  </span>
                )}
                {taskUrgency(t).kind==="deferrable"&&!isDone&&(
                  <span style={{fontSize:10,fontWeight:700,color:"#D97706",background:"#FEF3C7",borderRadius:6,padding:"1px 7px",whiteSpace:"nowrap",letterSpacing:0.3,border:"1px solid #FDE68A"}}>
                    ⏸ МОЖНО ОТЛОЖИТЬ
                  </span>
                )}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:10,color:C.t2}}>{t.mins}м</span>
                {t.date&&<span style={{fontSize:10,color:taskUrgency(t).kind==="burning"?"#EF4444":taskUrgency(t).kind==="deferrable"?"#D97706":C.t2,fontWeight:taskUrgency(t).kind!=="normal"?600:400}}>📅 {t.date.substring(5)}</span>}
                <Tag label={tsLbl(t.status||"todo")} color={tsCol(t.status||"todo")}/>
              </div>
            </div>

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
        <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Название *</label><input value={newGoal.name} onChange={e=>sNewGoal({...newGoal,name:e.target.value})} style={iS} placeholder="Запустить воронку..."/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Начало</label><input type="date" value={newGoal.start_date} onChange={e=>sNewGoal({...newGoal,start_date:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Дедлайн</label><input type="date" value={newGoal.end_date} onChange={e=>sNewGoal({...newGoal,end_date:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Цвет</label><div style={{display:"flex",gap:5,marginTop:2}}>{COLORS.map((c:string)=><button key={c} onClick={()=>sNewGoal({...newGoal,color:c})} style={{width:26,height:26,borderRadius:7,background:c,border:newGoal.color===c?"3px solid #111":"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
        <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Описание</label><textarea value={newGoal.description} onChange={e=>sNewGoal({...newGoal,description:e.target.value})} rows={2} style={{...iS,resize:"none"}}/></div>
      </div>
      <div style={{display:"flex",gap:8}}><Btn onClick={addChildGoal}>Создать</Btn><Btn primary={false} onClick={()=>setShowNewGoal(false)}>Отмена</Btn></div>
    </div>}

    {/* Goals grouped by priority (active only) */}
    <div style={{padding:"16px 24px",display:"flex",flexDirection:"column",gap:16}}>
      {childGoals.filter((g:any)=>goalProgress(g.id)<100).length===0&&
        <div style={{padding:"32px 0",textAlign:"center",color:C.t2,fontSize:14}}>Создай первую цель</div>}

      {Object.entries(PRIORITIES).map(([pKey,pInfo])=>{
        const group=(groupedGoals[pKey]||[]).filter((g:any)=>goalProgress(g.id)<100);
        if(group.length===0)return null;
        return <div key={pKey}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:14,animation:pKey==="urgent"?"pulse 1.5s ease-in-out infinite":"none"}}>{pInfo.icon}</span>
            <span style={{fontSize:12,fontWeight:700,color:pInfo.color,textTransform:"uppercase",letterSpacing:0.5}}>{pInfo.label}</span>
            <span style={{fontSize:11,background:pInfo.color+"15",color:pInfo.color,borderRadius:20,padding:"1px 8px",fontWeight:600}}>{group.length}</span>
            <div style={{flex:1,height:1,background:pInfo.color+"20"}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {group.map((g:any)=><GoalCard key={g.id} g={g} isAchieved={false}/>)}
          </div>
        </div>;
      })}

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
        background:isDone?"#F0FDF4":
          (()=>{const u=taskUrgency(t);return u.kind==="burning"?"#FFF1F1":u.kind==="deferrable"?"#FFFBEB":C.bg;})(),
        borderLeft:"3px solid "+(
          (()=>{const u=taskUrgency(t);return u.kind==="burning"?"#EF4444":u.kind==="deferrable"?"#F59E0B":typeColor(t.type);})()),
        border:(()=>{const u=taskUrgency(t);return u.kind==="burning"?"1px solid #FCA5A5":u.kind==="deferrable"?"1px solid #FDE68A":"none";})(),
        opacity:isKanbanDragging?0.4:1,
        boxShadow:isKanbanOver?"0 0 0 2px "+C.a:isKanbanDragging?"0 4px 16px rgba(0,0,0,0.15)":
          (()=>{const u=taskUrgency(t);return u.kind==="burning"?"0 0 10px rgba(239,68,68,0.15)":u.kind==="deferrable"?"0 0 8px rgba(245,158,11,0.1)":"none";})(),
        cursor:canDrag?"grab":"default",
        transition:"opacity 0.15s,box-shadow 0.15s",
        animation:(()=>{const u=taskUrgency(t);return u.kind==="burning"&&!isDone?"burningGlow 2s ease-in-out infinite":"none";})(),
      }}>
      {canDrag&&<span style={{fontSize:13,color:C.t2,cursor:"grab",userSelect:"none",flexShrink:0,opacity:0.5}}>⠿</span>}
      <button onClick={()=>cycleTaskStatus(t)} title={tsLbl(status)} style={{width:20,height:20,minWidth:20,borderRadius:6,border:"2px solid "+statusColor,background:isDone?C.g:status==="inprogress"?C.y+"33":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {isDone&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        {status==="inprogress"&&<div style={{width:8,height:8,borderRadius:2,background:C.y}}/>}
      </button>
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setActiveModal({task:t,type:t.fromGoal?"goal":"kanban"})}>
        <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
          <span style={{fontSize:12,fontWeight:500,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</span>
          {taskUrgency(t).kind==="burning"&&!isDone&&<span style={{fontSize:9,fontWeight:800,color:"#EF4444",background:"#FEE2E2",borderRadius:4,padding:"1px 5px",whiteSpace:"nowrap",border:"1px solid #FCA5A5"}}>🔥 ГОРИТ</span>}
          {taskUrgency(t).kind==="deferrable"&&!isDone&&<span style={{fontSize:9,fontWeight:700,color:"#D97706",background:"#FEF3C7",borderRadius:4,padding:"1px 5px",whiteSpace:"nowrap",border:"1px solid #FDE68A"}}>⏸ ОТЛОЖИ</span>}
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
    if(stratTab==="calendar"){
      const calTaskList=[...calTasks.data].map((t:any)=>`- ${t.text} (${t.start_date} ${t.start_time||""}–${t.end_time||""}, приоритет: ${t.priority||"medium"})`).join("\n");
      return`[Контекст: Календарь задач]\n${calTaskList||"Задач нет"}`;
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

  // ── Calendar state ──
  const[calMode,setCalMode]=useState<"month"|"week"|"day">("week");
  const[calDate,setCalDate]=useState(()=>new Date());
  const[calModal,setCalModal]=useState<any>(null);
  const[calForm,setCalForm]=useState({text:"",description:"",start_date:"",end_date:"",start_time:"09:00",end_time:"10:00",priority:"medium",assignee:"",auto_placed:false});
  const[calDeleteId,setCalDeleteId]=useState<string|null>(null);
  const[dragCalId,setDragCalId]=useState<string|null>(null);

  const calTasks=useTable("cal_tasks",userId);

  const allCalTasks=useMemo(()=>[
    ...calTasks.data,
    ...kanban.data.filter((t:any)=>t.date).map((t:any)=>({
      ...t,start_date:t.date,end_date:t.date,
      start_time:"09:00",end_time:`${String(9+Math.ceil((t.mins||60)/60)).padStart(2,"0")}:00`,
      fromKanban:true,priority:"medium"
    })),
    ...goalTasks.data.filter((t:any)=>t.date).map((t:any)=>({
      ...t,start_date:t.date,end_date:t.date,
      start_time:"10:00",end_time:`${String(10+Math.ceil((t.mins||60)/60)).padStart(2,"0")}:00`,
      fromGoal:true,priority:"medium"
    })),
  ],[calTasks.data,kanban.data,goalTasks.data]);

  const tasksForCalDay=(dateStr:string)=>allCalTasks.filter((t:any)=>t.start_date<=dateStr&&(t.end_date||t.start_date)>=dateStr);

  const navCal=(dir:1|-1)=>{
    const d=new Date(calDate);
    if(calMode==="month"){d.setMonth(d.getMonth()+dir);}
    else if(calMode==="week"){d.setDate(d.getDate()+dir*7);}
    else{d.setDate(d.getDate()+dir);}
    setCalDate(d);
  };

  const PRIORITY_COLORS:Record<string,string>={low:"#10B981",medium:"#2563EB",high:"#EF4444"};
  const PRIORITY_LABELS:Record<string,string>={low:"Низкий",medium:"Средний",high:"Высокий"};
  const HOURS=Array.from({length:24},(_,i)=>i); // 0..23

  const timeToMin=(t:string)=>{const[h,m]=(t||"00:00").split(":").map(Number);return h*60+(m||0);};
  const minToTime=(m:number)=>`${String(Math.floor(m/60)%24).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
  const timeDiff=(s:string,e:string)=>{const d=timeToMin(e)-timeToMin(s);return d>0?d:0;};
  const fmtDur=(mins:number)=>mins>=60?`${Math.floor(mins/60)}ч${mins%60?` ${mins%60}м`:""}`:` ${mins}м`;

  // Find first free slot in working hours for a given date
  const findFreeSlot=(dateStr:string,durMin=60):{start:string;end:string;auto:boolean}=>{
    const WORK_START=10*60; // 10:00
    const WORK_END=19*60;   // 19:00
    const dayTasks=allCalTasks.filter((t:any)=>(t.start_date||"")<=dateStr&&(t.end_date||t.start_date||"")>=dateStr);
    const busy=dayTasks.map((t:any)=>({s:timeToMin(t.start_time||"09:00"),e:timeToMin(t.end_time||"10:00")}))
      .sort((a:any,b:any)=>a.s-b.s);
    // Try every 15-min slot
    for(let s=WORK_START;s+durMin<=WORK_END;s+=15){
      const e=s+durMin;
      const overlap=busy.some((b:any)=>s<b.e&&e>b.s);
      if(!overlap)return{start:minToTime(s),end:minToTime(e),auto:true};
    }
    // All busy — fallback to 10:00 with overlap
    return{start:"10:00",end:minToTime(WORK_START+durMin),auto:true};
  };

  const openCalNew=(dateStr?:string,hour?:number)=>{
    const d=dateStr||today();
    if(hour!=null){
      // Clicked a specific hour slot — use exact time
      setCalForm({text:"",description:"",start_date:d,end_date:d,start_time:`${String(hour).padStart(2,"0")}:00`,end_time:`${String(hour+1).padStart(2,"0")}:00`,priority:"medium",assignee:"",auto_placed:false});
    } else {
      // Smart placement
      const slot=findFreeSlot(d);
      setCalForm({text:"",description:"",start_date:d,end_date:d,start_time:slot.start,end_time:slot.end,priority:"medium",assignee:"",auto_placed:true});
    }
    setCalModal("new");
  };
  const openCalEdit=(t:any)=>{
    setCalForm({text:t.text||"",description:t.description||"",start_date:t.start_date||"",end_date:t.end_date||t.start_date||"",start_time:t.start_time||"09:00",end_time:t.end_time||"10:00",priority:t.priority||"medium",assignee:t.assignee||"",auto_placed:t.auto_placed||false});
    setCalModal(t);
  };
  const saveCalTask=async()=>{
    if(!calForm.text.trim())return;
    const isEdit=calModal&&calModal!=="new";
    const payload={
      text:calForm.text,description:calForm.description,
      start_date:calForm.start_date,end_date:calForm.end_date||calForm.start_date,
      start_time:calForm.start_time,end_time:calForm.end_time,
      priority:calForm.priority,assignee:calForm.assignee,
      auto_placed:false, // once saved from modal = intentionally placed
      manually_placed:true,
    };
    if(calModal==="new"){await calTasks.add(payload);}
    else if(isEdit&&!calModal.fromKanban&&!calModal.fromGoal){await calTasks.update(calModal.id,payload);}
    setCalModal(null);
  };
  const deleteCalTask=async()=>{if(calDeleteId){await calTasks.remove(calDeleteId);setCalDeleteId(null);}};

  const SLOT_H=56;
  const DAY_START=7;
  const DAY_HOURS=16;

  const calDragRef=useRef<{id:string;startY:number;startMin:number;dur:number;origDate:string;colW:number;gridLeft:number;gridTop:number}|null>(null);
  const calResizeRef=useRef<{id:string;startY:number;origEndMin:number;startMin:number}|null>(null);
  const[calDragOver,setCalDragOver]=useState<{dateStr:string;min:number}|null>(null);
  const[inlineEdit,setInlineEdit]=useState<{id:string;text:string}|null>(null);
  const[isDraggingCal,setIsDraggingCal]=useState(false);
  const[isResizingCal,setIsResizingCal]=useState(false);

  const toggleCalDone=async(t:any)=>{
    const done=!(t.status==="done"||t.done);
    if(t.fromKanban){await kanban.update(t.id,{status:done?"done":"todo"});}
    else if(t.fromGoal){await goalTasks.update(t.id,{status:done?"done":"todo",done});}
    else{await calTasks.update(t.id,{status:done?"done":"todo",done});}
  };

  const moveCalTask=async(t:any,newDateStr:string,newStartMin:number)=>{
    const dur=timeToMin(t.end_time||"10:00")-timeToMin(t.start_time||"09:00");
    const newStart=minToTime(Math.max(DAY_START*60,Math.min((DAY_START+DAY_HOURS-1)*60,newStartMin)));
    const newEnd=minToTime(Math.max(DAY_START*60+30,Math.min((DAY_START+DAY_HOURS)*60,newStartMin+Math.max(30,dur))));
    if(t.fromKanban){await kanban.update(t.id,{date:newDateStr,start_time:newStart,end_time:newEnd});}
    else if(t.fromGoal){await goalTasks.update(t.id,{date:newDateStr,start_time:newStart,end_time:newEnd});}
    else{await calTasks.update(t.id,{start_date:newDateStr,end_date:newDateStr,start_time:newStart,end_time:newEnd});}
  };

  const resizeCalTask=async(t:any,newEndMin:number)=>{
    const startMin=timeToMin(t.start_time||"09:00");
    const clamped=Math.max(startMin+15,Math.min((DAY_START+DAY_HOURS)*60,newEndMin));
    const newEnd=minToTime(Math.round(clamped/15)*15);
    if(t.fromKanban){await kanban.update(t.id,{end_time:newEnd});}
    else if(t.fromGoal){await goalTasks.update(t.id,{end_time:newEnd});}
    else{await calTasks.update(t.id,{end_time:newEnd});}
  };

  // Keep live refs to avoid stale closures
  const allCalTasksRef=useRef(allCalTasks);
  useEffect(()=>{allCalTasksRef.current=allCalTasks;},[allCalTasks]);
  const calDragOverRef=useRef<{dateStr:string;min:number}|null>(null);

  // Global mouse handlers — mounted once, use refs for all live data
  useEffect(()=>{
    const onMove=(e:MouseEvent)=>{
      // ── DRAG ──
      if(calDragRef.current){
        const{dur,origDate,colW,gridLeft,gridTop,_days}=calDragRef.current as any;
        const dy=e.clientY-gridTop-48;
        const rawMin=Math.round(((dy/SLOT_H)*60+DAY_START*60)/15)*15;
        const newStartMin=Math.max(DAY_START*60,Math.min((DAY_START+DAY_HOURS-1)*60,rawMin));

        const dx=e.clientX-gridLeft-52;
        const days=_days as string[];
        const colIdx=Math.max(0,Math.min(days.length-1,Math.floor(dx/colW)));
        const dateStr=days[colIdx]||origDate;

        calDragOverRef.current={dateStr,min:newStartMin};
        setCalDragOver({dateStr,min:newStartMin});
        setIsDraggingCal(true);

        // Live DOM move
        const el=document.getElementById(`cal-block-${calDragRef.current.id}`);
        if(el){
          el.style.top=Math.max(0,(newStartMin-DAY_START*60)/60*SLOT_H)+"px";
          el.style.opacity="0.45";
        }
      }
      // ── RESIZE ──
      if(calResizeRef.current){
        const{id,startMin}=calResizeRef.current;
        const gridEl=document.getElementById("cal-timegrid");
        if(!gridEl)return;
        const rect=gridEl.getBoundingClientRect();
        const dy=e.clientY-rect.top-48;
        const rawMin=Math.round(((dy/SLOT_H)*60+DAY_START*60)/15)*15;
        const newEndMin=Math.max(startMin+15,Math.min((DAY_START+DAY_HOURS)*60,rawMin));
        calResizeRef.current.origEndMin=newEndMin;
        setIsResizingCal(true);

        // Live DOM resize
        const el=document.getElementById(`cal-block-${id}`);
        if(el){
          const newH=Math.max(20,(newEndMin-startMin)/60*SLOT_H-2);
          el.style.height=newH+"px";
          const label=el.querySelector(".cal-time-label") as HTMLElement;
          if(label){
            const t=allCalTasksRef.current.find((tt:any)=>tt.id===id);
            if(t)label.textContent=`${t.start_time||"09:00"}–${minToTime(newEndMin)} · ${fmtDur(newEndMin-timeToMin(t.start_time||"09:00"))}`;
          }
        }
      }
    };

    const onUp=async(e:MouseEvent)=>{
      // ── Finish DRAG ──
      if(calDragRef.current){
        const id=calDragRef.current.id;
        const drop=calDragOverRef.current;
        const el=document.getElementById(`cal-block-${id}`);
        if(el){el.style.opacity="1";el.style.top="";}
        if(drop){
          const t=allCalTasksRef.current.find((tt:any)=>tt.id===id);
          if(t){
            const dur=timeToMin(t.end_time||"10:00")-timeToMin(t.start_time||"09:00");
            const newStart=minToTime(Math.max(DAY_START*60,drop.min));
            const newEnd=minToTime(Math.max(DAY_START*60+30,drop.min+Math.max(30,dur)));
            if(t.fromKanban)await kanban.update(id,{date:drop.dateStr,start_time:newStart,end_time:newEnd});
            else if(t.fromGoal)await goalTasks.update(id,{date:drop.dateStr,start_time:newStart,end_time:newEnd});
            else await calTasks.update(id,{start_date:drop.dateStr,end_date:drop.dateStr,start_time:newStart,end_time:newEnd,auto_placed:false,manually_placed:true});
          }
        }
        calDragRef.current=null;
        calDragOverRef.current=null;
        setDragCalId(null);setCalDragOver(null);setIsDraggingCal(false);
      }
      // ── Finish RESIZE ──
      if(calResizeRef.current){
        const{id,origEndMin,startMin}=calResizeRef.current;
        const t=allCalTasksRef.current.find((tt:any)=>tt.id===id);
        if(t&&origEndMin>startMin){
          const newEnd=minToTime(Math.round(origEndMin/15)*15);
          if(t.fromKanban)await kanban.update(id,{end_time:newEnd});
          else if(t.fromGoal)await goalTasks.update(id,{end_time:newEnd});
          else await calTasks.update(id,{end_time:newEnd});
        }
        calResizeRef.current=null;setIsResizingCal(false);
      }
    };

    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[]); // mount once — all data via refs

  // Week/Day time-grid view
  const TimeGrid=({days:gridDays}:{days:string[]})=>{
    const tdStr=today();
    const nowMin=new Date().getHours()*60+new Date().getMinutes();
    const nowTop=((nowMin-DAY_START*60)/60)*SLOT_H;
    const gridRef2=useRef<HTMLDivElement>(null);

    return<div id="cal-timegrid" className="yearmap-table" ref={gridRef2}
      style={{display:"flex",background:C.w,borderRadius:16,border:"1px solid "+C.bd,overflow:"hidden",userSelect:isDraggingCal||isResizingCal?"none":"auto",cursor:isResizingCal?"ns-resize":isDraggingCal?"grabbing":"default"}}>

      {/* Time gutter */}
      <div style={{width:52,flexShrink:0,borderRight:"1px solid "+C.bd,paddingTop:48}}>
        {Array.from({length:DAY_HOURS},(_,i)=>i+DAY_START).map(h=>(
          <div key={h} style={{height:SLOT_H,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:8,paddingTop:2}}>
            <span style={{fontSize:10,color:C.t2,fontWeight:500}}>{String(h).padStart(2,"0")}:00</span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div style={{flex:1,display:"grid",gridTemplateColumns:`repeat(${gridDays.length},1fr)`}}>
        {gridDays.map((dateStr,colIdx)=>{
          const isToday=dateStr===tdStr;
          const dt=new Date(dateStr+"T12:00:00");
          const dayTaskList=tasksForCalDay(dateStr);
          const isDragTarget=calDragOver?.dateStr===dateStr;

          return<div key={dateStr} style={{borderRight:"1px solid "+C.bd,position:"relative",background:isDragTarget?"rgba(37,99,235,0.02)":"transparent"}}>
            {/* Day header */}
            <div style={{height:48,borderBottom:"1px solid "+C.bd,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"sticky",top:0,zIndex:2,background:isToday?"rgba(37,99,235,0.05)":C.w}}>
              <span style={{fontSize:10,color:isToday?C.a:C.t2,fontWeight:600,textTransform:"uppercase"}}>{["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][dt.getDay()]}</span>
              <div style={{width:28,height:28,borderRadius:"50%",background:isToday?C.a:"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                <span style={{fontSize:14,fontWeight:700,color:isToday?"#fff":C.t1}}>{dt.getDate()}</span>
              </div>
            </div>

            {/* Hour slots */}
            <div style={{position:"relative",height:DAY_HOURS*SLOT_H}}>
              {Array.from({length:DAY_HOURS},(_,i)=>(
                <div key={i} onClick={()=>{if(!isDraggingCal&&!isResizingCal)openCalNew(dateStr,i+DAY_START);}}
                  style={{height:SLOT_H,borderBottom:"1px solid rgba(0,0,0,0.04)",cursor:"pointer",transition:"background 0.1s"}}
                  onMouseEnter={e=>{if(!isDraggingCal&&!isResizingCal)(e.currentTarget as HTMLElement).style.background="rgba(37,99,235,0.03)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}/>
              ))}

              {/* DnD drop preview */}
              {isDragTarget&&calDragOver&&(
                <div style={{position:"absolute",left:4,right:4,top:((calDragOver.min-DAY_START*60)/60)*SLOT_H,height:2,background:C.a,borderRadius:2,zIndex:20,pointerEvents:"none",boxShadow:`0 0 8px ${C.a}60`}}/>
              )}

              {/* Now line */}
              {isToday&&nowTop>0&&nowTop<DAY_HOURS*SLOT_H&&(
                <div style={{position:"absolute",left:0,right:0,top:nowTop,zIndex:3,display:"flex",alignItems:"center",pointerEvents:"none"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:C.r,flexShrink:0,marginLeft:-4}}/>
                  <div style={{flex:1,height:2,background:C.r}}/>
                </div>
              )}

              {/* Task blocks */}
              {dayTaskList.map((t:any,ti:number)=>{
                const st=timeToMin(t.start_time||"09:00");
                const et=timeToMin(t.end_time||"10:00");
                const top=Math.max(0,((st-DAY_START*60)/60)*SLOT_H);
                const height=Math.max(24,((et-st)/60)*SLOT_H-2);
                const isDone=t.status==="done"||t.done;
                const isAuto=t.auto_placed&&!t.fromKanban&&!t.fromGoal;
                const color=isDone?"#22C55E":(PRIORITY_COLORS[t.priority||"medium"]||C.a);
                const dur=et-st;
                const overlap=dayTaskList.filter((_:any,j:number)=>j<ti&&tasksOverlap(t,dayTaskList[j])).length;
                const wPct=overlap?`calc(88% - ${overlap*10}px)`:"94%";
                const lPct=overlap?`${overlap*10}px`:"2px";
                const isEditingThis=inlineEdit?.id===t.id;
                const canDrag=!isEditingThis;

                return<div key={t.id} id={`cal-block-${t.id}`}
                  style={{
                    position:"absolute",top,left:lPct,width:wPct,height,
                    background:isDone?"rgba(34,197,94,0.09)":isAuto?`${color}0A`:`${color}14`,
                    border:isAuto?`1.5px dashed ${color}55`:`1.5px solid ${color}40`,
                    borderLeft:`3px solid ${color}`,
                    borderRadius:7,padding:"4px 6px 4px 8px",
                    cursor:canDrag?"grab":"default",
                    overflow:"hidden",zIndex:ti+1,
                    opacity:isAuto?0.85:1,
                    transition:"box-shadow 0.15s,opacity 0.2s",
                    boxShadow:isDone?`0 0 8px rgba(34,197,94,0.15)`:"0 1px 4px rgba(0,0,0,0.08)",
                  }}
                  onMouseDown={e=>{
                    if(e.target instanceof HTMLButtonElement)return;
                    if(e.target instanceof HTMLInputElement)return;
                    if((e.target as HTMLElement).classList.contains("resize-handle"))return;
                    if(!canDrag)return;
                    e.preventDefault();
                    const gridRect=document.getElementById("cal-timegrid")?.getBoundingClientRect();
                    if(!gridRect)return;
                    const colW=(gridRect.width-52)/gridDays.length;
                    // Store days array reference for column detection
                    (calDragRef as any).current={
                      id:t.id,startY:e.clientY,startMin:st,dur,origDate:dateStr,
                      colW,gridLeft:gridRect.left,gridTop:gridRect.top,
                      _days:gridDays,
                    };
                    setDragCalId(t.id);
                  }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow=`0 2px 16px ${color}40`;(e.currentTarget as HTMLElement).style.zIndex="50";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow=isDone?"0 0 8px rgba(34,197,94,0.15)":"0 1px 4px rgba(0,0,0,0.08)";(e.currentTarget as HTMLElement).style.zIndex=String(ti+1);}}>

                  {/* Checkbox + title */}
                  <div style={{display:"flex",alignItems:"flex-start",gap:5,minWidth:0}}>
                    <button onClick={e=>{e.stopPropagation();toggleCalDone(t);}}
                      style={{width:14,height:14,minWidth:14,borderRadius:4,border:`1.5px solid ${isDone?"#22C55E":color}`,background:isDone?"#22C55E":"transparent",cursor:"pointer",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",boxShadow:isDone?"0 0 6px rgba(34,197,94,0.4)":"none"}}>
                      {isDone&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>

                    {isEditingThis&&inlineEdit
                      ?<input autoFocus value={inlineEdit.text}
                          onChange={e=>setInlineEdit(p=>p?{...p,text:e.target.value}:p)}
                          onBlur={async()=>{
                            const txt=inlineEdit?.text||t.text;
                            if(t.fromKanban)await kanban.update(t.id,{text:txt});
                            else if(t.fromGoal)await goalTasks.update(t.id,{text:txt});
                            else await calTasks.update(t.id,{text:txt});
                            setInlineEdit(null);
                          }}
                          onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape")e.currentTarget.blur();e.stopPropagation();}}
                          onClick={e=>e.stopPropagation()}
                          style={{flex:1,border:"none",background:"transparent",fontSize:11,fontWeight:700,color,outline:"none",fontFamily:"'Montserrat',sans-serif",minWidth:0,padding:0}}/>
                      :<div style={{flex:1,fontSize:11,fontWeight:700,color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:isDone?"line-through":"none",lineHeight:1.3,cursor:"text"}}
                          onDoubleClick={e=>{e.stopPropagation();setInlineEdit({id:t.id,text:t.text||""});}}
                          onClick={e=>{e.stopPropagation();if(!isDraggingCal&&!t.fromKanban&&!t.fromGoal)openCalEdit(t);}}>
                          {t.text}
                        </div>
                    }
                  </div>

                  {/* Time label */}
                  {height>30&&<div className="cal-time-label" style={{fontSize:9,color:`${color}bb`,marginTop:2,paddingLeft:19}}>{t.start_time||"09:00"}–{t.end_time||"10:00"}{dur>0?` · ${fmtDur(dur)}`:""}</div>}
                  {height>44&&(t.fromKanban||t.fromGoal)&&<div style={{fontSize:9,color:`${color}88`,marginTop:1,paddingLeft:19}}>🔗 {t.fromGoal?"Цель":"Спринт"}</div>}

                  {/* Resize handle */}
                  <div className="resize-handle"
                    onMouseDown={e=>{
                      e.stopPropagation();e.preventDefault();
                      calResizeRef.current={id:t.id,startY:e.clientY,origEndMin:et,startMin:st};
                      setIsResizingCal(true);
                    }}
                    style={{position:"absolute",bottom:0,left:0,right:0,height:10,cursor:"ns-resize",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}
                    onClick={e=>e.stopPropagation()}>
                    <div style={{width:28,height:3,borderRadius:99,background:`${color}50`}}/>
                  </div>
                </div>;
              })}
            </div>
          </div>;
        })}
      </div>
    </div>;
  };


  // Week/Day time-grid view (Google Calendar style)

  // helper: do two timed tasks overlap?
  const tasksOverlap=(a:any,b:any)=>{
    const as=timeToMin(a.start_time||"09:00"),ae=timeToMin(a.end_time||"10:00");
    const bs=timeToMin(b.start_time||"09:00"),be=timeToMin(b.end_time||"10:00");
    return as<be&&ae>bs;
  };

  const CalendarView=()=>{
    const tdStr=today();

    if(calMode==="month"){
      const y=calDate.getFullYear(),m=calDate.getMonth();
      const firstDay=new Date(y,m,1).getDay();
      const daysInMonth=new Date(y,m+1,0).getDate();
      const startOffset=firstDay===0?6:firstDay-1; // Mon-first
      const cells:Array<{date:string|null}>=[];
      for(let i=0;i<startOffset;i++)cells.push({date:null});
      for(let d=1;d<=daysInMonth;d++){
        const ds2=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        cells.push({date:ds2});
      }
      while(cells.length%7!==0)cells.push({date:null});

      return<div className="yearmap-table" style={{background:C.w,borderRadius:16,border:"1px solid "+C.bd,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid "+C.bd,background:C.ib}}>
          {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(wd=>(
            <div key={wd} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.t2,padding:"10px 0",letterSpacing:0.5}}>{wd}</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {cells.map((cell,i)=>{
            if(!cell.date)return<div key={i} style={{minHeight:110,borderRight:"1px solid "+C.bd+"66",borderBottom:"1px solid "+C.bd+"66",background:C.ib,opacity:0.5}}/>;
            const dayTasks=tasksForCalDay(cell.date);
            const isToday=cell.date===tdStr;
            const isPast=cell.date<tdStr;
            return<div key={cell.date}
              onClick={()=>openCalNew(cell.date||undefined)}
              style={{minHeight:110,borderRight:"1px solid "+C.bd+"66",borderBottom:"1px solid "+C.bd+"66",padding:"6px 4px",cursor:"pointer",
                background:isToday?"rgba(37,99,235,0.03)":"transparent",transition:"background 0.1s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=isToday?"rgba(37,99,235,0.06)":C.ib;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=isToday?"rgba(37,99,235,0.03)":"transparent";}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:4}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:isToday?C.a:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?"#fff":isPast?C.t2:C.t1}}>{parseInt(cell.date.split("-")[2])}</span>
                </div>
              </div>
              {dayTasks.slice(0,3).map((t:any)=>{
                const color=t.status==="done"||t.done?"#22C55E":(PRIORITY_COLORS[t.priority||"medium"]||C.a);
                const isAuto=t.auto_placed&&!t.manually_placed;
                const isDone=t.status==="done"||t.done;
                return<div key={t.id}
                  onClick={e=>{e.stopPropagation();openCalEdit(t);}}
                  style={{
                    fontSize:10,fontWeight:500,padding:"2px 5px",borderRadius:4,marginBottom:2,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    background:isDone?"rgba(34,197,94,0.08)":isAuto?color+"10":color+"16",
                    color:isDone?"#22C55E":color,
                    borderLeft:`2px solid ${isDone?"#22C55E":color}`,
                    border:isAuto?`1px dashed ${color}50`:undefined,
                    textDecoration:isDone?"line-through":"none",
                    opacity:isDone?0.7:1,
                  }}>
                  {isDone&&"✓ "}{t.start_time&&<span style={{opacity:0.6}}>{t.start_time} </span>}{t.text}
                </div>;
              })}
              {dayTasks.length>3&&<div style={{fontSize:9,color:C.t2,paddingLeft:4,cursor:"pointer"}} onClick={e=>{e.stopPropagation();setCalMode("day");setCalDate(new Date(cell.date!));}}
                >+{dayTasks.length-3} ещё</div>}
            </div>;
          })}
        </div>
      </div>;
    }

    if(calMode==="week"){
      const startOfWeek=new Date(calDate);
      const dow=startOfWeek.getDay()===0?6:startOfWeek.getDay()-1; // Mon-based
      startOfWeek.setDate(calDate.getDate()-dow);
      const weekDays=Array.from({length:7},(_,i)=>{const d=new Date(startOfWeek);d.setDate(startOfWeek.getDate()+i);return ds(d);});
      return<div style={{overflowX:"auto"}}><div style={{minWidth:640}}><TimeGrid days={weekDays}/></div></div>;
    }

    // Day view
    return<TimeGrid days={[ds(calDate)]}/>;
  };

  const calTitle=()=>{
    if(calMode==="month")return`${MR[calDate.getMonth()].charAt(0).toUpperCase()+MR[calDate.getMonth()].slice(1)} ${calDate.getFullYear()}`;
    if(calMode==="week"){const s=new Date(calDate);s.setDate(calDate.getDate()-calDate.getDay());const e=new Date(s);e.setDate(s.getDate()+6);return`${s.getDate()} ${MR[s.getMonth()].substring(0,3)} — ${e.getDate()} ${MR[e.getMonth()].substring(0,3)} ${e.getFullYear()}`;}
    return`${calDate.getDate()} ${MR[calDate.getMonth()]} ${calDate.getFullYear()}`;
  };

  return <>
    {/* Vizzy AI toggle tab */}
    <div onClick={()=>setVizzyOpen(!vizzyOpen)} style={{position:"fixed",right:vizzyOpen?376:0,top:"40%",transform:"translateY(-50%)",background:`linear-gradient(135deg,${VIZZY_ACCENT},#7C3AED)`,width:32,height:120,borderRadius:"12px 0 0 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"-4px 0 20px rgba(167,139,250,0.35)",zIndex:110,transition:"right 0.3s ease"}}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      <div style={{writingMode:"vertical-rl",textOrientation:"mixed",transform:"rotate(180deg)",fontSize:10,fontWeight:700,color:"#fff",letterSpacing:1}}>VIZZY AI</div>
    </div>

    {/* Vizzy AI EA Chat panel */}
    <div style={{position:"fixed",right:0,top:0,bottom:0,width:376,background:"#12101E",borderLeft:"1px solid rgba(167,139,250,0.18)",transform:vizzyOpen?"translateX(0)":"translateX(100%)",transition:"transform 0.3s ease",zIndex:105,display:"flex",flexDirection:"column",fontFamily:"'Montserrat',sans-serif"}}>

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
              Executive Assistant · {stratTab==="sprint"?"Спринт":stratTab==="yearmap"?"Карта года":"Календарь"}
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
            style={{flex:1,border:"1px solid rgba(167,139,250,0.25)",outline:"none",resize:"none",fontSize:13,fontFamily:"'Montserrat',sans-serif",color:"#fff",background:"rgba(255,255,255,0.05)",lineHeight:1.5,maxHeight:100,overflowY:"auto",borderRadius:10,padding:"9px 12px",transition:"all 0.2s"}}
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

    {/* YEAR MAP */}
    {stratTab==="yearmap"&&<YearMap userId={userId} goals={goals} goalUpdate={goals.update} goalAdd={goals.add} goalTasks={goalTasks}/>}

    {/* CALENDAR */}
    {stratTab==="calendar"&&<>
      {/* Controls row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        {/* Left: nav */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>navCal(-1)} style={{width:34,height:34,borderRadius:9,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={()=>navCal(1)} style={{width:34,height:34,borderRadius:9,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <span style={{fontSize:16,fontWeight:700,color:C.t1,minWidth:200}}>{calTitle()}</span>
          <button onClick={()=>setCalDate(new Date())}
            style={{padding:"6px 14px",background:C.a+"14",color:C.a,border:"1px solid "+C.a+"30",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Сегодня</button>
        </div>

        {/* Right: view switcher + add */}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",background:C.ib,borderRadius:9,padding:3,border:"1px solid "+C.bd,gap:2}}>
            {(["month","week","day"] as const).map(m=>(
              <button key={m} onClick={()=>setCalMode(m)}
                style={{padding:"6px 14px",borderRadius:7,border:"none",
                  background:calMode===m?C.w:"transparent",
                  color:calMode===m?C.t1:C.t2,
                  fontSize:12,fontWeight:calMode===m?600:400,cursor:"pointer",
                  boxShadow:calMode===m?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}}>
                {m==="month"?"Месяц":m==="week"?"Неделя":"День"}
              </button>
            ))}
          </div>
          <button onClick={()=>openCalNew()}
            style={{padding:"8px 18px",background:C.a,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:`0 0 16px ${C.a}30`,transition:"all 0.2s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-1px)";(e.currentTarget as HTMLElement).style.boxShadow=`0 0 24px ${C.a}50`;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="none";(e.currentTarget as HTMLElement).style.boxShadow=`0 0 16px ${C.a}30`;}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            + Задача
          </button>
        </div>
      </div>

      {/* Unscheduled tasks bar — tasks without time */}
      {(()=>{
        const unscheduled=allCalTasks.filter((t:any)=>t.auto_placed&&!t.manually_placed);
        if(!unscheduled.length)return null;
        return <div style={{background:C.y+"10",border:"1px solid "+C.y+"30",borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:12,fontWeight:600,color:C.y}}>⚡ {unscheduled.length} незапланированных задач</span>
          <span style={{fontSize:11,color:C.t2}}>Перетащи их на нужное время в календаре</span>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginLeft:"auto"}}>
            {unscheduled.slice(0,4).map((t:any)=>(
              <div key={t.id} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:C.y+"18",color:C.y,border:"1px dashed "+C.y+"50",fontWeight:500,cursor:"pointer"}}
                onClick={()=>openCalEdit(t)}>
                {t.text}
              </div>
            ))}
          </div>
        </div>;
      })()}

      {/* Calendar grid */}
      <CalendarView/>
    </>}

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

    {/* Calendar task modal */}
    {calModal&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setCalModal(null)}>
        <div data-modal="" style={{background:C.w,borderRadius:20,padding:28,width:"100%",maxWidth:500,boxShadow:"0 24px 60px rgba(0,0,0,0.25)",border:"1px solid "+C.bd}} onClick={e=>e.stopPropagation()}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{fontSize:17,fontWeight:700,color:C.t1}}>{calModal==="new"?"✨ Новая задача":"✏️ Редактировать задачу"}</div>
            {calForm.auto_placed&&calModal==="new"&&(
              <div style={{fontSize:10,fontWeight:600,background:C.y+"15",color:C.y,border:`1px dashed ${C.y}60`,borderRadius:8,padding:"3px 10px",display:"flex",alignItems:"center",gap:5}}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                Авто-размещение
              </div>
            )}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Title */}
            <div>
              <label style={{fontSize:11,fontWeight:600,color:C.t2,display:"block",marginBottom:5,letterSpacing:0.3}}>Название *</label>
              <input autoFocus value={calForm.text} onChange={e=>setCalForm({...calForm,text:e.target.value})}
                onKeyDown={e=>{if(e.key==="Enter")saveCalTask();}}
                placeholder="Что нужно сделать?" style={{...iS,fontSize:14,fontWeight:500}}/>
            </div>

            {/* Description */}
            <div>
              <label style={{fontSize:11,fontWeight:600,color:C.t2,display:"block",marginBottom:5,letterSpacing:0.3}}>Описание <span style={{fontWeight:400,opacity:0.6}}>(необязательно)</span></label>
              <textarea value={calForm.description} onChange={e=>setCalForm({...calForm,description:e.target.value})} rows={2}
                placeholder="Дополнительные детали..." style={{...iS,resize:"vertical"}}/>
            </div>

            {/* Dates */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>📅 Дата начала</label>
                <input type="date" value={calForm.start_date} onChange={e=>setCalForm({...calForm,start_date:e.target.value,end_date:calForm.end_date||e.target.value})} style={iS}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>📅 Дата окончания</label>
                <input type="date" value={calForm.end_date} onChange={e=>setCalForm({...calForm,end_date:e.target.value})} style={iS}/>
              </div>
            </div>

            {/* Time */}
            <div>
              <label style={{fontSize:11,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>⏰ Время <span style={{fontWeight:400,opacity:0.6}}>(необязательно — автоматически найдём свободный слот)</span></label>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center"}}>
                <input type="time" value={calForm.start_time} onChange={e=>{setCalForm({...calForm,start_time:e.target.value,auto_placed:false});}} style={iS}/>
                <span style={{fontSize:12,color:C.t2,textAlign:"center"}}>→</span>
                <input type="time" value={calForm.end_time} onChange={e=>{setCalForm({...calForm,end_time:e.target.value,auto_placed:false});}} style={iS}/>
              </div>
              {calForm.start_time&&calForm.end_time&&timeDiff(calForm.start_time,calForm.end_time)>0&&(
                <div style={{fontSize:11,color:C.a,fontWeight:600,marginTop:6,display:"flex",alignItems:"center",gap:5}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {fmtDur(timeDiff(calForm.start_time,calForm.end_time))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Приоритет</label>
                <div style={{display:"flex",gap:6}}>
                  {[{v:"low",l:"Низкий",c:"#10B981"},{v:"medium",l:"Средний",c:"#2563EB"},{v:"high",l:"Высокий",c:"#EF4444"}].map(p=>(
                    <button key={p.v} onClick={()=>setCalForm({...calForm,priority:p.v})}
                      style={{flex:1,padding:"7px 4px",border:`1px solid ${calForm.priority===p.v?p.c:C.bd}`,borderRadius:9,background:calForm.priority===p.v?p.c+"14":"transparent",color:calForm.priority===p.v?p.c:C.t2,fontSize:10,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Ответственный</label>
                <input value={calForm.assignee} onChange={e=>setCalForm({...calForm,assignee:e.target.value})} placeholder="Имя..." style={iS}/>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"space-between",alignItems:"center"}}>
            <div>
              {calModal!=="new"&&!calModal?.fromKanban&&!calModal?.fromGoal&&(
                <button onClick={()=>{setCalDeleteId(calModal.id);setCalModal(null);}}
                  style={{padding:"8px 14px",background:C.r+"10",color:C.r,border:"1px solid "+C.r+"30",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  Удалить
                </button>
              )}
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>setCalModal(null)} primary={false}>Отмена</Btn>
              <Btn onClick={saveCalTask} disabled={!calForm.text.trim()}>Сохранить</Btn>
            </div>
          </div>
        </div>
      </div>
    )}
    {calDeleteId&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setCalDeleteId(null)}>
        <div style={{background:C.w,borderRadius:16,padding:28,maxWidth:340,width:"100%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:32,marginBottom:12}}>🗑️</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Удалить задачу?</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:20}}>
            <Btn onClick={()=>setCalDeleteId(null)} primary={false}>Отмена</Btn>
            <Btn onClick={deleteCalTask} style={{background:C.r}}>Удалить</Btn>
          </div>
        </div>
      </div>
    )}
    </div>{/* end marginRight wrapper */}
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
  const emptyLead={name:"",contact:"",phone:"",email:"",source:"Instagram",status:"new",note:"",deal:""};
  const[f,sF]=useState<any>(emptyLead);

  // Stage labels per funnel (in-memory; could be persisted)
  const[stageLabels,setStageLabels]=useState<Record<string,Record<string,string>>>({});

  const activeFunnel=funnels.data.find((fu:any)=>fu.id===activeFunnelId)||null;

  // Get stages for the active funnel
  const getStages=(funnelId:string)=>{
    const labels=stageLabels[funnelId]||{};
    return CRM_DEFAULT_STAGES.map(s=>({...s,label:labels[s.id]||s.label}));
  };
  const stages=activeFunnelId?getStages(activeFunnelId):CRM_DEFAULT_STAGES;

  // Leads for the active funnel
  const leads=useMemo(()=>allLeads.data.filter((l:any)=>l.funnel_id===activeFunnelId),[allLeads.data,activeFunnelId]);

  const found=useMemo(()=>{
    if(!search)return leads;
    const q=search.toLowerCase();
    return leads.filter((l:any)=>l.name?.toLowerCase().includes(q)||(l.contact||"").toLowerCase().includes(q)||(l.phone||"").includes(q)||(l.email||"").toLowerCase().includes(q));
  },[leads,search]);

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
    setEditLeadData({name:l.name||"",contact:l.contact||"",phone:l.phone||"",email:l.email||"",note:l.note||"",deal:l.deal||"",source:l.source||"Instagram"});
  };

  const saveEditLead=async()=>{
    if(!editLeadId)return;
    await allLeads.update(editLeadId,{...editLeadData,deal:editLeadData.deal?+editLeadData.deal:null});
    setEditLeadId(null);
  };

  const leadCard=(l:any,stageColor:string)=>{
    const isOpen=openLead===l.id;
    const isEditing=editLeadId===l.id;

    return <div key={l.id}>
      {/* ── Edit modal ── */}
      {isEditing&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setEditLeadId(null)}>
          <div style={{background:C.w,borderRadius:18,padding:28,width:"100%",maxWidth:480,border:"1px solid "+C.bd,boxShadow:"0 24px 60px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:C.t1,marginBottom:20}}>✏️ Редактировать лида</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              {([["name","Имя *"],["contact","Контакт"],["phone","Телефон"],["email","Email"],["deal","Сделка, ₽"],["source","Источник"]] as const).map(([k,label])=>(
                <div key={k}>
                  <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>{label}</label>
                  <input type={k==="deal"?"number":"text"} value={editLeadData[k]||""} onChange={e=>setEditLeadData({...editLeadData,[k]:e.target.value})}
                    style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const,fontFamily:"'Montserrat',sans-serif"}}/>
                </div>
              ))}
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>Заметка</label>
              <textarea value={editLeadData.note||""} onChange={e=>setEditLeadData({...editLeadData,note:e.target.value})} rows={3}
                style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,resize:"vertical",fontFamily:"'Montserrat',sans-serif",boxSizing:"border-box" as const}}/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setEditLeadId(null)} style={{padding:"9px 16px",background:C.ib,color:C.t2,border:"1px solid "+C.bd,borderRadius:10,fontSize:13,cursor:"pointer"}}>Отмена</button>
              <button onClick={saveEditLead} style={{padding:"9px 20px",background:C.a,color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:`0 0 16px ${C.a}40`}}>Сохранить</button>
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
          cursor:"grab",userSelect:"none",
          border:"1px solid "+C.bd,
          borderLeft:`3px solid ${stageColor}`,
          opacity:dragId===l.id?0.4:1,
          animation:"leadPulse 4s ease-in-out infinite",
          position:"relative",overflow:"hidden",
        }}
        onMouseEnter={e=>{
          const el=e.currentTarget as HTMLElement;
          el.style.borderColor=stageColor+"60";
          el.style.boxShadow=`0 0 16px ${stageColor}18`;
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
        <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,${stageColor}04,transparent)`,pointerEvents:"none",borderRadius:11}}/>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,minWidth:0,position:"relative"}}>
          <div style={{fontWeight:600,fontSize:13,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,minWidth:0}}>{l.name}</div>
          {l.deal&&<div style={{fontSize:11,fontWeight:600,color:C.g,flexShrink:0,whiteSpace:"nowrap"}}>{fmt$(l.deal)}₽</div>}
        </div>
        {(l.phone||l.email||l.contact)&&<div style={{fontSize:11,color:C.t2,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",position:"relative"}}>{l.phone||l.email||l.contact}</div>}

        {isOpen&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+C.bd,position:"relative"}}>
          {l.source&&<div style={{fontSize:10,color:C.t2,marginBottom:5}}>Источник: {l.source}</div>}
          {l.note&&<div style={{fontSize:11,color:C.t1,marginBottom:8,lineHeight:1.5,wordBreak:"break-word"}}>{l.note}</div>}

          {/* Status change buttons */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
            {stages.filter(s=>s.id!==l.status).map(s=>(
              <button key={s.id} onClick={e=>{e.stopPropagation();allLeads.update(l.id,{status:s.id});}}
                style={{fontSize:10,padding:"3px 9px",borderRadius:20,border:"1px solid "+s.color+"30",background:s.color+"10",color:s.color,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=s.color+"25";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=s.color+"10";}}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Action row */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {/* Edit button */}
            <button onClick={e=>{e.stopPropagation();openEditLead(l);}}
              style={{flex:1,padding:"7px 12px",background:C.a+"12",color:C.a,border:"1px solid "+C.a+"30",borderRadius:9,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all 0.15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=C.a+"20";(e.currentTarget as HTMLElement).style.boxShadow=`0 0 12px ${C.a}20`;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=C.a+"12";(e.currentTarget as HTMLElement).style.boxShadow="none";}}>
              ✏️ Редактировать
            </button>

            {/* Delete button — pink gradient */}
            <button onClick={e=>{e.stopPropagation();setDeleteConfirmId(l.id);}}
              style={{flex:1,padding:"7px 12px",background:"linear-gradient(135deg,#FF6B9D22,#E91E8C14)",color:"#E91E8C",border:"1px solid #E91E8C30",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all 0.15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="linear-gradient(135deg,#FF6B9D,#E91E8C)";(e.currentTarget as HTMLElement).style.color="#fff";(e.currentTarget as HTMLElement).style.boxShadow="0 0 16px rgba(233,30,140,0.4)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="linear-gradient(135deg,#FF6B9D22,#E91E8C14)";(e.currentTarget as HTMLElement).style.color="#E91E8C";(e.currentTarget as HTMLElement).style.boxShadow="none";}}>
              🗑 Удалить
            </button>
          </div>
        </div>}
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
                  el.style.boxShadow=`0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px ${accentColor}30, 0 0 20px ${accentColor}15`;
                  el.style.borderColor=accentColor+"40";
                }}
                onMouseLeave={e=>{
                  const el=e.currentTarget as HTMLElement;
                  el.style.transform="translateY(0)";
                  el.style.boxShadow="0 4px 20px rgba(0,0,0,0.08)";
                  el.style.borderColor=C.bd;
                }}>

                {/* Top accent line */}
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${accentColor},${accentColor}88,transparent)`,borderRadius:"18px 18px 0 0"}}/>

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
                    background:`linear-gradient(135deg,${accentColor}20,${accentColor}08)`,
                    border:`1px solid ${accentColor}30`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    boxShadow:`0 0 12px ${accentColor}20`,
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
                el.style.boxShadow=`0 0 20px ${C.a}10`;
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
                  placeholder="Например: Основная воронка, Instagram, B2B..." style={iS}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Описание (необязательно)</label>
                <input value={newFunnelDesc} onChange={e=>setNewFunnelDesc(e.target.value)} placeholder="Краткое описание..." style={iS}/>
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
              style={iS}/>
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
            style={{padding:"6px 14px",borderRadius:9,border:"1px solid "+(isAct?ac+"50":C.bd),whiteSpace:"nowrap",fontSize:12,fontWeight:isAct?700:400,cursor:"pointer",flexShrink:0,background:isAct?ac+"12":"transparent",color:isAct?ac:C.t2,boxShadow:isAct?`0 0 12px ${ac}20`:"none",transition:"all 0.15s"}}>
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
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.a+"30";(e.currentTarget as HTMLElement).style.boxShadow=`0 0 16px ${C.a}10`;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.bd;(e.currentTarget as HTMLElement).style.boxShadow="none";}}>
          <div style={{fontSize:20,fontWeight:700,color:C.t1,marginBottom:2,lineHeight:1.2}}>{s.v}</div>
          <div style={{fontSize:11,color:C.t2}}>{s.l}</div>
        </div>
      ))}
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
        <button onClick={()=>setShow(!show)} style={{padding:"8px 16px",background:C.a,color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",boxShadow:`0 0 16px ${C.a}30`,transition:"all 0.2s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow=`0 0 24px ${C.a}50`;(e.currentTarget as HTMLElement).style.transform="translateY(-1px)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow=`0 0 16px ${C.a}30`;(e.currentTarget as HTMLElement).style.transform="none";}}>
          + Лид
        </button>
      </div>

      {show&&<div style={{background:C.w,borderRadius:14,padding:18,marginBottom:18,border:"1px solid "+C.bd}} className="form-panel">
        <div style={{fontSize:14,fontWeight:600,marginBottom:14,color:C.t1}}>Новый лид</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:10}}>
          {([["name","Имя *"],["contact","Контакт"],["phone","Телефон"],["email","Email"],["note","Заметка"],["deal","Сделка, ₽"]] as const).map(([k,l])=>(
            <div key={k}>
              <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>{l}</label>
              <input type={k==="deal"?"number":"text"} value={(f as any)[k]} onChange={e=>sF({...f,[k]:e.target.value})}
                style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const,fontFamily:"'Montserrat',sans-serif"}}/>
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
          return <div key={stage.id} onDragOver={e=>onDragOver(stage.id,e)} onDrop={()=>onDrop(stage.id)} onDragLeave={()=>setDragOver(null)}
            style={{minWidth:228,width:228,flexShrink:0,background:isOver?C.a+"06":C.ib,borderRadius:14,padding:"0 0 10px",border:"1px solid "+(isOver?C.a+"40":C.bd),boxShadow:isOver?`0 0 20px ${C.a}15`:"none",transition:"all 0.2s"}}>
            <div style={{padding:"11px 11px 8px",borderBottom:"1px solid "+C.bd}}>
              {editStageId===stage.id
                ?<input autoFocus defaultValue={stage.label}
                    onBlur={e=>{setStageLabels((p:any)=>({...p,[activeFunnelId!]:{...(p[activeFunnelId!]||{}),[stage.id]:e.target.value||stage.label}}));setEditStageId(null);}}
                    onKeyDown={e=>{if(e.key==="Enter"){setStageLabels((p:any)=>({...p,[activeFunnelId!]:{...(p[activeFunnelId!]||{}),[stage.id]:(e.target as HTMLInputElement).value||stage.label}}));setEditStageId(null);}if(e.key==="Escape")setEditStageId(null);}}
                    style={{width:"100%",fontSize:12,fontWeight:600,padding:"3px 7px",border:"1px solid "+stage.color,borderRadius:7,outline:"none",background:C.ib,color:C.t1}}/>
                :<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:stage.color,boxShadow:`0 0 6px ${stage.color}80`,flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:600,color:C.t1}}>{stage.label}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:10,fontWeight:700,color:stage.color,background:stage.color+"18",borderRadius:20,padding:"1px 6px"}}>{stageLeads.length}</span>
                      <button onClick={()=>setEditStageId(stage.id)} style={{width:20,height:20,border:"none",background:"transparent",cursor:"pointer",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",color:C.t2,fontSize:11,opacity:0.5}}>✎</button>
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
      </div>
    </>}


    {/* LIST */}
    {tab==="list"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,gap:12}}>
        <input placeholder="Поиск по имени, телефону, email..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{...iS,maxWidth:300,borderRadius:9,fontSize:12,padding:"8px 12px",background:C.ib,border:"1px solid "+C.bd}}/>
        <button onClick={()=>setShow(!show)} style={{padding:"8px 16px",background:C.a,color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",boxShadow:`0 0 16px ${C.a}30`,transition:"all 0.2s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-1px)";(e.currentTarget as HTMLElement).style.boxShadow=`0 0 24px ${C.a}50`;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="none";(e.currentTarget as HTMLElement).style.boxShadow=`0 0 16px ${C.a}30`;}}>
          + Лид
        </button>
      </div>
      {show&&<div style={{background:C.w,borderRadius:14,padding:18,marginBottom:16,border:"1px solid "+C.bd}} className="form-panel">
        <div style={{fontSize:14,fontWeight:600,marginBottom:14,color:C.t1}}>Новый лид</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {([["name","Имя *"],["contact","Контакт"],["phone","Телефон"],["email","Email"],["note","Заметка"],["deal","Сделка, ₽"]] as const).map(([k,l])=>(
            <div key={k}>
              <label style={{fontSize:10,color:C.t2,display:"block",marginBottom:4,fontWeight:500}}>{l}</label>
              <input type={k==="deal"?"number":"text"} value={(f as any)[k]} onChange={e=>sF({...f,[k]:e.target.value})}
                style={{width:"100%",padding:"9px 11px",border:"1px solid "+C.bd,borderRadius:9,fontSize:12,outline:"none",background:C.ib,color:C.t1,boxSizing:"border-box" as const,fontFamily:"'Montserrat',sans-serif"}}/>
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
              <div style={{width:32,height:32,borderRadius:"50%",background:stCol(l.status)+"18",border:`1px solid ${stCol(l.status)}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:13,fontWeight:700,color:stCol(l.status)}}>{l.name[0]?.toUpperCase()}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
                <div style={{fontSize:11,color:C.t2,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.phone||l.email||l.contact||l.source}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                {l.deal&&<span style={{fontSize:11,fontWeight:600,color:C.g}}>{fmt$(l.deal)}₽</span>}
                <span style={{fontSize:10,fontWeight:600,padding:"2px 9px",borderRadius:20,background:stCol(l.status)+"14",color:stCol(l.status),border:`1px solid ${stCol(l.status)}25`}}>{stLbl(l.status)}</span>
                <button onClick={()=>allLeads.remove(l.id)} style={{width:24,height:24,borderRadius:7,border:"1px solid "+C.bd,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
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
                onKeyDown={e=>{if(e.key==="Enter")createFunnel();}} placeholder="Например: Instagram, B2B, Партнёры..." style={iS}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Описание</label>
              <input value={newFunnelDesc} onChange={e=>setNewFunnelDesc(e.target.value)} placeholder="Краткое описание..." style={iS}/>
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

        return <div key={car.id} style={{background:C.w,borderRadius:20,boxShadow:C.sh,border:"1px solid "+C.bd,overflow:"hidden"}}>
          {/* Header */}
          <div style={{padding:"14px 20px",borderBottom:"1px solid "+C.bd,display:"flex",alignItems:"center",justifyContent:"space-between",background:C.ib}}>
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
                      boxShadow:(anyMax||anyAfter)?`0 0 0 3px ${borderColor}22`:C.sh,
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
                        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:5,background:IG_COLOR+"12",borderRadius:8,padding:"5px 7px",border:`1px solid ${IG_COLOR}25`}}>
                          <IgIcon/>
                          <input type="number" value={slot.ig_view_count||""} onChange={e=>items.update(slot.id,{ig_view_count:+e.target.value||0})}
                            placeholder="IG"
                            style={{flex:1,border:"none",background:"transparent",fontSize:11,outline:"none",fontFamily:"'Montserrat',sans-serif",color:C.t1,minWidth:0,textAlign:"center"}}/>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:4,background:TG_COLOR+"12",borderRadius:8,padding:"5px 7px",border:`1px solid ${TG_COLOR}25`}}>
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
      const apiMsgs=newMsgs.map(m=>({role:m.role,content:m.file&&m.file.type==="text"?m.content+"\n\nФайл \""+m.file.name+"\":\n"+m.file.data:m.content}));
      const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:apiMsgs,...(system?{system}:{})})});
      if(!res.ok)throw new Error("API error "+res.status);
      const data=await res.json();
      const reply=data.content?.[0]?.text||data.choices?.[0]?.message?.content||"Нет ответа";
      setChats(prev=>prev.map(c=>c.id===chatId?{...c,msgs:[...newMsgs,{role:"assistant" as const,content:reply}]}:c));
    }catch(e:any){setErr("Ошибка: "+e.message);setChats(prev=>prev.map(c=>c.id===chatId?{...c,msgs:newMsgs.slice(0,-1)}:c));}
    finally{setLoading(false);}
  };

  const formatMsg=(text:string)=>text.split("\n").map((line,i,arr)=>{
    const parts=line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part,j)=>{
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
              style={{padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,fontSize:11,color:"rgba(255,255,255,0.65)",cursor:"pointer",textAlign:"left",lineHeight:1.4,fontFamily:"'Montserrat',sans-serif",transition:"all 0.15s"}}>
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
                style={{padding:"6px 12px",background:ac+"15",border:"1px solid "+ac+"30",borderRadius:20,fontSize:11,color:ac,cursor:"pointer",fontWeight:500,fontFamily:"'Montserrat',sans-serif",transition:"all 0.15s"}}>
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
            style={{flex:1,border:"1px solid rgba(255,255,255,0.1)",outline:"none",resize:"none",fontSize:13,fontFamily:"'Montserrat',sans-serif",color:"#fff",background:theme.inputBg,lineHeight:1.5,maxHeight:120,overflowY:"auto",borderRadius:10,padding:"9px 12px",transition:"border-color 0.2s,box-shadow 0.2s"}}
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
                        style={{padding:"7px 14px",background:form[q.id]===opt?"rgba(204,0,255,0.2)":"rgba(255,255,255,0.04)",border:"1px solid "+(form[q.id]===opt?ac:"rgba(255,255,255,0.1)"),borderRadius:20,fontSize:12,color:form[q.id]===opt?ac:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"all 0.15s",fontFamily:"'Montserrat',sans-serif",fontWeight:form[q.id]===opt?600:400}}>
                        {opt}
                      </button>)}
                    </div>
                  : <input value={form[q.id]||""} onChange={e=>setForm(f=>({...f,[q.id]:e.target.value}))}
                      placeholder={q.placeholder} className="stories-input"
                      style={{width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,fontSize:13,color:"#fff",outline:"none",fontFamily:"'Montserrat',sans-serif",boxSizing:"border-box",transition:"all 0.2s"}}/>
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
                style={{flex:1,border:"1px solid rgba(255,255,255,0.1)",outline:"none",resize:"none",fontSize:13,fontFamily:"'Montserrat',sans-serif",color:"#fff",background:"rgba(255,255,255,0.04)",lineHeight:1.5,maxHeight:100,overflowY:"auto",borderRadius:10,padding:"9px 12px",transition:"all 0.2s"}}
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
      <div style={{position:"fixed",right:0,top:0,bottom:0,width:360,background:"#1A1030",borderLeft:"1px solid rgba(167,139,250,0.2)",transform:aiOpen?"translateX(0)":"translateX(100%)",transition:"transform 0.3s ease",zIndex:105,display:"flex",flexDirection:"column",fontFamily:"'Montserrat',sans-serif",overflowY:"auto"}}>
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
            <select value={aiGoal} onChange={e=>setAiGoal(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:10,fontSize:13,color:aiGoal?"#fff":"rgba(255,255,255,0.4)",outline:"none",fontFamily:"'Montserrat',sans-serif"}}>
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
            <select value={aiTone} onChange={e=>setAiTone(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:10,fontSize:13,color:aiTone?"#fff":"rgba(255,255,255,0.4)",outline:"none",fontFamily:"'Montserrat',sans-serif"}}>
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
              style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:10,fontSize:12,color:"#fff",outline:"none",resize:"vertical",fontFamily:"'Montserrat',sans-serif",lineHeight:1.5}}/>
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
                <input autoFocus placeholder="Иван Петров / Сегмент: Новые лиды" value={form.recipient} onChange={e=>setForm({...form,recipient:e.target.value})} style={iS}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Цель рассылки *</label>
                <input placeholder="Прогрев, Продажа курса, Реактивация..." value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})} style={iS}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Дата и время</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e=>setForm({...form,scheduled_at:e.target.value})} style={iS}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Статус</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={iS}>
                    {MAILING_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Ссылка на чат (Instagram, Telegram...)</label>
                <input placeholder="https://t.me/username" value={form.chat_url} onChange={e=>setForm({...form,chat_url:e.target.value})} style={iS}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.t2,display:"block",marginBottom:5}}>Текст / Контент рассылки</label>
                <textarea rows={4} placeholder="Текст сообщения..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})} style={{...iS,resize:"vertical"}}/>
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
            style={{width:"100%",padding:"11px 14px",border:"1px solid "+C.bd,borderRadius:10,fontSize:14,outline:"none",background:dark?"#141927":C.ib,color:C.t1,fontFamily:"'Montserrat',sans-serif",boxSizing:"border-box"}}/>
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
        style={{fontSize:14,fontWeight:700,color:C.t1,background:"transparent",border:"1px solid transparent",borderRadius:7,padding:"4px 8px",outline:"none",cursor:"pointer",fontFamily:"'Montserrat',sans-serif",minWidth:140,flexShrink:0}}
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
        <input type="number" placeholder="Свои минуты..." value={customMins} onChange={e=>{if(!running){setCustomMins(e.target.value);setUseCustom(true);}}} disabled={running} min={1} max={180} style={{...iS,width:160,padding:"8px 12px",fontSize:14}}/>
        {useCustom&&+customMins>0&&<span style={{fontSize:13,color:C.a,fontWeight:600}}>{customMins} мин выбрано</span>}
      </div>
    </Card>

    <Card style={{textAlign:"center"}}><div style={{fontSize:48,fontWeight:800,color:C.a}}>{sessions}</div><div style={{fontSize:14,color:C.t2,marginTop:4}}>Сессий сегодня</div></Card>
  </div>;
}

/* ============ BOARD (MIRO-style v2) ============ */
const BOARD_PALETTE=["#FEF08A","#BBF7D0","#BFDBFE","#FED7AA","#F9A8D4","#E9D5FF","#FECACA","#A7F3D0","#ffffff","#F1F5F9","#1E293B","#7C3AED","#2563EB","#DC2626","#16A34A","#D97706"];
const MAX_BOARDS=20;

type BItemType="sticky"|"text"|"image"|"link"|"shape"|"draw";
type LineStyle="solid"|"dashed";
type ArrowTip="none"|"arrow";

interface BItem{
  id:string; type:BItemType;
  x:number; y:number; w:number; h:number;
  text?:string; color?:string;
  fontSize?:number; fontBold?:boolean; fontItalic?:boolean;
  shapeKind?:"rect"|"circle"|"diamond"|"triangle";
  imageUrl?:string; imageW?:number; imageH?:number;
  linkUrl?:string; linkTitle?:string; linkFavicon?:string;
  zIndex?:number;
  drawPath?:string; drawColor?:string; drawThickness?:number;
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

function itemCenter(it:BItem){return{x:it.x+it.w/2,y:it.y+it.h/2};}

function BoardPage({userId}:{userId:string}){
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

  // Tool state
  const[tool,setTool]=useState<"select"|"pan"|"sticky"|"text"|"image"|"link"|"shape"|"line"|"draw">("select");
  const[shapeKind,setShapeKind]=useState<"rect"|"circle"|"diamond"|"triangle">("rect");
  const[drawColor,setDrawColor]=useState("#2563EB");
  const[drawThickness,setDrawThickness]=useState(3);
  const drawingRef=useRef<{path:string;startX:number;startY:number}|null>(null);
  const[isDrawing,setIsDrawing]=useState(false);
  const[drawPreview,setDrawPreview]=useState("");

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

  // Line drawing
  const[lineFrom,setLineFrom]=useState<string|null>(null);

  // Color picker
  const[colorTarget,setColorTarget]=useState<"item"|"line"|null>(null);

  // Link modal
  const[linkModal,setLinkModal]=useState(false);
  const[linkUrl,setLinkUrl]=useState("");
  const[linkLoading,setLinkLoading]=useState(false);
  const[linkClickPos,setLinkClickPos]=useState({x:200,y:200});

  // Image input ref
  const imgInputRef=useRef<HTMLInputElement>(null);
  const[imgClickPos,setImgClickPos]=useState({x:200,y:200});

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
      setItems((its||[]).map((d:any):BItem=>({
        id:d.id,type:d.type,x:d.x,y:d.y,w:d.w,h:d.h,
        text:d.text||"",color:d.color||"",fontSize:d.font_size||14,
        fontBold:d.font_bold||false,fontItalic:d.font_italic||false,
        shapeKind:d.shape_kind||"rect",imageUrl:d.image_url||"",
        linkUrl:d.link_url||"",linkTitle:d.link_title||"",linkFavicon:d.link_favicon||"",
        zIndex:d.z_index||0,
        drawPath:d.draw_path||undefined,drawColor:d.draw_color||undefined,drawThickness:d.draw_thickness||undefined,
      })));
      setLines((lns||[]).map((d:any):BLine=>({
        id:d.id,fromId:d.from_id,toId:d.to_id,
        color:d.color||"#64748B",thickness:d.thickness||2,
        style:d.style||"solid",arrow:d.arrow||"arrow",
      })));
      setLoadingCanvas(false);
    })();
  },[activeBoardId]);

  // ── Auto-save ──
  const triggerSave=(newItems:BItem[],newLines:BLine[])=>{
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{
      if(!activeBoardId)return;
      try{
        await Promise.all([
          supabase.from("board_items").delete().eq("board_id",activeBoardId),
          supabase.from("board_lines").delete().eq("board_id",activeBoardId),
        ]);
        if(newItems.length>0)await supabase.from("board_items").insert(newItems.map((it,i)=>({
          id:it.id,board_id:activeBoardId,user_id:userId,type:it.type,
          x:Math.round(it.x),y:Math.round(it.y),w:Math.round(it.w),h:Math.round(it.h),
          text:it.text||"",color:it.color||"",font_size:it.fontSize||14,
          font_bold:it.fontBold||false,font_italic:it.fontItalic||false,
          shape_kind:it.shapeKind||null,image_url:it.imageUrl||"",
          link_url:it.linkUrl||"",link_title:it.linkTitle||"",link_favicon:it.linkFavicon||"",
          z_index:i,draw_path:it.drawPath||null,draw_color:it.drawColor||null,draw_thickness:it.drawThickness||null,
        })));
        if(newLines.length>0)await supabase.from("board_lines").insert(newLines.map(ln=>({
          id:ln.id,board_id:activeBoardId,user_id:userId,
          from_id:ln.fromId,to_id:ln.toId,
          color:ln.color||"#64748B",thickness:ln.thickness||2,style:ln.style||"solid",arrow:ln.arrow||"arrow",
        })));
        setSaved(true);
      }catch{setSaved(false);}
    },1500);
  };

  const updItems=(next:BItem[])=>{setItems(next);triggerSave(next,lines);};
  const updLines=(next:BLine[])=>{setLines(next);triggerSave(items,next);};
  const updBoth=(ni:BItem[],nl:BLine[])=>{setItems(ni);setLines(nl);triggerSave(ni,nl);};

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
    const it:BItem={id:bid(),x:cx-100,y:cy-80,w:200,h:160,zIndex:items.length,...partial};
    const next=[...items,it];
    updItems(next);
    setSelectedIds(new Set([it.id]));
    setTool("select");
    return it;
  };

  // ── Canvas click ──
  const onCanvasClick=(e:React.MouseEvent)=>{
    const tgt=e.target as HTMLElement;
    const onCanvas=tgt===canvasRef.current||tgt.classList.contains("board-bg-dot");
    if(tool==="select"){if(onCanvas){setSelectedIds(new Set());setSelectedLineId(null);}return;}
    if(tool==="pan")return;
    if(!onCanvas)return;
    const{x,y}=toCanvas(e.clientX,e.clientY);

    if(tool==="sticky"){
      const it=addItem({type:"sticky",text:"",color:BOARD_PALETTE[0],w:200,h:180},x,y);
      setTimeout(()=>{setEditingId(it.id);setEditText("");},60);
    } else if(tool==="text"){
      const it=addItem({type:"text",text:"Текст",color:"#1E293B",w:180,h:50,fontSize:16},x,y);
      setTimeout(()=>{setEditingId(it.id);setEditText("Текст");},60);
    } else if(tool==="shape"){
      addItem({type:"shape",shapeKind,color:"#3B82F6",w:140,h:100},x,y);
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

    const startPos:Record<string,{x:number,y:number}>={};
    newSel.forEach(sid=>{const it=items.find(i=>i.id===sid);if(it)startPos[sid]={x:it.x,y:it.y};});
    dragState.current={ids:[...newSel],startMx:e.clientX,startMy:e.clientY,startPos};
  };

  // ── Mouse down on canvas (pan) ──
  const onCanvasDown=(e:React.MouseEvent)=>{
    const tgt=e.target as HTMLElement;
    const onBg=tgt===canvasRef.current||tgt.classList.contains("board-bg-dot");
    if(tool==="draw"&&onBg){
      const{x,y}=toCanvas(e.clientX,e.clientY);
      drawingRef.current={path:`M0,0`,startX:x,startY:y};
      setIsDrawing(true);setDrawPreview("M0,0");
      return;
    }
    if((tool==="select"||tool==="pan")&&onBg){
      panState.current={startMx:e.clientX,startMy:e.clientY,startPx:pan.x,startPy:pan.y};
    }
  };

  const onMouseMove=(e:React.MouseEvent)=>{
    if(dragState.current){
      const dx=(e.clientX-dragState.current.startMx)/zoom;
      const dy=(e.clientY-dragState.current.startMy)/zoom;
      setItems(prev=>prev.map(it=>dragState.current!.ids.includes(it.id)?{...it,x:dragState.current!.startPos[it.id].x+dx,y:dragState.current!.startPos[it.id].y+dy}:it));
    } else if(resizeState.current){
      const dx=(e.clientX-resizeState.current.startMx)/zoom;
      const dy=(e.clientY-resizeState.current.startMy)/zoom;
      const it0=items.find(i=>i.id===resizeState.current!.id);
      // Preserve aspect ratio for images
      if(it0?.type==="image"&&it0.imageW&&it0.imageH){
        const ratio=it0.imageW/it0.imageH;
        const newW=Math.max(60,resizeState.current.startW+dx);
        setItems(prev=>prev.map(it=>it.id===resizeState.current!.id?{...it,w:newW,h:Math.max(40,newW/ratio)}:it));
      } else {
        setItems(prev=>prev.map(it=>it.id===resizeState.current!.id?{...it,w:Math.max(60,resizeState.current!.startW+dx),h:Math.max(40,resizeState.current!.startH+dy)}:it));
      }
    } else if(panState.current){
      setPan({x:panState.current.startPx+(e.clientX-panState.current.startMx),y:panState.current.startPy+(e.clientY-panState.current.startMy)});
    } else if(isDrawing&&drawingRef.current){
      const{x,y}=toCanvas(e.clientX,e.clientY);
      const dx=x-drawingRef.current.startX;
      const dy=y-drawingRef.current.startY;
      const newPath=drawingRef.current.path+` L${dx.toFixed(1)},${dy.toFixed(1)}`;
      drawingRef.current.path=newPath;
      setDrawPreview(newPath);
    } else if(connectorDrag){
      // Update live connector preview via state
      const{x,y}=toCanvas(e.clientX,e.clientY);
      setConnectorDrag(d=>d?{...d,mx:x,my:y}:null);
    }
  };

  const onMouseUp=(e:React.MouseEvent)=>{
    if(dragState.current||resizeState.current)triggerSave(items,lines);
    dragState.current=null;resizeState.current=null;panState.current=null;

    // Finish drawing
    if(isDrawing&&drawingRef.current&&drawPreview.length>4){
      const{startX,startY}=drawingRef.current;
      // Compute bounding box of path
      const coords=drawPreview.match(/-?\d+\.?\d*/g)?.map(Number)||[];
      const xs=coords.filter((_,i)=>i%2===0),ys=coords.filter((_,i)=>i%2===1);
      const minX=Math.min(0,...xs),minY=Math.min(0,...ys);
      const maxX=Math.max(0,...xs),maxY=Math.max(0,...ys);
      const w=Math.max(40,maxX-minX),h=Math.max(40,maxY-minY);
      const it:BItem={id:bid(),type:"draw",x:startX+minX,y:startY+minY,w,h,drawPath:drawPreview,drawColor,drawThickness,zIndex:items.length};
      updItems([...items,it]);
    }
    setIsDrawing(false);drawingRef.current=null;setDrawPreview("");

    // Finish connector drag — snap to nearest anchor
    if(connectorDrag){
      const{fromId,fromAnchor,mx,my}=connectorDrag;
      type AnchorHit={id:string;side:"top"|"bottom"|"left"|"right";dist:number};
      let best:AnchorHit|null=null;
      items.filter(i=>i.id!==fromId).forEach(it=>{
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
    const f=e.deltaY>0?0.9:1.11;
    setZoom(z=>Math.min(4,Math.max(0.15,z*f)));
  };

  // ── Delete selected ──
  const deleteSelected=()=>{
    if(selectedLineId){updLines(lines.filter(l=>l.id!==selectedLineId));setSelectedLineId(null);return;}
    if(selectedIds.size===0)return;
    const ni=items.filter(i=>!selectedIds.has(i.id));
    const nl=lines.filter(l=>!selectedIds.has(l.fromId)&&!selectedIds.has(l.toId));
    updBoth(ni,nl);setSelectedIds(new Set());
  };

  // ── Z order ──
  const bringForward=(id:string)=>updItems(items.map((it,i)=>it.id===id?{...it,zIndex:(items.length+1)}:it));
  const sendBackward=(id:string)=>updItems(items.map(it=>it.id===id?{...it,zIndex:-1}:it));

  // ── Duplicate ──
  const duplicateSelected=()=>{
    const clones:BItem[]=[];
    selectedIds.forEach(id=>{
      const it=items.find(i=>i.id===id);
      if(it)clones.push({...it,id:bid(),x:it.x+20,y:it.y+20});
    });
    if(clones.length){const next=[...items,...clones];updItems(next);setSelectedIds(new Set(clones.map(c=>c.id)));}
  };

  // ── Image upload ──
  const onImageFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(file.size>10*1024*1024){alert("Файл слишком большой (макс 10 МБ)");return;}
    try{
      const reader=new FileReader();
      reader.onload=ev=>{
        try{
          const url=ev.target?.result as string;
          if(!url)return;
          // Try to get natural dimensions, fall back to 300x240 if fails
          const img=document.createElement("img");
          const onLoaded=()=>{
            const natW=img.naturalWidth||400;
            const natH=img.naturalHeight||300;
            const maxW=320;
            const scale=natW>maxW?maxW/natW:1;
            addItem({type:"image",imageUrl:url,imageW:natW,imageH:natH,w:Math.round(natW*scale),h:Math.round(natH*scale)},imgClickPos.x,imgClickPos.y);
          };
          img.onload=onLoaded;
          img.onerror=()=>{
            // Still add image even if size detection fails
            addItem({type:"image",imageUrl:url,w:300,h:240},imgClickPos.x,imgClickPos.y);
          };
          img.src=url;
        }catch{
          // Fallback: add without size detection
          const url=ev.target?.result as string;
          if(url)addItem({type:"image",imageUrl:url,w:300,h:240},imgClickPos.x,imgClickPos.y);
        }
      };
      reader.onerror=()=>alert("Ошибка чтения файла");
      reader.readAsDataURL(file);
    }catch(err){alert("Ошибка загрузки изображения");}
    e.target.value="";
  };

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
  },[editingId,selectedIds,selectedLineId,items,lines]);

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
    return lines.map(ln=>{
      const from=items.find(i=>i.id===ln.fromId);
      const to=items.find(i=>i.id===ln.toId);
      if(!from||!to)return null;
      // Use anchor points if defined, else centers
      const a=ln.fromAnchor?anchorPos(from,ln.fromAnchor):itemCenter(from);
      const b=ln.toAnchor?anchorPos(to,ln.toAnchor):itemCenter(to);
      const col=ln.color||"#64748B";
      const thick=ln.thickness||2;
      const dashArr=ln.style==="dashed"?`${thick*4} ${thick*3}`:"none";
      const markerId=`arr-${ln.id}`;
      const isSel=selectedLineId===ln.id;
      return(
        <g key={ln.id}>
          {ln.arrow==="arrow"&&<defs><marker id={markerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill={col}/></marker></defs>}
          {/* Hit area */}
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={16} style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();setSelectedLineId(ln.id);setSelectedIds(new Set());}}/>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isSel?"#2563EB":col} strokeWidth={isSel?thick+2:thick} strokeDasharray={dashArr} markerEnd={ln.arrow==="arrow"?`url(#${markerId})`:"none"} strokeLinecap="round" style={{pointerEvents:"none"}}/>
        </g>
      );
    });
  },[lines,items,selectedLineId]);

  // ── Render shape ──
  const renderShapeFill=(it:BItem)=>{
    const c=it.color||"#3B82F6";
    switch(it.shapeKind){
      case"circle":return<div style={{width:"100%",height:"100%",background:c,borderRadius:"50%",boxShadow:`0 4px 20px ${c}55`}}/>;
      case"diamond":return<div style={{width:"100%",height:"100%",background:c,clipPath:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)",boxShadow:`0 4px 20px ${c}55`}}/>;
      case"triangle":return<div style={{width:"100%",height:"100%",background:c,clipPath:"polygon(50% 0%,100% 100%,0% 100%)"}} />;
      default:return<div style={{width:"100%",height:"100%",background:c,borderRadius:10,boxShadow:`0 4px 20px ${c}55`}}/>;
    }
  };

  const sel1=selectedIds.size===1?items.find(i=>i.id==[...selectedIds][0]):null;
  const selLine=lines.find(l=>l.id===selectedLineId);

  const cursorMap:Record<string,string>={select:"default",pan:"grab",sticky:"cell",text:"text",image:"cell",link:"cell",shape:"crosshair",line:"crosshair",draw:"crosshair"};

  // ── If no board selected → show board list ──
  const activeBoard=boards.find(b=>b.id===activeBoardId);

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
                          style={{...iS,fontSize:14,fontWeight:700,padding:"4px 8px"}} onClick={e=>e.stopPropagation()}/>
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
                placeholder="Название доски..." style={iS}/>
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
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:60,display:"flex",alignItems:"center",padding:"8px 12px",background:"rgba(255,255,255,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(0,0,0,0.06)",gap:10}}>
        {/* Back */}
        <button onClick={()=>{setSaved(true);setActiveBoardId(null);setSelectedIds(new Set());setEditingId(null);setLineFrom(null);setTool("select");}}
          style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#F1F5F9",border:"none",borderRadius:9,fontSize:13,fontWeight:600,color:C.t2,cursor:"pointer"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Доски
        </button>

        <div style={{fontSize:14,fontWeight:700,color:C.t1,flex:1}}>{activeBoard.name}</div>

        {/* Tool buttons */}
        <div style={{display:"flex",gap:2,background:"#F1F5F9",borderRadius:10,padding:"3px"}}>
          {([
            {id:"select",icon:"⬜",tip:"Выбор (V)"},
            {id:"pan",icon:"✋",tip:"Перемещение (H)"},
            {id:"sticky",icon:"📌",tip:"Стикер (S)"},
            {id:"text",icon:"T",tip:"Текст (T)"},
            {id:"image",icon:"🖼",tip:"Изображение (I)"},
            {id:"link",icon:"🔗",tip:"Ссылка (L)"},
            {id:"shape",icon:"⬡",tip:"Фигура (F)"},
            {id:"line",icon:"↗",tip:"Линия (C)"},
            {id:"draw",icon:"✏️",tip:"Маркер (M)"},
          ] as {id:string;icon:string;tip:string}[]).map(tb=>(
            <button key={tb.id} onClick={()=>{setTool(tb.id as any);if(tb.id==="image"){setImgClickPos({x:400,y:300});imgInputRef.current?.click();}}} title={tb.tip}
              style={{width:34,height:34,borderRadius:8,border:"none",background:tool===tb.id?"#fff":"transparent",color:tool===tb.id?C.t1:C.t2,fontSize:tb.id==="text"||tb.id==="line"?13:17,cursor:"pointer",fontWeight:tool===tb.id?700:400,boxShadow:tool===tb.id?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.12s"}}>
              {tb.icon}
            </button>
          ))}
        </div>

        {/* Draw tool options */}
        {tool==="draw"&&(
          <div style={{display:"flex",gap:6,alignItems:"center",background:"#F1F5F9",borderRadius:10,padding:"4px 8px"}}>
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
            {(["rect","circle","diamond","triangle"] as const).map(sk=>(
              <button key={sk} onClick={()=>setShapeKind(sk)}
                style={{width:30,height:30,borderRadius:7,border:"none",fontSize:15,background:shapeKind===sk?"#fff":"transparent",cursor:"pointer",boxShadow:shapeKind===sk?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>
                {sk==="rect"?"▬":sk==="circle"?"●":sk==="diamond"?"◆":"▲"}
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
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.t2}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:saved?"#10B981":"#F59E0B",transition:"background 0.3s"}}/>
          {saved?"Сохранено":"Сохранение..."}
        </div>
      </div>

      {/* ── CONTEXT TOOLBAR (selected item) ── */}
      {(sel1||selLine)&&!editingId&&(
        <div style={{position:"absolute",top:60,left:"50%",transform:"translateX(-50%)",zIndex:60,display:"flex",gap:5,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(8px)",borderRadius:12,padding:"6px 10px",boxShadow:"0 4px 20px rgba(0,0,0,0.1)",border:"1px solid rgba(0,0,0,0.06)",alignItems:"center",flexWrap:"wrap"}}>

          {/* Color */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setColorTarget(colorTarget?null:sel1?"item":"line")}
              style={{width:26,height:26,borderRadius:8,background:sel1?sel1.color||"#FEF08A":selLine?.color||"#64748B",border:"2px solid rgba(0,0,0,0.15)",cursor:"pointer"}}/>
            {colorTarget&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,background:"#fff",borderRadius:12,padding:10,boxShadow:"0 8px 24px rgba(0,0,0,0.14)",width:172,zIndex:200,border:"1px solid #E2E8F0"}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                  {BOARD_PALETTE.map(c=>(
                    <button key={c} onClick={()=>{
                      if(sel1)updItems(items.map(it=>it.id===sel1.id?{...it,color:c}:it));
                      else if(selLine)updLines(lines.map(l=>l.id===selLine.id?{...l,color:c}:l));
                      setColorTarget(null);
                    }} style={{width:24,height:24,borderRadius:6,background:c,border:"1px solid rgba(0,0,0,0.1)",cursor:"pointer"}}/>
                  ))}
                </div>
                {/* HEX input */}
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:10,color:"#64748B",fontWeight:500}}>HEX</span>
                  <input value={customColorInput} onChange={e=>setCustomColorInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"){if(sel1)updItems(items.map(it=>it.id===sel1.id?{...it,color:customColorInput}:it));else if(selLine)updLines(lines.map(l=>l.id===selLine.id?{...l,color:customColorInput}:l));setColorTarget(null);}}}
                    style={{flex:1,padding:"4px 7px",border:"1px solid #E2E8F0",borderRadius:7,fontSize:12,outline:"none",fontFamily:"monospace"}} placeholder="#000000"/>
                </div>
                {/* Native color picker */}
                <input type="color" value={customColorInput} onChange={e=>{
                  setCustomColorInput(e.target.value);
                  if(sel1)updItems(items.map(it=>it.id===sel1.id?{...it,color:e.target.value}:it));
                  else if(selLine)updLines(lines.map(l=>l.id===selLine.id?{...l,color:e.target.value}:l));
                }} style={{width:"100%",height:28,border:"none",cursor:"pointer",borderRadius:7}}/>
              </div>
            )}
          </div>

          {/* Item-specific controls */}
          {sel1&&sel1.type!=="shape"&&sel1.type!=="image"&&sel1.type!=="link"&&<>
            <button onClick={()=>updItems(items.map(it=>it.id===sel1.id?{...it,fontSize:Math.max(8,(it.fontSize||14)-2)}:it))}
              style={{width:26,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:700}}>A−</button>
            <span style={{fontSize:11,color:C.t2,minWidth:18,textAlign:"center"}}>{sel1.fontSize||14}</span>
            <button onClick={()=>updItems(items.map(it=>it.id===sel1.id?{...it,fontSize:Math.min(72,(it.fontSize||14)+2)}:it))}
              style={{width:26,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:700}}>A+</button>
            <button onClick={()=>updItems(items.map(it=>it.id===sel1.id?{...it,fontBold:!it.fontBold}:it))}
              style={{width:26,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:sel1.fontBold?"#EFF6FF":"transparent",cursor:"pointer",fontSize:12,fontWeight:800,color:sel1.fontBold?"#2563EB":C.t1}}>B</button>
            <button onClick={()=>updItems(items.map(it=>it.id===sel1.id?{...it,fontItalic:!it.fontItalic}:it))}
              style={{width:26,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:sel1.fontItalic?"#EFF6FF":"transparent",cursor:"pointer",fontSize:12,fontStyle:"italic",color:sel1.fontItalic?"#2563EB":C.t1}}>I</button>
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
            <button onClick={()=>updLines(lines.map(l=>l.id===selLine.id?{...l,style:l.style==="solid"?"dashed":"solid"}:l))}
              style={{padding:"4px 10px",border:"1px solid #E2E8F0",borderRadius:7,background:selLine.style==="dashed"?"#EFF6FF":"transparent",cursor:"pointer",fontSize:11,fontWeight:600,color:selLine.style==="dashed"?"#2563EB":C.t1}}>
              {selLine.style==="solid"?"— сплошная":"-- пунктир"}
            </button>
            <button onClick={()=>updLines(lines.map(l=>l.id===selLine.id?{...l,arrow:l.arrow==="arrow"?"none":"arrow"}:l))}
              style={{padding:"4px 10px",border:"1px solid #E2E8F0",borderRadius:7,background:selLine.arrow==="arrow"?"#EFF6FF":"transparent",cursor:"pointer",fontSize:13}}>
              {selLine.arrow==="arrow"?"→":"—"}
            </button>
          </>}

          {/* Layer controls (items only) */}
          {sel1&&<>
            <div style={{width:1,background:"#E2E8F0",height:20}}/>
            <button onClick={()=>bringForward(sel1.id)} title="На передний план" style={{width:26,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",fontSize:12}}>↑</button>
            <button onClick={()=>sendBackward(sel1.id)} title="На задний план" style={{width:26,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",fontSize:12}}>↓</button>
          </>}

          {/* Edit text */}
          {sel1&&sel1.type!=="shape"&&sel1.type!=="image"&&sel1.type!=="link"&&(
            <button onClick={()=>{setEditingId(sel1.id);setEditText(sel1.text||"");}}
              style={{padding:"4px 10px",border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",fontSize:11,color:C.t1}}>✏️ Текст</button>
          )}

          {/* Duplicate */}
          {sel1&&<button onClick={duplicateSelected} title="Дублировать (Ctrl+D)" style={{width:26,height:26,border:"1px solid #E2E8F0",borderRadius:7,background:"transparent",cursor:"pointer",fontSize:14}}>⧉</button>}

          {/* Delete */}
          <button onClick={deleteSelected} style={{width:26,height:26,border:"1px solid #FCA5A5",borderRadius:7,background:"#FFF1F1",cursor:"pointer",fontSize:12,color:"#EF4444"}}>🗑</button>
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
        onWheel={onWheel}>

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

              {/* Draw preview */}
              {isDrawing&&drawPreview&&drawingRef.current&&(
                <g transform={`translate(${drawingRef.current.startX},${drawingRef.current.startY})`}>
                  <path d={drawPreview} fill="none" stroke={drawColor} strokeWidth={drawThickness} strokeLinecap="round" strokeLinejoin="round"/>
                </g>
              )}
            </g>
          </svg>

          {/* Items */}
          {[...items].sort((a,b)=>(a.zIndex||0)-(b.zIndex||0)).map(it=>{
            const isSel=selectedIds.has(it.id);
            const isEdit=editingId===it.id;
            const isLineSrc=lineFrom===it.id;

            return(
              <div key={it.id}
                onMouseDown={e=>onItemDown(e,it.id)}
                onDoubleClick={e=>{e.stopPropagation();if(it.type!=="shape"&&it.type!=="image"){setEditingId(it.id);setEditText(it.text||"");setSelectedIds(new Set([it.id]));}}}
                style={{
                  position:"absolute",left:it.x,top:it.y,width:it.w,height:it.h,
                  cursor:tool==="line"?"crosshair":dragState.current?.ids.includes(it.id)?"grabbing":"grab",
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
                          style={{flex:1,border:"none",background:"transparent",resize:"none",outline:"none",fontFamily:"'Montserrat',sans-serif",fontSize:it.fontSize||14,fontWeight:it.fontBold?700:400,fontStyle:it.fontItalic?"italic":"normal",color:"rgba(0,0,0,0.8)",lineHeight:1.55}}/>
                      :<div style={{flex:1,fontSize:it.fontSize||14,fontWeight:it.fontBold?700:400,fontStyle:it.fontItalic?"italic":"normal",color:"rgba(0,0,0,0.8)",lineHeight:1.55,wordBreak:"break-word",whiteSpace:"pre-wrap",overflow:"hidden"}}>{it.text||<span style={{opacity:0.35,fontStyle:"italic"}}>Двойной клик для ввода...</span>}</div>
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
                          style={{flex:1,border:"none",background:"transparent",resize:"none",outline:"none",fontFamily:"'Montserrat',sans-serif",fontSize:it.fontSize||16,fontWeight:it.fontBold?700:400,fontStyle:it.fontItalic?"italic":"normal",color:it.color||"#1E293B",lineHeight:1.4,width:"100%",minHeight:"100%"}}/>
                      :<div style={{fontSize:it.fontSize||16,fontWeight:it.fontBold?700:400,fontStyle:it.fontItalic?"italic":"normal",color:it.color||"#1E293B",lineHeight:1.4,wordBreak:"break-word",whiteSpace:"pre-wrap",width:"100%"}}>{it.text||"Текст"}</div>
                    }
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

                {/* ── SHAPE ── */}
                {it.type==="shape"&&renderShapeFill(it)}

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

        {/* Empty hint */}
        {items.length===0&&!loadingCanvas&&(
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

      {/* ── Link modal ── */}
      {linkModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setLinkModal(false)}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:380}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:14}}>🔗 Добавить ссылку</div>
            <input autoFocus value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="https://example.com"
              onKeyDown={e=>{if(e.key==="Enter")fetchLink();if(e.key==="Escape")setLinkModal(false);}}
              style={iS}/>
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
        V-выбор · H-пан · S-стикер · T-текст · I-фото · L-ссылка · F-фигура · C-линия · M-маркер · Del-удалить · Ctrl+D-дублировать
      </div>
    </div>
  );
}
