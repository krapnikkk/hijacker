import { callExpression, identifier, isFunctionExpression, isIdentifier, isMemberExpression, stringLiteral } from "@babel/types";
import esrecurse from "./estools/esrecurse";
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        let redirectUrl = details.url;
        request(details.url, (data:string) => {
            redirectUrl = `data:text/plain;base64,${window.btoa(parseCode(data))}`;
        });
        return { redirectUrl };
    },
    {
        // urls: ["<all_urls>"],
        urls: ["http://127.0.0.1:8000/**"],
        types: ["script"]
    },
    ["blocking"]
);

const parseCode = (content:string) => {
    const syntax = esprima.parse(content);
    let newSyntax = esrecurse.visit(syntax, {
        AssignmentExpression: function (node) {
            // this.visit(node.left);
            // // do something...
            // this.visit(node.right);
            // console.log(node);
        },
        VariableDeclaration: function (node) {
            // console.log(node);
            if (!node.declarations?.length) {
                return;
            }
            for (let variableDeclarator of node.declarations) {
                if (!variableDeclarator.init) {
                    continue;
                }
                if (isFunctionExpression(variableDeclarator.init)) {
                    continue;
                }

                let varName = "";
                if (isIdentifier(variableDeclarator.id) || isMemberExpression(variableDeclarator.id)) {
                    // generator.default(variableDeclarator.id).code;
                    varName = variableDeclarator.id.name;
                }

                try {
                    const hookFunctionArguments = [
                        stringLiteral(varName),
                        variableDeclarator.init,
                        stringLiteral("var-init")
                    ];
                    variableDeclarator.init = callExpression(identifier(hookFunctionName), hookFunctionArguments)
                } catch (e) {
                    console.error(e);
                }
            }
        },
        ObjectExpression(node) {
            // console.log(node);
        },
        FunctionDeclaration(node) {

        }
    });
    console.log(newSyntax);
    // let newSyntax = estraverse.replace(syntax, {
    //     enter: function (node, parent) {

    //         if (node.type == 'AssignmentExpression') { // 变量声明 或许要增加赋值=操作符？
    //             assignmentExpressionHandler(node);
    //             //     node = JSON.parse(astHookStr);
    //             //     // return estraverse.VisitorOption.Skip;

    //         }else if(node.type == "VariableDeclaration"){
    //             node = variableDeclarationHandler(node);
    //         }
    //         return node;
    //     },
    //     leave: function (node, parent) {
    //         if (node.type == 'VariableDeclarator') { }
    //         // console.log(node.id.name);
    //     }
    // })
    return escodegen.generate(syntax);
    // console.log(JSON.stringify(syntax, null, 4));
}

function assignmentExpressionHandler(node) {
    node.right = {
        "type": "CallExpression",
        "callee": {
            "type": "Identifier",
            "name": "astHook"
        },
        "arguments": [
            {
                "type": "Literal",
                "value": `${node.left.object.name}.${node.left.property.name}`
            },
            {
                "type": "Literal",
                "value": node.right.value,
                "raw": node.right.raw
            },
            {
                "type": "Literal",
                "value": "assign",
            }
        ],
    }
}

function variableDeclarationHandler(node) {
    return {
        "type": "CallExpression",
        "callee": {
            "type": "Identifier",
            "name": "astHook"
        },
        "arguments": [
            {
                "type": "Literal",
                "value": "cache",
            },
            node.declarations[0].init,
            {
                "type": "Literal",
                "value": "var-init",
            }
        ],
    }
}

function request(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback && callback(xhr.responseText);
            } else {
                console.error(xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        console.error(xhr.statusText);
    };
    xhr.send(null);
}

