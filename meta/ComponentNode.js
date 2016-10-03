/**
 * 组件节点
 *
 * 指定一个自定义的组件为节点类型，如`<san-text-box value="{{text}}" on-value-change="textChange">`就是一个`TextBox`组件节点
 */
class ComponentNode extends ANode {

    /**
     * 对应的组件的类型
     *
     * @type {Function}
     */
    componentType;
}
