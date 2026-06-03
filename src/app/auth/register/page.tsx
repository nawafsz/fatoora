"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function RegisterPage() {
  const { dict, lang } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? dict.common.error);
        return;
      }

      router.push("/auth/login");
    } catch {
      setError(dict.common.networkError);
    } finally {
      setLoading(false);
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
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="text-white text-lg font-black">{dict.brand.logo}</span>
            </div>
            <span className="text-white text-2xl font-black">{dict.brand.name}</span>
          </Link>
        </div>
        <div className="relative space-y-8">
          <h2 className="text-3xl font-black text-white leading-tight">
            {dict.auth.register.hero.split('\n').map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {i === 1 ? <span className="text-[#d4a843]">{line}</span> : line}
              </span>
            ))}
          </h2>
          <div className="space-y-4">
            {dict.auth.register.steps.map((text, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#d4a843] text-white font-black flex items-center justify-center flex-shrink-0 shadow-md">
                  {String.fromCharCode(0x0661 + i)}
                </div>
                <p className="text-green-100 font-medium">{text}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <div className="flex gap-1 mb-2">
              {[1,2,3,4,5].map(i => <span key={i} className="text-[#d4a843]">★</span>)}
            </div>
            <p className="text-green-100 text-sm italic">
              &ldquo;{dict.auth.register.quote}&rdquo;
            </p>
            <p className="text-[#d4a843] text-xs mt-2 font-semibold">{dict.auth.register.quoteAuthor}</p>
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
              <h1 className="text-2xl font-black text-[#0d2818]">{dict.auth.register.heading}</h1>
              <p className="text-gray-500 text-sm mt-1">{dict.auth.register.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.auth.register.name}</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white"
                  placeholder={dict.auth.register.namePlaceholder}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.auth.register.email}</label>
                <input
                  id="reg-email"
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
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.auth.register.phone}</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white"
                  placeholder={dict.auth.register.phonePlaceholder}
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.auth.register.password}</label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white"
                  placeholder={dict.auth.register.passwordPlaceholder}
                  minLength={6}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                id="register-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a5632] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    {dict.auth.register.loading}
                  </span>
                ) : dict.auth.register.submit}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                {dict.auth.register.haveAccount}{" "}
                <Link href="/auth/login" className="text-[#1a5632] font-bold hover:underline">
                  {dict.auth.register.login}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
