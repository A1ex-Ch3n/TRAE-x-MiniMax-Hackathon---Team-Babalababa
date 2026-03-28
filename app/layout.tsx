import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaxHelper 報稅助手",
  description: "F-1 學生稅務申報助手 - 幫助您輕鬆完成 Form 8843 和 Form 1040-NR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
