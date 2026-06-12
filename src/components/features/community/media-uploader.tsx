"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/layouts/stack";
import {
  MAX_MEDIA,
  MAX_MEDIA_BYTES,
  type MediaItem,
} from "@/lib/community/constants";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

interface MediaUploaderProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  disabled?: boolean;
}

/**
 * Uploads images/videos straight from the browser to Cloudinary (unsigned
 * preset) — nothing touches our server or Supabase. Caps at MAX_MEDIA files,
 * MAX_MEDIA_BYTES each, images + videos only.
 */
export function MediaUploader({ value, onChange, disabled }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const configured = Boolean(CLOUD && PRESET);
  const remaining = MAX_MEDIA - value.length;

  async function uploadOne(file: File): Promise<MediaItem | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", PRESET as string);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/auto/upload`,
      { method: "POST", body: fd },
    );
    if (!res.ok) {
      const msg = await res.json().catch(() => null);
      throw new Error(msg?.error?.message ?? "Upload failed");
    }
    const j = await res.json();
    return {
      url: j.secure_url as string,
      kind: j.resource_type === "video" ? "video" : "image",
      publicId: j.public_id as string,
    };
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const picked = Array.from(files);

    if (picked.length > remaining) {
      toast.error(`You can attach up to ${MAX_MEDIA} files.`);
      return;
    }
    for (const f of picked) {
      if (!/^(image|video)\//.test(f.type)) {
        toast.error(`${f.name}: only images and videos are allowed.`);
        return;
      }
      if (f.size > MAX_MEDIA_BYTES) {
        toast.error(`${f.name}: each file must be 5 MB or smaller.`);
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded: MediaItem[] = [];
      for (const f of picked) {
        const item = await uploadOne(f);
        if (item) uploaded.push(item);
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(publicId: string) {
    onChange(value.filter((m) => m.publicId !== publicId));
  }

  if (!configured) {
    return (
      <p className="text-sm text-muted-foreground">
        Media uploads aren&rsquo;t configured yet.
      </p>
    );
  }

  return (
    <Stack gap={3}>
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((m) => (
            <div
              key={m.publicId}
              className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted/30"
            >
              {m.kind === "video" ? (
                <video src={m.url} className="size-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="attachment" className="size-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => remove(m.publicId)}
                aria-label="Remove attachment"
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/80 text-foreground hover:bg-background"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
              {m.kind === "video" && (
                <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1 text-[10px]">
                  video
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading || remaining <= 0}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-4" aria-hidden="true" />
          )}
          {uploading
            ? "Uploading…"
            : remaining <= 0
              ? "Max 5 attached"
              : `Add photos / videos (${remaining} left)`}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">
          Up to {MAX_MEDIA} images or videos, 5 MB each.
        </p>
      </div>
    </Stack>
  );
}
