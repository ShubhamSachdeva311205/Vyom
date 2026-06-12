import { getUsageStats } from "@/actions/admin-usage";
import { UsageDashboard } from "@/components/features/admin/usage/usage-dashboard";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";

export const metadata = { title: "Usage & costs · Admin" };

// Always fresh — calls live provider APIs.
export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  const res = await getUsageStats();

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Usage &amp; costs</span>
            <h1 className="text-title">External services</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Live usage across the tools we depend on, so there are no surprise
              bills. All figures are read server-side — no keys are exposed here.
            </p>
            {res.success && (
              <p className="text-caption text-muted-foreground">
                Updated {new Date(res.data.generatedAt).toLocaleString("en-IN")}
              </p>
            )}
          </Stack>

          {res.success ? (
            <UsageDashboard stats={res.data} />
          ) : (
            <Card variant="flat" padding="lg">
              <p className="text-body text-muted-foreground">{res.error}</p>
            </Card>
          )}
        </Stack>
      </Container>
    </Section>
  );
}
