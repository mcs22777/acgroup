FROM node:20-alpine

WORKDIR /app

# Önce package.json kopyala ve bağımlılıkları yükle (cache layer)
COPY apps/web/package.json apps/web/package-lock.json* ./apps/web/

WORKDIR /app/apps/web
RUN npm install

# Uygulama kodunu kopyala
WORKDIR /app
COPY . .

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "run", "dev"]
