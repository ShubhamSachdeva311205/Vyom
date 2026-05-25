"use client";

import { Button } from "@/components/ui/button";
import { Row } from "@/components/layouts/stack";
import { toast } from "@/components/ui/toaster";

/**
 * Small client island that triggers each toast variant. Lives alongside
 * the playground page so the rest of /design-tokens stays a server
 * component.
 */
export function ToastDemoButtons() {
  return (
    <Row gap={2} wrap>
      <Button size="sm" variant="outline" onClick={() => toast("Default toast")}>
        Default
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast.success("Order shipped", { description: "Tracking: BLR12345" })}
      >
        Success
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          toast.warning("Inventory low", { description: "Only 3 copies of IBDP Chemistry left." })
        }
      >
        Warning
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          toast.error("Coupon invalid", { description: "STUDENT10 is already redeemed." })
        }
      >
        Error
      </Button>
    </Row>
  );
}
