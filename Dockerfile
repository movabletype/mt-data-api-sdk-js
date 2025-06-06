ARG NODE
FROM node:$NODE

RUN  set -ex \
    \
    && DEBIAN_FRONTEND=noninteractive \
    && apt-get update \ 
    && apt-get install --no-install-recommends -y \
        git make curl ca-certificates \
        libfreetype6 libfontconfig1 bzip2 \
        cpanminus libplack-perl libdbd-mysql-perl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g grunt-cli \
    && npm install -g bower

ENV OPENSSL_CONF=/etc/ssl/

