var Cookie = function( name, value, domain, path, expires, secure ) {
    this.name = name;
    this.value = value;
    this.domain = domain;
    this.path = path;
    this.expires = expires;
    this.secure = secure;
};

Cookie.prototype = {
    /**
     * Get this cookie from the web browser's store of cookies.  Note that if the <code>document.cookie</code>
     * property has been written to repeatedly by the same client code in excess of 4K (regardless of the size
     * of the actual cookies), IE 6 will report an empty <code>document.cookie</code> collection of cookies.
     * @return <code>Cookie</code> The fetched cookie.
     */
    fetch: function() {
        if (! window.document) {
            return undefined;
        }

        var prefix = escape( this.name ) + "=",
            cookies = ("" + window.document.cookie).split( /;\s*/ ),
            i;

        for( i = 0; i < cookies.length; i++ ) {
            if( cookies[ i ].indexOf( prefix ) === 0 ) {
                this.value = unescape( cookies[ i ].substring( prefix.length ) );
                return this;
            }
        }

        return undefined;
    },


    /**
     * Set and store a cookie in the the web browser's native collection of cookies.
     * @return <code>Cookie</code> The set and stored ("baked") cookie.
     */
    bake: function( value ) {
        if (! window.document) {
            return undefined;
        }

        function exists(x) {
            return (x === undefined || x === null) ? false : true;
        }

        if( !exists( this.name ) ) {
            return undefined;
        }

        if( exists( value ) ) {
            this.value = value;
        }
        else {
            value = this.value;
        }

        var name = escape( this.name ),
            attributes = ( this.domain ? "; domain=" + escape( this.domain ) : "") +
            (this.path ? "; path=" + escape( this.path ) : "") +
            (this.expires ? "; expires=" + this.expires.toGMTString() : "") +
            (this.secure ? "; secure=1"  : ""),
            batter = name + "=" + escape( value ) + attributes;

        window.document.cookie = batter;

        return this;
    },


    remove: function() {
        this.expires = new Date( 0 ); // "Thu, 01 Jan 1970 00:00:00 GMT"
        this.value = "";
        this.bake();
    }
};

Cookie.fetch = function( name ) {
    var cookie = new this( name );
    return cookie.fetch();
};


Cookie.bake = function( name, value, domain, path, expires, secure ) {
    var cookie = new this( name, value, domain, path, expires, secure );
    return cookie.bake();
};

Cookie.remove = function( name ) {
    var cookie = this.fetch( name );
    if ( cookie ) {
        return cookie.remove();
    }
};
