import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { decryptString } from "@/lib/encryption";
import { ClientNameCell } from "@/components/clients/client-name-cell";
import { getTranslations } from "@/lib/i18n";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const settings = await db.settings.findUnique({ where: { userId: session.user.id }, select: { language: true } });
  const dict = await getTranslations(settings?.language ?? "ar");
  const locale = settings?.language === "en" ? "en-US" : "ar-SA";

  const raw = await db.client.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  function maybeDecryptStr(val: string): string {
    if (val.includes(":")) {
      try { return decryptString(val); } catch { return val; }
    }
    return val;
  }

  function maybeDecryptN(val: string | null): string | null {
    if (typeof val === "string" && val.includes(":")) {
      try { return decryptString(val); } catch { return val; }
    }
    return val;
  }

  const clients = raw.map((c) => ({
    ...c,
    name: maybeDecryptStr(c.name),
    phone: maybeDecryptN(c.phone),
    email: maybeDecryptN(c.email),
    address: maybeDecryptN(c.address),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.clients.heading}</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} {dict.clients.subtitle}</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-2 bg-[#1a5632] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 hover:-translate-y-0.5"
        >
          <span>+</span> {dict.clients.newClient}
        </Link>
      </div>

      {/* Clients table */}
      {clients.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#1a5632]/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            👥
          </div>
          <p className="text-lg font-bold text-[#0d2818]">{dict.clients.emptyTitle}</p>
          <p className="text-gray-400 text-sm mt-2 mb-6">{dict.clients.emptyDesc}</p>
          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center gap-2 bg-[#1a5632] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20"
          >
            {dict.clients.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-right">
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.clients.table.name}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.clients.table.phone}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.clients.table.email}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.clients.table.taxNumber}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.clients.table.addedDate}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <ClientNameCell client={c} />
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500" dir="ltr">{c.phone || "—"}</td>
                  <td className="px-5 py-4 text-sm text-gray-500" dir="ltr">{c.email || "—"}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 font-mono" dir="ltr">{c.taxNumber || "—"}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString(locale)}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/clients/${c.id}/edit`}
                      className="text-xs text-gray-400 hover:text-[#1a5632] transition-colors font-semibold"
                    >
                      {dict.common.edit}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
