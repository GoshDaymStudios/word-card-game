// Regenerates app/src/lib/words/dict{4..7}.ts and answers{4,6,7}.ts from public-domain
// word lists. Length-5 answers stay the hand-curated list in wordList.ts (Daily depends
// on stable indexing there), but they are merged into dict5 so every answer is guessable.
//
//   node scripts/generate-wordlists.mjs
//
// Sources (fetched on each run):
//   ENABLE                — public-domain Scrabble-style dictionary (guess validation)
//   google-10000-english  — frequency-ordered common words (answer curation)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "app/src/lib/words/");

const ENABLE_URL = "https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt";
const FREQ_URL =
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt";

const fetchLines = async (url) =>
  (await (await fetch(url)).text()).split(/\r?\n/).filter(Boolean);

const enable = new Set(await fetchLines(ENABLE_URL));
const freq = await fetchLines(FREQ_URL);

const existing5 = readFileSync(join(OUT, "wordList.ts"), "utf8")
  .match(/"([a-z]{5})"/g)
  .map((s) => s.slice(1, -1));

const targets = { 4: 500, 6: 700, 7: 500 };
const header = (n, kind, count) =>
  `// ${kind} for ${n}-letter words (${count} entries). Generated from public-domain lists:\n` +
  `// ENABLE (guess dictionary) and the google-10000-english frequency list (answers).\n` +
  `// Regenerate via scripts/generate-wordlists.mjs — do not hand-edit.\n`;

for (const len of [4, 5, 6, 7]) {
  const dict = [...enable].filter((w) => w.length === len && /^[a-z]+$/.test(w));
  let answers;
  if (len === 5) {
    answers = existing5;
    for (const w of answers) if (!enable.has(w)) dict.push(w);
  } else {
    answers = freq.filter((w) => w.length === len && enable.has(w)).slice(0, targets[len]);
  }
  dict.sort();
  writeFileSync(
    join(OUT, `dict${len}.ts`),
    header(len, "Guess dictionary", dict.length) +
      `const words: string = ${JSON.stringify(dict.join("\n"))};\nexport default words;\n`,
  );
  if (len !== 5) {
    writeFileSync(
      join(OUT, `answers${len}.ts`),
      header(len, "Answer list", answers.length) +
        `export const ANSWERS${len}: readonly string[] = ${JSON.stringify(answers)};\n`,
    );
  }
  console.log(`len ${len}: dict ${dict.length}, answers ${answers.length}`);
}
