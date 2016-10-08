import ComponentBase from './ComponentBase';

let uid = do {
    let c = 1;
    () => 'san-' + c++;
};

let isEmpty = o => Object.keys(o) === 0;

export default class HTMLElementComponent extends ComponentBase {

    toHTML() {
        this.createStructure();

        let tagName = this.nodeContext.tagName;

        let attributes = `id="${this.nodeId}"`;
        let start = `<${tagName} ${attributes}>`;
        let end = tagName === 'input' ? '' : `</${tagName}>`;
        let content = this.children.map(child => child.toHTML()).join('');
        return start + content + end;
    }

    createStructure() {
        this.nodeId = this.nodeContext.id || uid();
    }

    reviveAsCreated() {
        if (!this.el) {
            this.el = document.getElementById(this.nodeId);

            for (let [key, value] of Object.entries(this.data)) {
                this.el[key] = value;
            }
        }

        super.reviveAsCreated();
    }

    /**
     * 添加一个结构上的子组件
     *
     * 假设一个组件使用如下的模板：
     *
     * ```html
     * <div>
     *     <span>Hello World</span>
     * </div>
     * ```
     *
     * 编译后，`<span>`元素是`<div>`的**结构子组件**，但是是当前组件的**下游组件**
     *
     * @param {Component} child 子组件
     */
    addChild(child) {
        this.children.push(child);
    }

    setData(partialData) {
        let result = super.setData(partialData);

        if (this.el) {
            for (let [key, value] of Object.entries(result.patch)) {
                this.el[key] = value;
            }
        }

        return result;
    }

    dispose() {
        super.dispose();
        if (this.el) {
            this.el.remove();
        }
    }
}
