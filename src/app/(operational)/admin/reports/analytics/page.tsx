import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { AnalyticsDashboard } from "@/components/features/admin/reports/analytics/analytics-dashboard";

export const metadata = { title: "Analytics · Admin" };

export default function AdminAnalyticsPage() {
  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Reports</span>
            <h1 className="text-title">Analytics</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Who buys, what sells, and when. Best-selling books, sales by city
              and pincode, repeat-customer rate, and order timing — all over the
              period you pick.
            </p>
          </Stack>
          <AnalyticsDashboard />
        </Stack>
      </Container>
    </Section>
  );
}
