import type { ReactNode } from "react";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";

/**
 * Legal layout — narrow reading column so terms / policies read like
 * a document, not a marketing page.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <Section spacing="default">
      <Container size="reading">{children}</Container>
    </Section>
  );
}
