# Sound effects

Drop short audio clips here — **filename = key** → `playSfx("<key>")`. Missing files are
no-ops (except `click`, which falls back to a built-in synth blip). Supported: mp3, ogg, wav, m4a.

Keys the app already triggers:
- `click`  — any button press (synth fallback built in)
- `win`    — run / daily solved
- `lose`   — run lost / daily failed

Add more by calling `playSfx("yourkey")` where you want them.
