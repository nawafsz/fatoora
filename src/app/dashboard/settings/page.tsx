"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import QRCode from "qrcode";
import { useLanguage } from "@/components/language-provider";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    taxNumber: "",
    commercialReg: "",
    city: "",
    street: "",
    buildingNumber: "",
    neighborhood: "",
    postalCode: "",
    additionalNumber: "",
    invoicePrefix: "INV-",
    defaultTaxRate: 15,
    language: "ar",
    zatcaEnv: "sandbox",
    avtaxClientId: "",
    avtaxClientSecret: "",
    deviceSerialNumber: "",
    complianceStatus: "pending",
  });

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  // EGS Unit creation
  const [showEgsForm, setShowEgsForm] = useState(false);
  const [egsForm, setEgsForm] = useState({ email: "", password: "", serialNumber: "", otp: "" });
  const [egsCreating, setEgsCreating] = useState(false);
  const [egsResult, setEgsResult] = useState<{ success: boolean; message: string } | null>(null);

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [totpMessage, setTotpMessage] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { dict, setLang } = useLanguage();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setForm(data);
          if (data.totpEnabled !== undefined) setTotpEnabled(data.totpEnabled);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (totpSetup?.uri) {
      QRCode.toDataURL(totpSetup.uri, { width: 200, margin: 1 }).then(setQrDataUrl).catch(() => {});
    } else {
      Promise.resolve().then(() => setQrDataUrl(""));
    }
  }, [totpSetup?.uri]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? dict.settings.saveError);
        return;
      }

      setMessage("success");
      router.refresh();
    } catch {
      setMessage("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetup2FA() {
    setTotpMessage("");
    setTotpLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setTotpMessage(data.error);
      } else {
        setTotpSetup(data);
      }
    } catch {
      setTotpMessage(dict.common.error);
    } finally {
      setTotpLoading(false);
    }
  }

  async function handleVerify2FA(enable: boolean) {
    setTotpMessage("");
    setTotpLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode, enable }),
      });
      const data = await res.json();
      if (data.error) {
        setTotpMessage(data.error);
      } else {
        setTotpEnabled(enable);
        setTotpSetup(null);
        setTotpCode("");
        setTotpMessage(enable ? dict.settings.twoFactorEnabledMsg : dict.settings.twoFactorDisabledMsg);
      }
    } catch {
      setTotpMessage(dict.common.error);
    } finally {
      setTotpLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteMessage("");
    setDeleteLoading(true);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (data.error) {
        setDeleteMessage(data.error);
      } else {
        await signOut({ redirect: false });
        router.push("/");
      }
    } catch {
      setDeleteMessage(dict.common.error);
    } finally {
      setDeleteLoading(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm animate-pulse">
          <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4" />
          <div className="h-4 bg-gray-100 rounded-lg w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.settings.heading}</h1>
        <p className="text-gray-500 text-sm mt-1">{dict.settings.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Business info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-[#0d2818] flex items-center gap-2 pb-2 border-b border-gray-100">
            {dict.settings.businessSection}
          </h2>

          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.businessName}</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className={inputCls}
              placeholder={dict.settings.businessNamePlaceholder}
            />
            <p className="text-xs text-gray-400 mt-1.5">{dict.settings.businessNameHint}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.taxNumber}</label>
            <input
              type="text"
              value={form.taxNumber}
              onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
              className={inputCls + " font-mono tracking-wider"}
              placeholder={dict.settings.taxNumberPlaceholder}
              dir="ltr"
              maxLength={15}
            />
          </div>

        </div>

        {/* العنوان الوطني السعودي */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-[#0d2818] flex items-center gap-2 pb-2 border-b border-gray-100">
              {dict.settings.nationalAddress}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.street}</label>
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  className={inputCls}
                  placeholder={dict.settings.streetPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.buildingNumber}</label>
                <input
                  type="text"
                  value={form.buildingNumber}
                  onChange={(e) => setForm({ ...form, buildingNumber: e.target.value })}
                  className={inputCls + " font-mono"}
                  dir="ltr"
                  placeholder={dict.settings.buildingPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.neighborhood}</label>
                <input
                  type="text"
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  className={inputCls}
                  placeholder={dict.settings.neighborhoodPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.city}</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputCls}
                  placeholder={dict.settings.cityPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.postalCode}</label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className={inputCls + " font-mono"}
                  dir="ltr"
                  placeholder={dict.settings.postalPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.additionalNumber}</label>
                <input
                  type="text"
                  value={form.additionalNumber}
                  onChange={(e) => setForm({ ...form, additionalNumber: e.target.value })}
                  className={inputCls + " font-mono"}
                  dir="ltr"
                  placeholder={dict.settings.additionalPlaceholder}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">{dict.settings.addressHint}</p>
          </div>

        {/* Invoice settings */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-[#0d2818] flex items-center gap-2 pb-2 border-b border-gray-100">
            {dict.settings.invoicesSection}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.invoicePrefix}</label>
              <input
                type="text"
                value={form.invoicePrefix}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                className={inputCls + " font-mono"}
                dir="ltr"
                placeholder="INV-"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.taxRate}</label>
              <input
                type="number"
                value={form.defaultTaxRate}
                onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })}
                className={inputCls}
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-[#0d2818] flex items-center gap-2 pb-2 border-b border-gray-100">
            {dict.settings.languageSection}
          </h2>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.languageLabel}</label>
            <select
              value={form.language}
              onChange={(e) => {
                const l = e.target.value as "ar" | "en";
                setForm({ ...form, language: l });
                setLang(l);
              }}
              className={inputCls}
            >
              <option value="ar">{dict.settings.languageArabic}</option>
              <option value="en">{dict.settings.languageEnglish}</option>
            </select>
          </div>
        </div>

        {/* ZATCA settings */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-[#0d2818] flex items-center gap-2 pb-2 border-b border-gray-100">
            {dict.settings.zatcaSection}
          </h2>

          {/* Create EGS Unit — الخطوة الأولى */}
          <div className="bg-[#f8faf8] rounded-xl p-5 border border-[#1a5632]/10">
            <button
              type="button"
              onClick={() => setShowEgsForm(!showEgsForm)}
              className="flex items-center gap-2 text-[#0d2818] font-bold text-sm hover:text-[#2d8a4e] transition-all w-full text-right"
            >
              <span className={`transition-transform ${showEgsForm ? "rotate-90" : ""}`}>▶</span>
              {dict.settings.zatcaCreateEgs}
              {(form.avtaxClientId && form.deviceSerialNumber) ? " ✅" : ""}
            </button>
            <p className="text-xs text-gray-500 mt-1 mr-4">{dict.settings.zatcaCreateEgsHint}</p>

            {showEgsForm && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.zatcaCreateEgsEmail}</label>
                  <input
                    type="email"
                    value={egsForm.email}
                    onChange={(e) => setEgsForm({ ...egsForm, email: e.target.value })}
                    className={inputCls}
                    dir="ltr"
                    placeholder={dict.settings.zatcaCreateEgsEmailPlaceholder}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.zatcaCreateEgsPassword}</label>
                  <input
                    type="password"
                    value={egsForm.password}
                    onChange={(e) => setEgsForm({ ...egsForm, password: e.target.value })}
                    className={inputCls}
                    dir="ltr"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0d2818] mb-2">
                    {dict.settings.zatcaDeviceSerial} {egsForm.serialNumber ? "✅" : ""}
                  </label>
                  <input
                    type="text"
                    value={egsForm.serialNumber}
                    onChange={(e) => setEgsForm({ ...egsForm, serialNumber: e.target.value })}
                    className={inputCls + " font-mono"}
                    dir="ltr"
                    placeholder="1-Fatoora|2-1.0|3-001"
                  />
                  <p className="text-xs text-gray-400 mt-1">{dict.settings.zatcaEgsSerialHint}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.zatcaEgsOtp}</label>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3 text-xs text-amber-800 space-y-2">
                    <p className="font-bold">{dict.settings.zatcaEgsOtpStep1}</p>
                    <button
                      type="button"
                      onClick={() => window.open("https://fatoora.zatca.gov.sa", "_blank")}
                      className="inline-flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      {dict.settings.zatcaOpenPortal}
                    </button>
                    <p>{dict.settings.zatcaEgsOtpStep2}</p>
                    <p>{dict.settings.zatcaEgsOtpStep3}</p>
                  </div>
                  <input
                    type="text"
                    value={egsForm.otp}
                    onChange={(e) => setEgsForm({ ...egsForm, otp: e.target.value })}
                    className={inputCls + " font-mono"}
                    dir="ltr"
                    placeholder={dict.settings.zatcaEgsOtpPlaceholder}
                  />
                  <p className="text-xs text-gray-400 mt-1">{dict.settings.zatcaEgsOtpHint}</p>
                </div>

                <p className="text-xs text-gray-400">{dict.settings.zatcaCreateEgsAutoFill}</p>

                <button
                  type="button"
                  onClick={async () => {
                    setEgsCreating(true);
                    setEgsResult(null);
                    try {
                      const res = await fetch("/api/settings/zatca-create-egs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: egsForm.email,
                          password: egsForm.password,
                          organizationName: form.companyName,
                          vatNumber: form.taxNumber,
                          city: form.city,
                          serialNumber: egsForm.serialNumber || undefined,
                          otp: egsForm.otp || undefined,
                        }),
                      });
                      const data = await res.json();
                      if (data.error) {
                        setEgsResult({ success: false, message: data.error });
                      } else {
                        setForm({ ...form, avtaxClientId: data.clientId, avtaxClientSecret: data.clientSecret, deviceSerialNumber: data.deviceSerialNumber ?? "" });
                        setEgsResult({ success: true, message: dict.settings.zatcaCreateEgsSuccess });
                        setShowEgsForm(false);
                      }
                    } catch (err) {
                      const msg = err instanceof TypeError ? "تعذر الاتصال بخادم AvTax" : "حدث خطأ غير متوقع";
                      setEgsResult({ success: false, message: msg });
                    } finally {
                      setEgsCreating(false);
                    }
                  }}
                  disabled={egsCreating || !egsForm.email || !egsForm.password}
                  className="w-full bg-[#1a5632] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#2d8a4e] transition-all disabled:opacity-50"
                >
                  {egsCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      {dict.settings.zatcaCreating}
                    </span>
                  ) : dict.settings.zatcaCreateEgsBtn}
                </button>

                {egsResult && (
                  <div className={`rounded-xl px-4 py-2.5 text-center text-sm ${
                    egsResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}>
                    {egsResult.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Client ID — يُعرض بعد إنشاء EGS */}
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.zatcaClientId}</label>
            {form.avtaxClientId ? (
              <div className="relative">
                <input
                  type="password"
                  value={form.avtaxClientId}
                  readOnly
                  className={inputCls + " font-mono ltr text-left bg-gray-50 pl-10"}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement!.querySelector<HTMLInputElement>("input");
                    if (input) input.type = input.type === "password" ? "text" : "password";
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >👁</button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">{dict.settings.zatcaClientIdEmpty}</p>
            )}
          </div>

          {/* Client Secret — يُعرض بعد إنشاء EGS */}
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.zatcaClientSecret}</label>
            {form.avtaxClientSecret ? (
              <div className="relative">
                <input
                  type="password"
                  value={form.avtaxClientSecret}
                  readOnly
                  className={inputCls + " font-mono ltr text-left bg-gray-50 pl-10"}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement!.querySelector<HTMLInputElement>("input");
                    if (input) input.type = input.type === "password" ? "text" : "password";
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >👁</button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">{dict.settings.zatcaClientSecretEmpty}</p>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{dict.settings.zatcaClientSecretHint}</p>
          </div>

          {/* Device Serial Number — يُعرض بعد إنشاء EGS */}
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">
              {dict.settings.zatcaDeviceSerial} {form.deviceSerialNumber ? "✅" : ""}
            </label>
            {form.deviceSerialNumber ? (
              <input
                type="text"
                value={form.deviceSerialNumber}
                readOnly
                className={inputCls + " font-mono ltr text-left bg-gray-50"}
                dir="ltr"
              />
            ) : (
              <p className="text-sm text-gray-400 italic">{dict.settings.zatcaDeviceSerialEmpty}</p>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{dict.settings.zatcaDeviceSerialHint}</p>
          </div>

          {/* Environment + Compliance Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.zatcaEnv}</label>
              <select
                value={form.zatcaEnv}
                onChange={(e) => setForm({ ...form, zatcaEnv: e.target.value })}
                className={inputCls}
              >
                <option value="sandbox">{dict.settings.zatcaSandbox}</option>
                <option value="production">{dict.settings.zatcaProduction}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.zatcaComplianceStatus}</label>
              <div className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold ${
                form.complianceStatus === "compliant"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : form.complianceStatus === "non_compliant"
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}>
                {form.complianceStatus === "compliant" && dict.settings.zatcaCompliant}
                {form.complianceStatus === "non_compliant" && dict.settings.zatcaNonCompliant}
                {form.complianceStatus === "pending" && dict.settings.zatcaPending}
              </div>
            </div>
          </div>

          {form.zatcaEnv === "production" && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-xs text-amber-700">
              {dict.settings.zatcaWarning}
            </div>
          )}

          {/* Test connection */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                setTesting(true);
                setTestResult(null);
                try {
                  const res = await fetch("/api/settings/zatca-test", { method: "POST" });
                  const data = await res.json();
                  setTestResult(data);
                } catch {
                  setTestResult({ success: false, message: dict.settings.zatcaTestFail });
                } finally {
                  setTesting(false);
                }
              }}
              disabled={testing}
              className="bg-[#1a5632]/10 text-[#1a5632] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#1a5632]/20 transition-all disabled:opacity-50 border border-[#1a5632]/20"
            >
              {testing ? dict.settings.zatcaTesting : dict.settings.zatcaTestBtn}
            </button>
            {testResult && (
              <span className={`text-sm font-semibold ${testResult.success ? "text-emerald-600" : "text-red-500"}`}>
                {testResult.message}
              </span>
            )}
          </div>
        </div>
        {message === "success" && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3 text-center">
            <p className="text-emerald-700 font-semibold text-sm">{dict.settings.saved}</p>
          </div>
        )}
        {message === "error" && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3 text-center">
            <p className="text-red-600 text-sm">{dict.settings.saveError}</p>
          </div>
        )}
        {message && message !== "success" && message !== "error" && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3 text-center">
            <p className="text-red-600 text-sm">{message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#1a5632] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#2d8a4e] transition-all shadow-xl shadow-[#1a5632]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              {dict.settings.loading}
            </span>
          ) : dict.settings.submit}
        </button>
      </form>

      {/* 2FA Section */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="font-bold text-[#0d2818] flex items-center gap-2 pb-2 border-b border-gray-100">
          {dict.settings.twoFactorSection}
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0d2818]">
              {totpEnabled ? dict.settings.twoFactorEnabled : dict.settings.twoFactorDisabled}
            </p>
            <p className="text-xs text-gray-400">{dict.settings.twoFactorHint}</p>
          </div>
          {!totpSetup && (
            <button
              type="button"
              onClick={handleSetup2FA}
              disabled={totpLoading}
              className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
                totpEnabled
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                  : "bg-[#1a5632] text-white hover:bg-[#2d8a4e] shadow-sm"
              }`}
            >
              {totpLoading ? "..." : totpEnabled ? dict.settings.twoFactorDisable : dict.settings.twoFactorEnable}
            </button>
          )}
        </div>

        {totpSetup && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.twoFactorQrInstructions}</p>
              <div className="flex justify-center mb-3">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="TOTP QR"
                    className="rounded-lg border border-gray-200"
                  />
                )}
              </div>
              <details className="text-xs text-gray-400 cursor-pointer">
                <summary className="font-semibold">{dict.settings.twoFactorManualKey}</summary>
                <p className="mt-1 font-mono text-[#1a5632] text-left dir-ltr select-all bg-white rounded p-2 border">{totpSetup.secret}</p>
              </details>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.twoFactorCodeLabel}</label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
              />
            </div>

            {totpMessage && (
              <div className={`rounded-xl px-4 py-2.5 text-center text-sm ${
                totpMessage.includes("خطأ") || totpMessage.includes("غير صحيح")
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-700"
              }`}>
                {totpMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleVerify2FA(!totpEnabled)}
                disabled={totpLoading || totpCode.length !== 6}
                className="flex-1 bg-[#1a5632] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#2d8a4e] transition-all disabled:opacity-50"
              >
                {totpLoading ? "..." : totpEnabled ? dict.settings.twoFactorDisableBtn : dict.settings.twoFactorEnableBtn}
              </button>
              <button
                type="button"
                onClick={() => { setTotpSetup(null); setTotpCode(""); setTotpMessage(""); }}
                className="px-5 py-2.5 rounded-xl font-bold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
              >
                {dict.common.cancel}
              </button>
            </div>
          </div>
        )}

        {totpMessage && !totpSetup && (
          <div className={`rounded-xl px-4 py-2.5 text-center text-sm ${
            totpMessage.includes("خطأ") ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}>
            {totpMessage}
          </div>
        )}
      </div>

      {/* Delete Account Section */}
      <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="font-bold text-red-600 flex items-center gap-2 pb-2 border-b border-red-100">
          {dict.settings.deleteSection}
        </h2>

        {!deleteConfirm ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {dict.settings.deleteWarning}
            </p>
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-sm"
            >
              {dict.settings.deleteBtn}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              {dict.settings.deleteConfirmWarning}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.settings.deletePasswordLabel}</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
              />
            </div>

            {deleteMessage && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-center text-sm text-red-600">
                {deleteMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {deleteLoading ? "..." : dict.settings.deleteConfirmBtn}
              </button>
              <button
                type="button"
                onClick={() => { setDeleteConfirm(false); setDeletePassword(""); setDeleteMessage(""); }}
                className="px-5 py-2.5 rounded-xl font-bold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
              >
                {dict.common.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
