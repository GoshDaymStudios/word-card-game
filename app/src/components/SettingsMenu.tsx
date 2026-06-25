import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { FlipSoundPicker } from "./FlipSoundPicker";
import { SoundToggle } from "./SoundToggle";
import "./SettingsMenu.css";

// A gear menu that groups the cosmetic/sound controls so the nav stays clean.
export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(56);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) {
      // Pin the panel just below the gear (the panel is fixed to the viewport right).
      setTop(btnRef.current.getBoundingClientRect().bottom + 8);
    }
    setOpen((o) => !o);
  }

  return (
    <div className="settings" ref={ref}>
      <button
        ref={btnRef}
        className="settings-btn"
        onClick={toggle}
        aria-label="Settings"
        aria-expanded={open}
        title="Settings"
      >
        ⚙️
      </button>

      {open && (
        <div className="settings-panel" style={{ top }}>
          <div className="settings-row">
            <span className="settings-label">Skin</span>
            <ThemeToggle />
          </div>
          <div className="settings-row">
            <span className="settings-label">Sound</span>
            <FlipSoundPicker />
          </div>
          <div className="settings-row">
            <span className="settings-label">Mute</span>
            <SoundToggle />
          </div>
        </div>
      )}
    </div>
  );
}
