# Word Card Game

A web-based word game inspired by Wordle and Balatro.

Built as a small full-stack project with focus on gameplay, persistence, and simple deployment.

---

## Tech Stack

- Frontend: React + TypeScript (Vite)
- Backend: Supabase (Auth + Database)
- DevOps: Docker, docker-compose (local setup)
- Hosting (planned): VPS (Hetzner) + Nginx

---

## Project Structure

root/
├── app/ # Frontend application  
├── docker-compose.yml # Docker setup  
├── docs/ # Notes / architecture / ideas  
├── infra/ # Nginx + deployment config

---

## Getting Started

### 1. Clone the repository

```
git clone <repo-url>
cd word-card-game
```

---

### 2. Set up environment variables

Create a `.env` file inside `/app` based on `.env.example`.

Example:

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
```

Do NOT commit real secrets.

---

### 3. Run the project

You can run the project in two ways:

#### Option A – Local development (recommended)

```
cd app
npm install
npm run dev
```

App runs on:  
http://localhost:5173

---

#### Option B – Docker

From the project root:

```
docker compose up --build
```

App runs on:  
http://localhost:5173

---

## Development Environments

The project can be run in two separate environments:

### Local (npm)

- Runs directly on your machine
- Uses local `node_modules`
- Best for fast development

### Docker

- Runs inside a container
- Has its own isolated `node_modules`
- Ensures consistent environment across machines
- Closer to production setup

These environments are completely separate.

Running `npm install` locally does not affect Docker, and Docker does not affect your local setup.

---

## Supabase Setup

This project uses a shared Supabase project.

To get started:

1. Ask a maintainer for the project URL and publishable key
2. Create a `.env` file inside `app/`
3. Add the required variables:

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
```

Do not commit secrets or local `.env` files.

> **Note:** If you don’t have access to the shared project, create your own and follow the setup guide in `/docs`.

## Git Workflow

We use a simple feature branch workflow.

### 1. Create a branch

```
git checkout -b feature/short-description
```

Examples:

- feature/auth-page
- feature/leaderboard
- fix/navbar-layout

---

### 2. Make changes and commit

```
git add .
git commit -m "Add: short description"
```

---

### 3. Push your branch

```
git push origin feature/short-description
```

---

### 4. Open Pull Request

- Open a PR into `main`
- Describe what you changed
- Keep it focused and small

---

### 5. Merge

- Merge after review
- Delete branch after merge

---

### Sync your local branch

```
git checkout main
git pull origin main
```

---

### Guidelines

- Do not work directly on `main`
- Keep branches small and focused
- Use clear commit messages
- Do not commit `.env` files or secrets

---

## Current Status

- Project structure in place
- Frontend under development
- Supabase integration started
- Docker setup working locally

---

## Roadmap

- Core gameplay loop
- Save runs to database
- Leaderboard
- Sharing runs
- Deploy to VPS

---

## Authors

Tor – DevOps, infrastructure, deployment, project coordination (+ misc & potatoes)  
Jørgen – Lead developer, frontend, backend, gameplay (+ misc & potatoes)
