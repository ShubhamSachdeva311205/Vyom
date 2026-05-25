import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/layouts/container";

/**
 * Operational (Mode B) layout — admin / dashboard / checkout.
 *
 * Sets data-mode="operational" on the wrapping <div>, which neutralizes
 * mesh gradients, noise, and storefront blur via the rules in
 * globals.css / backgrounds.css. Forced light theme by token override.
 * Minimal top bar with brand label only — no marketing nav. Real
 * auth-gated user menu lands in Phase 2.
 */
export default function OperationalLayout({ children }: { children: ReactNode }) {
  return (
    <div data-mode="operational" className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background">
        <Container size="wide">
          <div className="flex h-14 items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 -ml-1 px-1 py-1 rounded-md hover:bg-accent/50 transition-colors"
            >
              <span className="font-display text-base font-semibold tracking-[-0.02em]">
                Advaita
              </span>
              <span className="text-mono-tag text-muted-foreground">Operational</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Storefront →
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
