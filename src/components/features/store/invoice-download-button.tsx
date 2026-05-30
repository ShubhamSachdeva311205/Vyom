import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * InvoiceDownloadButton — opens the Tax Invoice PDF for an order in
 * a new tab. The PDF is rendered server-side at
 * /api/orders/[id]/invoice.pdf with auth gating + idempotent
 * invoice numbering (Phase 3.6).
 *
 * Replaces PrintReceiptButton, which was the print-CSS interim
 * (Issue #77).
 */
export function InvoiceDownloadButton({
  orderId,
  variant = "outline",
  className,
}: {
  orderId: string;
  variant?: "default" | "outline";
  className?: string;
}) {
  return (
    <Button
      asChild
      type="button"
      variant={variant}
      size="md"
      className={className}
    >
      <a
        href={`/api/orders/${orderId}/invoice.pdf`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Download className="size-4" aria-hidden="true" />
        Download invoice
      </a>
    </Button>
  );
}
