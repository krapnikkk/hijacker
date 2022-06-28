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
  
    window._thinkAd = cc11001100_hook("window._thinkAd", true, "assign"); // 让浏览器支持自定义标签think
  
    document.createElement('thinkad');
    document.createElement('think'); // 配置项
  
    var thinkAdConfig = cc11001100_hook("thinkAdConfig", {
      // 接口地址
      'api': cc11001100_hook('api', '//e.topthink.com/api/basic', "object-key-init"),
      // js路径
      'jsPath': cc11001100_hook('jsPath', '//e.topthink.com/Public/static/', "object-key-init"),
      // 默认接口
      'defaultApi': cc11001100_hook('defaultApi', 'basic', "object-key-init")
    }, "var-init"); // 广告帮助类
  
    var thinkHelper = cc11001100_hook("thinkHelper", window.thinkHelper = cc11001100_hook("window.thinkHelper", {}, "assign"), "var-init"); // 获取文档的head对象
  
    thinkHelper.head = cc11001100_hook("thinkHelper.head", document.getElementsByTagName('head')[0], "assign"); // 空方法, 用于初始化和释放一些特定的函数, 如获取js成功后调用的函数
  
    thinkHelper.emptyFunc = cc11001100_hook("thinkHelper.emptyFunc", function () {// 什么都不做
    }, "assign");
    /**
     * 作用: 获取和加载js文件函数,
     * @param {string} scriptUrl 要加在的js地址
     * @param {bool} cache 是否缓存(默认不缓存false)
     * @returns {object}
     */
  
    thinkHelper.getScript = cc11001100_hook("thinkHelper.getScript", function (scriptUrl, cache) {
      var cache = cc11001100_hook("cache", arguments[1] ? arguments[1] : false, "var-init");
      var success = cc11001100_hook("success", thinkHelper.emptyFunc, "var-init");
      var error = cc11001100_hook("error", thinkHelper.emptyFunc, "var-init");
      var script = cc11001100_hook("script", document.createElement('script'), "var-init");
      script.onload = cc11001100_hook("script.onload", function () {
        // 加载成功
        success();
        success = cc11001100_hook("success", thinkHelper.emptyFunc, "assign");
      }, "assign");
      script.onreadystatechange = cc11001100_hook("script.onreadystatechange", function () {
        // ie9一下的加载成功判断
        if (this.readyState && this.readyState === 'loaded') {
          success();
          success = cc11001100_hook("success", thinkHelper.emptyFunc, "assign");
        }
      }, "assign");
      script.onerror = cc11001100_hook("script.onerror", function () {
        // 加载失败
        error();
        error = cc11001100_hook("error", thinkHelper.emptyFunc, "assign");
      }, "assign");
      script.type = cc11001100_hook("script.type", 'text/javascript', "assign");
  
      if (!cache) {
        // 如果不缓存就在url后添加随机数
        scriptUrl = cc11001100_hook("scriptUrl", thinkHelper.addQueryParams(scriptUrl, {
          '_t': cc11001100_hook('_t', Math.random(), "object-key-init")
        }), "assign");
      }
  
      script.src = cc11001100_hook("script.src", scriptUrl, "assign");
      thinkHelper.head.appendChild(script);
      var result = cc11001100_hook("result", {
        success: function (func) {
          success = cc11001100_hook("success", func, "assign");
          return result;
        },
        error: function (func) {
          error = cc11001100_hook("error", func, "assign");
          return result;
        }
      }, "var-init");
      return result;
    }, "assign");
    /**
     * 作用: 加载css文件助手函数
     * @param {string} cssUrl css文件路径
     * @param {bool} cache 是否缓存(默认false, 不缓存)
     * @returns {undefined}
     */
  
    thinkHelper.getStyle = cc11001100_hook("thinkHelper.getStyle", function (cssUrl, cache) {
      var cache = cc11001100_hook("cache", arguments[1] ? arguments[1] : false, "var-init");
      var link = cc11001100_hook("link", document.createElement('link'), "var-init");
      link.rel = cc11001100_hook("link.rel", 'stylesheet', "assign");
      link.type = cc11001100_hook("link.type", 'text/css', "assign");
  
      if (!cache) {
        cssUrl = cc11001100_hook("cssUrl", thinkHelper.addQueryParams(cssUrl, {
          '_t': cc11001100_hook('_t', Math.random(), "object-key-init")
        }), "assign");
      }
  
      link.href = cc11001100_hook("link.href", cssUrl, "assign");
      thinkHelper.head.appendChild(link);
    }, "assign");
    /**
     * 作用: 给文档追加css代码
     * @param {string} cssString css代码
     * @returns {undefined}
     */
  
    thinkHelper.addCssString = cc11001100_hook("thinkHelper.addCssString", function (cssString) {
      var style = cc11001100_hook("style", document.createElement("style"), "var-init");
      style.setAttribute("type", "text/css");
  
      if (style.styleSheet) {
        style.styleSheet.cssText = cc11001100_hook("style.styleSheet.cssText", cssString, "assign");
      } else {
        var cssText = cc11001100_hook("cssText", document.createTextNode(cssString), "var-init");
        style.appendChild(cssText);
      }
  
      var heads = cc11001100_hook("heads", document.getElementsByTagName("head"), "var-init");
  
      if (heads.length) {
        heads[0].appendChild(style);
      } else {
        document.documentElement.appendChild(style);
      }
    }, "assign");
    /**
     * 作用: 扩展url的参数
     * @param {string} url 需要扩展参数的地址
     * @param {json} obj 要添加到url中的参数
     * @returns {String} 添加参数后的url字符串
     */
  
    thinkHelper.addQueryParams = cc11001100_hook("thinkHelper.addQueryParams", function (url, obj) {
      var joinChar = cc11001100_hook("joinChar", url.indexOf('?') === -1 ? '?' : '&', "var-init");
      var arrParams = cc11001100_hook("arrParams", [], "var-init");
  
      for (var key in obj) {
        arrParams.push(key + '=' + encodeURIComponent(obj[key]));
      }
  
      return url + joinChar + arrParams.join('&');
    }, "assign");
    /**
     * 作用: 发送jsonp请求
     * @param {string} url 请求地址
     * @param {function} success 成功返回执行的处理函数
     * @param {function} error 失败执行的处理函数
     * @returns {undefined}
     */
  
    thinkHelper.jsonp = cc11001100_hook("thinkHelper.jsonp", function (url, success, error) {
      var error = cc11001100_hook("error", error ? error : thinkHelper.emptyFunc, "var-init");
      var callback = cc11001100_hook("callback", 'callback_' + Math.random().toString().replace('.', '_'), "var-init");
      window[callback] = cc11001100_hook("window[callback]", success, "assign");
      url = cc11001100_hook("url", thinkHelper.addQueryParams(url, {
        callback: cc11001100_hook("callback", callback, "object-key-init")
      }), "assign");
      thinkHelper.getScript(url).error(error);
    }, "assign");
    /**
     * 作用: 根据dom获取对应广告位代码
     * @param {documentElement} thinkAdDom dom对象
     * @returns {undefined}
     */
  
    thinkHelper.setAd = cc11001100_hook("thinkHelper.setAd", function (thinkAdDom) {
      var api = cc11001100_hook("api", thinkAdConfig.api + '/' + thinkAdDom.id, "var-init");
      thinkHelper.jsonp(api, function (data) {
        if (typeof data !== 'object' || !data.on) {
          thinkAdDom.parentNode.removeChild(thinkAdDom);
          return;
        }
  
        thinkAdDom.style.display = cc11001100_hook("thinkAdDom.style.display", 'block', "assign"); // 设置宽度
  
        if (data.width) {
          thinkAdDom.style.width = cc11001100_hook("thinkAdDom.style.width", data.width + 'px', "assign");
        } // 设置宽度
  
  
        if (data.height) {
          thinkAdDom.style.height = cc11001100_hook("thinkAdDom.style.height", data.height + 'px', "assign");
        }
  
        thinkAdDom.style.overflow = cc11001100_hook("thinkAdDom.style.overflow", 'hidden', "assign"); // 广告位css文件和css代码和载入
  
        if (data.css_file) {
          var cssFiles = cc11001100_hook("cssFiles", data.css_file.split('|'), "var-init");
  
          for (var i in cssFiles) {
            thinkHelper.getStyle(cssFiles[i]);
          }
        } // css code
  
  
        if (data.css_code) {
          thinkHelper.addCssString(data.css_code);
        } // 如果包含replace="true"就替换掉think标签, 负责在标签内填充模板
  
  
        if (thinkAdDom.getAttribute('replace') == 'true') {
          var tempDom = cc11001100_hook("tempDom", document.createElement("div"), "var-init");
          tempDom.innerHTML = cc11001100_hook("tempDom.innerHTML", data.html, "assign");
  
          if (tempDom.childNodes.length) {
            for (var i = cc11001100_hook("i", 0, "var-init"); i < tempDom.childNodes.length; i++) {
              thinkAdDom.parentNode.insertBefore(tempDom.childNodes[i], thinkAdDom);
            }
          }
  
          thinkAdDom.parentNode.removeChild(thinkAdDom);
        } else {
          thinkAdDom.innerHTML = cc11001100_hook("thinkAdDom.innerHTML", data.html, "assign");
        } // 广告位js文件载入
  
  
        var isJsFileOk = cc11001100_hook("isJsFileOk", false, "var-init");
  
        if (data.js_file) {
          var jsFiles = cc11001100_hook("jsFiles", data.js_file.split('|'), "var-init");
          var jsFileCount = cc11001100_hook("jsFileCount", 0, "var-init");
  
          for (var i in jsFiles) {
            thinkHelper.getScript(jsFiles[i], true).success(function () {
              jsFileCount++;
  
              if (jsFileCount >= jsFiles.length) {
                isJsFileOk = cc11001100_hook("isJsFileOk", true, "assign");
              }
            });
          }
        } else {
          isJsFileOk = cc11001100_hook("isJsFileOk", true, "assign");
        }
  
        var n = cc11001100_hook("n", setInterval(function () {
          if (isJsFileOk) {
            clearInterval(n);
            eval('(function(){try{' + data.js_code + '}catch(e){}})();');
          }
        }, 100), "var-init");
      });
    }, "assign");
    var st = cc11001100_hook("st", null, "var-init");
    var num = cc11001100_hook("num", 0, "var-init");
    var parse = cc11001100_hook("parse", {}, "var-init"); // 延时处理广告标签, 解决js找不到dom的问题
  
    var _loop = function () {
      if (num < 50) {
        (function () {
          // 很老很老的版本
          var thinkAds = cc11001100_hook("thinkAds", document.getElementsByTagName('thinkad'), "var-init");
  
          for (var i = cc11001100_hook("i", 0, "var-init"); i < thinkAds.length; i++) {
            if (!parse[thinkAds[i].id]) {
              parse[thinkAds[i].id] = cc11001100_hook("parse[thinkAds[i].id]", 1, "assign");
              thinkAds[i].setAttribute('parse', 1);
              thinkHelper.setAd(thinkAds[i]);
            }
          }
        })();
  
        (function () {
          // 新版本
          var thinkAds = cc11001100_hook("thinkAds", document.getElementsByTagName('think'), "var-init");
  
          for (var i = cc11001100_hook("i", 0, "var-init"); i < thinkAds.length; i++) {
            if (!parse[thinkAds[i].id]) {
              parse[thinkAds[i].id] = cc11001100_hook("parse[thinkAds[i].id]", 1, "assign");
              thinkAds[i].setAttribute('parse', 1);
              thinkHelper.setAd(thinkAds[i]);
            }
          }
        })();
  
        num++;
      } else {
        parse = cc11001100_hook("parse", null, "assign");
        clearInterval(st);
      }
    };
  
    st = cc11001100_hook("st", setInterval(_loop, 200), "assign");
  })();