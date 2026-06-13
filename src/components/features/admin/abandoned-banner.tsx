"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clearAbandonedOrders } from "@/actions/admin-orders";
import { Button } from "@/components/ui/button";
import { Row, Stack } from "@/components/layouts/stack";

/**
 * Abandoned-checkout banner (#84). Shows only when there are
 * pending_payment rows past the TTL. The cron sweeps these every 15 min;
 * this is the manual backstop + at-a-glance visibility for Mom.
 */
export function AbandonedBanner({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (count <= 0) return null;

  function clear() {
    start(async () => {
      const res = await clearAbandonedOrders();
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      const n = res.data?.cancelled ?? 0;
      setCount(0);
      toast.success(n === 1 ? "Cleared 1 abandoned checkout." : `Cleared ${n} abandoned checkouts.`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <Row gap={3} justify="between" align="center" className="flex-wrap">
        <Stack gap={1}>
          <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {count} abandoned checkout{count === 1 ? "" : "s"}
          </span>
          <span className="text-caption text-amber-800/80 dark:text-amber-200/70">
            Customers who opened payment but never paid (older than 30 min). They auto-clear, or
            cancel them now.
          </span>
        </Stack>
        <Button variant="outline" size="sm" onClick={clear} disabled={pending}>
          <Trash2 className="size-4" aria-hidden="true" />
          {pending ? "Clearing…" : "Clear now"}
        </Button>
      </Row>
    </div>
  );
}
