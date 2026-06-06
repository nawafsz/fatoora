import { NextResponse } from "next/server";

function getHostOrigin(): string | null {
  try {
    return process.env.AUTH_URL
      ? new URL(process.env.AUTH_URL).origin
      : process.env.NEXTAUTH_URL
        ? new URL(process.env.NEXTAUTH_URL).origin
        : process.env.NEXT_PUBLIC_APP_URL
          ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
          : null;
  } catch {
    return null;
  }
}

export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  const source = origin ?? referer;
  if (!source && !host) return false;

  try {
    const sourceOrigin = source ? new URL(source).origin : null;

    const hostOrigin = host
      ? `${req.headers.get("x-forwarded-proto") ?? "https"}://${host}`
      : null;
    const hostOriginParsed = hostOrigin ? new URL(hostOrigin).origin : null;

    const configuredOrigin = getHostOrigin();

    if (sourceOrigin && hostOriginParsed && sourceOrigin === hostOriginParsed) return true;
    if (sourceOrigin && configuredOrigin && sourceOrigin === configuredOrigin) return true;
    if (!sourceOrigin && hostOriginParsed && configuredOrigin && hostOriginParsed === configuredOrigin) return true;

    return false;
  } catch {
    return false;
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
