import type { Metadata } from "next";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CouponChip } from "@/components/ui/coupon-chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mascot, type MascotName } from "@/components/ui/mascot";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ToastDemoButtons } from "./toast-demo";
import { Container } from "@/components/layouts/container";
import { NoiseLayer } from "@/components/layouts/noise-layer";
import { Row, Stack } from "@/components/layouts/stack";
import { Section } from "@/components/layouts/section";

const FEATURED: readonly MascotName[] = ["student", "teacher"] as const;
const DECORATIVE: readonly MascotName[] = ["bookworm", "wisp", "star", "triangle"] as const;

const BLURBS: Record<MascotName, string> = {
  student: "Round, white collar + school tie, emerald. Carries student10. Opt-in stick limbs.",
  teacher: "Oval, glasses, warm amber gradient. Carries teacher10.",
  bookworm: "Tall capsule, over-ear headphones, violet-blue gradient.",
  wisp: "Wide pebble, coral gradient (was named 'star').",
  star: "5-point star silhouette, gold gradient (NEW).",
  triangle: "Rounded triangle, teal gradient (NEW).",
};

export const metadata: Metadata = {
  title: "Design Tokens",
  robots: { index: false, follow: false },
};

const semantic = [
  "background",
  "foreground",
  "muted",
  "muted-foreground",
  "border",
  "ring",
  "card",
  "primary",
  "secondary",
  "accent",
  "brand",
  "brand-soft",
  "brand-deep",
] as const;

const status = ["success", "warning", "pending", "destructive"] as const;

