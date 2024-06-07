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

RUN curl -sL https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-x86_64.tar.bz2 | tar -xj && \
    mv phantomjs-1.9.8-linux-x86_64 /usr/local/share/phantomjs && \
    ln -sf /usr/local/share/phantomjs/bin/phantomjs /usr/local/bin/phantomjs
ENV OPENSSL_CONF=/etc/ssl/

