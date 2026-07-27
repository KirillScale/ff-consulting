import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceKey) return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });

    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const path = req.nextUrl.searchParams.get("path") || "";
    const responseId = req.nextUrl.searchParams.get("response_id") || "";
    if (!token || !path || !responseId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: response } = await admin.from("form_responses").select("form_id,answers").eq("id", responseId).maybeSingle();
    if (!response) return NextResponse.json({ error: "File not found" }, { status: 404 });
    const { data: form } = await admin.from("forms").select("id,user_id").eq("id", response.form_id).maybeSingle();
    if (!form || form.user_id !== userData.user.id || !path.startsWith(`${form.id}/`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!JSON.stringify(response.answers || {}).includes(path)) return NextResponse.json({ error: "File is not linked to this response" }, { status: 403 });

    const { data, error } = await admin.storage.from("form-uploads").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) throw error || new Error("Could not sign file");
    return NextResponse.json({ url: data.signedUrl });
  } catch (error: any) {
    console.error("Vizzy Form file access failed", error);
    return NextResponse.json({ error: error?.message || "File access failed" }, { status: 500 });
  }
}
