# --- Stage 1: Build the React Application ---
FROM node:20-alpine AS build

RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. ONLY copy package.json (ignore the lock file for a fresh start)
COPY package.json ./

# 2. Force a fresh install without the existing lock file
# Note: This will generate a NEW lock file inside the container
RUN npm install

# 3. Copy the rest of the source code
COPY . .

# Build Arguments
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# CLOUD RUN FIX: Listen on port 8080
RUN sed -i 's/listen\(.*\)80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]