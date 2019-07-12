all:
	make clean
	make build

clean:
	-rm -rf node-lib mt-static
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

JSON_VERSION  := v4
JSON_BASE_URL := http://mt-app.movabletype.test/cgi-bin/MT7-R4601/mt-data-api.cgi

json:
	perl tools/make-json.pl --version=$(JSON_VERSION) --base-url=$(JSON_BASE_URL) > src/data-api/$(JSON_VERSION)/endpoints.json

