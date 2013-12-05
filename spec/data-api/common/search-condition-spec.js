describe("DataAPI.SearchCondition", function() {

    it("should be created MT.DataAPI.SearchCondition without option", function(){
        expect(function() {
            new MT.DataAPI.SearchCondition();
        }).not.toThrow();
    });

    it("should be created MT.DataAPI.SearchCondition with valid option", function(){
        expect(function() {
            new MT.DataAPI.SearchCondition({
                type: "or"
            });
        }).not.toThrow();
    });

    it("should not be created MT.DataAPI.SearchCondition with unknown option", function(){
        expect(function() {
            new MT.DataAPI.SearchCondition({
                unknownOption: null
            });
        }).toThrow("Unkown option: unknownOption");
    });

    it("should compile correctly simple condition", function(){
        var cond = new MT.DataAPI.SearchCondition();
        cond.add("id", 1);

        expect(JSON.parse(cond.serialize()))
            .toEqual([{type: "id", args: {value: 1}}]);
    });

    it("should compile correctly simple condition : Date object", function(){
        var cond = new MT.DataAPI.SearchCondition(),
            origin = new Date(2013, 10, 29, 10, 10, 10);

        cond.add("authored_on", {
            "option": "after",
            "origin": origin
        });

        expect(JSON.parse(cond.serialize()))
            .toEqual([
                {
                    type: "authored_on",
                    args: {
                        option: "after",
                        origin: MT.DataAPI.Util.toIso8601Date(origin)
                    }
                }
            ]);
    });

    it("should compile correctly sub 'or' condition", function(){
        var cond = new MT.DataAPI.SearchCondition();
        cond.add("id", 1);

        var subCond = new MT.DataAPI.SearchCondition({type: "or"});
        subCond.add("id", 1);
        subCond.add("id", 2);
        cond.add(subCond);

        expect(JSON.parse(cond.serialize()))
            .toEqual([
                {
                    type: "id",
                    args: {
                        value: 1
                    }
                },
                {
                    type: "pack",
                    args: {
                        op: "or",
                        items: [
                            {
                                type: "id",
                                args: {
                                    value: 1
                                }
                            },
                            {
                                type: "id",
                                args: {
                                    value: 2
                                }
                            }
                        ]
                    }
                }
            ]);
    });

    it("should compile correctly sub 'and' condition", function(){
        var cond = new MT.DataAPI.SearchCondition({type: "or"});

        var subCond = new MT.DataAPI.SearchCondition();
        subCond.add("id", 1);
        subCond.add("id", 2);
        cond.add(subCond);

        subCond = new MT.DataAPI.SearchCondition();
        subCond.add("id", 3);
        subCond.add("id", 4);
        cond.add(subCond);

        expect(JSON.parse(cond.serialize()))
            .toEqual([
                { type : "pack", args : { op : "or", items : [ { type : "pack", args : { op : "and", items : [ { type : "id", args : { value : 1 } }, { type : "id", args : { value : 2 } } ] } }, { type : "pack", args : { op : "and", items : [ { type : "id", args : { value : 3 } }, { type : "id", args : { value : 4 } } ] } } ] } }
            ]);
    });

    it("should compile correctly multiple sub condition", function(){
        var cond = new MT.DataAPI.SearchCondition();
        cond.add(new MT.DataAPI.SearchCondition().add("id", 1));
        cond.add(new MT.DataAPI.SearchCondition().add("id", 2));

        expect(JSON.parse(cond.serialize()))
            .toEqual([
                {type: "id", args: {value: 1}},
                {type: "id", args: {value: 2}}
            ]);
    });

    it("should be specified via 'Function' object", function(){
        var id = 1;
        var cond = new MT.DataAPI.SearchCondition();
        cond.add("id", function() {
            return {
                value: id
            };
        });

        expect(JSON.parse(cond.serialize()))
            .toEqual([
                {type: "id", args: {value: 1}},
            ]);
    });

    it("should be evaluated lazyly via 'Function' object", function(){
        var id;
        var cond = new MT.DataAPI.SearchCondition();
        cond.add("id", function() {
            return {
                value: id
            };
        });

        id = 1;
        cond.serialize();

        id = 2;
        expect(JSON.parse(cond.serialize()))
            .toEqual([
                {type: "id", args: {value: 2}},
            ]);
    });

    it("should be specified via nested 'Function' object", function(){
        var id = 1;
        var cond = new MT.DataAPI.SearchCondition();
        cond.add("id", function() {
            return {
                value: function() {
                    return id;
                }
            };
        });

        expect(JSON.parse(cond.serialize()))
            .toEqual([
                {type: "id", args: {value: 1}},
            ]);
    });

    it("should be specified via 'Function' object including 'type'", function(){
        var id = 1;
        var cond = new MT.DataAPI.SearchCondition();
        cond.add(function() {
            return {
                type: "id",
                args: {
                    value: id
                }
            };
        });

        expect(JSON.parse(cond.serialize()))
            .toEqual([
                {type: "id", args: {value: 1}},
            ]);
    });

    it("should be specified via nested 'Function' object including 'type'", function(){
        var id = 1;
        var cond = new MT.DataAPI.SearchCondition();
        cond.add(function() {
            return {
                type: "id",
                args: {
                    value: function() {
                        return id;
                    }
                }
            };
        });

        expect(JSON.parse(cond.serialize()))
            .toEqual([
                {type: "id", args: {value: 1}},
            ]);
    });

    if (typeof window !== "undefined" && window.document) {
        it("should be specified via 'HTMLInput' element", function(){
            var $input = $('<input name="title" />');
            $input.val("test");

            var cond = new MT.DataAPI.SearchCondition();
            cond.add("title", $input.get(0));

            expect(JSON.parse(cond.serialize()))
                .toEqual([
                    {type: "title", args: {value: "test"}}
                ]);
        });
    }

    it("should be acceptable SearchCondition object as a parameter directly", function(){
        var requestUrl;
        spyOn(MT.DataAPI.prototype, "sendXMLHttpRequest")
            .andCallFake(function(xhr, method, url, params, defaultHeaders) {
                requestUrl = url;
                return xhr;
            });

        var api = newDataAPI(),
            cond = new MT.DataAPI.SearchCondition();
        cond.add("id", 1);

        api.request("GET", "/unkown-endpoint", cond);

        var regexp = new RegExp("searchConditions=" + encodeURIComponent(cond.serialize()));
        expect(requestUrl).toMatch(regexp);
    });

    it("should be acceptable SearchCondition object as a 'searchConditions' parameter", function(){
        var requestUrl;
        spyOn(MT.DataAPI.prototype, "sendXMLHttpRequest")
            .andCallFake(function(xhr, method, url, params, defaultHeaders) {
                requestUrl = url;
                return xhr;
            });

        var api = newDataAPI(),
            cond = new MT.DataAPI.SearchCondition();
        cond.add("id", 1);

        var param = {fields: "id,title", searchConditions: cond};
        api.request("GET", "/unkown-endpoint", param);

        var regexp = new RegExp("searchConditions=" + encodeURIComponent(cond.serialize()));
        expect(requestUrl).toMatch(regexp);
    });
});
