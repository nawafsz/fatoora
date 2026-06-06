import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { decryptSensitive } from "@/lib/encryption";
import { PrintHandler } from "./print-handler";

export default async function BoqPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;

  const [settings, project] = await Promise.all([
    db.settings.findUnique({ where: { userId: session.user.id }, select: { language: true } }),
    db.project.findFirst({
      where: { id, userId: session.user.id },
      include: {
        client: { select: { id: true, name: true, taxNumber: true } },
        boqItems: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  if (!project || project.boqItems.length === 0) notFound();

  const lang = settings?.language ?? "ar";
  const dict = await getTranslations(lang);
  const locale = lang === "en" ? "en-US" : "ar-SA";

  const clientFields = ["name"] as const;
  const client = project.client
    ? decryptSensitive(project.client as Record<string, unknown>, clientFields) as typeof project.client
    : null;

  const grandTotal = project.boqItems.reduce((s, i) => s + Number(i.totalPrice), 0);

  return (
    <div className="max-w-5xl mx-auto">
      <PrintHandler projectId={id} backLabel={dict.projects.backToList} printLabel={dict.invoices.actions.printInvoice} />

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden print-area">
        <div className="print-header bg-gradient-to-l from-[#0d2818] to-[#1a5632] px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-black text-lg">
              {dict.brand.logo}
            </div>
            <div>
              <p className="text-white font-black text-lg">{dict.projects.detail.boq}</p>
              <p className="text-green-200 text-xs">{dict.brand.company}</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-white font-bold">{project.code || project.name}</p>
            <p className="text-green-200 text-xs">{new Date().toLocaleDateString(locale)}</p>
          </div>
        </div>

        <div className="p-8">
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">{dict.projects.detail.clientInfo}</p>
            <p className="text-lg font-black text-[#0d2818]">{client?.name || "—"}</p>
            {client?.taxNumber && <p className="text-sm text-gray-500 mt-1">الرقم الضريبي: {client.taxNumber}</p>}
            <p className="text-sm text-gray-500 mt-1">{dict.projects.detail.contractValue}: {Number(project.contractValue).toLocaleString(locale)} ر.س</p>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 text-right text-xs font-bold text-gray-400">#</th>
                <th className="py-3 text-right text-xs font-bold text-gray-400">{dict.projects.boq.code}</th>
                <th className="py-3 text-right text-xs font-bold text-gray-400">{dict.projects.boq.description}</th>
                <th className="py-3 text-right text-xs font-bold text-gray-400">{dict.projects.boq.unit}</th>
                <th className="py-3 text-right text-xs font-bold text-gray-400">{dict.projects.boq.quantity}</th>
                <th className="py-3 text-right text-xs font-bold text-gray-400">{dict.projects.boq.unitPrice}</th>
                <th className="py-3 text-right text-xs font-bold text-gray-400">{dict.projects.boq.totalPrice}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {project.boqItems.map((item, i) => (
                <tr key={item.id}>
                  <td className="py-3 text-sm text-gray-400">{i + 1}</td>
                  <td className="py-3 text-sm font-mono text-gray-400">{item.code || "—"}</td>
                  <td className="py-3 text-sm font-semibold text-[#0d2818]">{item.description}</td>
                  <td className="py-3 text-sm text-gray-500">{item.unit}</td>
                  <td className="py-3 text-sm text-gray-600" dir="ltr">{Number(item.quantity).toLocaleString(locale)}</td>
                  <td className="py-3 text-sm text-gray-600">{Number(item.unitPrice).toLocaleString(locale)} ر.س</td>
                  <td className="py-3 text-sm font-bold text-[#0d2818]">{Number(item.totalPrice).toLocaleString(locale)} ر.س</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={6} className="py-4 text-sm font-bold text-gray-500 text-left">
                  {dict.projects.boq.grandTotal}
                </td>
                <td className="py-4 text-sm font-black text-[#1a5632]">{grandTotal.toLocaleString(locale)} ر.س</td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-8 text-center text-xs text-gray-400">
            <p>{dict.brand.company}</p>
            <p>{dict.brand.copyright}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
