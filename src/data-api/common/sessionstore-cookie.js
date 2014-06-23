;(function() {

function fetchCookieValues(name) {
    var cookie = Cookie.fetch(name);

    if (! cookie) {
        return {};
    }

    try {
        return JSON.parse(cookie.value);
    }
    catch (e) {
        return {
            data: cookie.value
        };
    }
}

function fillinDefaultCookieValues(values, o) {
    var path = values.path,
        currentPath = extractPath(documentUrl());
    if (! path || path.length > currentPath.length) {
        path = currentPath;
    }

    return {
        data: values.data,
        domain: o.sessionDomain || values.domain || undefined,
        path:  o.sessionPath || path
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

DataAPI.sessionStores['cookie'] = {
    save: function(name, data, remember) {
        var expires = remember ? new Date(new Date().getTime() + 315360000000) : undefined, // after 10 years
            values  = fillinDefaultCookieValues(fetchCookieValues(name), this.o);
        Cookie.bake(name, JSON.stringify(values), values.domain, values.path, expires);
    },
    fetch: function(name) {
        fetchCookieValues(name).data;
    },
    remove: function(name) {
        var values = fillinDefaultCookieValues(fetchCookieValues(name));
        Cookie.bake(name, '', values.domain, values.path, new Date(0));
    }
};

})();
