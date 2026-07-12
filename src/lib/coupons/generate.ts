import "server-only";
import { randomInt } from "node:crypto";

/**
 * Vendor coupon code generator.
 *
 * Format: VND-XXXX-XXXX
 *   - VND prefix marks it as a vendor code in lists at a glance
 *   - Two 4-char chunks separated by hyphens (easy to read aloud)
 *   - Alphabet excludes ambiguous glyphs: 0/O, 1/I/L
 *
 * 31-char alphabet × 8 random chars = 31^8 ≈ 852 billion combinations.
 * Collisions are vanishingly unlikely at our volume; the DB UNIQUE
 * constraint on coupons.code is the final guard either way.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 chars

export function generateVendorCode(): string {
  const chars: string[] = [];
  for (let i = 0; i < 8; i++) {
    // crypto.randomInt is uniform over [0, len) — no modulo bias.
    chars.push(ALPHABET[randomInt(0, ALPHABET.length)]);
  }
  return `VND-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}`;
}
