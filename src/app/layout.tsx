import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layouts/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { env } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Vyom",
    template: "%s · Vyom",
  },
  description:
    "Premium study resources for IBDP and IGCSE — books, papers, and audio companions.",
  openGraph: {
    type: "website",
    title: "Vyom",
    description:
      "Premium study resources for IBDP and IGCSE — books, papers, and audio companions.",
    siteName: "Vyom",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vyom",
    description:
      "Premium study resources for IBDP and IGCSE — books, papers, and audio companions.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
