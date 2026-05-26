import type { Metadata } from "next";
import "./globals.css";
import "./survey.css";

export const metadata: Metadata = {
  title: "Анкета департаментов — Редизайн сайта AUCA",
  description:
    "Сбор требований для редизайна сайта AUCA. Анкета для департаментов университета.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
