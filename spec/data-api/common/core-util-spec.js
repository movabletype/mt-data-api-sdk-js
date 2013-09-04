describe("DataAPI Event", function(){
    var api;

    beforeEach(function() {
        if (typeof window !== 'undefined' && window.location) {
            window.location.hash = '';
        }
        cleanupSession();
        api = newDataAPI();
    });

    it("should be retrieved an authorization URL successfully", function(){
        var redirectUrl = 'http://localhost/',
            url         = api.getAuthorizationUrl(redirectUrl);
            expectedUrl = dataApiBaseUrl + '/v' + api.getVersion() + '/authorization?clientId=Test&redirectUrl=' + redirectUrl;

        expect(url).toEqual(expectedUrl);
    });

    it("should be generated new name for an IFRAME element", function(){
        var prevName = api._getNextIframeName();

        expect(api._getNextIframeName()).not.toEqual(prevName);
    });

    it("should be preserved sessionId after storing token data", function(){
        var sessionId   = 'test session id',
            oldAccessToken = 'old access token',
            newAccessToken = 'new access token',
            tokenData;

        api.storeTokenData({
            sessionId: sessionId,
            accessToken: oldAccessToken
        });
        api.storeTokenData({
            accessToken: newAccessToken
        });
        tokenData = api.getTokenData();

        expect(tokenData.sessionId).toEqual(sessionId);
        expect(tokenData.accessToken).toEqual(newAccessToken);
    });

    itWithCookie("should be returned null when no cookie value was sat up", function(){
        var tokenData = api._updateTokenFromDefaultCookie();

        expect(tokenData).toBeNull();
    });

    itWithCookie("can be retrieved token data from the cookie", function(){
        var defaultKey  = MT.DataAPI.accessTokenKey,
            accessToken = 'some access token',
            tokenData;

        Cookie.bake(defaultKey, '{"accessToken":"' + accessToken + '"}');

        tokenData = api._updateTokenFromDefaultCookie();

        expect(tokenData.accessToken).toEqual(accessToken);
        expect(Cookie.fetch(defaultKey)).toBeFalsy();
    });

    itWithCookie("should be returned null when invalid cookie value was set up", function(){
        var defaultKey  = MT.DataAPI.accessTokenKey,
            tokenData;

        Cookie.bake(defaultKey, 'Invalid JSON String');

        tokenData = api._updateTokenFromDefaultCookie();

        expect(tokenData).toBeNull();
    });

    itWithCookie("should be called _updateTokenFromDefaultCookie for #_login", function(){
        window.location.hash = '#_login';
        spyOn(MT.DataAPI.prototype, '_updateTokenFromDefaultCookie');
        api.getTokenData()
        expect(api._updateTokenFromDefaultCookie).toHaveBeenCalled();
    });

    it("should be bound parameters by value", function(){
        var route = api.bindEndpointParams('/sites/:site_id/entries/:entry_id', {
            site_id: 2,
            entry_id: 3
        });
        expect(route).toEqual('/sites/2/entries/3');
    });

    it("should be bound parameters by object that has the id key", function(){
        var route = api.bindEndpointParams('/sites/:site_id/entries/:entry_id', {
            site_id: {id: 2},
            entry_id: {id: 3}
        });
        expect(route).toEqual('/sites/2/entries/3');
    });

    it("should be bound parameters by object that has the function object for the id key", function(){
        var route = api.bindEndpointParams('/sites/:site_id/entries/:entry_id', {
            site_id:  {id: function(){ return 2 } },
            entry_id: {id: function(){ return 3 } }
        });
        expect(route).toEqual('/sites/2/entries/3');
    });

    it("should be bound parameters by the function object", function(){
        var route = api.bindEndpointParams('/sites/:site_id/entries/:entry_id', {
            site_id:  function(){ return 2 },
            entry_id: function(){ return 3 }
        });
        expect(route).toEqual('/sites/2/entries/3');
    });

    it("should not be thrown an exception even if request was failed", function(){
        spyOn(MT.DataAPI.prototype, 'request').andCallFake(function(method, endpoint, options, callback) {
            callback({
                error: {
                    code: 500
                }
            });
        });

        expect(function() {
            api.loadEndpoints();
        }).not.toThrow();
    });
});
