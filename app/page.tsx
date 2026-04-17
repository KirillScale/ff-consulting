"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
const NAV=[
  {id:"dashboard",label:"Dashboard",ic:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"},
  {id:"strategy",label:"Стратегия роста",ic:"M5 3l3.057 7.134L2 16h5.5L12 21l4.5-5H22l-6.057-5.866L19 3l-7 4-7-4z",glow:true},
  {id:"crm",label:"CRM",ic:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"},
  {id:"calls",label:"Созвоны",ic:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"},
  {id:"content",label:"Контент-план",ic:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"},
  {id:"media",label:"Медийность",ic:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"},
  {id:"ads",label:"Реклама",ic:"M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"},
  {id:"pnl",label:"P&L",ic:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
  {id:"calc",label:"Калькулятор",ic:"M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"},
  {id:"tools",label:"Инструменты",ic:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"},
];
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
const Logo = ({s=22}:{s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={C.a} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>;
const Brand = ({size="md"}:{size?:string}) => {
  const sz:any={sm:{f:12,sub:8,gap:1},md:{f:15,sub:9,gap:2},lg:{f:20,sub:11,gap:3}};
  const s=sz[size]||sz.md;
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",lineHeight:1.2}}><span style={{fontSize:s.f,fontWeight:800,color:"#fff",letterSpacing:2}}>FF CONSULTING</span><span style={{fontSize:s.sub,fontWeight:300,color:"rgba(255,255,255,0.6)",letterSpacing:1.5,marginTop:s.gap}}>by Kirill Scales</span></div>;
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

/* ============ SIDEBAR ============ */
function Side({active,onNav,onLogout}:{active:string,onNav:(id:string)=>void,onLogout:()=>void}){
  const[c,sC]=useState(false);
  return(
    <div style={{width:c?72:252,minHeight:"100vh",background:C.dk,display:"flex",flexDirection:"column",transition:"width 0.3s",position:"fixed",left:0,top:0,zIndex:100,overflowX:"hidden"}}>
      <div style={{padding:c?"24px 0":"24px 20px",display:"flex",alignItems:"center",gap:10,justifyContent:c?"center":"flex-start",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <Logo s={24}/>{!c&&<Brand size="sm"/>}
      </div>
      <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:2}}>
        {NAV.map(n=>{const a=active===n.id;const gl=(n as any).glow&&!a;return<button key={n.id} onClick={()=>onNav(n.id)} title={c?n.label:undefined} style={{display:"flex",alignItems:"center",gap:12,padding:c?"12px 0":"11px 14px",justifyContent:c?"center":"flex-start",border:gl?"1px solid rgba(37,99,235,0.4)":"none",borderRadius:10,cursor:"pointer",background:a?C.a:gl?"rgba(37,99,235,0.1)":"transparent",color:"#fff",fontSize:13.5,fontWeight:a?600:gl?600:400,whiteSpace:"nowrap",overflow:"hidden",boxShadow:gl?"0 0 12px rgba(37,99,235,0.3)":"none"}}><I path={n.ic} size={18} color={a?"#fff":gl?"#60a5fa":"rgba(255,255,255,0.6)"}/>{!c&&n.label}</button>})}
      </nav>
      <div style={{padding:"16px 10px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        <button onClick={()=>sC(!c)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",justifyContent:c?"center":"flex-start",border:"none",borderRadius:10,cursor:"pointer",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",fontSize:13}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{c?<polyline points="9 18 15 12 9 6"/>:<polyline points="15 18 9 12 15 6"/>}</svg>{!c&&"Свернуть"}
        </button>
        <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginTop:4,justifyContent:c?"center":"flex-start",border:"none",borderRadius:10,cursor:"pointer",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:13}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>{!c&&"Выйти"}
        </button>
      </div>
    </div>
  );
}

const Head=({name}:{name:string})=>{
  const greeting = getGreeting();
  const displayName = name && name !== "User" ? name : "";
  return <div style={{height:64,background:C.w,borderBottom:"1px solid "+C.bd,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",position:"sticky",top:0,zIndex:50}}>
    <div style={{fontSize:15,fontWeight:600}}>{greeting}{displayName?", "+displayName:""}</div>
    <div style={{display:"inline-flex",alignItems:"center",gap:10,background:C.dk,padding:"8px 20px",borderRadius:10}}><Logo s={16}/><div style={{display:"flex",flexDirection:"column",lineHeight:1.15}}><span style={{color:"#fff",fontSize:11,fontWeight:800,letterSpacing:1.5}}>FF CONSULTING</span><span style={{color:"rgba(255,255,255,0.5)",fontSize:8,fontWeight:300,letterSpacing:1}}>by Kirill Scales</span></div></div>
    <div style={{fontSize:14,color:C.t2}}>{fmtDate(new Date())}</div>
  </div>;
};

const Placeholder=({title,ic}:{title:string,ic:string})=><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"calc(100vh - 180px)",gap:20}}><div style={{width:80,height:80,borderRadius:20,background:C.a+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><I path={ic} size={36} color={C.a} sw={1.2}/></div><div style={{fontSize:22,fontWeight:700}}>{title}</div><Card style={{padding:"12px 24px"}}><span style={{fontSize:14,color:C.t2}}>Раздел скоро будет доступен</span></Card></div>;

/* ============ MAIN APP ============ */
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadName(session.user.id); }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); loadName(session.user.id); }
      else { setUser(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadName = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("name").eq("id", uid).single();
    if (data?.name) setUserName(data.name);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("dashboard");
  };

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,fontFamily:"'Montserrat',sans-serif"}}><div style={{fontSize:18,color:C.t2}}>Загрузка...</div></div>;
  if (!user) return <Auth onLogin={(u) => { setUser(u); loadName(u.id); }} />;

  const nav = NAV.find(n => n.id === page);

  return (
    <div style={{fontFamily:"'Montserrat',-apple-system,BlinkMacSystemFont,sans-serif",background:C.bg,minHeight:"100vh",color:C.t1}}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      <Side active={page} onNav={setPage} onLogout={logout}/>
      <div style={{marginLeft:252,minHeight:"100vh"}}>
        <Head name={userName}/>
        <div style={{padding:"28px 32px"}}>
          {page === "dashboard" && <DashPage userId={user.id} name={userName} onNav={setPage}/>}
          {page === "strategy" && <StrategyPage userId={user.id}/>}
          {page === "crm" && <CrmPage userId={user.id}/>}
          {page === "calls" && <CallsPage userId={user.id}/>}
          {page === "content" && <ContentPage userId={user.id}/>}
          {page === "pnl" && <PnlPage userId={user.id}/>}
          {page === "media" && <MediaPage userId={user.id}/>}
          {page === "ads" && <AdsPage userId={user.id}/>}
          {page === "calc" && <CalcPage/>}
          {page === "tools" && <ToolsPage/>}
          {!["dashboard","strategy","crm","calls","content","pnl","media","ads","calc","tools"].includes(page) && nav && <Placeholder title={nav.label} ic={nav.ic}/>}
        </div>
      </div>
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
      {done<total&&<circle cx={cx} cy={cy} r={r} fill="none" stroke={C.bd} strokeWidth={stroke}
        strokeDasharray={`${circ*(1-doneFrac)} ${circ*doneFrac}`}
        strokeDashoffset={-circ*doneFrac} strokeLinecap="round"
        onMouseEnter={()=>setHover("todo")} onMouseLeave={()=>setHover(null)}/>}
    </svg>
    <div style={{position:"absolute",textAlign:"center",pointerEvents:"none"}}>
      {hover==="done"?<><div style={{fontSize:13,fontWeight:700,color:C.a}}>Выполнено</div><div style={{fontSize:12,color:C.t2}}>{done} из {total}</div></>
      :hover==="todo"?<><div style={{fontSize:13,fontWeight:700,color:C.t2}}>Осталось</div><div style={{fontSize:12,color:C.t2}}>{total-done} из {total}</div></>
      :<><div style={{fontSize:22,fontWeight:800,color:C.a}}>{pct}%</div><div style={{fontSize:10,color:C.t2,marginTop:1}}>выполнено</div></>}
    </div>
  </div>;
}

function DashPage({userId,name,onNav}:{userId:string,name:string,onNav:(p:string)=>void}){
  const leads = useTable("leads", userId);
  const pnl = useTable("pnl", userId);
  const kanban = useTable("kanban", userId);
  const goalTasks = useTable("goal_tasks", userId);
  const content = useTable("content", userId);
  const calls = useTable("calls", userId);
  const media = useTable("media", userId);
  const td = today();
  const cm = td.substring(0,7);

  const todayTasks = kanban.data.filter((t:any)=>t.date===td&&t.type!=="delegate");
  const todayGoalTasks = goalTasks.data.filter((t:any)=>t.date===td&&t.type!=="delegate");
  // Объединяем по id чтобы не было дублей если одна запись попала в обе таблицы
  const allTodayTasksMap = new Map<string,any>();
  [...todayTasks, ...todayGoalTasks].forEach(t=>allTodayTasksMap.set(t.id, t));
  const allTodayTasks = Array.from(allTodayTasksMap.values());
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
    <div style={{background:`linear-gradient(135deg,${C.dk},${C.da})`,borderRadius:16,padding:"32px 36px",marginBottom:24,color:"#fff"}}>
      <div style={{fontSize:24,fontWeight:700,marginBottom:6}}>{getGreeting()}{name&&name!=="User"?", "+name:""}</div>
      <div style={{fontSize:14,opacity:0.7}}>Сегодня {fmtDate(new Date())}</div>
    </div>

    {/* Stat cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
      {[{l:"Задачи",v:allTodayTasks.filter((t:any)=>t.status!=="done"&&!t.done).length,c:C.a},{l:"Лиды",v:leads.data.length,c:C.g},{l:"Публикации",v:content.data.filter((x:any)=>x.status==="published").length,c:C.y},{l:"Прибыль",v:(cP>=0?"+":"")+fmt$(cP)+" ₽",c:cP>=0?C.g:C.r}].map((s,i)=><Card key={i} style={{padding:"22px 24px"}}><div style={{fontSize:28,fontWeight:700,marginBottom:4}}>{s.v}</div><div style={{fontSize:13,color:C.t2}}>{s.l}</div></Card>)}
    </div>

    {/* NEW: donut + media summary */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
      {/* Donut */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <span style={{fontSize:16,fontWeight:600}}>Прогресс задач сегодня</span>
          <button onClick={()=>onNav("strategy")} style={{fontSize:13,color:C.a,background:"none",border:"none",cursor:"pointer"}}>Стратегия</button>
        </div>
        {allTodayTasks.length===0
          ? <div style={{padding:"32px 0",textAlign:"center",color:C.t2,fontSize:14}}>На сегодня задач нет</div>
          : <div style={{display:"flex",alignItems:"center",gap:24}}>
              <DonutChart done={doneTodayTasks.length} total={allTodayTasks.length}/>
              <div style={{display:"flex",flexDirection:"column",gap:10,flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:10,height:10,borderRadius:3,background:C.a}}/>
                  <span style={{fontSize:13,color:C.t2}}>Выполнено</span>
                  <span style={{fontSize:15,fontWeight:700,marginLeft:"auto"}}>{doneTodayTasks.length}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:10,height:10,borderRadius:3,background:C.bd}}/>
                  <span style={{fontSize:13,color:C.t2}}>Осталось</span>
                  <span style={{fontSize:15,fontWeight:700,marginLeft:"auto"}}>{allTodayTasks.length-doneTodayTasks.length}</span>
                </div>
                <div style={{height:1,background:C.bd,margin:"2px 0"}}/>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,color:C.t2}}>Всего</span>
                  <span style={{fontSize:15,fontWeight:700,marginLeft:"auto"}}>{allTodayTasks.length}</span>
                </div>
              </div>
            </div>
        }
      </Card>

      {/* Media summary */}
      <div onClick={()=>onNav("media")} style={{cursor:"pointer",background:C.w,borderRadius:16,padding:24,boxShadow:C.sh}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <span style={{fontSize:16,fontWeight:600}}>Медийность</span>
          <span style={{fontSize:12,color:C.a}}>Подробнее →</span>
        </div>
        {!latestMedia
          ? <div style={{padding:"32px 0",textAlign:"center",color:C.t2,fontSize:14}}>Нет данных. Добавь в разделе Медийность.</div>
          : <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:11,color:C.t2,marginBottom:4}}>Последнее обновление: {latestMedia.date}</div>
              {[
                {label:"Instagram",key:"ig",color:C.pk,icon:"📸"},
                {label:"YouTube",key:"yt",color:C.r,icon:"▶️"},
                {label:"Telegram",key:"tg",color:C.a,icon:"✈️"},
              ].map(p=><div key={p.key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:C.bg,borderRadius:10,border:"1px solid "+C.bd}}>
                <span style={{fontSize:18}}>{p.icon}</span>
                <span style={{fontSize:14,flex:1,fontWeight:500}}>{p.label}</span>
                <span style={{fontSize:18,fontWeight:800,color:p.color}}>{fmt$(latestMedia[p.key]||0)}</span>
              </div>)}
            </div>
        }
      </div>
    </div>

    {/* Tasks + P&L */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{fontSize:16,fontWeight:600}}>Задачи сегодня</span><button onClick={()=>onNav("strategy")} style={{fontSize:13,color:C.a,background:"none",border:"none",cursor:"pointer"}}>Стратегия</button></div>
        {allTodayTasks.filter((t:any)=>t.status!=="done"&&!t.done).length===0
          ? <div style={{padding:"24px 0",textAlign:"center",color:C.t2,fontSize:14}}>Нет задач</div>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>{allTodayTasks.filter((t:any)=>t.status!=="done"&&!t.done).slice(0,5).map((t:any)=><div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:C.bg,borderRadius:10,borderLeft:"3px solid "+(t.type==="biz"?C.a:C.y)}}><span style={{fontSize:14,flex:1}}>{t.text}</span><Tag label={tsLbl(t.status||"todo")} color={tsCol(t.status||"todo")}/><span style={{fontSize:11,color:C.t2}}>{t.mins}м</span></div>)}</div>
        }
      </Card>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{fontSize:16,fontWeight:600}}>P&L (месяц)</span><button onClick={()=>onNav("pnl")} style={{fontSize:13,color:C.a,background:"none",border:"none",cursor:"pointer"}}>Подробнее</button></div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:C.bg,borderRadius:10}}><span>Доходы</span><span style={{fontWeight:600,color:C.g}}>{fmt$(cI)} ₽</span></div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:C.bg,borderRadius:10}}><span>Расходы</span><span style={{fontWeight:600,color:C.r}}>{fmt$(cE)} ₽</span></div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:cP>=0?"#F0FDF4":"#FEF2F2",borderRadius:10}}><span style={{fontWeight:600}}>Прибыль</span><span style={{fontWeight:700,color:cP>=0?C.g:C.r}}>{(cP>=0?"+":"")+fmt$(cP)} ₽</span></div>
        </div>
      </Card>
    </div>

    {/* Calls */}
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <span style={{fontSize:16,fontWeight:600}}>Созвоны</span>
        <button onClick={()=>onNav("calls")} style={{fontSize:13,color:C.a,background:"none",border:"none",cursor:"pointer"}}>Все созвоны</button>
      </div>
      {upcomingCalls.length===0
        ? <div style={{padding:"24px 0",textAlign:"center",color:C.t2,fontSize:14}}>Созвоны не запланированы</div>
        : <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {upcomingCalls.map((c:any)=>{
              const isToday = c.date === td;
              const mins = isToday ? minsUntilCall(c) : null;
              const isPast = mins !== null && mins < 0;
              const isImminentOrNow = mins !== null && mins >= 0;
              return <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:isToday?"#FFF7ED":C.bg,borderRadius:10,borderLeft:"3px solid "+(isToday?C.y:C.a)}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
                    {isToday&&<span style={{color:C.y,fontSize:16}}>!</span>}
                    {callLabel(c)}
                  </div>
                  <div style={{fontSize:12,color:C.t2,marginTop:2}}>{c.date} в {c.time_start}{c.time_end?" - "+c.time_end:""}</div>
                </div>
                {isToday && isImminentOrNow && <span style={{fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,background:C.y+"22",color:C.y,whiteSpace:"nowrap"}}>Созвон сегодня через {mins} мин</span>}
                {isToday && isPast && <span style={{fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,background:C.r+"18",color:C.r}}>Сегодня</span>}
                {!isToday && <span style={{fontSize:11,color:C.t2}}>{c.date}</span>}
              </div>;
            })}
          </div>
      }
    </Card>
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
function GoalsBlock({userId,goals,goalTasks,dndDrag,dndOver,setDndDrag,setDndOver,onGtDragStart,onGtDragOver,onGtDrop,setActiveModal,TYPES}:any){
  const[openGoal,setOpenGoal]=useState<string|null>(null);
  const[showGTF,setShowGTF]=useState<string|null>(null);
  const[gtf,sGtf]=useState({text:"",mins:30,type:"biz",date:""});
  const[tfErr,setTfErr]=useState("");
  const[showNewGoal,setShowNewGoal]=useState(false);
  const[newGoal,sNewGoal]=useState({name:"",description:"",color:C.a,start_date:"",end_date:""});
  const[editGoalId,setEditGoalId]=useState<string|null>(null);
  const[editGoalData,setEditGoalData]=useState<any>({});

  const COLORS=[C.a,"#8B5CF6",C.g,C.r,C.y,C.pk,"#06B6D4","#F97316"];

  // Ensure system pinned block exists
  useEffect(()=>{
    if(!userId||goals.loading)return;
    const hasPinned=goals.data.some((g:any)=>g.is_system_pinned);
    if(!hasPinned){
      goals.add({name:"Масштабные цели",color:C.a,is_system_pinned:true});
    }
  },[userId,goals.loading,goals.data.length]);

  const systemBlock=goals.data.find((g:any)=>g.is_system_pinned);
  // Child goals = goals with parent_id = systemBlock.id, or regular non-pinned goals
  const childGoals=useMemo(()=>{
    if(!systemBlock)return goals.data.filter((g:any)=>!g.is_system_pinned);
    return goals.data.filter((g:any)=>!g.is_system_pinned);
  },[goals.data,systemBlock]);

  const addChildGoal=async()=>{
    if(!newGoal.name.trim())return;
    await goals.add({
      name:newGoal.name,description:newGoal.description,color:newGoal.color,
      start_date:newGoal.start_date||null,end_date:newGoal.end_date||null,
      deadline:newGoal.end_date||null,
      parent_id:systemBlock?.id||null,
      is_system_pinned:false,
    });
    sNewGoal({name:"",description:"",color:C.a,start_date:"",end_date:""});
    setShowNewGoal(false);
  };

  const saveGoalEdit=async()=>{
    if(!editGoalId||!editGoalData.name?.trim())return;
    await goals.update(editGoalId,{
      name:editGoalData.name,description:editGoalData.description,color:editGoalData.color,
      start_date:editGoalData.start_date||null,end_date:editGoalData.end_date||null,
      deadline:editGoalData.end_date||null,
    });
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

  return <div style={{background:C.w,borderRadius:20,boxShadow:"0 4px 24px rgba(0,0,0,0.07)",border:"1px solid "+C.bd,overflow:"hidden"}}>
    {/* Header */}
    <div style={{padding:"18px 24px",background:`linear-gradient(135deg,${C.dk},${C.da})`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>Масштабные цели</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:1}}>{childGoals.length} {childGoals.length===1?"цель":"целей"}</div>
        </div>
      </div>
      <button onClick={()=>setShowNewGoal(!showNewGoal)} style={{padding:"8px 16px",background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.25)",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Цель</button>
    </div>

    {/* New goal form */}
    {showNewGoal&&<div style={{padding:"20px 24px",borderBottom:"1px solid "+C.bd,background:"#FAFBFD"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
        <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Название цели *</label><input value={newGoal.name} onChange={e=>sNewGoal({...newGoal,name:e.target.value})} style={iS} placeholder="Запустить воронку..."/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Начало</label><input type="date" value={newGoal.start_date} onChange={e=>sNewGoal({...newGoal,start_date:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Конец</label><input type="date" value={newGoal.end_date} onChange={e=>sNewGoal({...newGoal,end_date:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Цвет</label><div style={{display:"flex",gap:5,marginTop:2}}>{COLORS.map((c:string)=><button key={c} onClick={()=>sNewGoal({...newGoal,color:c})} style={{width:26,height:26,borderRadius:7,background:c,border:newGoal.color===c?"3px solid #111":"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
        <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:5,fontWeight:600}}>Описание</label><textarea value={newGoal.description} onChange={e=>sNewGoal({...newGoal,description:e.target.value})} rows={2} style={{...iS,resize:"none"}}/></div>
      </div>
      <div style={{display:"flex",gap:8}}><Btn onClick={addChildGoal}>Создать цель</Btn><Btn primary={false} onClick={()=>setShowNewGoal(false)}>Отмена</Btn></div>
    </div>}

    {/* Goals list */}
    <div style={{padding:"16px 24px",display:"flex",flexDirection:"column",gap:12}}>
      {childGoals.length===0&&!showNewGoal&&<div style={{padding:"32px 0",textAlign:"center",color:C.t2,fontSize:14}}>Создай первую цель</div>}

      {childGoals.map((g:any)=>{
        const p=goalProgress(g.id);
        const gTasks=[...goalTasks.data.filter((t:any)=>t.goal_id===g.id)].sort((a:any,b:any)=>(a.sort_order||0)-(b.sort_order||0));
        const isOpen=openGoal===g.id;
        const isEditing=editGoalId===g.id;

        return <div key={g.id} style={{background:C.bg,borderRadius:14,overflow:"hidden",border:"1px solid "+C.bd}}>
          {/* Edit form */}
          {isEditing&&<div style={{padding:"16px 18px",background:C.w,borderBottom:"1px solid "+C.bd}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
              <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Название</label><input value={editGoalData.name||""} onChange={e=>setEditGoalData({...editGoalData,name:e.target.value})} style={iS}/></div>
              <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Начало</label><input type="date" value={editGoalData.start_date||""} onChange={e=>setEditGoalData({...editGoalData,start_date:e.target.value})} style={iS}/></div>
              <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Конец</label><input type="date" value={editGoalData.end_date||""} onChange={e=>setEditGoalData({...editGoalData,end_date:e.target.value})} style={iS}/></div>
              <div><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Цвет</label><div style={{display:"flex",gap:4,marginTop:2}}>{COLORS.map((c:string)=><button key={c} onClick={()=>setEditGoalData({...editGoalData,color:c})} style={{width:22,height:22,borderRadius:6,background:c,border:(editGoalData.color||C.a)===c?"3px solid #111":"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
              <div style={{gridColumn:"span 3"}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:4,fontWeight:600}}>Описание</label><textarea value={editGoalData.description||""} onChange={e=>setEditGoalData({...editGoalData,description:e.target.value})} rows={2} style={{...iS,resize:"none"}}/></div>
            </div>
            <div style={{display:"flex",gap:8}}><Btn onClick={saveGoalEdit} style={{padding:"8px 16px",fontSize:13}}>Сохранить</Btn><Btn primary={false} onClick={()=>setEditGoalId(null)} style={{padding:"8px 14px",fontSize:13}}>Отмена</Btn></div>
          </div>}

          {/* Goal header */}
          <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12,borderLeft:`4px solid ${g.color||C.a}`,background:C.w,cursor:"pointer"}} onClick={()=>setOpenGoal(isOpen?null:g.id)}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontSize:14,fontWeight:700,color:C.t1}}>{g.name}</span>
                {g.start_date&&g.end_date&&<span style={{fontSize:11,color:C.t2,background:C.bd,padding:"2px 8px",borderRadius:20}}>{g.start_date.substring(5)} — {g.end_date.substring(5)}</span>}
              </div>
              {g.description&&<div style={{fontSize:12,color:C.t2,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.description}</div>}
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1,height:6,background:C.bd,borderRadius:3,overflow:"hidden",maxWidth:200}}><div style={{width:p+"%",height:"100%",background:prgColor(p),borderRadius:3,transition:"width 0.3s"}}/></div>
                <span style={{fontSize:11,color:C.t2,whiteSpace:"nowrap"}}>{gTasks.filter((t:any)=>t.status==="done"||t.done).length}/{gTasks.length} задач ({p}%)</span>
              </div>
            </div>
            <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>{setEditGoalId(g.id);setEditGoalData({...g});setOpenGoal(null);}} style={{padding:"6px 12px",fontSize:12,background:C.a+"12",color:C.a,border:"1px solid "+C.a+"22",borderRadius:8,cursor:"pointer",fontWeight:500}}>Изменить</button>
              <button onClick={()=>goals.remove(g.id)} style={{padding:"6px 10px",fontSize:12,background:C.r+"10",color:C.r,border:"1px solid "+C.r+"22",borderRadius:8,cursor:"pointer"}}>×</button>
              <button style={{width:28,height:28,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5"><polyline points={isOpen?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
              </button>
            </div>
          </div>

          {/* Tasks list */}
          {isOpen&&<div style={{padding:"10px 18px 14px"}}>
            {gTasks.map((t:any)=>{
              const isDone=t.status==="done"||t.done;
              const isOver=dndOver===t.id;
              return <div key={t.id}
                draggable
                onDragStart={()=>onGtDragStart(t.id)}
                onDragOver={(e:React.DragEvent)=>onGtDragOver(t.id,e)}
                onDrop={()=>onGtDrop(t.id,g.id)}
                onDragEnd={()=>{setDndDrag(null);setDndOver(null);}}
                style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,
                  background:isDone?"#F0FDF4":C.w,marginBottom:6,
                  borderLeft:"3px solid "+(t.type==="biz"?C.a:t.type==="delegate"?C.t2:C.y),
                  opacity:dndDrag===t.id?0.4:1,
                  boxShadow:isOver?"0 0 0 2px "+C.a:"0 1px 3px rgba(0,0,0,0.05)",
                  cursor:"grab",border:"1px solid "+C.bd,
                  borderLeftWidth:3,
                }}>
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

            {/* Add task form */}
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
      })}
    </div>
  </div>;
}

function StrategyPage({userId}:{userId:string}){
  const kanban = useTable("kanban", userId);
  const goals = useTable("goals", userId);
  const goalTasks = useTable("goal_tasks", userId);
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

  const days=useMemo(()=>{const d=[];for(let i=0;i<7;i++){const dt=new Date();dt.setDate(dt.getDate()+i);d.push(ds(dt));}return d;},[]);
  const td=today();
  const WDS=["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
  const TYPES=[{id:"biz",label:"Бизнес",c:C.a},{id:"other",label:"Другое",c:C.y},{id:"delegate",label:"Делегировано",c:C.t2}];
  const typeColor=(t:string)=>(TYPES.find(x=>x.id===t)||{c:C.t2}).c;

  const tasksForDay=(d:string)=>{
    const manual=kanban.data.filter((t:any)=>t.date===d);
    const fromGoals=goalTasks.data.filter((t:any)=>t.date===d).map((t:any)=>({...t,fromGoal:true,goalColor:goals.data.find((g:any)=>g.id===t.goal_id)?.color||C.a}));
    return[...manual,...fromGoals];
  };

  const addTask=async(d:string)=>{
    setTfErr("");
    if(!tf.text.trim()){setTfErr("Введи задачу");return;}
    if(tf.mins<30){setTfErr("Минимум 30 минут");return;}
    await kanban.add({text:tf.text,mins:tf.mins,type:tf.type,date:d,done:false,status:"todo",sort_order:0});
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

  const visibleDays=days.slice(scroll,scroll+4);

  const TaskItem=({t,showDate=false}:{t:any,showDate?:boolean})=>{
    const status=t.status||"todo";
    const statusColor=tsCol(status);
    const isDone=status==="done";
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
    return <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:isDone?"#F0FDF4":C.bg,borderLeft:"3px solid "+typeColor(t.type)}}>
      <button onClick={()=>cycleTaskStatus(t)} title={tsLbl(status)} style={{width:20,height:20,minWidth:20,borderRadius:6,border:"2px solid "+statusColor,background:isDone?C.g:status==="inprogress"?C.y+"33":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
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
      {/* Kanban */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:18,fontWeight:700}}>Задачи на 7 дней</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setScroll(Math.max(0,scroll-1))} disabled={scroll===0} style={{width:36,height:36,borderRadius:10,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:scroll===0?0.3:1}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
            <button onClick={()=>setScroll(Math.min(3,scroll+1))} disabled={scroll>=3} style={{width:36,height:36,borderRadius:10,border:"1px solid "+C.bd,background:C.w,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:scroll>=3?0.3:1}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          {visibleDays.map(d=>{const st=dayStats(d);const isT=d===td;const isPast=d<td;const dt=new Date(d);
            const bc=isT?C.a:st.allDone?C.g:isPast&&!st.allDone&&st.tasks.length>0?C.r:"transparent";
            return<div key={d} style={{background:C.w,borderRadius:16,boxShadow:C.sh,border:"2px solid "+bc,display:"flex",flexDirection:"column",minHeight:300}}>
              <div style={{padding:"14px 16px",borderBottom:"1px solid "+C.bd,display:"flex",justifyContent:"space-between",background:isT?"rgba(37,99,235,0.04)":"transparent"}}>
                <div><div style={{fontSize:20,fontWeight:700,color:isT?C.a:C.t1}}>{dt.getDate()}</div><div style={{fontSize:11,color:C.t2}}>{WDS[dt.getDay()]}, {MR[dt.getMonth()].substring(0,3)}</div></div>
                {st.overload&&<span style={{fontSize:10,color:C.r,fontWeight:600}}>⚠️ Перегруз</span>}
              </div>
              <div style={{flex:1,padding:"10px 12px",overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
                {st.tasks.length===0&&<div style={{textAlign:"center",color:C.t2,fontSize:12,padding:"20px 0"}}>Нет задач</div>}
                {st.tasks.map((t:any)=><TaskItem key={t.id} t={t}/>)}
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
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
      <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:16,alignItems:"flex-start"}}>
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
function ContentPage({userId}:{userId:string}){
  const{data:items,add,update,remove}=useTable("content",userId);
  const[tab,setTab]=useState<"list"|"calendar">("list");
  const[show,setShow]=useState(false);
  const[editId,setEditId]=useState<string|null>(null);
  const[f,sF]=useState({platform:"instagram",type:"Пост",topic:"",status:"idea",date:today(),link:"",scenario:""});
  const[calMonth,setCalMonth]=useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()};});

  const sub=async()=>{
    if(!f.topic.trim())return;
    if(editId){
      await update(editId,f);
      setEditId(null);
    }else{
      await add(f);
    }
    sF({platform:"instagram",type:"Пост",topic:"",status:"idea",date:today(),link:"",scenario:""});
    setShow(false);
  };

  const startEdit=(item:any)=>{
    sF({platform:item.platform,type:item.type,topic:item.topic,status:item.status,date:item.date,link:item.link||"",scenario:item.scenario||""});
    setEditId(item.id);
    setShow(true);
  };

  const calDays=useMemo(()=>{
    const first=new Date(calMonth.y,calMonth.m,1);
    const last=new Date(calMonth.y,calMonth.m+1,0);
    const days=[];
    const startDay=first.getDay()===0?6:first.getDay()-1;
    for(let i=0;i<startDay;i++)days.push(null);
    for(let i=1;i<=last.getDate();i++)days.push(new Date(calMonth.y,calMonth.m,i));
    return days;
  },[calMonth]);

  const itemsForDay=(d:Date)=>items.filter((x:any)=>x.date===ds(d));

  const topByPlatform=useMemo(()=>{
    const res:any={};
    PLATS.forEach(p=>{const pts=items.filter((x:any)=>x.platform===p.id&&x.status==="published");res[p.id]=pts.length;});
    return Object.entries(res).sort((a:any,b:any)=>b[1]-a[1]).slice(0,5);
  },[items]);

  return <>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
      {[{l:"Всего",v:items.length,c:C.a},{l:"В работе",v:items.filter((x:any)=>x.status==="progress").length,c:C.y},{l:"Готово",v:items.filter((x:any)=>x.status==="ready").length,c:C.a},{l:"Опубликовано",v:items.filter((x:any)=>x.status==="published").length,c:C.g}].map((s,i)=><Card key={i} style={{padding:"20px 24px"}}><div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:13,color:C.t2,marginTop:4}}>{s.l}</div></Card>)}
    </div>

    {topByPlatform.some((x:any)=>x[1]>0)&&<Card style={{marginBottom:20,padding:16}}><div style={{fontSize:13,fontWeight:600,marginBottom:10,color:C.t2}}>Топ платформ (опубликовано)</div><div style={{display:"flex",gap:16}}>{topByPlatform.filter((x:any)=>x[1]>0).map(([pid,cnt]:any)=><div key={pid} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:2,background:pCol(pid)}}/><span style={{fontSize:13}}>{pLbl(pid)}</span><span style={{fontSize:13,fontWeight:700,color:pCol(pid)}}>{cnt}</span></div>)}</div></Card>}

    <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"2px solid "+C.bd}}>
      {[{id:"list",label:"Контент"},{id:"calendar",label:"Календарь"}].map(t=><button key={t.id} onClick={()=>setTab(t.id as any)} style={{padding:"10px 20px",background:"none",border:"none",borderBottom:tab===t.id?"3px solid "+C.a:"3px solid transparent",color:tab===t.id?C.a:C.t2,fontSize:14,fontWeight:tab===t.id?600:400,cursor:"pointer",marginBottom:-2}}>{t.label}</button>)}
    </div>

    {tab==="list"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:600}}>Контент</div>
        <Btn onClick={()=>{setShow(!show);setEditId(null);sF({platform:"instagram",type:"Пост",topic:"",status:"idea",date:today(),link:"",scenario:""});}}>+ Контент</Btn>
      </div>
      {show&&<Card style={{marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>{editId?"Редактировать":"Добавить контент"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Тема</label><input value={f.topic} onChange={e=>sF({...f,topic:e.target.value})} style={iS}/></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Платформа</label><select value={f.platform} onChange={e=>sF({...f,platform:e.target.value})} style={iS}>{PLATS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Тип</label><select value={f.type} onChange={e=>sF({...f,type:e.target.value})} style={iS}>{CTYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Статус</label><select value={f.status} onChange={e=>sF({...f,status:e.target.value})} style={iS}>{CSTATS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Дата</label><input type="date" value={f.date} onChange={e=>sF({...f,date:e.target.value})} style={iS}/></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Ссылка</label><input value={f.link} onChange={e=>sF({...f,link:e.target.value})} style={iS}/></div>
          <div style={{gridColumn:"span 3"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Сценарий</label><textarea value={f.scenario} onChange={e=>sF({...f,scenario:e.target.value})} rows={3} style={{...iS,resize:"vertical"}}/></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:16}}><Btn onClick={sub}>{editId?"Сохранить":"Добавить"}</Btn><Btn primary={false} onClick={()=>{setShow(false);setEditId(null);}}>Отмена</Btn></div>
      </Card>}
      <Card style={{padding:0,overflow:"hidden"}}>{items.length===0?<div style={{padding:"48px",textAlign:"center",color:C.t2}}>Нет публикаций</div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{borderBottom:"2px solid "+C.bd}}>{["Дата","Платформа","Тип","Тема","Статус",""].map((h,i)=><th key={i} style={{padding:"14px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:C.t2,textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{items.map((x:any)=><tr key={x.id} style={{borderBottom:"1px solid "+C.bd}}><td style={{padding:"12px 16px",fontSize:13}}>{x.date}</td><td style={{padding:"12px 16px"}}><Tag label={pLbl(x.platform)} color={pCol(x.platform)}/></td><td style={{padding:"12px 16px"}}>{x.type}</td><td style={{padding:"12px 16px",fontWeight:500}}>{x.topic}{x.scenario&&<div style={{fontSize:11,color:C.t2,marginTop:2,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{x.scenario}</div>}</td><td style={{padding:"12px 16px"}}><Tag label={csLbl(x.status)} color={csCol(x.status)}/></td><td style={{padding:"12px 8px",display:"flex",gap:4,alignItems:"center"}}><button onClick={()=>startEdit(x)} style={{width:28,height:28,borderRadius:6,border:"none",background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={12} color={C.a} sw={2}/></button><button onClick={()=>remove(x.id)} style={{width:28,height:28,borderRadius:6,border:"none",background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I path="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={12} color={C.r} sw={2}/></button></td></tr>)}</tbody></table></div>}</Card>
    </>}

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
            return<div key={i} style={{minHeight:100,padding:"6px",borderRight:i%7!==6?"1px solid "+C.bd:"none",borderBottom:"1px solid "+C.bd,background:isT?"rgba(37,99,235,0.03)":"transparent"}}>
              {d&&<><div style={{fontSize:13,fontWeight:isT?700:400,color:isT?C.a:C.t1,marginBottom:4}}>{d.getDate()}</div>
              {dayItems.map((x:any)=><div key={x.id} style={{fontSize:10,padding:"2px 5px",borderRadius:4,background:pCol(x.platform)+"22",color:pCol(x.platform),marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{x.topic}</div>)}</>}
            </div>;
          })}
        </div>
      </Card>
    </>}
  </>;
}

/* ============ P&L ============ */
function PnlPage({userId}:{userId:string}){
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
      {[{l:"Доходы",v:"+"+fmt$(cI)+" ₽",c:C.g},{l:"Расходы",v:fmt$(cE)+" ₽",c:C.r},{l:"Прибыль",v:(cP>=0?"+":"")+fmt$(cP)+" ₽",c:cP>=0?C.g:C.r}].map((s,i)=><Card key={i} style={{padding:"20px 24px"}}><div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:13,color:C.t2,marginTop:4}}>{s.l} (месяц)</div></Card>)}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><div style={{fontSize:18,fontWeight:600}}>Транзакции</div><Btn onClick={()=>setShow(!show)}>+ Транзакция</Btn></div>
    {show&&<Card style={{marginBottom:20}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
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
    {latest&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
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
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
          {[{l:"Instagram",key:"ig",c:C.pk},{l:"YouTube",key:"yt",c:C.r},{l:"Telegram",key:"tg",c:C.a}].map(p=><Card key={p.key} style={{padding:"16px 20px"}}>
            <div style={{fontSize:13,fontWeight:600,color:p.c,marginBottom:12}}>{p.l}</div>
            <LineChart data={filtered.map((d:any)=>d[p.key]||0)} color={p.c} label={p.l} width={chartW} height={130}/>
          </Card>)}
        </div>

        {/* Reach */}
        <div style={{marginBottom:8,fontSize:16,fontWeight:700}}>Охваты</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
      {[{l:"Общий бюджет",v:fmt$(totalBudget)+" ₽",c:C.a},{l:"Всего лидов",v:totalLeads,c:C.g},{l:"Средний CTR",v:avgCTR+"%",c:C.y},{l:"Средний CPL",v:avgCPL?fmt$(avgCPL)+" ₽":"–",c:C.pk}].map((s,i)=><Card key={i} style={{padding:"20px 24px"}}><div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:13,color:C.t2,marginTop:4}}>{s.l}</div></Card>)}
    </div>

    <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><div style={{fontSize:18,fontWeight:600}}>Рекламные кампании</div><Btn onClick={()=>setShow(!show)}>+ Кампания</Btn></div>
    {show&&<Card style={{marginBottom:20}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      {[{l:"Всего",v:stats.total,c:C.a},{l:"Сегодня",v:stats.today,c:C.y},{l:"Выполнено",v:stats.done,c:C.g},{l:"Предстоит",v:stats.upcoming,c:"#8B5CF6"}].map((s,i)=><div key={i} style={{background:C.w,borderRadius:14,padding:"14px 18px",boxShadow:C.sh}}>
        <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
        <div style={{fontSize:12,color:C.t2,marginTop:2}}>{s.l}</div>
      </div>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
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
            {([["1d","1д"],["3d","3д"],["7d","Нед"],["month","Мес"]] as const).map(([v,l])=><button key={v} onClick={()=>setCalView(v)} style={{padding:"5px 10px",border:"none",borderRadius:6,background:calView===v?C.w:"transparent",fontSize:11,fontWeight:calView===v?700:400,color:calView===v?C.a:C.t2,cursor:"pointer",boxShadow:calView===v?"0 1px 3px rgba(0,0,0,0.1)":"none"}}>{l}</button>)}
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
      <div style={{background:C.w,borderRadius:22,padding:"28px 28px 24px",width:"100%",maxWidth:500,boxShadow:"0 32px 80px rgba(0,0,0,0.22)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontSize:17,fontWeight:700}}>{editCall?"Редактировать созвон":"Новый созвон"}</div>
          {editCall&&<button onClick={()=>{if(confirm("Удалить созвон?"))remove(editCall.id).then(()=>setModal(false));}} style={{fontSize:12,color:C.r,background:C.r+"10",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:600}}>Удалить</button>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Название созвона</label><input value={f.title} onChange={e=>sF({...f,title:e.target.value})} placeholder="Разбор воронки с Игнатом..." style={iS}/></div>
          <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Дата</label><input type="date" value={f.date} onChange={e=>sF({...f,date:e.target.value})} style={iS}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Начало</label><input type="time" value={f.time_start} onChange={e=>sF({...f,time_start:e.target.value})} style={iS}/></div>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6,fontWeight:600}}>Конец</label><input type="time" value={f.time_end} onChange={e=>sF({...f,time_end:e.target.value})} style={iS}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
      {scenarios.map((sc,si)=>{const r=calc(sc.pr);return<Card key={si} style={{borderTop:"4px solid "+(si===0?C.r:si===1?C.y:C.g)}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:16,color:si===0?C.r:si===1?C.y:C.g}}>{sc.label}</div>
        {[{l:"Продаж",v:r.sales},{l:"Звонков",v:r.calls},{l:"Лидов",v:r.leads},{l:"Охват",v:fmt$(r.reach)}].map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+C.bd}}><span style={{fontSize:13,color:C.t2}}>{x.l}</span><span style={{fontSize:15,fontWeight:700}}>{x.v}</span></div>)}
      </Card>})}
    </div>
  </>;
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
