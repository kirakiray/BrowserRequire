define(function (require) {
    var val = "I am Module02",
        reObj = {
            val: val
        };

    /*
        模块依赖其他模块，是用define函数的arguments[0]的require引入依赖；
        当加载完module03模块并执行ready方法后，才会触发该模块（当前是module02）的加载完成的指令，
        所以可以放心的加载其他依赖文件，brjs会处理各种加载情况；
    */
    require('module03').ready = function (m3) {
        reObj.m3 = m3;
    };
    /*
        @return {all}
        可返回任意内容作为模块内容
    */
    return reObj;
});