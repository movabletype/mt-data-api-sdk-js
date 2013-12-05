describe("DataAPI.Util", function(){
    var desc = typeof document !== "undefined" ? describe : xdescribe;

    describe("DataAPI.Util.toIso8601Date", function() {
        it("should be converted to the correct format", function(){
            var date = new Date(2013, 10, 29, 10, 10, 10);

            expect(MT.DataAPI.Util.toIso8601Date(date)).toMatch(/^2013-11-29T10:10:10(Z|(\+|-)\d{2}:\d{2})$/);
        });
    });

    desc("DataAPI.Util.isElement", function() {
        it("should be false for a null object", function(){
            expect(MT.DataAPI.Util.isElement(null, "a")).toBeFalsy();
        });
        it("should be true for an anchor element with 'a'", function(){
            var elm = document.createElement("a");
            expect(MT.DataAPI.Util.isElement(elm, "a")).toBeTruthy();
        });
        it("should be false for an anchor element with 'form'", function(){
            var elm = document.createElement("a");
            expect(MT.DataAPI.Util.isElement(elm, "form")).toBeFalsy();
        });
    });

    desc("DataAPI.Util.isFormElement", function() {
        it("should be false for a null object", function(){
            expect(MT.DataAPI.Util.isFormElement(null)).toBeFalsy();
        });
        it("should be true for a form element", function(){
            var elm = document.createElement("form");
            expect(MT.DataAPI.Util.isFormElement(elm)).toBeTruthy();
        });
        it("should be false for an anchor element", function(){
            var elm = document.createElement("a");
            expect(MT.DataAPI.Util.isFormElement(elm)).toBeFalsy();
        });
    });

    desc("DataAPI.Util.isInputElement", function() {
        it("should be false for a null object", function(){
            expect(MT.DataAPI.Util.isInputElement(null)).toBeFalsy();
        });
        it("should be true for an input element", function(){
            var elm = document.createElement("input");
            expect(MT.DataAPI.Util.isInputElement(elm)).toBeTruthy();
        });
        it("should be false for an anchor element", function(){
            var elm = document.createElement("a");
            expect(MT.DataAPI.Util.isInputElement(elm)).toBeFalsy();
        });
    });

    desc("DataAPI.Util.isFileInputElement", function() {
        it("should be false for a null object", function(){
            expect(MT.DataAPI.Util.isFileInputElement(null)).toBeFalsy();
        });
        it("should be false for an input element with empty type attribute", function(){
            var elm = document.createElement("input");
            expect(MT.DataAPI.Util.isFileInputElement(elm)).toBeFalsy();
        });
        it("should be true for an input element with type: file", function(){
            var elm = document.createElement("input");
            elm.type = "file";
            expect(MT.DataAPI.Util.isFileInputElement(elm)).toBeTruthy();
        });
    });

    desc("DataAPI.Util.elementValue", function() {
        it("should be 1 for an input element", function(){
            var elm = document.createElement("input");
            elm.value = "1";
            expect(MT.DataAPI.Util.elementValue(elm)).toEqual("1");
        });

        it("should be 1 for a select element: implicitly", function(){
            var elm  = document.createElement("select");
            var op1 = document.createElement("option");
            op1.value = "1";
            elm.appendChild(op1);
            var op2 = document.createElement("option");
            op2.value = "2";
            elm.appendChild(op2);

            expect(MT.DataAPI.Util.elementValue(elm)).toEqual("1");
        });

        it("should be 2 for a select element: explicitly", function(){
            var elm  = document.createElement("select");
            var op1 = document.createElement("option");
            op1.value = "1";
            elm.appendChild(op1);
            var op2 = document.createElement("option");
            op2.value = "2";
            op2.selected = "selected";
            elm.appendChild(op2);

            expect(MT.DataAPI.Util.elementValue(elm)).toEqual("2");
        });
    });
});
