import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Stack, Row } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";
import type { UsageStats } from "@/actions/admin-usage";

function fmtBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(0)} KB`;
  return `${b} B`;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Stack gap={1}>
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-title tabular-nums">{value}</span>
      {hint ? <span className="text-caption text-muted-foreground">{hint}</span> : null}
    </Stack>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <Card variant="surface" padding="lg">
      <Stack gap={4}>
        <Row gap={2} align="center" justify="between">
          <h2 className="text-body font-semibold">{title}</h2>
          {note ? <span className="text-caption text-muted-foreground">{note}</span> : null}
        </Row>
        {children}
      </Stack>
    </Card>
  );
}

export function UsageDashboard({ stats }: { stats: UsageStats }) {
  const { cloudinary, razorpay, email, storage, shipping } = stats;
  // Supabase free tier ≈ 1 GB storage — surface how close we are.
  const SUPABASE_FREE = 1e9;
  const storagePct = Math.min(100, (storage.totalBytes / SUPABASE_FREE) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Cloudinary */}
      <Panel title="Cloudinary (media)" note="live">
        {cloudinary.configured && !("error" in cloudinary && cloudinary.error) ? (
          <div className="grid grid-cols-2 gap-4">
            <Stat
              label="Credits used"
              value={
                cloudinary.creditsUsed != null
                  ? `${cloudinary.creditsUsed.toFixed(2)} / ${cloudinary.creditsLimit ?? "?"}`
                  : "—"
              }
              hint={cloudinary.creditsPercent != null ? `${cloudinary.creditsPercent.toFixed(2)}% of plan` : undefined}
            />
            <Stat label="Plan" value={cloudinary.plan ?? "—"} />
            <Stat label="Storage" value={cloudinary.storageBytes != null ? fmtBytes(cloudinary.storageBytes) : "—"} />
            <Stat label="Bandwidth" value={cloudinary.bandwidthBytes != null ? fmtBytes(cloudinary.bandwidthBytes) : "—"} />
            <Stat label="Assets" value={cloudinary.objects != null ? String(cloudinary.objects) : "—"} />
            <Stat label="Transforms" value={cloudinary.transformations != null ? String(cloudinary.transformations) : "—"} />
          </div>
        ) : (
          <p className="text-body text-muted-foreground">
            {!cloudinary.configured
              ? "Not configured (add CLOUDINARY_API_KEY + SECRET)."
              : ("error" in cloudinary && cloudinary.error) || "Unavailable."}
          </p>
        )}
      </Panel>

      {/* Razorpay */}
      <Panel title="Razorpay (payments)" note="from orders">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Paid orders" value={String(razorpay.paidOrders)} />
          <Stat label="Revenue" value={formatINR(razorpay.revenuePaise)} />
          <Stat label="Processor fees" value={formatINR(razorpay.feesPaise)} hint="non-refundable" />
          <Stat label="Refunded" value={formatINR(razorpay.refundedPaise)} />
        </div>
      </Panel>

      {/* Supabase storage */}
      <Panel title="Supabase storage" note="from buckets">
        <Stack gap={3}>
          <Stat
            label="Total used"
            value={fmtBytes(storage.totalBytes)}
            hint={`${storagePct.toFixed(0)}% of ~1 GB free tier`}
          />
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={storagePct > 80 ? "h-full bg-destructive" : "h-full bg-brand"}
              style={{ width: `${storagePct}%` }}
            />
          </div>
          <Stack gap={1}>
            {storage.buckets.map((b) => (
              <Row key={b.bucket} gap={2} justify="between" className="text-caption">
                <span className="text-muted-foreground">{b.bucket} ({b.objects})</span>
                <span className="tabular-nums">{fmtBytes(b.bytes)}</span>
              </Row>
            ))}
          </Stack>
          {storagePct > 60 && (
            <Badge variant="warning">Consider moving audio to R2 (#104)</Badge>
          )}
        </Stack>
      </Panel>

      {/* Email + shipping */}
      <Panel title="Email & shipping" note="from orders">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Emails sent" value={String(email.sentTotal)} hint={`${email.sentThisMonth} this month`} />
          <Stat label="Resend free tier" value="3,000 / mo" />
          <Stat label="Orders shipped" value={String(shipping.shipped)} />
        </div>
      </Panel>
    </div>
  );
}
