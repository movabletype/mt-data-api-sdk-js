all:
	make clean
	make build

clean:
	-rm -rf node-lib mt-static
	-rm -rf node_modules
	-find . -name '.DS_Store' | xargs rm

build:
	-npm install
	-grunt update-sjcl-js
	-grunt build
