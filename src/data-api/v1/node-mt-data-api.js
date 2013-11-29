// @include ../common/header.js
;(function(window, factory) {
    var DataAPI = factory(window);

    if ( typeof module === "object" && typeof module.exports === "object" ) {
        module.exports = DataAPI;
    } else {
        if ( typeof define === "function" && define.amd ) {
            define("mt-data-api", [], function() {
                return DataAPI;
            });
        }
    }
}(typeof window === "undefined" ? undefined : window, function(window, undefined) {

"use strict";

// @include ../common/window.js
// @include ../common/core.js
// @include ../common/util.js
// @include ../common/search-condition.js
// @include ../common/cookie.js
// @include ../common/json.js
// @include ./endpoints.js
// @include ../common/sessionstore-fs.js
// @include ../common/exports.js

return DataAPI;

}));
