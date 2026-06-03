"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function ResetPasswordPage() {
  const { dict, lang } = useLanguage();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [step, setStep] = useState<"verifying" | "ready" | "invalid" | "done">(
    !email || !token ? "invalid" : "verifying"
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !token) return;
    fetch("/api/auth/verify-reset-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    })
      .then((r) => r.json())
      .then((data) => setStep(data.valid ? "ready" : "invalid"))
      .catch(() => setStep("invalid"));
  }, [email, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(dict.auth.resetPassword.passwordsNotMatch);
      return;
    }

    if (password.length < 8) {
      setError(dict.auth.resetPassword.passwordTooShort);
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError(dict.auth.resetPassword.passwordRequirements);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? dict.common.error);
        return;
      }

      setStep("done");
    } catch {
      setError(dict.common.networkError);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white";

  if (step === "invalid") {
    return (
      <PageWrapper>
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">⚠️</div>
          <h1 className="text-2xl font-black text-[#0d2818] mb-2">{dict.auth.resetPassword.invalidToken}</h1>
          <p className="text-gray-500 text-sm mb-6">{dict.auth.resetPassword.invalidTokenDesc}</p>
          <Link href="/auth/forgot-password" className="text-[#1a5632] font-bold text-sm hover:underline">{dict.auth.resetPassword.requestNew}</Link>
        </div>
      </PageWrapper>
    );
  }

  if (step === "done") {
    return (
      <PageWrapper>
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">✅</div>
          <h1 className="text-2xl font-black text-[#0d2818] mb-2">{dict.auth.resetPassword.success}</h1>
          <p className="text-gray-500 text-sm mb-6">{dict.auth.resetPassword.successMsg}</p>
          <Link href="/auth/login" className="inline-block bg-[#1a5632] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20">{dict.auth.resetPassword.loginNow}</Link>
        </div>
      </PageWrapper>
    );
  }

  if (step === "verifying") {
    return (
      <PageWrapper>
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center animate-pulse">
          <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4" />
          <div className="h-4 bg-gray-100 rounded-lg w-32 mx-auto" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-[#1a5632]/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔑</div>
          <h1 className="text-2xl font-black text-[#0d2818]">{dict.auth.resetPassword.heading}</h1>
          <p className="text-gray-500 text-sm mt-1">{dict.auth.resetPassword.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.auth.resetPassword.newPassword}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" dir="ltr" required minLength={8} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.auth.resetPassword.confirmPassword}</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} placeholder="••••••••" dir="ltr" required />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3 text-center">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-[#1a5632] text-white py-3.5 rounded-2xl font-black text-sm hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                {dict.auth.resetPassword.loading}
              </span>
            ) : dict.auth.resetPassword.submit}
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {children}
    </div>
  );
}
