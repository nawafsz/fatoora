import type { ZatcaInvoiceRequest, ZatcaResponse } from "@/types";

const AVTAX_API_URL = process.env.AVTAX_API_URL ?? "";
const AVTAX_API_KEY = process.env.AVTAX_API_KEY ?? "";
const FETCH_TIMEOUT = 15_000;

function ensureZatcaConfigured() {
  if (!AVTAX_API_KEY || !AVTAX_API_URL) {
    throw new Error("ZATCA غير مهيأ — تأكد من ضبط AVTAX_API_KEY و AVTAX_API_URL");
  }
}

async function fetchWithTimeout(url: string, opts: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = FETCH_TIMEOUT, ...init } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function submitInvoice(
  invoice: ZatcaInvoiceRequest
): Promise<ZatcaResponse> {
  ensureZatcaConfigured();
  const res = await fetchWithTimeout(`${AVTAX_API_URL}/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AVTAX_API_KEY}`,
    },
    body: JSON.stringify(invoice),
  });

  if (!res.ok) {
    await res.text();
    throw new Error("ZATCA submission failed");
  }

  return res.json();
}

export async function cancelInvoice(uuid: string): Promise<void> {
  ensureZatcaConfigured();
  const res = await fetchWithTimeout(`${AVTAX_API_URL}/invoices/${uuid}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AVTAX_API_KEY}`,
    },
  });

  if (!res.ok) {
    await res.text();
    throw new Error("ZATCA cancellation failed");
  }
}

export async function getInvoiceStatus(uuid: string): Promise<string> {
  ensureZatcaConfigured();
  const res = await fetchWithTimeout(`${AVTAX_API_URL}/invoices/${uuid}/status`, {
    headers: {
      Authorization: `Bearer ${AVTAX_API_KEY}`,
    },
  });

  if (!res.ok) return "unknown";
  const data = await res.json();
  return data.status;
}
