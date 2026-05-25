import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShellPage } from "@/components/layouts/shell-page";

export const metadata = {
  title: "Store",
  description: "Browse Advaita's catalog of physical and digital study resources.",
};

export default function StorePage() {
  return (
    <ShellPage
      eyebrow="Catalog"
      title="The store opens soon."
      description="Hand-picked books, audio companions, and past papers for IBDP and IGCSE. Physical editions ship from Bangalore."
      emptyTitle="Catalog launches with Phase 2"
      emptyDescription="We're seeding inventory now. Until then, peek at the community or read about IBDP / IGCSE coverage."
      mascot="star"
      action={
        <Button asChild size="sm" variant="outline">
          <Link href="/community">
            Visit the community <ArrowRight />
          </Link>
        </Button>
      }
    />
  );
}
