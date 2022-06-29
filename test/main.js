// function a(){
//     var cache                 = arguments[1] ? arguments[1] : false;

// }
// var cache = cc11001100_hook("cache", arguments[1] ? arguments[1] : false, "var-init");
/**
 * topthink广告平台js客户端
 * 版权所有 上海顶想信息科技有限公司
 * 作者：翟帅干 zhaishuaigan@qq.com
 * 作用: 根据页面think标签加载广告
 * 注意: 此文件必须在think标签之前加载, 否则无效
 */
 (function () {
    // 如果文件被加载过, 直接返回, 解决一个页面有多个广告位的js被加载多次问题
    if (window._thinkAd) {
        return;
    }
    window._thinkAd = true;

    // 让浏览器支持自定义标签think
    document.createElement('thinkad');
    document.createElement('think');
    // 配置项
    var thinkAdConfig = {
        // 接口地址
        'api'       : '//e.topthink.com/api/basic',
        // js路径
        'jsPath'    : '//e.topthink.com/Public/static/',
        // 默认接口
        'defaultApi': 'basic'
    };
    // 广告帮助类
    var thinkHelper   = window.thinkHelper = {};

    // 获取文档的head对象
    thinkHelper.head = document.getElementsByTagName('head')[0];

    // 空方法, 用于初始化和释放一些特定的函数, 如获取js成功后调用的函数
    thinkHelper.emptyFunc = function () {
        // 什么都不做
    };

    /**
     * 作用: 获取和加载js文件函数,
     * @param {string} scriptUrl 要加在的js地址
     * @param {bool} cache 是否缓存(默认不缓存false)
     * @returns {object}
     */
    thinkHelper.getScript = function (scriptUrl, cache) {
        var cache                 = arguments[1] ? arguments[1] : false;
        var success               = thinkHelper.emptyFunc;
        var error                 = thinkHelper.emptyFunc;
        var script                = document.createElement('script');
        script.onload             = function () {
            // 加载成功
            success();
            success = thinkHelper.emptyFunc;
        };
        script.onreadystatechange = function () {
            // ie9一下的加载成功判断
            if (this.readyState && this.readyState === 'loaded') {
                success();
                success = thinkHelper.emptyFunc;
            }
        };
        script.onerror            = function () {
            // 加载失败
            error();
            error = thinkHelper.emptyFunc;
        };
        script.type               = 'text/javascript';
        if (!cache) {
            // 如果不缓存就在url后添加随机数
            scriptUrl = thinkHelper.addQueryParams(scriptUrl, {
                '_t': Math.random()
            });
        }
        script.src = scriptUrl;
        thinkHelper.head.appendChild(script);
        var result = {
            success: function (func) {
                success = func;
                return result;
            },
            error  : function (func) {
                error = func;
                return result;
            }
        };
        return result;
    };

    /**
     * 作用: 加载css文件助手函数
     * @param {string} cssUrl css文件路径
     * @param {bool} cache 是否缓存(默认false, 不缓存)
     * @returns {undefined}
     */
    thinkHelper.getStyle = function (cssUrl, cache) {
        var cache = arguments[1] ? arguments[1] : false;
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        if (!cache) {
            cssUrl = thinkHelper.addQueryParams(cssUrl, {
                '_t': Math.random()
            });
        }
        link.href = cssUrl;
        thinkHelper.head.appendChild(link);
    };
    /**
     * 作用: 给文档追加css代码
     * @param {string} cssString css代码
     * @returns {undefined}
     */
    thinkHelper.addCssString = function (cssString) {
        var style = document.createElement("style");
        style.setAttribute("type", "text/css");
        if (style.styleSheet) {
            style.styleSheet.cssText = cssString;
        } else {
            var cssText = document.createTextNode(cssString);
            style.appendChild(cssText);
        }

        var heads = document.getElementsByTagName("head");
        if (heads.length) {
            heads[0].appendChild(style);
        } else {
            document.documentElement.appendChild(style);
        }
    };

    /**
     * 作用: 扩展url的参数
     * @param {string} url 需要扩展参数的地址
     * @param {json} obj 要添加到url中的参数
     * @returns {String} 添加参数后的url字符串
     */
    thinkHelper.addQueryParams = function (url, obj) {
        var joinChar  = (url.indexOf('?') === -1) ? '?' : '&';
        var arrParams = [];
        for (var key in obj) {
            arrParams.push(key + '=' + encodeURIComponent(obj[key]));
        }
        return url + joinChar + arrParams.join('&');
    };

    /**
     * 作用: 发送jsonp请求
     * @param {string} url 请求地址
     * @param {function} success 成功返回执行的处理函数
     * @param {function} error 失败执行的处理函数
     * @returns {undefined}
     */
    thinkHelper.jsonp = function (url, success, error) {
        var error        = error ? error : thinkHelper.emptyFunc;
        var callback     = 'callback_' + Math.random().toString().replace('.', '_');
        window[callback] = success;
        url              = thinkHelper.addQueryParams(url, {
            callback: callback
        });
        thinkHelper.getScript(url).error(error);
    };

    /**
     * 作用: 根据dom获取对应广告位代码
     * @param {documentElement} thinkAdDom dom对象
     * @returns {undefined}
     */
    thinkHelper.setAd = function (thinkAdDom) {
        var api = thinkAdConfig.api + '/' + thinkAdDom.id;
        thinkHelper.jsonp(api, function (data) {
            if (typeof data !== 'object' || !data.on) {
                thinkAdDom.parentNode.removeChild(thinkAdDom);
                return;
            }
            thinkAdDom.style.display = 'block';
            // 设置宽度
            if (data.width) {
                thinkAdDom.style.width = data.width + 'px';
            }
            // 设置宽度
            if (data.height) {
                thinkAdDom.style.height = data.height + 'px';
            }
            thinkAdDom.style.overflow = 'hidden';

            // 广告位css文件和css代码和载入
            if (data.css_file) {
                var cssFiles = data.css_file.split('|');
                for (var i in cssFiles) {
                    thinkHelper.getStyle(cssFiles[i]);
                }
            }
            // css code
            if (data.css_code) {
                thinkHelper.addCssString(data.css_code);
            }

            // 如果包含replace="true"就替换掉think标签, 负责在标签内填充模板
            if (thinkAdDom.getAttribute('replace') == 'true') {
                var tempDom       = document.createElement("div");
                tempDom.innerHTML = data.html;
                if (tempDom.childNodes.length) {
                    for (var i = 0; i < tempDom.childNodes.length; i++) {
                        thinkAdDom.parentNode.insertBefore(tempDom.childNodes[i], thinkAdDom);
                    }
                }
                thinkAdDom.parentNode.removeChild(thinkAdDom);
            } else {
                thinkAdDom.innerHTML = data.html;
            }

            // 广告位js文件载入
            var isJsFileOk = false;
            if (data.js_file) {
                var jsFiles     = data.js_file.split('|');
                var jsFileCount = 0;
                for (var i in jsFiles) {
                    thinkHelper.getScript(jsFiles[i], true).success(function () {
                        jsFileCount++;
                        if (jsFileCount >= jsFiles.length) {
                            isJsFileOk = true;
                        }
                    });
                }
            } else {
                isJsFileOk = true;
            }
            var n = setInterval(function () {
                if (isJsFileOk) {
                    clearInterval(n);
                    eval('(function(){try{' + data.js_code + '}catch(e){}})();');
                }
            }, 100);
        });
    };

    var st    = null;
    var num   = 0;
    var parse = {};
    // 延时处理广告标签, 解决js找不到dom的问题
    var _loop = function () {
        if (num < 50) {

            (function () {
                // 很老很老的版本
                var thinkAds = document.getElementsByTagName('thinkad');
                for (var i = 0; i < thinkAds.length; i++) {
                    if (!parse[thinkAds[i].id]) {
                        parse[thinkAds[i].id] = 1;
                        thinkAds[i].setAttribute('parse', 1);
                        thinkHelper.setAd(thinkAds[i]);
                    }
                }
            })();

            (function () {
                // 新版本
                var thinkAds = document.getElementsByTagName('think');
                for (var i = 0; i < thinkAds.length; i++) {
                    if (!parse[thinkAds[i].id]) {
                        parse[thinkAds[i].id] = 1;
                        thinkAds[i].setAttribute('parse', 1);
                        thinkHelper.setAd(thinkAds[i]);
                    }
                }
            })();

            num++;
        } else {
            parse = null;
            clearInterval(st);
        }
    };

    st = setInterval(_loop, 200);
})();
