import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./survey.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://auca-questionnaire.vercel.app",
  ),
  title: "Анкета департаментов — Редизайн сайта AUCA",
  description:
    "Сбор требований для редизайна сайта AUCA. Анкета для департаментов университета.",
  openGraph: {
    title: "Анкета департаментов — Редизайн сайта AUCA",
    description:
      "Сбор требований для редизайна сайта AUCA. Анкета для департаментов университета.",
    siteName: "AUCA Questionnaire",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Анкета департаментов — Редизайн сайта AUCA",
    description:
      "Сбор требований для редизайна сайта AUCA. Анкета для департаментов университета.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
