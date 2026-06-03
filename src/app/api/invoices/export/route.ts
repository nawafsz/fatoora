import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiAuthGuard, csrfGuard } from "@/lib/security";
import { db } from "@/lib/db";
import { decryptString } from "@/lib/encryption";
import ExcelJS from "exceljs";

const dict = {
  invoices: {
    status: {
      DRAFT: { ar: "مسودة", en: "Draft" },
      SUBMITTED: { ar: "مرسلة", en: "Submitted" },
      COMPLETED: { ar: "مكتمل", en: "Completed" },
      CANCELLED: { ar: "ملغية", en: "Cancelled" },
      REPORTED: { ar: "مبلغ عنها", en: "Reported" },
    },
    type: {
      CASH: { ar: "نقدي", en: "Cash" },
      CREDIT: { ar: "آجل", en: "Credit" },
    },
    table: {
      index: { ar: "#", en: "#" },
      invoiceNumber: { ar: "رقم الفاتورة", en: "Invoice No." },
      clientName: { ar: "العميل", en: "Client" },
      date: { ar: "التاريخ", en: "Date" },
      dueDate: { ar: "تاريخ الاستحقاق", en: "Due Date" },
      type: { ar: "نوع الفاتورة", en: "Type" },
      subtotal: { ar: "المجموع الفرعي", en: "Subtotal" },
      discount: { ar: "الخصم", en: "Discount" },
      taxAmount: { ar: "ضريبة", en: "Tax" },
      total: { ar: "الإجمالي", en: "Total" },
      status: { ar: "الحالة", en: "Status" },
      notes: { ar: "ملاحظات", en: "Notes" },
    },
    export: {
      creator: { ar: "فاتورة", en: "Fatoora" },
      sheetName: { ar: "الفواتير", en: "Invoices" },
      grandTotal: { ar: "الإجمالي", en: "Grand Total" },
    },
  },
};

export async function GET(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const settings = await db.settings.findUnique({
    where: { userId: session!.user!.id },
    select: { language: true },
  });
  const lang = (settings?.language ?? "ar") as "ar" | "en";

  const raw = await db.invoice.findMany({
    where: { userId: session!.user!.id },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const invoices = raw.map((inv) => {
    const clientName = inv.client.name.includes(":") ? decryptString(inv.client.name) : inv.client.name;
    return { ...inv, client: { ...inv.client, name: clientName } };
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = dict.invoices.export.creator[lang];
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(dict.invoices.export.sheetName[lang], {
    views: [{ rightToLeft: lang === "ar" }],
  });

  sheet.columns = [
    { header: dict.invoices.table.index[lang], key: "index", width: 6 },
    { header: dict.invoices.table.invoiceNumber[lang], key: "invoiceNumber", width: 18 },
    { header: dict.invoices.table.clientName[lang], key: "clientName", width: 25 },
    { header: dict.invoices.table.date[lang], key: "date", width: 15 },
    { header: dict.invoices.table.dueDate[lang], key: "dueDate", width: 15 },
    { header: dict.invoices.table.type[lang], key: "type", width: 12 },
    { header: dict.invoices.table.subtotal[lang], key: "subtotal", width: 15 },
    { header: dict.invoices.table.discount[lang], key: "discount", width: 12 },
    { header: dict.invoices.table.taxAmount[lang], key: "taxAmount", width: 12 },
    { header: dict.invoices.table.total[lang], key: "total", width: 15 },
    { header: dict.invoices.table.status[lang], key: "status", width: 12 },
    { header: dict.invoices.table.notes[lang], key: "notes", width: 25 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { name: "Noto Sans Arabic", bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A5632" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 30;

  const locale = lang === "en" ? "en-US" : "ar-SA";

  invoices.forEach((inv, i) => {
    const row = sheet.addRow({
      index: i + 1,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      date: new Date(inv.date).toLocaleDateString(locale),
      dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString(locale) : "—",
      type: dict.invoices.type[inv.type as keyof typeof dict.invoices.type]?.[lang] ?? inv.type,
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount),
      taxAmount: Number(inv.taxAmount),
      total: Number(inv.total),
      status: dict.invoices.status[inv.status as keyof typeof dict.invoices.status]?.[lang] ?? inv.status,
      notes: inv.notes ?? "",
    });

    row.font = { name: "Noto Sans Arabic", size: 11 };
    row.alignment = { horizontal: "center", vertical: "middle" };
    row.height = 24;

    if (i % 2 === 1) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FAF4" } };
    }
  });

  const totalRow = sheet.addRow({
    index: "",
    invoiceNumber: "",
    clientName: dict.invoices.export.grandTotal[lang],
    date: "",
    dueDate: "",
    type: "",
    subtotal: invoices.reduce((s, inv) => s + Number(inv.subtotal), 0),
    discount: invoices.reduce((s, inv) => s + Number(inv.discount), 0),
    taxAmount: invoices.reduce((s, inv) => s + Number(inv.taxAmount), 0),
    total: invoices.reduce((s, inv) => s + Number(inv.total), 0),
    status: "",
    notes: "",
  });
  totalRow.font = { name: "Noto Sans Arabic", bold: true, size: 12, color: { argb: "FF0D2818" } };
  totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8C46A" } };
  totalRow.alignment = { horizontal: "center", vertical: "middle" };
  totalRow.height = 28;

  const buf = await workbook.xlsx.writeBuffer();

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
