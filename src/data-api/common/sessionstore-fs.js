;(function() {
    var fs   = require("fs"),
        path = require("path");

    function getPath(o) {
        return o.sessionPath || path.join(process.env["HOME"], ".mt-data-api.json");
    }

    function existsSync(p) {
        return !!fs.existsSync ? fs.existsSync(p) : path.existsSync(p);
    }

    DataAPI.registerSessionStore('fs', {
        save: function(name, data) {
            var p = getPath(this.o),
                d = {},
                newFile = true;
            if (existsSync(p)) {
                try {
                    d = JSON.parse(fs.readFileSync(p, "utf8"));
                    newFile = false;
                }
                catch (e) {
                    // Ignore
                }
            }
            d[name] = data;

            fs.writeFileSync(p, JSON.stringify(d), "utf8");
            if (newFile) {
                fs.chmodSync(p, parseInt("600", 8));
            }
        },
        fetch: function(name) {
            var p = getPath(this.o),
                d = {};
            if (existsSync(p)) {
                try {
                    d = JSON.parse(fs.readFileSync(p, "utf8"));
                }
                catch (e) {
                    // Ignore
                }
            }

            return d[name];
        },
        remove: function(name) {
            var p = getPath(this.o),
                d = {};
            if (existsSync(p)) {
                d = JSON.parse(fs.readFileSync(p, "utf8"));
                if (name in d) {
                    delete d[name];
                    fs.writeFileSync(p, JSON.stringify(d), "utf8");
                }
            }
        },
    });
})();
