import { LayeredBookHero } from "@/components/features/store/layered-book-hero";
import { StudentHangingFromBook, TeacherSittingOnBook } from "@/components/features/store/mascot-scenes";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { getBooks } from "@/lib/queries/books";

export const metadata = {
  title: "IGCSE",
  description: "Resources built for the Cambridge IGCSE programme.",
};

export default async function IGCSEPage() {
  const books = await getBooks({ curriculum: "igcse" });

  // Paper 1 (Reading & Writing) centred — the flagship. Paper 2
  // (Listening) sits behind to one side.
  const centre = books.find((b) => b.slug === "igcse-hindi-paper-1") ?? books[0];
  const second = books.find((b) => b.slug === "igcse-hindi-paper-2-listening");
  const right = second ? [second] : [];

  return (
    <Section spacing="default">
      <Container>
        <Stack gap={10}>
          <Stack gap={3}>
            <span className="text-eyebrow">Curriculum · IGCSE</span>
            <h1 className="text-display">Built for IGCSE.</h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl">
              Two Cambridge IGCSE Hindi as a Second Language editions —
              Paper 1 (Reading and Writing) and Paper 2 (Listening
              Component). Aligned to the new curriculum, for class 9 and 10.
            </p>
          </Stack>

          {centre ? (
            <LayeredBookHero center={centre} left={[]} right={right}>
              <TeacherSittingOnBook />
              <StudentHangingFromBook />
            </LayeredBookHero>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}
