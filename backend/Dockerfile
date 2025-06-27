FROM node:20

WORKDIR /app

RUN npm install -g nodemon

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
