import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vizzy Platform",
  description: "Vizzy Platform by Kirill Scales",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
