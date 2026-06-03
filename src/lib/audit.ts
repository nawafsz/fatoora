import { db } from "@/lib/db";

type AuditAction =
  | "create" | "update" | "delete" | "read" | "download"
  | "login" | "login_failed" | "logout"
  | "submit_zatca" | "cancel_zatca"
  | "register" | "forgot_password" | "reset_password"
  | "delete_account"
  | "enable_2fa" | "disable_2fa"
  | "webhook_received" | "subscription_updated" | "subscription_cancelled" | "cancel_subscription";

type AuditResource =
  | "invoice" | "client" | "user" | "settings"
  | "subscription" | "whatsapp" | "auth" | "webhook";

export async function auditLog(params: {
  userId?: string | null;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ip?: string | null;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId ?? null,
        details: params.details ? JSON.parse(JSON.stringify(params.details)) : null,
        ip: params.ip ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
