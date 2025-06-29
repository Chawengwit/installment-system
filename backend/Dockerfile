FROM node:20

WORKDIR /app

RUN npm install -g nodemon

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend code
COPY backend/src ./src
COPY backend/tests ./tests

# Copy frontend for serving static files
# COPY frontend ./frontend

EXPOSE 3000

CMD ["npm", "run", "dev"]
