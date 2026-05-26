import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";

export const metadata = { title: "Auth error", robots: { index: false } };

const REASON_COPY: Record<string, { title: string; description: string }> = {
  oauth_init_failed: {
    title: "Couldn't reach Google sign-in",
    description:
      "We had trouble starting the Google flow. Try the email sign-in instead, or try again in a minute.",
  },
  callback_failed: {
    title: "Sign-in link didn't work",
    description:
      "The link may have expired or already been used. Sign in again to get a fresh one.",
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const fallback = {
    title: "Something went wrong signing you in",
    description: "Try again — if it keeps happening, get in touch via the feedback form.",
  };
  const copy = (reason ? REASON_COPY[reason] : undefined) ?? fallback;

  return (
    <Section spacing="loose">
      <Container size="reading">
        <Stack gap={8}>
          <Stack gap={3}>
            <span className="text-eyebrow">Auth · Hiccup</span>
            <h1 className="text-display">{copy.title}</h1>
            <p className="text-body-lg text-muted-foreground">{copy.description}</p>
          </Stack>

          <Card variant="surface" padding="none" className="overflow-hidden">
            <ErrorState
              title={copy.title}
              description={copy.description}
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/sign-in">
                    <ArrowLeft /> Back to sign-in
                  </Link>
                </Button>
              }
            />
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
