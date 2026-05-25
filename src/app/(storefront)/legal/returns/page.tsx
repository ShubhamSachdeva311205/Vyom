import { Stack } from "@/components/layouts/stack";

export const metadata = { title: "No-returns policy" };

export default function ReturnsPage() {
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <span className="text-eyebrow">Legal · Returns</span>
        <h1 className="text-title">No-returns policy</h1>
        <p className="text-caption">All sales are final.</p>
      </Stack>

      <Stack gap={4} className="text-body">
        <p>
          We don&rsquo;t accept returns or refunds on Advaita
          purchases. This applies to physical books, digital PDFs, and
          audio companions equally.
        </p>
        <p>
          Why so strict? Books are printed in small batches and digital
          access is granted instantly with watermarking — both make
          reversals impossible without exposing future buyers to risk.
        </p>
        <p>
          If a physical book arrives damaged in transit, send us a
          photo via the feedback form within 7 days and we&rsquo;ll
          replace the affected item at no cost.
        </p>
      </Stack>
    </Stack>
  );
}
