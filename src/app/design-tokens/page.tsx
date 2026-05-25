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
import { Mascot, type MascotName } from "@/components/ui/mascot";
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
] as const;

const status = ["success", "warning", "pending", "destructive"] as const;

const palettes = [
  {
    key: "violet",
    label: "Warm violet",
    blurb: "Superlist / Linear territory. Premium, intellectual.",
  },
  {
    key: "amber",
    label: "Warm amber",
    blurb: "Mindspace / library-at-dusk. Cozy, inviting.",
  },
  {
    key: "emerald",
    label: "Deep emerald",
    blurb: "Scholarly, calm, growth-coded.",
  },
] as const;

const mascots: { name: MascotName; label: string; blurb: string }[] = [
  { name: "bookling", label: "Bookling", blurb: "The reading companion." },
  { name: "stellar", label: "Stellar", blurb: "The aha moment." },
  { name: "lumen", label: "Lumen", blurb: "Night-study calm." },
];

export default function DesignTokensPage() {
  return (
    <>
      <NoiseLayer />
      <main className="bg-mesh-hero min-h-screen">
        <Container>
          <Section spacing="default">
            <Stack gap={12}>
              {/* ---- Hero ---- */}
              <Stack gap={3}>
                <span className="text-eyebrow">Internal · Phase 1.1</span>
                <h1 className="text-display">Foundation tokens.</h1>
                <p className="text-body-lg text-muted-foreground max-w-2xl">
                  Visual calibration surface for Advaita&rsquo;s design system.
                  Pick a palette, scan the textures, meet the mascots.
                </p>
              </Stack>

              {/* ---- Palette comparison ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Pick one</span>
                  <h2 className="text-title">Palette directions</h2>
                  <p className="text-body text-muted-foreground max-w-2xl">
                    Each card below scopes a different brand palette. Notice
                    how the mesh, the CTA, and the mascot accent all shift
                    together — only the brand tokens vary.
                  </p>
                </Stack>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {palettes.map((p) => (
                    <div key={p.key} data-palette={p.key}>
                      <Card
                        variant="surface"
                        padding="lg"
                        className="bg-mesh-aurora bg-noise min-h-[340px] overflow-hidden"
                      >
                        <Stack gap={4}>
                          <Row align="center" justify="between">
                            <span className="text-eyebrow">{p.key}</span>
                            <Mascot name="stellar" tone="brand" size="md" />
                          </Row>
                          <Stack gap={1}>
                            <h3 className="text-headline">{p.label}</h3>
                            <p className="text-caption">{p.blurb}</p>
                          </Stack>
                          <Row gap={2} wrap>
                            <span
                              className="rounded-md px-2 py-1 text-mono text-xs"
                              style={{
                                background: "var(--brand)",
                                color: "var(--brand-foreground)",
                              }}
                            >
                              brand
                            </span>
                            <span
                              className="rounded-md px-2 py-1 text-mono text-xs"
                              style={{
                                background: "var(--brand-soft)",
                                color: "var(--brand-foreground)",
                              }}
                            >
                              brand-soft
                            </span>
                          </Row>
                          <Row gap={2}>
                            <Button size="sm">Primary</Button>
                            <Button size="sm" variant="outline">
                              Outline
                            </Button>
                          </Row>
                        </Stack>
                      </Card>
                    </div>
                  ))}
                </div>
              </Stack>

              {/* ---- Mascots ---- */}
              <Stack gap={6}>
                <Stack gap={2}>
                  <span className="text-eyebrow">Characters</span>
                  <h2 className="text-title">Study companions</h2>
                  <p className="text-body text-muted-foreground max-w-2xl">
                    Hand-authored inline SVG. Each uses{" "}
                    <code className="text-mono">currentColor</code> for the
                    body and the active brand for the accent. Swap with
                    proper illustrations later by replacing the path data.
                  </p>
                </Stack>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {mascots.map((m) => (
                    <Card key={m.name} variant="surface" padding="lg">
                      <Stack gap={4} align="center">
                        <Mascot
                          name={m.name}
                          tone="foreground"
                          size="xl"
                          label={m.label}
                        />
                        <Stack gap={1} align="center">
                          <h3 className="text-headline">{m.label}</h3>
                          <p className="text-caption text-center">{m.blurb}</p>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </div>

                <Card variant="surface" padding="lg">
                  <Stack gap={3}>
                    <span className="text-eyebrow">Tones</span>
                    <Row gap={4} align="center" wrap>
                      <Mascot name="bookling" tone="foreground" size="md" />
                      <Mascot name="bookling" tone="muted" size="md" />
                      <Mascot name="bookling" tone="brand" size="md" />
                      <Mascot name="stellar" tone="foreground" size="md" />
                      <Mascot name="stellar" tone="brand" size="md" />
                      <Mascot name="lumen" tone="foreground" size="md" />
                      <Mascot name="lumen" tone="brand" size="md" />
                    </Row>
                  </Stack>
                </Card>
              </Stack>

              {/* ---- Typography ---- */}
              <Stack gap={6}>
                <h2 className="text-title">Typography</h2>
                <Card variant="surface" padding="lg">
                  <Stack gap={6}>
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
                <h2 className="text-title">Semantic colors</h2>
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
                <h2 className="text-title">Status tokens</h2>
                <Row gap={3} wrap>
                  {status.map((name) => (
                    <div
                      key={name}
                      className="rounded-full px-4 py-2 text-sm font-medium"
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
                <h2 className="text-title">Buttons</h2>
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
                <h2 className="text-title">Cards</h2>
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
