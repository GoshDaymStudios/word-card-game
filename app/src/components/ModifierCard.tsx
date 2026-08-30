import { modifierArt } from "../lib/art";
import "./ModifierCard.css";

// A muse ("joker") card. Shows the art at app/src/assets/modifiers/<id>.svg when
// present, otherwise a styled name fallback. Always has a tooltip with the description.
// Optional shop dressing: price tag, rarity ribbon, disabled ("gagged") state.
export function ModifierCard({
  id,
  name,
  description,
  size = "sm",
  price,
  rarity,
  disabled = false,
  onClick,
}: {
  id: string;
  name: string;
  description: string;
  size?: "sm" | "md";
  price?: number;
  rarity?: "common" | "uncommon" | "rare";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const art = modifierArt(id);
  const classes = [
    "mod-card",
    `mod-${size}`,
    rarity ? `mod-rarity-${rarity}` : "",
    disabled ? "mod-disabled" : "",
    onClick ? "mod-clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} title={`${name} — ${description}`} onClick={onClick}>
      {art ? (
        <img src={art} alt={name} className="mod-art" />
      ) : (
        <span className="mod-fallback">{name}</span>
      )}
      {price !== undefined && <span className="mod-price">{price}⬤</span>}
      {disabled && <span className="mod-gag">✕</span>}
    </div>
  );
}
