# Stage 1: Build the client library builder script container
FROM node:18 AS client-builder

WORKDIR /app/client

# Copy client files separately to use Docker caching
COPY client/package.json client/package-lock.json ./
RUN npm install

# Copy the rest of the client files and build
COPY client/. .
RUN npm run build

# Stage 2: Run the Remote Support Server
FROM node:18

WORKDIR /app/server

# Copy only necessary server files
COPY server/package.json server/package-lock.json ./
RUN npm install

# Copy the rest of the server files
COPY server/. .

# Define build-time arguments (Dockerfile doesn't read .env directly)
ARG SUPPORT_SERVER_PORT
ARG SOCKET_SERVER_PORT

# Make arguments available as environment variables
ENV SUPPORT_SERVER_PORT=${SUPPORT_SERVER_PORT}
ENV SOCKET_SERVER_PORT=${SOCKET_SERVER_PORT}

# Expose the ports dynamically
EXPOSE ${SUPPORT_SERVER_PORT}
EXPOSE ${SOCKET_SERVER_PORT}

# Start the Remote Support Server
CMD ["node", "index.js"]

