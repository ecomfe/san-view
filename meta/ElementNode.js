/**
 * 元素节点
 *
 * 节点类型为原生的DOM元素，如`<input value="{{text}}" on-change="textChange($event.target.value)">`就是一个元素节点
 */
class ElementNode extends ANode {

    /**
     * 对应的元素类型
     *
     * @type {string}
     */
    tagName;
}
