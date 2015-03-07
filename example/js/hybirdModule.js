define(function (require) {
    var val = 'hybird module wansui!!!!!!!!!!',
        reObj = {
            val: val
        };
    /*
        模块依赖可以和非模块化的文件共存；
        同步加载module04和file01，所以顺序不定；
        当两个文件加载完成，才会触发当前模块的定义；
    */
    require('module04', 'file01').ready = function (m4, f1) {
        //因为f1是非模块文件，所以f1是undefined
        reObj.f1 = f1;
        
        reObj.m4 = m4;
    };

    //同目录下引入文件，表明该模块（当前是hybirdModule）依赖这两个文件，并且这两文件有依赖顺序；
    require('jq').require('file03');

    return reObj;
});