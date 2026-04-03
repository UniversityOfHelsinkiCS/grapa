FROM node:20

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

# Setup
COPY package* ./
RUN npm i

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
