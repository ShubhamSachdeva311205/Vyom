// One-shot uploader for Mom's book materials.
//
// Maps the Google-Drive download folder → books, then:
//   - answer-key PDFs  → book-pdfs bucket   + books.pdf_r2_key
//   - sample PDFs/PNGs → book-samples bucket + book_samples rows
//   - audio mp3s       → R2 (if configured) else book-audio bucket
//                         + book_audio_tracks rows
//
// Idempotent: clears a book's existing sample/track rows before re-adding.
//
// Run:  node --env-file=.env.local scripts/upload-materials.mjs [--audio-only|--no-audio]
//
// R2: if R2_ACCOUNT_ID + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY +
// R2_AUDIO_BUCKET are set, audio goes to R2 (bucket col = 'r2'); otherwise
// it goes to Supabase local (bucket col = 'supabase') so it's testable now.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";

const ROOT = "/Users/shubhamsachdeva/Downloads/drive-download-20260606T104509Z-3-001";
const args = new Set(process.argv.slice(2));
const AUDIO_ONLY = args.has("--audio-only");
const NO_AUDIO = args.has("--no-audio");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const r2Configured = Boolean(
  process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_AUDIO_BUCKET,
);

// ---- mappings ----------------------------------------------------------
const answerKeys = [
  { slug: "ibdp-hindi-b-hl-reading", file: "All_AnswerKeys/IBDP_AK/उत्तर कुंजी- HL.pdf" },
  { slug: "ibdp-hindi-b-sl-reading", file: "All_AnswerKeys/IBDP_AK/Answer Key SL P2 Reading.pdf" },
  { slug: "igcse-hindi-paper-1", file: "All_AnswerKeys/IGCSE_AK/ANSWER KEY-Shubham IGCSE P1.pdf" },
];

const sampleDirs = [
  { slug: "ibdp-hindi-b-hl-reading", dir: "All_Samples/IB_SAMPLE/HL_READING" },
  { slug: "ibdp-hindi-b-hl-io", dir: "All_Samples/IB_SAMPLE/IOA_HL" },
  { slug: "ibdp-hindi-b-sl-io-new", dir: "All_Samples/IB_SAMPLE/IOA_SL" },
  { slug: "ibdp-hindi-b-shravan-lekhan", dir: "All_Samples/IB_SAMPLE/Listening_Book" },
  { slug: "ibdp-hindi-b-sl-reading", dir: "All_Samples/IB_SAMPLE/ReadingSL" },
  { slug: "ibdp-hindi-b-writing-skills", dir: "All_Samples/IB_SAMPLE/Writing_Skills" },
  { slug: "igcse-hindi-paper-2-listening", dir: "All_Samples/IG_SAMPLE/LIstening" },
  { slug: "igcse-hindi-paper-1", dir: "All_Samples/IG_SAMPLE/ReadingAndWriting" },
];

const audioDirs = [
  { slug: "ibdp-hindi-b-sl-io-new", dir: "All_Audios/IBDP/Shubham_IBDP_Hindi_B_SL_IOA_Audio" },
  { slug: "ibdp-hindi-b-shravan-lekhan", dir: "All_Audios/IBDP/SHUBHAM-IBDP_HINDI_B_SL_AND_HL_LISTENING_AUDIO" },
  { slug: "igcse-hindi-paper-2-listening", dir: "All_Audios/IGCSE/SHUBHAM-IGCSE_HINDI_AS_A _SECOND_LANGUAGE_LISTENING_AUDIO" },
];

const bookIdBySlug = new Map();
async function loadBooks() {
  const { data, error } = await supabase.from("books").select("id, slug");
  if (error) throw error;
  for (const b of data) bookIdBySlug.set(b.slug, b.id);
}

// Natural sort so QP2 comes before QP10 (not lexicographic).
const natColl = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
function listFiles(dir, exts) {
  const abs = join(ROOT, dir);
  try {
    return readdirSync(abs)
      .filter((f) => !f.startsWith(".") && exts.includes(extname(f).toLowerCase()))
      .map((f) => join(abs, f))
      .filter((p) => statSync(p).isFile())
      .sort((a, b) => natColl.compare(basename(a), basename(b)));
  } catch {
    return [];
  }
}

