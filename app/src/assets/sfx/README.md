# Sound effects

Drop short audio clips here — **filename = key** → `playSfx("<key>")`. Missing files are
no-ops (except `click` and `flip`, which fall back to a built-in synth blip). Supported:
mp3, ogg, wav, m4a.

Keys the app already triggers:
- `click`  — any button press (synth fallback built in)
- `flip`   — played once per letter on each guess, staggered with the tile flip and pitched
             up slightly across the row. **One short clip is enough** — the cascade + pitch
             rise is done in code (`playFlipRow`).
- `win`    — run / daily solved
- `lose`   — run lost / daily failed

Add more by calling `playSfx("yourkey")` where you want them.
