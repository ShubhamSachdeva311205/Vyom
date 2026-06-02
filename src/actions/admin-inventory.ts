"use server";

/**
 * Admin Inventory Server Actions — Phase 5.1 / Issue #62.
 *
 * Reads run via the user-scoped Supabase client (RLS lets admins
 * through). Writes go via SECURITY DEFINER RPC (restock_book) or
 * direct admin-gated table updates with audit log entries.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  LOW_STOCK_THRESHOLD,
  type BookFull,
  type InventoryFilter,
  type InventoryRow,
} from "@/lib/inventory/constants";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function assertAdmin(): Promise<
  | { ok: true; email: string; id: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email) {
    return { ok: false, error: "Not signed in." };
  }
  if (!(await isAdminEmail(user.email))) {
    return { ok: false, error: "Not authorised." };
  }
  return { ok: true, email: user.email, id: user.id };
}

export async function listBooksForInventory(
  filter: InventoryFilter,
): Promise<ActionResult<{ rows: InventoryRow[]; counts: Record<InventoryFilter, number> }>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();

  // deleted_at filter applied everywhere — soft-deleted books are
  // hidden from the inventory UI but stay in the DB so historical
  // order_items keep resolving.
  let query = supabase
    .from("books")
    .select(
      "id, slug, title, subtitle, curriculum, cover_image_url, price_paise, inventory_count, is_active",
    )
    .is("deleted_at" as never, null)
    .order("title", { ascending: true });

  if (filter === "low") {
    query = query.gt("inventory_count", 0).lt("inventory_count", LOW_STOCK_THRESHOLD);
  } else if (filter === "out") {
    query = query.eq("inventory_count", 0);
  } else if (filter === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data: rows, error } = await query;
  if (error) return { success: false, error: error.message };

  // Tab badge counts — fetch in parallel, head-only for speed.
  const base = () =>
    supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .is("deleted_at" as never, null);
  const [all, low, out, inactive] = await Promise.all([
    base(),
    base()
      .gt("inventory_count", 0)
      .lt("inventory_count", LOW_STOCK_THRESHOLD),
    base().eq("inventory_count", 0),
    base().eq("is_active", false),
  ]);

  return {
    success: true,
    data: {
      rows: (rows ?? []) as InventoryRow[],
      counts: {
        all: all.count ?? 0,
        low: low.count ?? 0,
        out: out.count ?? 0,
        inactive: inactive.count ?? 0,
      },
    },
  };
}

/* ============================================================
 * updateBookStock — absolute count via restock_book RPC.
 * ============================================================ */
const stockInput = z.object({
  bookId: z.string().uuid(),
  newCount: z.number().int().min(0).max(100000),
  reason: z.string().trim().max(200).optional(),
});

export async function updateBookStock(
  input: z.input<typeof stockInput>,
): Promise<ActionResult<{ id: string; inventory_count: number }>> {
  const parsed = stockInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "restock_book" as never,
    {
      p_book_id: parsed.data.bookId,
      p_new_count: parsed.data.newCount,
      p_reason: parsed.data.reason ?? null,
    } as never,
  );
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  revalidatePath("/ibdp");
  revalidatePath("/igcse");

  const row = (data as unknown as { id: string; inventory_count: number } | null) ?? null;
  return {
    success: true,
    data: { id: row?.id ?? parsed.data.bookId, inventory_count: row?.inventory_count ?? parsed.data.newCount },
  };
}

/* ============================================================
 * updateBookActive — flip is_active.
 * ============================================================ */
const activeInput = z.object({
  bookId: z.string().uuid(),
  isActive: z.boolean(),
});

