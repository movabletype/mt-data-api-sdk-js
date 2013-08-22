describe("DataAPI Formats", function(){
    var messagePackFormat = {
        fileExtension: 'mpac',
        mimeType: 'application/x-msgpack',
        serialize: function() { 'dummy' },
        unserialize: function() { 'dummy' }
    };
    beforeEach(function() {
        setupSameOriginEnvironment();

        MT.DataAPI.registerFormat('messagePack', messagePackFormat);
    });

    it("should not be retrieved a format for invalid mime type", function(){
        var api    = newDataAPI();
        var format = api.findFormat('text/javascript');

        expect(format).toBeNull();
    });

    it("should be retrieved a format for valid mime type", function(){
        var api    = newDataAPI();
        var format = api.findFormat('application/json');

        expect(format).toBeDefined();
    });

    it("should be retrieved a format if a mime type contains ';'", function(){
        var api    = newDataAPI();
        var format = api.findFormat('application/json; charset=utf-8');

        expect(format).toBeDefined();
    });

    it("should be retrieved a extended format", function(){
        var api    = newDataAPI();
        var format = api.findFormat(messagePackFormat.mimeType);

        expect(format).toBeDefined();
    });

    it("should be retrieved a json format from MT.DataAPI.defaultFormat", function(){
        var format = MT.DataAPI.getDefaultFormat();

        expect(format).toBeDefined();
        expect(format.mimeType).toEqual('application/json');
    });

    it("should be retrieved a json format without optional constructor option", function(){
        var api    = newDataAPI();
        var format = api.getCurrentFormat();

        expect(format).toBeDefined();
        expect(format.mimeType).toEqual('application/json');
    });

    it("should be retrieved a messagePack format with optional constructor option", function(){
        var api    = newDataAPI({
            format: 'messagePack'
        });
        var format = api.getCurrentFormat();

        expect(format).toBeDefined();
        expect(format.mimeType).toEqual(messagePackFormat.mimeType);
    });

});
