import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KineticHeading } from "@/components/ui/kinetic-heading";
import { Mascot, type MascotName } from "@/components/ui/mascot";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Row, Stack } from "@/components/layouts/stack";

const COMPANIONS: { name: MascotName; label: string }[] = [
  { name: "student", label: "Student" },
  { name: "teacher", label: "Teacher" },
  { name: "bookworm", label: "Reader" },
  { name: "star", label: "Star" },
];

const PILLARS = [
  {
    title: "Books, made with care",
    body: "Physical editions printed in India, packed by hand from Bangalore, shipped via Delhivery.",
    href: "/store",
    cta: "Browse the catalog",
  },
  {
    title: "Digital companions",
    body: "Watermarked PDFs and streaming audio for IBDP and IGCSE subjects. Never exposes a raw URL.",
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

export default function HomePage() {
  return (
    <>
      <Section spacing="loose">
        <Container>
          <Stack gap={12}>
            <Stack gap={6}>
              <span className="text-eyebrow">Premium study resources · Bangalore</span>
              <KineticHeading emphasize={1}>Study, slowly.</KineticHeading>
              <p className="text-body-lg text-muted-foreground max-w-2xl">
                Advaita makes carefully edited books, papers, and audio
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
              <Row gap={6} wrap justify="center">
                {COMPANIONS.map((c) => (
                  <Stack key={c.name} gap={2} align="center">
                    <Mascot name={c.name} size="md" hideCoupon />
                    <span className="text-mono-tag">{c.label}</span>
                  </Stack>
                ))}
              </Row>
              <p className="text-caption">Meet the companions. Hover student or teacher for a treat.</p>
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
