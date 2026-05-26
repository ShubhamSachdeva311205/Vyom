import Link from "next/link";
import type { ReactNode } from "react";
import { NoiseLayer } from "@/components/layouts/noise-layer";

/**
 * Auth layout — clean centered surface for /sign-in, /sign-up, /verify.
 * Drops the storefront navbar/footer so the page is one job: get the
 * user authenticated. Keeps the noise layer for ambient texture.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <NoiseLayer />

      {/* Minimal top bar with logo wordmark — link back to home. */}
      <header className="px-6 py-5 sm:px-8">
        <Link
          href="/"
          className="inline-block font-display text-base font-semibold tracking-[-0.02em] hover:opacity-80 transition-opacity"
        >
          Advaita
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
