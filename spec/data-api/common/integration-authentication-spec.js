describe("DataAPI Integration Authorization", function(){
    var api,
        loginCredentials = {
            username: 'Chuck D',
            password: 'bass'
        };

    beforeEach(function() {
        api = newDataAPI();
    });

    itWithMt("should be fetched draft entries successfully", function(){
        var result = null;

        runs(function() {
            api.authenticate(loginCredentials, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            result = null;

            api.listEntries(1, {status: 'Draft'}, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(result.error).not.toBeDefined();
        });
    });

    itWithMt("should be updated expired access token automatically", function(){
        var result = null,
            expiresIn = 60,
            timeValue = 0;
        spyOn(Date.prototype, 'getTime').andCallFake(function() {
            return timeValue;
        });

        runs(function() {
            api.authenticate(loginCredentials, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            result = null;
            timeValue = (expiresIn + 1) * 1000;

            api.listEntries(1, {status: 'Draft'}, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(result.error).not.toBeDefined();
        });
    });

    itWithMt("should be updated invalid access token automatically", function(){
        var result = null;

        runs(function() {
            api.authenticate(loginCredentials, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            result = null;

            var tokenData = api.getTokenData();
            tokenData.accessToken = 'invalid access token';

            api.listEntries(1, {status: 'Draft'}, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(result.error).not.toBeDefined();
        });
    });

    itWithMt("should be updated empty access token automatically", function(){
        var result = null;

        runs(function() {
            api.authenticate(loginCredentials, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            result = null;

            var tokenData = api.getTokenData();
            delete tokenData.accessToken;

            api.listEntries(1, {status: 'Draft'}, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(result.error).not.toBeDefined();
        });
    });

    itWithMt("Update access token should go wrong if session ID is invalid", function(){
        var result = null;

        runs(function() {
            api.authenticate(loginCredentials, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            result = null;

            var tokenData = api.getTokenData();
            delete tokenData.accessToken;
            tokenData.sessionId = 'invalid session id';

            api.listEntries(1, {status: 'Draft'}, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(result.error.code).toEqual(401);
        });
    });

    itWithMt("should be revoked authentication completely by api.revokeAuthentication", function(){
        var result = null;

        runs(function() {
            api.authenticate(loginCredentials, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            result = null;

            api.revokeAuthentication(function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            result = null;

            api.listEntries(1, {status: 'Draft'}, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(result.error.code).toEqual(401);
        });
    });

    if (typeof window !== 'undefined' && window.document) {
        itWithMt("should be updated expired access token automatically even when using IFRAME", function(){
            var result = null;

            api = newDataAPI({
                disableFormData: true
            });

            runs(function() {
                api.authenticate(loginCredentials, function(response) {
                    result = response;
                });
            });

            waitsFor(function() {
                return result;
            }, "Want response", waitTimeout);

            runs(function() {
                result = null;

                var tokenData = api.getTokenData();
                tokenData.accessToken = 'invalid access token';

                api.uploadAsset(1, {
                    file: $('<input type="file" />').get(0)
                }, function(response) {
                    result = response;
                });
            });

            waitsFor(function() {
                return result;
            }, "Want response", waitTimeout);

            runs(function() {
                expect(result.error.code).toEqual(500);
            });
        });
    }
});
