(function() {
    var k,
        global  = new Function("return this;")(),
        helpers = {
            itWithMt: function() {
                if (movableTypeServerRunning) {
                    it.apply(this, arguments);
                }
                else {
                    xit.apply(this, arguments);
                }
            },
            newDataAPI: function(options) {
                var api,
                    opts = {
                        baseUrl:  dataApiBaseUrl,
                        clientId: "Test",
                        loadPluginEndpoints: false
                    };

                if (options) {
                    for (k in options) {
                        opts[k] = options[k];
                    }
                }

                api = new MT.DataAPI(opts);

                api.removeSessionData(api.getAppKey());

                return api;
            },
            cleanupSession: function() {
                newDataAPI();
            },
            setExpiredAccessToken: function() {
                var api = newDataAPI();
                api.saveSessionData(
                    api.getAppKey(),
                    api.serializeData({
                        expiresIn: 3600,
                        accessToken: "test token",
                        startTime: Math.round(new Date().getTime() / 1000) - 3601
                    }),
                    true
                );
            },
            saveDefaultEvent: function() {
                if (! global.originalGlobalEventCallbacks) {
                    global.originalGlobalEventCallbacks = MT.DataAPI.callbacks;
                }

                MT.DataAPI.callbacks = {};
                _.each(global.originalGlobalEventCallbacks, function(key, events) {
                    MT.DataAPI.callbacks[key] = _.clone(events);
                });
            },
            cleanupEvent: function() {
                MT.DataAPI.callbacks = global.originalGlobalEventCallbacks;
            }
        };

    for (k in helpers) {
        global[k] = helpers[k];
    }
})();
