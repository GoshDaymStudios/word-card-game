// Censor registry — the boss rounds. Each censor is a named special rule; like
// Balatro's boss blinds, a small set of rule *kinds* covers the whole roster, and
// each censor is just data choosing a kind (plus tunables). The engine and scorer
// check `rule` at their respective points.
export type CensorId =
  | "redactor"
  | "pedant"
  | "inkblot"
  | "plagiarist"
  | "miser"
  | "silencer"
  | "archaist"
  | "whisperer"
  | "vandal"
  | "perfectionist"
  | "editor";

// The rule kinds. Where each is enforced:
//   banned-letter   scoring: tiles of the banned letter score 0 chips
//   fewer-guesses   round start: attemptsAllowed reduced
//   mask-present    UI: yellow tiles are displayed as gray (they still score)
//   forced-opening  round start: a random word is auto-submitted as guess #1
//   guess-tax       engine: each guess costs 1⬤ (floored at 0)
//   mute-muse       round start: one random held muse is disabled for the round
//   long-words      blind select: word length is forced to 7
//   delayed-reveal  UI: the latest row's feedback is hidden until the next submit
//   greens-demoted  scoring: green tiles score as yellow (chips only; solve still works)
//   raised-target   target ×1.25, but the censor pays double ink
export type CensorRule =
  | { kind: "banned-letter" }
  | { kind: "fewer-guesses"; count: number }
  | { kind: "mask-present" }
  | { kind: "forced-opening" }
  | { kind: "guess-tax"; ink: number }
  | { kind: "mute-muse" }
  | { kind: "long-words" }
  | { kind: "delayed-reveal" }
  | { kind: "greens-demoted" }
  | { kind: "raised-target"; factor: number; payoutFactor: number }
  | { kind: "combined"; rules: CensorRule[] };

export type CensorDef = {
  id: CensorId;
  name: string;
  description: string;
  flavor?: string;
  rule: CensorRule;
  finalOnly?: boolean; // reserved for the chapter-8 showdown
};

export const CENSORS: Record<CensorId, CensorDef> = {
  redactor: {
    id: "redactor",
    name: "The Redactor",
    description: "One letter is struck from the record — its tiles score 0 Letters.",
    flavor: "█████.",
    rule: { kind: "banned-letter" },
  },
  pedant: {
    id: "pedant",
    name: "The Pedant",
    description: "2 fewer guesses.",
    flavor: "Brevity. Was that so hard?",
    rule: { kind: "fewer-guesses", count: 2 },
  },
  inkblot: {
    id: "inkblot",
    name: "The Inkblot",
    description: "Yellow tiles are shown as gray. They still score.",
    flavor: "What do YOU see in it?",
    rule: { kind: "mask-present" },
  },
  plagiarist: {
    id: "plagiarist",
    name: "The Plagiarist",
    description: "Your first guess is written for you.",
    flavor: "Originality is overrated, they insist.",
    rule: { kind: "forced-opening" },
  },
  miser: {
    id: "miser",
    name: "The Miser",
    description: "Every guess costs 1⬤.",
    flavor: "Paper isn't free, you know.",
    rule: { kind: "guess-tax", ink: 1 },
  },
  silencer: {
    id: "silencer",
    name: "The Silencer",
    description: "One of your muses is gagged this round.",
    flavor: "Shhh.",
    rule: { kind: "mute-muse" },
  },
  archaist: {
    id: "archaist",
    name: "The Archaist",
    description: "The word is always 7 letters.",
    flavor: "Forsooth, whomst'd've.",
    rule: { kind: "long-words" },
  },
  whisperer: {
    id: "whisperer",
    name: "The Whisperer",
    description: "Each guess's feedback is revealed only when you submit the next.",
    flavor: "…what? Speak up.",
    rule: { kind: "delayed-reveal" },
  },
  vandal: {
    id: "vandal",
    name: "The Vandal",
    description: "Green tiles score as yellow.",
    flavor: "Scratches gold off every page.",
    rule: { kind: "greens-demoted" },
  },
  perfectionist: {
    id: "perfectionist",
    name: "The Perfectionist",
    description: "Target raised 25% — but pays double ink.",
    flavor: "Almost. Again.",
    rule: { kind: "raised-target", factor: 1.25, payoutFactor: 2 },
  },
  editor: {
    id: "editor",
    name: "The Editor-in-Chief",
    description: "1 fewer guess AND green tiles score as yellow.",
    flavor: "Final approval pending. Forever.",
    rule: { kind: "combined", rules: [{ kind: "fewer-guesses", count: 1 }, { kind: "greens-demoted" }] },
    finalOnly: true,
  },
};

export const ALL_CENSOR_IDS = Object.keys(CENSORS) as CensorId[];
export const REGULAR_CENSOR_IDS = ALL_CENSOR_IDS.filter((id) => !CENSORS[id].finalOnly);

export function getCensor(id: CensorId): CensorDef {
  return CENSORS[id];
}

// Flatten combined rules for checks: ruleKinds(censor).has("greens-demoted") etc.
export function ruleList(rule: CensorRule): CensorRule[] {
  return rule.kind === "combined" ? rule.rules.flatMap(ruleList) : [rule];
}

export function hasRule(rule: CensorRule | null, kind: CensorRule["kind"]): boolean {
  return rule !== null && ruleList(rule).some((r) => r.kind === kind);
}
