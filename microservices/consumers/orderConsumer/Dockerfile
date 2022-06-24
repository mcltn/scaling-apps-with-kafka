FROM node:14-alpine

RUN apk --no-cache add \
      bash \
      g++ \
      ca-certificates \
      lz4-dev \
      musl-dev \
      cyrus-sasl-dev \
      openssl-dev \
      make \
      python3

RUN apk add --no-cache --virtual .build-deps gcc zlib-dev libc-dev bsd-compat-headers py-setuptools bash
RUN mkdir -p /home/node/app
RUN chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY . ./

USER node

RUN npm install
CMD [ "node", "app.js" ]