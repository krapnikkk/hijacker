## 起源
以前玩单机游戏的时候，因为数值因素导致的卡关，使用【金山游侠/八门神器】魔改一波数值，就能轻松过关。现在网页H5游戏那么多，却没有这么一个好用的工具（虽然有更高级的方法），于是想着造个轮子，整个toy project，于是先新建个文件夹！

### 这是什么
在chrome扩展环境下，使用**[Babel](https://babeljs.io/)**基于AST将页面引用的script标签的内容进行篡改注入hook方法，通过hook方法对运行时中的数据进行查询或更改。
```
起初技术调研想到用的是esprima重新造轮子，后面发现Babel更流行，分别对esprima和Babel进行了解析时长对比，发现差异不大，另外Babel的工具链比较完善；同时找到[ast-hook-for-js-RE]这个项目，于是拿来主义，虽然Babel基于nodejs环境，但是一波StackOverflow后，成功在chrome环境跑起来了~
```
### 全局API
注入hook方法中，提供了一下全局API进行操作[纯控制台操作~~(写UI界面好麻烦呀)~~]

| 方法                                             | 说明                                   |
| ------------------------------------------------ | -------------------------------------- |
| search(arg:string\|number)                       | 检索出现过某个值的所有堆栈信息         |
| view(execOrder:number)                           | 通过堆栈调用序号查看查看该堆栈信息详情 |
| hijack(execOrder:number,newValue:string\|number) | 劫持堆栈调用中的值篡改为指定的值       |
| cancelHijack(execOrder:number)                   | 取消劫持                               |
| clearHijack()                                    | 清空所有劫持记录                       |

### 怎么使用

[youtube](https://youtu.be/pVJCagFgT2Q)
[bilibili](https://www.bilibili.com/video/BV1bN4y1u7Ma/)



### 写在最后

本扩展属于toy project，仅仅是为了验证个人的一个想法并为之实现它，该项目并不能适配所有H5游戏哦~

### 感谢
- [ast-hook-for-js-RE](https://github.com/CC11001100/ast-hook-for-js-RE)
- [Babel](https://babeljs.io/)
- [webpack](https://webpack.js.org/)

### License ###
MIT

