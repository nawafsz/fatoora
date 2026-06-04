import { signOut } from "@/lib/auth";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { csrfGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  if (session?.user?.id) {
    if (!(await checkRateLimit(`signout:${session.user.id}`, 5))) {
      return NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 });
    }

    await auditLog({
      userId: session.user.id,
      action: "logout",
      resource: "auth",
    });
  }

  const signOutRes = await signOut({ redirect: false });
  const redirectUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/", redirectUrl));

  if (signOutRes?.headers) {
    for (const [key, value] of signOutRes.headers.entries()) {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.append(key, value);
      }
    }
  }

  return response;
}