export default function DesignTokensPage() {
  return (
    <>
      <NoiseLayer />
      <main className="min-h-screen">
        <Container>
          <Section spacing="default">
            <Stack gap={12}>
              {/* ---- Hero ---- */}
              <Stack gap={4}>
                <span className="text-eyebrow">Internal · v0.1.1</span>
                <h1 className="text-kinetic">Foundation.</h1>
                <p className="text-body-lg text-muted-foreground max-w-2xl">
                  Advaita&rsquo;s calibration surface. Emerald is locked.
                  Hover the companions to wake them up — each one carries a
                  copyable discount code.
                </p>
              </Stack>

              {/* ---- Mascots — the centerpiece ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Companions</span>
                  <h2 className="text-title">Hover to say hi.</h2>
                  <p className="text-body text-muted-foreground max-w-2xl">
                    Soft distorted blobs with internal grain. Default state
                    is asleep; cursor in and they open their eyes, grin, and
                    surface a coupon you can copy.
                  </p>
                </Stack>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {FEATURED.map((n) => (
                    <Card key={n} variant="surface" padding="lg">
                      <Stack gap={6} align="center">
                        <Mascot name={n} size="lg" label={n} />
                        <Stack gap={1} align="center">
                          <h3 className="text-headline capitalize">{n}</h3>
                          <p className="text-caption text-center max-w-[28ch]">
                            {BLURBS[n]}
                          </p>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </div>

                <Stack gap={3}>
                  <span className="text-eyebrow">More shapes</span>
                  <p className="text-caption max-w-2xl">
                    Decorative blob variants — different silhouettes so the
                    cast feels like a family, not duplicates. No coupon code
                    unless you pass one explicitly.
                  </p>
                </Stack>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {DECORATIVE.map((n) => (
                    <Card key={n} variant="surface" padding="lg">
                      <Stack gap={6} align="center">
                        <Mascot name={n} size="lg" label={n} />
                        <Stack gap={1} align="center">
                          <h3 className="text-headline capitalize">{n}</h3>
                          <p className="text-caption text-center max-w-[28ch]">
                            {BLURBS[n]}
                          </p>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </div>

                <Card variant="surface" padding="lg">
                  <Stack gap={4}>
                    <Stack gap={1}>
                      <span className="text-eyebrow">Stick limbs (opt-in via withLimbs)</span>
                      <p className="text-caption">
                        Student + teacher only. Long enough to hang below the body
                        or dangle over a book edge. 3-finger hands; small feet.
                        Other mascots ignore the prop.
                      </p>
                    </Stack>
                    <Row gap={8} align="end" wrap>
                      <Mascot name="student" size="lg" withLimbs hideCoupon label="Student with limbs" />
                      <Mascot name="teacher" size="lg" withLimbs hideCoupon label="Teacher with limbs" />
                      <Mascot name="student" size="lg" hideCoupon label="Student no limbs (default)" />
                    </Row>
                  </Stack>
                </Card>

                <Card variant="surface" padding="lg">
                  <Stack gap={4}>
                    <Stack gap={1}>
                      <span className="text-eyebrow">Inline use</span>
                      <p className="text-caption">
                        Coupon chips also work standalone — anywhere a code
                        needs to be copyable.
                      </p>
                    </Stack>
                    <Row gap={3} wrap>
                      <CouponChip code="student10" />
                      <CouponChip code="teacher10" />
                      <CouponChip code="welcome2026" />
                    </Row>
                  </Stack>
                </Card>
              </Stack>

              {/* ---- Typography ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Type</span>
                  <h2 className="text-title">Typography</h2>
                </Stack>
                <Card variant="surface" padding="lg">
                  <Stack gap={6}>
                    <Stack gap={1}>
                      <span className="text-eyebrow">text-kinetic</span>
                      <p className="text-kinetic">Big idea.</p>
                    </Stack>
                    <Stack gap={1}>
                      <span className="text-eyebrow">text-display</span>
                      <p className="text-display">Calm, intelligent, premium.</p>
                    </Stack>
                    <Stack gap={1}>
                      <span className="text-eyebrow">text-title</span>
                      <p className="text-title">Editorial title size.</p>
                    </Stack>
                    <Stack gap={1}>
                      <span className="text-eyebrow">text-headline</span>
                      <p className="text-headline">Section headline.</p>
                    </Stack>
                    <Stack gap={1}>
                      <span className="text-eyebrow">text-body-lg</span>
                      <p className="text-body-lg">
                        The platform should feel like Raycast meets Superlist.
                      </p>
                    </Stack>
                    <Stack gap={1}>
                      <span className="text-eyebrow">text-body</span>
                      <p className="text-body">
                        Standard reading size with comfortable line height.
                      </p>
                    </Stack>
                    <Stack gap={1}>
                      <span className="text-eyebrow">text-caption</span>
                      <p className="text-caption">Caption — supporting detail.</p>
                    </Stack>
                    <Stack gap={1}>
                      <span className="text-eyebrow">text-mono</span>
                      <p className="text-mono">ORD-2026-05-26-0001</p>
                    </Stack>
                  </Stack>
                </Card>
              </Stack>

              {/* ---- Semantic colors ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Color</span>
                  <h2 className="text-title">Semantic tokens</h2>
                </Stack>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {semantic.map((name) => (
                    <Card
                      key={name}
                      variant="surface"
                      padding="none"
                      className="overflow-hidden"
                    >
                      <div
                        className="h-20 w-full"
                        style={{ backgroundColor: `var(--${name})` }}
                      />
                      <div className="p-3">
                        <p className="text-mono text-xs">--{name}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </Stack>

              {/* ---- Status tokens ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Status</span>
                  <h2 className="text-title">Order pills</h2>
                </Stack>
                <Row gap={3} wrap>
                  {status.map((name) => (
                    <div
                      key={name}
                      className="rounded-full px-4 py-2 text-mono-tag"
                      style={{
                        backgroundColor: `var(--${name})`,
                        color: `var(--${name}-foreground)`,
                      }}
                    >
                      {name}
                    </div>
                  ))}
                </Row>
              </Stack>

              {/* ---- Buttons ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Action</span>
                  <h2 className="text-title">Buttons</h2>
                </Stack>
                <Card variant="surface" padding="lg">
                  <Stack gap={6}>
                    <Stack gap={2}>
                      <span className="text-eyebrow">Variants</span>
                      <Row gap={3} wrap>
                        <Button>Default</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="link">Link</Button>
                      </Row>
                    </Stack>
                    <Stack gap={2}>
                      <span className="text-eyebrow">Sizes</span>
                      <Row gap={3} align="center" wrap>
                        <Button size="sm">Small</Button>
                        <Button size="md">Medium</Button>
                        <Button size="lg">Large</Button>
                        <Button size="icon" aria-label="Sparkles">
                          <Sparkles />
                        </Button>
                      </Row>
                    </Stack>
                    <Stack gap={2}>
                      <span className="text-eyebrow">With icon</span>
                      <Row gap={3} wrap>
                        <Button>
                          Browse the store <ArrowRight />
                        </Button>
                        <Button variant="outline">
                          <Sparkles /> Explore community
                        </Button>
                      </Row>
                    </Stack>
                  </Stack>
                </Card>
              </Stack>

              {/* ---- Forms ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Input</span>
                  <h2 className="text-title">Form primitives</h2>
                  <p className="text-body text-muted-foreground max-w-2xl">
                    Same control set works on the cinematic storefront and the
                    operational admin. Always-visible labels, 44px touch
                    targets on default size, brand-colored focus rings.
                  </p>
                </Stack>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card variant="surface" padding="lg">
                    <Stack gap={4}>
                      <span className="text-eyebrow">Text fields</span>
                      <FormField
                        label="Email"
                        description="Where order receipts and digital access links go."
                        required
                      >
                        <Input type="email" placeholder="you@school.edu" />
                      </FormField>
                      <FormField label="Coupon code" error="That code is invalid or expired.">
                        <Input placeholder="STUDENT10" />
                      </FormField>
                      <FormField
                        label="Notes"
                        description="Optional — anything special about this order."
                      >
                        <Textarea placeholder="Wrap as a gift, deliver after 5pm…" />
                      </FormField>
                    </Stack>
                  </Card>

                  <Card variant="surface" padding="lg">
                    <Stack gap={4}>
                      <span className="text-eyebrow">Choice fields</span>
                      <FormField label="Curriculum" description="Used to filter the catalog.">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select one" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ibdp">IB Diploma Programme</SelectItem>
                            <SelectItem value="igcse">IGCSE</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label="Format" showLabel>
                        <RadioGroup defaultValue="physical">
                          <Row gap={3} align="center" className="cursor-pointer">
                            <RadioGroupItem value="physical" id="fmt-physical" />
                            <Label htmlFor="fmt-physical" className="font-normal">
                              Physical book
                            </Label>
                          </Row>
                          <Row gap={3} align="center">
                            <RadioGroupItem value="digital" id="fmt-digital" />
                            <Label htmlFor="fmt-digital" className="font-normal">
                              Digital PDF + audio
                            </Label>
                          </Row>
                          <Row gap={3} align="center">
                            <RadioGroupItem value="bundle" id="fmt-bundle" />
                            <Label htmlFor="fmt-bundle" className="font-normal">
                              Bundle (10% off)
                            </Label>
                          </Row>
                        </RadioGroup>
                      </FormField>

                      <Stack gap={2}>
                        <Row gap={3} align="center">
                          <Checkbox id="cb-tos" defaultChecked />
                          <Label htmlFor="cb-tos" className="font-normal">
                            I&rsquo;ve read the no-returns policy
                          </Label>
                        </Row>
                        <Row gap={3} align="center">
                          <Checkbox id="cb-news" />
                          <Label htmlFor="cb-news" className="font-normal">
                            Send me new release announcements
                          </Label>
                        </Row>
                      </Stack>
                    </Stack>
                  </Card>
                </div>
              </Stack>

              {/* ---- Badges ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Tag</span>
                  <h2 className="text-title">Badges</h2>
                  <p className="text-body text-muted-foreground max-w-2xl">
                    Mode B order-state colors flow straight from the
                    semantic status tokens. Variants share the same mono
                    type rhythm.
                  </p>
                </Stack>
                <Card variant="surface" padding="lg">
                  <Stack gap={6}>
                    <Stack gap={2}>
                      <span className="text-eyebrow">Status (admin)</span>
                      <Row gap={2} wrap>
                        <Badge variant="destructive">New</Badge>
                        <Badge variant="warning">Packed</Badge>
                        <Badge variant="success">Shipped</Badge>
                        <Badge variant="pending">Pending payment</Badge>
                      </Row>
                    </Stack>
                    <Stack gap={2}>
                      <span className="text-eyebrow">Generic</span>
                      <Row gap={2} wrap>
                        <Badge>Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="outline">Outline</Badge>
                        <Badge variant="brand">Brand</Badge>
                      </Row>
                    </Stack>
                    <Stack gap={2}>
                      <span className="text-eyebrow">In context</span>
                      <Row gap={2} align="center" wrap>
                        <span className="text-mono text-sm">ORD-2026-05-26-0001</span>
                        <Badge variant="warning">Packed</Badge>
                        <span className="text-caption">·</span>
                        <span className="text-mono text-sm">student10</span>
                        <Badge variant="success" size="sm">Applied</Badge>
                      </Row>
                    </Stack>
                  </Stack>
                </Card>
              </Stack>

              {/* ---- States ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">State</span>
                  <h2 className="text-title">Loading, empty, error</h2>
                  <p className="text-body text-muted-foreground max-w-2xl">
                    Every list, table, or fetched view must define all three
                    (CLAUDE.md §6 + §11). Empty states get a mascot on
                    storefront and a quiet icon on admin.
                  </p>
                </Stack>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card variant="surface" padding="lg">
                    <Stack gap={4}>
                      <span className="text-eyebrow">Loading</span>
                      <Stack gap={3}>
                        <Skeleton shape="block" className="h-24" />
                        <Skeleton shape="line" className="w-3/4" />
                        <Skeleton shape="line" className="w-1/2" />
                      </Stack>
                    </Stack>
                  </Card>

                  <Card variant="surface" padding="none" className="overflow-hidden">
                    <EmptyState
                      mascot="bookworm"
                      title="No orders yet"
                      description="When students place their first order, you'll see it here."
                      action={
                        <Button size="sm" variant="outline">
                          Share the store <ArrowRight />
                        </Button>
                      }
                    />
                  </Card>

                  <Card variant="surface" padding="none" className="overflow-hidden">
                    <ErrorState
                      title="Couldn't load orders"
                      description="The connection blinked. The issue is on our side."
                      action={
                        <Button size="sm" variant="outline">
                          Try again
                        </Button>
                      }
                    />
                  </Card>
                </div>

                <Card variant="surface" padding="none" className="overflow-hidden">
                  <EmptyState
                    icon={ShoppingBag}
                    title="Cart is empty"
                    description="Browse the catalog to add your first item."
                    action={<Button size="sm">Open store</Button>}
                  />
                </Card>
              </Stack>

              {/* ---- Overlays ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Overlay</span>
                  <h2 className="text-title">Modals, sheets, popovers, toasts</h2>
                  <p className="text-body text-muted-foreground max-w-2xl">
                    Dialog for centered confirmations, Drawer for mobile
                    full-screen actions, Popover for inline detail, Toast
                    for transient feedback. Same token vocabulary across all.
                  </p>
                </Stack>

                <Card variant="surface" padding="lg">
                  <Stack gap={6}>
                    <Stack gap={2}>
                      <span className="text-eyebrow">Triggers</span>
                      <Row gap={3} wrap>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline">Open dialog</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Mark as shipped?</DialogTitle>
                              <DialogDescription>
                                This will email the customer their tracking link.
                                You can&rsquo;t undo this.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">Cancel</Button>
                              <Button>Mark shipped</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Drawer>
                          <DrawerTrigger asChild>
                            <Button variant="outline">Open drawer</Button>
                          </DrawerTrigger>
                          <DrawerContent>
                            <DrawerHeader>
                              <DrawerTitle>Order actions</DrawerTitle>
                              <DrawerDescription>
                                Quick actions for ORD-2026-05-26-0001.
                              </DrawerDescription>
                            </DrawerHeader>
                            <div className="px-6 pb-2">
                              <Stack gap={2}>
                                <Button variant="outline">Mark as packed</Button>
                                <Button variant="outline">Print label</Button>
                                <Button variant="outline">Copy billing details</Button>
                              </Stack>
                            </div>
                            <DrawerFooter>
                              <Button variant="ghost">Close</Button>
                            </DrawerFooter>
                          </DrawerContent>
                        </Drawer>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline">Open popover</Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <Stack gap={2}>
                              <h4 className="text-headline">Coupon details</h4>
                              <p className="text-caption">
                                <span className="text-mono">student10</span> applies a flat 10%
                                discount on physical + digital goods. Amazon
                                purchases are exempt.
                              </p>
                            </Stack>
                          </PopoverContent>
                        </Popover>
                      </Row>
                    </Stack>

                    <Stack gap={2}>
                      <span className="text-eyebrow">Toasts</span>
                      <ToastDemoButtons />
                    </Stack>

                    <Stack gap={2}>
                      <span className="text-eyebrow">Theme toggle</span>
                      <Row gap={3} align="center">
                        <ThemeToggle />
                        <p className="text-caption">
                          Single button, flips between light and dark.
                        </p>
                      </Row>
                    </Stack>
                  </Stack>
                </Card>
              </Stack>

              {/* ---- Cards ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Surface</span>
                  <h2 className="text-title">Cards</h2>
                </Stack>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card variant="surface">
                    <CardHeader>
                      <CardTitle>Surface</CardTitle>
                      <CardDescription>
                        Opaque background with a soft border. Works in both
                        UX modes.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-caption">
                        Default for most content surfaces.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button size="sm" variant="outline">
                        Action
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card variant="translucent">
                    <CardHeader>
                      <CardTitle>Translucent</CardTitle>
                      <CardDescription>
                        Glassmorphic Mode A surface. Auto-flattens in
                        operational routes.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-caption">
                        Reserved for storefront ambience.
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="flat">
                    <CardHeader>
                      <CardTitle>Flat</CardTitle>
                      <CardDescription>
                        No border, no fill. Pure grouping container.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-caption">For dense admin layouts.</p>
                    </CardContent>
                  </Card>
                </div>
              </Stack>
            </Stack>
          </Section>
        </Container>
      </main>
    </>
  );
}
