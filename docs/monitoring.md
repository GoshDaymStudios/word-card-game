# Monitoring runbook

Two layers, on purpose (see README "Engineering highlights" for the why):

- **UptimeRobot** — external, off-box. The real "is the site up?" alert.
- **Uptime Kuma** — self-hosted on the same VPS. Dashboard / DevOps demo, **not** the safety
  net (same failure domain — it dies with the server).

Both probe the same endpoint: `https://birkelandboss.no/health` → returns `200 ok`.

---

## A. UptimeRobot (external — do this first)

1. Create a free account at https://uptimerobot.com and verify your email.
2. **+ New monitor**:
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `word-card-game prod`
   - URL: `https://birkelandboss.no/health`
   - Monitoring interval: **5 minutes** (free tier)
3. (Optional, stronger) Under advanced/keyword settings if available: check the response
   **contains** `ok`. That catches "server replies but app is broken", not just "port open".
4. Alert contact: add your **email** (or a Discord/Telegram webhook) and attach it to the monitor.
5. Save. Within a few minutes it should show **Up** (green).

Test it works: stop the app once (`docker compose stop web` on the VPS) → wait → you should
get a down alert → `docker compose start web` → recovery alert. (Optional sanity check.)

---

## B. Uptime Kuma (self-hosted dashboard)

Kuma runs in a container bound to `127.0.0.1:3001` (not public). Reach it via an SSH tunnel.

1. From your laptop, open a tunnel (keep this terminal open):
   ```
   ssh -L 3001:localhost:3001 tor@<vps-ip>
   ```
2. In a browser: **http://localhost:3001**
3. First run: create the **admin account** (username + password). Store it safely.
4. **+ Add New Monitor**:
   - Monitor Type: **HTTP(s) - Keyword**
   - Friendly Name: `word-card-game /health`
   - URL: `https://birkelandboss.no/health`  *(end-to-end; or `http://web:80/health` to
     check just the container over the compose network)*
   - Keyword: `ok`
   - Heartbeat Interval: `60` seconds
5. Save. The monitor should go green and start drawing history.
6. (Optional) Add notification channels (Settings → Notifications) and a public **Status
   Page** if you want a shareable uptime page.

Persistence: Kuma's data lives in the `uptime-kuma-data` Docker volume, so it survives
restarts and redeploys.

---

## Quick reference

| | UptimeRobot | Uptime Kuma |
|---|---|---|
| Vantage point | External (real alert) | Same VPS (dashboard/demo) |
| URL | `https://birkelandboss.no/health` | same (or `http://web:80/health`) |
| Interval | 5 min (free) | 60 s |
| Access | uptimerobot.com | SSH tunnel → localhost:3001 |
