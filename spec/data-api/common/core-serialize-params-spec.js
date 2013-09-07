describe("DataAPI serializeParams", function(){
    var api,
        serializedValues = [
            ['Null', null, null],
            ['undefined', undefined, undefined],
            ['String', 'a=1', 'a=1'],
            ['Object', {a:1,b:2}, new RegExp('a=1&b=2|b=2&a=1')]
        ],
        unserializedValues = [
            ['Object', {a:1}, {a:1}],
            ['String', 'a=1%202', {a:"1 2"}]
        ],
        testObject = function(){};

    testObject.prototype.aProp = 1;
    serializedValues.push([
        'Extended Object', new testObject(), ''
    ]);

    if (typeof window !== 'undefined' && window.document) {
        var $ = jQuery;

        var $form = $('<form />')
                        .append($('<input />').attr({
                            name: 'id',
                            value: 3
                        }));
        serializedValues.push(['Form', $form.get(0), 'id=3']);
    }

    beforeEach(function() {
        cleanupSession();
        api = newDataAPI();
    });

    _.each(serializedValues, function(d) {
        it("should be serialized " + d[0] + " by _serializeParams", function(){
            if (d[2] instanceof RegExp) {
                expect(api._serializeParams(d[1])).toMatch(d[2]);
            }
            else {
                expect(api._serializeParams(d[1])).toEqual(d[2]);
            }
        });
    });

    _.each(unserializedValues, function(d) {
        it("should be serialized " + d[0] + " by _unserializeParams", function(){
            expect(api._unserializeParams(d[1])).toEqual(d[2]);
        });
    });
});
