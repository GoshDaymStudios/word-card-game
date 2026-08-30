import { ModifierCard } from "../../components/ModifierCard";
import { rerollCost } from "./gameEngine";
import { getInk } from "./inks";
import { getMuse, museDescription } from "./muses";
import type { RunState } from "./types";
import "./ShopView.css";

// The Scriptorium — between-blinds shop. Buy muses and ink vials, sell held muses
// at half price, reroll the stock at escalating cost.
export function ShopView({
  run,
  onBuy,
  onSell,
  onReroll,
  onLeave,
}: {
  run: RunState;
  onBuy: (index: number) => void;
  onSell: (museIndex: number) => void;
  onReroll: () => void;
  onLeave: () => void;
}) {
  const shop = run.shop;
  if (!shop) return null;
  const cost = rerollCost(run);

  return (
    <div className="shop">
      <h2 className="shop-title">The Scriptorium</h2>

      <div className="shop-stock">
        {shop.items.map((item, i) => {
          if (item.sold) {
            return (
              <div key={i} className="shop-item sold">
                <span className="shop-sold-label">Sold</span>
              </div>
            );
          }
          const affordable = run.ink >= item.price;
          if (item.kind === "muse") {
            const def = getMuse(item.id);
            return (
              <div key={i} className={`shop-item ${affordable ? "" : "poor"}`}>
                <ModifierCard
                  id={item.id}
                  name={def.name}
                  description={museDescription(item.id)}
                  size="md"
                  rarity={def.rarity}
                />
                <strong className="shop-item-name">{def.name}</strong>
                <span className="shop-item-desc">{museDescription(item.id)}</span>
                <button disabled={!affordable} onClick={() => onBuy(i)}>
                  Buy · {item.price}⬤
                </button>
              </div>
            );
          }
          if (item.kind === "ink") {
            const def = getInk(item.id);
            return (
              <div key={i} className={`shop-item ${affordable ? "" : "poor"}`}>
                <div className="shop-vial" title={def.description}>
                  ⚱
                </div>
                <strong className="shop-item-name">{def.name}</strong>
                <span className="shop-item-desc">{def.description}</span>
                <button disabled={!affordable} onClick={() => onBuy(i)}>
                  Buy · {item.price}⬤
                </button>
              </div>
            );
          }
          return (
            <div key={i} className={`shop-item ${affordable ? "" : "poor"}`}>
              <div className="shop-vial" title="An extra life for the manuscript.">
                ❦
              </div>
              <strong className="shop-item-name">Spare Quill</strong>
              <span className="shop-item-desc">+1 life.</span>
              <button disabled={!affordable} onClick={() => onBuy(i)}>
                Buy · {item.price}⬤
              </button>
            </div>
          );
        })}
      </div>

      <div className="shop-actions">
        <button disabled={run.ink < cost} onClick={onReroll}>
          Reroll · {cost}⬤
        </button>
        <button className="shop-leave" onClick={onLeave}>
          Continue writing →
        </button>
      </div>

      {run.muses.length > 0 && (
        <div className="shop-sell">
          <h3 className="shop-sell-title">Your muses (sell for half)</h3>
          <div className="shop-sell-row">
            {run.muses.map((m, i) => {
              const def = getMuse(m.id);
              const refund = Math.floor(def.price / 2) + (m.level - 1);
              return (
                <div key={`${m.id}-${i}`} className="shop-sell-item">
                  <ModifierCard
                    id={m.id}
                    name={def.name}
                    description={museDescription(m.id, m.level)}
                    rarity={def.rarity}
                  />
                  <button onClick={() => onSell(i)}>Sell · {refund}⬤</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
