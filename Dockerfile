FROM node:10-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY src ./src

RUN npm install
RUN npm run build

EXPOSE 8000
EXPOSE 8080
CMD [ "node", "build/src/index.js" ]