;(function() {

// @include ../common/sjcl.js

var localStorage = window.localStorage;

function cookieName(name) {
    if (! window.location) {
        return name;
    }

    var port = window.location.port ||
        (window.location.protocol === 'https:' ? 443 : 80);

    return name + '_' + port;
}

function localStorageName(name, o) {
    return localStorageNames(name, o)[0];
}

function buildLocalStorageNames(name, path) {
    function buildName(path) {
        return name + ':' + path;
    }

    var names = [];

    if (! path) {
        return [name];
    }

    while (true) {
        names.push(buildName(path));
        if (path === '/') {
            break;
        }
        path = path.replace(/[^\/]+\/$/, '');
    }
    return names;
}

function localStorageNames(name, o) {
    return buildLocalStorageNames(name, o.sessionPath || extractPath(documentUrl()));
}

function documentUrl() {
    if (! window.location) {
        return '';
    }

    var loc;

    // IE may throw an exception when accessing
    // a field from window.location if document.domain has been set
    try {
        loc = window.location.href;
    } catch( e ) {
        // Use the href attribute of an A element
        // since IE will modify it given document.location
        loc = window.document.createElement( "a" );
        loc.href = "";
        loc = loc.href;
    }

    return loc;
}

function extractPath(url) {
    var urlRegexp = /^[\w.+-]+:(?:\/\/[^\/?#:]*(?::\d+|)|)(.*\/)[^\/]*$/,
        match     = urlRegexp.exec(url.toLowerCase());

    return match ? match[1] : null;
}

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

            Cookie.bake(cookieName(name), key, o.sessionDomain, o.sessionPath, expires);
            localStorage.setItem(localStorageName(name, o), sjcl.encrypt(key, data));
        },
        fetch: function(name) {
            var names = localStorageNames(name, this.o),
                key, i, value;

            try {
                key = Cookie.fetch(cookieName(name)).value;
                for (i = 0; i < names.length; i++) {
                    value = localStorage.getItem(names[i]);
                    if (value) {
                        return sjcl.decrypt(key, value);
                    }
                }
            }
            catch (e) {
            }

            return null;
        },
        remove: function(name) {
            var o = this.o;
            Cookie.bake(cookieName(name), '', o.sessionDomain, o.sessionPath, new Date(0));
            localStorage.removeItem(localStorageName(name, o));
        }
    };
}

})();
