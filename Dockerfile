FROM node:22-alpine

RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --production
RUN npm install node-addon-api

COPY backend/ .

EXPOSE 3000

CMD ["node", "server.js"]