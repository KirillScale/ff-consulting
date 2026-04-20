import { NextRequest, NextResponse } from "next/server";

const DEFAULT_SYSTEM = "Ты — AI-ассистент Kirill Scales AI. Ты помогаешь предпринимателям с бизнес-стратегией, маркетингом, продажами и контентом. Отвечай на русском языке. Давай конкретные, практичные советы. Будь прямым и по делу.";

export async function POST(req: NextRequest) {
  try {
    const { messages, system, vision } = await req.json();

    // DeepSeek vision model for image analysis, regular for text
    const model = vision ? "deepseek-chat" : "deepseek-chat";

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system || DEFAULT_SYSTEM },
          ...messages.map((m: any) => ({
            role: m.role,
            content: Array.isArray(m.content)
              ? m.content.map((c: any) => {
                  if (c.type === "image_url") {
                    return { type: "text", text: "[Пользователь загрузил скрин аккаунта. Проанализируй его нишу, стиль, аудиторию и тональность на основе описания.]" };
                  }
                  return { type: "text", text: c.text };
                })
              : m.content,
          })),
        ],
        max_tokens: 3000,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "Нет ответа";

    return NextResponse.json({ content: [{ type: "text", text: content }] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
