// Ink registry — one-shot consumable vials (the tarot analog). The player holds at
// most 2 and uses them mid-round. The actual application logic lives in gameEngine's
// applyConsumable (inks mutate run state in ways hooks can't express).
export type InkId =
  | "diviners-ink"
  | "bleach"
  | "sympathetic-ink"
  | "gilded-ink"
  | "sepia"
  | "copyists-ink"
  | "blotting-paper"
  | "india-ink";

export type InkDef = {
  id: InkId;
  name: string;
  description: string;
  flavor?: string;
  price: number;
  // When the vial can be used: mid-round only, or anywhere (shop included).
  usable: "round" | "anywhere";
};

export const INKS: Record<InkId, InkDef> = {
  "diviners-ink": {
    id: "diviners-ink",
    name: "Diviner's Ink",
    description: "Reveal one letter of the answer in its correct position.",
    flavor: "Reads the page before it is written.",
    price: 3,
    usable: "round",
  },
  bleach: {
    id: "bleach",
    name: "Bleach",
    description: "Rule out 5 letters that are not in the answer.",
    flavor: "Sometimes the kindest edit is deletion.",
    price: 3,
    usable: "round",
  },
  "sympathetic-ink": {
    id: "sympathetic-ink",
    name: "Sympathetic Ink",
    description: "+1 guess this round.",
    flavor: "Invisible until you need it most.",
    price: 3,
    usable: "round",
  },
  "gilded-ink": {
    id: "gilded-ink",
    name: "Gilded Ink",
    description: "Green tiles score double Letters this round.",
    flavor: "Write the ending in gold.",
    price: 4,
    usable: "round",
  },
  sepia: {
    id: "sepia",
    name: "Sepia",
    description: "Swap the answer for a new word — your guesses are re-marked against it.",
    flavor: "History, rewritten in warm brown.",
    price: 3,
    usable: "round",
  },
  "copyists-ink": {
    id: "copyists-ink",
    name: "Copyist's Ink",
    description: "Permanently strengthen a random muse you hold by 25%.",
    flavor: "A faithful copy, only better.",
    price: 4,
    usable: "anywhere",
  },
  "blotting-paper": {
    id: "blotting-paper",
    name: "Blotting Paper",
    description: "The next failed round costs no life.",
    flavor: "Absorbs the worst of it.",
    price: 3,
    usable: "anywhere",
  },
  "india-ink": {
    id: "india-ink",
    name: "India Ink",
    description: "+5⬤ immediately.",
    flavor: "Dense, black, and extremely liquid.",
    price: 2,
    usable: "anywhere",
  },
};

export const ALL_INK_IDS = Object.keys(INKS) as InkId[];

export function getInk(id: InkId): InkDef {
  return INKS[id];
}
