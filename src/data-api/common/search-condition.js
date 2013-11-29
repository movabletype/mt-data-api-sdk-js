/**
 * @namespace MT.DataAPI
 */
;(function() {

    /**
     * The MT.DataAPI.SearchCondition is a object to build search queries for the DataAPI.
     * @class SearchCondition
     * @constructor
     * @param {Object} options Options.
     *   @param {String} options.type Type
     *     All conditions added will be joined by this value.
     *     "and" or "or" is allowed to this parameter. The default value is "and".
     */
    var SearchCondition = function(options) {
        var k;

        this.o = {
            type: "and"
        };
        for (k in options) {
            if (k in this.o) {
                this.o[k] = options[k];
            }
            else {
                throw "Unkown option: " + k;
            }
        }

        this.searchConditions = [];
    };

    SearchCondition.prototype = {
        constructor: SearchCondition.prototype.constructor,

        /**
         * Add a condition
         * @method add
         * @param {String|SearchCondition|Function} type|conditon Type of the value or sub condtion
         * @param {String|Number|HTMLInputElement|Object} value value
         * @return {SearchCondition} Return myself to build method chain.
         * @example
         *     var cond = new MT.DataAPI.SearchCondition();
         *     cond
         *       .add("id", 1)
         *       .add("title", "Title")
         *       .add("title", {
         *         option: "contains",
         *         value: "Title"
         *       })
         *       .add("title", {
         *         option: "contains",
         *         value: function() {
         *           return title
         *         }
         *       })
         *       .add("authored_on", {
         *         option: "after",
         *         origin: new Date(2013, 10, 29, 10, 10, 10)
         *       })
         *       .add("id", document.getElementById("id"))
         *       .add(new MT.DataAPI.SearchCondition().add("id", 1))
         *       .add(function() {
         *         return {
         *           type: "id",
         *           args: {
         *             value: id,
         *           }
         *         };
         *       })
         *       .add(function() {
         *         return {
         *           type: "id",
         *           args: {
         *             value: function() {
         *               return id;
         *             }
         *           }
         *         };
         *       });
         */
        add: function(type, value) {
            function toValue(t, v) {
                if (
                    (t instanceof SearchCondition) ||
                    (typeof t === "function")
                ) {
                    return t;
                }

                var type = typeof v;

                if (
                    type === "number" ||
                    type === "string" ||
                    DataAPI.Util.isInputElement(v)
                ) {
                    return {
                        type: t,
                        args: {
                            value: v
                        }
                    };
                }
                else {
                    return {
                        type: t,
                        args: v
                    };
                }
            }

            this.searchConditions.push(toValue(type, value));

            return this;
        },

        _expandObject: function(obj) {
            var k, tmp = {};

            for (k in obj) {
                if (! obj.hasOwnProperty(k)) {
                    continue;
                }

                if (typeof obj[k] === "function") {
                    tmp[k] = obj[k]();
                }
                else if (obj[k] instanceof Date) {
                    tmp[k] = DataAPI.Util.toIso8601Date(obj[k]);
                }
                else {
                    tmp[k] = obj[k];
                }

                if (tmp[k] && typeof tmp[k] === "object") {
                    if (DataAPI.Util.isInputElement(tmp[k])) {
                        tmp[k] = DataAPI.Util.elementValue(tmp[k]);
                    }
                    else {
                        tmp[k] = this._expandObject(tmp[k]);
                    }
                }
            }

            return tmp;
        },

        _expandConditions: function() {
            var i, c, conds = [];

            for (i = 0; i < this.searchConditions.length; i++) {
                c = this.searchConditions[i];
                if (c instanceof SearchCondition) {
                    c = c._packConditions();
                }
                else {
                    if (typeof c === "function") {
                        c = c();
                    }

                    if (c && typeof c === "object") {
                        c = this._expandObject(c);
                    }
                }

                if (c.type && c.args) {
                    conds.push(c);
                }
            }

            return conds;
        },

        _packConditions: function() {
            var conds = this._expandConditions();

            if (conds.length === 1) {
                return conds[0];
            }
            else if (this.o.type === "or") {
                return {
                    type: "pack",
                    args: {
                        op: "or",
                        items: conds
                    }
                };
            }
            else {
                return {
                    type: "pack",
                    args: {
                        op: "and",
                        items: conds
                    }
                };
            }
        },

        _getConditions: function() {
            return (this.o.type === "or") ?
                [this._packConditions()] :
                this._expandConditions();
        },

        /**
         * Serialize all conditions added
         * @method serialize
         * @return {String} Return a string serialized in JSON format
         */
        serialize: function() {
            return JSON.stringify(this._getConditions());
        }
    };

    DataAPI.SearchCondition = SearchCondition;
})();
