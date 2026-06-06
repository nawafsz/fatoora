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

export interface ZatcaLineItem {
  lineItemName: string;
  lineItemPrice: number;
  lineItemQty: number;
  vatRateOnLineItem: number;
}

export interface ZatcaInvoiceRequest {
  documentType: string;
  invoiceIndicator: string;
  currency: string;
  supplier: {
    supplierName: string;
    supplierVatId: string;
    supplierAddress?: {
      streetName?: string;
      buildingNumber?: string;
      cityName?: string;
      postalZone?: string;
      country?: string;
      neighborhood?: string;
      citySubdivisionName?: string;
      plotIdentification?: string;
      additionalStreetName?: string;
    };
  };
  buyer: {
    buyerName: string;
    buyerVatId: string;
  };
  documentLineItems: ZatcaLineItem[];
}

export interface ZatcaResponse {
  uuid: string;
  status: string;
  qrCode: string;
  signedXml?: string;
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
