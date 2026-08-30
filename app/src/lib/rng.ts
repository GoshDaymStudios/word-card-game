// Seeded RNG with named streams. Every random decision in a run draws from its own
// stream (e.g. "word:3", "shop:2:0") hashed together with the run seed, so seeded runs
// stay reproducible no matter what order effects are evaluated in — and drawing from
// one stream never shifts another.

// fnv1a hash of a string → 32-bit uint.
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32 PRNG (moved here from gameEngine).
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A fresh generator for `seed` + `stream`. Call again with the same args → same sequence.
export function rngStream(seed: string, stream: string): () => number {
  return mulberry32(fnv1a(`${seed}:${stream}`));
}

// Uniform pick from a list using the given generator.
export function pickFrom<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

// Seeded Fisher–Yates shuffle (returns a new array).
export function shuffled<T>(rng: () => number, list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Human-friendly random seed for new runs (not security-sensitive).
export function randomSeed(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
