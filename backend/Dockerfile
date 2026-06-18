FROM node:20-alpine
WORKDIR /app

# Copy package configurations for module resolution
COPY package*.json ./
COPY prisma ./prisma

# Copy backend configurations and install
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source
COPY backend ./backend

# Generate Prisma client and compile TypeScript
RUN cd backend && npx prisma generate --schema=../prisma/schema.prisma
RUN cd backend && npm run build

EXPOSE 5000
WORKDIR /app/backend
CMD ["npm", "start"]
