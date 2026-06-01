import { type NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { renderInvoicePDF } from "@/lib/invoice/render";
import { getBankDetails, getSellerDetails } from "@/lib/settings/queries";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/orders/[id]/invoice.pdf
 *
 * Streams the Vyapar-style Tax Invoice for an order. Auth-gated:
 * the signed-in user must own the order, OR be on the admin
 * allowlist. Idempotent invoice numbering — first hit allocates
 * via the `next_invoice_number()` RPC + stamps the row; later
 * hits reuse the same number.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await context.params;

  // 1. AuthN
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // 2. AuthZ — owner OR admin. Accept either UUID id or order_number
  // so the route is shareable with the human-readable identifier.
  const service = createServiceClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
  const lookup = isUuid
    ? service.from("orders").select("*").eq("id", orderId)
    : service.from("orders").select("*").eq("order_number", orderId);
  const { data: order } = await lookup.maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const isOwner = order.user_id === user.id;
  const isAdmin = await isAdminEmail(user.email ?? "");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Allocate invoice_number on first hit. Idempotent: subsequent
  //    GETs reuse the stamped number so reprints are stable.
  // Columns added in migration 20260530133804 — not yet in generated types.
  const orderExtra = order as unknown as {
    invoice_number: string | null;
    invoice_generated_at: string | null;
  };
  let invoiceNumber = orderExtra.invoice_number;
  let invoiceGeneratedAt = orderExtra.invoice_generated_at
    ? new Date(orderExtra.invoice_generated_at)
    : null;
  if (!invoiceNumber) {
    const { data: alloc, error: allocErr } = await service.rpc(
      "next_invoice_number" as never,
    );
    if (allocErr || !alloc) {
      return NextResponse.json(
        { error: "Could not allocate invoice number" },
        { status: 500 },
      );
    }
    invoiceNumber = alloc as unknown as string;
    invoiceGeneratedAt = new Date();
    await service
      .from("orders")
      .update({
        invoice_number: invoiceNumber,
        invoice_generated_at: invoiceGeneratedAt.toISOString(),
      } as never)
      .eq("id", order.id);
  }

  // 4. Hydrate items + customer.
  const { data: items } = await service
    .from("order_items")
    .select("*, book:books(id, title, hsn_sac)")
    .eq("order_id", order.id);

  const { data: customer } = await service
    .from("users")
    .select("email, full_name")
    .eq("id", order.user_id)
    .maybeSingle();

  // 5. Map to renderer input. Discount is currently order-level; we
  //    pro-rate it across discount-eligible lines so per-item Disc
  //    columns sum to the order discount. Edge case: when subtotal=0
  //    (all-free order), skip pro-rate.
  type ItemRow = {
    id: string;
    quantity: number;
    unit_price_paise: number;
    book: { title?: string | null } | null;
  };
  const rows = (items ?? []) as ItemRow[];

  const subtotalPaise = order.subtotal_paise;
  const totalDiscount = order.discount_paise;
  const renderItems = rows.map((it) => {
    const lineSubtotal = it.unit_price_paise * it.quantity;
    const share =
      subtotalPaise > 0
        ? Math.round((lineSubtotal / subtotalPaise) * totalDiscount)
        : 0;
    return {
      name: it.book?.title ?? "Book",
      quantity: it.quantity,
      unit: "Pcs",
      unitPricePaise: it.unit_price_paise,
      discountPaise: share,
    };
  });

  type ShipAddr = {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
    phone?: string | null;
  };
  const addr = (order.shipping_address ?? null) as ShipAddr | null;

  const shipToAddressLines: string[] = [];
  if (addr) {
    if (addr.line1) shipToAddressLines.push(addr.line1);
    if (addr.line2) shipToAddressLines.push(addr.line2);
    const cityLine = [addr.city, addr.state, addr.pincode]
      .filter(Boolean)
      .join(", ");
    if (cityLine) shipToAddressLines.push(cityLine);
    if (addr.country) shipToAddressLines.push(addr.country);
  }
  // Older test orders may have no shipping_address. Show a clear
  // placeholder rather than a blank box.
  if (shipToAddressLines.length === 0) {
    shipToAddressLines.push("Address not captured at checkout.");
  }

  // Pull invoice header/footer from admin-managed settings (Phase 5.5).
  // Both fall back to hardcoded values if the rows are missing — so
  // older deploys never crash on a missing settings row.
  const [sellerDetails, bankDetails] = await Promise.all([
    getSellerDetails(),
    getBankDetails(),
  ]);

  let pdf: Buffer;
  try {
    pdf = await renderInvoicePDF({
      invoiceNumber,
      invoiceDate: invoiceGeneratedAt ?? new Date(),
      orderNumber: order.order_number,
      seller: {
        name: sellerDetails.name,
        addressLines: sellerDetails.addressLines,
        phone: sellerDetails.phone,
        email: sellerDetails.email,
        gstin: sellerDetails.gstin ?? undefined,
      },
      shipTo: {
        name: addr?.name ?? customer?.full_name ?? "Customer",
        addressLines: shipToAddressLines,
        phone: addr?.phone ?? undefined,
        email: customer?.email ?? undefined,
      },
      items: renderItems,
      shippingPaise: order.shipping_paise,
      subtotalPaise: order.subtotal_paise,
      totalPaise: order.total_paise,
      receivedPaise: order.status === "pending_payment" ? 0 : order.total_paise,
      bank: {
        name: bankDetails.name,
        accountNumber: bankDetails.accountNumber,
        ifsc: bankDetails.ifsc,
        branch: bankDetails.branch,
      },
    });
  } catch (err) {
    console.error("[invoice.pdf] render failed:", err);
    const detail =
      process.env.NODE_ENV !== "production" && err instanceof Error
        ? err.message
        : "Render failed";
    return NextResponse.json({ error: detail }, { status: 500 });
  }

  // Wrap as a single-chunk ReadableStream so NextResponse's BodyInit
  // accepts it without typings squabbling about Uint8Array vs Buffer.
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(pdf));
      controller.close();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `inline; filename="invoice-${invoiceNumber.replace(/\//g, "-")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
