import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CouponChip } from "@/components/ui/coupon-chip";
import { Mascot, type MascotName } from "@/components/ui/mascot";

const MASCOTS: readonly MascotName[] = ["student", "teacher"] as const;
import { Container } from "@/components/layouts/container";
import { NoiseLayer } from "@/components/layouts/noise-layer";
import { Row, Stack } from "@/components/layouts/stack";
import { Section } from "@/components/layouts/section";

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
                  {MASCOTS.map((n) => (
                    <Card key={n} variant="surface" padding="lg">
                      <Stack gap={6} align="center">
                        <Mascot name={n} size="lg" label={n} />
                        <Stack gap={1} align="center">
                          <h3 className="text-headline capitalize">{n}</h3>
                          <p className="text-caption text-center max-w-[28ch]">
                            {n === "student"
                              ? "Cool emerald gradient, slight left tilt."
                              : "Warmer emerald with amber lift, slight right tilt."}
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
