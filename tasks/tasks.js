module.exports = function( grunt ) {
    "use strict";

    grunt.registerTask("default", "build");
    grunt.registerTask("build", ["preprocess", "jshint", "uglify"]);
    grunt.registerTask("dev", ["preprocess", "jshint"]);

    grunt.registerTask("test-node", [
        "dev",
        "start-movabletype-server:" + grunt.config.get("movabletype.options.port"),
        "cleanup-jasmine-node-result",
        "check-jasmine-node-result",
        "stop-movabletype-server",
    ]);

    grunt.registerTask("test-headless-browser", [
        "dev",
        "configureProxies:jasmine",
        "connect:jasmine",
        "start-movabletype-server",
        "jasmine:data-api",
        "stop-movabletype-server",
    ]);

    grunt.registerTask("test-browser", [
        "dev",
        "configureProxies:jasmine",
        "connect:jasmine",
        "start-movabletype-server",
        "run-if-not-exists:" +
            grunt.config.get("jasmine.data-api.options.outfile") +
            ":jasmine:data-api",
        "open:test",
        "prompt:wait",
        "stop-movabletype-server",
    ]);

    grunt.registerTask("test-browser-coverage", [
        "dev",
        "configureProxies:jasmine",
        "connect:jasmine",
        "start-movabletype-server",
        "jasmine:data-api-coverage",
        "stop-movabletype-server",
    ]);

    grunt.registerTask("test", [
        "test-node",
        "test-headless-browser",
    ]);

    grunt.registerTask("ci", [
        "test-node",
        "test-headless-browser",
        "start-movabletype-server",
        "stop-movabletype-server",
    ]);
};
