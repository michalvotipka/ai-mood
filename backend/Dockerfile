FROM node:24-alpine
WORKDIR /app
# The Prisma schema and config (with the database URL it imports) are needed by `prisma generate`
# in postinstall.
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
COPY src/config/database.ts ./src/config/
RUN npm install
COPY . .
EXPOSE 43100
CMD ["npm", "run", "dev"]
