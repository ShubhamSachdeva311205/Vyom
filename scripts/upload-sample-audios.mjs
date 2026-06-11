// Uploads short audio preview clips → book-samples bucket + book_samples
// rows (kind='audio'), so the "View sample" dialog can play a listening
// preview. Complements upload-materials.mjs (which handles pdf/image
// samples + full audio tracks). Idempotent: clears a book's existing
// audio-sample rows before re-adding.
//
// Run:  node --env-file=.env.local scripts/upload-sample-audios.mjs
//
// Maps each audio-having book to one preview clip from the Drive download.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = "/Users/shubhamsachdeva/Downloads/drive-download-20260606T104509Z-3-001";

// slug → sample-audio file (relative to ROOT)
const SAMPLE_AUDIOS = [
  {
    slug: "igcse-hindi-paper-2-listening",
    file: "All_Samples/Sample_Audios/IGCSE/SAMPLE_1_Listening.mp3",
  },
  {
    slug: "ibdp-hindi-b-shravan-lekhan",
    file: "All_Samples/Sample_Audios/IBDP/SAMPLE_3_Listening.mp3",
  },
  {
    slug: "ibdp-hindi-b-sl-io-new",
    file: "All_Samples/Sample_Audios/IBDP/sample_2_1_Listening.mp3",
  },
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

for (const { slug, file } of SAMPLE_AUDIOS) {
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!book) {
    console.warn(`! no book for slug ${slug} — skipping`);
    continue;
  }

  const ext = extname(file) || ".mp3";
  const key = `${slug}/audio-0${ext}`;
  const bytes = readFileSync(join(ROOT, file));

  const { error: upErr } = await supabase.storage
    .from("book-samples")
    .upload(key, bytes, { contentType: "audio/mpeg", upsert: true });
  if (upErr) {
    console.error(`✗ upload failed for ${slug}:`, upErr.message);
    continue;
  }

  // Idempotency: clear existing audio samples for this book, then insert.
  await supabase.from("book_samples").delete().eq("book_id", book.id).eq("kind", "audio");
  const { error: insErr } = await supabase.from("book_samples").insert({
    book_id: book.id,
    kind: "audio",
    storage_key: key,
    sort_order: 1,
  });
  if (insErr) {
    console.error(`✗ row insert failed for ${slug}:`, insErr.message);
    continue;
  }
  console.log(`✓ ${slug} ← ${file} (${(bytes.length / 1024).toFixed(0)} KB)`);
}

console.log("Done.");
