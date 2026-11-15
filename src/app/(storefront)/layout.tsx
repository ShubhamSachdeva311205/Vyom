import type { ReactNode } from "react";
import { Footer } from "@/components/layouts/footer";
import { Navbar } from "@/components/layouts/navbar";
import { NoiseLayer } from "@/components/layouts/noise-layer";
import { SmoothScrollProvider } from "@/components/layouts/smooth-scroll";

/**
 * Storefront (Mode A) layout — cinematic. Lenis + GSAP smooth scroll,
 * floating barless Navbar, global grain overlay, generous Footer.
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <NoiseLayer />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </SmoothScrollProvider>
  );
}
