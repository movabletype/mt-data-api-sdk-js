describe("DataAPI Event", function(){
    var api, i, originalFileConstructor, fakeFileConstructor,
        $                = jQuery,
        serializedValues = [
            ['Number', 1, 1],
            ['Null', null, ''],
            ['undefined', undefined, ''],
            ['Boolean: true', true, '1'],
            ['Boolean: false', false, ''],
            ['Object', {title: 'Title'}, '{"title":"Title"}'],
            ['Object with Date', {date: (function() {
                var date = new Date(2013, 8, 1, 2, 3, 4);
                date.getTimezoneOffset = function(){ return 0 };
                return date;
            })()}, '{"date":"2013-09-01T02:03:04Z"}'],
            ['Date: Infinity', (function() {
                var date = new Date(2013, 8, 1, 2, 3, 4);
                date.valueOf = function(){ return Infinity };
                return date;
            })(), '']
        ];
        $.each([
            [0, 'Z'],
            [60, '-01:00'],
            [90, '-01:30'],
            [-60, '+01:00']
        ], function(i, d) {
            serializedValues.push([
                'Date: timezone offset = ' + d[0],
                (function() {
                    var date = new Date(2013, 8, 1, 2, 3, 4);
                    date.getTimezoneOffset = function(){ return d[0] };
                    return date;
                })(),
                '2013-09-01T02:03:04' + d[1]
            ]);
        }); 

        if (typeof window !== 'undefined' && window.File) {
            originalFileConstructor = window.File;
            fakeFileConstructor = function(){};
            (function() {
                var file = new fakeFileConstructor();
                serializedValues.push(['File', file, file]);
            })();
        }

        if (typeof window !== 'undefined' && window.document) {
            var $form = $('<form />')
                            .append($('<input />').attr({
                                name: 'id',
                                value: 3
                            }));
            serializedValues.push(['Form', $form.get(0), '{"id":"3"}']);
        }

        if (typeof window !== 'undefined' && window.document) {
            var $input = $('<input />').attr({
                             type: 'file',
                             name: 'file'
                         });
            serializedValues.push(['File input', $input.get(0), undefined]);
        }

    beforeEach(function() {
        cleanupSession();
        api = newDataAPI();
        if (typeof window !== 'undefined' && window.File) {
            window.File = fakeFileConstructor;
        }
    });

    afterEach(function() {
        if (typeof window !== 'undefined' && window.File) {
            window.File = originalFileConstructor;
        }
    });
    
    $.each(serializedValues, function(i, d) {
        it("should be serialized " + d[0] + " by _serializeObject", function(){
            expect(api._serializeObject(d[1])).toEqual(d[2]);
        });
    });
});
