/**
    @fileoverview 这个模块化工具叫BrowserRequire，缩写为br.js
      异步模块化思路，做出更适合浏览器使用的模块化加载器
      或者说这是个带有模块定义功能的资源加载器
    @author pikay@foxmail.com
*/
(function (Global) {
    //publicData
    //基础存储临时数据 baseResource
    var baseResource = {
        //自定义的路径
        paths: {},
        //js模块相对路径
        baseUrl: "",
        //载入模块用的map对象(子对象type字段   1:加载中;2:加载成功;3:加载错误;undefined没有加载过文件)
        map: {},
        //临时挂起的模块对象
        tempM: null,
        //版本号
        version: "browserRequire 1.0",
        //存放插件方法的统一对象
        br: {}
    };

    //Common
    var C_READY = 'ready',
        C_ERROR = 'error';

    //Base Function
    //基础常用的方法

    /**
            判断传入值的类型
            @param {All} value 任意值
            @return {string} 返回当前值的类型的字符串 string|object|number...
        */
    var emptyFun = function () {},
        getType = function (value) {
            return Object.prototype.toString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
        },
        /**
            继承对象的方法，同Object.create
            @param {object} 需要继承的对象
            @return {object} 继承后的新对象
        */
        create = Object.create || function (obj) {
            var f = emptyFun;
            f.prototype = obj;
            return new f();
        },
        /**
            转换arguments为数组
            @param {arguments} args 函数的arguments对象
            @return {array} arguments转换的数组
        */
        transArgumtnts = function (args) {
            return Array.prototype.slice.call(args);
        },
        /**
            合并对象，like jQuery.extend
            @param {Object} arguments[0] 后面的对象要合并到该对象上
            @param {Object} arguments[i>0] 要向前合并的对象
            @return {Object} 第一个被合并的对象
        */
        extend = function () {
            var args = transArgumtnts(arguments);
            var o = args.splice(0, 1)[0];
            for (var a = 0, len = args.length; a < len; a++) {
                for (var i in args[a]) {
                    o[i] = args[a][i];
                }
            };
            return o;
        },
        /**
            给字符串去掉.js后缀
            @param {string} value 传入的文件名（有无带.js后缀都可以）
            @return {string} 返回去掉.js后缀的文件名
        */
        getPath = function (value) {
            return value.replace(/.js$/g, "");
        },
        /**
            在字符串后面加上.js后缀
            @param {string} value 传入文件名
            @return {string} 添加.js后缀的文件名
        */
        concatJS = function (value) {
            return value.concat('.js');
        };

    //publicClass
    //公共类

    /**
        生成一个事件注册器
        @constructor
    */
    function BindEvent() {
        //存放事件对象
        this._events = {};
        //当前运行中的方法名
        this._run = {};
        //立即运行的列表项
        this._atOnce = {};
        //final列表
        this._final = {};
    };
    /**
        注册事件方法（此bind事件不会污染注册函数内的this，并且对注册事件和删除事件有规定）；
        若注册的函数返回false则不会跑后续的事件
        @param {string} eventName 定义事件名
        @param {function} fun 定义事件函数
        @param {all} data 注册事件附加的数据
    */
    BindEvent.prototype.bind = function (eventName, fun, data) {
        //判断是否是同步立即运行的函数
        var atOnceData = this._atOnce[eventName],
            runfun = function () {
                fun({
                    eventName: eventName,
                    bData: data,
                    tData: atOnceData.tData
                });
            };
        if (atOnceData) {
            if (atOnceData.async) {
                //模拟异步执行
                setTimeout(runfun, 0);
            } else {
                //同步立即执行
                runfun();
            }
            return;
        }
        //若当前事件正在运行，则不能注册该事件
        if (this._run[eventName]) {
            this._run[eventName] = 0;
            throw ("event running:" + eventName);
        }
        //查找是否有此队列，没有则建立队列
        var _this = this;
        var eventArr = this._events[eventName] || (function () {
            _this._events[eventName] = [];
            return _this._events[eventName];
        })();
        //添加入队列
        eventArr.push({
            //事件名
            eventName: eventName,
            fun: fun,
            //私有data
            bData: data
        });
    };
    /**
        触发事件
        @param {string} eventName 事件名
        @param {all} data 触发事件绑定的数据
    */
    BindEvent.prototype.trigger = function (eventName, data) {
        //获取事件队列
        var eventArr = this._events[eventName] || [];
        //写入当前运行的事件名
        this._run[eventName] = true;
        //运行队列
        for (var i = 0, len = eventArr.length; i < len; i++) {
            //运行事件队列的函数
            var eventObj = eventArr[i];
            if (!eventObj) {
                continue;
            }
            //返回的值来判断是否继续运行
            var bulBool = eventObj.fun({
                eventName: eventObj.eventName,
                bData: eventObj.bData,
                tData: data
            });
            if (bulBool == false) {
                //得到false返回则break
                this._run[eventName] = false;
                return;
            }
        }
        //执行last函数
        if (this._final[eventName]) {
            var delFinal = this._final[eventName]();
            if (delFinal == false) {
                delete this._final[eventName];
            }
        }
        //_run里有false代表已经运行过该事件了，true代表正在运行当前事件
        this._run[eventName] = false;

        //（递归）触发克隆对象(cloneList)的事件
        var cloneList = this._clones;
        if (cloneList) {
            for (var i = 0; i < cloneList.length; i++) {
                cloneList[i].trigger(eventName, data);
            }
        }
    };
    /**
        移除事件
        @param {string} eventName 事件名
        @param {function|null} fun 需要移除相应的函数
    */
    BindEvent.prototype.unbind = function (eventName, fun) {
        //若当前事件正在运行，则不能注册该事件
        if (this._run[eventName]) {
            this._run[eventName] = 0;
            throw ("event running:" + eventName);
        }
        if (eventName && !fun) {
            //如果只有事件名没有注册函数，则清除事件函数
            this._events[eventName] = [];
            return;
        } else if (!eventName && !fun) {
            //没有函数名和事件名，则清空事件表
            this._events = {};
            return;
        }
        var thisEvent = this._events[eventName];
        //移除相关事件
        for (var i = 0, len = thisEvent.length; i < len; i++) {
            if (fun == thisEvent[i].fun) {
                thisEvent.splice(i, 1);
                break;
            }
        }
    };
    /**
        设置即时事件名：设置即时事件名后，当该事件被注册时，将会立即运行，有可选参数设置后会模拟异步运行
        @param {string} eventName 事件名
        @param {all} tData 运行时绑定的触发数据
        @param {boolean} 是否要模拟异步运行
    */
    BindEvent.prototype.setOnce = function (eventName, tData, async) {
        this._atOnce[eventName] = {
            //模拟触发数据
            tData: tData,
            //是否模拟异步运行
            async: async
        };
    };
    /**
        设置处于事件队列运行完后的callback
        必定会在该事件的最后运行
        若注册的函数返回false导致事件队列中断，则不会执行last事件
        @param {string} eventName 事件名
        @param {function} callback 事件运行完后要执行的函数
    */
    BindEvent.prototype.last = function (eventName, callback) {
        this._final[eventName] = callback;
    };
    /*
        克隆实例，主实例触发相应bind事件，也会触发克隆实例绑定的事件，但是与主实例相对独立的对象
    */
    BindEvent.prototype.clone = function () {
        if (!this._clones) {
            this._clones = [];
        }
        var bindEvent = new BindEvent();

        //克隆对象列表对象
        this._clones.push(bindEvent);

        //克隆前的源对象
        bindEvent._cSource = this;

        return bindEvent;
    };

    /**
        生成一个有分布式统一触发函数的对象；
        生成的实例的create方法可生成一个函数，当运行完所有生成的函数，会执行当前实例的action方法；
        create生成的函数可收集数据，然后传递给action方法
        @constructor
    */
    function GatherFunction() {
        this._idCount = 0;
        this._gatherData = {};
        this.action = emptyFun;
    };
    /**
        生成一个函数
        @return {function} 返回运行的子函数
    */
    GatherFunction.prototype.create = function () {
        var _this = this,
            id = this._idCount,
            fun = function (obj) {
                if (obj) {
                    _this._gatherData[id] = obj;
                }
                _this._idCount--;
                if (!_this._idCount) {
                    //当所有的create的函数都执行后，将执行action函数
                    _this.action(_this._gatherData);
                }
            };
        this._idCount++;
        return fun;
    };

    /**
        require基础类
        @constructor
    */
    function Require() {};
    Require.prototype.ready = emptyFun;
    Require.prototype.error = emptyFun;
    Require.prototype.loading = emptyFun;

    /**
        与业务关联的require连带记录器；
        树状拓扑结构，所有分支走完将运行实例的final方法；
        拓扑结构上的第一个实例对象一定会有_action方法，没有_subGather方法；
        使用到GatherFunction类；
        继承Require类；
        @param {boolean} notFirst 是否链结构上的根节点
        @constructor
        @extends {Require}
    */
    function CombRequire(notFirst) {
        //下一层CombRequire数组数据
        this._nexts = [];
        var gather = new GatherFunction();
        if (!notFirst) {
            //公用数据
            this._publicData = {
                gather: gather
            };
            //只有第一个实例化中有此函数
            this._action = function () {
                //console.log('连带触发成功');
            };
            var _this = this;
            //当所有subFun运行后运行当前的action函数
            gather.action = function (data) {
                _this._action(data);
            };
        }
        //当前层的aguments参数值
        this._args = [];
    };
    CombRequire.prototype = create(Require.prototype);
    /**
        实例的后代require方法，记录下一组要加载的模块；
        当前require上的arguments会转换成数组，存放到对象上的_args属性上；
        后续require生成的对象肯定有_subGather方法，没有_action方法；
        @return {object} 返回CombRequire的实例对象；
    */
    CombRequire.prototype.require = function () {
        //传参数代表不是第一个
        var nextComb = new CombRequire(true);
        //挂载公共数据
        nextComb._publicData = this._publicData;
        //挂载子集合函数
        nextComb._subGather = this._publicData.gather.create();
        //记录arguments
        nextComb._args = transArgumtnts(arguments);
        var rtObj = create(nextComb);
        //父实例
        rtObj.previousRequire = this;
        //记录下一个CombRequire实例
        this._nexts.push(rtObj);
        return rtObj;
    };
    /**
       停止运行当前实例的ready方法运行
       实质是用空的函数替换掉ready方法
       相关的载入过程不会停止
    */
    CombRequire.prototype.end = function () {
        this.ready = emptyFun;
    };

    //PublicFunction
    //主题逻辑公用方法，封入对象R

    var R = {
        /**
            获取script标签的方法；
            传入一个js资源地址，返回一个没被使用过的script标签对象
            @param {string} uri 资源的路径
            @return {Element} 该uri的script标签
        */
        getScriptTag: function (uri) {
            uri = concatJS(getPath(uri));
            var script = document.createElement('script');
            //填充相应数据
            script.type = 'text/javascript';
            script.setAttribute('async', true);
            //填充uri
            script.src = uri;
            return script;
        },
        /**
            设置模块值；
            参数1为需要设置的模块名，参数2是需要设置的模块值，可以为任何值；
            执行后会在 baseResource.map 里放入相应的模块数据
            @param {string|Array.<string>} moduleName 模块名
            @param {all} moduleVal 模块值
        */
        setModule: function (moduleName, moduleVal) {
            if (!moduleName) {
                return;
            }
            //防止冲突在根路径下设定模块
            moduleName = baseResource.baseUrl.concat(moduleName);
            var setM = function (mName, mVal) {
                baseResource.map[mName] = {
                    type: 2,
                    module: mVal
                };
            };
            switch (getType(moduleName)) {
            case 'string':
                setM(moduleName, moduleVal);
                break;
            case 'array':
                for (var i = 0, len = moduleName.length; i < len; i++) {
                    setM(moduleName[i], moduleVal);
                };
                break;
            }
        },
        /**
            设置模块中转逻辑；
            当有模块数据在 baseResource.tempM 上，则挂载模块数据到baseResource.map上；
            @param {object} fileMapObj 中心数据库模块对象（baseResource.map）的数据
            @param {BindEvent} loadModuleEvent loadModule方法返回给loadAgent的实例，确认加载状态的事件对象
            @param {string} uri 当前加载资源的真实uri地址
        */
        setModuleAgent: function (fileMapObj, loadModuleEvent, uri) {
            //设置资源加载成功
            fileMapObj.type = 2;
            //start--------以下是模块定义的逻辑----------
            //滞后对象，模块名
            var lagGather = null,
                tempM;
            //判断是否有临时模块
            if (baseResource.tempM) {
                tempM = baseResource.tempM;
                //载入滞后函数
                lagGather = tempM.lagGather;
                //挂在完后清掉临时模块内容
                baseResource.tempM = null;
                if (lagGather) {
                    //为lagGather对象添加模块名属性
                    lagGather.parentModule = uri;
                    //错误载入时用的函数
                    lagGather.runError = function () {
                        //设置资源加载错误
                        fileMapObj.type = 3;
                        //运行error函数
                        loadModuleEvent.trigger(C_ERROR, {
                            //加载错误
                            type: "error",
                            path: uri
                        });
                    };
                }
            }
            //传入滞后函数
            if (lagGather) {
                lagGather.action = function () {
                    //延后的载入临时模块数据
                    fileMapObj.module = tempM.main;
                    //设置模块
                    R.setModule(tempM.names, fileMapObj.module);
                    //执行ready事件
                    loadModuleEvent.trigger(C_READY, {
                        //刚刚加载完成
                        type: "finish",
                        path: uri,
                        //把模块内容带过去
                        module: fileMapObj.module
                    });
                };
                return;
            } else if (tempM) {
                //无延后的则直接设置模块
                //载入临时模块数据
                fileMapObj.module = tempM.main;
                //设置模块
                R.setModule(tempM.names, fileMapObj.module);
            }
            //end--------以上是模块定义的逻辑----------
            //执行ready事件
            loadModuleEvent.trigger(C_READY, {
                //刚刚加载完成
                type: "finish",
                path: uri,
                //把模块内容带过去
                module: fileMapObj.module
            });
        },
        /**
            加载模块文件的方法；
            执行后会在 baseResource.map 里存放临时的加载数据；
            当相应的js文件运行完后，运行setModuleAgent方法；
            @supported >=IE10,Chrome,FireFox...
            @param {string} uri 文件的目录（.js后缀可有可无）
            @return {BindEvent} 返回BindEvent实例，加载完成会执行ready事件，失败则执行error事件
        */
        loadModule: function (uri) {
            //建立script，加载一个文件的的事件对象
            var script = R.getScriptTag(uri),
                loadModuleEvent = new BindEvent();
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
            //记录到公用对象
            baseResource.map[uri] = fileMapObj;
            // >=ie10 and others 使用
            script.onload = function () {
                //设置模块代理
                R.setModuleAgent(fileMapObj, loadModuleEvent, uri);
            };
            //加载出错
            script.onerror = function () {
                //设置资源加载错误
                fileMapObj.type = 3;
                //运行error函数
                loadModuleEvent.trigger(C_ERROR, {
                    //加载错误
                    type: "error",
                    path: uri
                });
            };
            //IE10 异步hack
            setTimeout(function () {
                document.getElementsByTagName('head')[0].appendChild(script);
            }, 0);
            return loadModuleEvent;
        },
        /**
            loadModule前的加载代理;
            根据baseResource.map里的数据，判断当前资源的加载状态（加载中，加载过的或加载失败的），来返回相应的BindEvent实例；
            没有加载过的资源，转到loadModule方法，把相应的BindEvent挂载起来并返回；
            加载中的资源，会从baseResource.map拿回BindEvent返回；
            加载过的资源，会重新生成一个BindEvent实例，该实例设置了注册ready事件后立即执行，异步；
            加载失败的资源，会重新生成一个BindEvent实例，该实例设置了注册error事件后立即执行，同步；
            @param {string} uri 加载资源的目录
            @return {BindEvent} 返回BindEvent实例，加载完成会执行ready事件，失败则执行error事件
        */
        loadAgent: function (uri) {
            var baseMapObj = baseResource.map[uri] || {
                    type: 0
                },
                loadEvent = "";
            switch (baseMapObj.type) {
                //没有加载过
            case 0:
                loadEvent = R.loadModule(uri);
                break;
                //加载中
            case 1:
                //返回克隆对象
                /*
                    克隆可以中转状态
                    中转状态是为了方便插件开发，确保加载未完成的可以有独立的loadAgent保存信息
                */
                loadEvent = baseMapObj.loadEvent.clone();
                break;
                //加载完毕
            case 2:
                loadEvent = new BindEvent();
                loadEvent.setOnce(C_READY, {
                    //已加载过
                    type: "loaded",
                    path: uri,
                    module: baseResource.map[uri].module
                }, true);
                break;
                //错误的资源
            case 3:
                loadEvent = new BindEvent();
                loadEvent.setOnce(C_ERROR, {
                    //错误资源
                    type: "error",
                    path: uri
                });
                break;
            }
            loadEvent.eventType = baseMapObj.type;
            return loadEvent;
        },
        /**
            根据 baseResource.paths 修正资源目录；
            先判断value资源是否有在baseResource.paths中映射，有则返回注册的资源路径，没有则返回value
            判断是否有协议的路径
            @param {string} value 资源的路径或注册的快捷名
            @return {string} 正确的js资源目录
        */
        getByPath: function (value) {
            var path = baseResource.paths[value] || value;
            if ((/.+:\/\//g).test(path)) {
                return path;
            }
            return baseResource.baseUrl.concat(path);
        },
        /**
            负责加载数组内的资源，并组合相应的加载数据情况；
            根据uri加载相应的资源，并整理加载数据；
            每加载完数组内的一个资源，会触发return的BindEvent实例的loading事件，并将当前加载情况带过去；
            当数组内的资源加载完后，触发return的BindEvent实例的succeed事件，并将序号和模块数据带过去；
            有资源加载出错，则触发failure事件;
            @param {Array.<string>} args uri组合的数组
            @return {BindEvent} 返回一个新的BindEvent实例，当数组内的资源加载完成后，执行succeed事件
        */
        argRequire: function (args) {
            var argEvent = new BindEvent(),
                gatherEvent = new GatherFunction(),
                outerData = {
                    //加载成功的路劲
                    succeedPaths: [],
                    //加载失败的路径
                    errorPaths: [],
                    //总路径
                    totalPaths: []
                },
                isError = false;
            //添加args属性
            argEvent.args = args;
            for (var i = 0, len = args.length; i < len; i++) {
                (function (i) {
                    //获取正确路径
                    var moduleUri = R.getByPath(args[i]),
                        subfunction = gatherEvent.create();
                    //载入模块
                    var loadEvent = R.loadAgent(moduleUri);
                    //记录载入相关数据
                    loadEvent.path = moduleUri;
                    loadEvent.uri = args[i];
                    //父argsEvent对象
                    loadEvent.groupEvent = argEvent;
                    //公用loading函数
                    var triggerLoading = function (e) {
                        //运行loading事件
                        var loadingData = {
                            index: i,
                            uri: moduleUri,
                            type: e.tData.type
                        };
                        argEvent.trigger('loading', extend(loadingData, outerData));
                    };
                    loadEvent.bind(C_READY, function (e) {
                        //添加成功路径
                        outerData.succeedPaths.push(moduleUri);
                        //运行loading事件
                        triggerLoading(e);
                        //运行子统计函数（只要有一个不运行，则不会运行action函数了）
                        subfunction({
                            //当前模块运行所在arguments的序号
                            index: i,
                            //把模块带入
                            module: e.tData.module
                        });
                    });
                    //清除掉loadEvent对象
                    loadEvent.last(C_READY, function () {
                        //模块或文件可能在ready方法执行中被destory掉；
                        if (!baseResource.map[moduleUri]) {
                            return;
                        }
                        delete baseResource.map[moduleUri].loadEvent;
                    });
                    loadEvent.bind(C_ERROR, function (e) {
                        //确认失败
                        isError = true;
                        //添加并输出失败路径
                        outerData.errorPaths.push(moduleUri);
                        //路劲出错
                        console.log('error path：' + moduleUri + "\ngroup:" + args.toString());
                        //运行loading事件
                        triggerLoading(e);
                        subfunction(i);
                    });
                    //添加总路径
                    outerData.totalPaths.push(moduleUri);
                })(i);
            }
            //触发action事件时触发相应事件
            gatherEvent.action = function (data) {
                //如果错误则触发failure事件
                if (!isError) {
                    argEvent.trigger('succeed', data);
                } else {
                    argEvent.trigger('failure', extend({
                        //加载失败
                        descript: "failed to load"
                    }, outerData));
                }
            };
            return argEvent;
        },
        /**
            将CombRequire实例内的数据拆分并组装；
            获取当前实例上的arguments数据（uri资源），使用argRequire并行加载数组内的资源； 
            当实例的资源加载成功后，获取加载资源对应的模块，执行实例内的ready方法，把模块按序号带入ready的arguments上；
            拼接当前实例的资源加载的loading事件，到实例上loading方法上，并把加载情况带入；
            当实例的资源加载失败后，执行实例上的error方法；
            当实例的资源加载成功完毕后，获取下一级CombRequire实例，递归；
            若当前层上的资源加载失败，执行CombRequire实例上的error方法；
            
            @see CombRequire
            当前实例没有后代使用require方法时，实例对象上的_nexts{array}属性上的数据长度为0，则需要立即执行_action方法；
            当实例有_subGather方法，则在加载完成后执行;
            当实例没有_subGather方法但有_action方法，并且没有_nexts数据（下一级递归用的数据），则立刻执行_action方法；
            主要为修正CombRequire实例的后代逻辑
            
            @param {CombRequire} combRequire 拥有需要加载的资源的数据（js资源数据数组和下一级需要递归的对象）
        */
        assemblyRequire: function (combRequire) {
            var args = combRequire._args;
            var argEvent = R.argRequire(args);
            //带上关联属性
            argEvent._combRequire = combRequire;
            combRequire._argEvent = argEvent;
            //定义加载成功，加载失败和加载中的事件
            argEvent.bind('succeed', function (e) {
                //start---------模块化相关---------
                //拿出模块并组装成数组
                var moduleArr = [];
                for (var i in e.tData) {
                    moduleArr[e.tData[i].index] = e.tData[i].module;
                }
                //成功则运行ready函数并带入参数
                combRequire.ready.apply(combRequire, moduleArr);
                //end---------模块化相关---------
                //递归执行下个combRequire
                var combRequireArr = combRequire._nexts;
                for (var i = 0, len = combRequireArr.length; i < len; i++) {
                    R.assemblyRequire(combRequireArr[i]);
                }
                if (combRequire._subGather) {
                    combRequire._subGather();
                } else if (combRequire._action && !combRequire._nexts.length) {
                    //对没有后续requre的进行触发操作
                    combRequire._action();
                }
            });
            argEvent.bind('failure', function (e) {
                //失败运行error方法
                combRequire.error(e.tData);
                //运行require上的error方法
                var bError = baseResource.br.error;
                bError && bError(e.tData);
                //start-----------与defindedRequire耦合的代码-----------
                combRequire._err && combRequire._err(e.tData);
                //end-----------与defindedRequire耦合的代码-----------
            });
            argEvent.bind('loading', function (e) {
                //加载过程运行loading函数
                combRequire.loading(e.tData);
            });
        },
        /**
            修正第一个CombRequire实例上的数据，返回一个受保护的对象和内部对象的数组
            @param {Arguments} firstArguments第一个requre的第一个arguments
            @return {Array.<object|CombRequire>} 返回CombRequire实例数组（安全实例对象和实例对象）
        */
        combinateRequire: function (firstArguments) {
            var combRequire = new CombRequire();
            combRequire._args = transArgumtnts(firstArguments);
            //保护内部属性不被污染
            var rtObj = create(combRequire);
            //异步运行拼接函数
            setTimeout(function () {
                R.assemblyRequire(rtObj);
            }, 0);
            //返回安全对象和内部对象
            return [rtObj, combRequire];
        },
        /**
            主体的require函数
            @return {object} CombRequire实例为原型的对象
        */
        require: function () {
            var requireObj = R.combinateRequire(arguments)[0];
            return requireObj;
        },
        /**
            define函数内部用（arguments[0]）的require函数，包含了数据内部数据耦合关系的逻辑
            先判断baseResource.tempM上是否有定义的模块，没有的话走普通require流程
            发现有定义模块操作：
                获取lagGather属性{GatherFunction}，让多个require（非链上的require）预先载入后，在定义该模块；
                出错的话运行lagGather实例上的runError方法（模块连接出错）
            @return {object} CombRequire实例为原型的对象
        */
        defindedRequire: function () {
            if (baseResource.tempM) {
                //判断tempM是否有lagGather对象
                if (!baseResource.tempM.lagGather) {
                    baseResource.tempM.lagGather = new GatherFunction();
                }
                //获取lagGather对象生成子函数
                var lagGather = baseResource.tempM.lagGather,
                    subFunction = lagGather.create();
                var combinateRequireArr = R.combinateRequire(arguments);
                //获取安全对象和内部对象
                var requireObj = combinateRequireArr[0],
                    inReObj = combinateRequireArr[1];
                //处理内部对象final函数
                inReObj._action = function () {
                    //完结后运行lagGather的子函数
                    subFunction();
                };
                //内部加载出错执行函数
                inReObj._err = function () {
                    var updateErrorPaths = [];
                    for (var i = 0, len = inReObj._args.length; i < len; i++) {
                        updateErrorPaths.push(R.getByPath(inReObj._args[i]));
                    }
                    var outerErrData = {
                        //带入父模块名
                        parentModule: lagGather.parentModule,
                        errorPaths: inReObj._args,
                        descript: "Sub module load error",
                        paths: updateErrorPaths
                    };
                    console.log(outerErrData);
                    lagGather.runError();
                };
            } else {
                var requireObj = R.combinateRequire(arguments)[0];
            }
            return requireObj;
        },
        /**
            主体的define函数，模块定义方法
            获得的第一个参数为模块内容，若是function则运行获取返回的值为模块内容
            参数二为可选参数，自定义的模块名（被动）
            @param {all} moduleContent 模块定义内容，可以是任何内容（function例外），function则运行并获取返回的值为模块内容
            @param {string|Array.<string>} moduleName 模块名，可以是复数
        */
        define: function (moduleContent, moduleName) {
            //写入临时模块
            baseResource.tempM = {
                //模块的内容
                main: ""
                //names: []
            };
            //运行define函数会放入临时模块中
            switch (getType(moduleContent)) {
            case "function":
                //产生一个伪全局兼容对象（用于兼容使用window为全局的插件或组建）
                var fakeWindow = create(window);
                //若是函数则执行函数
                baseResource.tempM.main = moduleContent.call(fakeWindow, R.defindedRequire);
                break;
            default:
                //其他内容则填充为模块内容
                baseResource.tempM.main = moduleContent;
            };
            //判断是否有模块名，添加入模块
            baseResource.tempM.names = moduleName;
        }
    };
    //代表define是browserRequire
    R.define.br = true;

    //init
    //初始化的操作
    //require函数的方法
    //(function () {
    var requireInnerFunction = {
        //config设置加载基础信息
        config: function (options) {
            var defaults = {
                paths: {},
                baseUrl: ''
            };
            extend(defaults, options);
            baseResource.paths = defaults.paths;
            baseResource.baseUrl = defaults.baseUrl ? defaults.baseUrl.concat('/') : "";
        },
        //require的暴露方法（用于扩展、替换模块内容）
        extend: function (fun, plugName) {
            var C = {
                    Require: Require,
                    BindEvent: BindEvent,
                    GatherFunction: GatherFunction,
                    CombRequire: CombRequire
                },
                F = {
                    getType: getType,
                    transArgumtnts: transArgumtnts,
                    extend: extend,
                    getPath: getPath,
                    concatJS: concatJS,
                    create: create
                };

            if (!baseResource.br[plugName]) {
                baseResource.br[plugName] = true;
            }
            //抛出三个主要内容（中心数据库，公用Function，公用Class,主模块Require）
            fun(baseResource, F, C, R, Global);
        },
        //直接使用模块
        use: function (moduleName) {
            if (baseResource.map[moduleName] && baseResource.map[moduleName].type == 2) {
                return baseResource.map[moduleName].module;
            }
            var path = R.getByPath(moduleName);
            if (baseResource.map[path] && baseResource.map[path].type == 2) {
                return baseResource.map[path].module;
            }
        },
        //判断是否加载过模块或文件
        has: function (moduleName) {
            return !!baseResource.map[R.getByPath(moduleName)];
        },
        //删除加载模块
        destory: function (moduleName) {
            moduleName = R.getByPath(moduleName);
            baseResource.map[moduleName].script.remove();
            delete baseResource.map[moduleName];
        },
        //版本号，其他信息
        version: baseResource.version,
        //存放扩展用方法的工具对象
        br: baseResource.br
    };
    //融合到require
    extend(R.require, requireInnerFunction);
    extend(R.defindedRequire, requireInnerFunction);
    //获取并设置预置值
    var configData = Global.require;
    configData && (function () {
        requireInnerFunction.config(configData);
        var ready = configData.ready;
        setTimeout(function () {
            ready && (function () {
                ready();
            })()
        }, 0);
    })();
    //})();
    //暴露全局变量
    Global.require = R.require;
    Global.define = R.define;
})(this);