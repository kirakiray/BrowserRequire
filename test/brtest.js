(function(Global) {
    //init one
    var brTestAll = document.createElement('div');
    brTestAll.setAttribute('class', 'br_test_all');
    var brTestTitle = document.createElement('div');
    brTestTitle.setAttribute('class', "br_test_title");
    var brTestContainer = document.createElement('div');
    brTestContainer.setAttribute('class', "br_test_container");
    brTestAll.appendChild(brTestTitle);
    brTestAll.appendChild(brTestContainer);

    //fix
    //是否ie7或更糟糕的版本
    var isIE7 = !document.querySelector;
    //Object.create
    if (!Object.create) {
        Object.create = function(obj) {
            var create = function() {};
            create.prototype = obj;
            return new create();
        };
    }
    //获取class节点
    if (!document.querySelector) {
        var getElementByClassName = function(parentNode, className) {
            var tag = parentNode.getElementsByTagName("*");
            for (var i = 0; i < tag.length; i++) {
                if (tag[i].className.indexOf(className) != -1) {
                    return tag[i];
                }
            }
        };
    } else {
        var getElementByClassName = function(parentNode, className) {
            return parentNode.querySelector('.' + className);
        };
    }
    //注册事件
    if (document.addEventListener) {
        var addEventListener = function(parentNode, eventName, callback) {
            parentNode.addEventListener(eventName, callback);
        };
    } else {
        var addEventListener = function(parentNode, eventName, callback) {
            parentNode.attachEvent("on" + eventName, callback);
        };
    }
    //each
    if ([].forEach) {
        var each = function(arr, fun) {
            arr.forEach(fun);
        }
    } else {
        var each = function(arr, fun) {
            for (var i = 0, len = arr.length; i < len; i++) {
                var notBreak = fun(arr[i], i);
                if (notBreak == false) {
                    break;
                }
            };
        };
    }
    //添加class
    if (document.createElement('div').classList) {
        var addClass = function(node, className) {
            node.classList.add(className);
        };
    } else {
        var addClass = function(node, className) {
            var oldClassName = node.className;
            node.className = oldClassName + className;
            //node.setAttribute('class', oldClassName + " ." + className);
        };
    };

    //public function
    //获取类型
    var getType = function(value) {
        return Object.prototype.toString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
    };
    //extend
    var extend = function() {
        var args = Array.prototype.slice.call(arguments);
        var o = args.splice(0, 1)[0];
        for (var a = 0, len = args.length; a < len; a++) {
            for (var i in args[a]) {
                o[i] = args[a][i];
            }
        };
        return o;
    };
    //获取使用函数的信息
    var getCallLine = function(num) {
        var reObj = "";
        try {
            //伪函数 
            jiade();
        } catch (e) {
            var track = e.stack;
            if (track) {
                var strArr = track.toString().split('\n');
                if (typeof num != "number") {
                    reObj = [];
                    each(strArr, function(e, i) {
                        var content = e.match(/\w+?:\/\/\/.+\d/);
                        content && reObj.push({
                            con: content[0]
                        });
                    });
                } else {
                    reObj = {};
                    var content = strArr[num].match(/\w+?:\/\/\/.+\d/);
                    content && (reObj = {
                        con: content[0]
                    });
                }
            } else {
                return {
                    con: "unknow"
                }
            }
        }
        return reObj;
    };

    //public class
    //more按钮元素
    var MoreClick = function() {
        var moreClick = this.element = document.createElement('span');
        //展开按钮
        moreClick.setAttribute('class', "more_clicker");
        //添加文本
        moreClick.innerHTML = "more▲";
        //当前状态
        this.status = 0;
        var _this = this;
        //添加响应
        //moreClick.addEventListener("click", function() {
        addEventListener(moreClick, "click", function() {
            if (_this.status) {
                _this.close();
                _this.status = 0;
                moreClick.innerHTML = "more▲";
                moreClick.setAttribute('class', "more_clicker");
            } else {
                _this.open();
                _this.status = 1;
                moreClick.setAttribute('class', "more_clicker_shou");
                moreClick.innerHTML = "more▼";
            }
        });
    };
    //响应
    MoreClick.prototype.close = function() {};
    MoreClick.prototype.open = function() {};

    //line元素的展开元素的块
    var InnerContentBlock = function() {
        this.element = document.createElement('div');
        this.element.setAttribute('class', '_gline_incontent_block');
    };
    InnerContentBlock.fn = InnerContentBlock.prototype;
    //清除所有内容
    InnerContentBlock.fn.clear = function() {
        this.element.innerHTML = "";
    };
    //添加行
    InnerContentBlock.fn.addInLine = function(data) {
        //        var data = {
        //            key: "kaka",
        //            value: "sasa",
        //            //type: "error click",
        //            //click: function () {}
        //        };
        //制造行元素
        var lineEle = document.createElement('div');

        //获取相应class
        var lineClass = "_gline_incontent_line "
        switch (data.type) {
            case "error":
                lineClass += "_incontent_line_err ";
                break;
            case "safe":
                lineClass += "_incontent_line_safe ";
                break;
            case "warn":
                lineClass += "_incontent_line_warn ";
                break;
            case "click":
                lineClass += "_canclick ";
                break;
        };

        lineEle.setAttribute('class', lineClass);

        //添加内内容
        var innerText = ('<span class="_gline_incontent_key">' + data.key + '</span><span class="_gline_incontent_value">' + data.value + '</span>');
        lineEle.innerHTML = innerText;

        //是否callback
        if (data.click) {
            //lineEle.querySelector('._gline_incontent_value').addEventListener('click', data.click);
            addEventListener(getElementByClassName(lineEle, '_gline_incontent_value'), 'click', data.click);
        }

        //添加元素
        this.element.appendChild(lineEle);
    };

    //line元素的展开元素
    var InnerContent = function() {
        this.element = document.createElement('div');
        //默认收起
        this.element.setAttribute('class', '_gline_incontent _shou');
    };
    InnerContent.fn = InnerContent.prototype;
    //填写block
    InnerContent.fn.addBlock = function(datas) {
        //        var datas = [{
        //            key: "kaka",
        //            value: "sasa"
        //        }];
        var innerBlock = new InnerContentBlock();

        //遍历
        each(datas, function(e) {
            innerBlock.addInLine(e);
        });

        this.element.appendChild(innerBlock.element);

        return innerBlock;
    };
    //展开
    InnerContent.fn.open = function() {
        this.element.setAttribute('class', "_gline_incontent");
    };
    //收起
    InnerContent.fn.shou = function() {
        this.element.setAttribute('class', "_gline_incontent _shou");
    };

    //equal封装信息展示类
    //继承InnerContent
    var EqualInner = function() {
        InnerContent.apply(this, arguments);
        var moreClick = this.moreClick = new MoreClick();
        var _this = this;
        //绑定事件
        moreClick.open = function() {
            _this.open();
        };
        moreClick.close = function() {
            _this.shou();
        };
        //对比值id
        this.compId = 0;
    };
    EqualInner.fn = EqualInner.prototype = Object.create(InnerContent.fn);
    //设置状态
    EqualInner.fn.setStatus = function(data) {
        //添加点击输出快捷定位
        this.statusBlock = this.addBlock([{
            //stauts
            key: "status",
            value: data.status,
            type: data.type || data.status
        }, {
            key: "location",
            value: data.location,
            type: "click",
            click: function() {
                brtest.out(data.location);
            }
        }]);
    };
    //设置对比 key value
    EqualInner.fn.addComp = function(data, isOne) {
        if (!isOne) {
            this.addBlock([{
                key: "key",
                value: data.key || (this.compId++)
            }, {
                key: "value",
                value: data.value,
                type: data.type
            }]);
        } else {
            this.addBlock([{
                key: "value",
                value: data.value,
                type: data.type
            }]);
        }
    };
    //添加内容
    EqualInner.fn.appendTo = function(ele) {
        ele.appendChild(this.moreClick.element);
        ele.appendChild(this.element);
    };

    //equal封装次序展示类
    //继承InnerContent
    var OrderInner = function() {
        InnerContent.apply(this, arguments);
        //点击更多按钮
        var moreClick = this.moreClick = new MoreClick();
        var _this = this;
        //绑定事件
        moreClick.open = function() {
            _this.open();
        };
        moreClick.close = function() {
            _this.shou();
        };

        //记录序列（从1开始）
        this._NO = 1;
    };
    OrderInner.fn = OrderInner.prototype = Object.create(InnerContent.prototype);
    //设置状态栏
    OrderInner.fn.setStatus = function(data) {
        if (this.statusBlock) {
            this.statusBlock.clear();
            this.statusBlock.addInLine({
                //stauts
                key: "count",
                value: data.count,
            });
            this.statusBlock.addInLine({
                //stauts
                key: "status",
                value: data.status,
                type: data.type || data.status
            });
            this.statusBlock.addInLine({
                key: "location",
                value: data.location,
                type: "click",
                click: function() {
                    brtest.out(data.location);
                }
            });
        } else {
            //添加点击输出快捷定位
            this.statusBlock = this.addBlock([{
                //stauts
                key: "count",
                value: data.count,
            }, {
                //stauts
                key: "status",
                value: data.status,
                type: data.type || data.status
            }, {
                key: "location",
                value: data.location,
                type: "click",
                click: function() {
                    brtest.out(data.location);
                }
            }]);
        }
    };
    //添加单块信息
    OrderInner.fn.addComp = function(data) {
        var dataArr = [{
            key: "NO.",
            value: this._NO++
        }, {
            key: "record",
            value: data.status,
            type: data.type || data.status
        }];
        if (data.descript) {
            dataArr.push({
                key: "descript",
                value: '<span style="text-decoration: underline;">' + data.descript + '</span>',
                click: function() {
                    brtest.out(data.descript);
                }
            });
        }
        dataArr.push({
            key: "location",
            value: data.location,
            type: "click",
            click: function() {
                brtest.out(data.location);
            }
        });
        this.addBlock(dataArr);
    };
    //添加内容
    OrderInner.fn.appendTo = function(ele) {
        ele.appendChild(this.moreClick.element);
        ele.appendChild(this.element);
    };


    //line元素
    var BrTestGroupLine = function(text) {
        var ele = this.element = document.createElement('div');
        ele.setAttribute('class', "br_test_g_line");
        ele.innerHTML = '<span class="br_test_g_line_text">' + text + '</span>';

    };
    //修改className
    BrTestGroupLine.prototype.changeClass = function(className) {
        className = className || "";
        this.element.setAttribute('class', "br_test_g_line " + className);
    };

    //group元素
    var BrTestGroup = function(title) {
        var ele = this.element = document.createElement('div');
        ele.setAttribute('class', 'br_test_group');
        ele.innerHTML = '<div class="br_test_g_title"><div class="br_test_g_title_content">' + (title || "Test") + '</div><div class="br_test_g_title_tips"><div class="total_content">0</div><div class="safe_content">0</div><div class="warn_content">0</div><div class="error_content">0</div></div></div><div class="br_test_g_content"></div>';
        this.totalCount = 0;
        this.safeCount = 0;
        this.warnCount = 0;
        this.errorCount = 0;
        this.waitCount = 0;
        this.unknow = 0;
        //this.totalCountElement = ele.querySelector('.total_content');
        this.totalCountElement = getElementByClassName(ele, 'total_content');
        //this.safeCountElement = ele.querySelector('.safe_content');
        this.safeCountElement = getElementByClassName(ele, 'safe_content');
        //this.warnCountElement = ele.querySelector('.warn_content');
        this.warnCountElement = getElementByClassName(ele, 'warn_content');
        //this.errorCountElement = ele.querySelector('.error_content');
        this.errorCountElement = getElementByClassName(ele, 'error_content');
        //this.lineContainer = ele.querySelector('.br_test_g_content');
        this.lineContainer = getElementByClassName(ele, 'br_test_g_content');
    };
    BrTestGroup.fn = BrTestGroup.prototype;
    //更新counts
    BrTestGroup.fn.reCount = function() {
        this.totalCountElement.innerHTML = this.totalCount;
        this.safeCountElement.innerHTML = this.safeCount;
        this.warnCountElement.innerHTML = this.warnCount;
        this.errorCountElement.innerHTML = this.errorCount;
    };
    //添加line
    BrTestGroup.fn.addLine = function(text) {
        var gLine = new BrTestGroupLine(text);

        //添加行
        this.lineContainer.appendChild(gLine.element);

        return gLine;
    };

    //createTest Callback arguments
    var BrTestEqual = function(testGroup) {
        this.testGroup = testGroup;
    };
    BrTestEqual.fn = BrTestEqual.prototype;
    /*
        获取状态
        0 : error
        1 : warn
        2 : safe
        3 : wait
    */
    var getJudgement = function(varname, value) {
        var judgement = 0;

        if (typeof varname == "object" && JSON.stringify(varname) == JSON.stringify(value)) {
            //warn
            judgement = 1;
        }
        if (varname === value) {
            //safe
            judgement = 2;
        }
        return judgement;
    };
    //对比两个字符串的差别并返回html
    var compareString = function(varnameStr, valueStr) {
        var varnameStrLen = varnameStr.length,
            valueStrLen = valueStr.length;

        var tempStr = "",
            errStr = "",
            varafterStr = "";

        for (var i = 0; i < varnameStrLen; i++) {
            tempStr += varnameStr[i];
            if (valueStr.search(tempStr) == 0) {
                //每次获取正确对应字符就存储起来
                continue;
            } else {
                //不对应文字则删除刚刚添加的那个字符
                tempStr = tempStr.slice(0, -1);

                //获取后面错误的字符串
                errStr = valueStr.slice(i);

                //获取元对象后面字符串
                varafterStr = varnameStr.slice(i);
                break;
            }
        }
        return ['<span style="color:bisque;">' + tempStr + '</span>' + varafterStr, '<span style="color:#bdae89;">' + tempStr + '</span>' + errStr];
    };

    //对比两个值
    var getCompareContent = function(varname, value, isMore) {
        var reObj = {
            varname: "",
            vals: []
        };
        var varnameType = getType(varname);
        switch (varnameType) {
            case "string":
                var compareArr = compareString(varname, value);
                reObj.varname = compareArr[0];
                reObj.vals.push(compareArr[1]);
                break;
            case "array":
            case "object":
                if (isMore) {
                    each(value, function(e, i) {
                        var compareArr = compareString(JSON.stringify(varname), JSON.stringify(e));
                        reObj.varname = compareArr[0];
                        reObj.vals.push(compareArr[1]);
                    });
                    break;
                }
                var compareArr = compareString(JSON.stringify(varname), JSON.stringify(value));
                reObj.varname = compareArr[0];
                reObj.vals.push(compareArr[1]);
                break;
            case "number":
            default:
                reObj.varname = varname;
                reObj.vals.push(value);
                break;
        }
        return reObj;
    };
    var setGroupLine = function(options) {
        //展开内容
        var groupLineEvent = options.groupLineEvent,
            descript = options.descript,
            judgement = options.judgement,
            varname = options.varname,
            value = options.value,
            isMore = options.isMore;


        var testGroup = groupLineEvent.testGroup;
        var gLine = testGroup.addLine(descript);

        switch (judgement) {
            case 0:
                testGroup.errorCount++;
                gLine.changeClass('br_test_error');

                //展开框
                var eqInner = new EqualInner();
                eqInner.setStatus({
                    status: "error",
                    location: getCallLine(4).con
                });

                var compareObj = getCompareContent(varname, value, isMore);

                //添加对比
                eqInner.addComp({
                    value: compareObj.varname
                });
                each(compareObj.vals, function(e, i) {
                    eqInner.addComp({
                        type: "error",
                        value: e
                    });
                });

                //添加展开框
                if (isIE7) {
                    break;
                }
                eqInner.appendTo(gLine.element);
                break;
            case 1:
                testGroup.warnCount++;
                gLine.changeClass('br_test_warn');

                //展开框
                var eqInner = new EqualInner();
                eqInner.setStatus({
                    status: "warn",
                    location: getCallLine(4).con
                });
                //添加对象
                eqInner.addComp({
                    value: JSON.stringify(varname)
                }, true);
                //添加展开框
                if (isIE7) {
                    break;
                }
                eqInner.appendTo(gLine.element);
                break;
            case 2:
                testGroup.safeCount++;
                gLine.changeClass('br_test_safe');
                var eqInner = new EqualInner();
                eqInner.setStatus({
                    status: "succeed",
                    type: "safe",
                    location: getCallLine(4).con
                });
                //展开框
                if (isIE7) {
                    break;
                }
                eqInner.appendTo(gLine.element);
                break;
            case 3:
                testGroup.unknow++;
                gLine.changeClass('br_test_wait');
                break;
        }
        testGroup.totalCount++;
        testGroup.reCount();
    };
    //判断两值是否相等
    BrTestEqual.fn.equal = function(descript, varname, value) {
        var caller = arguments.callee.caller;
        var judgement = getJudgement(varname, value);
        setGroupLine({
            groupLineEvent: this,
            descript: descript,
            judgement: judgement,
            varname: varname,
            value: value
        });
    };
    //判断多个值是否相等
    BrTestEqual.fn.more = function(descript, varname, values) {
        var judgement = 0;
        each(values, function(e, i) {
            var jud = getJudgement(varname, e);
            if (jud > judgement) {
                judgement = jud;
            }
        });
        setGroupLine({
            groupLineEvent: this,
            descript: descript,
            judgement: judgement,
            varname: varname,
            value: values,
            isMore: true
        });
    };

    //记录order用的对象
    OrderMap = {};
    //orderTest Callback arguments
    var BrTestOrder = function(testGroup, orderObj, options) {
        //视图容器
        this.testGroup = testGroup;

        //挂载对象
        this.orderObj = orderObj;

        //生成次序id的记录
        this.id = 0;

        //进行中的次序
        //this.runid = 0;

        //次序数组
        this.queue = [];

        //里数组
        //是次序数组的子元素
        //this._inqueue = [];

        //额外判断选项
        if (options) {
            this.unChange = true;
            this.id = options.id;
            this.queue = options.queue;
            this._inqueue = options.inqueue;
        }
    };
    BrTestOrder.fn = BrTestOrder.prototype;
    BrTestOrder.fn.count = function(eventName, min, max) {
        var _this = this;

        //已存在则抛出错误
        var orderObj = this.orderObj;
        if (orderObj[eventName]) {
            throw 'orderObj:the \"' + eventName + '\" is existent';
        }

        //添加计数
        var rtestGroup = this.testGroup;
        rtestGroup.totalCount++;
        rtestGroup.waitCount++;
        rtestGroup.reCount();

        //记录顺序
        if (this._inqueue) {
            var inqueue = this._inqueue;
        } else {
            var inqueue = {};
            this.queue.push(inqueue);
        }
        inqueue[eventName] = {
            status: "wait"
        };
        //inqueue.push(eventName);

        //生成视图
        var gLine = this.testGroup.addLine(eventName);
        gLine.changeClass('br_test_wait');

        if (max == true) {
            max = Infinity;
        } else if (!max) {
            max = min;
        }

        //内部容器
        var orderInner = new OrderInner();
        var callline = getCallLine().slice(-3)[0].con;
        orderInner.setStatus({
            count: 0,
            status: "wait",
            location: callline
        });
        orderInner.appendTo(gLine.element);

        //当前设置的次序id
        var orderID = this.id;

        //记录触发order次数
        var orderCount = 0;

        //设置最小最大值
        orderObj[eventName] = {
            eventName: eventName,
            orderID: orderID,
            //之前状态(wait是最开始状态)
            _status: 'wait',
            //call
            //@param {all} orderTestScript 节点记录的标记文本或对象
            //@param {boolean} 是否不添加记录 
            callOrder: function(orderTestScript, _notAddComp) {
                if (!_notAddComp) {
                    //递增触发次数
                    orderCount++;
                }

                //设置触发状态
                var compStatus = "",
                    //顺序是否正确
                    shunxu = '',
                    //数目是否争取（因为order字段都被占用了唯有用拼音注释）
                    shumu = '';

                //判断数目是否正确
                if (orderCount >= min && orderCount <= max) {
                    //安全数目
                    shumu = 'safe';
                } else if (orderCount < min) {
                    //未达标数目
                    shumu = 'warn';
                } else {
                    //错误数目
                    shumu = 'error';
                }

                if (shumu != 'error') {
                    //判断顺序是否正确
                    if (orderObj._runid == orderID) {
                        shunxu = true;
                    } else {
                        //不正确且运行id小于当前id，则+1适配
                        if (orderObj._runid < orderID) {
                            //先记录递增前的id 
                            orderObj._runid++;
                            //if (orderObj._runid == orderID) {
                                shunxu = true;
                            //} else {
                                //适配+1还是不行，就是错的，并且跳到这个id，并且重置前面id错误的line
                                //shunxu = false;
                                orderObj._runid = orderID;
                            //}
                            for (var i in orderObj) {
                                if (i == "_runid") {
                                    //跳过runid字段
                                    continue;
                                }

                                var targetOderObj = orderObj[i];
                                //orderObj[i].callOrder();
                                if (targetOderObj.orderID < orderID && (targetOderObj._status == "warn" || targetOderObj._status == "wait")) {
                                    //console.log(targetOderObj);
                                    targetOderObj.callOrder(null, true);
                                }
                            }
                        } else {
                            //当前id小于运行id，则顺序错误 
                            shunxu = false;
                        }
                    }
                }

                //修正line值
                var lineClass = "";
                if (shumu == "safe" && shunxu) {
                    lineClass = "br_test_safe";
                    compStatus = "safe";
                } else if (shumu == "warn" && shunxu) {
                    lineClass = "br_test_warn";
                    compStatus = "warn";
                } else {
                    lineClass = "br_test_error";
                    compStatus = "error";
                }
                gLine.changeClass(lineClass);

                //修正数字
                switch (compStatus) {
                    case "safe":
                        //判断之前状态
                        if (this._status == "warn") {
                            rtestGroup.warnCount--;
                            rtestGroup.safeCount++;
                        } else if (this._status == "wait") {
                            rtestGroup.waitCount--;
                            rtestGroup.safeCount++;
                        }
                        break;
                    case "warn":
                        if (this._status == "wait") {
                            rtestGroup.waitCount--;
                            rtestGroup.warnCount++;
                        }
                        break;
                    case "error":
                        if (this._status == "wait") {
                            rtestGroup.waitCount--;
                            rtestGroup.errorCount++;
                        } else if (this._status == "warn") {
                            rtestGroup.warnCount--;
                            rtestGroup.errorCount++;
                        } else if (this._status == "safe") {
                            rtestGroup.safeCount--;
                            rtestGroup.errorCount++;
                        }
                        break;
                }


                //设置状态
                this._status = compStatus;

                //添加展开容器的值
                if (!_notAddComp) {
                    orderInner.addComp({
                        status: compStatus,
                        descript: orderTestScript,
                        location: getCallLine(4).con
                    });
                }
                //修正展开容器的值
                orderInner.setStatus({
                    count: orderCount,
                    type: compStatus,
                    status: compStatus == 'safe' ? "succeed" : compStatus,
                    location: callline
                });
                //刷新父容器值
                rtestGroup.reCount();
            }
        };

        //非初始传入对象
        if (this.unChange) {
            this.id++;
            return this;
        } else {
            var subBrTest = new BrTestOrder(this.testGroup, this.orderObj, {
                id: this.id,
                queue: this.queue,
                inqueue: inqueue
            });
            this.id++;
            return subBrTest;
        }
    };
    BrTestOrder.fn.set = function(eventName) {
        return this.count(eventName, 1, true);
    };
    BrTestOrder.fn.one = function(eventName) {
        return this.count(eventName, 1);
    };
    BrTestOrder.fn.order = function(orderid, descript) {
        var idObj = this.orderObj[orderid];
        idObj.callOrder(descript);
    };

    //main
    var brtest = {
        //配置数据
        config: function(options) {
            var defautls = {
                title: "brTest"
            };
            extend(defautls, options);
            //设置标题
            brTestTitle.innerHTML = defautls.title;
        },
        //生成测试用例
        //param {string} title 测试组标题
        //param {fucntion} callback 测试组callback
        test: function(title, callback) {
            //生成视图实例
            var testGroup = new BrTestGroup(title);

            //添加实例元素（渲染节点）
            brTestContainer.appendChild(testGroup.element);

            //执行回调
            callback(new BrTestEqual(testGroup));
        },
        //生成次序测试用例
        orderTest: function(orderName, callback) {
            //已存在则不建立
            if (OrderMap[orderName]) {
                throw "OrderTest:\'" + orderName + "\' is existent";
            }

            //先建立orderMap的key
            var orderObj = OrderMap[orderName] = {};

            //生成视图实例
            var testGroup = new BrTestGroup("<span style='color:#91d3f4;font-size:12px;'> OrderTest: </span>" + orderName);

            //修正视图类型
            //testGroup.element.querySelector('.br_test_g_title').classList.add('ordertest');
            addClass(getElementByClassName(testGroup.element, 'br_test_g_title'), 'ordertest');

            //添加实例元素（渲染节点）
            brTestContainer.appendChild(testGroup.element);

            //设置进行中id
            orderObj._runid = 0;

            //执行回调
            var brtestorder = new BrTestOrder(testGroup, orderObj);
            callback(brtestorder);
        },
        //触发次序事件测试
        order: function(orderName, orderid, descript) {
            //先获取注册对象
            var orderObj = OrderMap[orderName];

            //获取id对象
            var idObj = orderObj[orderid];

            idObj.callOrder(descript);
        },
        //输出call
        out: function(e) {
            console.log(e);
        }
    };

    //init two
    Global.brtest = brtest;
    brtest.config();
    if (!document.body) {
        setTimeout(function() {
            document.body.appendChild(brTestAll);
        }, 0);
    } else {
        document.body.appendChild(brTestAll);
    }
})(window);