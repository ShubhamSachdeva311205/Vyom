import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { MascotName } from "@/components/ui/mascot";
import { cn } from "@/lib/utils";

// Dynamic import keeps framer-motion in a lazily-loaded chunk off the main
// admin/checkout bundles (§9). No `ssr: false` — this is a Server Component and
// Next 16 forbids that here; the split still keeps framer-motion off the initial
// bundle, and the Mascot's own "use client" boundary handles hydration.
const Mascot = dynamic(() =>
  import("@/components/ui/mascot").then((m) => ({ default: m.Mascot })),
);

/**
 * EmptyState — keeps a list/table/page from feeling broken when there's
 * no data (CLAUDE.md §11). Three visual modes:
 *
 *   - mascot="bookworm"   → renders the blob mascot as the visual
 *   - icon={SomeIcon}     → renders a Lucide icon (Mode B / admin usage)
 *   - neither             → uses the default Inbox icon
 *
 * Always pass title + description; the action is optional but encouraged.
 */

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  /** Storefront mascot. Cannot be combined with `icon`. */
  mascot?: MascotName;
  /** Mascot mood — affects smile (sad = frown) and accessory color. */
  mascotMood?: "happy" | "sad";
  /** Lucide icon for operational routes. Cannot be combined with `mascot`. */
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  mascot,
  mascotMood,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-12 px-6 gap-4",
        className,
      )}
    >
      {mascot ? (
        <Mascot name={mascot} size="md" mood={mascotMood} />
      ) : (
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}

      <div className="flex flex-col gap-1.5 max-w-sm">
        <h3 className="text-headline">{title}</h3>
        <p className="text-caption">{description}</p>
      </div>

      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
