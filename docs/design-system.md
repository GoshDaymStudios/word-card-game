# Design system — Cards & Words

Visual direction + the art/asset pipeline. Heavy inspiration from **Balatro** (chunky dark
panels, glossy cards, a bold "base × mult" scoring readout, juicy neon accents) — but with
**our own palette** so it doesn't read as a clone.

## 1. Palette (CSS variables) + live skin switcher

The whole look is driven by variables in `app/src/index.css`. **Re-palette by editing those
~10 values — nothing else.**

- **Default skin: "Classic"** — light, minimal, Wordle-style (white bg, green accent, clean
  sans heading). Lives in `:root`.
- **Dark skins** (Balatro-inspired, chunky Lilita One display + glow background) are
  `:root[data-theme="..."]` overrides: **Twilight** (violet), **Ember** (warm), **Deep Sea**
  (teal). Each sets its palette + `--bg-image` (glow) + `--display`.

Switched **live** from the **gear (⚙️) settings menu** in the nav (`SettingsMenu` →
`ThemeToggle` sets `<html data-theme>`, remembered in `localStorage`). The menu groups three
labeled controls: **Skin** (palette), **Sound** (flip-sound picker), **Mute**. Add a skin by
copying a `:root[data-theme="..."]` block in `index.css` + an entry in `ThemeToggle.tsx`.

| Variable | Role | Default |
|---|---|---|
| `--bg` | page background base | `#0f0c18` (near-black violet) |
| `--panel` | card/panel surface | `#1d1730` |
| `--panel-2` | raised surface | `#271f3f` |
| `--border` | panel borders | `#3a2f56` |
| `--text-h` | headings / strong text | `#f1ecff` |
| `--text` | body text | `#a99fc4` |
| `--accent` | brand / interactive | `#a855f7` (violet) |
| `--base` | "chips"/base score color | `#22d3ee` (cyan) |
| `--mult` | multiplier color | `#fb5a76` (hot pink) |
| `--gold` | money / rewards | `#f5c542` |

Balatro uses blue chips × red mult on green/blue felt. We use **cyan base × pink mult on a
violet night** + gold rewards. Distinct, same energy. Want a different vibe? Two ready
alternatives are listed at the bottom.

## 2. Typography

- **Display** (`--display`): a chunky rounded face (**Lilita One**, loaded in `index.html`)
  for the brand, headings, and big score numbers — the "game-y" feel.
- **Body / tiles**: a strong system sans (already set) — letters must stay readable.

## 3. Balatro → our game (component mapping)

| Balatro | Cards & Words |
|---|---|
| Jokers (top row) | **Modifiers** held in a run — shown as a card row with art |
| Played hand (center) | the **guess grid** (flip tiles) |
| Hand (bottom) | the on-screen input / keyboard (future) |
| Blue chips × red mult | **base × mult** readout (cyan × pink) |
| Blind / Ante panel | **Ante / Target** panel |
| Money $$$ | run **money** (gold) — future economy hook |

Panels use the `.panel` / `.card` utility classes (rounded, bordered, subtle shadow).

## 4. Art / asset pipeline

Drop an image into the right folder and it shows up — no code change. Files are matched by
**filename = key** (lowercase, kebab-case). Missing art falls back to a styled placeholder,
so the game always works even with zero art.

```
app/src/assets/
  modifiers/    <ModifierId>.png      e.g. vowel-lover.png, sniper.png
  tiles/        <variant>.png         e.g. default.png, foil.png, gold.png
  backgrounds/  <name>.jpg            e.g. game.jpg, daily.jpg, menu.jpg
  icons/        <name>.svg            e.g. heart.svg, money.svg, reveal.svg
  brand/        logo.png
```

Loader: `app/src/lib/art.ts` uses Vite's `import.meta.glob` (eager) to build a
`key → url` map per category. Supported extensions: png, jpg, jpeg, webp, svg.

```ts
import { modifierArt, backgroundArt } from "../lib/art";
modifierArt("sniper");      // -> hashed url, or null if not added yet
backgroundArt("game");      // -> url or null
```

Why `src/assets` (not `public/`): Vite hashes + bundles them (cache-busting, build-time
presence), and the glob gives a clean keyed map. Adding a file is still zero-code — just
name it after its key.

**Art ideas that fit a word game** (creative scope, optional):
- **Modifiers**: a little illustrated "joker" per modifier (8 to start).
- **Tiles**: frame/texture variants — `default`, plus special letters (`foil`/`gold`) for
  future bonus mechanics; optionally a backdrop behind the letter.
- **Backgrounds**: per-mode flowing texture (the Balatro backdrop equivalent).
- **Icons**: hearts (lives), money, the reveal power-up.
- **Brand**: a logo for the nav + landing.

## 4b. Sound pipeline

Same "drop a file in a folder" idea. Loader: `app/src/lib/sound.ts`.

```
app/src/assets/
  sfx/     <name>.mp3    one-shots:  click, win, lose, …
  music/   <name>.mp3    loops:      roguelike, …
  flips/   <name>.mp3    selectable flip clips (drop ~any number)
```

**Intro:** entering Daily or Roguelike plays `sfx/Goshdaymstudios-original.*`.

**Game over:** losing (Daily or Roguelike) plays `sfx/lose.*` ~750ms after the final guess
(so it lands after the flip cascade); roguelike also cuts the music.

**Flip sound picker** (in the nav): choose how the flip clips in `assets/flips/` are used —
**Daily** (one random clip fixed per day), **Shuffle** (random each guess, **default**), or a
specific clip. Persisted in localStorage; one chosen clip plays per row, pitched up across
the letters. ~21 flip clips currently in `assets/flips/`.

- `playSfx("name")` — one-shot. Missing file = no-op, **except `click`** which falls back to
  a built-in synth blip, so buttons make a sound out of the box.
- `ensureMusic("name")` / `stopMusic()` — looping background. Browsers block autoplay until
  the first user gesture; the loader auto-resumes on the first click/tap.
- **Mute** (`SoundToggle` 🔊 in the nav) is remembered in `localStorage`.

Wired already: a click sound on every button; a **flip cascade** (`playFlipRow` plays the
`flip` sfx once per letter, staggered with the tile animation and pitched up across the row —
one clip is enough); `win`/`lose` stings; `roguelike` music loops on `/game`. Add a track by
naming the file after its key.

## 5. Implementation status

- [x] Palette + dark theme foundation (variables, panels, buttons, tiles, background).
- [x] Art loader + folders + fallback; modifiers wired to use art when present.
- [ ] Per-mode background images (loader ready; drop files in `backgrounds/`).
- [ ] Modifier illustrations, tile/letter art, icons, logo (drop files in their folders).
- [ ] Optional: full Balatro-style GamePage layout (sidebar panel, live base × mult).

## Alternative palettes (swap the variables)

- **"Ember"** — warm dark: `--bg #140f0c`, `--accent #f97316`, `--base #fbbf24`,
  `--mult #ef4444`, `--gold #fde68a`.
- **"Deep Sea"** — teal night: `--bg #07171a`, `--accent #2dd4bf`, `--base #38bdf8`,
  `--mult #f472b6`, `--gold #facc15`.
