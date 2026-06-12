import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { CouponGenerator } from "@/components/features/admin/coupons/coupon-generator";
import { CouponList } from "@/components/features/admin/coupons/coupon-list";
import {
  listGlobalCoupons,
  listVendorCoupons,
} from "@/actions/admin-coupons";
import { listBooksForGrantPicker } from "@/actions/admin-access";

export const metadata = { title: "Coupons · Admin" };

export default async function AdminCouponsPage() {
  const [globals, vendors, books] = await Promise.all([
    listGlobalCoupons(),
    listVendorCoupons(),
    listBooksForGrantPicker(),
  ]);

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Coupons</span>
            <h1 className="text-title">Coupons</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Generate vendor codes for partners and see how all your codes
              are being used.
            </p>
          </Stack>

          {/* Built-in / global codes */}
          <Card variant="surface" padding="lg">
            <Stack gap={3}>
              <Stack gap={1}>
                <span className="text-eyebrow">Built-in codes</span>
                <p className="text-caption text-muted-foreground">
                  Seeded via DB migrations. Read-only here — edits require a
                  code change.
                </p>
              </Stack>
              {globals.success ? (
                <CouponList rows={globals.data ?? []} variant="built-in" />
              ) : (
                <ErrorState
                  title="Couldn't load built-in codes"
                  description={globals.error}
                />
              )}
            </Stack>
          </Card>

          {/* Vendor code generator */}
          <Card variant="surface" padding="lg">
            <Stack gap={3}>
              <Stack gap={1}>
                <span className="text-eyebrow">Generate vendor code</span>
                <p className="text-caption text-muted-foreground">
                  Format: <code>VND-XXXX-XXXX</code>. Single-use by default —
                  enable Multi-use to let a vendor hand it out N times.
                </p>
              </Stack>
              <CouponGenerator
                books={books.success ? (books.data ?? []).map((b) => ({ id: b.id, title: b.title })) : []}
              />
            </Stack>
          </Card>

          {/* Vendor codes list */}
          <Card variant="surface" padding="lg">
            <Stack gap={3}>
              <Stack gap={1}>
                <span className="text-eyebrow">Vendor codes</span>
                <p className="text-caption text-muted-foreground">
                  Active, used, and expired vendor codes. Unused codes can be
                  deleted; used ones stay for the audit trail.
                </p>
              </Stack>
              {vendors.success ? (
                <CouponList rows={vendors.data ?? []} variant="vendor" />
              ) : (
                <ErrorState
                  title="Couldn't load vendor codes"
                  description={vendors.error}
                />
              )}
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
