"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";

type PlanId = "starter" | "pro" | "premium";
type PaymentProvider = "moyasar" | "tamara";

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  provider: string;
  plan: string;
  description: string;
  createdAt: string;
}

interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  paymentMethod: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

interface BillingData {
  plan: string;
  invoicesLimit: number;
  subscription: SubscriptionData | null;
  payments: PaymentRecord[];
}

const plans = [
  {
    id: "starter" as PlanId,
    nameEn: "Starter",
    price: 49,
    annualPrice: 499,
    invoices: 100,
    popular: false,
  },
  {
    id: "pro" as PlanId,
    nameEn: "Pro",
    price: 99,
    annualPrice: 999,
    invoices: 1000,
    popular: true,
  },
  {
    id: "premium" as PlanId,
    nameEn: "Premium",
    price: 199,
    annualPrice: 1999,
    invoices: Infinity,
    popular: false,
  },
];

function formatDate(d: string | null, lang: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatSar(amount: number, lang: string): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
    style: "currency", currency: "SAR", minimumFractionDigits: 2,
  }).format(amount);
}

function statusBadge(status: string | null, dict: any): { label: string; color: string } {
  const s = dict.billing.status;
  switch (status) {
    case "active": return { label: s.active, color: "bg-emerald-100 text-emerald-700" };
    case "incomplete": return { label: s.incomplete, color: "bg-amber-100 text-amber-700" };
    case "canceled": return { label: s.canceled, color: "bg-red-100 text-red-600" };
    case "past_due": return { label: s.pastDue, color: "bg-orange-100 text-orange-600" };
    case "trialing": return { label: s.trialing, color: "bg-blue-100 text-blue-600" };
    default: return { label: "—", color: "bg-gray-100 text-gray-500" };
  }
}

