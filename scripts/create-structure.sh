#!/bin/bash

# How to use: ./create-structure.sh [target-directory]

set -e

TARGET_DIR=${1:-.}

echo "Oppretter mappestruktur i $TARGET_DIR..."

cd "$TARGET_DIR"

echo "Oppretter mappestruktur..."

# Mapper
mkdir -p app/src/{components,features/{auth,game,leaderboard,runs},lib,routes,types,styles}
mkdir -p app/public
mkdir -p docs
mkdir -p infra/nginx
mkdir -p scripts

# Filer (app)
touch app/Dockerfile
touch app/.dockerignore
touch app/package.json
touch app/vite.config.ts
touch app/tsconfig.json

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

# Root-filer
touch .env.example
touch docker-compose.yml
touch README.md

cat <<EOF > .gitignore
node_modules
dist
.env
.DS_Store
EOF

echo "Ferdig!"