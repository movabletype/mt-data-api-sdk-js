/**
 * @namespace MT
 */

/**
 * The MT.DataAPI is a client class for accessing to the Movable Type DataAPI.
 * @class DataAPI
 * @constructor
 * @param {Object} options Options.
 *   @param {String} options.clientId client ID
 *     (Available charactors: Alphabet, '_', '-')
 *   @param {String} options.baseUrl the CGI URL of the DataAPI
 *     (e.g. http://example.com/mt/mt-data-api.cgi)
 *   @param {String} options.cookieDomain
 *   @param {String} options.cookiePath
 *   @param {String} options.format
 *   @param {String} options.async
 *   @param {String} options.cache
 *   @param {String} options.disableFormData
 */
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


/**
 * API version.
 * @property version
 * @static
 * @private
 * @type Number
 */
DataAPI.version = 1;

/**
 * The key of access token of this api object.
 * This value is used for the session store.
 * @property accessTokenKey
 * @static
 * @private
 * @type String
 */
DataAPI.accessTokenKey = 'mt_data_api_access_token';

/**
 * The name prefix for iframe that created to upload asset.
 * @property iframePrefix
 * @static
 * @private
 * @type String
 */
DataAPI.iframePrefix = 'mt_data_api_iframe_';

/**
 * Default format that serializes data.
 * @property defaultFormat
 * @static
 * @private
 * @type Number
 */
DataAPI.defaultFormat = 'json';

/**
 * Class level callback function data.
 * @property callbacks
 * @static
 * @private
 * @type Object
 */
DataAPI.callbacks = {};

/**
 * Available formats that serialize data.
 * @property formats
 * @static
 * @private
 * @type Object
 */
