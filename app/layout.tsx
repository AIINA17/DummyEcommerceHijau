import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/constants";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — Situs Jual Beli Online Terlengkap`,
    template: `%s | ${BRAND.name}`,
  },
  description: `${BRAND.tagline}. Demo marketplace bergaya Tokopedia dengan Next.js, shadcn/ui, dan Neon.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full">
      <body className="flex min-h-full flex-col antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
