import { CurriculumTabs } from "@/components/features/store/curriculum-tabs";
import { LayeredBookHero } from "@/components/features/store/layered-book-hero";
import { StudentHangingFromBook, TeacherSittingOnBook } from "@/components/features/store/mascot-scenes";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { getBooks } from "@/lib/queries/books";
import { getUserGrantedBookIds } from "@/lib/access/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "IGCSE",
  description: "Resources built for the Cambridge IGCSE programme.",
};

export default async function IGCSEPage() {
  const books = await getBooks({ curriculum: "igcse" });

  // Unlock the Audio / Answer-key tabs for books the signed-in user owns.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const grantedBookIds = user ? [...(await getUserGrantedBookIds(user.id))] : [];

  const centre = books.find((b) => b.slug === "igcse-hindi-paper-1") ?? books[0];
  const second = books.find((b) => b.slug === "igcse-hindi-paper-2-listening");
  const right = second ? [second] : [];

  return (
    <>
      <Section spacing="default">
        <Container>
          <Stack gap={10}>
            <Stack gap={3}>
              <span className="text-eyebrow">Curriculum · IGCSE</span>
              <h1 className="text-display">Built for IGCSE.</h1>
              <p className="text-body-lg text-muted-foreground max-w-2xl">
                Two Cambridge IGCSE Hindi as a Second Language editions —
                Paper 1 (Reading and Writing) and Paper 2 (Listening
                Component). Aligned to the new curriculum, for class 9
                and 10.
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

      <Section spacing="default">
        <Container>
          <Stack gap={4}>
            <Stack gap={2}>
              <span className="text-eyebrow">Sections</span>
              <h2 className="text-title">Browse + unlock.</h2>
              <p className="text-body text-muted-foreground max-w-2xl">
                Order Paper 1 on the left. The Paper 2 listening
                audio unlocks once the physical book is purchased.
              </p>
            </Stack>
            <CurriculumTabs books={books} grantedBookIds={grantedBookIds} />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
