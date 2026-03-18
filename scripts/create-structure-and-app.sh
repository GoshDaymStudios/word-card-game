#!/bin/bash

# How to use: ./create-structure-and-app.sh [target-directory]

set -Eeuo pipefail

TARGET_DIR="${1:-.}"

command -v npm >/dev/null 2>&1 || {
  echo "Feil: npm er ikke installert eller ikke i PATH."
  exit 1
}

mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR" || {
  echo "Feil: Klarte ikke å gå til katalogen $TARGET_DIR"
  exit 1
}

echo "Oppretter prosjektstruktur i $TARGET_DIR..."

# Root-mapper
mkdir -p docs
mkdir -p infra/nginx
mkdir -p scripts

# Root-filer
touch .env.example
touch docker-compose.yml
touch README.md

# Docs
touch docs/architecture.md
touch docs/api.md
touch docs/database.md
touch docs/devops.md
touch docs/file-structure.md
touch docs/game-design.md
touch docs/github-actions-notes.md

# Infra
touch infra/nginx/example.conf

# .gitignore
if [ ! -f .gitignore ]; then
  cat <<EOF > .gitignore
node_modules
dist
.env
.DS_Store
app/node_modules
app/dist
app/.vite
EOF
else
  echo ".gitignore finnes allerede, hopper over."
fi

# Opprett Vite-app hvis app/ ikke finnes
if [ ! -d "app" ]; then
  echo "Oppretter Vite-app i app/..."
  npm create vite@latest app -- --template react-ts
else
  echo "app/ finnes allerede, hopper over Vite-opprettelse."
fi

if [ ! -f "app/package.json" ]; then
  echo "Feil: app/package.json finnes ikke. app/ ser ikke ut som et gyldig npm-prosjekt."
  exit 1
fi

if [ ! -d "app/src" ]; then
  echo "Feil: app/src finnes ikke. app/ ser ikke ut som en gyldig Vite-app."
  exit 1
fi

# Docker-filer i app/
touch app/Dockerfile
touch app/.dockerignore

echo "Installerer dependencies..."
cd app
npm install

# Lag ekstra mappestruktur inni src
mkdir -p app/src/components
mkdir -p app/src/features/auth
mkdir -p app/src/features/game
mkdir -p app/src/features/leaderboard
mkdir -p app/src/features/runs
mkdir -p app/src/lib
mkdir -p app/src/routes
mkdir -p app/src/types
mkdir -p app/src/styles

echo "Ferdig!"
echo "Kjør videre med:"
echo "  cd app"
echo "  npm run dev"