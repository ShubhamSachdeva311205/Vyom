import Image from "next/image";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
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
        md: "w-48",
        lg: "w-72",
        xl: "w-80 sm:w-96 lg:w-[28rem]",
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
          className={cn(
            "object-cover",
            // Only zoom on hover when the card is actually clickable.
            // In hero contexts (asStatic) the zoom misleads users.
            !asStatic && "transition-transform duration-500 group-hover:scale-[1.02]",
            book.inventory_count === 0 && "grayscale opacity-60",
          )}
        />
        {book.inventory_count === 0 ? (
          <span className="absolute top-2 left-2 inline-flex items-center rounded-full bg-foreground/90 text-background text-[10px] font-medium px-2 py-1 uppercase tracking-wide">
            Sold out
          </span>
        ) : null}
      </div>
      {showMeta ? (
        <div className="flex flex-col gap-1 p-3">
          <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
            {book.title}
          </p>
          <span className="text-sm font-semibold text-foreground">
            {formatINR(book.price_paise)}
          </span>
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
