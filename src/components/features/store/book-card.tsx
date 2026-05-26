import Image from "next/image";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Book = Tables<"books">;

const cardVariants = cva(
  "group relative overflow-hidden rounded-xl border border-border/40 bg-card",
  {
    variants: {
      size: {
        sm: "w-32",
        md: "w-44",
        lg: "w-60",
        xl: "w-72 sm:w-80",
      },
    },
    defaultVariants: { size: "md" },
  },
);

interface BookCardProps extends VariantProps<typeof cardVariants> {
  book: Book;
  /** Disables the link (used inside hero scenes where the whole thing is a link). */
  asStatic?: boolean;
  className?: string;
  priority?: boolean;
  showMeta?: boolean;
}

/**
 * BookCard — cover-first card. Used in the layered hero, future
 * /store grid, and any future product listing. The cover image comes
 * from `public/book-covers/<slug>.webp` (produced by
 * `scripts/process-book-covers.py`).
 */
export function BookCard({
  book,
  asStatic = false,
  size,
  className,
  priority = false,
  showMeta = true,
}: BookCardProps) {
  const coverSrc = `/book-covers/${book.slug}.webp`;

  const inner = (
    <>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        <Image
          src={coverSrc}
          alt={book.title}
          fill
          sizes="(min-width: 1024px) 240px, (min-width: 640px) 180px, 128px"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      {showMeta ? (
        <div className="flex flex-col gap-1 p-3">
          <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
            {book.title}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              {formatINR(book.price_paise)}
            </span>
            {book.discount_eligible ? (
              <Badge variant="success" size="sm">10% elig.</Badge>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );

  if (asStatic) {
    return <div className={cn(cardVariants({ size }), className)}>{inner}</div>;
  }

  return (
    <Link
      href={`/store/${book.slug}`}
      className={cn(cardVariants({ size }), "block hover:border-foreground/30 transition-colors", className)}
    >
      {inner}
    </Link>
  );
}
