describe("DataAPI", function(){

    it("should be created MT.DataAPI with baseUrl and clientId", function(){
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

});
