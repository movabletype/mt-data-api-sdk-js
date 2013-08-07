module.exports = function( grunt ) {
    "use strict";

    var MTServer;
    grunt.registerTask("start-movabletype-server", function(port) {
        var done    = this.async(),
            fs      = require("fs"),
            path    = require("path"),
            spawn   = require("child_process").spawn,
            base    = path.dirname(path.dirname(fs.realpathSync(__filename))),
            mtHome  = process.env.MT_HOME,
            program = path.join(mtHome, "t", "mysql-test-psgi-server.pl"),
            options = [
                program,
                "--port",
                grunt.config.get("movabletype.options.port"),
                "--plugin-path",
                path.join(base, "spec", "plugins"),
            ];

        function existsSync(p) {
            return !!fs.existsSync ? fs.existsSync(p) : path.existsSync(p);
        }

        function writeHelper(status) {
            var helper = grunt.config.get("movabletype.options.helper"),
                stmt   = [];
            stmt.push(
                "var movableTypeServerRunning = " + (status ? "true" : "false") + ",",
                "    dataApiBaseUrl = 'http://localhost:" + (port || grunt.config.get("connect.jasmine.options.port")) + "/cgi-bin/mt-data-api.cgi';",
                "if (typeof global !== 'undefined') {"
            );
            ["movableTypeServerRunning", "dataApiBaseUrl"].forEach(function(k) {
                stmt.push("    global." + k + " = " + k + ";");
            });
            stmt.push("}");
            fs.writeFileSync(helper, stmt.join("\n"), "utf8");
        }

        if (! mtHome) {
            writeHelper(false);
            return done();
        }

        if (! existsSync(program)) {
            grunt.warn(program + " is not found.");
        }

        writeHelper(true);

        MTServer = spawn("perl", options);

        MTServer.stderr.on("data", function(data) {
            if (/Setting gid to/.test(data)) {
                done();
            }
        });
    });

    function stopMovableTypeServer() {
        if (MTServer) {
            MTServer.kill("SIGTERM");
            MTServer = null;
        }
    }

    grunt.registerTask("stop-movabletype-server", stopMovableTypeServer);
    grunt.event.on("jasmine.testDone", function(total, passed, failed) {
        if (failed) {
            stopMovableTypeServer();
        }
    });

    grunt.registerTask("check-jasmine-node-result", function() {
        var fs     = require("fs"),
            report = "reports/node/TEST-DataAPI.xml",
            status;

        try {
            status = /failures="0"/.test(fs.readFileSync(report));
        }
        catch (e) {
            status = false;
        }

        if (! status) {
            stopMovableTypeServer();
        }

        return status;
    });

    grunt.registerTask("run-if-not-exists", function() {
        var fs   = require("fs"),
            path = require("path"),
            args = Array.prototype.slice.call(arguments),
            file = args.shift(),
            task = args.join(":");

        function existsSync(p) {
            return !!fs.existsSync ? fs.existsSync(p) : path.existsSync(p);
        }

        if (! existsSync(file)) {
            grunt.task.run(task);
        }
    });
};
