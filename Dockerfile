FROM node:7.10-alpine
ADD . /src
WORKDIR /src
RUN apk add --update python build-base tini && cd /src && yarn install
ENTRYPOINT ["/sbin/tini", "-g", "--"]
CMD ["node", "datasetUpload.js"]

