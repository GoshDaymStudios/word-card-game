# Portfolio plan — making Cards & Words public

Goal: show **Cards & Words** on **Tor's personal GitHub profile**, even though the repo lives
under the **GoshDaymStudios** org (not the personal account). The repo is safe to make public
— a security scan found no secrets (only `.env.example`; the Supabase key in README is a
placeholder; all prod secrets are in GitHub Secrets / gitignored `.env`).

Pick this thread up later — here's the plan.

## A. Decide: keep in the org (recommended)

Keep the repo under **GoshDaymStudios**. It tells a nicer story ("a small studio we run") and
you can still feature it on your personal profile. Alternatives if you prefer:
- **Transfer** to your personal account (loses the studio framing; updates the remote URL).
- **Fork** to personal (forks read as secondary — not great for a showcase).

## B. Pre-publish prep (do before flipping to Public)

1. **Secrets** — ✅ already clean (verified: no `.env`, no keys/passwords tracked).
2. **`contributions-and-learning.md`** — it openly says AI wrote most of the code. For a
   public portfolio, decide: keep / move out to a private note / reframe as "Architecture &
   decisions". (Commit messages also carry `Co-Authored-By: Claude` — fine, AI-assisted is
   normal; not worth rewriting history.)
3. **README polish** (the most important — it's the first thing people read):
   - One-line pitch + the **live demo link** (https://birkelandboss.no).
   - 2–4 **screenshots / a GIF** (gameplay, the theme switcher, leaderboard).
   - Tech stack + a short **architecture** blurb (two games / one app, Supabase, Docker, CI/CD).
   - A "what I built / can explain" section (Docker multi-stage, SPA fallback, RLS, CI/CD,
     failure-domain monitoring) — pull highlights from `contributions-and-learning.md §3`.
   - Badges (CI passing), and a LICENSE (MIT is fine).
4. **Minor tidy (optional):** the VPS path `/home/tor/apps/...` and username in
   `deploy.yml`, and the domain in `vite.config.ts` — low risk (the site is public anyway),
   but can be genericized.
5. Consider **renaming the repo** itself `word-card-game` → `cards-and-words` (Settings →
   rename; GitHub auto-redirects the old URL). The deploy path on the VPS would need updating
   if you do this (`cd /home/tor/apps/...`).

## C. Make it public

GoshDaymStudios repo → **Settings → General → Danger Zone → Change visibility → Public**.

## D. Feature it on your PERSONAL profile

1. **Profile README** (strongest): create/edit the special `torabir/torabir` repo (a repo
   named exactly your username) — its README renders on your profile. Add a featured card:
   title, one-liner, live-demo link, repo link, a screenshot. This always works regardless of
   org ownership.
2. **Pin it:** Profile → "Customize your pins" — you can pin public repos from orgs you're a
   member of, so the GoshDaymStudios repo should be pinnable to your personal profile. (If it
   doesn't appear, the Profile README card in step 1 covers it.)
3. **Contribution graph:** your commits already count toward your personal graph (you're the
   author), so the work shows up there automatically.
4. **CV / personal site:** link the **live demo** first, then the repo.

## E. Nice-to-haves later

- Add an `About` description + topics on the repo (`react`, `typescript`, `supabase`,
  `docker`, `ci-cd`, `game`).
- A short **demo GIF** at the top of the README converts best.
- Link the live `/health` + uptime as a tiny "it's monitored in prod" flex.

---

**TL;DR order:** README polish (+ decide on the AI doc) → optional repo rename → flip to
Public → add a featured card to your `torabir/torabir` profile README + pin it.
