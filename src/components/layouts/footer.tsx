import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eczar } from "next/font/google";
import { Container } from "@/components/layouts/container";
import { Stack } from "@/components/layouts/stack";
import { cn } from "@/lib/utils";

// Brand logo typeface — Eczar ExtraBold, rendered in Devanagari (व्योम).
// Loaded directly here (rather than via <Wordmark/>) because the giant
// signature glyph needs its own oversized, decorative treatment.
const eczar = Eczar({ subsets: ["latin", "devanagari"], weight: "800", display: "swap" });

const FOOTER_COLUMNS = [
  {
    heading: "Catalog",
    links: [
      { href: "/store", label: "All books" },
      { href: "/ibdp", label: "IBDP" },
      { href: "/igcse", label: "IGCSE" },
    ],
  },
  {
    heading: "Community",
    links: [
      { href: "/community", label: "Creative Corner" },
      { href: "/community", label: "Feedback" },
    ],
  },
  {
    heading: "Help",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/returns", label: "No-returns" },
      { href: "/legal/privacy", label: "Privacy" },
    ],
  },
] as const;

// Placeholder contact values — owner-confirmable. Mirror /contact.
const CONTACT = ["hello@vyombooks.online", "Bangalore, India"] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border/40 op:mt-12">
      {/* Foreground content sits above the giant signature wordmark. */}
      <div className="relative z-10">
        <Container size="wide">
          <div className="pt-16 op:pt-10">
            {/* CTA headline + contact row */}
            <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start md:gap-12">
              <Stack gap={6} className="max-w-2xl">
                <h2 className="font-display text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-balance">
                  Premium Hindi study materials, made with care.
                </h2>
                <Link
                  href="/store"
                  className="group inline-flex w-fit items-center gap-2 text-sm font-medium underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  Browse the store
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Stack>

              <ul className="flex flex-col gap-2 text-sm text-muted-foreground md:items-end md:text-right">
                {CONTACT.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-brand">
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Link columns */}
            <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3">
              {FOOTER_COLUMNS.map((col) => (
                <Stack key={col.heading} gap={3}>
                  <span className="text-eyebrow">{col.heading}</span>
                  <Stack gap={2} align="start">
                    {col.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </Stack>
                </Stack>
              ))}
            </div>
          </div>
        </Container>

        {/* Spacer — reveals the upper portion of the signature wordmark
            between the link columns and the bottom bar. */}
        <div className="h-[16vw] sm:h-[13vw]" aria-hidden="true" />

        {/* Bottom bar */}
        <Container size="wide">
          <div className="flex flex-col gap-2 border-t border-border/40 py-6 text-caption sm:flex-row sm:items-center sm:justify-between">
            <span>© {year} Vyom · All rights reserved.</span>
            <span className="text-mono text-xs">{"v0.1.1"}</span>
          </div>
        </Container>
      </div>

      {/* GIANT signature wordmark — pinned to the bottom and translated
          past the edge so the footer's overflow-hidden clips it, bleeding
          off the bottom like eleos's "ELEOS". Decorative; the accessible
          brand name lives in the bottom bar above. */}
      <span
        aria-hidden="true"
        className={cn(
          eczar.className,
          "pointer-events-none absolute inset-x-0 bottom-0 z-0 block select-none text-center leading-none",
          "translate-y-[0.16em] text-[clamp(5rem,23vw,18rem)] text-foreground/[0.07]",
        )}
      >
        व्योम
      </span>
    </footer>
  );
}
