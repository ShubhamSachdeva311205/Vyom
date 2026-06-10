import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack, Row } from "@/components/layouts/stack";
import { AccountSettings } from "@/components/features/account/account-settings";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const metadata = { title: "Account settings" };

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard/settings");

  const service = createServiceClient();
  const { data: profile } = await service
    .from("users")
    .select("full_name, created_at")
    .eq("id", user.id)
    .maybeSingle();
  const { count: orderCount } = await service
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "pending_payment");

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Account</span>
            <h1 className="text-title">Settings</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Update your name, email, and password.
            </p>
          </Stack>

          <Card variant="surface" padding="lg">
            <Row gap={6} className="flex-wrap text-sm">
              <Stack gap={1}>
                <span className="text-caption text-muted-foreground">Member since</span>
                <span className="font-medium">{memberSince}</span>
              </Stack>
              <Stack gap={1}>
                <span className="text-caption text-muted-foreground">Orders placed</span>
                <span className="font-medium tabular-nums">{orderCount ?? 0}</span>
              </Stack>
            </Row>
          </Card>

          <AccountSettings
            initialName={profile?.full_name ?? ""}
            email={user.email ?? ""}
          />
        </Stack>
      </Container>
    </Section>
  );
}
