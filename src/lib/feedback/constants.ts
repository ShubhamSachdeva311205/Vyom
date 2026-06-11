// Plain module (not "use server") so these runtime values are importable by
// both the server action and client components.

export const FEEDBACK_KINDS = [
  "bug",
  "feature_request",
  "content_request",
  "praise",
  "other",
] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  bug: "Something's broken",
  feature_request: "Feature idea",
  content_request: "Content request",
  praise: "Praise",
  other: "Something else",
};
