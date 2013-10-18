all:
	make clean
	make build

clean:
	-rm -rf node-lib mt-static
	-rm -rf node_modules bower_components
	-find . -name '.DS_Store' | xargs rm

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
