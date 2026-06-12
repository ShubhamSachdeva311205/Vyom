import type { MediaItem } from "@/lib/community/constants";

/**
 * Inject Cloudinary's automatic format + quality optimization into an image
 * delivery URL (free-tier, on-the-fly compression — #130). Leaves non-matching
 * URLs untouched.
 */
function optimized(url: string): string {
  return url.replace(
    /\/image\/upload\/(?!f_auto)/,
    "/image/upload/f_auto,q_auto/",
  );
}

/**
 * Renders a submission's attached images/videos. Cloudinary URLs; images use
 * a plain <img> (external host, not next/image-optimized) and videos a native
 * player. Shown on the public feed + the admin moderation queue.
 */
export function MediaGallery({ media }: { media: MediaItem[] }) {
  if (!media || media.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {media.map((m) =>
        m.kind === "video" ? (
          <video
            key={m.publicId}
            src={m.url}
            controls
            controlsList="nodownload"
            preload="metadata"
            className="aspect-square w-full rounded-md border border-border object-cover bg-black"
          />
        ) : (
          <a
            key={m.publicId}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block aspect-square overflow-hidden rounded-md border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={optimized(m.url)}
              alt="Submission attachment"
              loading="lazy"
              className="size-full object-cover transition-transform hover:scale-105"
            />
          </a>
        ),
      )}
    </div>
  );
}