export default function BillingPage() {
  const { dict, lang } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [data, setData] = useState<BillingData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("moyasar");

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { setData(d); setFetching(false); })
      .catch(() => { setFetching(false); });
  }, []);

  async function subscribe(planId: string) {
    setLoading(planId);
    setError("");

    try {
      const endpoint = selectedProvider === "tamara" ? "/api/checkout/tamara" : "/api/checkout";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? dict.billing.errors.connectionFailed);
        return;
      }

      if (result.url) { window.location.assign(result.url); }
    } catch {
      setError(dict.common.networkError);
    } finally {
      setLoading(null);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlan = data?.plan ?? "free";
  const sub = data?.subscription;
  const badge = statusBadge(sub?.status ?? null, dict);
  const isSubscribed = sub?.status === "active" || sub?.status === "trialing";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.billing.heading}</h1>
        <p className="text-gray-500 text-sm mt-1">{dict.billing.subtitle}</p>
      </div>

      {/* Current plan banner */}
      <div className={`rounded-2xl p-5 flex items-center justify-between border ${
        isSubscribed ? "bg-gradient-to-l from-emerald-50 to-white border-emerald-200" : "bg-gradient-to-l from-gray-50 to-gray-100/50 border-gray-200"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shadow-sm ${
            isSubscribed ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"
          }`}>
            {isSubscribed ? "✅" : "🆓"}
          </div>
          <div>
            <p className="font-bold text-[#0d2818]">
              {isSubscribed
                ? `${dict.billing.currentPlan} ${sub?.plan ? dict.billing.plans[sub.plan as PlanId]?.name : ""}`
                : dict.billing.freePlan}
            </p>
            <p className="text-gray-500 text-sm mt-0.5">
              {isSubscribed
                ? `${formatDate(sub?.currentPeriodStart ?? null, lang)} — ${formatDate(sub?.currentPeriodEnd ?? null, lang)}`
                : dict.billing.freePlanDesc}
            </p>
            {sub?.paymentMethod && (
              <p className="text-xs text-gray-400 mt-1">
                {dict.billing.provider[sub.paymentMethod as keyof typeof dict.billing.provider] ?? sub.paymentMethod}
              </p>
            )}
          </div>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium hidden md:block ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Payment provider toggle */}
      {!isSubscribed && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">{dict.billing.paymentToggle}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedProvider("moyasar")}
              className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                selectedProvider === "moyasar"
                  ? "border-[#1a5632] bg-[#1a5632]/5 text-[#1a5632] ring-1 ring-[#1a5632]"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <span className="block text-lg mb-1">💳</span>
              {dict.billing.moyasarOption}
            </button>
            <button
              onClick={() => setSelectedProvider("tamara")}
              className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                selectedProvider === "tamara"
                  ? "border-[#1a5632] bg-[#1a5632]/5 text-[#1a5632] ring-1 ring-[#1a5632]"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <span className="block text-lg mb-1">🔄</span>
              {dict.billing.tamaraOption}
            </button>
          </div>
          {selectedProvider === "tamara" && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              {dict.billing.tamaraNote}
            </p>
          )}
        </div>
      )}

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const planDict = dict.billing.plans[plan.id];
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-[#d4a843] shadow-xl shadow-[#d4a843]/15 ring-2 ring-[#d4a843]/30"
                  : "border-gray-100 shadow-sm hover:shadow-md"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                  <span className="bg-[#d4a843] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                    {dict.billing.popular}
                  </span>
                </div>
              )}

              <div className="p-7 flex-1">
                <div className="mb-6">
                  <p className="text-xs text-gray-400 font-medium">{plan.nameEn}</p>
                  <h3 className="text-xl font-black text-[#0d2818] mt-0.5">{planDict.name}</h3>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl font-black text-[#1a5632]">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{dict.billing.period}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {dict.billing.annual} {plan.annualPrice} {dict.billing.annualSuffix} {plan.price * 12 - plan.annualPrice} ر.س)
                  </p>
                </div>

                <ul className="space-y-3">
                  {planDict.features.map((f: string, j: number) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                  {(planDict.notIncluded ?? []).map((f: string, j: number) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center text-xs flex-shrink-0">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-7 pb-7">
                {isCurrentPlan && isSubscribed ? (
                  <div className="w-full py-3.5 rounded-xl text-sm font-bold text-center bg-gray-100 text-gray-500">
                    {dict.billing.currentBadge}
                  </div>
                ) : isCurrentPlan ? (
                  <button
                    onClick={() => subscribe(plan.id)}
                    disabled={loading !== null}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5 ${
                      plan.popular
                        ? "bg-[#d4a843] text-white hover:bg-[#e8c46a] shadow-lg shadow-[#d4a843]/30"
                        : "bg-[#1a5632] text-white hover:bg-[#2d8a4e] shadow-lg shadow-[#1a5632]/20"
                    }`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        {dict.billing.upgradeLoading}
                      </span>
                    ) : dict.billing.upgradeBtn}
                  </button>
                ) : (
                  <button
                    onClick={() => subscribe(plan.id)}
                    disabled={loading !== null}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5 ${
                      plan.popular
                        ? "bg-[#d4a843] text-white hover:bg-[#e8c46a] shadow-lg shadow-[#d4a843]/30"
                        : "bg-[#1a5632] text-white hover:bg-[#2d8a4e] shadow-lg shadow-[#1a5632]/20"
                    }`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        {dict.billing.upgradeLoading}
                      </span>
                    ) : dict.billing.subscribeBtn}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Payment history */}
      {data?.payments && data.payments.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-bold text-[#0d2818] mb-4">{dict.billing.paymentHistory}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs">
                  <th className="text-right py-2 pr-2">{dict.billing.table.date}</th>
                  <th className="text-right py-2 pr-2">{dict.billing.table.description}</th>
                  <th className="text-right py-2 pr-2">{dict.billing.table.amount}</th>
                  <th className="text-right py-2 pr-2">{dict.billing.table.method}</th>
                  <th className="text-right py-2 pr-2">{dict.billing.table.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-3 pr-2 text-gray-600">{formatDate(p.createdAt, lang)}</td>
                    <td className="py-3 pr-2 text-gray-800">{p.description}</td>
                    <td className="py-3 pr-2 text-gray-800 font-medium">{formatSar(Number(p.amount), lang)}</td>
                    <td className="py-3 pr-2 text-gray-500">{dict.billing.provider[p.provider as keyof typeof dict.billing.provider] ?? p.provider}</td>
                    <td className="py-3 pr-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        p.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {p.status === "paid" ? dict.billing.status.paid : p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All plans include */}
      <div className="bg-gradient-to-l from-[#f0faf4] to-white border border-emerald-100 rounded-2xl p-6">
        <p className="font-bold text-[#0d2818] mb-4 flex items-center gap-2">
          <span>✅</span> {dict.billing.includes}
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {dict.billing.includesList.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-[#1a5632] font-bold">✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
