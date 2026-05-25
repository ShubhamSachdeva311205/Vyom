import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
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
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mascot, type MascotName } from "@/components/ui/mascot";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Container } from "@/components/layouts/container";
import { NoiseLayer } from "@/components/layouts/noise-layer";
import { Row, Stack } from "@/components/layouts/stack";
import { Section } from "@/components/layouts/section";

const FEATURED: readonly MascotName[] = ["student", "teacher"] as const;
const DECORATIVE: readonly MascotName[] = ["bookworm", "star"] as const;

const BLURBS: Record<MascotName, string> = {
  student: "Round, white V-collar, cool emerald gradient. Carries student10.",
  teacher: "Slightly taller, glasses, warm emerald with amber lift. Carries teacher10.",
  bookworm: "Tall vertical capsule, violet-shifted gradient. Decorative.",
  star: "Wide asymmetric pebble, warm amber→emerald. Decorative.",
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
