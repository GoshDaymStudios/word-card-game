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
function synthClick(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx ??= new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch {
    /* audio unavailable — ignore */
  }
}

// ---- SFX (one-shot) --------------------------------------------------------
export function playSfx(name: string, volume = 0.5): void {
  if (muted) return;
  const url = urlFor(sfxFiles, name);
  if (!url) {
    if (name === "click") synthClick();
    return;
  }
  const a = new Audio(url);
  a.volume = volume;
  void a.play().catch(() => {});
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
