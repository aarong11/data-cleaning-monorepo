FROM node:18-alpine

WORKDIR /app

# Install git
RUN apk add --no-cache git

# Copy workspace files
COPY package.json yarn.lock ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Install dependencies using yarn
RUN yarn install

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/

# Build TypeScript code
WORKDIR /app/server
RUN yarn build

# Add directory for file uploads
RUN mkdir -p /tmp/uploads

# Set Docker environment flag
ENV DOCKER_ENV=true

# Expose port
EXPOSE 3000

# Start the server
CMD ["yarn", "start"]