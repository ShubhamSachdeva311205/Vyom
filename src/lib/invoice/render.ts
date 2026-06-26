import "server-only";
import PDFDocument from "pdfkit";

/**
 * Tax Invoice renderer (Phase 3.6, revised 2026-06-01).
 *
 * Vyapar-style layout, simplified for Mom's pre-GSTIN reality:
 *   - HSN/SAC column removed — confusing for a non-GST-registered
 *     seller; we'll add it back when she gets a GSTIN.
 *   - Authorised-signatory line removed per user.
 *   - Bill-To/Ship-To unified into "Ship To" since storefront orders
 *     bill + ship to the same address. Name + phone prominent so Mom
 *     can call the customer.
 *   - Column widths balanced + text widths set on every text() call
 *     so nothing leaks past its column.
 *
 * Pure server-side: takes structured payload, returns PDF Buffer.
 * Route handles streaming + auth.
 */

const RUPEE = "Rs."; // pdfkit's bundled Helvetica lacks the ₹ glyph;
                    // "Rs." renders cleanly without bundling a font.
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
  /** Customer + delivery details. Single block (billing = shipping for B2C). */
  shipTo: {
    name: string;
    phone?: string;
    email?: string;
    addressLines: string[];
  };
  items: Array<{
    name: string;
    quantity: number;
    unit: string; // "Pcs", "Book", etc.
    unitPricePaise: number;
    discountPaise: number;
  }>;
  shippingPaise: number;
  subtotalPaise: number;
  totalPaise: number;
  /** Amount received (equals totalPaise for prepaid Razorpay orders). */
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
 * Layout constants
 * ============================================================ */
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 36;
const CONTENT_W = PAGE_W - MARGIN * 2; // 523 pt

function drawInvoice(doc: PDFKit.PDFDocument, input: InvoiceInput): void {
  let y = MARGIN;
  y = drawHeader(doc, input, y);
  y = drawShipTo(doc, input, y + 12);
  y = drawItemsTable(doc, input, y + 12);
  y = drawTotals(doc, input, y + 8);
  y = drawAmountInWords(doc, input, y + 12);
  drawTermsAndBank(doc, input, y + 12);
  drawFooter(doc);
}

/* ============================================================
 * Header — seller block + Tax Invoice title + meta
 * ============================================================ */
function drawHeader(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  const boxH = 96;
  const halfW = CONTENT_W / 2;
  const padX = 12;

  doc
    .lineWidth(1)
    .strokeColor("#0f172a")
    .rect(MARGIN, startY, CONTENT_W, boxH)
    .stroke();

  // Left: seller.
  doc
    .font(FONT_BOLD)
    .fontSize(15)
    .fillColor("#0f172a")
    .text(input.seller.name, MARGIN + padX, startY + 10, {
      width: halfW - padX * 2,
      lineBreak: false,
    });

  doc.font(FONT_REG).fontSize(9).fillColor("#0f172a");
  let cursor = startY + 30;
  const sellerWidth = halfW - padX * 2;
  for (const line of input.seller.addressLines) {
    doc.text(line, MARGIN + padX, cursor, { width: sellerWidth });
    cursor += 11;
  }
  doc.text(`Phone: ${input.seller.phone}`, MARGIN + padX, cursor, {
    width: sellerWidth,
  });
  cursor += 11;
  doc.text(`Email: ${input.seller.email}`, MARGIN + padX, cursor, {
    width: sellerWidth,
  });
  if (input.seller.gstin) {
    cursor += 11;
    doc.text(`GSTIN: ${input.seller.gstin}`, MARGIN + padX, cursor, {
      width: sellerWidth,
    });
  }

  // Right: Tax Invoice title + meta. Right-aligned column.
  const rightX = MARGIN + halfW + padX;
  const rightW = halfW - padX * 2;

  doc
    .font(FONT_BOLD)
    .fontSize(18)
    .fillColor("#0f172a")
    .text("Tax Invoice", rightX, startY + 12, {
      width: rightW,
      align: "right",
    });

  // Meta rows: label on left, value bold on right, both inside the right column.
  const meta = [
    ["Invoice No.", input.invoiceNumber],
    ["Date", formatDate(input.invoiceDate)],
    ["Order No.", input.orderNumber],
  ];
  let metaY = startY + 42;
  const labelW = 70;
  const valueW = rightW - labelW;
  for (const [k, v] of meta) {
    doc
      .font(FONT_REG)
      .fontSize(9)
      .fillColor("#475569")
      .text(`${k}:`, rightX, metaY, {
        width: labelW,
        align: "left",
      });
    doc
      .font(FONT_BOLD)
      .fontSize(9)
      .fillColor("#0f172a")
      .text(v, rightX + labelW, metaY, {
        width: valueW,
        align: "right",
      });
    metaY += 13;
  }

  return startY + boxH;
}

/* ============================================================
 * Ship To — customer + delivery details. Name + phone bold so Mom
 * spots delivery contact at a glance.
 * ============================================================ */
