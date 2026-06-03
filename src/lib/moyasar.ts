const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET_KEY;
const MOYASAR_BASE = "https://api.moyasar.com/v1";

interface MoyasarResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  invoice_url?: string;
  metadata?: Record<string, unknown>;
  source?: {
    type: string;
    company?: string;
    token?: string;
  };
  created_at?: string;
  updated_at?: string;
}

function basicAuth(): string {
  return "Basic " + Buffer.from(MOYASAR_SECRET_KEY + ":").toString("base64");
}

async function moyasarFetch(
  path: string,
  options: RequestInit = {},
): Promise<MoyasarResponse> {
  const res = await fetch(`${MOYASAR_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Moyasar API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function createInvoice(params: {
  amount: number;
  currency?: string;
  description: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string; status: string; invoiceUrl: string }> {
  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: params.currency ?? "SAR",
    description: params.description,
    callback_url: params.callbackUrl,
  };
  if (params.metadata) body.metadata = params.metadata;

  const result = await moyasarFetch("/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return {
    id: result.id,
    status: result.status,
    invoiceUrl: result.invoice_url!,
  };
}

export async function createPayment(params: {
  amount: number;
  currency?: string;
  description: string;
  sourceToken: string;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string; status: string }> {
  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: params.currency ?? "SAR",
    description: params.description,
    source: { type: "token", token: params.sourceToken },
  };
  if (params.metadata) body.metadata = params.metadata;

  const result = await moyasarFetch("/payments", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { id: result.id, status: result.status };
}

export async function getPayment(
  paymentId: string,
): Promise<MoyasarResponse> {
  return moyasarFetch(`/payments/${paymentId}`);
}

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  starter: { amount: 4900, name: "فاتورة - باقة البداية" },
  pro: { amount: 9900, name: "فاتورة - باقة المحترف" },
  premium: { amount: 19900, name: "فاتورة - باقة الممتاز" },
};

export function getPlanPrice(plan: string): { amount: number; name: string } | null {
  return PLAN_PRICES[plan] ?? null;
}

export async function refundPayment(
  paymentId: string,
): Promise<{ id: string; status: string }> {
  const result = await moyasarFetch(`/payments/${paymentId}/refund`, {
    method: "POST",
  });
  return { id: result.id, status: result.status };
}

export function isConfigured(): boolean {
  return !!MOYASAR_SECRET_KEY;
}
