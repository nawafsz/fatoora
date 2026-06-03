import { ar as arDict, en as enDict } from "./i18n/dictionaries";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@fatoora.sa";

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  lang?: string;
}) {
  const dict = params.lang === "en" ? enDict : arDict;

  if (!RESEND_API_KEY) {
    console.log("📧 Email not sent (RESEND_API_KEY not configured)");
    console.log(`   To: ${params.to}`);
    console.log(`   Subject: ${params.subject}`);
    console.log(`   Text: ${params.text}`);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html ?? undefined,
      }),
    });

    if (!res.ok) {
      await res.text();
      console.error("Resend error: status", res.status);
      return { success: false, error: dict.email.sendFailed };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send error:", (error as Error).message);
    return { success: false, error: dict.email.sendFailed };
  }
}

export async function sendPasswordResetEmail(to: string, resetLink: string, lang: string = "ar") {
  const dict = lang === "en" ? enDict : arDict;
  const sanitizedLink = resetLink.replace(/[^\w:\/\-?.=&%+]/g, "");
  if (sanitizedLink !== resetLink) {
    console.error("Potential XSS attempt in resetLink, sanitized");
  }
  return sendEmail({
    to,
    lang,
    subject: dict.email.resetSubject,
    text: `${dict.email.resetGreeting}\n\nلقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في ${dict.brand.name}.\n\nرابط إعادة التعيين (صالح لمدة ساعة):\n${sanitizedLink}\n\nإذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة.\n\nشكراً،\nفريق ${dict.brand.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #1a5632; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <span style="color: white; font-size: 24px; font-weight: 900;">${dict.brand.name}</span>
        </div>
        <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">${dict.email.resetGreeting}</p>
          <p style="font-size: 16px; color: #374151;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في <strong>${dict.brand.name}</strong>.</p>
          <a href="${sanitizedLink}" style="display: block; background: #1a5632; color: white; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 24px 0;">
            ${dict.email.resetButton}
          </a>
          <p style="font-size: 14px; color: #9ca3af;">${dict.email.resetNote}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="font-size: 12px; color: #9ca3af;">${dict.email.footer}</p>
        </div>
      </div>
    `,
  });
}
