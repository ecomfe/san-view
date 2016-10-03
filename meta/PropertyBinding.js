/**
 * 属性绑定信息
 */
class PropertyBinding {

    /**
     * 属性名，即`foo="{{bar}}"`中的左边部分
     *
     * @type {string}
     */
    name;

    /**
     * 绑定表达式
     *
     * @type {string}
     */
    expr;

    /**
     * 是否为双向绑定
     *
     * @type {boolean}
     */
    twoWay;

    /**
     * 涉及的依赖属性
     *
     * @type {string[]}
     */
    dependencies;
}
