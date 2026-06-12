"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubmissionForm } from "./submission-form";

/**
 * Floating "+" button on /community that opens the Creative Corner
 * submission form in a dialog. Keeps the page itself a clean read-only feed.
 */
export function CommunitySubmitFab() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Share your writing"
          className="fixed bottom-6 right-6 z-40 inline-flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-95"
        >
          <Plus className="size-6" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share your writing</DialogTitle>
        </DialogHeader>
        <SubmissionForm bare onSuccess={() => setTimeout(() => setOpen(false), 1400)} />
      </DialogContent>
    </Dialog>
  );
}
