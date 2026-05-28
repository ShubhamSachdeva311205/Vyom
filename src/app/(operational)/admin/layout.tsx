import type { ReactNode } from "react";
import { AdminNav } from "@/components/features/admin/admin-nav";

/**
 * Admin shell — sits inside the operational layout (no marketing chrome).
 * Mobile gets a bottom tab bar; md+ gets a left rail. Both link the
 * same routes; the active item is computed from the pathname.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <AdminNav />
      {/* pb-24 on mobile leaves room for the fixed bottom tab bar. */}
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
    </div>
  );
}
