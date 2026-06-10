import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { SalesReport } from "@/components/features/admin/reports/sales-report";

export const metadata = { title: "Reports · Admin" };

export default function AdminReportsPage() {
  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Reports</span>
            <h1 className="text-title">Sales</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Revenue, orders, and units over time. Download the raw orders
              as CSV for your records.
            </p>
          </Stack>
          <SalesReport />
        </Stack>
      </Container>
    </Section>
  );
}
