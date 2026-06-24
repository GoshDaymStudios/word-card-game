
# FROM node:20

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# COPY . .

# EXPOSE 5173

# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* env vars at BUILD time. .env is not in the build context
# (.dockerignore), so they must come in as build args (passed by docker-compose
# from the .env next to docker-compose.yml). The Supabase anon/publishable key is
# public by design, so baking it into the static build is fine.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80