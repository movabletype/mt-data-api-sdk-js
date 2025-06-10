all:
	make clean
	make build

clean:
	-rm -rf node_modules bower_components
	-find . -name '.DS_Store' | xargs --no-run-if-empty rm

dev:
	-npm install
	-bower install
	-grunt dev

build:
	-npm install
	-bower install
	-grunt build

test:
	-grunt test

JSON_VERSION  := $(shell cat api_version)
JSON_BASE_URL := http://localhost/cgi-bin/mt/mt-data-api.cgi

json:
	perl tools/make-json.pl --version=$(JSON_VERSION) --base-url=$(JSON_BASE_URL) > src/data-api/$(JSON_VERSION)/endpoints.json

