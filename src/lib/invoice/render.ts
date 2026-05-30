import "server-only";
import PDFDocument from "pdfkit";

/**
 * Vyapar-style Tax Invoice renderer (Phase 3.6).
 *
 * Mirrors the layout of Mom's existing Vyapar invoices. Pure
 * server-side: takes a structured payload, returns a PDF Buffer.
 * The caller (api route) handles streaming + auth.
 *
 * pdfkit positioning is in PostScript points (72 pt = 1 inch). A4
 * = 595 × 842 pt. Default margins 50 pt all around.
 */

const RUPEE = "Rs."; // pdfkit's bundled Helvetica lacks the ₹ glyph; use a
                    // text fallback so the PDF doesn't render a tofu box.
const FONT_REG = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";

export interface InvoiceInput {
  invoiceNumber: string;
  invoiceDate: Date;
  orderNumber: string;
  seller: {
    name: string;
    addressLines: string[];
    phone: string;
    email: string;
    gstin?: string;
  };
  billTo: {
    name: string;
    addressLines: string[];
    phone?: string;
    email?: string;
  };
  items: Array<{
    name: string;
    hsnSac: string;
    quantity: number;
    unit: string; // "Pcs", "Book", etc.
    unitPricePaise: number;
    discountPaise: number;
  }>;
  shippingPaise: number;
  /** Optional: total discount allocation across items (computed if not given). */
  subtotalPaise: number;
  totalPaise: number;
  /** Amount received from customer; equal to totalPaise for prepaid Razorpay. */
  receivedPaise: number;
  bank: {
    name: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
  };
  terms?: string[];
}

