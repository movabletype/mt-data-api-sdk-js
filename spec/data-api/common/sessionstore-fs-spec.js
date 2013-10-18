(function(runner) {
    var desc = describe;
    try {
        require("fs");
    }
    catch (e) {
        desc = xdescribe;
    }

    desc("DataAPI Sessionstore Filesystem", runner);
}(function(){
    runSessionStoreCommonSpecs('fs');
}));
