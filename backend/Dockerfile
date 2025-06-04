# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /

# Copy dependency definitions and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app code
COPY . .

# Expose the port defined in the app (ensure it matches .env PORT)
EXPOSE 2111

# Set environment
ENV NODE_ENV=production

# Start the app
CMD ["node", "index.js"]
