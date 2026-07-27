// app/f/[slug]/page.tsx
//
// Vizzy Form — публичная страница записи.
// Порядок шагов по ТЗ: 1) выбор даты и времени, 2) форма, 3) подтверждение.
//
// Одно заполнение запускает весь процесс автоматически:
//  - сохраняются ответы формы (form_responses);
//  - создаётся или обновляется лид в CRM (leads);
//  - создаётся созвон в разделе «Созвоны» (calls);
//  - фиксируется просмотр страницы для аналитики (form_views).

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPA_URL, SUPA_KEY);

type Question = { id: string; type: string; label: string; required: boolean; options: string[] };
type BookingCfg = {
  enabled: boolean; duration: number; buffer: number; max_per_day: number;
  days: number[]; from: string; to: string;
  lead_hours: number; horizon_days: number; exceptions: string[]; tz: string;
};
type FormRow = {
  id: string; user_id: string; title: string; description: string; slug: string;
  questions: Question[]; completion_title: string; completion_subtitle: string;
  completion_url: string; completion_btn_label: string; accent_color: string;
  is_active: boolean; booking: BookingCfg | null;
};

const WD_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
const toHHMM = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
// 1=Пн ... 7=Вс (в JS getDay(): 0=Вс)
const isoDow = (d: Date) => ((d.getDay() + 6) % 7) + 1;

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [form, setForm] = useState<FormRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<"time" | "form" | "done">("time");
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const [pickedDate, setPickedDate] = useState<string>("");
  const [pickedTime, setPickedTime] = useState<string>("");
  const [taken, setTaken] = useState<Record<string, string[]>>({});
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const tz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "местное время"; }
    catch { return "местное время"; }
  }, []);

  useEffect(() => { params.then(p => setSlug(p.slug)); }, [params]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase.from("forms").select("*").eq("slug", slug).maybeSingle();
      if (error || !data || data.is_active === false) { setNotFound(true); setLoading(false); return; }
      const f = data as FormRow;
      setForm(f);
      if (!f.booking?.enabled) setStep("form");
      setLoading(false);
      // фиксируем просмотр (не блокирует отрисовку)
      supabase.from("form_views").insert({ form_id: f.id, user_id: f.user_id }).then(() => {}, () => {});
      // занятые слоты
      if (f.booking?.enabled) {
        const from = ymd(new Date());
        const { data: calls } = await supabase
          .from("calls").select("date,time_start")
          .eq("user_id", f.user_id).gte("date", from);
        const map: Record<string, string[]> = {};
        (calls || []).forEach((c: any) => {
          if (!c.date || !c.time_start) return;
          (map[c.date] = map[c.date] || []).push(String(c.time_start).slice(0, 5));
        });
        setTaken(map);
      }
    })();
  }, [slug]);

  const cfg = form?.booking;
  const accent = form?.accent_color && /^#[0-9a-f]{6}$/i.test(form.accent_color) ? form.accent_color : "#2F6BFF";

  // ── доступные слоты выбранного дня ──
  const slotsFor = (dateStr: string): string[] => {
    if (!cfg) return [];
    const d = new Date(dateStr + "T12:00:00");
    if (!cfg.days.includes(isoDow(d))) return [];
    if (cfg.exceptions?.includes(dateStr)) return [];
    const step = cfg.duration + cfg.buffer;
    if (step <= 0) return [];
    const startM = toMin(cfg.from), endM = toMin(cfg.to);
    const busy = taken[dateStr] || [];
    if (cfg.max_per_day > 0 && busy.length >= cfg.max_per_day) return [];
    const out: string[] = [];
    const now = new Date();
    const minTs = now.getTime() + (cfg.lead_hours || 0) * 3600 * 1000;
    for (let m = startM; m + cfg.duration <= endM; m += step) {
      const hhmm = toHHMM(m);
      if (busy.includes(hhmm)) continue;
      const slotDt = new Date(`${dateStr}T${hhmm}:00`);
      if (slotDt.getTime() < minTs) continue;
      out.push(hhmm);
    }
    return out;
  };

  // ── календарь месяца ──
  const monthGrid = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth();
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const cells: (string | null)[] = Array(lead).fill(null);
    for (let i = 1; i <= days; i++) cells.push(ymd(new Date(y, m, i)));
    return cells;
  }, [month]);

  const horizonMax = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + (cfg?.horizon_days || 30)); return ymd(d);
  }, [cfg]);
  const todayStr = ymd(new Date());

  const dayAvailable = (dateStr: string) =>
    dateStr >= todayStr && dateStr <= horizonMax && slotsFor(dateStr).length > 0;

  // ── отправка ──
  const requiredOk = () => {
    if (!name.trim()) return false;
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return false;
    for (const q of form?.questions || []) {
      if (!q.required) continue;
      const v = answers[q.id];
      if (q.type === "checkbox") { if (!Array.isArray(v) || v.length === 0) return false; }
      else if (!String(v ?? "").trim()) return false;
    }
    return true;
  };

  const submit = async () => {
    if (!form || submitting || !requiredOk()) return;
    setSubmitting(true); setErr("");
    try {
      const payload = { ...answers, __name: name.trim(), __email: email.trim(), __phone: phone.trim() };

      // 1) ответы формы
      const { error: rErr } = await supabase.from("form_responses").insert({
        form_id: form.id, user_id: form.user_id, answers: payload,
      });
      if (rErr) throw rErr;

      // 2) лид: обновляем существующего по email/телефону, иначе создаём
      let leadId: string | null = null;
      try {
        const { data: existing } = await supabase
          .from("leads").select("id,note")
          .eq("user_id", form.user_id)
          .or(`email.eq.${email.trim()},phone.eq.${phone.trim() || "___none___"}`)
          .limit(1);
        const noteLine = `[${todayStr}] Заявка через форму «${form.title}»${pickedDate ? `, созвон ${pickedDate} ${pickedTime}` : ""}`;
        if (existing && existing.length) {
          leadId = existing[0].id;
          await supabase.from("leads").update({
            name: name.trim(), email: email.trim(), phone: phone.trim(),
            note: `${existing[0].note || ""}\n${noteLine}`.trim(),
            next_step: pickedDate ? `Созвон ${pickedDate} ${pickedTime}` : "Связаться",
          }).eq("id", leadId);
        } else {
          const { data: created } = await supabase.from("leads").insert({
            user_id: form.user_id, name: name.trim(), email: email.trim(), phone: phone.trim(),
            source: "Сайт", status: "new", note: noteLine,
            next_step: pickedDate ? `Созвон ${pickedDate} ${pickedTime}` : "Связаться",
          }).select().single();
          leadId = created?.id || null;
        }
      } catch { /* лид не критичен для подтверждения записи */ }

      // 3) созвон
      if (cfg?.enabled && pickedDate && pickedTime) {
        const endM = toMin(pickedTime) + cfg.duration;
        await supabase.from("calls").insert({
          user_id: form.user_id,
          title: `${form.title} — ${name.trim()}`,
          date: pickedDate, time_start: pickedTime, time_end: toHHMM(endM),
          goal: "Созвон с лидом", custom_goal: "",
          responsible_name: name.trim(),
          description: [email.trim(), phone.trim()].filter(Boolean).join(" · "),
          link: "", form_id: form.id, lead_id: leadId, status: "scheduled",
        });
      }

      setStep("done");
    } catch (e: any) {
      setErr("Не удалось отправить заявку. Попробуйте ещё раз.");
      console.error("Vizzy Form submit failed:", e);
    }
    setSubmitting(false);
  };

  // ── стили ──
  const page: React.CSSProperties = {
    minHeight: "100vh", background: "#F7F8FA",
    fontFamily: "-apple-system, Segoe UI, Inter, Arial, sans-serif",
    color: "#111", padding: 20,
    display: "flex", alignItems: "flex-start", justifyContent: "center",
  };
  const shell: React.CSSProperties = {
    width: "100%", maxWidth: 940, background: "#fff",
    border: "1px solid #E6E8EC", borderRadius: 16, overflow: "hidden",
    display: "grid", gridTemplateColumns: "minmax(0,320px) 1fr",
  };
  const side: React.CSSProperties = { padding: 30, borderRight: "1px solid #E6E8EC" };
  const main: React.CSSProperties = { padding: 30, minWidth: 0 };
  const input: React.CSSProperties = {
    width: "100%", padding: "11px 13px", border: "1px solid #E0E3E8",
    borderRadius: 10, fontSize: 14, outline: "none", background: "#fff",
    fontFamily: "inherit", boxSizing: "border-box",
  };
  const label: React.CSSProperties = { fontSize: 13, fontWeight: 500, marginBottom: 6, display: "block", color: "#333" };

  if (loading) return <div style={{ ...page, alignItems: "center" }}><div style={{ color: "#8A8F98" }}>Загрузка…</div></div>;
  if (notFound || !form) return (
    <div style={{ ...page, alignItems: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Форма недоступна</div>
        <div style={{ fontSize: 14, color: "#8A8F98", lineHeight: 1.6 }}>Возможно, ссылка устарела или форма была отключена.</div>
      </div>
    </div>
  );

  const Sidebar = (
    <div style={side}>
      <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.25, marginBottom: 14 }}>{form.title}</div>
      {cfg?.enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: "#41464F" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {cfg.duration} мин
          </div>
          {step !== "time" && pickedDate && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: "#41464F" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              {pickedTime}, {Number(pickedDate.slice(8, 10))} {MONTHS_GEN[Number(pickedDate.slice(5, 7)) - 1]} {pickedDate.slice(0, 4)}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: "#41464F" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 010 20a15 15 0 010-20z" /></svg>
            {tz}
          </div>
        </div>
      )}
      {form.description && <div style={{ fontSize: 14, color: "#5B6069", lineHeight: 1.65 }}>{form.description}</div>}
    </div>
  );

  return (
    <div style={page}>
      <style>{`@media(max-width:800px){.vf-shell{grid-template-columns:1fr !important;} .vf-side{border-right:none !important;border-bottom:1px solid #E6E8EC;}}`}</style>
      <div style={shell} className="vf-shell">
        <div className="vf-side" style={{ display: "contents" }}>{Sidebar}</div>

        <div style={main}>
          {/* ── ШАГ 1: выбор даты и времени ── */}
          {step === "time" && cfg?.enabled && (
            <>
              <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 20 }}>Выберите дату и время</div>
              <div style={{ display: "grid", gridTemplateColumns: pickedDate ? "1fr 200px" : "1fr", gap: 26 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 14 }}>
                    <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: accent, padding: 4 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <div style={{ fontSize: 15, fontWeight: 600, minWidth: 150, textAlign: "center" }}>
                      {MONTHS[month.getMonth()]} {month.getFullYear()}
                    </div>
                    <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: accent, padding: 4 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
                    {WD_SHORT.map(w => <div key={w} style={{ textAlign: "center", fontSize: 11.5, color: "#8A8F98", fontWeight: 500, padding: "4px 0" }}>{w}</div>)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                    {monthGrid.map((ds, i) => {
                      if (!ds) return <div key={`e${i}`} />;
                      const avail = dayAvailable(ds);
                      const sel = pickedDate === ds;
                      return (
                        <button key={ds} disabled={!avail}
                          onClick={() => { setPickedDate(ds); setPickedTime(""); }}
                          style={{
                            aspectRatio: "1", borderRadius: "50%", border: "none",
                            cursor: avail ? "pointer" : "default",
                            background: sel ? accent : avail ? accent + "14" : "transparent",
                            color: sel ? "#fff" : avail ? accent : "#C6CAD1",
                            fontSize: 14, fontWeight: sel ? 700 : avail ? 600 : 400,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                          {Number(ds.slice(8, 10))}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {pickedDate && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                      {WD_SHORT[(new Date(pickedDate + "T12:00:00").getDay() + 6) % 7]}, {Number(pickedDate.slice(8, 10))} {MONTHS_GEN[Number(pickedDate.slice(5, 7)) - 1]}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
                      {slotsFor(pickedDate).map(t => (
                        <button key={t} onClick={() => { setPickedTime(t); setStep("form"); }}
                          style={{
                            padding: "12px 0", borderRadius: 10, cursor: "pointer",
                            border: "1px solid " + accent, background: "#fff",
                            color: accent, fontSize: 14.5, fontWeight: 600,
                          }}>
                          {t}
                        </button>
                      ))}
                      {slotsFor(pickedDate).length === 0 && (
                        <div style={{ fontSize: 13, color: "#8A8F98", lineHeight: 1.6 }}>На этот день свободного времени нет.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {!pickedDate && (
                <div style={{ fontSize: 13, color: "#8A8F98", marginTop: 18 }}>Выберите день — справа появится свободное время.</div>
              )}
            </>
          )}

          {/* ── ШАГ 2: форма ── */}
          {step === "form" && (
            <>
              {cfg?.enabled && (
                <button onClick={() => setStep("time")}
                  style={{ background: "none", border: "none", color: accent, fontSize: 13.5, cursor: "pointer", padding: 0, marginBottom: 14 }}>
                  ← Изменить время
                </button>
              )}
              <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 20 }}>Ваши данные</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={label}>Имя <span style={{ color: "#DC2626" }}>*</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} style={input} placeholder="Как к вам обращаться" />
                </div>
                <div>
                  <label style={label}>Email <span style={{ color: "#DC2626" }}>*</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={input} placeholder="you@example.com" />
                </div>
                <div>
                  <label style={label}>Телефон</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={input} placeholder="+7 900 000-00-00" />
                </div>

                {(form.questions || []).map(q => (
                  <div key={q.id}>
                    <label style={label}>{q.label} {q.required && <span style={{ color: "#DC2626" }}>*</span>}</label>
                    {q.type === "textarea" ? (
                      <textarea rows={3} value={answers[q.id] || ""} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                        style={{ ...input, resize: "vertical", minHeight: 84, lineHeight: 1.55 }} />
                    ) : q.type === "radio" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(q.options || []).map(o => (
                          <label key={o} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, cursor: "pointer" }}>
                            <input type="radio" name={q.id} checked={answers[q.id] === o}
                              onChange={() => setAnswers(a => ({ ...a, [q.id]: o }))} style={{ accentColor: accent }} />
                            {o}
                          </label>
                        ))}
                      </div>
                    ) : q.type === "checkbox" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(q.options || []).map(o => {
                          const arr: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                          return (
                            <label key={o} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, cursor: "pointer" }}>
                              <input type="checkbox" checked={arr.includes(o)}
                                onChange={() => setAnswers(a => ({ ...a, [q.id]: arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o] }))}
                                style={{ accentColor: accent }} />
                              {o}
                            </label>
                          );
                        })}
                      </div>
                    ) : q.type === "scale" ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                          <button key={n} onClick={() => setAnswers(a => ({ ...a, [q.id]: n }))}
                            style={{
                              width: 38, height: 38, borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: 600,
                              border: "1px solid " + (answers[q.id] === n ? accent : "#E0E3E8"),
                              background: answers[q.id] === n ? accent : "#fff",
                              color: answers[q.id] === n ? "#fff" : "#41464F",
                            }}>{n}</button>
                        ))}
                      </div>
                    ) : (
                      <input type={q.type === "email" ? "email" : q.type === "phone" ? "tel" : "text"}
                        value={answers[q.id] || ""} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} style={input} />
                    )}
                  </div>
                ))}

                {err && <div style={{ fontSize: 13, color: "#DC2626" }}>{err}</div>}

                <button onClick={submit} disabled={submitting || !requiredOk()}
                  style={{
                    padding: "14px", borderRadius: 11, border: "none", cursor: submitting || !requiredOk() ? "default" : "pointer",
                    background: requiredOk() && !submitting ? accent : "#E6E8EC",
                    color: requiredOk() && !submitting ? "#fff" : "#9AA0AA",
                    fontSize: 15, fontWeight: 600, marginTop: 4,
                  }}>
                  {submitting ? "Отправляем…" : cfg?.enabled ? "Подтвердить запись" : "Отправить"}
                </button>
              </div>
            </>
          )}

          {/* ── ШАГ 3: подтверждение ── */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "40px 10px" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: accent + "18",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.6"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 10 }}>{form.completion_title || "Готово!"}</div>
              {form.completion_subtitle && (
                <div style={{ fontSize: 14.5, color: "#5B6069", lineHeight: 1.65, maxWidth: 420, margin: "0 auto 14px" }}>{form.completion_subtitle}</div>
              )}
              {cfg?.enabled && pickedDate && (
                <div style={{ fontSize: 14, color: "#41464F", marginBottom: 22 }}>
                  {pickedTime}, {Number(pickedDate.slice(8, 10))} {MONTHS_GEN[Number(pickedDate.slice(5, 7)) - 1]} {pickedDate.slice(0, 4)} · {tz}
                </div>
              )}
              {form.completion_url && (
                <a href={form.completion_url} target="_blank" rel="noreferrer"
                  style={{
                    display: "inline-block", padding: "12px 26px", borderRadius: 11,
                    background: accent, color: "#fff", fontSize: 14.5, fontWeight: 600, textDecoration: "none",
                  }}>
                  {form.completion_btn_label || "Перейти"}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
