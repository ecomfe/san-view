/**
 * `for`循环装饰
 *
 * 使用`san-for="users as user, index"`声明一个循环
 *
 * 循环节点的`childs`表示一次循环的内容，实际渲染时会根据列表变成多份
 */
class ForDirective extends Directive {

    /**
     * 列表属性名称，如`san-for="users as user"`中的`users`
     *
     * @type {string}
     */
    list;

    /**
     * 列表中每个元素的名称，如`san-for="users as user"`中的`user`
     *
     * @type {string}
     */
    item;

    /**
     * 循环时的序号的名称，如`san-for="users as user, i"`中的`i`
     *
     * @type {string}
     */
    index;
}
