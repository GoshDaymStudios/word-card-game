# Art assets

Drop images here and they're picked up automatically — **filename = key** (lowercase,
kebab-case). No code change needed. Missing art falls back to a styled placeholder, so the
game always works even with no art yet. Loader: `app/src/lib/art.ts`. See
`docs/design-system.md` for the full plan.

Supported: `.png .jpg .jpeg .webp .svg`

| Folder | Key = | Examples |
|---|---|---|
| `modifiers/` | the `ModifierId` | `vowel-lover.png`, `sniper.png`, `comeback.png` |
| `tiles/` | a variant name | `default.png`, `foil.png`, `gold.png` |
| `backgrounds/` | a scene name | `game.jpg`, `daily.jpg`, `menu.jpg` |
| `icons/` | an icon name | `heart.svg`, `money.svg`, `reveal.svg` |
| `brand/` | brand asset | `logo.png` |

ModifierIds (for `modifiers/`): `vowel-lover`, `patient`, `sniper`, `comeback`, `snowball`,
`scholar`, `gambler`, `consonant-crusher`.
