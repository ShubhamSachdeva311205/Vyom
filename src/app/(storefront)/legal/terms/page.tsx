import { Stack } from "@/components/layouts/stack";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <span className="text-eyebrow">Legal · Terms</span>
        <h1 className="text-title">Terms of service</h1>
        <p className="text-caption">
          Last updated: <span className="text-mono">2026-05-26</span> · Draft
        </p>
      </Stack>

      <Stack gap={4} className="prose prose-sm max-w-none text-body">
        <p>
          These terms govern your use of the Advaita store and community.
          Full legal text is being prepared with counsel. The shipping
          policy is the binding short version below:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-body">
          <li>Orders are accepted only after Razorpay confirms payment.</li>
          <li>
            Shipping inside Bangalore is free for any order; outside
            Bangalore, free under ₹100, Delhivery rates otherwise.
          </li>
          <li>
            Digital access is granted via a single-use magic link tied to
            your email. The link must not be shared.
          </li>
          <li>
            Discount codes <span className="text-mono">student10</span> and{" "}
            <span className="text-mono">teacher10</span> are limited to one
            use per email. Vendor codes are single-use only.
          </li>
        </ul>
        <p className="text-caption">
          The full document lands in Phase 2 alongside auth and payments.
        </p>
      </Stack>
    </Stack>
  );
}
