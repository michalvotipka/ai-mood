FROM node:24-alpine
WORKDIR /app
# The Prisma schema is needed by `prisma generate` in postinstall.
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm install
COPY . .
EXPOSE 43100
CMD ["npm", "run", "dev"]
