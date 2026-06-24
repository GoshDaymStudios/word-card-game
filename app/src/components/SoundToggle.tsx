import { useState } from "react";
import { isMuted, setMuted } from "../lib/sound";

// Mute / unmute button (persisted via lib/sound).
export function SoundToggle() {
  const [muted, setLocal] = useState(isMuted());

  function toggle() {
    const next = !muted;
    setMuted(next);
    setLocal(next);
  }

  return (
    <button
      className="sound-toggle"
      onClick={toggle}
      aria-label={muted ? "Unmute" : "Mute"}
      title={muted ? "Unmute" : "Mute"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
