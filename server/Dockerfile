# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy root package.json and pnpm-lock.yaml for workspace setup
COPY package.json pnpm-lock.yaml ./

# Copy server and shared package files
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Install pnpm
RUN npm install -g pnpm

# Install all dependencies
RUN NODE_ENV=development pnpm install -r

# Copy the rest of the application's source code
COPY server/ ./server/
COPY shared/ ./shared/

# Build shared package first
WORKDIR /usr/src/app/shared
RUN pnpm run build

# Set working directory to server and build
WORKDIR /usr/src/app/server
RUN pnpm install --force
RUN pnpm run build

# Update module alias to use absolute path in container
RUN sed -i 's|"@shared": "../shared/dist"|"@shared": "/usr/src/app/shared/dist"|g' package.json

# Expose the port the app runs on
EXPOSE 4000

# Define the command to run the application
CMD [ "node", "dist/src/index.js" ]
