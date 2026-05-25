import { Stack } from "@/components/layouts/stack";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <span className="text-eyebrow">Legal · Privacy</span>
        <h1 className="text-title">Privacy</h1>
        <p className="text-caption">
          Last updated: <span className="text-mono">2026-05-26</span> · Draft
        </p>
      </Stack>

      <Stack gap={4} className="text-body">
        <p>What we collect, what we don&rsquo;t, plainly:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Order details (name, shipping address, email) — required.</li>
          <li>
            Razorpay handles payment. We never see your card number.
          </li>
          <li>
            Digital access is logged per email + order ID for
            watermarking only; we don&rsquo;t track reading time or
            location.
          </li>
          <li>
            Community submissions (Creative Corner, Feedback) accept
            guests — no account required, no user ID stored.
          </li>
        </ul>
        <p className="text-caption">
          The full GDPR/DPDP document lands in Phase 7 alongside email
          and deployment.
        </p>
      </Stack>
    </Stack>
  );
}
