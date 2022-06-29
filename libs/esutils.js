(function () {
    'use strict';

    function isIdentifier(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'Identifier':
                return true;
        }
        return false;
    }

    function isExpression(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'ArrayExpression':
            case 'AssignmentExpression':
            case 'BinaryExpression':
            case 'CallExpression':
            case 'ConditionalExpression':
            case 'FunctionExpression':
            case 'Identifier':
            case 'Literal':
            case 'LogicalExpression':
            case 'MemberExpression':
            case 'NewExpression':
            case 'ObjectExpression':
            case 'SequenceExpression':
            case 'ThisExpression':
            case 'UnaryExpression':
            case 'UpdateExpression':
                return true;
        }
        return false;
    }

    function isFunctionExpression(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'FunctionExpression':
                return true;
        }
        return false;
    }

    function isMemberExpression(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'MemberExpression':
                return true;
        }
        return false;
    }

    function isObjectExpression(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'ObjectExpression':
                return true;
        }
        return false;
    }

    function isIterationStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'DoWhileStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'WhileStatement':
                return true;
        }
        return false;
    }

    function isStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'BlockStatement':
            case 'BreakStatement':
            case 'ContinueStatement':
            case 'DebuggerStatement':
            case 'DoWhileStatement':
            case 'EmptyStatement':
            case 'ExpressionStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'IfStatement':
            case 'LabeledStatement':
            case 'ReturnStatement':
            case 'SwitchStatement':
            case 'ThrowStatement':
            case 'TryStatement':
            case 'VariableDeclaration':
            case 'WhileStatement':
            case 'WithStatement':
                return true;
        }
        return false;
    }

    function isBlockStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'BlockStatement':
                return true;
        }
        return false;
    }

    function isSourceElement(node) {
        return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
    }

    function trailingStatement(node) {
        switch (node.type) {
            case 'IfStatement':
                if (node.alternate != null) {
                    return node.alternate;
                }
                return node.consequent;

            case 'LabeledStatement':
            case 'ForStatement':
            case 'ForInStatement':
            case 'WhileStatement':
            case 'WithStatement':
                return node.body;
        }
        return null;
    }


    function isProblematicIfStatement(node) {
        var current;

        if (node.type !== 'IfStatement') {
            return false;
        }
        if (node.alternate == null) {
            return false;
        }
        current = node.consequent;
        do {
            if (current.type === 'IfStatement') {
                if (current.alternate == null) {
                    return true;
                }
            }
            current = trailingStatement(current);
        } while (current);

        return false;
    }

    function validateNode(node) {
        // todo: because keys not in BUILDER_KEYS are not validated - this actually allows invalid nodes in some cases
        const keys = BUILDER_KEYS[node.type];
        for (const key of keys) {
            validate(node, key, node[key]);
        }
        return node;
    }

    function validate(node, key, val,) {
        if (!node) return;

        const fields = NODE_FIELDS[node.type];
        if (!fields) return;

        const field = fields[key];
        validateField(node, key, val, field);
        validateChild(node, key, val);
    }

    function validateField(node, key, val, field) {
        if (!field?.validate) return;
        if (field.optional && val == null) return;

        field.validate(node, key, val);
    }

    function validateChild(node, key, val,) {
        if (val == null) return;
        const validate = NODE_PARENT_VALIDATIONS[val.type];
        if (!validate) return;
        validate(node, key, val);
    }

    function callExpression(callee, _arguments) {
        return validateNode({
            type: "CallExpression",
            callee,
            arguments: _arguments,
        });
    }

    function identifier(name) {
        return validateNode({
            type: "Identifier",
            name,
        });
    }

    function stringLiteral(value) {
        return validateNode({
            type: "StringLiteral",
            value,
        });
    }

    window.esutils = {
        isIdentifier: isIdentifier,
        isExpression: isExpression,
        isFunctionExpression: isFunctionExpression,
        isMemberExpression: isMemberExpression,
        isObjectExpression: isObjectExpression,
        isStatement: isStatement,
        isBlockStatement: isBlockStatement,
        isIterationStatement: isIterationStatement,
        isSourceElement: isSourceElement,
        isProblematicIfStatement: isProblematicIfStatement,
        trailingStatement: trailingStatement,
        callExpression:callExpression,
        identifier:identifier,
        stringLiteral:stringLiteral
    };
}());