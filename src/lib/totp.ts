import { generateSecret, verify, generateURI } from "otplib/functional";

const APP_NAME = "فاتورة";

export { generateSecret };

export function generateTOTPUri(secret: string, email: string): string {
  return generateURI({ issuer: APP_NAME, label: email, secret, strategy: "totp" });
}

export async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  try {
    const result = await verify({ token, secret, strategy: "totp" });
    return result.valid;
  } catch (err) {
    console.error("TOTP verification error:", err);
    return false;
  }
}
