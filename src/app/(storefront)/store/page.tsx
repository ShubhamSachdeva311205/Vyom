import { StoreCatalogSection } from "@/components/features/store/store-catalog-section";
import { getBooks } from "@/lib/queries/books";

export const metadata = {
  title: "Store",
  description: "Browse Vyom's catalog of IBDP and IGCSE Hindi titles.",
};

export default async function StorePage() {
  const books = await getBooks();
  return <StoreCatalogSection books={books} />;
}