export function renderInvoicePDF(input: InvoiceInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 36, left: 36, right: 36, bottom: 36 },
        info: {
          Title: `Tax Invoice ${input.invoiceNumber}`,
          Author: input.seller.name,
          Subject: `Order ${input.orderNumber}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      drawInvoice(doc, input);
      doc.end();
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/* ============================================================
 * Internal layout
 * ============================================================ */

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;

function drawInvoice(doc: PDFKit.PDFDocument, input: InvoiceInput): void {
  let y = MARGIN;

  y = drawHeader(doc, input, y);
  y = drawBillTo(doc, input, y + 12);
  y = drawItemsTable(doc, input, y + 12);
  y = drawTotals(doc, input, y + 8);
  y = drawAmountInWords(doc, input, y + 12);
  drawTermsAndBank(doc, input, y + 12);
  drawFooter(doc);
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  // Top border
  doc
    .lineWidth(1)
    .strokeColor("#0f172a")
    .rect(MARGIN, startY, CONTENT_W, 90)
    .stroke();

  // Left half: seller block.
  doc
    .font(FONT_BOLD)
    .fontSize(16)
    .fillColor("#0f172a")
    .text(input.seller.name, MARGIN + 12, startY + 12, { width: CONTENT_W / 2 - 12 });
  doc.font(FONT_REG).fontSize(9);
  let cursor = startY + 32;
  for (const line of input.seller.addressLines) {
    doc.text(line, MARGIN + 12, cursor, { width: CONTENT_W / 2 - 12 });
    cursor += 11;
  }
  doc.text(`Phone: ${input.seller.phone}`, MARGIN + 12, cursor);
  cursor += 11;
  doc.text(`Email: ${input.seller.email}`, MARGIN + 12, cursor);
  if (input.seller.gstin) {
    cursor += 11;
    doc.text(`GSTIN: ${input.seller.gstin}`, MARGIN + 12, cursor);
  }

  // Right half: "Tax Invoice" + meta.
  const rightX = MARGIN + CONTENT_W / 2;
  doc
    .font(FONT_BOLD)
    .fontSize(18)
    .fillColor("#0f172a")
    .text("Tax Invoice", rightX, startY + 14, {
      width: CONTENT_W / 2 - 12,
      align: "right",
    });

  doc.font(FONT_REG).fontSize(9);
  const meta = [
    ["Invoice No.", input.invoiceNumber],
    ["Date", formatDate(input.invoiceDate)],
    ["Order No.", input.orderNumber],
  ];
  let metaY = startY + 42;
  for (const [k, v] of meta) {
    doc.text(`${k}:`, rightX, metaY, {
      width: CONTENT_W / 2 - 90,
      align: "right",
    });
    doc
      .font(FONT_BOLD)
      .text(v, rightX + CONTENT_W / 2 - 90, metaY, {
        width: 78,
        align: "right",
      });
    doc.font(FONT_REG);
    metaY += 12;
  }

  return startY + 90;
}

function drawBillTo(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  const boxH = 70;
  doc
    .lineWidth(1)
    .strokeColor("#0f172a")
    .rect(MARGIN, startY, CONTENT_W, boxH)
    .stroke();

  doc
    .font(FONT_BOLD)
    .fontSize(9)
    .fillColor("#475569")
    .text("BILL TO", MARGIN + 12, startY + 8);

  doc
    .font(FONT_BOLD)
    .fontSize(11)
    .fillColor("#0f172a")
    .text(input.billTo.name, MARGIN + 12, startY + 22);

  doc.font(FONT_REG).fontSize(9);
  let cursor = startY + 36;
  for (const line of input.billTo.addressLines.filter(Boolean)) {
    doc.text(line, MARGIN + 12, cursor, { width: CONTENT_W - 24 });
    cursor += 11;
  }
  if (input.billTo.phone) {
    doc.text(`Phone: ${input.billTo.phone}`, MARGIN + 12, cursor);
    cursor += 11;
  }
  if (input.billTo.email) {
    doc.text(`Email: ${input.billTo.email}`, MARGIN + 12, cursor);
  }

  return startY + boxH;
}

function drawItemsTable(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  // Column layout (sum to CONTENT_W = 523):
  //   #   Item Name   HSN/SAC   Qty   Unit   Price/Unit   Discount   Amount
  //  22    220         60        40    40       55           50       46
  const COLS = [
    { key: "idx", label: "#", width: 22, align: "left" as const },
    { key: "name", label: "Item Name", width: 220, align: "left" as const },
    { key: "hsn", label: "HSN/SAC", width: 60, align: "center" as const },
    { key: "qty", label: "Qty", width: 40, align: "right" as const },
    { key: "unit", label: "Unit", width: 40, align: "center" as const },
    { key: "price", label: `Price/Unit (${RUPEE})`, width: 55, align: "right" as const },
    { key: "disc", label: `Disc (${RUPEE})`, width: 50, align: "right" as const },
    { key: "amt", label: `Amount (${RUPEE})`, width: 46, align: "right" as const },
  ];

  const headerH = 22;
  doc
    .rect(MARGIN, startY, CONTENT_W, headerH)
    .fillColor("#f1f5f9")
    .fill()
    .fillColor("#0f172a");

  doc
    .lineWidth(0.5)
    .strokeColor("#cbd5e1")
    .rect(MARGIN, startY, CONTENT_W, headerH)
    .stroke();

  let colX = MARGIN;
  doc.font(FONT_BOLD).fontSize(8);
  for (const col of COLS) {
    doc.text(col.label, colX + 4, startY + 7, {
      width: col.width - 8,
      align: col.align,
    });
    colX += col.width;
  }

  // Body rows.
  doc.font(FONT_REG).fontSize(9);
  let rowY = startY + headerH;
  for (const [i, item] of input.items.entries()) {
    const rowH = 24;
    doc
      .lineWidth(0.5)
      .strokeColor("#e2e8f0")
      .moveTo(MARGIN, rowY + rowH)
      .lineTo(MARGIN + CONTENT_W, rowY + rowH)
      .stroke();

    const amountPaise = item.unitPricePaise * item.quantity - item.discountPaise;
    const values: Array<{ value: string; col: (typeof COLS)[number] }> = [
      { value: String(i + 1), col: COLS[0] },
      { value: item.name, col: COLS[1] },
      { value: item.hsnSac, col: COLS[2] },
      { value: String(item.quantity), col: COLS[3] },
      { value: item.unit, col: COLS[4] },
      { value: formatINR(item.unitPricePaise), col: COLS[5] },
      { value: formatINR(item.discountPaise), col: COLS[6] },
      { value: formatINR(amountPaise), col: COLS[7] },
    ];

    let cx = MARGIN;
    for (const v of values) {
      doc.text(v.value, cx + 4, rowY + 7, {
        width: v.col.width - 8,
        align: v.col.align,
        ellipsis: true,
      });
      cx += v.col.width;
    }
    rowY += rowH;
  }

  // Shipping line — HSN blank, no discount, amount = shippingPaise.
  if (input.shippingPaise > 0) {
    const rowH = 24;
    doc
      .lineWidth(0.5)
      .strokeColor("#e2e8f0")
      .moveTo(MARGIN, rowY + rowH)
      .lineTo(MARGIN + CONTENT_W, rowY + rowH)
      .stroke();

    const values: Array<{ value: string; col: (typeof COLS)[number] }> = [
      { value: String(input.items.length + 1), col: COLS[0] },
      { value: "Delivery and packaging", col: COLS[1] },
      { value: "", col: COLS[2] },
      { value: "1", col: COLS[3] },
      { value: "Pcs", col: COLS[4] },
      { value: formatINR(input.shippingPaise), col: COLS[5] },
      { value: formatINR(0), col: COLS[6] },
      { value: formatINR(input.shippingPaise), col: COLS[7] },
    ];

    let cx = MARGIN;
    for (const v of values) {
      doc.text(v.value, cx + 4, rowY + 7, {
        width: v.col.width - 8,
        align: v.col.align,
        ellipsis: true,
      });
      cx += v.col.width;
    }
    rowY += rowH;
  }

  // Outer rectangle.
  doc
    .lineWidth(0.7)
    .strokeColor("#0f172a")
    .rect(MARGIN, startY, CONTENT_W, rowY - startY)
    .stroke();

  return rowY;
}

function drawTotals(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  const boxW = 240;
  const boxX = MARGIN + CONTENT_W - boxW;
  const lineH = 16;

  const totalDiscount = input.items.reduce(
    (sum, it) => sum + it.discountPaise,
    0,
  );

  const rows: Array<{ label: string; value: string; bold?: boolean }> = [
    { label: "Sub Total", value: formatINR(input.subtotalPaise) },
  ];
  if (totalDiscount > 0) {
    rows.push({ label: "Discount", value: `- ${formatINR(totalDiscount)}` });
  }
  if (input.shippingPaise > 0) {
    rows.push({ label: "Shipping", value: formatINR(input.shippingPaise) });
  }
  rows.push({ label: "Total", value: formatINR(input.totalPaise), bold: true });
  rows.push({ label: "Received", value: formatINR(input.receivedPaise) });
  rows.push({
    label: "Balance",
    value: formatINR(Math.max(0, input.totalPaise - input.receivedPaise)),
  });

  const boxH = rows.length * lineH + 8;
  doc
    .lineWidth(0.7)
    .strokeColor("#0f172a")
    .rect(boxX, startY, boxW, boxH)
    .stroke();

  let y = startY + 6;
  for (const row of rows) {
    doc
      .font(row.bold ? FONT_BOLD : FONT_REG)
      .fontSize(row.bold ? 11 : 9)
      .fillColor("#0f172a")
      .text(row.label, boxX + 10, y, {
        width: boxW / 2 - 14,
      });
    doc
      .font(row.bold ? FONT_BOLD : FONT_REG)
      .text(row.value, boxX + boxW / 2, y, {
        width: boxW / 2 - 10,
        align: "right",
      });
    y += lineH;
  }

  return startY + boxH;
}

function drawAmountInWords(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  const boxH = 30;
  doc
    .lineWidth(0.7)
    .strokeColor("#0f172a")
    .rect(MARGIN, startY, CONTENT_W, boxH)
    .stroke();

  doc
    .font(FONT_BOLD)
    .fontSize(9)
    .fillColor("#475569")
    .text("Invoice Amount In Words", MARGIN + 10, startY + 6);

  const words = amountInWordsINR(input.totalPaise);
  doc
    .font(FONT_BOLD)
    .fontSize(10)
    .fillColor("#0f172a")
    .text(words, MARGIN + 10, startY + 16, {
      width: CONTENT_W - 20,
    });

  return startY + boxH;
}

function drawTermsAndBank(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  const boxH = 110;
  const halfW = CONTENT_W / 2;

  doc
    .lineWidth(0.7)
    .strokeColor("#0f172a")
    .rect(MARGIN, startY, CONTENT_W, boxH)
    .stroke();

  // Vertical divider
  doc
    .moveTo(MARGIN + halfW, startY)
    .lineTo(MARGIN + halfW, startY + boxH)
    .stroke();

  // Left: Terms.
  doc
    .font(FONT_BOLD)
    .fontSize(9)
    .fillColor("#475569")
    .text("TERMS AND CONDITIONS", MARGIN + 10, startY + 8);

  const terms = input.terms ?? [
    "Thank you for being a valuable customer.",
    "Goods once sold cannot be returned without prior approval.",
    "All disputes subject to Bangalore jurisdiction.",
  ];
  doc.font(FONT_REG).fontSize(8).fillColor("#0f172a");
  let cursor = startY + 22;
  for (const t of terms) {
    doc.text(`• ${t}`, MARGIN + 10, cursor, {
      width: halfW - 20,
    });
    cursor += 14;
  }

  // Right: Bank details.
  doc
    .font(FONT_BOLD)
    .fontSize(9)
    .fillColor("#475569")
    .text("BANK DETAILS", MARGIN + halfW + 10, startY + 8);

  doc.font(FONT_REG).fontSize(9).fillColor("#0f172a");
  const bankRows = [
    ["Bank", input.bank.name],
    ["A/C No.", input.bank.accountNumber],
    ["IFSC", input.bank.ifsc],
    ["Branch", input.bank.branch],
  ];
  let bankY = startY + 24;
  for (const [k, v] of bankRows) {
    doc.font(FONT_REG).text(k, MARGIN + halfW + 10, bankY, { width: 60 });
    doc.font(FONT_BOLD).text(v, MARGIN + halfW + 70, bankY, {
      width: halfW - 80,
    });
    bankY += 13;
  }

  // Authorised signatory at the very bottom-right.
  doc
    .font(FONT_REG)
    .fontSize(9)
    .fillColor("#475569")
    .text("Authorised Signatory", MARGIN + halfW + 10, startY + boxH - 16, {
      width: halfW - 20,
      align: "right",
    });

  return startY + boxH;
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  doc
    .font(FONT_REG)
    .fontSize(8)
    .fillColor("#94a3b8")
    .text("Generated by Advaita · advaita.in", MARGIN, PAGE_H - MARGIN + 6, {
      width: CONTENT_W,
      align: "center",
    });
}

/* ============================================================
 * Helpers
 * ============================================================ */

function formatINR(paise: number): string {
  const rupees = (paise / 100).toFixed(2);
  // Indian number system: 1,23,456.78
  const [intPart, decPart] = rupees.split(".");
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const formatted = rest
    ? rest.replace(/(\d)(?=(\d\d)+$)/g, "$1,") + "," + lastThree
    : lastThree;
  return `${formatted}.${decPart}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]} ${ONES[o]}` : TENS[t];
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (r) parts.push(twoDigits(r));
  return parts.join(" ");
}

/**
 * Indian word-format for an INR amount in paise. e.g. 12500 → "One Hundred
 * Twenty Five Rupees Only". Uses lakh + crore.
 */
function amountInWordsINR(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const paiseRem = paise % 100;
  if (rupees === 0 && paiseRem === 0) return "Zero Rupees Only";

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  let result = parts.join(" ");
  result += " Rupees";
  if (paiseRem) result += ` and ${twoDigits(paiseRem)} Paise`;
  result += " Only";
  return result;
}
