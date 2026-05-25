import { Inbox, Package, Tag, Users, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Row, Stack } from "@/components/layouts/stack";

export const metadata = { title: "Admin" };

const PANELS = [
  {
    icon: Inbox,
    title: "Orders",
    description: "Active queue: New → Packed → Shipped.",
  },
  {
    icon: Package,
    title: "Inventory",
    description: "Real-time stock with low-stock warnings.",
  },
  {
    icon: Tag,
    title: "Coupons",
    description: "Global codes + dynamic single-use vendor codes.",
  },
  {
    icon: Users,
    title: "Customers",
    description: "Lookup by email; see orders and digital grants.",
  },
  {
    icon: MessageSquare,
    title: "Submissions",
    description: "Moderate Creative Corner posts + read Feedback.",
  },
];

export default function AdminPage() {
  return (
    <Section spacing="default">
      <Container size="wide">
        <Stack gap={8}>
          <Stack gap={2}>
            <Row gap={3} align="center" justify="between" className="flex-wrap">
              <Stack gap={1}>
                <span className="text-eyebrow">Admin · Command center</span>
                <h1 className="text-title">Welcome back.</h1>
              </Stack>
              <Row gap={2}>
                <Badge variant="destructive">0 new</Badge>
                <Badge variant="warning">0 packed</Badge>
                <Badge variant="success">0 shipped</Badge>
              </Row>
            </Row>
            <p className="text-body text-muted-foreground max-w-2xl">
              Mobile-first operational shell. Real panels wire up in
              Phase 5 (Admin Command Center).
            </p>
          </Stack>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PANELS.map((p) => (
              <Card key={p.title} variant="surface" padding="lg">
                <CardHeader>
                  <Row gap={3} align="center">
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <p.icon className="size-4" aria-hidden="true" />
                    </div>
                    <CardTitle>{p.title}</CardTitle>
                  </Row>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card variant="surface" padding="none" className="overflow-hidden">
            <EmptyState
              icon={Inbox}
              title="No orders yet"
              description="When the storefront opens, new orders will land here in real time."
            />
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
