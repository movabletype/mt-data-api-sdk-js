var path   = require("path"),
    fs     = require("fs"),
    base   = path.dirname(path.dirname(path.dirname(path.dirname(fs.realpathSync(__filename))))),
    lib    = path.join(base, "node-lib");

global.MT = {
    DataAPI: require(path.join(lib, "bootstrap"))["v6"]
};

global.sinon  = require(path.join(base, "bower_components", "sinon"));
global._      = require(path.join(base, "bower_components", "underscore"));
