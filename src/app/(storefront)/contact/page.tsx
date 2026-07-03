import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";

export const metadata = {
  title: "Contact",
  description: "Reach the Vyom team — support email, location, and hours.",
};

/*
 * PLACEHOLDER CONTACT DETAILS — owner to confirm/replace before launch.
 *   - SUPPORT_EMAIL: provisional support inbox.
 *   - LOCATION:      city/region shown publicly (not a full street address).
 *   - HOURS:         provisional support window.
 * These also back the footer contact dots and help Razorpay merchant
 * activation (a reachable contact page is required).
 */
const SUPPORT_EMAIL = "hello@vyombooks.online";
const LOCATION = "Bangalore, India";
const HOURS = "Mon–Sat, 10am–6pm IST";

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: "Email us",
    description: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    icon: MapPin,
    title: "Where we are",
    description: LOCATION,
    href: null,
  },
  {
    icon: Clock,
    title: "Support hours",
    description: HOURS,
    href: null,
  },
] as const;

export default function ContactPage() {
  return (
    <Section spacing="default">
      <Container size="reading">
        <Stack gap={8}>
          <Stack gap={3}>
            <span className="text-eyebrow">Contact</span>
            <h1 className="text-title">Get in touch</h1>
            <p className="text-body text-muted-foreground">
              Questions about an order, a book, or digital access? We&rsquo;re a
              small team and we read everything. Email is the fastest way to
              reach us.
            </p>
          </Stack>

          <Stack gap={3}>
            {CONTACT_METHODS.map(({ icon: Icon, title, description, href }) => {
              const body = (
                <Card
                  variant="surface"
                  padding="lg"
                  className="transition-colors duration-150 group-hover:border-foreground/30"
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <Stack gap={1}>
                      <CardTitle>{title}</CardTitle>
                      <CardDescription className="break-words">
                        {description}
                      </CardDescription>
                    </Stack>
                  </div>
                </Card>
              );

              return href ? (
                <a key={title} href={href} className="block group">
                  {body}
                </a>
              ) : (
                <div key={title}>{body}</div>
              );
            })}
          </Stack>

          <Link href="/community" className="block group">
            <Card
              variant="surface"
              padding="lg"
              className="transition-colors duration-150 group-hover:border-foreground/30"
            >
              <div className="flex items-start justify-between gap-4">
                <Stack gap={1}>
                  <CardTitle>Have feedback or a request?</CardTitle>
                  <CardDescription>
                    Share it through the feedback form — no account needed.
                  </CardDescription>
                </Stack>
                <ArrowRight className="mt-1.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </div>
            </Card>
          </Link>
        </Stack>
      </Container>
    </Section>
  );
}
