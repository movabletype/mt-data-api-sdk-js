var path = require("path"),
    fs   = require("fs"),
    lib  = path.dirname(fs.realpathSync(__filename));

module.exports = {
    DataAPI: require(path.join(lib, "data-api", "v1", "node-all"))
};
