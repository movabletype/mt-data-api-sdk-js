window = {
    XMLHttpRequest: require('xmlhttprequest').XMLHttpRequest,
    FormData: require('form-data'),
    File: require('stream').Stream
};
(function() {
    var fs = require('fs'),
        _append = window.FormData.prototype.append;

    window.FormData.prototype.append = function(field, value, options) {
        if (! options && value.hasOwnProperty('fd')) {
            try {
                options = {knownLength: fs.statSync(value.path).size};
            }
            catch (e) {
            }
        }

        var result  = _append.call(this, field, value, options);
        this.length = this.getLengthSync();

        return result;
    };
})();
