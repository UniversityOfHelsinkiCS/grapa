FROM node:24-alpine

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

ARG GIT_SHA
ENV REACT_APP_GIT_SHA=$GIT_SHA

ARG BASE_PATH
ENV BASE_PATH=$BASE_PATH

ARG E2E
ENV REACT_APP_E2E=$E2E

ARG STAGING
ENV REACT_APP_STAGING=$STAGING

# Setup
COPY package* ./
RUN npm ci -f --omit-dev --ignore-scripts
COPY . .

RUN npm run build

# The pod runs as a non-root user in the root group, so it can't create this itself
RUN mkdir -p uploads && chgrp 0 uploads && chmod g+rwX uploads

EXPOSE 8000

CMD ["npm", "run", "start:prod"]
