import { NextResponse } from "next/server";

const ALLOWED_ORIGINS: string[] = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
  "https://fatoora.sa",
  "http://localhost",
].filter((s): s is string => Boolean(s) && s !== "undefined");

export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  if (!origin && !referer) return false;
  const source = origin ?? referer ?? "";
  try {
    const sourceOrigin = new URL(source).origin;
    return ALLOWED_ORIGINS.some((allowed) => {
      try { return new URL(allowed).origin === sourceOrigin; }
      catch { return false; }
    });
  } catch {
    return origin ? new URL(origin).origin === origin : false;
  }
}

export function csrfGuard(req: Request) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return null;
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "طلب غير مصرح به" }, { status: 403 });
  }
  return null;
}

export function apiAuthGuard(session: { user?: { id?: string } } | null): NextResponse | null {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  return null;
}
