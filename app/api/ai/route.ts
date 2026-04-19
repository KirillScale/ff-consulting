import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Ты — AI-ассистент Kirill Scales AI. Ты помогаешь предпринимателям с бизнес-стратегией, маркетингом, продажами и контентом. Отвечай на русском языке. Давай конкретные, практичные советы. Будь прямым и по делу.",
          },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: 0.7,
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
