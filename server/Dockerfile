# Build base image using node
FROM node:lts-alpine

WORKDIR /usr/app
COPY ./ /usr/app

# Install dependencies and build the project.
RUN npm install

# Run the web service on container startup.
CMD ["npm", "start"]