export async function updateBookActive(
  input: z.input<typeof activeInput>,
): Promise<ActionResult> {
  const parsed = activeInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { error } = await service
    .from("books")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.bookId);
  if (error) return { success: false, error: error.message };

  await service.from("admin_audit_logs").insert({
    admin_id: gate.id,
    admin_email: gate.email,
    action: "book.set_active",
    target_table: "books",
    target_id: parsed.data.bookId,
    details: { is_active: parsed.data.isActive },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  return { success: true };
}

/* ============================================================
 * updateBookPrice — rupees in / paise stored.
 * ============================================================ */
const priceInput = z.object({
  bookId: z.string().uuid(),
  pricePaise: z.number().int().min(0).max(100000 * 100),
});

export async function updateBookPrice(
  input: z.input<typeof priceInput>,
): Promise<ActionResult> {
  const parsed = priceInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { data: existing } = await service
    .from("books")
    .select("price_paise")
    .eq("id", parsed.data.bookId)
    .maybeSingle();
  const oldPrice = existing?.price_paise ?? null;

  const { error } = await service
    .from("books")
    .update({ price_paise: parsed.data.pricePaise })
    .eq("id", parsed.data.bookId);
  if (error) return { success: false, error: error.message };

  await service.from("admin_audit_logs").insert({
    admin_id: gate.id,
    admin_email: gate.email,
    action: "book.set_price",
    target_table: "books",
    target_id: parsed.data.bookId,
    details: { old_price_paise: oldPrice, new_price_paise: parsed.data.pricePaise },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  return { success: true };
}

/* ============================================================
 * getBookForEdit — full record for the drawer.
 * ============================================================ */
export async function getBookForEdit(bookId: string): Promise<ActionResult<BookFull>> {
  if (!z.string().uuid().safeParse(bookId).success) {
    return { success: false, error: "Invalid book id." };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();
  if (error || !data) return { success: false, error: error?.message ?? "Book not found." };
  return { success: true, data: data as unknown as BookFull };
}

/* ============================================================
 * createBook — admin creates a new title.
 * ============================================================ */
const bookFullSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  title: z.string().trim().min(2).max(200),
  titleHindi: z.string().trim().max(200).optional().or(z.literal("")),
  subtitle: z.string().trim().max(200).optional().or(z.literal("")),
  subtitleHindi: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  descriptionHindi: z.string().trim().max(5000).optional().or(z.literal("")),
  curriculum: z.enum(["ibdp", "igcse", "other"]),
  pricePaise: z.number().int().min(0).max(100000 * 100),
  compareAtPricePaise: z.number().int().min(0).max(100000 * 100).optional(),
  inventoryCount: z.number().int().min(0).max(100000),
  weightGrams: z.number().int().min(1).max(10000),
  lengthCm: z.number().min(0.1).max(200),
  breadthCm: z.number().min(0.1).max(200),
  heightCm: z.number().min(0.1).max(200),
  hasAudio: z.boolean(),
  hasAnswerKey: z.boolean(),
  discountEligible: z.boolean(),
  isActive: z.boolean(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
});

export async function createBook(
  input: z.input<typeof bookFullSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = bookFullSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const d = parsed.data;
  const service = createServiceClient();
  const { data, error } = await service
    .from("books")
    .insert({
      slug: d.slug,
      title: d.title,
      title_hindi: d.titleHindi || null,
      subtitle: d.subtitle || null,
      subtitle_hindi: d.subtitleHindi || null,
      description: d.description || null,
      description_hindi: d.descriptionHindi || null,
      curriculum: d.curriculum,
      price_paise: d.pricePaise,
      compare_at_price_paise: d.compareAtPricePaise ?? null,
      inventory_count: d.inventoryCount,
      weight_grams: d.weightGrams,
      length_cm: d.lengthCm,
      breadth_cm: d.breadthCm,
      height_cm: d.heightCm,
      has_audio: d.hasAudio,
      has_answer_key: d.hasAnswerKey,
      discount_eligible: d.discountEligible,
      is_active: d.isActive,
      cover_image_url: d.coverImageUrl || null,
    } as never)
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A book with that slug already exists." };
    }
    return { success: false, error: error.message };
  }

  await service.from("admin_audit_logs").insert({
    admin_id: gate.id,
    admin_email: gate.email,
    action: "book.create",
    target_table: "books",
    target_id: data.id,
    details: { slug: d.slug, title: d.title },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  revalidatePath(`/${d.curriculum}`);
  return { success: true, data: { id: data.id } };
}

/* ============================================================
 * updateBookFull — patch every editable field.
 * ============================================================ */
const updateFullSchema = bookFullSchema.extend({ id: z.string().uuid() });

export async function updateBookFull(
  input: z.input<typeof updateFullSchema>,
): Promise<ActionResult> {
  const parsed = updateFullSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const d = parsed.data;
  const service = createServiceClient();
  const { error } = await service
    .from("books")
    .update({
      slug: d.slug,
      title: d.title,
      title_hindi: d.titleHindi || null,
      subtitle: d.subtitle || null,
      subtitle_hindi: d.subtitleHindi || null,
      description: d.description || null,
      description_hindi: d.descriptionHindi || null,
      curriculum: d.curriculum,
      price_paise: d.pricePaise,
      compare_at_price_paise: d.compareAtPricePaise ?? null,
      inventory_count: d.inventoryCount,
      weight_grams: d.weightGrams,
      length_cm: d.lengthCm,
      breadth_cm: d.breadthCm,
      height_cm: d.heightCm,
      has_audio: d.hasAudio,
      has_answer_key: d.hasAnswerKey,
      discount_eligible: d.discountEligible,
      is_active: d.isActive,
      cover_image_url: d.coverImageUrl || null,
    } as never)
    .eq("id", d.id);
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A book with that slug already exists." };
    }
    return { success: false, error: error.message };
  }

  await service.from("admin_audit_logs").insert({
    admin_id: gate.id,
    admin_email: gate.email,
    action: "book.update_full",
    target_table: "books",
    target_id: d.id,
    details: { title: d.title },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  revalidatePath(`/${d.curriculum}`);
  return { success: true };
}

/* ============================================================
 * softDeleteBook — hides from storefront + admin lists. Order
 * history keeps referencing the row.
 * ============================================================ */
export async function softDeleteBook(
  input: { bookId: string },
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(input.bookId).success) {
    return { success: false, error: "Invalid book id." };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { error } = await service
    .from("books")
    .update({ deleted_at: new Date().toISOString(), is_active: false } as never)
    .eq("id", input.bookId);
  if (error) return { success: false, error: error.message };

  await service.from("admin_audit_logs").insert({
    admin_id: gate.id,
    admin_email: gate.email,
    action: "book.soft_delete",
    target_table: "books",
    target_id: input.bookId,
    details: null,
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  return { success: true };
}

/* ============================================================
 * uploadCoverImage — accepts a FormData with `file` + `slug`,
 * uploads to Supabase Storage (book-covers bucket), returns the
 * public URL.
 * ============================================================ */
const COVER_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const COVER_MAX_BYTES = 5 * 1024 * 1024;

export async function uploadCoverImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const file = formData.get("file");
  const slug = (formData.get("slug")?.toString() ?? "").trim();
  if (!(file instanceof File)) {
    return { success: false, error: "No file uploaded." };
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: "Slug must be lowercase letters, numbers, and hyphens." };
  }
  if (!COVER_MIME.has(file.type)) {
    return { success: false, error: "Cover must be PNG, JPEG, or WebP." };
  }
  if (file.size > COVER_MAX_BYTES) {
    return { success: false, error: "Cover must be under 5MB." };
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${slug}.${ext}`;

  const service = createServiceClient();
  const { error: uploadErr } = await service.storage
    .from("book-covers")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "31536000",
    });
  if (uploadErr) return { success: false, error: uploadErr.message };

  const { data: publicUrl } = service.storage.from("book-covers").getPublicUrl(path);
  return { success: true, data: { url: publicUrl.publicUrl } };
}
