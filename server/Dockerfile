# Use the official Node.js image as the base image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# These will be set dynamically using environment variables
EXPOSE ${END_USER_PORT}
EXPOSE ${SUPPORT_PORT}

# Start the application
CMD ["node", "index.js"]
