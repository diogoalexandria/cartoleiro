FROM node:12.8-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --silent

COPY . .

EXPOSE 3333

CMD ["npm", "start"]