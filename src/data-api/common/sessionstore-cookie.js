DataAPI.sessionStores['cookie'] = {
    save: function(name, data, remember) {
        var o = this.o,
            expires = remember ? new Date(new Date().getTime() + 315360000000) : undefined; // after 10 years
        Cookie.bake(name, data, o.sessionDomain, o.sessionPath, expires);
    },
    fetch: function(name) {
        var cookie = Cookie.fetch(name);
        return cookie ? cookie.value : null;
    },
    remove: function(name) {
        var o = this.o;
        Cookie.bake(name, '', o.sessionDomain, o.sessionPath, new Date(0));
    }
};
