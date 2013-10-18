(dataApiBaseUrlCrossOrigin !== dataApiBaseUrlSameOrigin ? describe : xdescribe)("DataAPI CORS", function(){
    beforeEach(function() {
        setupCrossOriginEnvironment();
        cleanupSession();
    });

    it("should be initialized crossOrigin option with false", function(){
        setupSameOriginEnvironment();
        var api = newDataAPI();
        expect(api.o.crossOrigin).toBeFalsy();
    });

    it("should be initialized crossOrigin option with true", function(){
        var api = newDataAPI();
        expect(api.o.crossOrigin).toBeTruthy();
    });

    itWithMt("a GET request should be successful", function(){
        var result = null;

        runs(function() {
            var api = newDataAPI();
            api.request('GET', '/endpoint-test', function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(result.error).toBeFalsy();
            expect(result.version).toEqual(1);
        });
    });

    itWithMt("a POST request should be successful", function(){
        var testMessage = 'Test Message',
            result      = null;

        runs(function() {
            var api = newDataAPI();
            api.request('POST', '/endpoint-test', {message: testMessage}, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(result.error).toBeFalsy();
            expect(result.message).toEqual(testMessage);
        });
    });

    itWithMt("should be reported permission error", function(){
        var result = null;

        runs(function() {
            var api = newDataAPI();
            api.request('GET', '/sites/1/entries', {status: 'Draft'}, function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(result.error.code).toEqual(403);
        });
    });

    it("should be set X-Requested-With for same origin request", function(){
        setupSameOriginEnvironment();

        var sent = false,
            api  = newDataAPI(),
            xhr  = api.newXMLHttpRequest();

        spyOn(xhr, 'open');
        spyOn(xhr, 'send').andCallFake(function() {
            sent = true;
        });
        spyOn(xhr, 'setRequestHeader');

        api.listEntries(1, xhr);

        expect(xhr.setRequestHeader)
            .toHaveBeenCalledWith('X-Requested-With', 'XMLHttpRequest');
    });

    it("should not be set X-Requested-With for cross domain request", function(){
        var sent = false,
            api  = newDataAPI(),
            xhr  = api.newXMLHttpRequest();

        spyOn(xhr, 'open');
        spyOn(xhr, 'send').andCallFake(function() {
            sent = true;
        });
        spyOn(xhr, 'setRequestHeader');

        api.listEntries(1, xhr);

        if (sent) {
            expect(xhr.setRequestHeader).not.toHaveBeenCalled();
        }
    });
});
