define(function (require, exports, module) {
    exports.val = 'I am sugar module';
    require('../js/hybirdModule').sure(function (hybirdmodule) {
        exports.hy = hybirdmodule;
    });
});