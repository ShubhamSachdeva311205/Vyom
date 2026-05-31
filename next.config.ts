import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // pdfkit loads its .afm font metric files from disk at runtime via
  // fs.readFileSync. Next/Turbopack would otherwise tree-shake them
  // out of the bundle and the renderer throws "ENOENT data/Helvetica.afm".
  // Externalising it leaves pdfkit in node_modules where its relative
  // paths work.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
