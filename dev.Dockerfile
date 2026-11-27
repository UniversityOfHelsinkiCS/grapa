FROM node:24

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

# Setup
COPY package*.json .npmrc ./
RUN npm ci --ignore-scripts

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
