DataAPI.sessionStores['cookie'] = {
    save: function(name, data) {
        var o = this.o;
        Cookie.bake(name, data, o.sessionDomain, o.sessionPath);
    },
    fetch: function(name) {
        return Cookie.fetch(name).value;
    },
    remove: function(name) {
        var o = this.o;
        Cookie.bake(name, '', o.sessionDomain, o.sessionPath, new Date(0));
    }
};
