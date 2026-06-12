// Plain (non-"use server") module so these runtime values can be imported
// by both the server action and client components. A "use server" file may
// only export async functions — a const array there becomes a broken
// server-reference proxy at runtime.

export const SUBMISSION_KINDS = ["poem", "story", "drama", "essay", "other"] as const;
export type SubmissionKind = (typeof SUBMISSION_KINDS)[number];

// Community media attachments (Cloudinary). Stored on content_submissions.media.
export const MAX_MEDIA = 5;
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024; // 5 MB per file
export interface MediaItem {
  url: string;
  kind: "image" | "video";
  publicId: string;
}
