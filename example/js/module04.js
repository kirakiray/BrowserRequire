define(function (require) {
    var val = "I am Module04",
        reObj = {
            val: val
        };

    //先载入r1组合
    var r1 = require('module01', 'module02');
    r1.ready = function (m1, m2) {
        reObj.m1 = m1;
        reObj.m2 = m2;
    };

    //载入r1组合后载入r2组合
    var r2 = r1.require('module03');
    r2.ready = function (m3) {
        reObj.m3 = m3;
    };
    /*
        @return {all}
        可返回任意内容作为模块内容
    */
    return reObj;
});