import "server-only";

/**
 * Audio anti-rip range helpers (#119).
 *
 * The streaming routes must never hand back the entire file body in one
 * response — that turns "Save network response" into a one-click rip. So
 * every audio response is bounded:
 *
 *   - A request with NO `Range` header gets a small initial 206 chunk
 *     (enough to start playback) plus `Accept-Ranges`, forcing the player
 *     to seek the rest in pieces instead of pulling the whole file.
 *   - A request WITH a `Range` is clamped to `AUDIO_MAX_CHUNK` so an
 *     open-ended `bytes=0-` can't drain the file in a single shot.
 *
 * This is friction, not DRM — a patient script can still walk the ranges
 * (and per-IP rate limiting bounds how fast). Legible legit playback is
 * unaffected: browsers request ranges and continue past 206 normally.
 */

/** Initial bytes handed to a no-Range request (enough to start playback). */
export const AUDIO_INITIAL_CHUNK = 512 * 1024; // 512 KB
/** Hard cap on any single served chunk. */
export const AUDIO_MAX_CHUNK = 1024 * 1024; // 1 MB

export interface ResolvedRange {
  start: number;
  end: number; // inclusive
}

/**
 * Resolve a bounded byte range for a known-length buffer (Supabase /
 * sample paths). Always returns a partial slice — never the full body.
 * Returns "unsatisfiable" when the requested start is out of bounds.
 */
export function resolveBufferRange(
  rangeHeader: string | null,
  total: number,
): ResolvedRange | "unsatisfiable" {
  if (total <= 0) return "unsatisfiable";

  if (!rangeHeader) {
    return { start: 0, end: Math.min(AUDIO_INITIAL_CHUNK - 1, total - 1) };
  }

  const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);

  // Suffix range: bytes=-N (no start byte, only suffix length).
  // Without this guard, m[1]=="" is falsy so start defaults to 0 and the
  // range is mis-parsed as bytes=0-N (first N bytes instead of last N bytes).
  if (m && m[1] === "" && m[2]) {
    const suffixLength = parseInt(m[2], 10);
    if (Number.isNaN(suffixLength) || suffixLength <= 0) return "unsatisfiable";
    const start = Math.max(0, total - suffixLength);
    let end = total - 1;
    // Clamp chunk size so a single response can't drain the whole file.
    if (end - start + 1 > AUDIO_MAX_CHUNK) end = start + AUDIO_MAX_CHUNK - 1;
    return { start, end };
  }

  const start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : total - 1;

  if (Number.isNaN(start) || start < 0 || start >= total) return "unsatisfiable";
  if (Number.isNaN(end) || end >= total) end = total - 1;
  if (end < start) return "unsatisfiable";

  // Clamp chunk size so a single response can't drain the whole file.
  if (end - start + 1 > AUDIO_MAX_CHUNK) end = start + AUDIO_MAX_CHUNK - 1;

  return { start, end };
}

/**
 * Build the bounded `Range` header to forward to R2 (object length is
 * unknown up front; R2 clamps an over-long end to the real file end).
 * A no-Range request becomes a small initial chunk; an open-ended or
 * oversized range is capped to AUDIO_MAX_CHUNK.
 */
export function boundedR2Range(rangeHeader: string | null): string {
  if (!rangeHeader) return `bytes=0-${AUDIO_INITIAL_CHUNK - 1}`;

  const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);

  // Suffix range: bytes=-N — cap to AUDIO_MAX_CHUNK and forward to R2
  // (R2 handles suffix ranges natively). Without this guard the empty
  // start group is treated as 0, producing bytes=0-N instead.
  if (m && m[1] === "" && m[2]) {
    const suffixLength = parseInt(m[2], 10);
    if (!Number.isNaN(suffixLength) && suffixLength > 0) {
      return `bytes=-${Math.min(suffixLength, AUDIO_MAX_CHUNK)}`;
    }
    // Malformed — fall back to initial chunk
    return `bytes=0-${AUDIO_INITIAL_CHUNK - 1}`;
  }

  const start = m && m[1] ? parseInt(m[1], 10) : 0;
  const safeStart = Number.isNaN(start) || start < 0 ? 0 : start;
  const hasEnd = !!(m && m[2]);
  let end = hasEnd ? parseInt(m[2]!, 10) : safeStart + AUDIO_MAX_CHUNK - 1;

  if (Number.isNaN(end) || end - safeStart + 1 > AUDIO_MAX_CHUNK) {
    end = safeStart + AUDIO_MAX_CHUNK - 1;
  }

  return `bytes=${safeStart}-${end}`;
}
