import "server-only";
import { randomBytes } from "node:crypto";

/**
 * Vendor coupon code generator.
 *
 * Format: VND-XXXX-XXXX
 *   - VND prefix marks it as a vendor code in lists at a glance
 *   - Two 4-char chunks separated by hyphens (easy to read aloud)
 *   - Alphabet excludes ambiguous glyphs: 0/O, 1/I/L
 *
 * 32 alphabet × 8 random chars = 32^8 = ~1.1 trillion combinations.
 * Collisions are vanishingly unlikely at our volume; the DB UNIQUE
 * constraint on coupons.code is the final guard either way.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateVendorCode(): string {
  const bytes = randomBytes(8);
  const chars: string[] = [];
  for (let i = 0; i < 8; i++) {
    chars.push(ALPHABET[bytes[i] % ALPHABET.length]);
  }
  return `VND-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}`;
}
