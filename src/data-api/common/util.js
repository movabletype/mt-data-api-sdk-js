/**
 * @namespace MT.DataAPI
 */
;(function() {

    /**
     * The MT.DataAPI.Util is a package of utility methods.
     * @class Util
     */
    var Util = {

        /**
         * Detect whether an object is an HTML element
         * @method isElement
         * @param {Object} e Object to detect
         * @param {String} name Element name
         * @return {Boolean} Returns true, if object is a element of specified name
         */
        isElement: function(e, name) {
            if (! e || typeof e !== 'object') {
                return false;
            }
            var n = e.nodeName;
            return n && n.toLowerCase() === name;
        },

        /**
         * Detect whether an object is an HTML FORM element
         * @method isFormElement
         * @param {Object} e Object to detect
         * @return {Boolean} Returns true, if object is a FORM element
         */
        isFormElement: function(e) {
            return this.isElement(e, 'form');
        },

        /**
         * Detect whether an object is an HTML INPUT element
         * @method isInputElement
         * @param {Object} e Object to detect
         * @return {Boolean} Returns true, if object is a INPUT element
         */
        isInputElement: function(e) {
            return this.isElement(e, 'input');
        },

        /**
         * Detect whether an object is an HTML INPUT element whose type is "file".
         * @method isFileInputElement
         * @param {Object} e Object to detect
         * @return {Boolean} Returns true, if object is a INPUT element
         */
        isFileInputElement: function(e) {
            return this.isInputElement(e) && e.type.toLowerCase() === 'file';
        },

        /**
         * Get a value of the element.
         * @method elementValue
         * @param {Object} e Element
         * @return {String} Returns a value of the element.
         */
        elementValue: function(e) {
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
         * Convert to a string in ISO 8601 format from Date object.
         * @method elementValue
         * @param {Date} date Date object
         * @return {String} Returns a string.
         */
        toIso8601Date: function(date) {
            function f(n) {
                return n < 10 ? '0' + n : n;
            }

            if (! isFinite(date.valueOf())) {
                return '';
            }

            var off,
                tz = date.getTimezoneOffset();
            if(tz === 0) {
                off = 'Z';
            }
            else {
                off  = (tz > 0 ? '-': '+');
                tz   = Math.abs(tz);
                off += f(Math.floor(tz / 60)) + ':' + f(tz % 60);
            }

            return date.getFullYear()     + '-' +
                f(date.getMonth() + 1) + '-' +
                f(date.getDate())      + 'T' +
                f(date.getHours())     + ':' +
                f(date.getMinutes())   + ':' +
                f(date.getSeconds())   + off;
        }
    };

    DataAPI.Util = Util;
})();
