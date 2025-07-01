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

# Set working directory to server
WORKDIR /usr/src/app/server
# Build the TypeScript code
RUN pnpm install --force
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 4000

# Define the command to run the application
CMD [ "node", "dist/src/index.js" ]
