import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) {
    throw new Error("ENCRYPTION_KEY غير مضبوط في متغيرات البيئة");
  }
  cachedKey = Buffer.from(hex, "hex");
  return cachedKey;
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

export function decrypt(encoded: string): string {
  const key = getKey();
  const parts = encoded.split(":");
  if (parts.length !== 3) throw new Error("تنسيق بيانات مشفر غير صحيح");
  const [ivHex, tagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function encryptString(text: string): string {
  return encrypt(text);
}

export function decryptString(encoded: string): string {
  return decrypt(encoded);
}

export function encryptSensitive<T extends Record<string, unknown>>(obj: T, fields: readonly (keyof T)[]): T {
  const result = { ...obj };
  for (const field of fields) {
    const val = result[field];
    if (typeof val === "string" && val.length > 0) {
      result[field] = encrypt(val) as T[keyof T];
    }
  }
  return result;
}

export function decryptSensitive<T extends Record<string, unknown>>(obj: T, fields: readonly (keyof T)[]): T {
  const result = { ...obj };
  for (const field of fields) {
    const val = result[field];
    if (typeof val === "string" && val.includes(":")) {
      try {
        result[field] = decrypt(val) as T[keyof T];
      } catch {
      }
    }
  }
  return result;
}