function drawShipTo(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  const padX = 12;
  // Auto-size to content: name row + (lines + phone + email).
  const lines = input.shipTo.addressLines.filter(Boolean);
  const contactRows = (input.shipTo.phone ? 1 : 0) + (input.shipTo.email ? 1 : 0);
  const boxH = 24 + lines.length * 12 + contactRows * 12 + 14;

  doc
    .lineWidth(1)
    .strokeColor("#0f172a")
    .rect(MARGIN, startY, CONTENT_W, boxH)
    .stroke();

  doc
    .font(FONT_BOLD)
    .fontSize(9)
    .fillColor("#475569")
    .text("SHIP TO", MARGIN + padX, startY + 8, {
      width: CONTENT_W - padX * 2,
    });

  doc
    .font(FONT_BOLD)
    .fontSize(12)
    .fillColor("#0f172a")
    .text(input.shipTo.name, MARGIN + padX, startY + 22, {
      width: CONTENT_W - padX * 2,
    });

  doc.font(FONT_REG).fontSize(9).fillColor("#0f172a");
  let cursor = startY + 40;
  const wrapW = CONTENT_W - padX * 2;
  for (const line of lines) {
    doc.text(line, MARGIN + padX, cursor, { width: wrapW });
    cursor += 12;
  }
  if (input.shipTo.phone) {
    doc
      .font(FONT_BOLD)
      .text(`Phone: ${input.shipTo.phone}`, MARGIN + padX, cursor, {
        width: wrapW,
      });
    doc.font(FONT_REG);
    cursor += 12;
  }
  if (input.shipTo.email) {
    doc.text(`Email: ${input.shipTo.email}`, MARGIN + padX, cursor, {
      width: wrapW,
    });
  }

  return startY + boxH;
}

/* ============================================================
 * Items table — simplified columns (no HSN/SAC).
 * Widths sum exactly to CONTENT_W = 523.
 * ============================================================ */
