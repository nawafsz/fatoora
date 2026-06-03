// TODO: i18n for validation messages
import { z } from "zod";

const saudiPhonePattern = /^(05|5)\d{8}$/;

export const emailSchema = z.string().email("البريد الإلكتروني غير صحيح").max(255).optional().or(z.literal(""));

export const phoneSchema = z.string().regex(saudiPhonePattern, "رقم الجوال غير صحيح (مثال: 05xxxxxxxx)").optional().or(z.literal(""));

export const taxNumberSchema = z.string().regex(/^\d{15}$/, "الرقم الضريبي يجب أن يكون ١٥ رقماً").optional().or(z.literal(""));

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون ٨ أحرف على الأقل")
  .regex(/[A-Za-z]/, "يجب أن تحتوي على حرف واحد على الأقل")
  .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل");

export const invoiceItemSchema = z.object({
  name: z.string().min(1, "اسم الصنف مطلوب").max(200),
  quantity: z.number().positive("الكمية يجب أن تكون أكبر من 0"),
  unitPrice: z.number().positive("السعر يجب أن يكون أكبر من 0"),
});

export const invoiceItemArraySchema = z.array(invoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل");

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "العميل مطلوب"),
  type: z.enum(["CASH", "CREDIT"]).optional(),
  date: z.string().optional(),
  dueDate: z.string().optional(),
  items: invoiceItemArraySchema,
  notes: z.string().max(1000).optional(),
});

export const updateInvoiceSchema = z.object({
  clientId: z.string().min(1).optional(),
  type: z.enum(["CASH", "CREDIT"]).optional(),
  date: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  items: invoiceItemArraySchema.optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const createClientSchema = z.object({
  name: z.string().min(1, "اسم العميل مطلوب").max(200),
  phone: z.string().regex(saudiPhonePattern, "رقم الجوال غير صحيح").optional().or(z.literal("")),
  email: z.string().email("البريد الإلكتروني غير صحيح").max(255).optional().or(z.literal("")),
  taxNumber: z.string().regex(/^\d{15}$/, "الرقم الضريبي يجب أن يكون ١٥ رقماً").optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().regex(saudiPhonePattern).optional().or(z.literal("")),
  email: z.string().email().max(255).optional().or(z.literal("")),
  taxNumber: z.string().regex(/^\d{15}$/).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});

export const updateSettingsSchema = z.object({
  companyName: z.string().max(200).optional(),
  taxNumber: z.string().regex(/^\d{15}$/).optional().or(z.literal("")),
  commercialReg: z.string().max(50).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  invoicePrefix: z.string().max(20).optional(),
  defaultTaxRate: z.preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number().min(0).max(100)).optional(),
  language: z.enum(["ar", "en"]).optional(),
  zatcaEnv: z.enum(["sandbox", "production"]).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  token: z.string().min(1, "الرمز مطلوب"),
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(100),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: passwordSchema,
  phone: z.string().regex(saudiPhonePattern, "رقم الجوال غير صحيح (مثال: 05xxxxxxxx)"),
});

export const check2faSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

export const verifyResetTokenSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  token: z.string().min(1, "الرمز مطلوب"),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const verify2faSchema = z.object({
  code: z.string().length(6, "رمز التحقق يجب أن يكون ٦ أرقام"),
  enable: z.boolean().optional(),
});

export const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro", "premium"], { message: "باقة غير صحيحة" }),
});

export const sendWhatsappSchema = z.object({
  invoiceId: z.string().min(1, "معرف الفاتورة مطلوب"),
});
