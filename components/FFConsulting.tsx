"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type ConsultingTopic = {
  id: string;
  title: string;
  subtitle: string;
  article: string[];
};

type CallRecording = {
  path: string;
  name: string;
  size: number;
  uploadedAt: string;
};

type ConsultingProgress = {
  completed: string[];
  notes: Record<string, string>;
  activeTopicId: string;
  recordings: Record<string, CallRecording>;
};

const ACCENT = "#5B7CFA";
const GREEN = "#16A36A";
const VIDEO_BUCKET = "consulting-call-videos";
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

const WEEK_ONE_TOPICS: ConsultingTopic[] = [
  {
    id: "audience-audit-execution",
    title: "Value + Execution",
    subtitle: "Аудит реальной аудитории и первая рабочая карта сегментов",
    article: [
      "Аудит аудитории начинается не с придуманного портрета идеального клиента, а с людей, которые уже смотрят контент, отвечают, задают вопросы и покупают. На этом этапе мы отделяем реальные сигналы спроса от предположений.",
      "Сначала фиксируем основные группы аудитории: кто эти люди, в какой ситуации они находятся, какой результат хотят получить и что мешает им сделать следующий шаг. Затем сопоставляем эти группы с текущим контентом, оффером и входящими диалогами.",
      "Результат этапа — простая карта приоритетных сегментов и список разрывов: где внимание уже есть, но ценность сформулирована недостаточно ясно или следующий шаг выглядит слишком сложным.",
    ],
  },
  {
    id: "audience-audit-feedback",
    title: "Feedback & Revision",
    subtitle: "Совместная проверка выводов и корректировка гипотез",
    article: [
      "На разборе мы проверяем, подтверждаются ли выбранные сегменты реальными сообщениями, заявками, продажами и поведением аудитории. Важно не защищать первую версию, а найти формулировки, которые точнее отражают ситуацию клиента.",
      "Каждую гипотезу оцениваем по трём критериям: у сегмента есть заметная проблема, он уже ищет решение и способен принять следующий коммерческий шаг. Слабые или слишком широкие сегменты объединяем, уточняем либо убираем.",
      "После обратной связи карта аудитории обновляется в том же документе. Финальная версия должна помогать принимать решения по офферу, контенту и продажам, а не оставаться теоретическим описанием.",
    ],
  },
  {
    id: "audience-audit-data",
    title: "Data & Repeat",
    subtitle: "Проверка карты аудитории на фактах и следующий цикл",
    article: [
      "После созвона выводы нужно проверить в реальной работе: в контенте, переписках, заявках и созвонах. Мы наблюдаем, какие формулировки вызывают узнавание, какие сегменты быстрее вступают в диалог и где по-прежнему теряется интерес.",
      "Фиксируем не только охваты, но и качественные сигналы: ответы по теме, переходы к следующему шагу, количество подходящих лидов и повторяющиеся формулировки людей. Эти данные показывают, насколько точно мы понимаем аудиторию.",
      "В конце этапа принимается одно решение: сохранить карту как рабочую основу, уточнить отдельный сегмент или провести ещё один короткий цикл проверки.",
    ],
  },
];

const EMPTY_PROGRESS: ConsultingProgress = {
  completed: [],
  notes: {},
  activeTopicId: WEEK_ONE_TOPICS[0].id,
  recordings: {},
};

const iconPaths = {
  check: "M5 12l4 4L19 6",
  upload: "M12 16V4 M7 9l5-5 5 5 M5 20h14",
  video: "M15 10l4.55-2.07A1 1 0 0121 8.87v6.26a1 1 0 01-1.45.89L15 14 M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  trash: "M3 6h18 M8 6V4h8v2 M19 6l-1 15H6L5 6 M10 11v5 M14 11v5",
};

function Icon({ path, size = 18, color = "currentColor", strokeWidth = 1.8 }: { path: string; size?: number; color?: string; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>;
}

function useMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 900);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mobile;
}

