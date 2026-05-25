import { ShellPage } from "@/components/layouts/shell-page";

export const metadata = {
  title: "IBDP",
  description: "Resources built for the IB Diploma Programme.",
};

export default function IBDPPage() {
  return (
    <ShellPage
      eyebrow="Curriculum"
      title="Built for the IB Diploma."
      description="Subject guides, audio summaries, and worked past papers aligned to the current IBDP syllabus. Targeted at Year 11 and 12 students."
      emptyTitle="Subject pages on the way"
      emptyDescription="We're assembling materials by subject right now. Subscribe and we'll let you know when the first guides drop."
      mascot="bookworm"
    />
  );
}
