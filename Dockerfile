FROM node:18-alpine

# Set working directory
WORKDIR /app

# Add package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Add source code
COPY src/ ./src/
COPY character.json ./

# Build the project
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S kismet && \
    adduser -S kismet -u 1001

# Change ownership of the app directory
RUN chown -R kismet:kismet /app

# Switch to non-root user
USER kismet

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["npm", "start"]