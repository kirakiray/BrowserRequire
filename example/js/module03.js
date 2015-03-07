define(function () {
    var val = "I am Module03";
    /*
        @return {all}
        可返回任意内容作为模块内容
    */
    return {
        val: val
    };
}, 'custom');
//id参数可以为数组，就是定义多个id
/*
    define(function(){},['name1','name2','name3']);
*/