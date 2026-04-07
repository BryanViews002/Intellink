import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intellink | Get paid for what you know",
  description:
    "A premium SaaS platform where experts sell paid Q&A, sessions, and digital resources with subscription-first access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
