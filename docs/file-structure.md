### File Structure:

project-root/
├── app/
│ ├── src/
│ │ ├── components/
│ │ ├── features/
│ │ │ ├── auth/
│ │ │ ├── game/
│ │ │ ├── leaderboard/
│ │ │ └── runs/
│ │ ├── lib/
│ │ ├── pages/ (eller routes/)
│ │ ├── types/
│ │ └── styles/
│ ├── public/
│ ├── Dockerfile
│ ├── .dockerignore
│ ├── package.json
│ ├── vite.config.ts
│ └── tsconfig.json
│
├── docs/
│ ├── architecture.md
│ ├── api.md
│ ├── database.md
│ ├── devops.md
│ ├── file-structure.md
│ └── game-design.md
│ └── github-actions-notes.md
│
├── infra/
│ ├── nginx/
│ │ └── example.conf
│ └── github-actions-notes.md
│
├── scripts/
│ ├── setup.sh
│ └── create-structure.sh
│
├── .env.example
├── docker-compose.yml
└── README.md