DataAPI.formats = {
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

/**
 * Register callback to class.
 * @method on
 * @static
 * @param {String} key Event name
 * @param {Function} callback Callback function
 * @category core
 */
DataAPI.on = function(key, callback) {
    if (! this.callbacks[key]) {
        this.callbacks[key] = [];
    }

    this.callbacks[key].push(callback);
};

/**
 * Deregister callback from class.
 * @method off
 * @static
 * @param {String} key Event name
 * @param {Function} callback Callback function
 * @category core
 */
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

/**
 * Register formats that serialize data.
 * @method registerFormat
 * @static
 * @param {String} key Format name
 * @param {Object} spec Format spec
 *   @param {String} spec.fileExtension Extension
 *   @param {String} spec.mimeType MIME type
 * @category core
 */
DataAPI.registerFormat = function(key, spec) {
    DataAPI.formats[key] = spec;
};

/**
 * Get default format of this class
 * @method getDefaultFormat
 * @static
 * @return {Object} Format
 * @category core
 */
DataAPI.getDefaultFormat = function() {
    return DataAPI.formats[DataAPI.defaultFormat];
};

DataAPI.prototype = {

    /**
     * Get authorization URL
     * @method getAuthorizationUrl
     * @param {String} redirectUrl The user is redirected to this URL with "#_login" if authorization succeeded.
     * @return {String} Authorization URL
     * @category core
     */
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

    /**
     * Get API version
     * @method getVersion
     * @return {String} API version
     * @category core
     */
    getVersion: function() {
        return DataAPI.version;
    },

    /**
     * Get application key of this object
     * @method getAppKey
     * @return {String} Application key
     *   This value is used for the session store.
     * @category core
     */
    getAppKey: function() {
        return DataAPI.accessTokenKey + '_' + this.o.clientId;
    },

    /**
     * Get format that associated with specified MIME Type
     * @method findFormat
     * @param {String} mimeType MIME Type
     * @return {Object|null} Format. Return null if any format is not found.
     * @category core
     */
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

    /**
     * Get current format of this object
     * @method getCurrentFormat
     * @return {Object} Format
     * @category core
     */
    getCurrentFormat: function() {
        return DataAPI.formats[this.o.format] || DataAPI.getDefaultFormat();
    },

    /**
     * Serialize data.
     * @method serializeData
     * @param {Object} data The data to serialize
     * @return {String} Serialized data
     * @category core
     */
    serializeData: function() {
        return this.getCurrentFormat().serialize.apply(this, arguments);
    },

    /**
     * Unserialize data.
     * @method unserializeData
     * @param {String} data The data to unserialize
     * @return {Object} Unserialized data
     * @category core
     */
    unserializeData: function() {
        return this.getCurrentFormat().unserialize.apply(this, arguments);
    },

    /**
     * Store token data via current session store.
     * @method storeTokenData
     * @param {Object} tokenData The token data
     *   @param {String} tokenData.accessToken access token
     *   @param {String} tokenData.expiresIn The number of seconds
     *     until access token becomes invalid
     *   @param {String} tokenData.sessionId [optional] session ID
     * @category core
     */
    storeTokenData: function(tokenData) {
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

        this.storeTokenData(defaultToken);
        Cookie.bake(defaultKey, '', undefined, '/', new Date(0));
        return defaultToken;
    },

    /**
     * Get token data via current session store.
     * @method getTokenData
     * @return {Object} Token data
     * @category core
     */
    getTokenData: function() {
        var token = this.tokenData,
            o     = this.o;

        if (! token) {
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
        }

        if (token && (token.startTime + token.expiresIn < this._getCurrentEpoch())) {
            Cookie.bake(this.getAppKey(), '', o.cookieDomain, o.cookiePath, new Date(0));
            token = null;
        }

        this.tokenData = token;

        if (! this.tokenData) {
            return null;
        }

        return this.tokenData;
    },

    /**
     * Get authorization request header
     * @method getAuthorizationHeader
     * @return {String|null} Header string. Return null if api object has no token.
     * @category core
     */
    getAuthorizationHeader: function() {
        var tokenData = this.getTokenData();
        if (tokenData && tokenData.accessToken) {
            return 'MTAuth accessToken=' + tokenData.accessToken;
        }

        return '';
    },

    /**
     * Bind parameters to route spec
     * @method bindEndpointParams
     * @param {String} route Specification of route
     * @param {Object} params parameters
     *   @param {Number|Object|Function} params.{key} Value to bind
     * @return {String} Endpoint to witch parameters was bound
     * @example
     *     api.bindEndpointParams('/sites/:site_id/entries/:entry_id/comments/:comment_id', {
     *       blog_id: 1,
     *       entry_id: {id: 1},
     *       comment_id: functioin(){ return 1; }
     *     });
     * @category core
     */
    bindEndpointParams: function(route, params) {
        var k, v;

        for (k in params) {
            v = params[k];
            if (typeof v === 'object') {
                if (typeof v === 'function') {
                    v = v.id();
                }
                else {
                    v = v.id;
                }
            }
            if (typeof v === 'function') {
                v = v();
            }
            route = route.replace(new RegExp(':' + k), v);
        }
        return route;
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

    /**
     * Create XMLHttpRequest by higher browser compatibility way
     * @method newXMLHttpRequest
     * @return {XMLHttpRequest} Created XMLHttpRequest
     * @category core
     */
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
        if (! o) {
            return true;
        }

        for (var k in o) {
            if (o.hasOwnProperty(k)) {
                return false;
            }
        }
        return true;
    },

    /**
     * Send request to specified URL with params via XMLHttpRequest
     * @method sendXMLHttpRequest
     * @param {XMLHttpRequest} xhr XMLHttpRequest object to send request
     * @param {String} method Request method
     * @param {String} url Request URL
     * @param {String|FormData} params Parameters to send with request
     * @return {XMLHttpRequest}
     * @category core
     */
    sendXMLHttpRequest: function(xhr, method, url, params) {
        var k, headers, uk,
            authHeader = this.getAuthorizationHeader();

        xhr.open(method, url, this.o.async);
        if (typeof params === 'string') {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        if (authHeader) {
            xhr.setRequestHeader('X-MT-Authorization', authHeader);
        }

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

    /**
     * Execute function with specified options
     * @method withOptions
     * @param {option} option Option to overwrite
     * @param {Function} func Function to execute
     * @return Return value of specified func
     * @example
     *     // The DataAPI object is created with {async: true}
     *     api.withOptions({async: false}, function() {
     *       api.listEntries(1, function() {
     *         // This is executed synchronously
     *       });
     *     });
     *     api.listEntries(1, function() {
     *       // This is executed asynchronously
     *     });
     * @category core
     */
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

    /**
     * Execute function with specified options
     * @method request
     * @param {String} method Request method
     * @param {String} endpoint Endpoint to request
     * @param {String|Object} [queryParameter]
     * @param {String|Object|HTMLFormElement|FormData} [requestData]
     *   @param {String|Object|HTMLFormElement} [requestData.{requires-json-text}] Can specify json-text value by string or object or HTMLFormElement. Serialize automatically if object or HTMLFormElement is passed.
     *   @param {HTMLInputElement|File} [requestData.{requires-file}] Can specify file value by HTMLInputElement or File object.
     * @param {Function} [callback]
     * @return {XMLHttpRequest|null} Return XMLHttpRequest if request is sent
     *   via XMLHttpRequest. Return null if request is not sent
     *   via XMLHttpRequest (e.g. sent via iframe).
     * @category core
     */
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
                    api.storeTokenData(response);
                    api.request.apply(api, originalArguments);
                }
                return false;
            });
        }

        function appendParamsToURL(base, params) {
            if (base.indexOf('?') === -1) {
                base += '?';
            }
            else {
                base += '&';
            }
            return base + api._serializeParams(params);
        }


        if (endpoint === '/token' || endpoint === '/authentication') {
            defaultParams.clientId = this.o.clientId;
        }

        if (! this.o.cache) {
            defaultParams._ = new Date().getTime();
        }

        if (currentFormat !== DataAPI.getDefaultFormat()) {
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
            endpoint = appendParamsToURL(endpoint, paramsList.shift());
        }

        if (method.match(/^(put|delete)$/i)) {
            defaultParams.__method = method;
            method = 'POST';
        }

        if (paramsList.length) {
            params = paramsList.shift();
        }

        if (! this._isEmptyObject(defaultParams)) {
            if (method.toLowerCase() === 'get') {
                endpoint = appendParamsToURL(endpoint, defaultParams);
            }
            else if (window.FormData && params && params instanceof window.FormData) {
                for (k in defaultParams) {
                    params.append(k, defaultParams[k]);
                }
            }
            else {
                params = params || {};
                for (k in defaultParams) {
                    params[k] = defaultParams[k];
                }
            }
        }

        params = serializeParams(params);


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
                    api.sendXMLHttpRequest(xhr, method, base + url, params);
                }
                else {
                    cleanup();
                }
            };
            return this.sendXMLHttpRequest(xhr, method, base + endpoint, params);
        }
        else {
            (function() {
                var k, file, originalName, input,
                    target     = api._getNextIframeName(),
                    doc        = window.document,
                    form       = doc.createElement('form'),
                    iframe     = doc.createElement('iframe'),
                    authHeader = api.getAuthorizationHeader();


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


                params = params || {};
                if (authHeader) {
                    params['X-MT-Authorization'] = authHeader;
                }
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

    /**
     * Register callback to instance.
     * @method on
     * @param {String} key Event name
     * @param {Function} callback Callback function
     * @category core
     */
    on: DataAPI.on,

    /**
     * Deregister callback from instance.
     * @method off
     * @param {String} key Event name
     * @param {Function} callback Callback function
     * @category core
     */
    off: DataAPI.off,

    /**
     * Trigger event
     * First, run class level callbacks. Then, run instance level callbacks.
     * @method trigger
     * @param {String} key Event name
     * @category core
     */
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

    /**
     * Generate endpoint methods
     * @method generateEndpointMethods
     * @param {Array.Object} endpoints Endpoints to register
     *   @param {Object} endpoints.{i}
     *     @param {String} endpoints.{i}.id
     *     @param {String} endpoints.{i}.route
     *     @param {String} endpoints.{i}.verb
     *     @param {Array.String} [endpoints.{i}.resources]
     * @example
     *     api.generateEndpointMethods([
     *       {
     *           "id": "list_entries",
     *           "route": "/sites/:site_id/entries",
     *           "verb": "GET",
     *       },
     *       {
     *           "id": "create_entry",
     *           "route": "/sites/:site_id/entries",
     *           "verb": "POST",
     *           "resources": [
     *               "entry"
     *           ]
     *       }
     *     ]);
     * @category core
     */
    generateEndpointMethods: function(endpoints) {
        for (var i = 0; i < endpoints.length; i++) {
            this._generateEndpointMethod(endpoints[i]);
        }
    },

    /**
     * Load endpoint from DataAPI dynamically
     * @method loadEndpoints
     * @param {Object} [params]
     *   @param {String} [params.includeComponents] Comma separated component IDs to load
     *   @param {String} [params.excludeComponents] Comma separated component IDs to exclude
     * @example
     * Load endpoints only from specified module.
     *
     *     api.loadEndpoints({
     *       includeComponents: 'your-extension-module'
     *     });
     *     api.getDataViaYourExtensionModule(function(response) {
     *       // Do stuff
     *     });
     *
     * Load all endpoints except for core.
     * Since all the endpoints of core is already loaded.
     *
     *     api.loadEndpoints({
     *       excludeComponents: 'core'
     *     });
     *     api.getDataViaYourExtensionModule(function(response) {
     *       // Do stuff
     *     });
     * @category core
     */
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

/**
 * Triggered on initializing an instance
 *
 * @event initialize
 **/

/**
 * Triggered on getting an error of a HTTP request
 *
 * @event error
 * @param {Object} response A response object
 *   @param {Number} response.code The HTTP response code
 *   @param {String} response.message The error message
 *   @param {Object} response.data The data exists only if a current error has optional data
 * @example
 *     api.on("error", function(response) {
 *       console.log(response.message);
 *     });
 **/

/**
 * Triggered on receiving the HTTP response code 401 (Authorization required).
 *
 * @event authorizationRequired
 * @param {Object} response A response object
 *   @param {Number} response.code The HTTP response code
 *   @param {Number} response.message The error message
 * @example
 *     api.on("authorizationRequired", function(response) {
 *       // You will return to current URL after authorization succeeded.
 *       location.href = api.getAuthorizationUrl(location.href);
 *     });
 **/
