# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application files to the working directory
COPY . .

# Set the environment variable for the port
ENV METRICS_PORT=8080
ENV HEALTH_PORT=9090

# Expose the port defined in the environment variable
EXPOSE $METRICS_PORT
EXPOSE $HEALTH_PORT

# Define the command to run the application
ENTRYPOINT ["node", "index.js"]
