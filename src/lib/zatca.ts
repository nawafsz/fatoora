import type { ZatcaInvoiceRequest, ZatcaResponse } from "@/types";

const AVTAX_API_URL = process.env.AVTAX_API_URL ?? "";
const AVTAX_FALLBACK_KEY = process.env.AVTAX_API_KEY ?? "";
const FETCH_TIMEOUT = 15_000;

// Cache tokens in-memory keyed by userId
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function ensureBaseConfigured() {
  if (!AVTAX_API_URL) {
    throw new Error("رابط خدمة ZATCA غير مضبوط في الإعدادات");
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

/** تسجيل الدخول كـ EGS Unit والحصول على Access Token */
export async function loginAsEgsUnit(clientId: string, clientSecret: string): Promise<string> {
  ensureBaseConfigured();
  const res = await fetchWithTimeout(`${AVTAX_API_URL}/api/UserAuthentication/LoginAsEgsUnit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`فشل تسجيل الدخول: ${res.status} ${txt}`);
  }

  const data = await res.json();
  return data.access_token;
}

/** الحصول على توكن صالح (من الكاش أو تسجيل دخول جديد) */
async function getValidToken(userId: string, clientId: string, clientSecret: string): Promise<string> {
  const cached = tokenCache.get(userId);
  if (cached && Date.now() < cached.expiresAt - 60_000) {
    return cached.token;
  }

  const token = await loginAsEgsUnit(clientId, clientSecret);
  // التوكن ينتهي بعد 24 ساعة (حسب الـ JWT expiry)
  tokenCache.set(userId, { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 });
  return token;
}

/** مسح التوكن من الكاش (مثلاً عند تغيير الإعدادات) */
export function clearTokenCache(userId: string) {
  tokenCache.delete(userId);
}

function getFallbackHeaders(): Record<string, string> {
  if (AVTAX_FALLBACK_KEY) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AVTAX_FALLBACK_KEY}`,
    };
  }
  throw new Error("ZATCA غير مهيأ — أضف Client ID و Client Secret في إعدادات ZATCA");
}

async function getAuthHeaders(userId?: string, clientId?: string, clientSecret?: string): Promise<Record<string, string>> {
  if (userId && clientId && clientSecret) {
    const token = await getValidToken(userId, clientId, clientSecret);
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }
  return getFallbackHeaders();
}

export async function submitInvoice(
  invoice: ZatcaInvoiceRequest,
  opts?: { userId?: string; clientId?: string; clientSecret?: string }
): Promise<ZatcaResponse> {
  const headers = await getAuthHeaders(opts?.userId, opts?.clientId, opts?.clientSecret);
  const res = await fetchWithTimeout(`${AVTAX_API_URL}/api/Invoice/SubmitInvoice`, {
    method: "POST",
    headers,
    body: JSON.stringify(invoice),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`فشل إرسال الفاتورة إلى ZATCA: ${res.status} ${txt}`);
  }

  return res.json();
}

export async function cancelInvoice(
  uuid: string,
  opts?: { userId?: string; clientId?: string; clientSecret?: string }
): Promise<void> {
  const headers = await getAuthHeaders(opts?.userId, opts?.clientId, opts?.clientSecret);
  const res = await fetchWithTimeout(`${AVTAX_API_URL}/api/Invoice/SubmitInvoice/${uuid}/cancel`, {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    await res.text();
    throw new Error("فشل إلغاء الفاتورة في ZATCA");
  }
}

export async function getInvoiceStatus(
  uuid: string,
  opts?: { userId?: string; clientId?: string; clientSecret?: string }
): Promise<string> {
  const headers = await getAuthHeaders(opts?.userId, opts?.clientId, opts?.clientSecret);
  const res = await fetchWithTimeout(`${AVTAX_API_URL}/api/Invoice/GetInvoiceStatus/${uuid}/status`, {
    headers,
  });

  if (!res.ok) return "unknown";
  const data = await res.json();
  return data.invoiceStatus;
}

/** اختبار الاتصال الكامل: تسجيل دخول + إرسال فاتورة تجريبية */
export async function testConnection(
  opts?: { userId?: string; clientId?: string; clientSecret?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const headers = await getAuthHeaders(opts?.userId, opts?.clientId, opts?.clientSecret);
    const res = await fetchWithTimeout(`${AVTAX_API_URL}/api/ZatcaUIData/InvoiceTypes`, {
      headers,
    });

    if (res.ok) {
      return { success: true, message: "✅ تم الاتصال بنجاح" };
    }
    return { success: false, message: `❌ فشل الاتصال: ${res.status}` };
  } catch (err) {
    return { success: false, message: `❌ ${err instanceof Error ? err.message : "تعذر الاتصال"}` };
  }
}

/** تسجيل دخول شريك AvTax */
export async function loginAsPartner(email: string, password: string): Promise<string> {
  ensureBaseConfigured();
  const res = await fetchWithTimeout(`${AVTAX_API_URL}/api/UserAuthentication/Login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`فشل تسجيل دخول الشريك: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data.access_token;
}

/** إنشاء EGS Unit جديد في AvTax */
export async function createEgsUnit(
  partnerToken: string,
  data: {
    organizationName?: string;
    vatNumber?: string;
    city?: string;
    street?: string;
    buildingNumber?: string;
    postalCode?: string;
    additionalID?: string;
    serialNumber?: string;
    otp?: string;
    isProduction?: boolean;
  }
): Promise<{ clientId: string; clientSecret: string; egsUnitId: string; deviceSerialNumber?: string }> {
  ensureBaseConfigured();
  const body: Record<string, unknown> = {
    organizationName: data.organizationName ?? "Default Organization Name",
    vatNumber: data.vatNumber ?? "300075588700003",
    address: {
      streetName: data.street ?? "شارع الأمير محمد بن عبد العزيز",
      cityName: data.city ?? "الرياض",
      buildingNumber: data.buildingNumber ?? "1234",
      postalZone: data.postalCode ?? "11564",
      country: "SA",
    },
    additionalID: data.additionalID,
    isProduction: data.isProduction ?? false,
  };
  if (data.serialNumber) {
    body.serialNumber = data.serialNumber;
  }
  if (data.otp) {
    body.otp = data.otp;
  }

  const res = await fetchWithTimeout(`${AVTAX_API_URL}/api/EgsUnits/CreateNewEgsUnit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${partnerToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`فشل إنشاء EGS Unit: ${res.status} ${txt}`);
  }

  const responseData = await res.json();
  return {
    clientId: responseData.clientId ?? responseData.client_id ?? "",
    clientSecret: responseData.clientSecret ?? responseData.client_secret ?? "",
    egsUnitId: responseData.egsUnitId ?? responseData.egs_unit_id ?? responseData.id ?? "",
    deviceSerialNumber: responseData.deviceSerialNumber ?? responseData.device_serial_number ?? responseData.deviceSerialNum ?? data.serialNumber,
  };
}
