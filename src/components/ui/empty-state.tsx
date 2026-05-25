import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { Mascot, type MascotName } from "@/components/ui/mascot";
import { cn } from "@/lib/utils";

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
  /** Lucide icon for operational routes. Cannot be combined with `mascot`. */
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  mascot,
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
        <Mascot name={mascot} size="md" />
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
