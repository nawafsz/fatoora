import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { ToastProvider } from "@/components/ui/toast";
import { LanguageProvider } from "@/components/language-provider";
import { AuthProvider } from "@/components/auth-provider";
import { checkEnv } from "@/lib/env";

checkEnv();

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://fatoora.sa";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "فاتورة | الفوترة الإلكترونية المتوافقة مع ZATCA",
  description:
    "أسهل طريقة لإصدار فواتير إلكترونية متوافقة مع ZATCA في السعودية. ٣ نقرات فقط وفاتورتك جاهزة.",
  keywords: ["فاتورة", "ZATCA", "فوترة إلكترونية", "السعودية", "ضريبة القيمة المضافة", "فاتورة إلكترونية"],
  openGraph: {
    title: "فاتورة — الفوترة الإلكترونية المتوافقة مع ZATCA",
    description: "أسرع وأسهل طريقة لإصدار فواتير إلكترونية متوافقة مع ZATCA. ٣ نقرات وفاتورتك جاهزة.",
    url: appUrl,
    siteName: "فاتورة",
    locale: "ar_SA",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "فاتورة — الفوترة الإلكترونية المتوافقة مع ZATCA",
    description: "أسرع وأسهل طريقة لإصدار فواتير إلكترونية متوافقة مع ZATCA.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.png" },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "فاتورة" },
  other: {
    "theme-color": "#1a5632",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as "ar" | "en") ?? "ar";
  const dir = lang === "en" ? "ltr" : "rtl";

  return (
    <html lang={lang} dir={dir} className="h-full">
      <body className="min-h-full flex flex-col font-sans antialiased">
        <AuthProvider>
          <LanguageProvider initialLang={lang}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
