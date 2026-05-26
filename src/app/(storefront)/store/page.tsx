import { StoreListing } from "@/components/features/store/store-listing";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { getBooks } from "@/lib/queries/books";

export const metadata = {
  title: "Store",
  description: "Browse Advaita's catalog of IBDP and IGCSE Hindi titles.",
};

export default async function StorePage() {
  const books = await getBooks();

  return (
    <Section spacing="default">
      <Container>
        <Stack gap={8}>
          <Stack gap={3}>
            <span className="text-eyebrow">Catalog</span>
            <h1 className="text-display">All titles.</h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl">
              Seven editions across IBDP Hindi B and IGCSE Hindi as a
              Second Language. Audio + answer keys ship free with the
              physical book — never sold separately.
            </p>
          </Stack>

          <StoreListing books={books} />
        </Stack>
      </Container>
    </Section>
  );
}
