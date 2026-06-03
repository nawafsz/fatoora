import { NextResponse } from "next/server";
import { auditLog } from "@/lib/audit";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-hub-signature-256");
  const ip = req.headers.get("x-forwarded-for") ?? "whatsapp";

  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: "فشل قراءة الطلب" }, { status: 400 });
  }

  if (!VERIFY_TOKEN) {
    return NextResponse.json({ error: "WHATSAPP_VERIFY_TOKEN غير مضبوط" }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "التوقيع مفقود" }, { status: 403 });
  }

  try {
    const crypto = await import("crypto");
    const expected = `sha256=${crypto.createHmac("sha256", VERIFY_TOKEN).update(body).digest("hex")}`;
    if (signature !== expected) {
      return NextResponse.json({ error: "توقيع غير صحيح" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "فشل التحقق من التوقيع" }, { status: 500 });
  }

  await auditLog({
    action: "webhook_received", resource: "webhook",
    details: { provider: "whatsapp", signatureVerified: !!signature }, ip,
  });

  return NextResponse.json({ success: true });
}
