import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Market Copilot",
  description: "AI-assisted global equity research dashboard with technical, fundamental, and news analysis."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
