import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookwormReading } from "@/components/features/store/bookworm-reading";
import { ScrollRevealHero } from "@/components/features/store/scroll-reveal-hero";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Row, Stack } from "@/components/layouts/stack";
import { getBooks } from "@/lib/queries/books";

const PILLARS = [
  {
    title: "Books, made with care",
    body: "Physical editions printed in India, packed by hand from Bangalore, shipped via Shiprocket.",
    href: "/store",
    cta: "Browse the catalog",
  },
  {
    title: "Free support material",
    body: "Watermarked PDFs and streaming audio for IBDP and IGCSE — bundled with the physical book, never sold separately.",
    href: "/ibdp",
    cta: "See the curricula",
  },
  {
    title: "A small community",
    body: "Creative Corner for student writing, plus a public feedback line straight to the team.",
    href: "/community",
    cta: "Visit the community",
  },
];

export default async function HomePage() {
  const books = await getBooks();

  // Centre is IGCSE Paper 1 — flagship per user. Other 6 fan out
  // around it (3 left, 3 right).
  const centre = books.find((b) => b.slug === "igcse-hindi-paper-1");
  const others = books.filter((b) => b.slug !== "igcse-hindi-paper-1");
  const left = others.slice(0, 3);
  const right = others.slice(3, 6);

  return (
    <>
      {/* Scroll-reveal hero — 200vh of scroll real estate with the books
          sticky in view. Stages: centre solo → side books fan out →
          mascots arrive (student hanging, teacher sitting). */}
      {centre ? (
        <ScrollRevealHero center={centre} left={left} right={right} />
      ) : (
        <Section spacing="default">
          <Container>
            <p className="text-caption">
              Catalogue isn&rsquo;t loaded. Run <code>supabase db reset</code> to seed.
            </p>
          </Container>
        </Section>
      )}

      <Section spacing="loose">
        <Container>
          <Stack gap={12}>
            <Stack gap={4}>
              <span className="text-eyebrow">Premium study resources · Bangalore</span>
              <h2 className="text-display">Study, slowly.</h2>
              <p className="text-body-lg text-muted-foreground max-w-2xl">
                Vyom makes carefully edited books, papers, and audio
                companions for students preparing for the IB Diploma and
                IGCSE. Built for curiosity, not panic.
              </p>
              <Row gap={3} wrap>
                <Button asChild>
                  <Link href="/store">
                    Browse the store <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/community">Visit the community</Link>
                </Button>
              </Row>
            </Stack>

            <Stack gap={4} align="center">
              <BookwormReading size="lg" />
              <p className="text-caption text-center max-w-md">
                Companions hidden around the site carry small Easter-egg
                discount codes. This one prefers the quiet.
              </p>
            </Stack>
          </Stack>
        </Container>
      </Section>

      <Section>
        <Container>
          <Stack gap={6}>
            <Stack gap={2}>
              <span className="text-eyebrow">What&rsquo;s inside</span>
              <h2 className="text-title">Three things, done well.</h2>
            </Stack>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PILLARS.map((p) => (
                <Card key={p.title} variant="surface" padding="lg">
                  <Stack gap={4}>
                    <Stack gap={2}>
                      <CardTitle>{p.title}</CardTitle>
                      <CardDescription>{p.body}</CardDescription>
                    </Stack>
                    <div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={p.href}>
                          {p.cta} <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  </Stack>
                </Card>
              ))}
            </div>
          </Stack>
        </Container>
      </Section>
    </>
  );
}
