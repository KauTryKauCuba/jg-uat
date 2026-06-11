# Stage 1: builder
FROM node:20-bullseye-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: runner
FROM node:20-bullseye-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV production

COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "run", "start"]
