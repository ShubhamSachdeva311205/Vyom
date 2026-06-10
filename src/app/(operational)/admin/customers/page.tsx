import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { CustomerSearch } from "@/components/features/admin/customers/customer-search";

export const metadata = { title: "Customers · Admin" };

export default function AdminCustomersPage() {
  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Customers</span>
            <h1 className="text-title">Customers</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Look up a customer by email or name to see their orders and
              digital access.
            </p>
          </Stack>
          <CustomerSearch />
        </Stack>
      </Container>
    </Section>
  );
}
