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
