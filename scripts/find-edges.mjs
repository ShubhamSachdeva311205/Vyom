/**
 * find-edges.mjs — turn an illustration into an outline/sketch (the After
 * Effects "Find Edges" look), for the Vyom hero colour-reveal (#91).
 *
 * Method: grayscale, then a high-pass via difference-of-blur (|gray − blur(gray)|)
 * which reliably surfaces intensity gradients (= edges) across any image. We
 * boost contrast, then invert → DARK lines on a WHITE background: a clean sketch
 * to stack over the full-colour image and mask-reveal.
 *
 * Run offline at build time (NOT in the browser — convolution/blur per paint
 * would blow the mobile perf budget). Output is a flat PNG.
 *
 * Usage:
 *   node scripts/find-edges.mjs <input> [output] [--blur 1.5] [--strength 4] [--threshold 0] [--transparent]
 *     <input>       any image (png/jpg/webp)
 *     [output]      defaults to <input>-outline.png
 *     --blur        edge thickness / sensitivity (blur sigma). default 1.5
 *     --strength    line contrast multiplier (higher = bolder, darker lines). default 4
 *     --threshold   0–255; >0 hard-cuts faint lines to pure white for a crisp sketch. default 0
 *     --transparent emit black lines on a TRANSPARENT background instead of white
 */
import sharp from "sharp";
import path from "node:path";

const argv = process.argv;
function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}
const hasFlag = (name) => argv.includes(`--${name}`);

const input = argv[2];
if (!input) {
  console.error(
    "Usage: node scripts/find-edges.mjs <input> [output] [--blur 1.5] [--strength 4] [--threshold 0] [--transparent]",
  );
  process.exit(1);
}
const output =
  argv[3] && !argv[3].startsWith("--")
    ? argv[3]
    : `${input.replace(/\.[^.]+$/, "")}-outline.png`;

const blur = Number(arg("blur", 1.5));
const strength = Number(arg("strength", 4));
const threshold = Number(arg("threshold", 0));
const transparent = hasFlag("transparent");

const { width, height } = await sharp(input).metadata();

// Grayscale base + a blurred copy; their difference is the edge response.
const gray = sharp(input).removeAlpha().grayscale();
const grayBuf = await gray.clone().png().toBuffer();
const blurBuf = await gray.clone().blur(blur).png().toBuffer();

// |gray − blur| → bright edges on black; boost contrast; invert → dark on white.
// negate({alpha:false}) so we don't flip the alpha channel to 0 (= invisible).
let edges = sharp(grayBuf)
  .composite([{ input: blurBuf, blend: "difference" }])
  .linear(strength, 0)
  .negate({ alpha: false });
if (threshold > 0) edges = edges.threshold(threshold);

if (transparent) {
  // Line darkness → alpha on solid black: white bg becomes transparent.
  const alpha = await edges.clone().negate().toColourspace("b-w").raw().toBuffer();
  const out = await sharp({
    create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toFile(output);
  console.log(`outline (transparent) → ${path.resolve(output)} (${out.width}×${out.height})`);
} else {
  // Flatten onto white → guaranteed opaque, no stray alpha.
  const out = await edges
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(output);
  console.log(`outline (black on white) → ${path.resolve(output)} (${out.width}×${out.height})`);
}
