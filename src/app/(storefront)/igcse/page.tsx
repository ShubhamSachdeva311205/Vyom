import { ShellPage } from "@/components/layouts/shell-page";

export const metadata = {
  title: "IGCSE",
  description: "Resources built for the Cambridge IGCSE programme.",
};

export default function IGCSEPage() {
  return (
    <ShellPage
      eyebrow="Curriculum"
      title="Built for IGCSE."
      description="Subject guides, audio summaries, and worked past papers aligned to the current Cambridge IGCSE syllabus."
      emptyTitle="Subject pages on the way"
      emptyDescription="Like the IBDP track, IGCSE materials are being prepared subject by subject. We're starting with the core ten."
      mascot="bookworm"
    />
  );
}
