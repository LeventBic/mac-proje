# Frontend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Set environment variables for React app
ENV REACT_APP_API_URL=http://backend:3001/api
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV WDS_SOCKET_HOST=0.0.0.0
ENV WDS_SOCKET_PORT=3001

# Change ownership to node user for security
RUN chown -R node:node /app

# Switch to node user for security
USER node

# Expose port
EXPOSE 3001

# Start the development server
CMD ["npm", "start"]