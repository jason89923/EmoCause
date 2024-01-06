FROM node:lts

WORKDIR /usr/app
COPY package*.json ./
RUN npm install

COPY index.js ./index.js
COPY public/ ./public/
COPY views/ ./views/

EXPOSE 3000

CMD node index.js