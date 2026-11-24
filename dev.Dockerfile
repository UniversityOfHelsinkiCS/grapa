FROM node:24

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

# Setup
COPY package* ./
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
