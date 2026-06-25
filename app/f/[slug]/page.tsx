"use client";
// app/f/[slug]/page.tsx
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Question = { id: string; type: string; label: string; required: boolean; options: string[] };
type FormData = {
  id: string; title: string; description: string; slug: string;
  questions: Question[]; completion_title: string; completion_subtitle: string;
  completion_url: string; completion_btn_label: string; accent_color: string; is_active: boolean;
};

export default function PublicForm({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(p => { setSlug(p.slug); });
  }, [params]);

  useEffect(() => {
    if (slug) loadForm(slug);
  }, [slug]);

  const loadForm = async (s: string) => {
    const { data } = await supabase
      .from("forms")
      .select("*")
      .eq("slug", s)
      .eq("is_active", true)
      .single();

    if (!data) { setNotFound(true); setLoading(false); return; }
    setForm(data as FormData);
    setLoading(false);

    // Record view
    await supabase.from("form_views").insert({ form_id: data.id });
  };

  const accent = form?.accent_color || "#10B981";
  const questions = form?.questions || [];
  const currentQ = questions[step - 1];
  const isIntro = step === 0;
  const isDone = done;
  const totalSteps = questions.length;
  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100);

  const setAnswer = (qId: string, val: any) => setAnswers(prev => ({ ...prev, [qId]: val }));

  const canNext = () => {
    if (isIntro) return true;
    if (!currentQ) return false;
    if (!currentQ.required) return true;
    const val = answers[currentQ.id];
    if (!val) return false;
    if (Array.isArray(val)) return val.length > 0;
    return String(val).trim().length > 0;
  };

  const handleNext = async () => {
    setError("");
    if (step < totalSteps) {
      setStep(s => s + 1);
    } else {
      await submit();
    }
  };

  const submit = async () => {
    // Validate required
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id];
        if (!val || (Array.isArray(val) && val.length === 0) || String(val).trim() === "") {
          setError(`Пожалуйста, ответь на вопрос: «${q.label}»`);
          const qi = questions.indexOf(q);
          setStep(qi + 1);
          return;
        }
      }
    }

    setSubmitting(true);
    const formatted = questions.map(q => ({
      question_id: q.id,
      question_label: q.label,
      answer: answers[q.id] ?? null,
    }));

    const emailQ = questions.find(q => q.type === "email");
    const respondentEmail = emailQ ? answers[emailQ.id] : null;

    await supabase.from("form_responses").insert({
      form_id: form!.id,
      answers: formatted,
      respondent_email: respondentEmail,
    });

    setSubmitting(false);
    setDone(true);
  };

  const handleCheckbox = (qId: string, opt: string) => {
    const cur: string[] = answers[qId] || [];
    const next = cur.includes(opt) ? cur.filter(v => v !== opt) : [...cur, opt];
    setAnswer(qId, next);
  };

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0F1A" }}>
      <div style={{ width: 48, height: 48, border: `3px solid rgba(255,255,255,0.1)`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Not found ──
  if (notFound || !form) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0F1A", color: "#fff", textAlign: "center", padding: 24 }}>
      <div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Форма не найдена</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)" }}>Ссылка устарела или форма была отключена</div>
      </div>
    </div>
  );

  // ── Done ──
  if (isDone) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0F1A", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", border: `2px solid ${accent}44` }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12 }}>{form.completion_title || "Спасибо!"}</div>
        {form.completion_subtitle && <div style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 28, lineHeight: 1.6 }}>{form.completion_subtitle}</div>}
        {form.completion_url && (
          <a href={form.completion_url} target="_blank" rel="noreferrer"
            style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: accent, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: `0 4px 20px ${accent}44` }}>
            {form.completion_btn_label || "Перейти"}
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1A", display: "flex", flexDirection: "column", fontFamily: "'Inter', 'Montserrat', sans-serif" }}>
      {/* Progress bar */}
      {!isIntro && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: accent, transition: "width 0.4s ease" }} />
        </div>
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 24px 40px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>

          {/* Intro */}
          {isIntro && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", border: `1.5px solid ${accent}44` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12, lineHeight: 1.3 }}>{form.title}</h1>
              {form.description && <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 32, lineHeight: 1.65 }}>{form.description}</p>}
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 32 }}>{totalSteps} вопрос{totalSteps === 1 ? "" : totalSteps < 5 ? "а" : "ов"}</div>
              <button onClick={() => setStep(1)}
                style={{ padding: "15px 40px", borderRadius: 12, border: "none", background: accent, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 20px ${accent}44`, transition: "opacity 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
                Начать →
              </button>
            </div>
          )}

          {/* Question */}
          {!isIntro && currentQ && (
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontWeight: 600 }}>
                {step} / {totalSteps}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6, lineHeight: 1.4 }}>
                {currentQ.label}
                {currentQ.required && <span style={{ color: accent, marginLeft: 4 }}>*</span>}
              </h2>

              <div style={{ marginTop: 24, marginBottom: 24 }}>
                {/* Short text */}
                {currentQ.type === "text" && (
                  <input value={answers[currentQ.id] || ""} onChange={e => setAnswer(currentQ.id, e.target.value)}
                    onKeyDown={e => e.key === "Enter" && canNext() && handleNext()}
                    autoFocus placeholder="Твой ответ..."
                    style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${answers[currentQ.id] ? accent + "66" : "rgba(255,255,255,0.1)"}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }} />
                )}

                {/* Long text */}
                {currentQ.type === "textarea" && (
                  <textarea value={answers[currentQ.id] || ""} onChange={e => setAnswer(currentQ.id, e.target.value)}
                    autoFocus placeholder="Твой ответ..." rows={4}
                    style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid rgba(255,255,255,0.1)`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 15, outline: "none", resize: "vertical", minHeight: 120, boxSizing: "border-box", fontFamily: "inherit" }} />
                )}

                {/* Email */}
                {currentQ.type === "email" && (
                  <input type="email" value={answers[currentQ.id] || ""} onChange={e => setAnswer(currentQ.id, e.target.value)}
                    onKeyDown={e => e.key === "Enter" && canNext() && handleNext()}
                    autoFocus placeholder="example@email.com"
                    style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid rgba(255,255,255,0.1)`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                )}

                {/* Phone */}
                {currentQ.type === "phone" && (
                  <input type="tel" value={answers[currentQ.id] || ""} onChange={e => setAnswer(currentQ.id, e.target.value)}
                    onKeyDown={e => e.key === "Enter" && canNext() && handleNext()}
                    autoFocus placeholder="+7 (999) 000-00-00"
                    style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid rgba(255,255,255,0.1)`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                )}

                {/* Scale */}
                {currentQ.type === "scale" && (
                  <div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <button key={n} onClick={() => setAnswer(currentQ.id, n)}
                          style={{ width: 48, height: 48, borderRadius: 10, border: `2px solid ${answers[currentQ.id] === n ? accent : "rgba(255,255,255,0.12)"}`, background: answers[currentQ.id] === n ? accent : "rgba(255,255,255,0.05)", color: answers[currentQ.id] === n ? "#fff" : "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      <span>Плохо</span><span>Отлично</span>
                    </div>
                  </div>
                )}

                {/* Radio */}
                {currentQ.type === "radio" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {currentQ.options.filter(Boolean).map(opt => (
                      <button key={opt} onClick={() => setAnswer(currentQ.id, opt)}
                        style={{ padding: "14px 18px", borderRadius: 12, border: `2px solid ${answers[currentQ.id] === opt ? accent : "rgba(255,255,255,0.1)"}`, background: answers[currentQ.id] === opt ? `${accent}18` : "rgba(255,255,255,0.03)", color: answers[currentQ.id] === opt ? "#fff" : "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: answers[currentQ.id] === opt ? 700 : 400, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Checkbox */}
                {currentQ.type === "checkbox" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {currentQ.options.filter(Boolean).map(opt => {
                      const selected = (answers[currentQ.id] || []).includes(opt);
                      return (
                        <button key={opt} onClick={() => handleCheckbox(currentQ.id, opt)}
                          style={{ padding: "14px 18px", borderRadius: 12, border: `2px solid ${selected ? accent : "rgba(255,255,255,0.1)"}`, background: selected ? `${accent}18` : "rgba(255,255,255,0.03)", color: selected ? "#fff" : "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: selected ? 700 : 400, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? accent : "rgba(255,255,255,0.2)"}`, background: selected ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                          </div>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: "#FCA5A5", fontSize: 13, marginBottom: 16, border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                {step > 1 && (
                  <button onClick={() => setStep(s => s - 1)}
                    style={{ padding: "13px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    ←
                  </button>
                )}
                <button onClick={handleNext} disabled={!canNext() || submitting}
                  style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: canNext() ? accent : "rgba(255,255,255,0.06)", color: canNext() ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 15, fontWeight: 700, cursor: canNext() ? "pointer" : "not-allowed", boxShadow: canNext() ? `0 4px 16px ${accent}44` : "none", transition: "all 0.2s" }}>
                  {submitting ? "Отправляем..." : step === totalSteps ? "Отправить ✓" : "Далее →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px", fontSize: 11, color: "rgba(255,255,255,0.15)" }}>
        Powered by Vizzy
      </div>
    </div>
  );
}
