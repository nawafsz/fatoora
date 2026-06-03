export function cn(...inputs: (string | false | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatSar(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateInvoiceNumber(prefix: string, next: number): string {
  const padded = String(next).padStart(5, "0");
  return `${prefix}${padded}`;
}

export function getPlanLimits(plan: string): { invoicesPerMonth: number } {
  const limits: Record<string, { invoicesPerMonth: number }> = {
    free: { invoicesPerMonth: 5 },
    starter: { invoicesPerMonth: 100 },
    pro: { invoicesPerMonth: 1000 },
    premium: { invoicesPerMonth: Infinity },
  };
  return limits[plan] ?? limits.free;
}

export function checkInvoiceLimit(currentCount: number, plan: string): { allowed: boolean; limit: number } {
  const { invoicesPerMonth } = getPlanLimits(plan);
  return { allowed: currentCount < invoicesPerMonth, limit: invoicesPerMonth };
}

export { checkRateLimit } from "./rate-limit";
