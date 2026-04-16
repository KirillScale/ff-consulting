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
const NAV=[
  {id:"dashboard",label:"Dashboard",ic:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"},
  {id:"strategy",label:"Стратегия роста",ic:"M5 3l3.057 7.134L2 16h5.5L12 21l4.5-5H22l-6.057-5.866L19 3l-7 4-7-4z",glow:true},
  {id:"crm",label:"CRM",ic:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"},
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

const Head=({name,sideCollapsed}:{name:string,sideCollapsed?:boolean})=>{
  const greeting = getGreeting();
  return <div style={{height:64,background:C.w,borderBottom:"1px solid "+C.bd,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",position:"sticky",top:0,zIndex:50}}>
    <div style={{fontSize:15,fontWeight:600}}>{greeting}, {name}</div>
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
          {page === "content" && <ContentPage userId={user.id}/>}
          {page === "pnl" && <PnlPage userId={user.id}/>}
          {page === "media" && <MediaPage userId={user.id}/>}
          {page === "ads" && <AdsPage userId={user.id}/>}
          {page === "calc" && <CalcPage/>}
          {page === "tools" && <ToolsPage/>}
          {!["dashboard","strategy","crm","content","pnl","media","ads","calc","tools"].includes(page) && nav && <Placeholder title={nav.label} ic={nav.ic}/>}
        </div>
      </div>
    </div>
  );
}

/* ============ DASHBOARD ============ */
function DashPage({userId,name,onNav}:{userId:string,name:string,onNav:(p:string)=>void}){
  const leads = useTable("leads", userId);
  const pnl = useTable("pnl", userId);
  const kanban = useTable("kanban", userId);
  const content = useTable("content", userId);
  const td = today();
  const cm = td.substring(0,7);
  const todayTasks = kanban.data.filter(t=>t.date===td&&t.status!=="done"&&t.type!=="delegate");
  const cI = pnl.data.filter(t=>t.type==="income"&&t.date?.startsWith(cm)).reduce((s:number,t:any)=>s+(t.amount||0),0);
  const cE = pnl.data.filter(t=>t.type==="expense"&&t.date?.startsWith(cm)).reduce((s:number,t:any)=>s+(t.amount||0),0);
  const cP = cI-cE;

  return <>
    <div style={{background:`linear-gradient(135deg,${C.dk},${C.da})`,borderRadius:16,padding:"32px 36px",marginBottom:24,color:"#fff"}}>
      <div style={{fontSize:24,fontWeight:700,marginBottom:6}}>{getGreeting()}, {name}</div>
      <div style={{fontSize:14,opacity:0.7}}>Сегодня {fmtDate(new Date())}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
      {[{l:"Задачи",v:todayTasks.length,c:C.a},{l:"Лиды",v:leads.data.length,c:C.g},{l:"Публикации",v:content.data.filter((x:any)=>x.status==="published").length,c:C.y},{l:"Прибыль",v:(cP>=0?"+":"")+fmt$(cP)+" ₽",c:cP>=0?C.g:C.r}].map((s,i)=><Card key={i} style={{padding:"22px 24px"}}><div style={{fontSize:28,fontWeight:700,marginBottom:4}}>{s.v}</div><div style={{fontSize:13,color:C.t2}}>{s.l}</div></Card>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{fontSize:16,fontWeight:600}}>Задачи сегодня</span><button onClick={()=>onNav("strategy")} style={{fontSize:13,color:C.a,background:"none",border:"none",cursor:"pointer"}}>Стратегия</button></div>
        {todayTasks.length===0?<div style={{padding:"24px 0",textAlign:"center",color:C.t2,fontSize:14}}>Нет задач</div>:
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{todayTasks.slice(0,5).map((t:any)=><div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:C.bg,borderRadius:10,borderLeft:"3px solid "+(t.type==="biz"?C.a:C.y)}}><span style={{fontSize:14,flex:1}}>{t.text}</span><Tag label={tsLbl(t.status||"todo")} color={tsCol(t.status||"todo")}/><span style={{fontSize:11,color:C.t2}}>{t.mins}м</span></div>)}</div>}
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
  </>;
}

/* ============ STRATEGY ============ */
function StrategyPage({userId}:{userId:string}){
  const kanban = useTable("kanban", userId);
  const goals = useTable("goals", userId);
  const goalTasks = useTable("goal_tasks", userId);
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
    await kanban.add({text:tf.text,mins:tf.mins,type:tf.type,date:d,done:false,status:"todo"});
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
    await goalTasks.add({goal_id:goalId,text:gtf.text,mins:gtf.mins,type:gtf.type,date:gtf.date||null,done:false,status:"todo"});
    sGtf({text:"",mins:30,type:"biz",date:""});setShowGTF(null);
  };

  const goalProgress=(gid:string)=>{
    const tasks=goalTasks.data.filter((t:any)=>t.goal_id===gid&&t.type!=="delegate");
    if(!tasks.length)return 0;
    return Math.round(tasks.filter((t:any)=>t.status==="done"||t.done).length/tasks.length*100);
  };
  const prgColor=(p:number)=>p<30?C.r:p<50?"#F97316":p<70?C.y:p<90?"#84CC16":"#16A34A";

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
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:500,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</div>
        <div style={{display:"flex",gap:6,marginTop:2}}><span style={{fontSize:10,color:C.t2}}>{t.mins}м</span>{t.fromGoal&&<span style={{fontSize:10,color:t.goalColor}}>★</span>}{showDate&&t.date&&<span style={{fontSize:10,color:C.t2}}>{t.date.substring(5)}</span>}</div>
      </div>
      <button onClick={()=>startEdit(t)} style={{width:16,height:16,border:"none",background:"transparent",cursor:"pointer",color:C.t2,fontSize:10,opacity:0.6}}>✏️</button>
      {!t.fromGoal&&<button onClick={()=>setDeleteConfirm(t.id)} style={{width:16,height:16,border:"none",background:"transparent",cursor:"pointer",color:C.r,fontSize:11}}>×</button>}
    </div>;
  };

  return <>
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

    <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
      <div style={{fontSize:18,fontWeight:700}}>Цели и достижения</div>
      <Btn onClick={()=>setShowGF(!showGF)}>+ Цель</Btn>
    </div>
    {showGF&&<Card style={{marginBottom:20}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Название</label><input value={gf.name} onChange={e=>sGf({...gf,name:e.target.value})} style={iS}/></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Дедлайн</label><input type="date" value={gf.deadline} onChange={e=>sGf({...gf,deadline:e.target.value})} style={iS}/></div>
      <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Цвет</label><div style={{display:"flex",gap:6,marginTop:4}}>{[C.a,"#8B5CF6",C.g,C.r,C.y,C.pk].map(c=><button key={c} onClick={()=>sGf({...gf,color:c})} style={{width:28,height:28,borderRadius:8,background:c,border:gf.color===c?"3px solid "+C.t1:"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
    </div><div style={{display:"flex",gap:10,marginTop:16}}><Btn onClick={addGoal}>Создать</Btn><Btn primary={false} onClick={()=>setShowGF(false)}>Отмена</Btn></div></Card>}
    {goals.data.length===0&&!showGF&&<Card style={{padding:"48px",textAlign:"center"}}><span style={{color:C.t2,fontSize:14}}>Создай первую цель</span></Card>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
      {goals.data.map((g:any)=>{const p=goalProgress(g.id);const gTasks=goalTasks.data.filter((t:any)=>t.goal_id===g.id);return<Card key={g.id} style={{padding:0,overflow:"hidden",borderTop:"4px solid "+g.color}}>
        <div style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:16,fontWeight:700,flex:1}}>{g.name}</div>
            <button onClick={()=>goals.remove(g.id)} style={{width:24,height:24,borderRadius:6,border:"none",background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I path="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={10} color={C.r} sw={2}/></button>
          </div>
          {g.deadline&&<div style={{fontSize:12,color:C.t2,marginBottom:8}}>Дедлайн: {g.deadline}</div>}
          <div style={{height:8,background:C.bg,borderRadius:4,overflow:"hidden",marginBottom:6}}><div style={{width:p+"%",height:"100%",background:prgColor(p),borderRadius:4}}/></div>
          <div style={{fontSize:12,color:C.t2}}>{gTasks.filter((t:any)=>(t.status==="done"||t.done)&&t.type!=="delegate").length} из {gTasks.filter((t:any)=>t.type!=="delegate").length} ({p}%)</div>
        </div>
        <div style={{borderTop:"1px solid "+C.bd}}>
          <button onClick={()=>setOpenGoal(openGoal===g.id?null:g.id)} style={{width:"100%",padding:"10px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,color:C.t2}}>
            <span>{openGoal===g.id?"Скрыть":"План"} ({gTasks.length})</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={openGoal===g.id?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
          </button>
          {openGoal===g.id&&<div style={{padding:"0 16px 16px"}}>
            {gTasks.map((t:any)=>{const isDone=t.status==="done"||t.done;return<div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:isDone?"#F0FDF4":C.bg,marginBottom:6,borderLeft:"3px solid "+(t.type==="biz"?C.a:t.type==="delegate"?C.t2:C.y)}}>
              <button onClick={()=>goalTasks.update(t.id,{status:nextStatus(t.status||"todo"),done:nextStatus(t.status||"todo")==="done"})} style={{width:18,height:18,minWidth:18,borderRadius:5,border:"2px solid "+(isDone?C.g:(t.status==="inprogress")?C.y:C.bd),background:isDone?C.g:(t.status==="inprogress")?C.y+"33":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{isDone&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}</button>
              <div style={{flex:1}}><div style={{fontSize:13,textDecoration:isDone?"line-through":"none"}}>{t.text}</div><div style={{fontSize:10,color:C.t2}}>{t.mins}м {t.date?`| ${t.date.substring(5)}`:""}</div></div>
              <Tag label={tsLbl(t.status||"todo")} color={tsCol(t.status||"todo")}/>
              <input type="date" value={t.date||""} onChange={e=>goalTasks.update(t.id,{date:e.target.value||null})} style={{width:120,padding:"4px 6px",border:"1px solid "+C.bd,borderRadius:6,fontSize:11,background:C.ib}}/>
              <button onClick={()=>goalTasks.remove(t.id)} style={{border:"none",background:"transparent",cursor:"pointer",color:C.t2,fontSize:12}}>×</button>
            </div>;})}
            {showGTF===g.id?<div style={{marginTop:8,padding:12,background:C.bg,borderRadius:10}}>
              <input placeholder="Задача" value={gtf.text} onChange={e=>sGtf({...gtf,text:e.target.value})} style={{...iS,padding:"8px 10px",fontSize:12,marginBottom:6}}/>
              <div style={{display:"flex",gap:6,marginBottom:6}}>
                <input type="number" value={gtf.mins} onChange={e=>sGtf({...gtf,mins:+e.target.value})} min={30} max={480} step={5} style={{...iS,width:70,padding:"6px 8px",fontSize:12}}/>
                <select value={gtf.type} onChange={e=>sGtf({...gtf,type:e.target.value})} style={{...iS,flex:1,padding:"6px 8px",fontSize:12}}>{TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select>
                <input type="date" value={gtf.date} onChange={e=>sGtf({...gtf,date:e.target.value})} style={{...iS,width:130,padding:"6px 8px",fontSize:12}}/>
              </div>
              {tfErr&&<div style={{fontSize:11,color:C.r,marginBottom:4}}>{tfErr}</div>}
              <div style={{display:"flex",gap:6}}><button onClick={()=>addGoalTask(g.id)} style={{flex:1,padding:"6px",background:C.a,color:"#fff",border:"none",borderRadius:6,fontSize:12,cursor:"pointer"}}>Добавить</button><button onClick={()=>setShowGTF(null)} style={{padding:"6px 10px",background:C.w,border:"1px solid "+C.bd,borderRadius:6,fontSize:12,cursor:"pointer"}}>Отмена</button></div>
            </div>:<button onClick={()=>{setShowGTF(g.id);sGtf({text:"",mins:30,type:"biz",date:""}); }} style={{width:"100%",padding:"8px",background:"none",border:"1px dashed "+C.bd,borderRadius:8,fontSize:12,color:C.t2,cursor:"pointer",marginTop:4}}>+ Задача</button>}
          </div>}
        </div>
      </Card>})}
    </div>
  </>;
}

/* ============ CRM ============ */
function CrmPage({userId}:{userId:string}){
  const{data:leads,add,update,remove}=useTable("leads",userId);
  const crmStages=useTable("crm_stages",userId);
  const[tab,setTab]=useState<"list"|"funnel">("list");
  const[search,setSearch]=useState("");
  const[show,setShow]=useState(false);
  const[f,sF]=useState({name:"",contact:"",phone:"",email:"",source:"Instagram",status:"new",note:"",deal:"",pains:"",desires:"",history:""});
  const[dragId,setDragId]=useState<string|null>(null);
  const[showStageForm,setShowStageForm]=useState(false);
  const[newStage,setNewStage]=useState({label:"",color:C.a});

  const stages=useMemo(()=>{
    if(crmStages.data.length>0){
      return crmStages.data.map((s:any)=>({id:s.stage_id||s.id,label:s.label,color:s.color}));
    }
    return STAGES_DEFAULT;
  },[crmStages.data]);

  const found=useMemo(()=>{
    if(!search)return leads;
    const q=search.toLowerCase();
    return leads.filter((l:any)=>l.name.toLowerCase().includes(q)||(l.contact||"").toLowerCase().includes(q)||(l.phone||"").includes(q)||(l.email||"").toLowerCase().includes(q));
  },[leads,search]);

  const sub=async()=>{
    if(!f.name.trim())return;
    await add({...f,deal:f.deal?+f.deal:null});
    sF({name:"",contact:"",phone:"",email:"",source:"Instagram",status:"new",note:"",deal:"",pains:"",desires:"",history:""});
    setShow(false);
  };

  const addStage=async()=>{
    if(!newStage.label.trim())return;
    const sid="stage_"+Date.now();
    await crmStages.add({stage_id:sid,label:newStage.label,color:newStage.color});
    setNewStage({label:"",color:C.a});setShowStageForm(false);
  };

  const totalD=leads.filter((l:any)=>l.status==="closed"&&l.deal).reduce((s:number,l:any)=>s+(l.deal||0),0);

  const onDragStart=(id:string)=>setDragId(id);
  const onDrop=(stageId:string)=>{
    if(dragId){update(dragId,{status:stageId});setDragId(null);}
  };

  const closedRejected=leads.filter((l:any)=>["closed","rejected"].includes(l.status));

  return <>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
      {[{l:"Всего",v:leads.length,c:C.a},{l:"В работе",v:leads.filter((l:any)=>!["closed","rejected"].includes(l.status)).length,c:C.y},{l:"Закрыто",v:leads.filter((l:any)=>l.status==="closed").length,c:C.g},{l:"Сделки",v:fmt$(totalD)+" ₽",c:C.dk}].map((s,i)=><Card key={i} style={{padding:"20px 24px"}}><div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:13,color:C.t2,marginTop:4}}>{s.l}</div></Card>)}
    </div>

    <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"2px solid "+C.bd}}>
      {[{id:"list",label:"Список лидов"},{id:"funnel",label:"Воронка продаж"}].map(t=><button key={t.id} onClick={()=>setTab(t.id as any)} style={{padding:"10px 20px",background:"none",border:"none",borderBottom:tab===t.id?"3px solid "+C.a:"3px solid transparent",color:tab===t.id?C.a:C.t2,fontSize:14,fontWeight:tab===t.id?600:400,cursor:"pointer",marginBottom:-2}}>{t.label}</button>)}
    </div>

    {tab==="list"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,gap:12}}>
        <input placeholder="Поиск по имени, контакту, телефону..." value={search} onChange={e=>setSearch(e.target.value)} style={{...iS,width:280,padding:"9px 14px",fontSize:13}}/>
        <Btn onClick={()=>setShow(!show)}>+ Лид</Btn>
      </div>
      {show&&<Card style={{marginBottom:20}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Имя</label><input value={f.name} onChange={e=>sF({...f,name:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Контакт (ник)</label><input value={f.contact} onChange={e=>sF({...f,contact:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Телефон</label><input value={f.phone} onChange={e=>sF({...f,phone:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Email</label><input type="email" value={f.email} onChange={e=>sF({...f,email:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Источник</label><select value={f.source} onChange={e=>sF({...f,source:e.target.value})} style={iS}>{SRCS.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Статус</label><select value={f.status} onChange={e=>sF({...f,status:e.target.value})} style={iS}>{stages.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Сделка</label><input type="number" value={f.deal} onChange={e=>sF({...f,deal:e.target.value})} style={iS}/></div>
        <div style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Заметка</label><input value={f.note} onChange={e=>sF({...f,note:e.target.value})} style={iS}/></div>
      </div><div style={{display:"flex",gap:10,marginTop:16}}><Btn onClick={sub}>Добавить</Btn><Btn primary={false} onClick={()=>setShow(false)}>Отмена</Btn></div></Card>}
      <Card style={{padding:0,overflow:"hidden"}}>{found.length===0?<div style={{padding:"48px",textAlign:"center",color:C.t2}}>Нет лидов</div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{borderBottom:"2px solid "+C.bd}}>{["Имя","Телефон","Email","Источник","Статус","Сделка",""].map((h,i)=><th key={i} style={{padding:"14px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:C.t2,textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{found.map((l:any)=><tr key={l.id} style={{borderBottom:"1px solid "+C.bd}}><td style={{padding:"14px 16px",fontWeight:600}}>{l.name}<br/><span style={{fontWeight:400,fontSize:12,color:C.t2}}>{l.contact||""}</span></td><td style={{padding:"14px 16px",color:C.t2,fontSize:13}}>{l.phone||"-"}</td><td style={{padding:"14px 16px",color:C.t2,fontSize:13}}>{l.email||"-"}</td><td style={{padding:"14px 16px"}}>{l.source}</td><td style={{padding:"14px 16px"}}><Tag label={stLbl(l.status,stages)} color={stCol(l.status,stages)}/></td><td style={{padding:"14px 16px"}}>{l.deal?fmt$(l.deal)+" ₽":"-"}</td><td style={{padding:"14px 8px"}}><button onClick={()=>remove(l.id)} style={{width:28,height:28,borderRadius:6,border:"none",background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I path="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={12} color={C.r} sw={2}/></button></td></tr>)}</tbody></table></div>}</Card>
    </>}

    {tab==="funnel"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <div style={{fontSize:14,color:C.t2}}>Перетаскивай карточки между этапами</div>
        <Btn primary={false} onClick={()=>setShowStageForm(!showStageForm)} style={{fontSize:13}}>+ Этап</Btn>
      </div>
      {showStageForm&&<Card style={{marginBottom:16,padding:16}}><div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
        <div style={{flex:1}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Название этапа</label><input value={newStage.label} onChange={e=>setNewStage({...newStage,label:e.target.value})} style={iS}/></div>
        <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Цвет</label><div style={{display:"flex",gap:6}}>{[C.a,"#8B5CF6",C.g,C.r,C.y,C.pk,C.lb].map(c=><button key={c} onClick={()=>setNewStage({...newStage,color:c})} style={{width:28,height:28,borderRadius:8,background:c,border:newStage.color===c?"3px solid "+C.t1:"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
        <Btn onClick={addStage} style={{height:42}}>Создать</Btn>
        <Btn primary={false} onClick={()=>setShowStageForm(false)} style={{height:42}}>Отмена</Btn>
      </div></Card>}

      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(stages.filter(s=>!["closed","rejected"].includes(s.id)).length+1,5)},1fr)`,gap:12,overflowX:"auto"}}>
        {stages.filter((s:any)=>!["closed","rejected"].includes(s.id)).map((stage:any)=>{
          const stageleads=leads.filter((l:any)=>l.status===stage.id);
          return<div key={stage.id} onDragOver={e=>{e.preventDefault();}} onDrop={()=>onDrop(stage.id)} style={{background:C.bg,borderRadius:14,padding:14,minHeight:200,border:"2px dashed transparent",transition:"border 0.2s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:3,background:stage.color}}/><span style={{fontSize:13,fontWeight:600}}>{stage.label}</span></div>
              <span style={{fontSize:12,color:C.t2,background:C.w,borderRadius:6,padding:"2px 8px"}}>{stageleads.length}</span>
            </div>
            {stageleads.map((l:any)=><div key={l.id} draggable onDragStart={()=>onDragStart(l.id)} style={{background:C.w,borderRadius:10,padding:"12px 14px",marginBottom:8,boxShadow:C.sh,cursor:"grab",borderLeft:"3px solid "+stage.color}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>{l.name}</div>
              {l.phone&&<div style={{fontSize:11,color:C.t2}}>{l.phone}</div>}
              {l.email&&<div style={{fontSize:11,color:C.t2}}>{l.email}</div>}
              {l.contact&&<div style={{fontSize:11,color:C.t2}}>{l.contact}</div>}
              {l.deal&&<div style={{fontSize:12,fontWeight:600,color:C.g,marginTop:4}}>{fmt$(l.deal)} ₽</div>}
            </div>)}
          </div>;
        })}
        <div onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop("closed")} style={{background:C.bg,borderRadius:14,padding:14,minHeight:200}}>
          <div style={{marginBottom:12}}><span style={{fontSize:13,fontWeight:600,color:C.g}}>Закрыт / Отказ</span></div>
          {closedRejected.map((l:any)=><div key={l.id} draggable onDragStart={()=>onDragStart(l.id)} style={{background:C.w,borderRadius:10,padding:"12px 14px",marginBottom:8,boxShadow:C.sh,cursor:"grab",borderLeft:"3px solid "+(l.status==="closed"?C.g:C.r)}}>
            <div style={{fontWeight:600,fontSize:13}}>{l.name}</div>
            <Tag label={l.status==="closed"?"Закрыт":"Отказ"} color={l.status==="closed"?C.g:C.r}/>
            {l.deal&&<div style={{fontSize:12,fontWeight:600,color:C.g,marginTop:4}}>{fmt$(l.deal)} ₽</div>}
          </div>)}
        </div>
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
function MediaPage({userId}:{userId:string}){
  const{data,add,remove}=useTable("media",userId);
  const[show,setShow]=useState(false);
  const[f,sF]=useState({date:today(),ig:0,yt:0,tg:0,oth:0,ig_story:0,tg_story:0});
  const sub=async()=>{await add(f);sF({date:today(),ig:0,yt:0,tg:0,oth:0,ig_story:0,tg_story:0});setShow(false);};
  const sorted=useMemo(()=>[...data].sort((a:any,b:any)=>a.date?.localeCompare(b.date)),[data]);
  return <>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><div style={{fontSize:18,fontWeight:600}}>Аналитика медийности</div><Btn onClick={()=>setShow(!show)}>+ Данные</Btn></div>
    {show&&<Card style={{marginBottom:20}}><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
      <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>Дата</label><input type="date" value={f.date} onChange={e=>sF({...f,date:e.target.value})} style={iS}/></div>
      {([["ig","Instagram"],["yt","YouTube"],["tg","Telegram"],["oth","Другие"]] as const).map(([k,l])=><div key={k}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{l}</label><input type="number" value={(f as any)[k]} onChange={e=>sF({...f,[k]:+e.target.value})} style={iS}/></div>)}
      {([["ig_story","Stories IG"],["tg_story","Stories TG"]] as const).map(([k,l])=><div key={k} style={{gridColumn:"span 2"}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{l}</label><input type="number" value={(f as any)[k]} onChange={e=>sF({...f,[k]:+e.target.value})} style={iS}/></div>)}
    </div><div style={{display:"flex",gap:10,marginTop:16}}><Btn onClick={sub}>Добавить</Btn><Btn primary={false} onClick={()=>setShow(false)}>Отмена</Btn></div></Card>}
    <Card style={{padding:0,overflow:"hidden"}}>{sorted.length===0?<div style={{padding:"48px",textAlign:"center",color:C.t2}}>Добавь данные</div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{borderBottom:"2px solid "+C.bd}}>{["Дата","IG","YT","TG","Другие","Stories IG","Stories TG",""].map((h,i)=><th key={i} style={{padding:"12px 14px",textAlign:"left",fontSize:12,fontWeight:600,color:C.t2}}>{h}</th>)}</tr></thead><tbody>{sorted.map((d:any)=><tr key={d.id} style={{borderBottom:"1px solid "+C.bd}}><td style={{padding:"12px 14px"}}>{d.date}</td><td style={{padding:"12px 14px",color:C.pk,fontWeight:600}}>{d.ig}</td><td style={{padding:"12px 14px",color:C.r,fontWeight:600}}>{d.yt}</td><td style={{padding:"12px 14px",color:C.a,fontWeight:600}}>{d.tg}</td><td style={{padding:"12px 14px"}}>{d.oth}</td><td style={{padding:"12px 14px"}}>{d.ig_story}</td><td style={{padding:"12px 14px"}}>{d.tg_story}</td><td style={{padding:"12px 8px"}}><button onClick={()=>remove(d.id)} style={{width:28,height:28,borderRadius:6,border:"none",background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I path="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={12} color={C.r} sw={2}/></button></td></tr>)}</tbody></table></div>}</Card>
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
