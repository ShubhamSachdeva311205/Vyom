import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack, Row } from "@/components/layouts/stack";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { AdminEmailsForm } from "@/components/features/admin/settings/admin-emails-form";
import { BankForm } from "@/components/features/admin/settings/bank-form";
import { CheckoutSafetyForm } from "@/components/features/admin/settings/checkout-safety-form";
import { SellerForm } from "@/components/features/admin/settings/seller-form";
import { ShippingForm } from "@/components/features/admin/settings/shipping-form";
import { listAdminEmails } from "@/actions/admin-settings";
import {
  getBankDetails,
  getCheckoutSafety,
  getSellerDetails,
  getShippingSettings,
} from "@/lib/settings/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings · Admin" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [seller, shipping, bank, checkoutSafety, adminEmailsResult] = await Promise.all([
    getSellerDetails(),
    getShippingSettings(),
    getBankDetails(),
    getCheckoutSafety(),
    listAdminEmails(),
  ]);

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Settings</span>
            <h1 className="text-title">Settings</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Everything Mom can change without a code deploy: invoice
              header, shipping rules, bank details, and the admin allowlist.
            </p>
          </Stack>

          <Card variant="surface" padding="lg">
            <Stack gap={3}>
              <Stack gap={1}>
                <span className="text-eyebrow">Seller details</span>
                <p className="text-caption text-muted-foreground">
                  Appears at the top of every Tax Invoice PDF.
                </p>
              </Stack>
              <SellerForm initial={seller} />
            </Stack>
          </Card>

          <Card variant="surface" padding="lg">
            <Stack gap={3}>
              <Stack gap={1}>
                <span className="text-eyebrow">Shipping</span>
                <p className="text-caption text-muted-foreground">
                  Free-shipping rule + Shiprocket pickup configuration.
                </p>
              </Stack>
              <ShippingForm initial={shipping} />
            </Stack>
          </Card>

          <Card variant="surface" padding="lg">
            <Stack gap={3}>
              <Stack gap={1}>
                <span className="text-eyebrow">Checkout safety</span>
                <p className="text-caption text-muted-foreground">
                  Price-floor circuit breaker. If the computed total ever
                  drops below this percentage of the cart subtotal, the
                  order is refused before Razorpay.
                </p>
              </Stack>
              <CheckoutSafetyForm initial={checkoutSafety} />
            </Stack>
          </Card>

          <Card variant="surface" padding="lg">
            <Stack gap={3}>
              <Stack gap={1}>
                <span className="text-eyebrow">Bank details</span>
                <p className="text-caption text-muted-foreground">
                  Appears in the invoice footer for direct-deposit
                  reference.
                </p>
              </Stack>
              <BankForm initial={bank} />
            </Stack>
          </Card>

          <Card variant="surface" padding="lg">
            <Stack gap={3}>
              <Stack gap={1}>
                <span className="text-eyebrow">Admin access</span>
                <p className="text-caption text-muted-foreground">
                  Emails listed here can sign in to /admin. The env-var
                  <code className="mx-1">ADMIN_EMAILS</code>
                  also grants access as the bootstrap fallback.
                </p>
              </Stack>
              {adminEmailsResult.success ? (
                <AdminEmailsForm
                  initial={adminEmailsResult.data ?? []}
                  currentEmail={user?.email ?? ""}
                />
              ) : (
                <ErrorState
                  title="Couldn't load admin list"
                  description={adminEmailsResult.error}
                />
              )}
            </Stack>
          </Card>

          <Card variant="surface" padding="lg">
            <Row gap={3} align="center" justify="between" className="flex-wrap">
              <Stack gap={1}>
                <span className="text-eyebrow">Audit log</span>
                <p className="text-caption text-muted-foreground">
                  Every admin action — refunds, status changes, grants, restocks.
                </p>
              </Stack>
              <Button asChild variant="outline">
                <Link href="/admin/audit">View activity →</Link>
              </Button>
            </Row>
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
