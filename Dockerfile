FROM node:18-alpine
WORKDIR /backend
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
EXPOSE 5000
ENTRYPOINT  npm run dev


