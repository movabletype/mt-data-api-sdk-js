var path = require("path"),
    fs   = require("fs"),
    lib  = path.dirname(fs.realpathSync(__filename)),
    vers = fs.readdirSync(path.join(lib, "data-api")).sort().reverse(),
    i, m, MT;

for (i = 0; i < vers.length; i++) {
    m = require(path.join(lib, "data-api", vers[i], "node-mt-data-api"));
    if (! MT) {
        MT = m;
    }
    MT[vers[i]] = m[vers[i]];
}

module.exports = MT;