function mime(p) {
  const e = extname(p).toLowerCase();
  if (e === ".pdf") return "application/pdf";
  if (e === ".png") return "image/png";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".mp3") return "audio/mpeg";
  return "application/octet-stream";
}

async function uploadAnswerKeys() {
  for (const { slug, file } of answerKeys) {
    const bookId = bookIdBySlug.get(slug);
    if (!bookId) { console.warn("  skip AK, no book:", slug); continue; }
    const abs = join(ROOT, file);
    const key = `${slug}.pdf`;
    const bytes = readFileSync(abs);
    const { error } = await supabase.storage.from("book-pdfs").upload(key, bytes, {
      upsert: true, contentType: "application/pdf",
    });
    if (error) { console.error("  AK upload failed", slug, error.message); continue; }
    await supabase.from("books").update({ pdf_r2_key: key, has_answer_key: true }).eq("id", bookId);
    console.log("  ✓ answer key:", slug);
  }
}

async function uploadSamples() {
  for (const { slug, dir } of sampleDirs) {
    const bookId = bookIdBySlug.get(slug);
    if (!bookId) { console.warn("  skip samples, no book:", slug); continue; }
    const files = listFiles(dir, [".pdf", ".png", ".jpg", ".jpeg"]);
    if (files.length === 0) { console.warn("  no sample files in", dir); continue; }
    await supabase.from("book_samples").delete().eq("book_id", bookId);
    let i = 0;
    for (const f of files) {
      const isPdf = extname(f).toLowerCase() === ".pdf";
      const key = `${slug}/${i}${extname(f).toLowerCase()}`;
      const { error } = await supabase.storage.from("book-samples").upload(key, readFileSync(f), {
        upsert: true, contentType: mime(f),
      });
      if (error) { console.error("  sample upload failed", f, error.message); continue; }
      await supabase.from("book_samples").insert({
        book_id: bookId, storage_key: key, kind: isPdf ? "pdf" : "image", sort_order: i,
      });
      i++;
    }
    console.log(`  ✓ samples: ${slug} (${i})`);
  }
}

async function uploadAudio() {
  let putR2 = null;
  if (r2Configured) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    putR2 = async (key, bytes) =>
      s3.send(new PutObjectCommand({
        Bucket: process.env.R2_AUDIO_BUCKET, Key: key, Body: bytes, ContentType: "audio/mpeg",
      }));
  }
  const bucketCol = r2Configured ? "r2" : "supabase";
  console.log(`  audio → ${r2Configured ? "R2" : "Supabase local"}`);

  for (const { slug, dir } of audioDirs) {
    const bookId = bookIdBySlug.get(slug);
    if (!bookId) { console.warn("  skip audio, no book:", slug); continue; }
    const files = listFiles(dir, [".mp3"]);
    if (files.length === 0) { console.warn("  no audio in", dir); continue; }
    await supabase.from("book_audio_tracks").delete().eq("book_id", bookId);
    let i = 0;
    for (const f of files) {
      const key = `${slug}/${i}-${basename(f).replace(/[^\w.\-]+/g, "_")}`;
      const bytes = readFileSync(f);
      if (r2Configured) {
        await putR2(key, bytes);
      } else {
        const { error } = await supabase.storage.from("book-audio").upload(key, bytes, {
          upsert: true, contentType: "audio/mpeg",
        });
        if (error) { console.error("  audio upload failed", f, error.message); continue; }
      }
      const title = basename(f, extname(f));
      await supabase.from("book_audio_tracks").insert({
        book_id: bookId, title, storage_key: key, bucket: bucketCol, sort_order: i,
      });
      i++;
      if (i % 5 === 0) console.log(`    ${slug}: ${i}/${files.length}`);
    }
    await supabase.from("books").update({ has_audio: true }).eq("id", bookId);
    console.log(`  ✓ audio: ${slug} (${i} tracks)`);
  }
}

async function main() {
  await loadBooks();
  console.log("Books loaded:", bookIdBySlug.size);
  if (!AUDIO_ONLY) {
    console.log("Answer keys…"); await uploadAnswerKeys();
    console.log("Samples…"); await uploadSamples();
  }
  if (!NO_AUDIO) {
    console.log("Audio…"); await uploadAudio();
  }
  console.log("Done.");
}
main().catch((e) => { console.error(e); process.exit(1); });
