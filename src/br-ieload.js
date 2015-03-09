/**
    @fileoverview br.js 低版本ie兼容插件
*/
require.extend(function (baseResource, F, C, R, Global) {
    //判断是否是IE且是否支持异步特性（确认是否ie9及以下才能设定）
    if (('async' in document.createElement('script')) || !(navigator.userAgent.search('MSIE') > 0)) {
        return;
    }

    //展开C
    var Require = C.Require,
        BindEvent = C.BindEvent,
        GatherFunction = C.GatherFunction,
        CombRequire = C.CombRequire;
    //低版本IE模拟异步载入模块方法
    var loadModuleForIE = function (uri) {
        //建立script，加载一个文件的的事件对象
        var script = R.getScriptTag(uri),
            loadModuleEvent = new BindEvent();
        //设置defer
        script.defer = 'defer';
        //设置文件加载中
        var fileMapObj = {
            //加载状态
            type: 1,
            //事件注册器实例
            loadEvent: loadModuleEvent,
            //script节点对象
            script: script
            //模块
            //module : undefined
            //滞后汇总对象
            //lagGather: new GatherFunction()
        };
        //正在运行loadModuleForIE，加入数据
        loadModuleForIE.moduleArr.push({
            script: script,
            loadModuleEvent: loadModuleEvent,
            fileMapObj: fileMapObj,
            uri: uri
        });
        //判断是否在运行中
        if (!loadModuleForIE.isRun) {
            //setTimeout(function() {
            loadModuleForIE.runModuleArr();
            //}, 0);
            loadModuleForIE.isRun = true;
        }
        //记录到公用对象
        baseResource.map[uri] = fileMapObj;
        return loadModuleEvent;
    };
    //存储剩余的文件
    loadModuleForIE.moduleArr = [];
    loadModuleForIE.runModuleArr = function () {
        //判断剩下的文件数量
        if (!loadModuleForIE.moduleArr.length) {
            loadModuleForIE.isRun = false;
            return;
        }
        //拿出参数
        var arg = loadModuleForIE.moduleArr.splice(0, 1)[0];
        var script = arg.script,
            loadModuleEvent = arg.loadModuleEvent,
            fileMapObj = arg.fileMapObj,
            uri = arg.uri;
        //判断是否在运行
        var isRunReady = false;
        //异步添加标签
        setTimeout(function () {
            script.onreadystatechange = function () {
                var _this = this;
                if (_this.readyState == 'complete' && !isRunReady) {
                    //载入成功
                    isRunReady = true;
                    //跳入设置模块代理
                    R.setModuleAgent(fileMapObj, loadModuleEvent, uri);
                    //继续跑moduleArr内的require
                    loadModuleForIE.runModuleArr();
                } else if (_this.readyState == "loaded") {
                    //加载错误
                    isRunReady = true;
                    //设置资源加载错误
                    fileMapObj.type = 3;
                    //运行error函数
                    loadModuleEvent.trigger('error', {
                        //加载错误
                        type: "error",
                        path: uri
                    });
                    loadModuleForIE.runModuleArr();
                } else if (_this.readyState == "loading" && !isRunReady) {
                    //加载中
                    //补偿对象
                    var stateObj = {
                        readyState: 'loaded'
                    };
                    //设置超时错误
                    var _arguments = arguments;
                    setTimeout(function () {
                        if (!isRunReady) {
                            _arguments.callee.call(stateObj);
                        }
                    }, 6000);
                }
            };
            //添加节点
            document.getElementsByTagName('head')[0].appendChild(script);
        }, 0);
    };
    //方法是否在执行，是则加入队列
    loadModuleForIE.isRun = false;
    //判断是否是IE且是否支持异步特性
    //if (!('async' in document.createElement('script')) && navigator.userAgent.search('MSIE') > 0) {
    R.loadModule = loadModuleForIE;
    //}
}, 'ieload');