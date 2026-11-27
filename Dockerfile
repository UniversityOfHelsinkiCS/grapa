FROM node:24-alpine AS base

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

COPY package*.json .npmrc ./

FROM base AS build

RUN npm ci --ignore-scripts
COPY . .
# The build copies the manual videos into dist
RUN npm run build

FROM base

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
# Only what the server needs, as public/manual alone is around 100 MB and dist has its own copy
COPY src ./src
COPY scripts ./scripts
COPY --from=build /opt/app-root/src/dist ./dist

# The pod runs as a non-root user in the root group, so it can't create this itself
RUN mkdir -p uploads && chgrp 0 uploads && chmod g+rwX uploads

EXPOSE 8000

CMD ["npm", "run", "start:prod"]
