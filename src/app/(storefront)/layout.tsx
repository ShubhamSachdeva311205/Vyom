import type { ReactNode } from "react";
import { Footer } from "@/components/layouts/footer";
import { Navbar } from "@/components/layouts/navbar";
import { NoiseLayer } from "@/components/layouts/noise-layer";

/**
 * Storefront (Mode A) layout — cinematic. Sticky Navbar, global grain
 * overlay, generous Footer. Every route under (storefront) inherits.
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <NoiseLayer />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
