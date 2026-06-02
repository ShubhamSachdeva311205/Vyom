/**
 * Pure constants + types for inventory. Lives outside src/actions/
 * because "use server" files can only export async functions.
 *
 * Safe to import from server + client.
 */

export const LOW_STOCK_THRESHOLD = 5;

export type InventoryFilter = "all" | "low" | "out" | "inactive";

export interface InventoryRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  curriculum: string;
  cover_image_url: string | null;
  price_paise: number;
  inventory_count: number;
  is_active: boolean;
}

/** Full book record for the edit drawer. */
export interface BookFull {
  id: string;
  slug: string;
  title: string;
  title_hindi: string | null;
  subtitle: string | null;
  subtitle_hindi: string | null;
  description: string | null;
  description_hindi: string | null;
  curriculum: "ibdp" | "igcse" | "other";
  price_paise: number;
  compare_at_price_paise: number | null;
  inventory_count: number;
  weight_grams: number;
  length_cm: number;
  breadth_cm: number;
  height_cm: number;
  has_audio: boolean;
  has_answer_key: boolean;
  discount_eligible: boolean;
  is_active: boolean;
  cover_image_url: string | null;
  hsn_sac: string;
}
