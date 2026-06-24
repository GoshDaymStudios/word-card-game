// Sound system. Same "drop a file in a folder" idea as the art pipeline:
//   app/src/assets/sfx/<name>.mp3    -> playSfx("<name>")
//   app/src/assets/music/<name>.mp3  -> ensureMusic("<name>")
// Missing files are no-ops, EXCEPT "click" which falls back to a tiny synth blip so the
// UI has audible feedback out of the box. Mute is remembered in localStorage.
//
// Supported: mp3, ogg, wav, m4a. See docs/design-system.md.

type UrlMap = Record<string, string>;

const sfxFiles = import.meta.glob("../assets/sfx/*.{mp3,ogg,wav,m4a}", {
  eager: true,
  query: "?url",
  import: "default",
}) as UrlMap;

const musicFiles = import.meta.glob("../assets/music/*.{mp3,ogg,wav,m4a}", {
  eager: true,
  query: "?url",
  import: "default",
}) as UrlMap;

function urlFor(files: UrlMap, key: string): string | null {
  for (const [path, url] of Object.entries(files)) {
    if (path.split("/").pop()!.replace(/\.[^.]+$/, "") === key) return url;
  }
  return null;
}

// ---- Mute (persisted) ------------------------------------------------------
let muted = typeof localStorage !== "undefined" && localStorage.getItem("muted") === "1";
let currentMusic: HTMLAudioElement | null = null;

export function isMuted(): boolean {
  return muted;
}
export function setMuted(value: boolean): void {
  muted = value;
  if (typeof localStorage !== "undefined") localStorage.setItem("muted", value ? "1" : "0");
  if (currentMusic) currentMusic.muted = value;
}

// ---- Built-in synth click (fallback when no click.mp3) ---------------------
let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx ??= new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

// Short synth blip — fallback for "click" when no click.<ext> is present.
function synthBlip(freq: number, peak: number, dur: number, type: OscillatorType): void {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

type SfxOpts = { volume?: number; rate?: number };

// ---- SFX (one-shot) --------------------------------------------------------
export function playSfx(name: string, opts: SfxOpts = {}): void {
  if (muted) return;
  const { volume = 0.5, rate = 1 } = opts;
  const url = urlFor(sfxFiles, name);
  if (!url) {
    // Built-in synth fallbacks so the UI is audible before any files are added.
    if (name === "click") synthBlip(420, 0.16, 0.09, "triangle");
    else if (name === "flip") synthBlip(300 * rate, 0.08, 0.06, "square");
    return;
  }
  const a = new Audio(url);
  a.volume = volume;
  a.playbackRate = rate; // pitch/speed (used for the rising flip cascade)
  void a.play().catch(() => {});
}

// Play the flip sfx once per letter, staggered to match the tile flip animation,
// with a slight pitch rise across the row (Balatro-style cascade).
export function playFlipRow(count = 5, staggerMs = 90): void {
  for (let i = 0; i < count; i++) {
    const rate = 1 + i * 0.06;
    window.setTimeout(() => playSfx("flip", { volume: 0.35, rate }), i * staggerMs);
  }
}

// ---- Music (looping background) --------------------------------------------
export function ensureMusic(name: string, volume = 0.3): void {
  const url = urlFor(musicFiles, name);
  if (!url) return;
  if (currentMusic?.dataset.name === name) return;
  stopMusic();
  const a = new Audio(url);
  a.loop = true;
  a.volume = volume;
  a.muted = muted;
  a.dataset.name = name;
  currentMusic = a;
  a.play().catch(() => {
    // Autoplay blocked until a user gesture — resume on the first one.
    const resume = () => {
      a.play().catch(() => {});
      window.removeEventListener("pointerdown", resume);
    };
    window.addEventListener("pointerdown", resume, { once: true });
  });
}

export function stopMusic(): void {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic = null;
  }
}
