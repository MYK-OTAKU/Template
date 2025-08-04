#This dockerfile was created by MYK
#Sample Dockerfile for NodeJS Apps

FROM node:18

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install 

COPY . .

EXPOSE 5000

CMD [ "node", "app.js" ]