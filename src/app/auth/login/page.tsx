"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function LoginPage() {
  const { dict, lang } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (step === "credentials") {
      const checkRes = await fetch("/api/auth/check-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { enabled } = await checkRes.json();

      if (enabled) {
        setStep("totp");
        setLoading(false);
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (res?.error) {
        setError(dict.auth.login.invalidCredentials);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } else {
      const res = await signIn("credentials", {
        email,
        password,
        totpCode,
        redirect: false,
      });

      setLoading(false);

      if (res?.error) {
        setError(dict.auth.login.invalidCode);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f0faf4] via-white to-[#f8f8ff]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0d2818] to-[#1a5632] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 70%, #d4a843 0%, transparent 60%), radial-gradient(circle at 70% 20%, #2d8a4e 0%, transparent 60%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="text-white text-lg font-black">{dict.brand.logo}</span>
            </div>
            <span className="text-white text-2xl font-black">{dict.brand.name}</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h2 className="text-3xl font-black text-white leading-tight">
            {dict.auth.login.hero.split('\n').map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {i === 1 ? <span className="text-[#d4a843]">{line}</span> : line}
              </span>
            ))}
          </h2>
          <div className="space-y-3">
            {dict.auth.login.features.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-green-100 text-sm">
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <p className="text-green-100 text-sm italic">
              &ldquo;{dict.auth.login.quote}&rdquo;
            </p>
            <p className="text-[#d4a843] text-xs mt-2 font-semibold">{dict.auth.login.quoteAuthor}</p>
          </div>
        </div>
        <p className="relative text-green-200 text-xs">&copy; {new Date().getFullYear()} {dict.brand.copyright}</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1a5632] to-[#2d8a4e] rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-black">{dict.brand.logo}</span>
            </div>
            <span className="text-2xl font-black text-[#0d2818]">{dict.brand.name}</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 md:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-black text-[#0d2818]">{dict.auth.login.heading}</h1>
              <p className="text-gray-500 text-sm mt-1">{dict.auth.login.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">
                  {dict.auth.login.email}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white"
                  placeholder="example@email.com"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">
                  {dict.auth.login.password}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              {step === "totp" && (
                <div>
                  <label className="block text-sm font-semibold text-[#0d2818] mb-2">
                    {dict.auth.login.code}
                  </label>
                  <input
                    id="totpCode"
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder={dict.auth.login.codePlaceholder}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1.5">{dict.auth.login.codeHint}</p>
                </div>
              )}

              {step === "totp" && (
                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setTotpCode(""); setError(""); }}
                  className="text-xs text-gray-400 hover:text-[#1a5632] transition-colors"
                >
                  {dict.auth.login.backToPassword}
                </button>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                id="login-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a5632] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    {dict.auth.login.loading}
                  </span>
                ) : step === "totp" ? dict.auth.login.verify : dict.auth.login.submit}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {dict.auth.login.noAccount}{" "}
                  <Link href="/auth/register" className="text-[#1a5632] font-bold hover:underline">
                    {dict.auth.login.createAccount}
                  </Link>
                </p>
                <Link href="/auth/forgot-password" className="text-xs text-gray-400 hover:text-[#1a5632] transition-colors font-medium">
                  {dict.auth.login.forgotPassword}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
