import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FF Consulting",
  description: "Business platform by Kirill Scales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
