export type Plan = "free" | "starter" | "pro" | "premium";

export type InvoiceType = "CASH" | "CREDIT";

export type InvoiceStatus = "DRAFT" | "SUBMITTED" | "COMPLETED" | "CANCELLED" | "REPORTED";

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  taxExclusivePrice: number;
  taxAmount: number;
  total: number;
}

export interface ZatcaInvoiceRequest {
  invoiceNumber: string;
  issueDate: string;
  invoiceType: InvoiceType;
  supplier: {
    name: string;
    taxNumber: string;
  };
  customer: {
    name: string;
    taxNumber?: string;
  };
  items: InvoiceItem[];
  total: number;
  taxAmount: number;
  totalWithTax: number;
}

export interface ZatcaResponse {
  uuid: string;
  status: string;
  qrCode: string;
  signedXml: string;
}

declare module "next-auth" {
  interface User {
    phone?: string;
    plan?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      phone?: string;
      plan?: string;
    };
  }
}
