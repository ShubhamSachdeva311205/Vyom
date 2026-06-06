import "server-only";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

/**
 * Cloudflare R2 client (S3-compatible). Used for audio — R2 has zero
 * egress fees, which matters because listening books are 600MB+ of
 * streamed mp3.
 *
 * Server-only. Configured via four env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_AUDIO_BUCKET
 *
 * Until those are set, isR2Configured() returns false and callers fall
 * back to Supabase Storage (the `bucket` column on book_audio_tracks
 * records where each file actually lives).
 */

let _client: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_AUDIO_BUCKET,
  );
}

function getClient(): S3Client {
  if (_client) return _client;
  if (!isR2Configured()) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
        "R2_SECRET_ACCESS_KEY, R2_AUDIO_BUCKET in .env.local.",
    );
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return _client;
}

export const R2_AUDIO_BUCKET = env.R2_AUDIO_BUCKET ?? "";

export interface R2ObjectResult {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: number;
  /** Present when a Range request was satisfied. */
  contentRange?: string;
  status: 200 | 206;
}

/**
 * Fetch an object from R2, forwarding an optional HTTP Range header so
 * the <audio> element can seek. R2 honours Range natively, so we pass
 * it straight through and stream the response body.
 */
export async function getR2Object(
  bucket: string,
  key: string,
  range?: string | null,
): Promise<R2ObjectResult | null> {
  try {
    const client = getClient();
    const res = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: range ?? undefined,
      }),
    );
    if (!res.Body) return null;
    return {
      // In the Node/edge runtime the SDK returns a web ReadableStream.
      body: res.Body.transformToWebStream(),
      contentType: res.ContentType ?? "application/octet-stream",
      contentLength: res.ContentLength ?? 0,
      contentRange: res.ContentRange,
      status: range && res.ContentRange ? 206 : 200,
    };
  } catch (err) {
    console.error("[r2] getObject failed:", err);
    return null;
  }
}

/** Upload bytes to R2 (used by the audio upload script / admin). */
export async function putR2Object(
  bucket: string,
  key: string,
  body: Uint8Array | Buffer,
  contentType: string,
): Promise<boolean> {
  try {
    const client = getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return true;
  } catch (err) {
    console.error("[r2] putObject failed:", err);
    return false;
  }
}
