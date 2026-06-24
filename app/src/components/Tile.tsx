import "./Tile.css";
import type { LetterResult } from "../lib/words";

// Shared letter tile used by both games. When `result` is set the tile is
// "revealed" and plays a staggered flip animation (delay based on `index`).
export function Tile({
  letter,
  result,
  index = 0,
  size = 52,
}: {
  letter: string;
  result?: LetterResult;
  index?: number;
  size?: number;
}) {
  const revealed = result !== undefined;
  const className = revealed ? `tile revealed ${result}` : "tile";
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        animationDelay: revealed ? `${index * 0.09}s` : undefined,
      }}
    >
      {letter}
    </div>
  );
}
