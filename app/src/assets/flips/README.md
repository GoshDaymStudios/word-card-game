# Flip sounds

Drop any number of short flip clips here (the user has ~20). The flip-sound picker in the
nav lets you choose how they're used:

- **🎲 Daily** — one clip picked at random, fixed for the whole day (same all day).
- **🔀 Shuffle** — a fresh random clip on every guess.
- **🔊 <name>** — always that specific clip.

Filename = the name shown in the picker. Supported: mp3, ogg, wav, m4a.

Within a row the chosen clip plays once per letter, pitched up slightly across the row
(cascade handled in code). If this folder is empty it falls back to `../sfx/flip.*`, then a
built-in synth tick. Choice is remembered in localStorage.
