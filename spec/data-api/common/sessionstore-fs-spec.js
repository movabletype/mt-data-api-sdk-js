(typeof require !== 'undefined' && require("fs") ? describe : xdescribe)("DataAPI Sessionstore Filesystem", function(){
    runSessionStoreCommonSpecs('fs');
});
