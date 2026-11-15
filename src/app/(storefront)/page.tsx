import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookwormReading } from "@/components/features/store/bookworm-reading";
import { HeroReveal } from "@/components/features/store/hero-reveal";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Row, Stack } from "@/components/layouts/stack";

const PILLARS = [
  {
    title: "Physical books",
    body: "Physical editions printed in India, packed by hand from Bangalore, shipped across the country.",
    href: "/store",
    cta: "Browse the catalog",
  },
  {
    title: "Free support material",
    body: "Watermarked PDFs and streaming audio for IBDP and IGCSE — bundled with the physical book, never sold separately.",
    href: "/store",
    cta: "Explore curricula",
  },
  {
    title: "A small community",
    body: "Creative Corner for student writing, plus a public feedback line straight to the team.",
    href: "/community",
    cta: "Visit the community",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const isNotAdmin = params.auth_error === "not_admin";

  return (
    <>
      {isNotAdmin ? (
        <div
          role="alert"
          className="relative z-40 bg-destructive/10 text-destructive text-sm text-center px-4 py-3"
        >
          You don&rsquo;t have admin access. Sign in with an authorised account.
        </div>
      ) : null}

      {/* Full-bleed hand-drawn sketch → colour reveal (#91) */}
      <HeroReveal
        colorSrc="/demo/hero-color.webp"
        outlineSrc="/demo/hero-outline.webp"
      />

      {/* About section reached directly after the colour reveal */}
      <Section id="about" spacing="loose" className="scroll-mt-16">
        <Container>
          <Stack gap={12}>
            <Stack gap={4} className="max-w-2xl">
              <span className="text-eyebrow">About · Study resources · Bangalore</span>
              <h1 className="text-display">Stories worth colouring in.</h1>
              <p className="text-body-lg text-muted-foreground">
                Vyom makes premium IBDP &amp; IGCSE Hindi study materials — written
                with care by Seema Sachdeva and brought to life with colour. Every
                physical book comes bundled with watermarked PDFs and streaming audio.
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
