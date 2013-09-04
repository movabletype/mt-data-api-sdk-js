describe("DataAPI Sessionstore", function(){
    var dummySessionStore,
        sessionName = 'sessionName',
        testData    = 'testData';

    beforeEach(function() {
        dummySessionStore = {
            save:   jasmine.createSpy('save'),
            fetch:  jasmine.createSpy('fetch'),
            remove: jasmine.createSpy('remove')
        };
        MT.DataAPI.registerSessionStore('dummy', dummySessionStore);
    });

    function getDefaultSessionStore() {
        var defaultKey   = window.document ? 'cookie-encrypted' : 'fs';
        return MT.DataAPI.sessionStores[defaultKey];
    }

    it("should be got default session store", function(){
        var sessionStore = MT.DataAPI.getDefaultSessionStore();
        expect(sessionStore).toBe(getDefaultSessionStore());
    });

    it("should be got custom session store", function(){
        var api = newDataAPI({
            sessionStore: 'dummy'
        });

        expect(api.getCurrentSessionStore()).toBe(dummySessionStore);
    });

    it("should be got default session store for the unknown sessionStore key", function(){
        var api = newDataAPI({
            sessionStore: 'unknownSessionStore'
        });

        expect(api.getCurrentSessionStore()).toBe(getDefaultSessionStore());
    });

    it("should be called custom session store's \"save\" handler", function(){
        var api = newDataAPI({
            sessionStore: 'dummy'
        });

        api.saveSessionData(sessionName, testData);

        expect(dummySessionStore.save).toHaveBeenCalledWith(sessionName, testData);
    });

    it("should be called custom session store's \"save\" handler with remember option", function(){
        var api = newDataAPI({
            sessionStore: 'dummy'
        });

        api.saveSessionData(sessionName, testData, false);

        expect(dummySessionStore.save).toHaveBeenCalledWith(sessionName, testData, false);
    });

    it("should be called custom session store's \"fetch\" handler", function(){
        var api = newDataAPI({
            sessionStore: 'dummy'
        });

        api.fetchSessionData(sessionName);

        expect(dummySessionStore.fetch).toHaveBeenCalledWith(sessionName);
    });

    it("should be called custom session store's \"remove\" handler", function(){
        var api = newDataAPI({
            sessionStore: 'dummy'
        });

        api.removeSessionData(sessionName);

        expect(dummySessionStore.remove).toHaveBeenCalledWith(sessionName);
    });
});
