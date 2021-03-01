FROM node:12
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD npm start
EXPOSE 3001
EXPOSE 3001
EXPOSE 5000
EXPOSE 5001