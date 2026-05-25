import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stack } from "@/components/layouts/stack";

export const metadata = {
  title: "Legal",
  description: "Terms, returns policy, and privacy.",
};

const POLICIES = [
  {
    href: "/legal/terms",
    title: "Terms of service",
    description: "Rules of using Advaita's store and community.",
  },
  {
    href: "/legal/returns",
    title: "No-returns policy",
    description:
      "All sales are final. Digital access cannot be revoked or refunded once granted.",
  },
  {
    href: "/legal/privacy",
    title: "Privacy",
    description: "What we collect, what we don't, and how we handle it.",
  },
];

export default function LegalIndexPage() {
  return (
    <Stack gap={8}>
      <Stack gap={3}>
        <span className="text-eyebrow">Legal</span>
        <h1 className="text-title">Policies</h1>
        <p className="text-body text-muted-foreground">
          Short and plain. If anything is unclear, the feedback form is
          one click away.
        </p>
      </Stack>

      <Stack gap={3}>
        {POLICIES.map((p) => (
          <Link key={p.href} href={p.href} className="block group">
            <Card
              variant="surface"
              padding="lg"
              className="transition-colors duration-150 group-hover:border-foreground/30"
            >
              <div className="flex items-start justify-between gap-4">
                <Stack gap={1}>
                  <CardTitle>{p.title}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </Stack>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1.5" />
              </div>
            </Card>
          </Link>
        ))}
      </Stack>
    </Stack>
  );
}
