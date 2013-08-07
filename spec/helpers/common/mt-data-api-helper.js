function itWithMt() {
    if (movableTypeServerRunning) {
        it.apply(this, arguments);
    }
    else {
        xit.apply(this, arguments);
    }
}

function newDataAPI(options) {
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
}

function cleanupSession() {
    newDataAPI();
}

if (typeof global !== 'undefined') {
    global.itWithMt      = itWithMt;
    global.newDataAPI    = newDataAPI;
    global.cleanupSession = cleanupSession;
}
