// ----------------------------------------- Hook代码开始 ----------------------------------------------------- 

(() => {

    if (!window) {
        return;
    }
    if (window.esASThookDone) {
        return;
    }
    window.esASThookDone = true;

    /**
     * 暴露给外面的接口，方法前缀起到命名空间的作用
     *
     * @param name 对象的属性名或者变量的名称
     *  @param value 对象的属性值或者变量的值
     * @param type 声明是什么类型的，对象属性值还是变量赋值，以后或者还会有其它的
     * @returns {string}
     */
    esASThook = window._hook = window.hook = window.esASThook = function (name, value, type) {
        try {
            _hook(name, value, type);
        } catch (e) {
            console.error(e);
        }
        // 不论严寒酷暑、不管刮风下雨，都不应该影响到正常逻辑，我要认识到自己的定位只是一个hook....
        return value;
    }

    esASThook.hookCallback = [];

    function _hook(name, value, type) {
        for (let callback of esASThook.hookCallback) {
            try {
                callback(name, value, type);
            } catch (e) {
                console.error(e);
            }
        }
    }




    (() => {

        const initDbMessage = "AST HOOK： 如果本窗口内有多个线程，每个线程栈的数据不会共享，初始化线程栈数据库： \n "
            + window.location.href;
        console.log(initDbMessage);

        // 用于存储Hook到的所有字符串类型的变量
        const stringsDB = window.esASThook.stringsDB = window.esASThook.stringsDB || {
            varValueDb: [],
            codeLocationExecuteTimesCount: []
        };
        const { varValueDb, codeLocationExecuteTimesCount } = stringsDB;

        // 从一个比较大的数开始计数，以方便在展示的时候与执行次数做区分，差值过大就不易混淆
        let execOrderCounter = 100000;

        function stringPutToDB(name, value, type) {

            if (!value) {
                return;
            }

            // TODO 更多类型搞进来
            let valueString = "";
            let valueTypeof = typeof value;
            if (valueTypeof === "string") {
                valueString = value;
            } else if (valueTypeof === "number") {
                valueString = value;
            }

            if (!valueString) {
                return;
            }

            // 获取代码位置
            const codeLocation = getCodeLocation();
            varValueDb.push({
                name,
                // TODO Buffer类结构直接运算Hook不到的问题仍然没有解决...
                // 默认情况下把所有变量都toString保存到字符串池子中
                // 有一些参数就是放在Buffer或者什么地方以字节形式存储，当使用到的时候直接与字符串相加toString，
                // 这种情况如果只监控变量赋值就监控不到了，这是不想添加更多监控点的情况下的折中方案...
                // 所以干脆在它还是个buffer的时候就转为字符串
                value: valueString,
                type,
                execOrder: execOrderCounter++,
                codeLocation
            });

            // 这个地方被执行的次数统计
            if (codeLocation in codeLocationExecuteTimesCount) {
                codeLocationExecuteTimesCount[codeLocation]++;
            } else {
                codeLocationExecuteTimesCount[codeLocation] = 1;
            }

        }

        function getCodeLocation() {
            const callstack = new Error().stack.split("\n");
            while (callstack.length > 0 && callstack[0].indexOf("esASThook") === -1) {
                callstack.shift();
            }
            if (callstack.length < 2) {
                return null;
            }
            callstack.shift();
            return callstack.shift();
        }

        // 添加Hook回调
        window.esASThook.hookCallback.push(stringPutToDB);

        
    })();

    (() => {
        // 检索字符串数据库
        const esASThook = window.esASThook;
        const stringsDB = esASThook.stringsDB;
        function hackValue(name, value, type){
            // 如果命中，则强制进行锁定赋值
            console.log();

        }
        // 添加Hook回调
        window.esASThook.hookCallback.push(hackValue);
    })();

    (() => {

        // 检索字符串数据库
        const esASThook = window.esASThook;
        const stringsDB = esASThook.stringsDB;

        // 为什么要采取消息机制呢？
        // 对于浏览器来说，要保证跨域之间的安全，比如使用iframe引入的新的域之中的数据，Chrome似乎是将不同的域隔离在不同的线程中
        // 当前页面中有多少个线程，可以从Chrome的开发中工具的 Sources --> Threads 查看，如果有多个会有这个选项，同时还可以鼠标单击在不同的线程之间切换
        // 但是在console中，输入的命令是运行在当前的线程栈中的，所以这就涉及到一个跨域通信的问题，所以就引入postMessage来在当前页面中有多个线程栈的时候，
        // 执行一条命令时会扩散到所有线程栈中执行，这样使用者就不必在意底层细节了

        // 发送消息时的域名，用于识别内部消息
        const messageDomain = "esASThook";
        const messageTypeSearch = "search";

        // 防止消息重复处理
        const alreadyProcessMessageIdSet = new Set();

        window.addEventListener("message", event => {
            const eventData = event.data;
            if (!eventData || eventData.domain !== messageDomain) {
                return;
            }

            // 如果已经处理过的话，则不再处理
            const messageId = eventData.messageId;
            if (alreadyProcessMessageIdSet.has(messageId)) {
                return;
            }

            if (eventData.type === messageTypeSearch) {
                const pattern = eventData.pattern;
                const isEquals = eventData.isEquals;
                const fieldName = eventData.fieldName;
                const isNeedExpansion = eventData.isNeedExpansion;
                _search(fieldName, pattern, isEquals, isNeedExpansion);
                alreadyProcessMessageIdSet.add(messageId);
                _searchParentAndChildren(messageId, fieldName, pattern, isEquals, isNeedExpansion);
            }

        });

        window.search = window.searchByValue = esASThook.search = esASThook.searchByValue = function (pattern, isEquals = true, isNeedExpansion = true) {
            const fieldName = "value";
            // 先搜索当前页面
            _search(fieldName, pattern, isEquals, isNeedExpansion);
            const messageId = new Date().getTime();
            alreadyProcessMessageIdSet.add(messageId);
            // 然后递归搜索父页面和子页面
            _searchParentAndChildren(messageId, fieldName, pattern, isEquals, isNeedExpansion);
        }

        window.find = function (order) {
            showResultByExecOrder(order);
        }

        window.searchByName = esASThook.searchByName = function (pattern, isEquals = false, isNeedExpansion = false) {
            const fieldName = "name";
            // 先搜索当前页面
            _search(fieldName, pattern, isEquals, isNeedExpansion);
            const messageId = new Date().getTime();
            alreadyProcessMessageIdSet.add(messageId);
            // 然后递归搜索父页面和子页面
            _searchParentAndChildren(messageId, fieldName, pattern, isEquals, isNeedExpansion);
        }

        function _searchParentAndChildren(messageId, fieldName, pattern, isEquals, isNeedExpansion) {
            const searchMessage = {
                "domain": messageDomain,
                "type": messageTypeSearch,
                "fieldName": fieldName,
                "messageId": messageId,
                pattern,
                isEquals,
                isNeedExpansion
            }

            // 子页面
            const iframeArray = document.getElementsByTagName("iframe");
            if (iframeArray.length) {
                for (let iframe of iframeArray) {
                    iframe.contentWindow.postMessage(searchMessage, "*");
                }
            }

            // 父页面
            if (window.parent) {
                window.parent.postMessage(searchMessage, "*");
            }
        }

        function _search(filedName, pattern, isEquals, isNeedExpansion) {
            const result = [];
            const expansionValues = isNeedExpansion ? expansionS(pattern) : [pattern];
            for (let s of stringsDB.varValueDb) {
                let isMatch = false;
                if (typeof pattern === "string") {
                    if (isEquals) {
                        for (let newPattern of expansionValues) {
                            isMatch = isMatch || (newPattern === s[filedName]);
                        }
                    } else {
                        for (let newPattern of expansionValues) {
                            isMatch = isMatch || (s[filedName] && s[filedName].indexOf(newPattern) !== -1);
                        }
                    }
                } else if (pattern instanceof RegExp) {
                    isMatch = pattern.test(s[filedName]);
                } else if (typeof pattern === "number") {
                    isMatch = pattern === s.value;
                }
                if (!isMatch) {
                    continue;
                }
                const codeInfo = parseCodeLocation(s.codeLocation)
                result.push({
                    name: s.name,
                    value: abbreviationPattern(pattern, s[filedName]),
                    type: s.type,
                    execOrder: s.execOrder,
                    codeName: codeInfo.codeName,
                    codeAddress: codeInfo.codeAddress,
                    execTimes: stringsDB.codeLocationExecuteTimesCount[s.codeLocation]
                });
            }
            showResult(result);
        }

        // 对搜索值进行一个扩大，以便能够搜索到更多结果
        function expansionS(s) {
            const result = [];

            // 原字符串是要放进去的
            result.push(s);

            if (typeof s !== "string") {
                return result;
            }

            // url编码后
            try {
                const t = encodeURIComponent(s);
                if (result.indexOf(t) === -1) {
                    result.push(t);
                }
            } catch (e) {
            }

            // url解码后
            try {
                const t = decodeURIComponent(s);
                if (result.indexOf(t) === -1) {
                    result.push(t);
                }
            } catch (e) {
            }

            try {
                const t = s.replace(/ /g, "+");
                if (result.indexOf(t) === -1) {
                    result.push(t);
                }
            } catch (e) {
            }

            return result;
        }

        let tempResultList = [];
        function showResult(result) {
            tempResultList.length = 0;
            tempResultList = result;
            let message = "\n在线程栈： \n" + window.location.href + "\n";
            if (!result.length) {
                message += "中没有搜索到结果。\n\n";
                console.log(message);
                console.log("\n\n\n");
                return;
            }

            message += `中搜到${result.length}条结果： \n\n`;
            console.log(message);
            console.table(result);
            // console.log(`变量名\t\t\t\t\t变量值\t\t\t\t\t变量类型\t\t\t\t\t所在函数\t\t\t\t\t执行次数\t\t\t\t\t执行顺序\t\t\t\t\t代码位置\n\n\n`);
            // for (let s of result) {
            //     if (s.value.length > 90) {
            //         console.log(`${s.name}\t\t\t\t\t${s.value}`);
            //         console.log(blank(s.name.length) + `\t\t\t\t\t${s.type}\t\t\t\t\t${s.codeName}`);
            //         console.log(blank(s.name.length) + `\t\t\t\t\t${s.execTimes}\t\t\t\t\t${s.execOrder}`);
            //     } else {
            //         console.log(`${s.name}\t\t\t\t\t${s.value}\t\t\t\t\t${s.type}\t\t\t\t\t${s.codeName}`);
            //         console.log(blank(s.name.length) + `\t\t\t\t\t${s.execTimes}\t\t\t\t\t${s.execOrder}`);
            //     }
            //     // 打印的时候代码地址尽量放到单独一行，以防文本太长被折叠Chrome就不会自动将其识别为链接了，这时候还得手动复制就麻烦了
            //     console.log(blank(s.name.length) + "\t\t\t\t\t" + s.codeAddress + "\n\n\n\n");
            // }
            // console.log("\n\n\n\n");
        }

        function showResultByExecOrder(execOrder) {
            if (tempResultList.length == 0) {
                console.warn("查询失败！请先确定已经检索到堆栈信息！");
            } else {
                let idx = -1;
                tempResultList.forEach((res, index) => {
                    if (res.execOrder == execOrder) {
                        idx = index;
                    }
                })
                if (idx > -1) {
                    console.group(`堆栈序号:${execOrder}`);
                    let result = tempResultList[idx];
                    for (let key in result) {
                        switch (key) {
                            case "name":
                                console.log(`变量名:${result[key]}`);
                                break;
                            case "value":
                                console.log(`变量值:${result[key]}`);
                                break;
                            case "type":
                                console.log(`变量类型:${result[key]}`);
                                break;
                            case "execTimes":
                                console.log(`执行次数:${result[key]}`);
                                break;
                            case "execOrder":
                                console.log(`执行顺序:${result[key]}`);
                                break;
                            case "codeName":
                                console.log(`所在函数:${result[key]}`);
                                break;
                            case "codeAddress":
                                console.log(`代码位置:${result[key]}`);
                                break;
                        }
                    }
                    console.groupEnd();
                } else {
                    console.warn("堆栈信息中查询不到你要查询的结果！请先确定查询序号是否有误！");
                }
            }
        }

        function abbreviationPattern(pattern, value) {
            if (typeof pattern !== "string" || pattern.length < 40) {
                return value;
            }
            const newPattern = pattern.slice(0, 15) + "......" + pattern.slice(pattern.length - 15, pattern.length);
            return value.replace(pattern, newPattern);
        }

        function blank(n) {
            let s = "";
            while (n-- > 0) {
                s += " ";
            }
            return s;
        }

        function parseCodeLocation(codeLocation) {
            const codeInfo = {};
            let matcher = codeLocation.match(/\((.+?)\)/);
            if (matcher != null && matcher.length > 1) {
                codeInfo.codeAddress = matcher[1];
            } else {
                codeInfo.codeAddress = codeLocation;
            }

            matcher = codeLocation.match(/at (.+?)\(/);
            if (matcher != null && matcher.length > 1) {
                codeInfo.codeName = matcher[1]
            }

            return codeInfo;
        }

    })();

    (() => {

        // 是否要在在控制台上打印eval hook日志提醒
        const enableEvalHookLog = true;

        // 用eval执行的代码也要能够注入，我擦开个接口吧...
        const evalHolder = window.eval;
        // todo
        // window.eval = function (jsCode) {

        //     if (enableEvalHookLog) {
        //         const isNeedNewLine = jsCode && jsCode.length > 100;
        //         console.log("AST HOOK工具检测到eval执行代码： " + (isNeedNewLine ? "\n" : "") + jsCode);
        //     }

        //     let newJsCode = jsCode;
        //     const xhr = new XMLHttpRequest();
        //     xhr.addEventListener("load", () => {
        //         newJsCode = decodeURIComponent(xhr.responseText);
        //     });
        //     // 必须同步执行，否则无法返回结果
        //     xhr.open("POST", "http://127.0.0.1:10010/hook-js-code", false);
        //     xhr.send(encodeURIComponent(jsCode));
        //     arguments[0] = newJsCode;
        //     return evalHolder.apply(this, arguments);
        // }

        window.eval.toString = function () {
            return "function eval() { [native code] }";
        }

    })();
})();