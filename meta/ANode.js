/**
 * 抽象节点，通过对模板进行编译后形成的信息
 */
class ANode {

    /**
     * 节点类型，取值为`"component"`、`"element"`、`"text"`、`"if"`、`"for"`
     *
     * @type {string}
     */
    type;

    /**
     * 子节点
     *
     * @type {ANode[]}
     */
    childs;

    /**
     * 装饰信息
     *
     * @type {Directive[]}
     */
    directives;

    /**
     * 属性绑定信息
     *
     * @type {PropertyBinding[]}
     */
    binds;

    /**
     * 事件绑定信息
     *
     * @type {EventBinding[]}
     */
    events;
}
