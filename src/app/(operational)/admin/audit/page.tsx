import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { AuditList } from "@/components/features/admin/audit/audit-list";

export const metadata = { title: "Audit log · Admin" };

export default function AdminAuditPage() {
  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Audit log</span>
            <h1 className="text-title">Activity</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Every admin action — refunds, status changes, access grants,
              restocks, book edits — newest first.
            </p>
          </Stack>
          <AuditList />
        </Stack>
      </Container>
    </Section>
  );
}
