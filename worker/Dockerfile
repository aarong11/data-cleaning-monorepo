FROM node:18-alpine

WORKDIR /app

# Install git
RUN apk add --no-cache git

# Copy workspace files
COPY package.json yarn.lock ./
COPY worker/package.json ./worker/
COPY shared/package.json ./shared/

# Install dependencies using yarn
RUN yarn install

# Copy source code
COPY shared/ ./shared/
COPY worker/ ./worker/

# Build TypeScript code
WORKDIR /app/worker
RUN yarn build

# Set Docker environment flag
ENV DOCKER_ENV=true

# Start the worker
CMD ["yarn", "start"]