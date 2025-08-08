# Dockerfile for Node.js backend (TypeScript)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port (change if your app uses a different port)
EXPOSE 5000

# Start the app
CMD ["node", "dist/index.js"]
