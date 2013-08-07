describe("DataAPI Request", function(){

    it("should not be added \"suppressResponseCodes\" parameter by default", function(){
        var requestUrl;
        spyOn(MT.DataAPI.prototype, "sendXMLHttpRequest")
            .andCallFake(function(xhr, method, url, params, defaultHeaders) {
                requestUrl = url;
                return xhr;
            });

        var api = newDataAPI();
        api.request("GET", "/unkown-endpoint");

        expect(requestUrl).not.toMatch(/suppressResponseCodes=1/);
    });

    it("should be added \"suppressResponseCodes\" parameter if option is specified", function(){
        var requestUrl;
        spyOn(MT.DataAPI.prototype, "sendXMLHttpRequest")
            .andCallFake(function(xhr, method, url, params, defaultHeaders) {
                requestUrl = url;
                return xhr;
            });

        var api = newDataAPI({
            suppressResponseCodes: true
        });
        api.request("GET", "/unkown-endpoint");

        expect(requestUrl).toMatch(/suppressResponseCodes=1/);
    });

    itWithMt("should be returned 404 even if requested with \"suppressResponseCodes\" option", function(){
        var result = null;

        runs(function() {
            var api = newDataAPI({
                suppressResponseCodes: true
            });
            api.request("GET", "/unkown-endpoint", function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", 100);

        runs(function() {
            expect(result.error.code).toEqual(404);
        });
    });

});
