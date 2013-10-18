module.exports = function( grunt ) {
    "use strict";

    grunt.registerTask("update-data-api-endpoints", function() {
        var done  = this.async(),
            ver   = process.env.MT_DATA_API_VERSION,
            path  = require("path"),
            fs    = require("fs"),
            exec  = require("child_process").exec,
            base  = path.dirname(path.dirname(fs.realpathSync(__filename))),
            dest  = path.join(base, "src", "data-api", "v" + ver, "endpoints.json"),
            bin   = path.join(base, "bin/data-api-endpoints"),
            cmd   = [
                bin,
                process.env.MT_DATA_API_BASE_URL,
                ver
            ].join(" ");

        exec(cmd, function(err, stdout, stderr) {
            if (err) {
                console.error(stderr);
                return done(false);
            }

            fs.writeFileSync(dest, stdout, "utf8");

            done();
        });
    });

    grunt.registerTask("update-sjcl-js", function() {
        var done      = this.async(),
            fs        = require("fs"),
            path      = require("path"),
            exec      = require("child_process").exec,
            base      = path.dirname(path.dirname(fs.realpathSync(__filename))),
            src       = path.join(base, "bower_components", "sjcl", "core.js"),
            config    = path.join(base, "bower_components", "sjcl", "config.mk"),
            dest      = path.join(base, "src", "data-api", "common", "sjcl.js"),
            configure = [
                path.join(base, "bower_components", "sjcl", "configure"),
                "--with-aes",
                "--with-codecString",
                "--with-sha256",
                "--with-random",
                "--with-bitArray",
                "--with-convenience",
                "--with-ccm",
                "--with-pbkdf2",
                "--with-hmac",
                "--with-codecBase64",
                "--without-ocb2",
                "--without-codecHex"
            ].join(" "),
            make      = [
                "make",
                "-C",
                path.join(base, "bower_components", "sjcl")
            ].join(" ");

        exec(configure, function(err, stdout, stderr) {
            if (err) {
                console.error(stderr);
                return done(false);
            }

            fs.renameSync("config.mk", config);

            console.log(stdout);

            exec(make, function(err, stdout, stderr) {
                if (err) {
                    console.error(stderr);
                    return done(false);
                }

                console.log(stdout);

                fs.writeFileSync(dest, fs.readFileSync(src), "utf8");

                done();
            });
        });
    });
};
