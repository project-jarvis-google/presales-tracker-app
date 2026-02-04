FROM node:20-alpine AS build
RUN apk add --no-cache libc6-compat
WORKDIR /app/presales-ui
COPY presales-ui/package*.json ./
RUN npm install
COPY presales-ui/ .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build
FROM nginx:alpine

COPY --from=build /app/presales-ui/build /usr/share/nginx/html
RUN sed -i 's/listen\(.*\)80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]