  # Use a lightweight Node.js base image for a smaller container.
  # We're using a specific version (18) and the "alpine" variant for a tiny image.
  FROM node:18-alpine AS build_stage

  # Set the working directory inside the container.
  WORKDIR /usr/src/app

  # Copy the package.json and package-lock.json files to the working directory.
  # We do this first so Docker can use caching to speed up builds.
  COPY package*.json ./

  # Explicitly disable production mode before install
  #ENV NODE_ENV=development

  #  Upgrade npm and force all deps including dev
  #RUN npm install -g npm@latest
  RUN npm install --force --include=dev

  # Install the application dependencies.
 # ENV NODE_ENV=development
 # RUN npm install

  # Copy the rest of the application code into the container.
  COPY . .

  # Build the application for production.
  RUN npm run build 
  #RUN npx vite build
  #RUN ./node_modules/.bin/vite build

  # Use a separate, minimal Nginx image to serve the static build files.
  # This is a common practice for production to keep the serving layer separate from the build layer.
  FROM nginx:1.21-alpine

  # Copy the built application from the previous stage.
  #COPY --from=0 /usr/src/app/build /usr/share/nginx/html
  COPY --from=build_stage /usr/src/app/dist /usr/share/nginx/html

  # Expose port 80 inside the container (default for nginx). The reverse proxy will connect to this.
  EXPOSE 80
  #The default command to run Nginx.
  CMD ["nginx", "-g", "daemon off;"]