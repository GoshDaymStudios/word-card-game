import { modifierArt } from "../lib/art";
import "./ModifierCard.css";

// A modifier ("joker") card. Shows the art at app/src/assets/modifiers/<id>.png when
// present, otherwise a styled name fallback. Always has a tooltip with the description.
export function ModifierCard({
  id,
  name,
  description,
  size = "sm",
}: {
  id: string;
  name: string;
  description: string;
  size?: "sm" | "md";
}) {
  const art = modifierArt(id);
  return (
    <div className={`mod-card mod-${size}`} title={`${name} — ${description}`}>
      {art ? (
        <img src={art} alt={name} className="mod-art" />
      ) : (
        <span className="mod-fallback">{name}</span>
      )}
    </div>
  );
}
