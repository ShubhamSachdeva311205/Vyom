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
  title: "IBDP",
  description: "Resources built for the IB Diploma Programme.",
};

export default async function IBDPPage() {
  const books = await getBooks({ curriculum: "ibdp" });

  // Unlock the Audio / Answer-key tabs for books the signed-in user owns.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const grantedBookIds = user ? [...(await getUserGrantedBookIds(user.id))] : [];

  // HL Reading as the centre. 2 left + 2 right of the remaining 4.
  const centre = books.find((b) => b.slug === "ibdp-hindi-b-hl-reading") ?? books[0];
  const rest = books.filter((b) => b.slug !== centre?.slug);
  const left = rest.slice(0, 2);
  const right = rest.slice(2, 4);

  return (
    <>
      <Section spacing="default">
        <Container>
          <Stack gap={10}>
            <Stack gap={3}>
              <span className="text-eyebrow">Curriculum · IBDP</span>
              <h1 className="text-display">Built for the IB Diploma.</h1>
              <p className="text-body-lg text-muted-foreground max-w-2xl">
                Five Hindi B titles spanning HL and SL — reading editions,
                the moukhik (oral) companion books, and the listening
                support edition. Audio + answer keys are bundled free
                with the physical book.
              </p>
            </Stack>

            {centre ? (
              <LayeredBookHero center={centre} left={left} right={right}>
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
                Order books on the left; answer keys and listening audio
                unlock automatically once the physical book is purchased
                (or granted manually for Amazon / offline buyers).
              </p>
            </Stack>
            <CurriculumTabs books={books} grantedBookIds={grantedBookIds} />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
