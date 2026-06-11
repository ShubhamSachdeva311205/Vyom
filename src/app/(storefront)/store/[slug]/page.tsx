import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BookOpenCheck,
  Headphones,
  Info,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack, Row } from "@/components/layouts/stack";
import { AddToCartButton } from "@/components/features/store/add-to-cart-button";
import { FeedbackForm } from "@/components/features/feedback/feedback-form";
import { ProductReviews } from "@/components/features/store/product-reviews";
import { ViewSampleButton } from "@/components/features/store/view-sample-button";
import { getBookBySlug } from "@/lib/queries/books";
import { getBookReviews } from "@/lib/queries/reviews";
import { formatINR } from "@/lib/format";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: "Book not found" };
  return {
    title: book.title,
    description:
      book.description?.slice(0, 160) ??
      `${book.title} — ${book.curriculum.toUpperCase()} Hindi study material by Seema Sachdeva.`,
  };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const reviews = await getBookReviews(book.id);
  const coverSrc = book.cover_image_url ?? `/book-covers/${book.slug}.webp`;
  const soldOut = book.inventory_count === 0;
  const hasCompare =
    book.compare_at_price_paise != null &&
    book.compare_at_price_paise > book.price_paise;

  return (
    <Section spacing="default">
      <Container size="wide">
        <Stack gap={6}>
          <Link
            href="/store"
            className="text-caption text-muted-foreground hover:text-foreground"
          >
            ← All titles
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-8">
            {/* Cover */}
            <div className="relative mx-auto w-full max-w-[340px]">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                <Image
                  src={coverSrc}
                  alt={book.title}
                  fill
                  sizes="(min-width: 1024px) 360px, 80vw"
                  priority
                  className={soldOut ? "object-cover grayscale opacity-70" : "object-cover"}
                />
                {soldOut ? (
                  <span className="absolute top-3 left-3 rounded-full bg-foreground/90 text-background text-[11px] font-medium px-2.5 py-1 uppercase tracking-wide">
                    Sold out
                  </span>
                ) : null}
              </div>
            </div>

            {/* Details */}
            <Stack gap={6}>
              <Stack gap={2}>
                <span className="text-eyebrow">
                  {book.curriculum.toUpperCase()} · Hindi
                </span>
                <h1 className="text-title">{book.title}</h1>
                {book.title_hindi ? (
                  <p className="text-headline text-muted-foreground" lang="hi">
                    {book.title_hindi}
                  </p>
                ) : null}
                {book.subtitle ? (
                  <p className="text-body text-muted-foreground">{book.subtitle}</p>
                ) : null}
              </Stack>

              {/* Price */}
              <Row gap={3} align="baseline" className="flex-wrap">
                <span className="text-display tabular-nums">
                  {formatINR(book.price_paise)}
                </span>
                {hasCompare ? (
                  <span className="text-headline text-muted-foreground line-through tabular-nums">
                    {formatINR(book.compare_at_price_paise!)}
                  </span>
                ) : null}
              </Row>

              {/* Companions + stock */}
              <Row gap={2} align="center" className="flex-wrap">
                {soldOut ? (
                  <Badge variant="warning">Out of stock</Badge>
                ) : book.inventory_count < 5 ? (
                  <Badge variant="destructive">Only {book.inventory_count} left</Badge>
                ) : (
                  <Badge variant="success">In stock</Badge>
                )}
                {book.has_audio ? (
                  <Badge variant="secondary">
                    <Headphones className="size-3.5" aria-hidden="true" /> Listening audio
                  </Badge>
                ) : null}
                {book.has_answer_key ? (
                  <Badge variant="secondary">
                    <BookOpenCheck className="size-3.5" aria-hidden="true" /> Answer key
                  </Badge>
                ) : null}
              </Row>

              {/* Actions */}
              <Row gap={2} className="flex-wrap">
                <AddToCartButton
                  bookId={book.id}
                  bookTitle={book.title}
                  outOfStock={soldOut}
                />
                {book.hasSample ? (
                  <ViewSampleButton bookId={book.id} bookTitle={book.title} />
                ) : null}
              </Row>

              {/* Discount eligibility */}
              {book.discount_eligible ? (
                <p className="text-caption text-muted-foreground">
                  Eligible for <span className="font-medium">student10</span> /{" "}
                  <span className="font-medium">teacher10</span> (10% off). Codes
                  apply on this website only — Amazon orders aren&apos;t eligible.
                </p>
              ) : (
                <p className="text-caption text-muted-foreground">
                  This title isn&apos;t eligible for storewide discount codes.
                </p>
              )}

              {/* Meta */}
              <Card variant="surface" padding="lg">
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  {book.isbn ? (
                    <>
                      <dt className="text-muted-foreground">ISBN</dt>
                      <dd className="tabular-nums">{book.isbn}</dd>
                    </>
                  ) : null}
                  {book.publisher ? (
                    <>
                      <dt className="text-muted-foreground">Publisher</dt>
                      <dd>{book.publisher}</dd>
                    </>
                  ) : null}
                  <dt className="text-muted-foreground">Author</dt>
                  <dd>Seema Sachdeva</dd>
                  {book.has_audio || book.has_answer_key ? (
                    <>
                      <dt className="text-muted-foreground">Digital companions</dt>
                      <dd>
                        {[book.has_audio && "Listening audio", book.has_answer_key && "Answer key"]
                          .filter(Boolean)
                          .join(" + ")}{" "}
                        — free with the book, unlocked in your library after purchase.
                      </dd>
                    </>
                  ) : null}
                </dl>
              </Card>

              {/* Description */}
              {book.description || book.description_hindi ? (
                <Stack gap={3}>
                  <span className="text-eyebrow">About this book</span>
                  {book.description ? (
                    <p className="text-body whitespace-pre-line">{book.description}</p>
                  ) : null}
                  {book.description_hindi ? (
                    <p className="text-body text-muted-foreground whitespace-pre-line" lang="hi">
                      {book.description_hindi}
                    </p>
                  ) : null}
                </Stack>
              ) : null}

              {/* No-returns notice */}
              <Row gap={2} align="start" className="text-caption text-muted-foreground">
                <Info className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  All sales are final — no returns or refunds. Damaged-in-transit
                  books are replaced free within 7 days. See our{" "}
                  <Link href="/legal/returns" className="underline">
                    returns policy
                  </Link>
                  .
                </span>
              </Row>

              <Row gap={2} align="center" className="text-caption text-muted-foreground">
                <Package className="size-4 shrink-0" aria-hidden="true" />
                <span>Shipping calculated at checkout from your pincode.</span>
              </Row>
            </Stack>
          </div>

          {/* Reviews (public, moderated) */}
          <div className="border-t border-border pt-8">
            <ProductReviews bookId={book.id} summary={reviews} />
          </div>

          {/* Private feedback on this book (goes to admin, not public) */}
          <div className="max-w-2xl">
            <FeedbackForm
              bookId={book.id}
              title="Feedback on this book"
              description="Spotted a typo, want a topic added, or have a question? Send it privately — it goes straight to us, not the public reviews."
            />
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
