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

function fetchCookieValues(name) {
    var cookie = Cookie.fetch(cookieName(name));

    if (! cookie) {
        return {};
    }

    try {
        return JSON.parse(cookie.value);
    }
    catch (e) {
        return {
            encryptKey: cookie.value
        };
    }
}

function fillinDefaultCookieValues(values, o) {
    function generateKey() {
        return sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0));
    }

    var path = values.path,
        currentPath = extractPath(documentUrl());
    if (! path || path.length > currentPath.length) {
        path = currentPath;
    }

    return {
        encryptKey: values.encryptKey || generateKey(),
        storageKey: values.storageKey || generateKey(),
        domain: o.sessionDomain || values.domain || undefined,
        path: o.sessionPath || path
    };
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
    var urlRegexp = /^[\w.+-]+:(?:\/\/[^\/?#:]*(?::\d+|)|)(.*)\/[^\/]*$/,
        match     = urlRegexp.exec(url.toLowerCase());

    return match ? match[1] : null;
}

// DEPRECATED
// This method will be removed in future version.
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

// DEPRECATED
// This method will be removed in future version.
function localStorageNames(name, o) {
    return buildLocalStorageNames(name, o.sessionPath || extractPath(documentUrl())+"/");
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
            var expires = remember ? new Date(new Date().getTime() + 315360000000) : undefined, // after 10 years
                values  = fillinDefaultCookieValues(fetchCookieValues(name), this.o);

            Cookie.bake(cookieName(name), JSON.stringify(values), values.domain, values.path, expires);
            localStorage.setItem(values.storageKey, sjcl.encrypt(values.encryptKey, data));
        },
        fetch: function(name) {
            var values = fetchCookieValues(name),
                i, names, data;

            // Backward compatibility 
            if (! values.storageKey) {
                names = localStorageNames(name, this.o);
                for (i = 0; i < names.length; i++) {
                    if (localStorage.getItem(names[i])) {
                        values.storageKey = names[i];
                        break;
                    }
                }
            }

            data = localStorage.getItem(values.storageKey);

            try {
                return sjcl.decrypt(values.encryptKey, data);
            }
            catch (e) {
            }

            return null;
        },
        remove: function(name) {
            var values = fillinDefaultCookieValues(fetchCookieValues(name), this.o);

            Cookie.bake(cookieName(name), '', values.domain, values.path, new Date(0));

            if (values.storageKey) {
                localStorage.removeItem(values.storageKey);
            }
        }
    };
}

})();
