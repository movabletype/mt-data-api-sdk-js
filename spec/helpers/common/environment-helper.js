(function() {
    var k,
        global  = new Function("return this;")(),
        helpers = {
            itWithCookie: function() {
                if (global.document) {
                    it.apply(this, arguments);
                }
                else {
                    xit.apply(this, arguments);
                }
            },
            setupSameOriginEnvironment: function() {
                global.dataApiBaseUrl = global.dataApiBaseUrlSameOrigin;
            },
            setupCrossOriginEnvironment: function() {
                global.dataApiBaseUrl = global.dataApiBaseUrlCrossOrigin;
            }
        };

    for (k in helpers) {
        global[k] = helpers[k];
    }
})();
