let redirectUrls = [];
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        //   return {cancel: details.url.indexOf("://www.evil.com/") != -1};
        console.log(details);
        let redirectUrl = details.url;
        request(details.url, (data) => {
            redirectUrl = `data:text/plain;base64,${window.btoa(parseCode(data))}`;
        });
        // redirectUrls.push(redirectUrl);
        // console.log("onBeforeRequest:",redirectUrl);
        return { redirectUrl };
    },
    {
        // urls: ["<all_urls>"],
        urls: ["http://127.0.0.1:8000/**"],
        types: ["script"]
    },
    ["blocking"]
);

const astHookStr = `{
    "type": "VariableDeclaration",
    "declarations": [
      {
        "type": "VariableDeclarator",
        "id": {
          "type": "Identifier",
          "name": "t",
          "range": [
            183,
            184
          ]
        },
        "init": {
          "type": "CallExpression",
          "callee": {
            "type": "Identifier",
            "name": "astHook",
            "range": [
              187,
              194
            ]
          },
          "arguments": [
            {
              "type": "Literal",
              "value": "t",
              "range": [
                195,
                198
              ]
            },
            {
              "type": "ObjectExpression",
              "properties": [],
              "range": [
                200,
                202
              ]
            },
            {
              "type": "Literal",
              "value": "var-init",
              "range": [
                204,
                214
              ]
            }
          ],
          "range": [
            187,
            215
          ]
        },
        "range": [
          183,
          215
        ]
      }
    ],
    "kind": "var",
    "range": [
      179,
      216
    ]
}`

const parseCode = (content) => {
    const syntax = esprima.parse(content);
    // estraverse.traverse(syntax, {
    //     enter: function (node, parent) {
    //         if (node.type == 'FunctionExpression' || node.type == 'FunctionDeclaration')
    //             return estraverse.VisitorOption.Skip;
    //     },
    //     leave: function (node, parent) {
    //         if (node.type == 'VariableDeclarator')
    //             console.log(node.id.name);
    //     }
    // })
    let newSyntax = estraverse.replace(syntax, {
        enter: function (node, parent) {

            if (node.type == 'AssignmentExpression') { // 变量声明 或许要增加赋值=操作符？
                assignmentExpressionHandler(node);
                //     node = JSON.parse(astHookStr);
                //     // return estraverse.VisitorOption.Skip;
                
            }else if(node.type == "VariableDeclaration"){
                variableDeclarationHandler(node);
            }
            return node;
        },
        leave: function (node, parent) {
            if (node.type == 'VariableDeclarator') { }
            // console.log(node.id.name);
        }
    })
    return escodegen.generate(newSyntax);
    // console.log(JSON.stringify(syntax, null, 4));
}

function assignmentExpressionHandler(node){
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

function variableDeclarationHandler(node){
    let {init} = node;
    node.init =  {
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
          {
            "type": "ConditionalExpression",
            "test": {
              "type": "MemberExpression",
              "computed": true,
              "object": {
                "type": "Identifier",
                "name": "arguments",
              },
              "property": {
                "type": "Literal",
                "value": 1,
                "raw": "1",
              },
            },
            "consequent": {
              "type": "MemberExpression",
              "computed": true,
              "object": {
                "type": "Identifier",
                "name": "arguments",
              },
              "property": {
                "type": "Literal",
                "value": 1,
                "raw": "1",
              }
            },
            "alternate": {
              "type": "Literal",
              "value": false,
              "raw": "false"
            }
          },
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

