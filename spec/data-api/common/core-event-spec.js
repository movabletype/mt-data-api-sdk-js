describe("DataAPI Event", function(){
    var eventName  = 'testEvent',
        eventParam = 'test parameter',
        api;

    beforeEach(function() {
        saveDefaultEvent();
        cleanupSession();
        api = newDataAPI();
    });

    afterEach(function() {
        cleanupEvent();
    });

    it("should be triggered global callback", function(){
        var cb = jasmine.createSpy('cb');

        MT.DataAPI.on(eventName, cb);
        api.trigger(eventName, eventParam);

        expect(cb).toHaveBeenCalledWith(eventParam);
    });

    it("should not be triggered deregistered global callback", function(){
        var cb  = jasmine.createSpy('cb');

        MT.DataAPI.on(eventName, cb);
        MT.DataAPI.off(eventName, cb);
        api.trigger(eventName, eventParam);

        expect(cb).not.toHaveBeenCalledWith();
    });

    it("should be deregistered all the global callbacks", function(){
        var cb  = jasmine.createSpy('cb');

        MT.DataAPI.on(eventName, cb);
        MT.DataAPI.off(eventName);
        api.trigger(eventName, eventParam);

        expect(cb).not.toHaveBeenCalledWith();
    });

    it("should be triggered instance callback", function(){
        var cb  = jasmine.createSpy('cb');

        api.on(eventName, cb);
        api.trigger(eventName, eventParam);

        expect(cb).toHaveBeenCalledWith(eventParam);
    });

    it("should not be triggered deregistered instance callback", function(){
        var cb = jasmine.createSpy('cb');

        api.on(eventName, cb);
        api.off(eventName, cb);
        api.trigger(eventName, eventParam);

        expect(cb).not.toHaveBeenCalled();
    });

    it("should be deregistered all the instance callbacks", function(){
        var cb = jasmine.createSpy('cb');

        api.on(eventName, cb);
        api.off(eventName);
        api.trigger(eventName, eventParam);

        expect(cb).not.toHaveBeenCalled();
    });
});
