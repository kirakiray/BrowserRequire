define(function (require) {
    return function (val) {
        //输出内容
        document.getElementById('outer').innerHTML += val + "<br />";
    };
});