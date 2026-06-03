import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdf } from "@/components/invoice/pdf";

export async function renderInvoicePdf(props: {
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
}): Promise<Buffer> {
  const pdfDoc = (
    <InvoicePdf
      invoiceNumber={props.invoiceNumber}
      date={props.date}
      sellerName={props.sellerName}
      sellerTaxNumber={props.sellerTaxNumber}
      clientName={props.clientName}
      clientTaxNumber={props.clientTaxNumber}
      clientPhone={props.clientPhone}
      items={props.items}
      subtotal={props.subtotal}
      taxAmount={props.taxAmount}
      total={props.total}
    />
  );

  const stream = await renderToStream(pdfDoc);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
