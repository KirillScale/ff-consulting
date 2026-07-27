import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg","image/png","image/webp","image/gif",
  "application/pdf","text/plain","text/csv",
  "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const safeName = (name: string) =>
  name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-120) || "file";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });

    const body = await req.formData();
    const file = body.get("file");
    const slug = String(body.get("slug") || "").trim();
    const sessionId = String(body.get("session_id") || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80);
    if (!(file instanceof File) || !slug || !sessionId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "File must be smaller than 10 MB" }, { status: 413 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: form } = await admin.from("forms").select("id,is_active").eq("slug", slug).eq("is_active", true).maybeSingle();
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const path = `${form.id}/${sessionId}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await admin.storage.from("form-uploads").upload(path, bytes, {
      contentType: file.type, upsert: false, cacheControl: "3600",
    });
    if (error) throw error;

    return NextResponse.json({ path, name: file.name, size: file.size, type: file.type });
  } catch (error: any) {
    console.error("Vizzy Form upload failed", error);
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 });
  }
}
