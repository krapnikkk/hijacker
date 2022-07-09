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
        let newValue = null;
        try {
            newValue = _hook(name, value, type);
        } catch (e) {
            console.error(e);
        }
        return newValue || value;
    }

    esASThook.hookCallback = [];

    function _hook(name, value, type) {
        let newValue = null;
        for (let callback of esASThook.hookCallback) {
            try {
                hijackValue = callback(name, value, type);
                if (hijackValue){
                    newValue = hijackValue;
                }
            } catch (e) {
                console.error(e);
            }
        }
        return newValue;
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

        window.getCodeLocation = getCodeLocation = function () {
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
        window.hijackMap = hijackMap = {};
        function hijackValue(name, value, type) {
            if (window.hijackMap && Object.keys(window.hijackMap).length !== 0) {
                const codeLocation = getCodeLocation();
                // 如果命中，则强制进行锁定赋值
                let uuid = `${codeLocation}${name}${type}`;
                let newValue = hijackMap[uuid];
                if (newValue) {
                    return newValue;
                }
            }

        }

        window.hijack = function (execOrder, newValue) {
            let varValueDb = esASThook.stringsDB.varValueDb[execOrder - 100000];
            if (!varValueDb) {
                console.warn(`查找失败！数据库中找不到调用堆栈序号${execOrder}`);
                return;
            }
            let { codeLocation, name, type } = varValueDb
            let uuid = `${codeLocation}${name}${type}`;
            hijackMap[uuid] = newValue;
        }

        window.cancelHijack = function (execOrder){
            if (window.hijackMap && Object.keys(window.hijackMap).length !== 0){
                delete window.hijackMap[execOrder];
            }
        }

        window.clearHijack = function(){
            for (let key in window.hijackMap){
                delete window.hijackMap[key];
            }
            window.hijackMap = {};
        }

        // 添加Hook回调
        window.esASThook.hookCallback.push(hijackValue);
    })();

    (() => {

        // 检索字符串数据库
        const esASThook = window.esASThook;
        const stringsDB = esASThook.stringsDB;

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

        window.view = function (order) {
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

        window.parseCodeLocation = parseCodeLocation = function (codeLocation) {
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

    // todo eval
})();