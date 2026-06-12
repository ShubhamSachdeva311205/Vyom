"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  createBook,
  getBookForEdit,
  softDeleteBook,
  updateBookFull,
  uploadCoverImage,
} from "@/actions/admin-inventory";
import { uploadBookContent } from "@/actions/admin-access";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Stack, Row } from "@/components/layouts/stack";
import type { BookFull, InventoryRow } from "@/lib/inventory/constants";

/** Empty starting state for the Add-new flow. */
function emptyBook(): BookFull {
  return {
    id: "",
    slug: "",
    title: "",
    title_hindi: null,
    subtitle: null,
    subtitle_hindi: null,
    description: null,
    description_hindi: null,
    curriculum: "ibdp",
    price_paise: 0,
    compare_at_price_paise: null,
    cost_paise: 0,
    inventory_count: 0,
    weight_grams: 300,
    length_cm: 22,
    breadth_cm: 15,
    height_cm: 2,
    has_audio: false,
    has_answer_key: false,
    discount_eligible: true,
    is_active: true,
    cover_image_url: null,
    hsn_sac: "4901",
  };
}

interface BookEditDrawerProps {
  /** When set, drawer is in edit mode and fetches the full row. */
  book: InventoryRow | null;
  /** When true, drawer is in create mode (book ignored). */
  createMode?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookEditDrawer({
  book,
  createMode = false,
  open,
  onOpenChange,
}: BookEditDrawerProps) {
  if (!open) return null;
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {createMode ? "Add new book" : book?.title ?? "Edit book"}
          </DrawerTitle>
          <DrawerDescription>
            {createMode
              ? "Cover image, bilingual title + description, pricing, stock."
              : "Edit all the details for this book."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-6 pb-6 max-w-3xl mx-auto w-full overflow-y-auto max-h-[80vh]">
          {createMode ? (
            <BookForm
              initial={emptyBook()}
              mode="create"
              onSaved={() => onOpenChange(false)}
            />
          ) : book ? (
            <EditModeLoader bookId={book.id} onSaved={() => onOpenChange(false)} />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function EditModeLoader({
  bookId,
  onSaved,
}: {
  bookId: string;
  onSaved: () => void;
}) {
  const [initial, setInitial] = useState<BookFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getBookForEdit(bookId);
      if (cancelled) return;
      if (!result.success) {
        setError(result.error);
        return;
      }
      setInitial(result.data ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!initial) {
    return (
      <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading…
      </p>
    );
  }
  return <BookForm initial={initial} mode="edit" onSaved={onSaved} />;
}

function BookForm({
  initial,
  mode,
  onSaved,
}: {
  initial: BookFull;
  mode: "create" | "edit";
  onSaved: () => void;
}) {
  const [slug, setSlug] = useState(initial.slug);
  const [title, setTitle] = useState(initial.title);
  const [titleHindi, setTitleHindi] = useState(initial.title_hindi ?? "");
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? "");
  const [subtitleHindi, setSubtitleHindi] = useState(initial.subtitle_hindi ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [descriptionHindi, setDescriptionHindi] = useState(initial.description_hindi ?? "");
  const [curriculum, setCurriculum] = useState(initial.curriculum);
  const [priceRupees, setPriceRupees] = useState(String(Math.round(initial.price_paise / 100)));
  const [costRupees, setCostRupees] = useState(
    initial.cost_paise ? String(Math.round(initial.cost_paise / 100)) : "",
  );
  const [stock, setStock] = useState(String(initial.inventory_count));
  const [weightG, setWeightG] = useState(String(initial.weight_grams));
  const [lengthCm, setLengthCm] = useState(String(initial.length_cm));
  const [breadthCm, setBreadthCm] = useState(String(initial.breadth_cm));
  const [heightCm, setHeightCm] = useState(String(initial.height_cm));
  const [hasAudio, setHasAudio] = useState(initial.has_audio);
  const [hasAnswerKey, setHasAnswerKey] = useState(initial.has_answer_key);
  const [discountEligible, setDiscountEligible] = useState(initial.discount_eligible);
  const [isActive, setIsActive] = useState(initial.is_active);
  const [coverUrl, setCoverUrl] = useState(initial.cover_image_url ?? "");

  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  async function handleCoverUpload(file: File) {
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      toast.error("Set the slug first (lowercase, hyphens), then upload the cover.");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("slug", slug);
    const result = await uploadCoverImage(fd);
    setUploading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setCoverUrl(result.data?.url ?? "");
    toast.success("Cover uploaded.");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const priceNum = parseInt(priceRupees || "0", 10);
    const costNum = parseInt(costRupees || "0", 10) || 0;
    const stockNum = parseInt(stock || "0", 10);
    const weightNum = parseInt(weightG || "0", 10);
    const lengthNum = parseFloat(lengthCm || "0");
    const breadthNum = parseFloat(breadthCm || "0");
    const heightNum = parseFloat(heightCm || "0");

    const payload = {
      slug,
      title,
      titleHindi: titleHindi || undefined,
      subtitle: subtitle || undefined,
      subtitleHindi: subtitleHindi || undefined,
      description: description || undefined,
      descriptionHindi: descriptionHindi || undefined,
      curriculum,
      pricePaise: priceNum * 100,
      costPaise: costNum * 100,
      inventoryCount: stockNum,
      weightGrams: weightNum,
      lengthCm: lengthNum,
      breadthCm: breadthNum,
      heightCm: heightNum,
      hasAudio,
      hasAnswerKey,
      discountEligible,
      isActive,
      coverImageUrl: coverUrl || undefined,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createBook(payload)
          : await updateBookFull({ ...payload, id: initial.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(mode === "create" ? "Book added." : "Book saved.");
      onSaved();
    });
  }

  function onDelete() {
    if (!confirm(`Remove "${title}" from the catalogue? This hides it everywhere; order history is preserved.`)) {
      return;
    }
    startTransition(async () => {
      const result = await softDeleteBook({ bookId: initial.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Book removed.");
      onSaved();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack gap={6}>
        {/* Identity */}
        <Stack gap={3}>
          <span className="text-eyebrow">Identity</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Slug *"
              description="Lowercase letters, numbers, hyphens. Used in URLs + cover filename."
            >
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. ibdp-hindi-b-sl-grammar"
                required
              />
            </FormField>
            <FormField label="Curriculum">
              <Select
                value={curriculum}
                onValueChange={(v) => setCurriculum(v as typeof curriculum)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ibdp">IBDP</SelectItem>
                  <SelectItem value="igcse">IGCSE</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Title (English) *">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </FormField>
            <FormField label="शीर्षक (Hindi)">
              <Input
                value={titleHindi}
                onChange={(e) => setTitleHindi(e.target.value)}
                lang="hi"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Subtitle (English)">
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </FormField>
            <FormField label="उपशीर्षक (Hindi)">
              <Input
                value={subtitleHindi}
                onChange={(e) => setSubtitleHindi(e.target.value)}
                lang="hi"
              />
            </FormField>
          </div>
        </Stack>

        {/* Description */}
        <Stack gap={3}>
          <span className="text-eyebrow">Description</span>
          <FormField label="English">
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this book about? Who is it for?"
            />
          </FormField>
          <FormField label="विवरण (Hindi)">
            <Textarea
              rows={4}
              value={descriptionHindi}
              onChange={(e) => setDescriptionHindi(e.target.value)}
              lang="hi"
            />
          </FormField>
        </Stack>

        {/* Cover */}
        <Stack gap={3}>
          <span className="text-eyebrow">Cover image</span>
          <Row gap={3} align="center" className="flex-wrap">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="Cover preview"
                className="size-24 rounded-md object-cover border border-border"
              />
            ) : (
              <div className="size-24 rounded-md bg-muted border border-border flex items-center justify-center text-caption text-muted-foreground">
                No cover
              </div>
            )}
            <div className="flex-1 min-w-[200px]">
              <label className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer hover:bg-accent/40">
                <Upload className="size-4" aria-hidden="true" />
                <span className="text-sm">
                  {uploading ? "Uploading…" : coverUrl ? "Replace cover" : "Upload cover"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleCoverUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="text-caption text-muted-foreground mt-1">
                PNG / JPEG / WebP, max 5MB. Saved to Supabase Storage as
                <code className="mx-1">book-covers/{slug || "<slug>"}.&lt;ext&gt;</code>.
              </p>
            </div>
          </Row>
        </Stack>

        {/* Pricing + stock */}
        <Stack gap={3}>
          <span className="text-eyebrow">Pricing & stock</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Price (₹) *">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value.replace(/[^0-9]/g, ""))}
                required
              />
            </FormField>
            <FormField label="Cost (₹)" description="Your print/purchase cost — for net-profit reports.">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={costRupees}
                onChange={(e) => setCostRupees(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 120"
              />
            </FormField>
            <FormField label="Stock *">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ""))}
                required
              />
            </FormField>
            <FormField label="Weight (g)">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={weightG}
                onChange={(e) => setWeightG(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Length (cm)">
              <Input
                type="number"
                step="0.1"
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
              />
            </FormField>
            <FormField label="Breadth (cm)">
              <Input
                type="number"
                step="0.1"
                value={breadthCm}
                onChange={(e) => setBreadthCm(e.target.value)}
              />
            </FormField>
            <FormField label="Height (cm)">
              <Input
                type="number"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </FormField>
          </div>
        </Stack>

        {/* Toggles */}
        <Stack gap={3}>
          <span className="text-eyebrow">Companions & visibility</span>
          <ToggleRow checked={hasAudio} onChange={setHasAudio} label="Has audio companion" desc="Toggle on if Mom has a listening track for this book." />
          <ToggleRow checked={hasAnswerKey} onChange={setHasAnswerKey} label="Has answer key" desc="Toggle on if a PDF answer key is available." />
          <ToggleRow checked={discountEligible} onChange={setDiscountEligible} label="Eligible for storewide coupons" desc="Uncheck only if this book is excluded from student10/teacher10 etc." />
          <ToggleRow checked={isActive} onChange={setIsActive} label="Listed on storefront" desc="Uncheck to hide from /store, /ibdp, /igcse without deleting." />
        </Stack>

        {/* Companion files — edit mode only (need a book id to attach to) */}
        {mode === "edit" ? (
          <Stack gap={3}>
            <span className="text-eyebrow">Companion files (private)</span>
            <p className="text-caption text-muted-foreground">
              Uploaded to private storage. Only customers with access can
              stream / view them. PDFs are watermarked per-viewer.
            </p>
            {hasAudio ? (
              <ContentUpload bookId={initial.id} slug={slug} kind="audio" />
            ) : null}
            {hasAnswerKey ? (
              <ContentUpload bookId={initial.id} slug={slug} kind="pdf" />
            ) : null}
            {!hasAudio && !hasAnswerKey ? (
              <p className="text-caption text-muted-foreground">
                Turn on a companion toggle above to upload its file.
              </p>
            ) : null}
          </Stack>
        ) : null}

        <Row gap={2} justify="between" className="pt-2 border-t border-border">
          <div>
            {mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={pending}
                className="text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remove from catalogue
              </Button>
            ) : null}
          </div>
          <Row gap={2}>
            <Button type="submit" disabled={pending || uploading}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              <Check className="size-4" aria-hidden="true" />
              {mode === "create" ? "Create book" : "Save changes"}
            </Button>
          </Row>
        </Row>
      </Stack>
    </form>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(Boolean(c))} />
      <div>
        <Label className="text-body font-medium">{label}</Label>
        <p className="text-caption text-muted-foreground">{desc}</p>
      </div>
    </label>
  );
}

function ContentUpload({
  bookId,
  slug,
  kind,
}: {
  bookId: string;
  slug: string;
  kind: "audio" | "pdf";
}) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const label = kind === "audio" ? "Audio file" : "Answer-key PDF";
  const accept = kind === "audio" ? "audio/*" : "application/pdf";

  async function handle(file: File) {
    setUploading(true);
    setDone(false);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("bookId", bookId);
    fd.set("slug", slug);
    fd.set("kind", kind);
    const result = await uploadBookContent(fd);
    setUploading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDone(true);
    toast.success(`${label} uploaded.`);
  }

  return (
    <Row gap={3} align="center" className="flex-wrap">
      <label className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer hover:bg-accent/40">
        {uploading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Upload className="size-4" aria-hidden="true" />
        )}
        <span className="text-sm">
          {uploading ? "Uploading…" : done ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        </span>
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handle(f);
            e.target.value = "";
          }}
        />
      </label>
      {done ? (
        <span className="inline-flex items-center gap-1 text-caption text-success">
          <Check className="size-4" aria-hidden="true" /> Uploaded
        </span>
      ) : null}
    </Row>
  );
}
