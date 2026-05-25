import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Stack } from "@/components/layouts/stack";

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
      { href: "/community/feedback", label: "Feedback" },
    ],
  },
  {
    heading: "Help",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/returns", label: "No-returns policy" },
      { href: "/legal/privacy", label: "Privacy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/40 mt-24 op:mt-12">
      <Container size="wide">
        <div className="py-16 op:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stack gap={3} className="col-span-2 md:col-span-1">
              <span className="font-display text-lg font-semibold tracking-[-0.02em]">
                Advaita
              </span>
              <p className="text-caption max-w-[28ch]">
                Premium study resources for IBDP and IGCSE — built in
                Bangalore.
              </p>
            </Stack>

            {FOOTER_COLUMNS.map((col) => (
              <Stack key={col.heading} gap={3}>
                <span className="text-eyebrow">{col.heading}</span>
                <Stack gap={2}>
                  {col.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Stack>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between gap-2 text-caption">
            <span>© {new Date().getFullYear()} Advaita Books</span>
            <span className="text-mono text-xs">{"v0.1.1"}</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
