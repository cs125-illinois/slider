FROM mhart/alpine-node:12.13.0

WORKDIR /app
RUN apk add --no-cache --virtual .gyp python make g++
COPY package*.json ./
COPY config.yaml server.js worker.js webpack.config.js ./
COPY client/ ./client/
RUN npm i && npm run webpack
RUN apk del .gyp

RUN apk add --no-cache --virtual tini

EXPOSE 3088

ENTRYPOINT [ "/sbin/tini", "--"]
CMD [ "node", "server.js" ]
