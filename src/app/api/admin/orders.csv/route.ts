import { type NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/orders.csv?from=ISO&to=ISO
 *
 * Admin-only CSV export of orders in a date range. Each cell is escaped
 * AND CSV-injection-neutralized (a leading =/+/-/@/tab is prefixed with
 * a single quote) so opening it in Excel can't execute a formula from a
 * customer-supplied name/address.
 */
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  // Formula-injection guard.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  // Standard CSV quoting.
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await isAdminEmail(user.email)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const from = req.nextUrl.searchParams.get("from") ?? "1970-01-01";
  const to = req.nextUrl.searchParams.get("to") ?? "2999-12-31";

  const service = createServiceClient();
  const { data: orders } = await service
    .from("orders")
    .select(
      `order_number, status, total_paise, subtotal_paise, discount_paise, shipping_paise,
       coupon_code, shipping_pincode, shipping_address, created_at,
       user:users(email, full_name)`,
    )
    .gte("created_at", from)
    .lte("created_at", to)
    .neq("status", "pending_payment")
    .order("created_at", { ascending: false });

  const header = [
    "Order #",
    "Date",
    "Status",
    "Customer",
    "Email",
    "Pincode",
    "City",
    "Coupon",
    "Subtotal (Rs)",
    "Discount (Rs)",
    "Shipping (Rs)",
    "Total (Rs)",
  ];
  const lines = [header.map(csvCell).join(",")];

  for (const o of orders ?? []) {
    const u = (o as unknown as { user: { email: string; full_name: string | null } | null }).user;
    const addr = (o.shipping_address ?? null) as { city?: string | null } | null;
    lines.push(
      [
        o.order_number,
        new Date(o.created_at).toISOString().slice(0, 10),
        o.status,
        u?.full_name ?? "",
        u?.email ?? "",
        o.shipping_pincode ?? "",
        addr?.city ?? "",
        (o as unknown as { coupon_code: string | null }).coupon_code ?? "",
        (o.subtotal_paise / 100).toFixed(2),
        (o.discount_paise / 100).toFixed(2),
        (o.shipping_paise / 100).toFixed(2),
        (o.total_paise / 100).toFixed(2),
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const csv = lines.join("\r\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="advaita-orders-${from.slice(0, 10)}-to-${to.slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
