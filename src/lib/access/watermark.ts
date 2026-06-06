import "server-only";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

/**
 * Watermark every page of a PDF with the buyer's identity.
 *
 * Two overlays per page:
 *   1. A large, low-opacity diagonal line across the centre — visible
 *      but not destructive to readability. Repeats the email + order #.
 *   2. A small footer line bottom-centre with the same info + the
 *      download date. Catches screenshots that crop the diagonal.
 *
 * Legal note: watermarking with the customer's email + order number is
 * standard, lawful practice (it identifies leaked copies). We do NOT use
 * the password — it's hashed; we never hold the plaintext.
 */
export async function watermarkPdf(
  input: Uint8Array,
  opts: { email: string; orderNumber: string | null; downloadedOn: string },
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(input, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const id = [
    opts.email,
    opts.orderNumber ? `Order ${opts.orderNumber}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  const footer = `${id}  ·  Downloaded ${opts.downloadedOn}  ·  Personal licensed copy`;

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();

    // Diagonal watermark across the centre.
    const diagText = id || "Licensed copy";
    const diagSize = Math.max(14, Math.min(28, width / Math.max(diagText.length, 1) * 1.6));
    page.drawText(diagText, {
      x: width * 0.12,
      y: height * 0.42,
      size: diagSize,
      font,
      color: rgb(0.55, 0.55, 0.6),
      opacity: 0.16,
      rotate: degrees(32),
    });

    // Footer strip.
    const footSize = 7;
    const footWidth = font.widthOfTextAtSize(footer, footSize);
    page.drawText(footer, {
      x: Math.max(8, (width - footWidth) / 2),
      y: 10,
      size: footSize,
      font,
      color: rgb(0.4, 0.4, 0.45),
      opacity: 0.55,
    });
  }

  return pdf.save();
}

/**
 * Generate a placeholder PDF when a book's answer-key file hasn't been
 * uploaded yet. Lets the whole viewer + watermark pipeline be tested
 * before Mom provides the real files.
 */
export async function placeholderAnswerKeyPdf(bookTitle: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595, 842]); // A4
  const { height } = page.getSize();

  page.drawText("Answer Key", {
    x: 60,
    y: height - 100,
    size: 28,
    font: bold,
    color: rgb(0.1, 0.1, 0.12),
  });
  page.drawText(bookTitle, {
    x: 60,
    y: height - 132,
    size: 14,
    font,
    color: rgb(0.3, 0.3, 0.35),
  });
  page.drawText("The answer key for this book is being prepared.", {
    x: 60,
    y: height - 200,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.45),
  });
  page.drawText("You already have access — it will appear here once uploaded.", {
    x: 60,
    y: height - 220,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.45),
  });

  return pdf.save();
}
