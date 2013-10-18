describe("DataAPI Authorization", function(){

    it("should not be called this.getToken while this.authenticate when accessToken is empty", function(){
        var urls = [];
        spyOn(MT.DataAPI.prototype, 'sendXMLHttpRequest')
            .andCallFake(function(xhr, method, url) {
                urls.push(url);
                return xhr;
            });

        var api = newDataAPI();
        api.storeTokenData({});
        api.authenticate({});

        expect(urls.length).toEqual(1);
        expect(urls[0]).toMatch(/\/authentication$/);
    });

});
