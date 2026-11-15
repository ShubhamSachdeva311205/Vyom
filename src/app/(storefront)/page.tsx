import { HeroReveal } from "@/components/features/store/hero-reveal";
import { StoreListing } from "@/components/features/store/store-listing";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { BlurText } from "@/components/ui/blur-text";
import { getBooks } from "@/lib/queries/books";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [books, params] = await Promise.all([getBooks(), searchParams]);
  const isNotAdmin = params.auth_error === "not_admin";

  return (
    <>
      {isNotAdmin ? (
        <div
          role="alert"
          className="relative z-40 bg-destructive/10 text-destructive text-sm text-center px-4 py-3"
        >
          You don&rsquo;t have admin access. Sign in with an authorised account.
        </div>
      ) : null}

      {/* Full-bleed 16:9 hand-drawn sketch → colour reveal (#91) */}
      <HeroReveal
        colorSrc="/demo/hero-color.webp"
        outlineSrc="/demo/hero-outline.webp"
      />

      {/* Scrolling past the hero opens the Store directly */}
      <Section id="store" spacing="default" className="scroll-mt-16">
        <Container>
          <Stack gap={8}>
            <Stack gap={3}>
              <span className="text-eyebrow">Catalog</span>
              <BlurText text="Store" as="h1" className="text-display" />
            </Stack>

            <StoreListing books={books} />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
