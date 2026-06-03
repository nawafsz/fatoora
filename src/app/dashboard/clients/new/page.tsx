"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function NewClientPage() {
  const router = useRouter();
  const { dict, lang } = useLanguage();
  const locale = lang === "en" ? "en-US" : "ar-SA";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, taxNumber, address }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? dict.common.error);
        return;
      }

      router.push("/dashboard/clients");
      router.refresh();
    } catch {
      setError(dict.common.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/clients" className="text-sm text-muted hover:text-foreground">
          {dict.clients.backToList}
        </Link>
        <h1 className="text-2xl font-bold text-primary-dark mt-2">{dict.clients.new.heading}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">{dict.clients.new.name}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">{dict.clients.new.phone}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">{dict.clients.new.email}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">{dict.clients.new.taxNumber}</label>
          <input
            type="text"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">{dict.clients.new.address}</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={2}
          />
        </div>

        {error && <p className="text-danger text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2.5 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          {loading ? dict.clients.new.loading : dict.clients.new.submit}
        </button>
      </form>
    </div>
  );
}
