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
  icons: {
    icon: "/AUCA.jpeg",
    apple: "/AUCA.jpeg",
  },
  openGraph: {
    title: "Анкета департаментов — Редизайн сайта AUCA",
    description:
      "Сбор требований для редизайна сайта AUCA. Анкета для департаментов университета.",
    url: "https://auca-questionnaire.vercel.app",
    siteName: "AUCA Questionnaire",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/og-share.png",
        width: 1200,
        height: 630,
        alt: "Анкета департаментов AUCA",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Анкета департаментов — Редизайн сайта AUCA",
    description:
      "Сбор требований для редизайна сайта AUCA. Анкета для департаментов университета.",
    images: ["/og-share.png"],
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
