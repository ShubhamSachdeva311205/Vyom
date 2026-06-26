import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Vyom — premium study resources for IBDP and IGCSE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default OG image for the homepage and any route without its own
 * opengraph-image. Rendered via Satori — stick to inline styles and
 * the small subset of CSS Satori supports (no masks, no filters, no
 * gradient strings with stops outside the documented forms).
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #08322a 0%, #0d4a3d 45%, #114d3f 100%)",
          color: "#f4faf6",
          fontFamily: "sans-serif",
        }}
      >
        {/* Eyebrow row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          <span>Vyom · Bangalore</span>
          <span>IBDP · IGCSE</span>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 132,
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 0.95,
              display: "flex",
            }}
          >
            <span>Study,&nbsp;</span>
            <span style={{ color: "#74d9b5" }}>slowly.</span>
          </div>
          <div
            style={{
              fontSize: 30,
              opacity: 0.82,
              maxWidth: 760,
              lineHeight: 1.35,
            }}
          >
            Premium study resources for the IB Diploma and Cambridge IGCSE.
            Books, papers, and audio companions — built in Bangalore.
          </div>
        </div>

        {/* Footer chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
            opacity: 0.65,
            letterSpacing: "0.04em",
          }}
        >
          <span>vyombooks.online</span>
          <span style={{ fontFamily: "monospace" }}>v0.1</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
