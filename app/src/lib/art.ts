// Art asset loader. Drop an image into app/src/assets/<category>/<key>.<ext> and it's
// available here by `key` — no code change. Missing art returns null so callers can fall
// back to a placeholder. Uses Vite's import.meta.glob (build-time, hashed urls).
//
// See docs/design-system.md and app/src/assets/README.md.

type UrlMap = Record<string, string>;

const GLOB = "*.{png,jpg,jpeg,webp,svg}";

const modifierFiles = import.meta.glob("../assets/modifiers/*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as UrlMap;

const tileFiles = import.meta.glob("../assets/tiles/*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as UrlMap;

const backgroundFiles = import.meta.glob("../assets/backgrounds/*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as UrlMap;

const iconFiles = import.meta.glob("../assets/icons/*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as UrlMap;

const brandFiles = import.meta.glob("../assets/brand/*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as UrlMap;

// Match a file whose basename (without extension) equals the key.
function lookup(files: UrlMap, key: string): string | null {
  for (const [path, url] of Object.entries(files)) {
    const base = path.split("/").pop()!.replace(/\.[^.]+$/, "");
    if (base === key) return url;
  }
  return null;
}

export const modifierArt = (id: string): string | null => lookup(modifierFiles, id);
export const tileArt = (variant: string): string | null => lookup(tileFiles, variant);
export const backgroundArt = (name: string): string | null => lookup(backgroundFiles, name);
export const iconArt = (name: string): string | null => lookup(iconFiles, name);
export const brandArt = (name: string): string | null => lookup(brandFiles, name);

// GLOB is exported only to keep the supported-extensions list in one referenced place.
export const SUPPORTED_GLOB = GLOB;
