describe("DataAPI Request", function(){
    var messagePackFormat = {
            fileExtension: 'mpac',
            mimeType: 'application/x-msgpack',
            serialize: function() { 'dummy' },
            unserialize: function() { 'dummy' }
        },
        FakeXDomainRequest;

    beforeEach(function() {
        setupSameOriginEnvironment();

        FakeXDomainRequest = function(){};
        FakeXDomainRequest.prototype = {
            constructor: FakeXDomainRequest.prototype.constructor,
            open: jasmine.createSpy('open'),
            send: jasmine.createSpy('send')
        };

        MT.DataAPI.registerFormat('messagePack', messagePackFormat);
    });

    it("should not be added \"suppressResponseCodes\" parameter by default", function(){
        var requestUrl;
        spyOn(MT.DataAPI.prototype, "sendXMLHttpRequest")
            .andCallFake(function(xhr, method, url, params, defaultHeaders) {
                requestUrl = url;
                return xhr;
            });

        var api = newDataAPI();
        api.request("GET", "/unkown-endpoint");

        expect(requestUrl).not.toMatch(/suppressResponseCodes=1/);
    });

    it("should be added \"suppressResponseCodes\" parameter if option is specified", function(){
        var requestUrl;
        spyOn(MT.DataAPI.prototype, "sendXMLHttpRequest")
            .andCallFake(function(xhr, method, url, params, defaultHeaders) {
                requestUrl = url;
                return xhr;
            });

        var api = newDataAPI({
            suppressResponseCodes: true
        });
        api.request("GET", "/unkown-endpoint");

        expect(requestUrl).toMatch(/suppressResponseCodes=1/);
    });

    itWithMt("should be returned 404 even if requested with \"suppressResponseCodes\" option", function(){
        var result = null;

        runs(function() {
            var api = newDataAPI({
                suppressResponseCodes: true
            });
            api.request("GET", "/unkown-endpoint", function(response) {
                result = response;
            });
        });

        waitsFor(function() {
            return result;
        }, "Want response", waitTimeout);

        runs(function() {
            expect(result.error.code).toEqual(404);
        });
    });

    if (typeof window !== 'undefined' && window.document) {
        itWithMt("a POST request should be successful via IFRAME", function(){
            var result  = null,
                message = 'Test',
                params  = {
                    message: message,
                    file: $('<input />').attr({
                              type: 'file',
                              name: 'file'
                          }).get(0)
                },
                api = newDataAPI({
                    disableFormData: true
                });

            runs(function() {
                api.request("POST", "/endpoint-test", params, function(response) {
                    result = response;
                });
            });

            waitsFor(function() {
                return result;
            }, "Want response", waitTimeout);

            runs(function() {
                expect(result.message).toEqual(message);
            });
        });

        itWithMt("a POST request with resources should be successful via IFRAME", function(){
            var result  = null,
                params  = {
                    file: $('<input />').attr({
                             type: 'file',
                             name: 'file'
                          }).get(0)
                },
                api = newDataAPI({
                    disableFormData: true
                });

            api._generateEndpointMethod({
                "id": "post_endpoint_test",
                "route": "/endpoint-test",
                "verb": "POST",
                "resources": ['message']
            });

            runs(function() {
                api.postEndpointTest({title: 'Title'}, params, function(response) {
                    result = response;
                });
            });

            waitsFor(function() {
                return result;
            }, "Want response", waitTimeout);

            runs(function() {
                expect(result.message).toEqual('{"title":"Title"}');
            });
        });
    }

    if (typeof window !== 'undefined' && ! window.XDomainRequest) {
        it("a request should be successful via XDomainRequest", function(){
            var result = null,
                api    = newDataAPI(),
                xdr    = new FakeXDomainRequest(),
                params = 'a=1';

            spyOn(MT.DataAPI.prototype, '_requestVia').andReturn('xdr');

            window.XDomainRequest = jasmine.createSpy('XDomainRequest').andCallFake(function() {
                return xdr;
            });

            api.request("GET", "/endpoint-test", params, function(response) {
                result = response;
            });

            expect(xdr.open).toHaveBeenCalledWith(
                'GET', dataApiBaseUrl + '/v5/endpoint-test?' + params + '&suppressResponseCodes=1'
            );
            expect(xdr.send).toHaveBeenCalledWith(null);
        });

        it("a request should be successful via XDomainRequest: pass a xdr to the request method", function(){
            var result = null,
                api    = newDataAPI(),
                xdr    = new FakeXDomainRequest(),
                params = 'a=1';

            spyOn(MT.DataAPI.prototype, '_requestVia').andReturn('xdr');

            window.XDomainRequest = FakeXDomainRequest;

            api.request("GET", "/endpoint-test", params, xdr, function(response) {
                result = response;
            });

            expect(xdr.open).toHaveBeenCalledWith(
                'GET', dataApiBaseUrl + '/v5/endpoint-test?' + params + '&suppressResponseCodes=1'
            );
            expect(xdr.send).toHaveBeenCalledWith(null);
        });

        it("should be set timeout options via XDomainRequest", function(){
            var result  = null,
                timeout = 100,
                api     = newDataAPI({
                    timeout: timeout
                }),
                xdr    = new FakeXDomainRequest(),
                params = 'a=1';

            spyOn(MT.DataAPI.prototype, '_requestVia').andReturn('xdr');

            window.XDomainRequest = jasmine.createSpy('XDomainRequest').andCallFake(function() {
                return xdr
            });

            api.request("GET", "/endpoint-test", params, function(response) {
                result = response;
            });

            expect(xdr.timeout).toEqual(timeout);
        });

        it("the callback should be called if request is successful via XDomainRequest", function(){
            var result  = null,
                timeout = 100,
                api     = newDataAPI({
                    timeout: timeout
                }),
                xdr    = new FakeXDomainRequest(),
                params = 'a=1';

            spyOn(MT.DataAPI.prototype, '_requestVia').andReturn('xdr');

            window.XDomainRequest = jasmine.createSpy('XDomainRequest').andCallFake(function() {
                return xdr;
            });

            api.request("GET", "/endpoint-test", params, function(response) {
                result = response;
            });
            xdr.contentType  = 'application/json';
            xdr.responseText = '{"a":1}';
            xdr.onload();

            expect(result).toEqual({a: 1});
        });

        it("the callback should be called if request is failed via XDomainRequest", function(){
            var result  = null,
                timeout = 100,
                api     = newDataAPI({
                    timeout: timeout
                }),
                xdr    = new FakeXDomainRequest(),
                params = 'a=1';

            spyOn(MT.DataAPI.prototype, '_requestVia').andReturn('xdr');

            window.XDomainRequest = jasmine.createSpy('XDomainRequest').andCallFake(function() {
                return xdr;
            });

            api.request("GET", "/endpoint-test", params, function(response) {
                result = response;
            });
            xdr.contentType  = 'application/json';
            xdr.responseText = '{"a"';
            xdr.onerror();

            expect(result.error.code).toEqual(404);
        });

        it("the callback should be called if request is timeout via XDomainRequest", function(){
            var result  = null,
                timeout = 100,
                api     = newDataAPI({
                    timeout: timeout
                }),
                xdr    = new FakeXDomainRequest(),
                params = 'a=1';

            spyOn(MT.DataAPI.prototype, '_requestVia').andReturn('xdr');

            window.XDomainRequest = jasmine.createSpy('XDomainRequest').andCallFake(function() {
                return xdr;
            });

            api.request("GET", "/endpoint-test", params, function(response) {
                result = response;
            });
            xdr.contentType  = 'application/json';
            xdr.responseText = '{"a"';
            xdr.ontimeout();

            expect(result.error.code).toEqual(0);
        });

        it("should be thrown an exception if token is set up via XDomainRequest", function(){
            var api    = newDataAPI(),
                xdr    = new FakeXDomainRequest(),
                params = 'a=1';

            spyOn(MT.DataAPI.prototype, '_requestVia').andReturn('xdr');
            spyOn(MT.DataAPI.prototype, 'getTokenData').andReturn({
                accessToken: 'some token'
            });

            window.XDomainRequest = jasmine.createSpy('XDomainRequest').andCallFake(function() {
                return xdr;
            });

            expect(function() {
                api.request("GET", "/endpoint-test", params);
            }).toThrow();
        });
    }

    if (typeof window !== 'undefined' && window.FormData) {
        itWithMt("a POST request should be successful with a FormData object", function(){
            var result  = null,
                message = 'Test',
                api     = newDataAPI(),
                params  = new window.FormData();

            params.append('message', message);

            runs(function() {
                api.request("POST", "/endpoint-test", params, function(response) {
                    result = response;
                });
            });

            waitsFor(function() {
                return result;
            }, "Want response", waitTimeout);

            runs(function() {
                expect(result.message).toEqual(message);
            });
        });

        itWithMt("a PUT request should be successful with a FormData object", function(){
            var result  = null,
                message = 'Test',
                api     = newDataAPI(),
                params  = new window.FormData();

            params.append('message', message);

            runs(function() {
                api.request("PUT", "/endpoint-test", params, function(response) {
                    result = response;
                });
            });

            waitsFor(function() {
                return result;
            }, "Want response", waitTimeout);

            runs(function() {
                expect(result.verb).toEqual('PUT');
                expect(result.message).toEqual(message);
            });
        });
    }

    it("xhr.setRequestHeader should be called inside api.sendXMLHttpRequest", function(){
        var api     = newDataAPI(),
            xhr     = api.newXMLHttpRequest(),
            headers = {
                'X-MT-Authorization': 'Test',
            };

        spyOn(xhr, 'setRequestHeader');
        spyOn(xhr, 'send');
        api.sendXMLHttpRequest(xhr, 'GET', 'http://example.com', {}, headers);

        for (k in headers) {
            expect(xhr.setRequestHeader).toHaveBeenCalledWith(k, headers[k]);
        }
    });

    it("params.getHeaders should be called inside api.sendXMLHttpRequest", function(){
        var api    = newDataAPI(),
            xhr    = api.newXMLHttpRequest(),
            params = {a: 1};

        params.getHeaders = function() {
            return {
                'content-length': 0
            };
        };

        spyOn(xhr, 'setRequestHeader');
        spyOn(xhr, 'send');
        api.sendXMLHttpRequest(xhr, 'GET', 'http://example.com', params);

        expect(xhr.setRequestHeader).toHaveBeenCalledWith('Content-Length', 0);
    });

    if (typeof window !== 'undefined' && window.document) {
        itWithMt("a POST request should be successful with a FORM element", function(){
            var result  = null,
                message = 'Test',
                api     = newDataAPI(),
                $form   = $('<form />')
                            .append($('<input />').attr({
                                name: 'message',
                                value: message
                            }));

            runs(function() {
                api.request("POST", "/endpoint-test", $form.get(0), function(response) {
                    result = response;
                });
            });

            waitsFor(function() {
                return result;
            }, "Want response", waitTimeout);

            runs(function() {
                expect(result.message).toEqual(message);
            });
        });

        itWithMt("a POST request should be successful with a FORM element and the disableFormData option", function(){
            var result  = null,
                message = 'Test',
                api     = newDataAPI({
                    disableFormData: true
                }),
                $form   = $('<form />')
                            .append($('<input />').attr({
                                name: 'message',
                                value: message
                            }));

            runs(function() {
                api.request("POST", "/endpoint-test", $form.get(0), function(response) {
                    result = response;
                });
            });

            waitsFor(function() {
                return result;
            }, "Want response", waitTimeout);

            runs(function() {
                expect(result.message).toEqual(message);
            });
        });

        itWithMt("should be serialized multiple input values", function(){
            var result   = null,
                messages = ['Test1', 'Test2'],
                api      = newDataAPI({
                    disableFormData: true
                }),
                $form    = $('<form />');

            spyOn(api, '_serializeFormElementToObject').andReturn({
                message: messages
            });

            runs(function() {
                api.request("POST", "/endpoint-test", $form.get(0), function(response) {
                    result = response;
                });
            });

            waitsFor(function() {
                return result;
            }, "Want response", waitTimeout);

            runs(function() {
                expect(result.message).toEqual(messages.join(','));
            });
        });
    }

    it("should be added \"_\" if the cache option is enabled", function(){
        var api = newDataAPI({
                cache: false
            }),
            url;

        spyOn(api, 'sendXMLHttpRequest').andCallFake(function(_xhr, _method, _url) {
            url = _url;
        });;
        api.request('GET', '/endpoint-test');

        expect(url).toMatch(new RegExp(dataApiBaseUrl + '/v5/endpoint-test\\?_=\\d+'));
    });

    it("should be set timeout property if the timeout option is set", function(){
        var timeout = 100,
            api     = newDataAPI({
                timeout: timeout
            }),
            xhr;

        spyOn(api, 'sendXMLHttpRequest').andCallFake(function(_xhr, _method, _url) {
            xhr = _xhr;
        });;
        api.request('GET', '/endpoint-test');

        expect(xhr.timeout).toEqual(timeout);
    });

    it("should be set format request parameter if the format option is set", function(){
        var api     = newDataAPI({
                format: 'messagePack'
            }),
            url;

        spyOn(api, 'sendXMLHttpRequest').andCallFake(function(_xhr, _method, _url) {
            url = _url;
        });;
        api.request('GET', '/endpoint-test');

        expect(url).toEqual(dataApiBaseUrl + '/v5/endpoint-test?format=mpac');
    });

    it("should be set \"X-MT-Authorization\" request header if an accessToke is already set up", function(){
        var api = newDataAPI(),
            headers;

        spyOn(MT.DataAPI.prototype, 'getTokenData').andReturn({
            accessToken: 'some token'
        });
        spyOn(api, 'sendXMLHttpRequest').andCallFake(function(_xhr, _method, _url, _params, _headers) {
            headers = _headers;
        });;
        api.request('POST', '/token');

        expect(headers['X-MT-Authorization']).not.toBeDefined();
    });
});
