/**
 * 文本节点
 *
 * 如`Hello {{name}}`就是一个文本节点，当`name`属性变化时，更新这个节点的内容
 */
class TextNode extends ANode {

    /**
     * 文本内容表达式
     *
     * @type {string}
     */
    expr;

    /**
     * 涉及的依赖属性
     *
     * @type {string[]}
     */
    dependencies;
}
