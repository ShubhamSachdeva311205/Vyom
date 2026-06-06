import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { ErrorState } from "@/components/ui/error-state";
import { AccessManager } from "@/components/features/admin/access/access-manager";
import { listBooksForGrantPicker } from "@/actions/admin-access";

export const metadata = { title: "Access grants · Admin" };

export default async function AdminAccessGrantsPage() {
  const books = await listBooksForGrantPicker();

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Access grants</span>
            <h1 className="text-title">Digital access</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Grant audio / answer-key access to offline or Amazon buyers,
              and revoke access when needed. Paid web orders grant access
              automatically.
            </p>
          </Stack>

          {books.success ? (
            <AccessManager books={books.data ?? []} />
          ) : (
            <ErrorState title="Couldn't load books" description={books.error} />
          )}
        </Stack>
      </Container>
    </Section>
  );
}
