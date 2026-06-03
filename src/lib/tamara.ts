const TAMARA_API_TOKEN = process.env.TAMARA_API_TOKEN;
const TAMARA_ENV = process.env.TAMARA_ENVIRONMENT === "production" ? "production" : "sandbox";
const BASE_URL =
  TAMARA_ENV === "production"
    ? "https://api.tamara.co"
    : "https://api-sandbox.tamara.co";

interface TamaraConsumer {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
}

interface TamaraOrderItem {
  name: string;
  type: string;
  reference_id: string;
  quantity: number;
  unit_price: { amount: number; currency: string };
  total_price: { amount: number; currency: string };
}

interface TamaraMerchantUrls {
  success: string;
  failure: string;
  cancel: string;
  notification: string;
}

interface CreateCheckoutParams {
  orderReferenceId: string;
  totalAmount: number;
  currency?: string;
  consumer: TamaraConsumer;
  items: TamaraOrderItem[];
  merchantUrls: TamaraMerchantUrls;
  description?: string;
}

interface TamaraCheckoutResponse {
  order_id: string;
  checkout_id: string;
  status: string;
  checkout_url: string;
}

interface TamaraOrderResponse {
  order_id: string;
  status: string;
  payment_type?: string;
  order_reference_id?: string;
}

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${TAMARA_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function createCheckoutSession(
  params: CreateCheckoutParams,
): Promise<TamaraCheckoutResponse> {
  const body = {
    order_reference_id: params.orderReferenceId,
    order_number: params.orderReferenceId,
    total_amount: {
      amount: params.totalAmount,
      currency: params.currency ?? "SAR",
    },
    description: params.description ?? "",
    country_code: "SA",
    payment_type: "PAY_BY_INSTALMENTS",
    consumer: params.consumer,
    items: params.items,
    merchant_url: params.merchantUrls,
    // Tamara requires instalments for subscriptions
    instalments: { suggested: [3, 6] },
  };

  const res = await fetch(`${BASE_URL}/checkout`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tamara API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function authoriseOrder(
  orderId: string,
): Promise<TamaraOrderResponse> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/authorise`, {
    method: "POST",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tamara authorise error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getOrderDetails(
  orderId: string,
): Promise<TamaraOrderResponse> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tamara get order error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function cancelOrder(
  orderId: string,
): Promise<TamaraOrderResponse> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
    method: "POST",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tamara cancel error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function refundOrder(
  orderId: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/merchants/orders/${orderId}/refund`, {
    method: "POST",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tamara refund error ${res.status}: ${text}`);
  }

  return res.json();
}

export function isConfigured(): boolean {
  return !!TAMARA_API_TOKEN;
}
