
var DataAPI = function(options) {
    var i, k, l,
        requireds = ['clientId', 'baseUrl'];

    this.o = {
        clientId: undefined,
        baseUrl: undefined,
        cookieDomain: undefined,
        cookiePath: undefined,
        format: undefined,
        async: true,
        cache: false,
        disableFormData: false
    };
    for (k in options) {
        if (k in this.o) {
            if (typeof this.o[k] === 'object' && this.o[k] !== null) {
                for (l in this.o[k]) {
                   this.o[k][l] = options[k][l];
                }
            }
            else {
                this.o[k] = options[k];
            }
        }
        else {
            throw 'Unkown option: ' + k;
        }
    }

    for (i = 0; i < requireds.length; i++) {
        if (! this.o[requireds[i]]) {
            throw 'The "' + requireds[i] + '" is required.';
        }
    }

    this.callbacks = {};
    this.tokenData = null;
    this.iframeId  = 0;

    this.trigger('initialize');
};

DataAPI.version        = 1;
DataAPI.accessTokenKey = 'mt_data_api_access_token';
DataAPI.iframePrefix   = 'mt_data_api_iframe_';
DataAPI.callbacks      = {};
DataAPI.defaultFormat  = 'json';
DataAPI.formats        = {
    json: {
        fileExtension: 'json',
        mimeType: 'application/json',
        serialize: function() {
            return JSON.stringify.apply(JSON, arguments);
        },
        unserialize: function() {
            return JSON.parse.apply(JSON, arguments);
        }
    }
};

DataAPI.on = function(key, callback) {
    if (! this.callbacks[key]) {
        this.callbacks[key] = [];
    }

    this.callbacks[key].push(callback);
};
DataAPI.off = function(key, callback) {
    var i, callbacks;

    if (callback) {
        callbacks = this.callbacks[key] || [];

        for (i = 0; i < callbacks.length; i++) {
            if (callbacks[i] === callback) {
                callbacks.splice(i, 1);
                break;
            }
        }
    }
    else {
        delete this.callbacks[key];
    }
};

DataAPI.registerFormat = function(key, spec) {
    DataAPI.formats[key] = spec;
};

