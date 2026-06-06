import { redirect } from "next/navigation";
import { Library } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import {
  LibraryBookCard,
  type LibraryBookGroup,
} from "@/components/features/library/library-book-card";
import { getUserLibrary } from "@/lib/access/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My Library" };

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?next=/dashboard/library");
  }

  const grants = await getUserLibrary(user.id);

  // Group audio + pdf grants for the same book into one card.
  const byBook = new Map<string, LibraryBookGroup>();
  for (const g of grants) {
    const existing = byBook.get(g.bookId) ?? {
      bookId: g.bookId,
      bookTitle: g.bookTitle,
      coverImageUrl: g.coverImageUrl,
      bookSlug: g.bookSlug,
      audioGrantId: null,
      audioReady: false,
      pdfGrantId: null,
      pdfReady: false,
    };
    if (g.contentKind === "audio") {
      existing.audioGrantId = g.grantId;
      existing.audioReady = Boolean(g.storageKey);
    } else {
      existing.pdfGrantId = g.grantId;
      existing.pdfReady = Boolean(g.storageKey);
    }
    byBook.set(g.bookId, existing);
  }
  const groups = [...byBook.values()];

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Library</span>
            <h1 className="text-title">My Library</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Audio companions stream here; answer keys open in a
              watermarked viewer. These are licensed for your personal
              use — please don&apos;t share them.
            </p>
          </Stack>

          {groups.length === 0 ? (
            <Card variant="surface" padding="none" className="overflow-hidden">
              <EmptyState
                icon={Library}
                title="Nothing here yet"
                description="When you buy a book with audio or an answer key, it shows up here for streaming + viewing."
              />
            </Card>
          ) : (
            <Stack gap={4}>
              {groups.map((group) => (
                <LibraryBookCard key={group.bookId} group={group} />
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Section>
  );
}
