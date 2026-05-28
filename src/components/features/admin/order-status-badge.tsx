import { Badge } from "@/components/ui/badge";
import { statusLabel, type OrderStatusV2 } from "@/lib/orders/labels";

type Variant = "default" | "secondary" | "outline" | "brand" | "success" | "warning" | "pending" | "destructive";

const VARIANT: Record<OrderStatusV2, Variant> = {
  pending_payment: "pending",
  paid: "destructive", // "needs Mom's action — pack me"
  packed: "warning",
  shipped: "success",
  delivered: "secondary",
  cancelled: "outline",
  refunded: "outline",
  on_hold: "pending",
  partially_refunded: "outline",
};

export function OrderStatusBadge({ status }: { status: OrderStatusV2 }) {
  return <Badge variant={VARIANT[status]}>{statusLabel(status)}</Badge>;
}