DataAPI.prototype      = {
    getAuthorizationUrl: function(redirectUrl) {
        return this.o.baseUrl.replace(/\/*$/, '/') +
            'v' + this.getVersion() +
            '/authorization' +
            '?clientId=' + this.o.clientId +
            '&redirectUrl=' + redirectUrl;
    },

    _getCurrentEpoch: function() {
        return Math.round(new Date().getTime() / 1000);
    },

    _getNextIframeName: function() {
        return DataAPI.iframePrefix + (++this.iframeId);
    },

    getVersion: function() {
        return DataAPI.version;
    },

    getAppKey: function() {
        return DataAPI.accessTokenKey + '_' + this.o.clientId;
    },

    findFormat: function(mimeType) {
        if (! mimeType) {
            return null;
        }

        for (var k in DataAPI.formats) {
            if (DataAPI.formats[k].mimeType === mimeType) {
                return DataAPI.formats[k];
            }
        }

        return null;
    },

    getDefaultFormat: function() {
        return DataAPI.formats[DataAPI.defaultFormat];
    },

    getCurrentFormat: function() {
        return DataAPI.formats[this.o.format] || this.getDefaultFormat();
    },

    serializeData: function() {
        return this.getCurrentFormat().serialize.apply(this, arguments);
    },

    unserializeData: function() {
        return this.getCurrentFormat().unserialize.apply(this, arguments);
    },

    storeToken: function(tokenData) {
        var o = this.o;
        tokenData.startTime = this._getCurrentEpoch();
        Cookie.bake(this.getAppKey(), this.serializeData(tokenData), o.cookieDomain, o.cookiePath);
        this.tokenData = tokenData;
    },

    _updateTokenFromDefault: function() {
        var defaultKey    = DataAPI.accessTokenKey,
            defaultCookie = Cookie.fetch(defaultKey),
            defaultToken;

        if (! defaultCookie) {
            return null;
        }

        try {
            defaultToken = this.unserializeData(defaultCookie.value);
        }
        catch (e) {
            return null;
        }

        this.storeToken(defaultToken);
        Cookie.bake(defaultKey, '', undefined, '/', new Date(0));
        return defaultToken;
    },

    getToken: function() {
        var token,
            o = this.o;

        if (! this.tokenData) {
            token = null;

            if (window.location && window.location.hash === '#_login') {
                try {
                    token = this._updateTokenFromDefault();
                }
                catch (e) {
                }
            }

            if (! token) {
                try {
                    token = this.unserializeData(Cookie.fetch(this.getAppKey()).value);
                }
                catch (e) {
                }
            }

            if (token && (token.startTime + token.expiresIn < this._getCurrentEpoch())) {
                Cookie.bake(this.getAppKey(), '', o.cookieDomain, o.cookiePath, new Date(0));
                token = null;
            }

            this.tokenData = token;
        }

        if (! this.tokenData) {
            return null;
        }

        return this.tokenData.accessToken;
    },

    getAuthorizationHeader: function() {
        return 'MTAuth accessToken=' + this.getToken();
    },

    bindEndpointParams: function(endpoint, params) {
        var k, v;

        for (k in params) {
            v = params[k];
            if (typeof v === 'object') {
                v = v.id;
            }
            if (typeof v === 'function') {
                v = v();
            }
            endpoint = endpoint.replace(new RegExp(':' + k), v);
        }
        return endpoint;
    },

    _isElement: function(e, name) {
        if (! e || typeof e !== 'object') {
            return false;
        }
        var n = e.nodeName;
        return n && n.toLowerCase() === name;
    },

    _isFormElement: function(e) {
        return this._isElement(e, 'form');
    },

    _isInputElement: function(e) {
        return this._isElement(e, 'input');
    },

    _isFileInputElement: function(e) {
        return this._isInputElement(e) && e.type.toLowerCase() === 'file';
    },

    _serializeObject: function(v) {
        function f(n) {
            return n < 10 ? '0' + n : n;
        }

        function iso8601Date(v) {
            if (! isFinite(v.valueOf())) {
                return '';
            }

            var off,
                tz = v.getTimezoneOffset();
            if(tz === 0) {
                off = 'Z';
            }
            else {
                off  = (tz > 0 ? '-': '+');
                tz   = Math.abs(tz);
                off += f(Math.floor(tz / 60)) + ':' + f(tz % 60);
            }

            return v.getFullYear()     + '-' +
                f(v.getMonth() + 1) + '-' +
                f(v.getDate())      + 'T' +
                f(v.getHours())     + ':' +
                f(v.getMinutes())   + ':' +
                f(v.getSeconds())   + off;
        }

        if (this._isFormElement(v)) {
            v = this._serializeFormElementToObject(v);
        }

        var type = typeof v;
        if (type === 'undefined' || v === null || (type === 'number' && ! isFinite(v))) {
            return '';
        }
        else if (v instanceof Date) {
            return iso8601Date(v);
        }
        else if (window.File && v instanceof window.File) {
            return v;
        }
        else if (this._isFileInputElement(v)) {
            return v.files[0];
        }
        else if (type === 'object') {
            return this.serializeData(v, function(key, value) {
                if (this[key] instanceof Date) {
                    return iso8601Date(this[key]);
                }
                return value;
            });
        }
        else {
            return v;
        }
    },

    _serializeParams: function(params) {
        if (! params) {
            return params;
        }
        if (typeof params === 'string') {
            return params;
        }
        if (this._isFormElement(params)) {
            params = this._serializeFormElementToObject(params);
        }

        var k,
            str = '';
        for (k in params) {
            if (! params.hasOwnProperty(k)) {
                continue;
            }
            if (str) {
                str += '&';
            }

            str +=
                encodeURIComponent(k) + '=' +
                encodeURIComponent(this._serializeObject(params[k]));
        }
        return str;
    },

    _unserializeParams: function(params) {
        if (typeof params !== 'string') {
            return params;
        }

        var i, pair,
            data   = {},
            values = params.split('&');

        for(i = 0; i < values.length; i++) {
            pair = values[i].split('=');
            data[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }

        return data;
    },

    _newXMLHttpRequestStandard: function() {
        try {
            return new window.XMLHttpRequest();
        } catch( e ) {}
    },

    _newXMLHttpRequestActiveX: function() {
        try {
            return new window.ActiveXObject("Microsoft.XMLHTTP");
        } catch( e ) {}
    },

    newXMLHttpRequest: function() {
        return this._newXMLHttpRequestStandard() ||
            this._newXMLHttpRequestActiveX() ||
            false;
    },

    _findFileInput: function(params) {
        if (typeof params !== 'object') {
            return null;
        }

        for (var k in params) {
            if (this._isFileInputElement(params[k])) {
                return params[k];
            }
        }

        return null;
    },

    _isEmptyObject: function(o) {
        for (var k in o) {
            if (o.hasOwnProperty(k)) {
                return false;
            }
        }
        return true;
    },

    sendXMLHttpRequest: function(xhr, method, url, params, defaultParams) {
        var k, headers, uk;

        if (! this._isEmptyObject(defaultParams)) {
            if (window.FormData && params instanceof window.FormData) {
                for (k in defaultParams) {
                    params.append(k, defaultParams[k]);
                }
            }
            else {
                defaultParams = this._serializeParams(defaultParams);
                if (method.toLowerCase() === 'get') {
                    url += (url.indexOf('?') === -1 ? '?' : '&') + defaultParams;
                }
                else {
                    if (! params) {
                        params = '';
                    }
                    params += (params === '' ? '' : '&') + defaultParams;
                }
            }
        }

        xhr.open(method, url, this.o.async);
        if (typeof params === 'string') {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('X-MT-Authorization', this.getAuthorizationHeader());

        function normalizeHeaderKey(all, prefix, letter) {
            return prefix + letter.toUpperCase();
        }
        if (params && params.getHeaders) {
            headers = params.getHeaders();
            for (k in headers) {
                uk = k.replace(/(^|-)([a-z])/g, normalizeHeaderKey);
                xhr.setRequestHeader(uk, headers[k]);
            }
        }

        xhr.send(params);

        return xhr;
    },

    _serializeFormElementToObject: function(form) {
        var i, e, type,
            data           = {},
            submitterTypes = /^(?:submit|button|image|reset)$/i,
            submittable    = /^(?:input|select|textarea|keygen)/i,
            checkableTypes = /^(?:checkbox|radio)$/i;

        for (i = 0; i < form.elements.length; i++) {
            e    = form.elements[i];
            type = e.type;

            if (
                    ! e.name ||
                    e.disabled ||
                    ! submittable.test(e.nodeName) ||
                    submitterTypes.test(type) ||
                    (checkableTypes.test(type) && ! e.checked)
            ) {
                continue;
            }

            if (this._isFileInputElement(e)) {
                data[e.name] = e;
            }
            else {
                data[e.name] = this._elementValue(e);
            }
        }

        return data;
    },

    _elementValue: function(e) {
        if (e.nodeName.toLowerCase() === 'select') {
            var value, option,
                options = e.options,
                index = e.selectedIndex,
                one = e.type === "select-one" || index < 0,
                values = one ? null : [],
                max = one ? index + 1 : options.length,
                i = index < 0 ?
                    max :
                    one ? index : 0;

            // Loop through all the selected options
            for ( ; i < max; i++ ) {
                option = options[ i ];

                // oldIE doesn't update selected after form reset (#2551)
                if ( ( option.selected || i === index ) &&
                        // Don't return options that are disabled or in a disabled optgroup
                        ( !option.parentNode.disabled || option.parentNode.nodeName.toLowerCase() !== "optgroup" ) ) {

                    // Get the specific value for the option
                    value = option.attributes.value;
                    if (!value || value.specified) {
                        value = option.value;
                    }
                    else {
                        value = e.text;
                    }

                    // We don't need an array for one selects
                    if ( one ) {
                        return value;
                    }

                    // Multi-Selects return an array
                    values.push( value );
                }
            }

            return values;
        }
        else {
            return e.value;
        }
    },

    withOptions: function(option, func) {
        var k, result,
            originalOption = this.o,
            o = {};

        for (k in originalOption) {
            o[k] = originalOption[k];
        }
        for (k in option) {
            o[k] = option[k];
        }

        this.o = o;
        result = func.apply(this);
        this.o = originalOption;

        return result;
    },

    request: function(method, endpoint) {
        var i, k, v, base,
            api        = this,
            paramsList = [],
            params     = null,
            callback   = function(){},
            xhr        = null,
            viaXhr     = true,
            currentFormat     = this.getCurrentFormat(),
            originalArguments = Array.prototype.slice.call(arguments),
            defaultParams     = {};

        function serializeParams(params) {
            var k, data;

            if (! api.o.disableFormData && window.FormData) {
                if (params instanceof window.FormData) {
                    return params;
                }
                else if (api._isFormElement(params)) {
                    return new window.FormData(params);
                }
                else if (window.FormData && typeof params === 'object') {
                    data = new window.FormData();
                    for (k in params) {
                        data.append(k, api._serializeObject(params[k]));
                    }
                    return data;
                }
            }


            if (api._isFormElement(params)) {
                params = api._serializeFormElementToObject(params);
                for (k in params) {
                    if (params[k] instanceof Array) {
                        params[k] = params[k].join(',');
                    }
                }
            }

            if (api._findFileInput(params)) {
                viaXhr = false;

                data = {};
                for (k in params) {
                    if (api._isFileInputElement(params[k])) {
                        data[k] = params[k];
                    }
                    else {
                        data[k] = api._serializeObject(params[k]);
                    }
                }
                params = data;
            }
            else if (typeof params !== 'string') {
                params = api._serializeParams(params);
            }

            return params;
        }

        function runCallback(response) {
            var status = callback(response);
            if (status !== false) {
                if (response.error) {
                    api.trigger('error', response);
                }
            }
            return status;
        }

        function needToRetry(response) {
            return response.error &&
                response.error.code === 401 &&
                endpoint !== '/token';
        }

        function retry() {
            api.request('POST', '/token', function(response) {
                if (response.error && response.error.code === 401) {
                    var status = runCallback(response);
                    if (status !== false) {
                        api.trigger('authorizationRequired', response);
                    }
                }
                else {
                    api.storeToken(response);
                    api.request.apply(api, originalArguments);
                }
                return false;
            });
        }


        if (endpoint === '/token' || endpoint === '/authentication') {
            defaultParams.clientId = this.o.clientId;
        }

        if (! this.o.cache) {
            defaultParams._ = new Date().getTime();
        }

        if (currentFormat !== this.getDefaultFormat()) {
            defaultParams.format = currentFormat.fileExtension;
        }

        for (i = 2; i < arguments.length; i++) {
            v = arguments[i];
            switch (typeof v) {
            case 'function':
                callback = v;
                break;
            case 'object':
                if (
                    v &&
                    ! v.nodeName &&
                    ((window.ActiveXObject && v instanceof window.ActiveXObject) ||
                     (window.XMLHttpRequest && v instanceof window.XMLHttpRequest))
                ) {
                    xhr = v;
                }
                else {
                    paramsList.push(v);
                }
                break;
            case 'string':
                paramsList.push(this._unserializeParams(v));
                break;
            }
        }

        if (paramsList.length && (method.toLowerCase() === 'get' || paramsList.length >= 2)) {
            if (endpoint.indexOf('?') === -1) {
                endpoint += '?';
            }
            else {
                endpoint += '&';
            }
            endpoint += this._serializeParams(paramsList.shift());
        }

        if (method.match(/^(put|delete)$/i)) {
            defaultParams.__method = method;
            method = 'POST';
        }

        for (k in defaultParams) {
            for (i = 0; i < paramsList.length; i++) {
                if (k in paramsList[i]) {
                    delete defaultParams[k];
                }
            }
        }

        if (paramsList.length) {
            params = serializeParams(paramsList.shift());
        }


        base = this.o.baseUrl.replace(/\/*$/, '/') + 'v' + this.getVersion();
        endpoint = endpoint.replace(/^\/*/, '/');

        if (viaXhr) {
            xhr = xhr || this.newXMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) {
                    return;
                }

                var response, mimeType, format, url;

                try {
                    mimeType = xhr.getResponseHeader('Content-Type');
                    format   = api.findFormat(mimeType) || api.getCurrentFormat();
                    response = format.unserialize(xhr.responseText);
                }
                catch (e) {
                    response = {
                        error: {
                            code:    parseInt(xhr.status, 10),
                            message: xhr.statusText
                        }
                    };
                }

                function cleanup() {
                    xhr.onreadystatechange = function(){};
                }

                if (needToRetry(response)) {
                    retry();
                    cleanup();
                    return;
                }

                runCallback(response);

                url = xhr.getResponseHeader('X-MT-Next-Phase-URL');
                if (url) {
                    xhr.abort();
                    api.sendXMLHttpRequest(xhr, method, base + url, params, defaultParams);
                }
                else {
                    cleanup();
                }
            };
            return this.sendXMLHttpRequest(xhr, method, base + endpoint, params, defaultParams);
        }
        else {
            (function() {
                var k, file, originalName, input,
                    target = api._getNextIframeName(),
                    doc    = window.document,
                    form   = doc.createElement('form'),
                    iframe = doc.createElement('iframe');
                    

                // Set up a form element
                form.action        = base + endpoint;
                form.target        = target;
                form.method        = method;
                form.style.display = 'inline';
                form.encoding      = 'multipart/form-data';
                form.enctype       = 'multipart/form-data';

                // Set up a iframe element
                iframe.name           = target;
                iframe.style.position = 'absolute';
                iframe.style.top      = '-9999px';
                doc.body.appendChild(iframe);
                iframe.contentWindow.name = target;


                if (! api._isEmptyObject(defaultParams)) {
                    if (! params) {
                        params = {};
                    }
                    for (k in defaultParams) {
                        params[k] = defaultParams[k];
                    }
                }
                params['X-MT-Authorization'] = api.getAuthorizationHeader();
                params['X-MT-Requested-Via'] = 'IFRAME';

                for (k in params) {
                    if (api._isFileInputElement(params[k])) {
                        file         = params[k];
                        originalName = file.name;
                        file.name    = k;
                        if (file.parentNode) {
                            file.parentNode.insertBefore(form, file);
                        }
                        else {
                            doc.body.appendChild(form);
                        }
                        form.appendChild(file);
                        continue;
                    }

                    input       = doc.createElement('input');
                    input.type  = 'hidden';
                    input.name  = k;
                    input.value = params[k];
                    form.appendChild(input);
                }

                form.submit();


                function handler() {
                    var body     = iframe.contentWindow.document.body,
                        contents = body.textContent || body.innerText,
                        response;

                    function cleanup() {
                        setTimeout(function() {
                            file.name = originalName;
                            if (form.parentNode) {
                                form.parentNode.insertBefore(file, form);
                                form.parentNode.removeChild(form);
                            }
                            if (iframe.parentNode) {
                                iframe.parentNode.removeChild(iframe);
                            }
                        });
                    }

                    try {
                        response = api.unserializeData(contents);
                    }
                    catch (e) {
                        response = {
                            error: {
                                code:    500,
                                message: 'Internal Server Error'
                            }
                        };
                    }

                    if (needToRetry(response)) {
                        retry();
                        cleanup();
                        return;
                    }

                    cleanup();
                    runCallback(response);
                }
                if ( iframe.addEventListener ) {
                    iframe.addEventListener('load', handler, false);
                } else if ( iframe.attachEvent ) {
                    iframe.attachEvent('onload', handler);
                }
            })();

            return;
        }
    },

    on: DataAPI.on,

    off: DataAPI.off,

    trigger: function(key) {
        var i,
            args      = Array.prototype.slice.call(arguments, 1),
            callbacks = (DataAPI.callbacks[key] || []) // Class level
                .concat(this.callbacks[key] || []); // Instance level

        for (i = 0; i < callbacks.length; i++) {
            callbacks[i].apply(this, args);
        }
    },

    _generateEndpointMethod: function(e) {
        var api       = this,
            varRegexp = new RegExp(':([a-zA-Z_-]+)', 'g'),
            vars      = null,
            name      = e.id.replace(/_(\w)/g, function(all, letter) {
                            return letter.toUpperCase();
                        });

        function extractVars() {
            var m, vars = [];
            while ((m = varRegexp.exec(e.route)) !== null) {
                vars.push(m[1]);
            }
            return vars;
        }

        api[name] = function() {
            if (! vars) {
                vars = extractVars();
            }

            var args           = Array.prototype.slice.call(arguments),
                endpointParams = {},
                resources      = {},
                route, i;

            for (i = 0; i < vars.length; i++) {
                endpointParams[vars[i]] = args.shift();
            }
            route = api.bindEndpointParams(e.route, endpointParams);

            if (e.resources) {
                for (i = 0; i < e.resources.length; i++) {
                    resources[e.resources[i]] = args.shift();
                }
                args.push(resources);
            }

            return api.request.apply(api, [e.verb, route].concat(args));
        };
    },

    generateEndpointMethods: function(endpoints) {
        for (var i = 0; i < endpoints.length; i++) {
            this._generateEndpointMethod(endpoints[i]);
        }
    },

    loadEndpoints: function(params) {
        var api = this;

        api.withOptions({async: false}, function() {
            api.request('GET', '/endpoints', params, function(response) {
                if (response.error) {
                    return;
                }

                api.generateEndpointMethods(response.items);
            });
        });
    }
};
