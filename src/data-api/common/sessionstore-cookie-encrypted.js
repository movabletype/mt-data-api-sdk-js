;(function() {

// @include ../common/sjcl.js

var localStorage = window.localStorage;

if (! localStorage) {
    DataAPI.sessionStores['cookie-encrypted'] = {
        save:   function(){},
        fetch:  function(){},
        remove: function(){}
    };
}
else {
    DataAPI.sessionStores['cookie-encrypted'] = {
        save: function(name, data, remember) {
            var key     = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0)),
                o       = this.o,
                expires = remember ? new Date(new Date().getTime() + 315360000000) : undefined; // after 10 years

            Cookie.bake(name, key, o.sessionDomain, o.sessionPath, expires);
            localStorage.setItem(name, sjcl.encrypt(key, data));
        },
        fetch: function(name) {
            try {
                var key = Cookie.fetch(name).value;
                return sjcl.decrypt(key, localStorage.getItem(name));
            }
            catch (e) {
                return null;
            }
        },
        remove: function(name) {
            var o = this.o;
            Cookie.bake(name, '', o.sessionDomain, o.sessionPath, new Date(0));
            localStorage.removeItem(name);
        }
    };
}

})();
