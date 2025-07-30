# Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks and update package index
RUN apk update && apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies
# Use npm install instead of npm ci for development
RUN npm install

# Copy application code
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p uploads logs && \
    chown -R node:node /app

# Switch to node user for security
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]