describe("DataAPI Constructor", function(){

    it("should be created MT.DataAPI with baseUrl and clientId", function(){
        spyOn(MT.DataAPI.prototype, 'loadEndpoints');

        expect(function() {
            var api = new MT.DataAPI({
                baseUrl: dataApiBaseUrl,
                clientId: "Test"
            });
        }).not.toThrow();
    });

    it("should not be created MT.DataAPI without clientId", function(){
        expect(function() {
            var api = new MT.DataAPI({
                baseUrl: dataApiBaseUrl
            });
        }).toThrow();
    });

    it("should not be created MT.DataAPI without baseUrl", function(){
        expect(function() {
            var api = new MT.DataAPI({
                clientId: "Test"
            });
        }).toThrow();
    });

    it("should be called this.loadEndpoints once by default", function(){
        spyOn(MT.DataAPI.prototype, 'loadEndpoints');

        var api = new MT.DataAPI({
            baseUrl: dataApiBaseUrl,
            clientId: "Test"
        });
        expect(MT.DataAPI.prototype.loadEndpoints).toHaveBeenCalled();
    });

    itWithMt("should be defined api.getEndpointTest by default", function(){
        var api = new MT.DataAPI({
            baseUrl: dataApiBaseUrl,
            clientId: "Test"
        });
        expect(api.getEndpointTest).toBeDefined();
    });

    it("should be called this.loadEndpoints once when loadPluginEndpoints option is true", function(){
        spyOn(MT.DataAPI.prototype, 'loadEndpoints');

        var api = new MT.DataAPI({
            baseUrl: dataApiBaseUrl,
            clientId: "Test",
            loadPluginEndpoints: true
        });
        expect(MT.DataAPI.prototype.loadEndpoints).toHaveBeenCalled();
    });

    itWithMt("should be defined api.getEndpointTest when loadPluginEndpoints option is true", function(){
        var api = new MT.DataAPI({
            baseUrl: dataApiBaseUrl,
            clientId: "Test",
            loadPluginEndpoints: true
        });
        expect(api.getEndpointTest).toBeDefined();
    });

    it("should not be defined api.getEndpointTest when loadPluginEndpoints option is false", function() {
        var api = new MT.DataAPI({
            baseUrl: dataApiBaseUrl,
            clientId: "Test",
            loadPluginEndpoints: false
        });
        expect(api.getEndpointTest).not.toBeDefined();
    });

});
