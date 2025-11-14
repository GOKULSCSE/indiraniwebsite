FROM node:22-slim AS base

WORKDIR /app

COPY package.json ./

RUN apt-get update && apt-get install -y openssl

RUN npm install --legacy-peer-deps

COPY . .    

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

# CMD ["sh", "-c", "npx prisma migrate reset --force && npx prisma db seed && npm run start"]
CMD ["sh", "-c","npm run start"]



