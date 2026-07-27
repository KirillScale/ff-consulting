// app/l/[company]/[code]/page.tsx
//
// Редирект коротких ссылок Link Tracker: vizzy.pro/l/{company}/{code} -> целевой сайт.
// Префикс /l/ статический, поэтому этот роут НЕ перехватывает другие адреса сайта.
//
// СКОРОСТЬ (что изменилось по сравнению с прошлой версией):
//  1) runtime = "edge" — роут выполняется на Edge-сети Vercel, а не в обычной
//     Node.js serverless-функции. У обычных функций бывает «холодный старт»
//     (несколько секунд на первый заход после простоя) — у edge-функций
//     холодного старта практически нет.
//  2) Запись перехода в аналитику больше НЕ блокирует редирект. Раньше страница
//     ждала до 2 секунд, пока в базу запишется клик, и только потом отправляла
//     пользователя дальше. Теперь редирект происходит сразу, как только найдена
//     ссылка, а запись клика уходит в фоне.
//
// Надёжность (осталось как было):
//  - переход не ломается, если аналитика недоступна;
//  - поиск ссылки ограничен по времени, чтобы страница не «висела»;
//  - при отсутствии переменных окружения показывается понятная страница, а не сбой.

import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// Edge runtime — самый весомый рычаг скорости для редко посещаемого роута:
// без него каждый «холодный» заход мог сам по себе стоить несколько секунд.
export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// не даём медленному запросу задержать переход
function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T | null> {
  return Promise.race([
    Promise.resolve(p)
      .then((v) => v as T)
      .catch(() => null),
    new Promise<null>((res) => setTimeout(() => res(null), ms)),
  ]);
}

function detectDevice(ua: string) {
  const s = (ua || "").toLowerCase();
  if (/ipad|tablet/.test(s)) return "tablet";
  if (/mobile|iphone|android/.test(s)) return "mobile";
  return "desktop";
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0E0E0E",
        color: "#EDEDED",
        fontFamily: "-apple-system, Segoe UI, Inter, Arial, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 14, color: "#9A9A9A", lineHeight: 1.6, marginBottom: 22 }}>{text}</div>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 9,
            background: "#2F6BFF",
            color: "#fff",
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          На главную
        </a>
      </div>
    </div>
  );
}

export default async function ShortLinkRedirect({
  params,
}: {
  params: Promise<{ company: string; code: string }>;
}) {
  const { company, code } = await params;

  if (!SUPA_URL || !SUPA_KEY) {
    return <Notice title="Сервис ссылок не настроен" text="Не заданы ключи подключения к базе." />;
  }

  const supabase = createClient(SUPA_URL, SUPA_KEY);

  // Поиск ссылки — единственный шаг, который ОБЯЗАН завершиться до редиректа
  // (без него нечего некуда перенаправлять). Таймаут снижен до 2.5с: поиск идёт
  // по уникальному индексу (company, code), в норме это заметно быстрее.
  const link = await withTimeout(
    supabase
      .from("tracker_links")
      .select("id,user_id,target_url,active,expires_at,utm_source,utm_medium,utm_campaign")
      .eq("company", company)
      .eq("code", code)
      .maybeSingle()
      .then((r) => (r.error ? null : r.data)),
    2500
  );

  if (!link) {
    return <Notice title="Ссылка не найдена" text="Возможно, она была удалена или адрес указан с ошибкой." />;
  }
  if (link.active === false) {
    return <Notice title="Ссылка отключена" text="Владелец временно приостановил переходы по этой ссылке." />;
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return <Notice title="Срок ссылки истёк" text="Эта ссылка больше не действует." />;
  }

  // подставляем UTM, если заданы
  let target = String(link.target_url || "");
  try {
    const u = new URL(target);
    if (link.utm_source) u.searchParams.set("utm_source", link.utm_source);
    if (link.utm_medium) u.searchParams.set("utm_medium", link.utm_medium);
    if (link.utm_campaign) u.searchParams.set("utm_campaign", link.utm_campaign);
    target = u.toString();
  } catch {
    // кривой URL — оставляем как есть
  }

  if (!/^https?:\/\//i.test(target)) {
    return <Notice title="Некорректный адрес" text="Целевая ссылка указана неверно. Исправьте её в Link Tracker." />;
  }

  // Фиксируем переход БЕЗ ожидания — пользователь не должен ждать запись аналитики.
  // Промис намеренно не await'ится: запрос уходит сейчас же, редирект не стоит в очереди за ним.
  // Если Vercel оборвёт функцию раньше, чем допишется клик — потеряется только
  // одна строка статистики, а не сам переход, что абсолютно приемлемо.
  try {
    const h = await headers();
    supabase
      .from("tracker_clicks")
      .insert({
        link_id: link.id,
        user_id: link.user_id,
        referrer: h.get("referer") || "",
        device: detectDevice(h.get("user-agent") || ""),
      })
      .then(() => {})
      .catch(() => {});
  } catch {
    // намеренно игнорируем — аналитика не должна мешать переходу
  }

  // redirect() намеренно вызывается вне try/catch:
  // внутри он бросает служебное исключение, и catch его бы «проглотил».
  redirect(target);
}