function RichNoteEditor({ value, onChange, dark }: { value: string; onChange: (value: string) => void; dark: boolean }) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && document.activeElement !== editor && editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  const format = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    onChange(editorRef.current?.innerHTML || "");
  };

  const button = (label: string, title: string, command: string, argument?: string, style?: React.CSSProperties) => (
    <button type="button" aria-label={title} title={title} onMouseDown={event => { event.preventDefault(); format(command, argument); }} style={{
      minWidth:31,height:30,padding:"0 8px",border:"none",borderRadius:7,background:"transparent",color:dark?"#D7D7D7":"#343434",cursor:"pointer",fontSize:12,fontWeight:650,...style,
    }}>{label}</button>
  );

  return <div style={{border:`1px solid ${dark?"rgba(255,255,255,.10)":"#E1E5EC"}`,borderRadius:11,overflow:"hidden",background:dark?"#111111":"#FFFFFF"}}>
    <div style={{display:"flex",alignItems:"center",gap:2,padding:"6px 7px",borderBottom:`1px solid ${dark?"rgba(255,255,255,.08)":"#E8EAF0"}`,background:dark?"#151515":"#F7F8FA",flexWrap:"wrap"}}>
      {button("B","Жирный","bold",undefined,{fontWeight:800})}
      {button("I","Курсив","italic",undefined,{fontStyle:"italic"})}
      {button("U","Подчёркнутый","underline",undefined,{textDecoration:"underline"})}
      {button("Aa","Выделить цветом","backColor",dark?"#5B4B18":"#FFF1A8")}
      <span style={{width:1,height:18,background:dark?"rgba(255,255,255,.10)":"#DFE3EA",margin:"0 3px"}}/>
      {button("• Список","Маркированный список","insertUnorderedList")}
      {button("1. Список","Нумерованный список","insertOrderedList")}
      {button("Очистить","Убрать форматирование","removeFormat",undefined,{fontWeight:500,color:dark?"#909090":"#737985"})}
    </div>
    <div ref={editorRef} className="ff-rich-editor" contentEditable suppressContentEditableWarning data-placeholder="Записывай решения, формулировки клиента, выводы и следующие действия…" onInput={event => onChange(event.currentTarget.innerHTML)} onBlur={event => onChange(event.currentTarget.innerHTML)} onPaste={event => {
      event.preventDefault();
      document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
    }} style={{minHeight:260,padding:"15px 16px",outline:"none",fontSize:13.5,lineHeight:1.7,color:dark?"#ECECEC":"#181818",whiteSpace:"pre-wrap"}}/>
  </div>;
}

