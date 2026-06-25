import { useState } from "react";
import { getFlipSetting, setFlipSetting, listFlipSounds } from "../lib/sound";

// Choose which flip sound plays: a random one fixed per day, a fresh random each guess,
// or a specific clip (any file dropped in app/src/assets/flips/). Persisted in localStorage.
export function FlipSoundPicker() {
  const [value, setValue] = useState(getFlipSetting());
  const sounds = listFlipSounds();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setFlipSetting(e.target.value);
    setValue(e.target.value);
  }

  return (
    <select
      className="theme-select"
      value={value}
      onChange={onChange}
      aria-label="Flip sound"
      title="Flip sound"
    >
      <option value="daily">🎲 Daily</option>
      <option value="shuffle">🔀 Shuffle</option>
      {sounds.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
