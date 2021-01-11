FROM node:12 as build


WORKDIR /tmp/buildApp

COPY ./package*.json ./

RUN npm install
COPY . .
RUN npm run build

FROM node:12.18.3-slim as production

ENV NODE_ENV=production
RUN groupadd -r app && useradd -r -g app app
ENV SERVER_PORT=8080

WORKDIR /usr/app

COPY package*.json ./
RUN npm install --only=production

COPY --from=build /tmp/buildApp/dist .
COPY --from=build /tmp/buildApp/node_modules ./node_modules
COPY ./config ./config

USER app:app
EXPOSE 8080
CMD ["node", "--max_old_space_size=512", "./index.js"]
