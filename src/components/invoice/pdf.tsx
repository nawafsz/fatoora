import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { ar as arDict, en as enDict } from "@/lib/i18n/dictionaries";

Font.register({
  family: "Noto Sans Arabic",
  fonts: [
    { src: "/fonts/NotoSansArabic-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSansArabic-Bold.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    direction: "rtl",
    padding: 40,
    fontFamily: "Noto Sans Arabic",
    fontSize: 10,
    color: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "1 solid #e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a5632",
  },
  invoiceNo: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 4,
  },
  value: {
    fontSize: 10,
    fontWeight: 700,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #e5e7eb",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: "#6b7280",
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #f0f0f0",
    paddingVertical: 6,
  },
  tableCell: {
    fontSize: 9,
  },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1, textAlign: "center" },
  colTotal: { flex: 1, textAlign: "left" },
  totals: {
    marginTop: 20,
    alignItems: "flex-start",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginBottom: 4,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    borderTop: "1 solid #1a5632",
    paddingTop: 8,
    marginTop: 8,
    fontWeight: 700,
    fontSize: 12,
    color: "#1a5632",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTop: "1 solid #e5e7eb",
    paddingTop: 10,
  },
});

interface InvoicePdfProps {
  invoiceNumber: string;
  date: string;
  sellerName: string;
  sellerTaxNumber: string;
  clientName: string;
  clientTaxNumber?: string;
  clientPhone?: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  lang?: string;
}

export function InvoicePdf({
  invoiceNumber,
  date,
  sellerName,
  sellerTaxNumber,
  clientName,
  clientTaxNumber,
  clientPhone,
  items,
  subtotal,
  taxAmount,
  total,
  lang = "ar",
}: InvoicePdfProps) {
  const dict = lang === "en" ? enDict : arDict;
  const p = dict.invoices.pdf;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{p.taxInvoice}</Text>
            <Text style={styles.invoiceNo}>{invoiceNumber}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>{p.date}</Text>
            <Text style={styles.value}>{date}</Text>
          </View>
        </View>

        <View style={{ ...styles.section, flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={styles.label}>{p.seller}</Text>
            <Text style={styles.value}>{sellerName}</Text>
            <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>
              {p.taxNumber} {sellerTaxNumber}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>{p.client}</Text>
            <Text style={styles.value}>{clientName}</Text>
            {clientTaxNumber && (
              <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>
                {p.taxNumber} {clientTaxNumber}
              </Text>
            )}
            {clientPhone && (
              <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>
                {p.phone} {clientPhone}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colName]}>{p.product}</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>{p.qty}</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>{p.unitPrice}</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>{p.total}</Text>
          </View>

          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colName]}>{item.name}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {item.unitPrice.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                {(item.quantity * item.unitPrice).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>{p.subtotal}</Text>
            <Text>{subtotal.toFixed(2)} ر.س</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{p.tax}</Text>
            <Text>{taxAmount.toFixed(2)} ر.س</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>{p.grandTotal}</Text>
            <Text>{total.toFixed(2)} ر.س</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {p.footer} | {invoiceNumber}
        </Text>
      </Page>
    </Document>
  );
}
