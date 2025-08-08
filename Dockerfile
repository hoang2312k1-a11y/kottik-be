# Dockerfile for Node.js backend (TypeScript)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source code (ensure src and tsconfig.json are included)
COPY . .

# Build TypeScript (ensure dist/index.js is created)
RUN npm run build

# Verify build output exists (for debug, optional)
RUN ls -l dist && ls -l dist/index.js || exit 1

# Expose port (change if your app uses a different port)
EXPOSE 5000

# Start the app
CMD ["node", "dist/index.js"]
