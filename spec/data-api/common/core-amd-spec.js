(typeof define === "function" && define.amd ? describe : xdescribe)("DataAPI AMD", function(){
    it("should be created successfully MT.DataAPI with baseUrl and clientId", function(){
        var module = null;

        runs(function() {
            require(['mt-data-api'], function(DataAPI) {
                module = DataAPI;
            });
        });

        waitsFor(function() {
            return module;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(module).toEqual(MT.DataAPI);
        });
    });
});
