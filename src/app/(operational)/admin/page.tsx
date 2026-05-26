import {
  Inbox,
  Library,
  MessageSquare,
  Package,
  Tag,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Row, Stack } from "@/components/layouts/stack";
import { getAdminStats } from "@/lib/queries/admin-stats";

export const metadata = { title: "Admin" };

interface Panel {
  icon: LucideIcon;
  title: string;
  description: string;
  stat?: { value: number };
  hint?: string;
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  const panels: Panel[] = [
    {
      icon: Inbox,
      title: "Orders",
      description: "Active queue: New → Packed → Shipped.",
      stat: { value: stats.ordersNew },
      hint: "Full Kanban + status buttons land in Phase 5.1.",
    },
    {
      icon: Library,
      title: "Inventory",
      description: "Real-time stock with low-stock warnings.",
      stat: { value: stats.bookCount },
      hint:
        stats.lowStockCount > 0
          ? `${stats.lowStockCount} title${stats.lowStockCount === 1 ? "" : "s"} below 5 in stock`
          : "All titles stocked.",
    },
    {
      icon: Tag,
      title: "Coupons",
      description: "Global codes + dynamic single-use vendor codes.",
      hint: "Vendor coupon generator lands in Phase 5.2.",
    },
    {
      icon: Users,
      title: "Customers",
      description: "Search by email; orders + digital grants.",
      hint: "Lookup UI lands in Phase 5.4.",
    },
    {
      icon: MessageSquare,
      title: "Submissions",
      description: "Moderate Creative Corner posts.",
      stat: { value: stats.pendingSubmissions },
      hint: "Moderation queue lands in Phase 6.",
    },
    {
      icon: Package,
      title: "Feedback",
      description: "Customer feedback inbox.",
      stat: { value: stats.unreadFeedback },
      hint: "Read inbox lands in Phase 6.",
    },
  ];

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
                <Badge variant="destructive">{stats.ordersNew} new</Badge>
                <Badge variant="warning">{stats.ordersPacked} packed</Badge>
                <Badge variant="success">{stats.ordersShipped} shipped</Badge>
              </Row>
            </Row>
            <p className="text-body text-muted-foreground max-w-2xl">
              Read-only overview from live data. Action buttons + admin
              CRUD wire up in Phase 5.
            </p>
          </Stack>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {panels.map((p) => (
              <Card key={p.title} variant="surface" padding="lg">
                <CardHeader>
                  <Row gap={3} align="center" justify="between" className="w-full">
                    <Row gap={3} align="center">
                      <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <p.icon className="size-4" aria-hidden="true" />
                      </div>
                      <CardTitle>{p.title}</CardTitle>
                    </Row>
                    {p.stat ? (
                      <span className="text-2xl font-semibold tabular-nums">
                        {p.stat.value}
                      </span>
                    ) : null}
                  </Row>
                  <CardDescription>{p.description}</CardDescription>
                  {p.hint ? <p className="text-caption pt-1">{p.hint}</p> : null}
                </CardHeader>
              </Card>
            ))}
          </div>

          {stats.ordersNew === 0 && stats.ordersPacked === 0 && stats.ordersShipped === 0 ? (
            <Card variant="surface" padding="none" className="overflow-hidden">
              <EmptyState
                icon={Inbox}
                title="No orders yet"
                description="When the storefront opens, new orders will land here in real time."
              />
            </Card>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}
