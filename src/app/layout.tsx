import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  ? `https://${process.env.NEXT_PUBLIC_BASE_URL}`
  : "https://links.codecadence.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "LinkHub — Plataforma de Links Inteligente",
    template: "%s | LinkHub",
  },
  description:
    "Crie sua página de links personalizada com suporte a múltiplos temas, analytics e monetização.",
  keywords: ["links", "link in bio", "portfólio", "codecadence", "linkhub"],
  authors: [{ name: "Code Cadence", url: "https://codecadence.com.br" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: baseUrl,
    siteName: "LinkHub",
    title: "LinkHub — Plataforma de Links Inteligente",
    description: "Crie sua página de links personalizada em segundos.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
