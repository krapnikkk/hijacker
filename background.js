let redirectUrls = [];
chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
        //   return {cancel: details.url.indexOf("://www.evil.com/") != -1};
        // console.log(details.type, details.url);
        let redirectUrl = await getLocalFileUrl(details.url);
        redirectUrls.push(redirectUrl);
        // console.log(redirectUrl);
        return { redirectUrl };
    },
    {
        urls: ["<all_urls>"],
        types: ["script"]
    },
    ["blocking"]
);

const parseCode = (content) => {
    const syntax = esprima.parse(content);
    estraverse.traverse(syntax, {
        enter: function (node, parent) {
            if (node.type == 'FunctionExpression' || node.type == 'FunctionDeclaration')
                return estraverse.VisitorOption.Skip;
        },
        leave: function (node, parent) {
            if (node.type == 'VariableDeclarator')
                console.log(node.id.name);
        }
    })
    return escodegen.generate(syntax);
    // console.log(JSON.stringify(syntax, null, 4));
}

const getLocalFileUrl = async (url) => {
    let content = await request(url);
    if (!content) {
        console.warn(`URL:${url}=>资源获取失败!`);
        return url;
    }
    content = parseCode(content);
    // console.log(content);
    const blob = new Blob([content], { type: "application/javascript" });

    const redirectUrl = URL.createObjectURL(blob);
    return redirectUrl;
}

const request = (url) => {
    return new Promise((resolve, reject) => {
        fetch(url).then(res => res.text()).then(text => { resolve(text) }).catch((e) => {
            console.warn(`URL:${url}=>资源获取失败!`);
            reject();
        })
    })
}

const clearFiles = () => {
    while (redirectUrls.length) {
        URL.revokeObjectURL(redirectUrls.pop());
    }
}

// function injectHook(jsCode) {
//     let { generator, types } = Babel;
//     const ast = Babel.parse(jsCode);
//     Babel.traverse(ast, {
//         // 变量声明
//         VariableDeclaration(path) {
//             const node = path.node;
//             if (!node.declarations?.length) {
//                 return;
//             }
//             for (let variableDeclarator of node.declarations) {
//                 if (!variableDeclarator.init) {
//                     continue;
//                 }
//                 if (types.isFunctionExpression(variableDeclarator.init)) {
//                     continue;
//                 }

//                 let varName = "";
//                 if (types.isIdentifier(variableDeclarator.id) || types.isMemberExpression(variableDeclarator.id)) {
//                     varName = generator.default(variableDeclarator.id).code;
//                 }

//                 try {
//                     const hookFunctionArguments = [
//                         types.stringLiteral(varName),
//                         variableDeclarator.init,
//                         types.stringLiteral("var-init")
//                     ];
//                     variableDeclarator.init = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments)
//                 } catch (e) {
//                     console.error(e);
//                 }
//             }
//         },

//         AssignmentExpression(path) {
//             const node = path.node;
//             if (types.isFunctionExpression(node)) {
//                 return;
//             }

//             let varName = "";
//             if (types.isIdentifier(node.left) || types.isMemberExpression(node.left)) {
//                 varName = generator.default(node.left).code;
//             }

//             try {
//                 const hookFunctionArguments = [
//                     types.stringLiteral(varName),
//                     node.right,
//                     types.stringLiteral("assign")
//                 ];
//                 node.right = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments)
//             } catch (e) {
//                 console.error(e);
//             }
//         },

//         // 对象表达式
//         ObjectExpression(path) {
//             const node = path.node;
//             if (!node.properties?.length) {
//                 return;
//             }
//             for (let objectProperty of node.properties) {
//                 const propertyValue = objectProperty.value;
//                 if (types.isFunctionExpression(propertyValue)) {
//                     continue;
//                 }
//                 if (types.isObjectExpression(propertyValue)) {
//                     continue;
//                 }

//                 if (!propertyValue) {
//                     return;
//                 }

//                 let objectKey = objectProperty.key;
//                 if (types.isIdentifier(objectKey)) {
//                     objectKey = types.stringLiteral(objectKey.name);
//                 }

//                 try {
//                     const hookFunctionArguments = [
//                         objectKey,
//                         propertyValue,
//                         types.stringLiteral("object-key-init")
//                     ];
//                     objectProperty.value = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments);
//                 } catch (e) {
//                     console.error(e);
//                 }
//             }

//         },

//         // 函数的形参
//         FunctionDeclaration(path) {
//             const node = path.node;
//             if (!node.params?.length) {
//                 return;
//             }
//             const params = node.params;
//             if (types.isBlockStatement(node.body)) {
//                 // 函数体是个代码块的，则在代码块最前面插入Hook，检查参数的值
//                 for (let i = params.length - 1; i >= 0; i--) {
//                     try {
//                         const paramName = params[i];
//                         const hookFunctionArguments = [
//                             types.stringLiteral(generator.default(paramName).code),
//                             paramName,
//                             types.stringLiteral("function-parameter")
//                         ];
//                         const hookFunction = types.callExpression(types.identifier(hookFunctionName), hookFunctionArguments);
//                         node.body.body.unshift(types.expressionStatement(hookFunction));
//                     } catch (e) {
//                         console.error(e);
//                     }
//                 }
//             }
//         }

//     })
//     return generator.default(ast).code;
// }