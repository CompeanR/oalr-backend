# syntax=docker/dockerfile:1

# 🏗️ STAGE 1: BUILD STAGE (The Heavy Lifter)
# This stage has all the tools needed to build your app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install ALL dependencies (production + development)
# We need devDependencies to build (like @nestjs/cli)
RUN npm ci

# Copy source code
COPY . .

# Build the application (TypeScript → JavaScript)
# This creates the /app/dist folder with compiled code
RUN npm run build

# 🚀 STAGE 2: PRODUCTION STAGE (The Lightweight Runner)
# This stage only has what's needed to RUN your app
FROM node:20-alpine AS production

# Use existing node user (ID 1000) from base image
# No need to create new user - node:alpine already has it

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ONLY production dependencies (no dev tools!)
RUN npm ci --only=production && npm cache clean --force

# Copy the compiled application from the builder stage
# This is the magic! We only copy the built /dist folder
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Change ownership of app files to node user 
RUN chown -R node:node /app 

# Switch to non-root user
USER node

# Start the application using the compiled JavaScript
CMD ["node", "dist/main"]