export default function FFConsulting({ userId, dark }: { userId: string; dark: boolean }) {
  const mobile = useMobile();
  const [progress, setProgress] = useState<ConsultingProgress>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "local">("saved");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);
  const localKey = `vizzy_consulting_progress_v2_${userId}`;

  const palette = useMemo(() => ({
    card: dark ? "#171717" : "#FFFFFF",
    card2: dark ? "#111111" : "#F8F9FB",
    text: dark ? "#ECECEC" : "#181818",
    muted: dark ? "#8A8A8A" : "#6B7280",
    border: dark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
    soft: dark ? "rgba(91,124,250,0.12)" : "rgba(91,124,250,0.08)",
  }), [dark]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      let next: Partial<ConsultingProgress> = EMPTY_PROGRESS;
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) next = { ...next, ...JSON.parse(raw) };
      } catch {}
      try {
        const { data, error } = await supabase.from("consulting_progress").select("payload").eq("user_id", userId).maybeSingle();
        if (!error && data?.payload) next = { ...next, ...data.payload };
      } catch {}
      if (!alive) return;
      const validActive = WEEK_ONE_TOPICS.some(topic => topic.id === next.activeTopicId) ? String(next.activeTopicId) : WEEK_ONE_TOPICS[0].id;
      setProgress({
        completed: Array.isArray(next.completed) ? next.completed.filter(id => WEEK_ONE_TOPICS.some(topic => topic.id === id)) : [],
        notes: next.notes && typeof next.notes === "object" ? next.notes : {},
        activeTopicId: validActive,
        recordings: next.recordings && typeof next.recordings === "object" ? next.recordings : {},
      });
      hydrated.current = true;
      setReady(true);
    };
    load();
    return () => { alive = false; };
  }, [localKey, userId]);

  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(localKey, JSON.stringify(progress)); } catch {}
    setSaveState("saving");
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const { error } = await supabase.from("consulting_progress").upsert({ user_id:userId, payload:progress, updated_at:new Date().toISOString() }, { onConflict:"user_id" });
        if (!cancelled) setSaveState(error ? "local" : "saved");
      } catch {
        if (!cancelled) setSaveState("local");
      }
    }, 650);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [localKey, progress, userId]);

  const recording = progress.recordings["week-1"];
  const recordingPath = recording?.path || "";

  useEffect(() => {
    let alive = true;
    if (!recordingPath) { setRecordingUrl(""); return () => { alive = false; }; }
    supabase.storage.from(VIDEO_BUCKET).createSignedUrl(recordingPath, 3600).then(({ data, error }) => {
      if (!alive) return;
      setRecordingUrl(error ? "" : data?.signedUrl || "");
    });
    return () => { alive = false; };
  }, [recordingPath]);

  const activeTopic = WEEK_ONE_TOPICS.find(topic => topic.id === progress.activeTopicId) || WEEK_ONE_TOPICS[0];
  const completedSet = useMemo(() => new Set(progress.completed), [progress.completed]);
  const percent = Math.round((completedSet.size / WEEK_ONE_TOPICS.length) * 100);

  const updateNote = (id: string, note: string) => setProgress(prev => ({ ...prev, notes:{ ...prev.notes, [id]:note } }));
  const toggleTopic = (id: string) => setProgress(prev => ({ ...prev, completed:prev.completed.includes(id) ? prev.completed.filter(item => item !== id) : [...prev.completed, id] }));
  const nextTopic = WEEK_ONE_TOPICS.slice(WEEK_ONE_TOPICS.findIndex(topic => topic.id === activeTopic.id) + 1).find(topic => !completedSet.has(topic.id));

  const uploadRecording = async (file: File) => {
    if (uploading) return;
    setUploadError("");
    if (!file.type.startsWith("video/") || file.size <= 0 || file.size > MAX_VIDEO_BYTES) {
      setUploadError("Выбери видеофайл размером до 2 ГБ");
      return;
    }
    setUploading(true); setUploadProgress(0);
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Сессия истекла. Войди в приложение заново");
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!projectUrl) throw new Error("Supabase URL не настроен");
      const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").slice(-140) || "consulting-call.mp4";
      const objectName = `${userId}/week-1/${crypto.randomUUID()}-${safeName}`;
      const tusMod: any = await import("tus-js-client");
      await new Promise<void>((resolve, reject) => {
        const upload = new tusMod.Upload(file, {
          endpoint:`${projectUrl}/storage/v1/upload/resumable`,
          retryDelays:[0,1000,3000,5000,10000],
          headers:{ authorization:`Bearer ${session.access_token}` },
          uploadDataDuringCreation:true,
          removeFingerprintOnSuccess:true,
          metadata:{ bucketName:VIDEO_BUCKET, objectName, contentType:file.type, cacheControl:"3600" },
          chunkSize:6 * 1024 * 1024,
          onError:(error:any) => reject(error),
          onProgress:(sent:number,total:number) => setUploadProgress(total ? Math.round(sent / total * 100) : 0),
          onSuccess:() => resolve(),
        });
        upload.findPreviousUploads().then((previous:any[]) => {
          if (previous?.length) upload.resumeFromPreviousUpload(previous[0]);
          upload.start();
        }).catch(() => upload.start());
      });
      if (recordingPath) await supabase.storage.from(VIDEO_BUCKET).remove([recordingPath]);
      const nextRecording: CallRecording = { path:objectName, name:file.name, size:file.size, uploadedAt:new Date().toISOString() };
      setProgress(prev => ({ ...prev, recordings:{ ...prev.recordings, "week-1":nextRecording } }));
      const { data } = await supabase.storage.from(VIDEO_BUCKET).createSignedUrl(objectName, 3600);
      setRecordingUrl(data?.signedUrl || "");
      setUploadProgress(100);
    } catch (error:any) {
      setUploadError(error?.message || "Не удалось загрузить запись созвона");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteRecording = async () => {
    if (!recordingPath || !confirm("Удалить запись созвона №1?")) return;
    setUploadError("");
    const { error } = await supabase.storage.from(VIDEO_BUCKET).remove([recordingPath]);
    if (error) { setUploadError("Не удалось удалить запись: " + error.message); return; }
    setProgress(prev => { const recordings = { ...prev.recordings }; delete recordings["week-1"]; return { ...prev, recordings }; });
    setRecordingUrl("");
  };

  const panel: React.CSSProperties = {
    background:palette.card,
    border:`1px solid ${palette.border}`,
    borderRadius:14,
    boxShadow:dark ? "0 10px 32px rgba(0,0,0,.24)" : "0 4px 18px rgba(0,0,0,.05)",
  };

  if (!ready) return <div style={{minHeight:420,display:"flex",alignItems:"center",justifyContent:"center",color:palette.muted,fontSize:13}}>Загружаю FF Consulting…</div>;

  return <div style={{maxWidth:1420,margin:"0 auto",padding:mobile?"14px 12px 92px":"24px 28px 48px",color:palette.text}}>
    <style>{`
      .ff-rich-editor:empty:before{content:attr(data-placeholder);color:${dark?"#666":"#9AA0AA"};pointer-events:none}
      .ff-rich-editor ul,.ff-rich-editor ol{padding-left:22px;margin:8px 0}.ff-rich-editor p{margin:0 0 8px}
      .ff-topic:hover{border-color:rgba(91,124,250,.42)!important;background:rgba(91,124,250,.06)!important}
      .ff-scroll::-webkit-scrollbar{width:4px;height:4px}.ff-scroll::-webkit-scrollbar-thumb{background:rgba(130,130,130,.25);border-radius:4px}
    `}</style>

    <section style={{...panel,overflow:"hidden",position:"relative",marginBottom:16,padding:mobile?"18px 16px":"22px 28px"}}>
      <div style={{position:"absolute",left:"18%",right:"18%",top:-110,height:260,background:"radial-gradient(ellipse,rgba(91,124,250,.18),transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"relative",height:mobile?124:190,maxWidth:980,margin:"0 auto",overflow:"hidden"}}>
        <Image src="/ff-consulting-logo.png" alt="FF Consulting" fill priority sizes="(max-width: 900px) 92vw, 980px" style={{objectFit:"cover",objectPosition:"center"}}/>
      </div>
      <div style={{position:"relative",display:"grid",gridTemplateColumns:mobile?"1fr":"minmax(0,1fr) 320px",gap:18,alignItems:"center",marginTop:mobile?4:8}}>
        <div>
          <div style={{fontSize:mobile?17:20,fontWeight:680,letterSpacing:"-.02em"}}>Персональная программа сопровождения</div>
          <div style={{fontSize:13,color:palette.muted,marginTop:6,lineHeight:1.55,maxWidth:690}}>Рабочее пространство для созвонов, материалов недели и решений, которые мы фиксируем вместе с клиентом</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
            {["Неделя 1","1 созвон","3 рабочих этапа","Совместные заметки"].map(item => <span key={item} style={{fontSize:11.5,padding:"6px 9px",borderRadius:8,background:palette.card2,border:`1px solid ${palette.border}`}}>{item}</span>)}
          </div>
        </div>
        <div style={{padding:16,borderRadius:12,background:dark?"rgba(0,0,0,.22)":"rgba(255,255,255,.72)",border:`1px solid ${palette.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}><span style={{fontSize:11,color:palette.muted}}>Прогресс обучения</span><span style={{fontSize:24,fontWeight:760}}>{percent}%</span></div>
          <div style={{height:7,borderRadius:8,background:dark?"rgba(255,255,255,.08)":"#E8EBF1",overflow:"hidden",margin:"10px 0 9px"}}><div style={{height:"100%",width:`${percent}%`,background:`linear-gradient(90deg,${ACCENT},#7A96FF)`,borderRadius:8,transition:"width .25s ease"}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:palette.muted}}><span>{completedSet.size} из {WEEK_ONE_TOPICS.length} этапов</span><span>{saveState === "saving" ? "Сохраняю…" : saveState === "local" ? "Сохранено локально" : "Сохранено"}</span></div>
        </div>
      </div>
    </section>

    <div style={{fontSize:20,fontWeight:720,letterSpacing:"-.025em",margin:"22px 0 12px"}}>Программа</div>

    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"320px minmax(0,1fr)",gap:14,alignItems:"start"}}>
      <aside className="ff-scroll" style={{...panel,padding:12,position:mobile?"static":"sticky",top:82,maxHeight:mobile?"none":"calc(100vh - 110px)",overflowY:"auto"}}>
        <div style={{padding:"5px 5px 13px",borderBottom:`1px solid ${palette.border}`}}>
          <div style={{fontSize:10,fontWeight:750,letterSpacing:1.3,color:ACCENT}}>НЕДЕЛЯ 1</div>
          <div style={{fontSize:17,fontWeight:720,marginTop:5}}>Аудит аудитории</div>
          <div style={{fontSize:11.5,color:palette.muted,lineHeight:1.5,marginTop:5}}>Разбираем реальную аудиторию, уточняем гипотезы и фиксируем рабочую карту сегментов</div>
        </div>
        <div style={{display:"grid",gap:6,marginTop:12}}>
          {WEEK_ONE_TOPICS.map((topic,index) => {
            const active = activeTopic.id === topic.id;
            const done = completedSet.has(topic.id);
            return <button className="ff-topic" key={topic.id} onClick={() => setProgress(prev => ({ ...prev, activeTopicId:topic.id }))} style={{display:"flex",alignItems:"flex-start",gap:10,textAlign:"left",border:`1px solid ${active?"rgba(91,124,250,.52)":palette.border}`,background:active?palette.soft:"transparent",borderRadius:10,padding:"11px 10px",cursor:"pointer",color:palette.text,transition:"all .15s ease"}}>
              <span style={{width:23,height:23,borderRadius:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:done?GREEN:(active?ACCENT:palette.card2),border:`1px solid ${done?GREEN:palette.border}`,color:done||active?"#fff":palette.muted,fontSize:10,fontWeight:750}}>{done?<Icon path={iconPaths.check} size={13} strokeWidth={2.4}/>:index+1}</span>
              <span><span style={{display:"block",fontSize:12.5,fontWeight:active?680:560,lineHeight:1.35}}>{topic.title}</span><span style={{display:"block",fontSize:10.5,color:palette.muted,lineHeight:1.4,marginTop:3}}>{topic.subtitle}</span></span>
            </button>;
          })}
        </div>
      </aside>

      <main style={{display:"grid",gap:14,minWidth:0}}>
        <section style={{...panel,padding:mobile?16:20}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:recording?14:16,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:750,letterSpacing:1.2,color:ACCENT}}>ЗАПИСЬ СОЗВОНА №1</div><div style={{fontSize:18,fontWeight:700,marginTop:5}}>Неделя 1 · Аудит аудитории</div><div style={{fontSize:11.5,color:palette.muted,lineHeight:1.5,marginTop:5}}>Загрузи запись совместного созвона, чтобы она всегда оставалась внутри программы</div></div>
            {recording&&<button type="button" onClick={deleteRecording} title="Удалить запись" style={{width:34,height:34,borderRadius:9,border:`1px solid ${palette.border}`,background:"transparent",color:"#EF4444",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon path={iconPaths.trash} size={16}/></button>}
          </div>

          {recording ? <div style={{display:"grid",gap:10}}>
            {recordingUrl ? <video key={recordingUrl} controls preload="metadata" src={recordingUrl} style={{width:"100%",maxHeight:480,borderRadius:11,background:"#000",border:`1px solid ${palette.border}`}}/> : <div style={{height:170,borderRadius:11,background:palette.card2,border:`1px dashed ${palette.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:palette.muted,fontSize:12}}>Подготавливаю защищённую ссылку на запись…</div>}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><div style={{minWidth:0}}><div style={{fontSize:12.5,fontWeight:620,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{recording.name}</div><div style={{fontSize:10.5,color:palette.muted,marginTop:3}}>{(recording.size / 1024 / 1024).toFixed(1)} МБ · загружено {new Date(recording.uploadedAt).toLocaleDateString("ru-RU")}</div></div><button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} style={{height:35,padding:"0 12px",borderRadius:8,border:`1px solid ${palette.border}`,background:palette.card2,color:palette.text,fontSize:11.5,fontWeight:620,cursor:uploading?"wait":"pointer"}}>Заменить видео</button></div>
          </div> : <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} style={{width:"100%",minHeight:126,borderRadius:11,border:`1px dashed ${dark?"rgba(255,255,255,.18)":"#C9D0DB"}`,background:palette.card2,color:palette.text,cursor:uploading?"wait":"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:18}}>
            <span style={{width:40,height:40,borderRadius:11,background:palette.soft,color:ACCENT,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon path={uploading?iconPaths.video:iconPaths.upload} size={21}/></span>
            <span style={{fontSize:13,fontWeight:650}}>{uploading?`Загружаю запись · ${uploadProgress}%`:"Загрузить запись созвона"}</span>
            <span style={{fontSize:10.5,color:palette.muted}}>MP4, MOV или WebM · до 2 ГБ</span>
          </button>}
          <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/*" disabled={uploading} style={{display:"none"}} onChange={event => { const file=event.target.files?.[0]; if(file) uploadRecording(file); }}/>
          {uploading&&<div style={{height:5,background:palette.card2,borderRadius:5,overflow:"hidden",marginTop:10}}><div style={{height:"100%",width:`${uploadProgress}%`,background:`linear-gradient(90deg,${ACCENT},#7A96FF)`,transition:"width .2s ease"}}/></div>}
          {uploadError&&<div style={{fontSize:11.5,color:"#EF4444",marginTop:9}}>{uploadError}</div>}
        </section>

        <section style={{...panel,overflow:"hidden"}}>
          <header style={{padding:mobile?"17px 16px":"20px 22px",borderBottom:`1px solid ${palette.border}`}}>
            <div style={{fontSize:10,fontWeight:750,letterSpacing:1.2,color:ACCENT}}>НЕДЕЛЯ 1 · АУДИТ АУДИТОРИИ</div>
            <h2 style={{fontSize:mobile?22:27,lineHeight:1.18,letterSpacing:"-.03em",margin:"8px 0 0",fontWeight:740}}>{activeTopic.title}</h2>
            <div style={{fontSize:12.5,color:palette.muted,lineHeight:1.5,marginTop:6}}>{activeTopic.subtitle}</div>
          </header>
          <div style={{padding:mobile?16:22,display:"grid",gap:20}}>
            <article>
              <div style={{fontSize:10,fontWeight:750,letterSpacing:1.2,color:palette.muted,marginBottom:10}}>МАТЕРИАЛ ПО ТЕМЕ</div>
              <div style={{display:"grid",gap:10}}>{activeTopic.article.map(paragraph => <p key={paragraph} style={{fontSize:13.5,lineHeight:1.72,color:palette.text,margin:0}}>{paragraph}</p>)}</div>
            </article>
            <section>
              <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10,marginBottom:9,flexWrap:"wrap"}}><div style={{fontSize:10,fontWeight:750,letterSpacing:1.2,color:palette.muted}}>ЗАМЕТКИ С СОЗВОНА</div><div style={{fontSize:10.5,color:palette.muted}}>Сохраняются автоматически</div></div>
              <RichNoteEditor value={progress.notes[activeTopic.id] || ""} onChange={value => updateNote(activeTopic.id,value)} dark={dark}/>
            </section>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:mobile?"stretch":"center",gap:9,flexDirection:mobile?"column":"row"}}>
              <button onClick={() => toggleTopic(activeTopic.id)} style={{padding:"10px 15px",border:`1px solid ${completedSet.has(activeTopic.id)?GREEN:palette.border}`,borderRadius:9,background:completedSet.has(activeTopic.id)?"rgba(22,163,106,.11)":palette.card2,color:completedSet.has(activeTopic.id)?GREEN:palette.text,cursor:"pointer",fontSize:12.5,fontWeight:650,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Icon path={iconPaths.check} size={16} strokeWidth={2.2}/>{completedSet.has(activeTopic.id)?"Этап завершён":"Отметить этап выполненным"}</button>
              {nextTopic&&<button onClick={() => setProgress(prev => ({ ...prev, activeTopicId:nextTopic.id }))} style={{padding:"10px 15px",border:"none",borderRadius:9,background:ACCENT,color:"#fff",cursor:"pointer",fontSize:12.5,fontWeight:650}}>Следующий этап →</button>}
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>;
}
