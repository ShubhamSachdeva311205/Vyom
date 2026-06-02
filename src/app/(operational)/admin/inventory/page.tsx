import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { ErrorState } from "@/components/ui/error-state";
import { InventoryList } from "@/components/features/admin/inventory/inventory-list";
import { InventoryTabs } from "@/components/features/admin/inventory/inventory-tabs";
import { listBooksForInventory } from "@/actions/admin-inventory";
import type { InventoryFilter } from "@/lib/inventory/constants";

export const metadata = { title: "Inventory · Admin" };

const FILTERS: InventoryFilter[] = ["all", "low", "out", "inactive"];

function parseFilter(raw: string | undefined): InventoryFilter {
  if (raw && (FILTERS as readonly string[]).includes(raw)) {
    return raw as InventoryFilter;
  }
  return "all";
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = parseFilter(sp.filter);

  const result = await listBooksForInventory(filter);

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Inventory</span>
            <h1 className="text-title">Books in stock</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Edit stock counts, prices, and storefront visibility. Stock
              decrements automatically when an order is paid.
            </p>
          </Stack>

          {result.success ? (
            <>
              <InventoryTabs current={filter} counts={result.data?.counts ?? { all: 0, low: 0, out: 0, inactive: 0 }} />
              <InventoryList rows={result.data?.rows ?? []} />
            </>
          ) : (
            <ErrorState
              title="Couldn't load inventory"
              description={result.error}
            />
          )}
        </Stack>
      </Container>
    </Section>
  );
}
