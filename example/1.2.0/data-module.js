define(function (require, exports, module) {
    //通过this.data可以获取传值过来的数据
    var data = this.data;

    exports.val = '我是data-module';
    exports.postdata = data;
});