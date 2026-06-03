// TODO: i18n — credential provider labels and rate limit messages need dict lookup
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/utils";
import { decryptString } from "@/lib/encryption";
import { auditLog } from "@/lib/audit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
        totpCode: { label: "رمز التحقق", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = typeof request?.headers?.get === "function"
          ? (request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined)
          : undefined;

        const ipBan = ip ? await db.ipBan.findUnique({ where: { ip } }) : null;
        if (ipBan && (!ipBan.expiresAt || ipBan.expiresAt > new Date())) {
          return null;
        }

        const loginKey = crypto.createHash("sha256").update(credentials.email as string).digest("hex").slice(0, 16);
        if (!(await checkRateLimit(`login:${loginKey}`, 5))) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        if (user.deletedAt) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          await db.user.update({
            where: { id: user.id },
            data: { loginAttempts: { increment: 1 } },
          });

          const attempts = user.loginAttempts + 1;
          if (attempts >= 10) {
            await db.user.update({
              where: { id: user.id },
              data: { lockedUntil: new Date(Date.now() + 30 * 60 * 1000), loginAttempts: 0 },
            });

            if (ip) {
              await db.ipBan.upsert({
                where: { ip },
                update: { expiresAt: new Date(Date.now() + 60 * 60 * 1000), reason: "تجاوز عدد محاولات الدخول" },
                create: { ip, reason: "تجاوز عدد محاولات الدخول", expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
              });
            }
          }

          await auditLog({
            userId: user.id,
            action: "login_failed",
            resource: "auth",
            details: { ip },
          });

          return null;
        }

        if (user.totpEnabled) {
          const totpCode = credentials.totpCode as string | undefined;
          if (!totpCode) return null;
          const { verifyTOTP } = await import("@/lib/totp");
          const decryptedTotp = user.totpSecret ? decryptString(user.totpSecret) : "";
          if (!(await verifyTOTP(decryptedTotp, totpCode))) return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: { loginAttempts: 0, lockedUntil: null },
        });

        if (ip) {
          try { await db.ipBan.deleteMany({ where: { ip } }); } catch (e) { console.error("IP ban cleanup failed:", e); }
        }

        await auditLog({
          userId: user.id,
          action: "login",
          resource: "auth",
          details: { ip },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          plan: user.plan,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as string;
      }
      return session;
    },
  },
});
