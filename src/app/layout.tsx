import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/context/LangContext";

export const metadata: Metadata = {
  title: "NEON TRADE — Professional Trading Journal",
  description:
    "Futuristic private trading journal with real-time math analytics. Track daily PnL, phase progress, and equity growth — no AI, pure mathematical formulas.",
  keywords: ["trading journal", "prop firm tracker", "trading analytics", "funded account tracker"],
  openGraph: {
    title: "NEON TRADE — Professional Trading Journal",
    description: "Real-time math analytics for serious traders",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Fonts: Roboto Mono (English) + Cairo (Arabic) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