function drawItemsTable(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  type Col = {
    key: string;
    label: string;
    width: number;
    align: "left" | "right" | "center";
  };
  const COLS: Col[] = [
    { key: "idx", label: "#", width: 24, align: "left" },
    { key: "name", label: "Item", width: 248, align: "left" },
    { key: "qty", label: "Qty", width: 38, align: "right" },
    { key: "unit", label: "Unit", width: 40, align: "center" },
    { key: "price", label: `Rate (${RUPEE})`, width: 65, align: "right" },
    { key: "disc", label: `Disc (${RUPEE})`, width: 55, align: "right" },
    { key: "amt", label: `Amount (${RUPEE})`, width: 53, align: "right" },
  ];
  const padX = 4;
  const headerH = 22;
  const rowH = 22;

  // Header bg + border.
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

  // Header labels.
  doc.font(FONT_BOLD).fontSize(8).fillColor("#0f172a");
  let colX = MARGIN;
  for (const col of COLS) {
    doc.text(col.label, colX + padX, startY + 8, {
      width: col.width - padX * 2,
      align: col.align,
      lineBreak: false,
    });
    colX += col.width;
  }

  // Body rows.
  doc.font(FONT_REG).fontSize(9).fillColor("#0f172a");
  let rowY = startY + headerH;
  for (const [i, item] of input.items.entries()) {
    drawDivider(doc, rowY + rowH);

    const amountPaise = item.unitPricePaise * item.quantity - item.discountPaise;
    const values = [
      String(i + 1),
      item.name,
      String(item.quantity),
      item.unit,
      formatINR(item.unitPricePaise),
      formatINR(item.discountPaise),
      formatINR(amountPaise),
    ];

    let cx = MARGIN;
    for (const [ci, col] of COLS.entries()) {
      doc.text(values[ci], cx + padX, rowY + 7, {
        width: col.width - padX * 2,
        align: col.align,
        ellipsis: true,
        lineBreak: false,
      });
      cx += col.width;
    }
    rowY += rowH;
  }

  // Shipping line.
  if (input.shippingPaise > 0) {
    drawDivider(doc, rowY + rowH);
    const values = [
      String(input.items.length + 1),
      "Delivery & packaging",
      "1",
      "Pcs",
      formatINR(input.shippingPaise),
      formatINR(0),
      formatINR(input.shippingPaise),
    ];
    let cx = MARGIN;
    for (const [ci, col] of COLS.entries()) {
      doc.text(values[ci], cx + padX, rowY + 7, {
        width: col.width - padX * 2,
        align: col.align,
        ellipsis: true,
        lineBreak: false,
      });
      cx += col.width;
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

function drawDivider(doc: PDFKit.PDFDocument, y: number): void {
  doc
    .lineWidth(0.5)
    .strokeColor("#e2e8f0")
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + CONTENT_W, y)
    .stroke();
}

/* ============================================================
 * Totals box (right-aligned).
 * ============================================================ */
function drawTotals(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  const boxW = 260;
  const boxX = MARGIN + CONTENT_W - boxW;
  const lineH = 16;
  const padX = 10;
  const labelW = 110;
  const valueW = boxW - labelW - padX * 2;

  const totalDiscount = input.items.reduce(
    (sum, it) => sum + it.discountPaise,
    0,
  );

  type Row = { label: string; value: string; bold?: boolean };
  const rows: Row[] = [
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

  const boxH = rows.length * lineH + 10;

  doc
    .lineWidth(0.7)
    .strokeColor("#0f172a")
    .rect(boxX, startY, boxW, boxH)
    .stroke();

  let y = startY + 8;
  for (const row of rows) {
    doc
      .font(row.bold ? FONT_BOLD : FONT_REG)
      .fontSize(row.bold ? 11 : 9)
      .fillColor("#0f172a")
      .text(row.label, boxX + padX, y, {
        width: labelW,
        align: "left",
        lineBreak: false,
      });
    doc
      .font(row.bold ? FONT_BOLD : FONT_REG)
      .text(row.value, boxX + padX + labelW, y, {
        width: valueW,
        align: "right",
        lineBreak: false,
      });
    y += lineH;
  }

  return startY + boxH;
}

/* ============================================================
 * Amount in words (full-width strip).
 * ============================================================ */
function drawAmountInWords(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  const padX = 12;
  const boxH = 32;

  doc
    .lineWidth(0.7)
    .strokeColor("#0f172a")
    .rect(MARGIN, startY, CONTENT_W, boxH)
    .stroke();

  doc
    .font(FONT_BOLD)
    .fontSize(8)
    .fillColor("#475569")
    .text("INVOICE AMOUNT IN WORDS", MARGIN + padX, startY + 6, {
      width: CONTENT_W - padX * 2,
    });

  doc
    .font(FONT_BOLD)
    .fontSize(10)
    .fillColor("#0f172a")
    .text(amountInWordsINR(input.totalPaise), MARGIN + padX, startY + 17, {
      width: CONTENT_W - padX * 2,
      ellipsis: true,
    });

  return startY + boxH;
}

/* ============================================================
 * Terms + Bank details (two columns). No signatory.
 * ============================================================ */
function drawTermsAndBank(
  doc: PDFKit.PDFDocument,
  input: InvoiceInput,
  startY: number,
): number {
  const boxH = 96;
  const halfW = CONTENT_W / 2;
  const padX = 12;

  doc
    .lineWidth(0.7)
    .strokeColor("#0f172a")
    .rect(MARGIN, startY, CONTENT_W, boxH)
    .stroke();

  doc
    .moveTo(MARGIN + halfW, startY)
    .lineTo(MARGIN + halfW, startY + boxH)
    .stroke();

  // Left: terms.
  doc
    .font(FONT_BOLD)
    .fontSize(8)
    .fillColor("#475569")
    .text("TERMS & CONDITIONS", MARGIN + padX, startY + 8, {
      width: halfW - padX * 2,
    });

  const terms = input.terms ?? [
    "Thank you for being a valuable customer.",
    "Goods once sold cannot be returned without prior approval.",
    "All disputes subject to Bangalore jurisdiction.",
  ];
  doc.font(FONT_REG).fontSize(8).fillColor("#0f172a");
  let cursor = startY + 22;
  for (const t of terms) {
    doc.text(`- ${t}`, MARGIN + padX, cursor, {
      width: halfW - padX * 2,
    });
    cursor += 16;
  }

  // Right: bank details.
  const bankX = MARGIN + halfW + padX;
  const bankW = halfW - padX * 2;
  const labelW = 60;
  const valueW = bankW - labelW;

  doc
    .font(FONT_BOLD)
    .fontSize(8)
    .fillColor("#475569")
    .text("BANK DETAILS", bankX, startY + 8, { width: bankW });

  doc.fontSize(9).fillColor("#0f172a");
  const bankRows = [
    ["Bank", input.bank.name],
    ["A/C No.", input.bank.accountNumber],
    ["IFSC", input.bank.ifsc],
    ["Branch", input.bank.branch],
  ];
  let bankY = startY + 22;
  for (const [k, v] of bankRows) {
    doc
      .font(FONT_REG)
      .text(k, bankX, bankY, { width: labelW, lineBreak: false });
    doc
      .font(FONT_BOLD)
      .text(v, bankX + labelW, bankY, {
        width: valueW,
        align: "right",
        lineBreak: false,
      });
    bankY += 14;
  }

  return startY + boxH;
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  doc
    .font(FONT_REG)
    .fontSize(8)
    .fillColor("#94a3b8")
    .text("Generated by Vyom - vyombooks.online", MARGIN, PAGE_H - MARGIN + 6, {
      width: CONTENT_W,
      align: "center",
      lineBreak: false,
    });
}

/* ============================================================
 * Helpers
 * ============================================================ */
function formatINR(paise: number): string {
  const rupees = (paise / 100).toFixed(2);
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
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

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
