import { type NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/orders.xlsx?from=ISO&to=ISO
 *
 * Admin-only Excel export of orders in a date range (#72). Text cells are
 * formula-injection-neutralized (leading =/+/-/@ prefixed with ') so a
 * customer-supplied name/address can't execute when opened in Excel.
 */
function safeText(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
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

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Orders");
  ws.columns = [
    { header: "Order #", key: "order", width: 16 },
    { header: "Date", key: "date", width: 12 },
    { header: "Status", key: "status", width: 14 },
    { header: "Customer", key: "customer", width: 22 },
    { header: "Email", key: "email", width: 26 },
    { header: "Pincode", key: "pincode", width: 10 },
    { header: "City", key: "city", width: 16 },
    { header: "Coupon", key: "coupon", width: 14 },
    { header: "Subtotal (Rs)", key: "subtotal", width: 14 },
    { header: "Discount (Rs)", key: "discount", width: 14 },
    { header: "Shipping (Rs)", key: "shipping", width: 14 },
    { header: "Total (Rs)", key: "total", width: 14 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const o of orders ?? []) {
    const u = (o as unknown as { user: { email: string; full_name: string | null } | null }).user;
    const addr = (o.shipping_address ?? null) as { city?: string | null } | null;
    ws.addRow({
      order: safeText(o.order_number),
      date: new Date(o.created_at).toISOString().slice(0, 10),
      status: o.status,
      customer: safeText(u?.full_name ?? ""),
      email: safeText(u?.email ?? ""),
      pincode: safeText(o.shipping_pincode ?? ""),
      city: safeText(addr?.city ?? ""),
      coupon: safeText((o as unknown as { coupon_code: string | null }).coupon_code ?? ""),
      subtotal: o.subtotal_paise / 100,
      discount: o.discount_paise / 100,
      shipping: o.shipping_paise / 100,
      total: o.total_paise / 100,
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="vyom-orders-${from.slice(0, 10)}-to-${to.slice(0, 10)}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
