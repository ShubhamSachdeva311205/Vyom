/**
 * NoiseLayer — fixed-position film grain that sits above all content.
 * Drop once at the root of a storefront layout; it inherits opacity
 * from --noise-opacity and is auto-suppressed under
 * [data-mode="operational"] via globals.css.
 *
 * Server component. No JS, just a stack-context-pinned div.
 */
export function NoiseLayer() {
  return <div aria-hidden="true" className="noise-layer" />;
}
