const babel = require("@babel/core");
const types = require("@babel/types");
const generator = require("@babel/generator");

const hookFunctionName = "esASThook";

var tabList = [];
function sendMessage(message) {
    window.chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        tabList.push(tabs[0].id)
        window.chrome.tabs.sendMessage(tabs[0].id, message);
    });
};

window.chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    var frameId;
    if (sender.frameId) {
        frameId = sender.frameId;
    }
    else if (request.uniqueId) {
        frameId = request.uniqueId;
    }
    else {
        frameId = sender.id;
    }
    frameId += "";

    if (request.action) {
    }
    else if (request.present === 1) {
        window.chrome.pageAction.show(sender.tab.id);
    }
    // In case we are enabled, change the icon to green andd enable the popup.
    else if (request.present === 2) {
        window.chrome.pageAction.setIcon({
            tabId: sender.tab.id, path: {
                "19": "./icon/19-enable.png",
                "38": "./icon/38-enable.png"
            }
        });
        window.chrome.pageAction.show(sender.tab.id);
    }

    // Return the frameid for reference.
    sendResponse({ frameId: frameId });
});

window.chrome.pageAction.onClicked.addListener(function (tab) {
    sendMessage({ action: "pageAction" });
});
// let counter = 0, now = 0;



chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        let redirectUrl = details.url;
        let tabId = details.tabId;
        console.log(tabId, tabList);
        if (tabList.indexOf(tabId) > -1) {
            // todo 过滤log&ad&error相关服务插件
            // console.time("parseCode");
            // console.log(redirectUrl);
            // now = Date.now();
            request(details.url, (data) => {
                // console.timeEnd("parseCode");
                // counter += Date.now() - now;
                // console.log(counter);
                redirectUrl = `data:text/plain;base64,${window.btoa(unescape(encodeURIComponent(parseCode(data))))}`;
            }, () => {
                console.log(`加载异常：${redirectUrl}`);
                // console.timeEnd("parseCode");
            });
        }
        
        return { redirectUrl };
    },
    {
        // urls: ["<all_urls>"],
        urls: ["http://*/*", "https://*/*"], // todo 其他协议:blob data
        types: ["script"]
    },
    ["blocking"]
);


const parseCode = (content) => {
    const syntax = babel.parse(content, { "sourceType": "script" });
    babel.traverse(syntax, {
        // 变量声明
        VariableDeclaration(path) {
            const node = path.node;
            if (!node.declarations?.length) {
                return;
            }
            for (let variableDeclarator of node.declarations) {
                if (!variableDeclarator.init) {
                    continue;
                }
                if (types.isFunctionExpression(variableDeclarator.init)) {
                    continue;
                }

                let varName = "";
                if (types.isIdentifier(variableDeclarator.id) || types.isMemberExpression(variableDeclarator.id)) {
                    varName = generator.default(variableDeclarator.id).code;
                }

                try {
                    const hookFunctionArguments = [
                        types.stringLiteral(varName),
                        variableDeclarator.init,
                        types.stringLiteral("var-init")
                    ];
                    variableDeclarator.init = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments)
                } catch (e) {
                    console.error(e);
                }
            }
        },

        AssignmentExpression(path) {
            const node = path.node;
            if (types.isFunctionExpression(node)) {
                return;
            }

            let varName = "";
            if (types.isIdentifier(node.left) || types.isMemberExpression(node.left)) {
                varName = generator.default(node.left).code;
            }

            try {
                const hookFunctionArguments = [
                    types.stringLiteral(varName),
                    node.right,
                    types.stringLiteral("assign")
                ];
                node.right = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments)
            } catch (e) {
                console.error(e);
            }
        },

        // 对象表达式
        ObjectExpression(path) {
            const node = path.node;
            if (!node.properties?.length) {
                return;
            }
            for (let objectProperty of node.properties) {
                const propertyValue = objectProperty.value;
                if (types.isFunctionExpression(propertyValue)) {
                    continue;
                }
                if (types.isObjectExpression(propertyValue)) {
                    continue;
                }

                if (!propertyValue) {
                    return;
                }

                let objectKey = objectProperty.key;
                if (types.isIdentifier(objectKey)) {
                    objectKey = types.stringLiteral(objectKey.name);
                }

                try {
                    const hookFunctionArguments = [
                        objectKey,
                        propertyValue,
                        types.stringLiteral("object-key-init")
                    ];
                    objectProperty.value = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments);
                } catch (e) {
                    console.error(e);
                }
            }

        },

        // 函数的形参
        FunctionDeclaration(path) {
            const node = path.node;
            if (!node.params?.length) {
                return;
            }
            const params = node.params;
            if (types.isBlockStatement(node.body)) {
                // 函数体是个代码块的，则在代码块最前面插入Hook，检查参数的值
                for (let i = params.length - 1; i >= 0; i--) {
                    try {
                        const paramName = params[i];
                        const hookFunctionArguments = [
                            types.stringLiteral(generator.default(paramName).code),
                            paramName,
                            types.stringLiteral("function-parameter")
                        ];
                        const hookFunction = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments);
                        node.body.body.unshift(types.expressionStatement(hookFunction));
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
    });
    let val = generator.default(syntax).code;
    return val;
}

function request(url, success, failure) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                success && success(xhr.responseText);
            } else {
                console.error(xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        failure && failure();
        console.error(xhr.statusText);
    };
    xhr.ontimeout = function (e) {
        failure && failure();
        console.error(xhr.statusText);
    };
    xhr.send(null);
}

