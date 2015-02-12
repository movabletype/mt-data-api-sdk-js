(function() {
    var k,
        global  = new Function("return this;")(),
        helpers = {
            runSessionStoreCommonSpecs: function(key) {
                var sessionName = 'sessionName',
                    testData    = 'testData';

                it("should be set current session store by constructor option", function(){
                    var api = newDataAPI({
                        sessionStore: key
                    });
                    expect(api.getCurrentSessionStore())
                        .toBe(MT.DataAPI.sessionStores[key]);
                });

                it("should be saved data successfully", function(){
                    var api = newDataAPI({
                        sessionStore: key
                    });

                    expect(function() {
                        api.saveSessionData(sessionName, testData);
                    }).not.toThrow();
                });

                // This test is failed because specification has been changed
                // at the case #111875.
                xit("should be fetched saved data", function(){
                    var api = newDataAPI({
                        sessionStore: key
                    });

                    api.saveSessionData(sessionName, testData);
                    expect(api.fetchSessionData(sessionName)).toEqual(testData);
                });

                it("should not be fetched old data after removed", function(){
                    var api = newDataAPI({
                        sessionStore: key
                    });

                    api.saveSessionData(sessionName, testData);
                    api.removeSessionData(sessionName, testData);
                    expect(api.fetchSessionData(sessionName)).toBeFalsy();
                });
            }
        };

    for (k in helpers) {
        global[k] = helpers[k];
    }
})();
