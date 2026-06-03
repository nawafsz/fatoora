import crypto from "crypto";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const KEY_HEX = process.env.ENCRYPTION_KEY;
if (!KEY_HEX) { console.error("ENCRYPTION_KEY not set"); process.exit(1); }
const key = Buffer.from(KEY_HEX, "hex");
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}
function decrypt(encoded) {
  const parts = encoded.split(":");
  if (parts.length !== 3) throw new Error("Invalid format");
  const [ivHex, tagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
const original = "شركة محمد للتجارة";
const enc = encrypt(original);
console.log("Encrypted:", enc.substring(0, 60) + "...");
const dec = decrypt(enc);
console.log("Decrypted:", dec);
console.log("Match:", original === dec);
// Now simulate decryptSensitive with a plain object
const obj = { id: "1", name: enc, phone: null };
const result = { ...obj };
const val = result["name"];
console.log("typeof:", typeof val);
console.log("includes colon:", val.includes(":"));
if (typeof val === "string" && val.includes(":")) {
  result["name"] = decrypt(val);
}
console.log("After decrypt:", result.name);
console.log("Match:", result.name === original);
