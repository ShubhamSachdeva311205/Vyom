"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PrintReceiptButton — opens the browser's print dialog with the
 * print-friendly view (controlled by `@media print` in globals.css +
 * `print:*` Tailwind utilities scattered across the page).
 *
 * From the print dialog the user can pick "Save as PDF" as the
 * destination — that's the "download receipt as PDF" path until we
 * ship server-side PDF generation (Phase 7 transactional emails).
 */
export function PrintReceiptButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      onClick={() => window.print()}
      className={className}
    >
      <Printer className="size-4" aria-hidden="true" />
      Print / save as PDF
    </Button>
  );
}
