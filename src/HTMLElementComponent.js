import {merge} from 'san-update';

let uid = do {
    let c = 1;
    () => 'san-' + c++;
};

let isEmpty = o => Object.keys(o) === 0;

export default class HTMLElementComponent {
    children = [];

    data = {};

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

        for (let child of this.children) {
            child.reviveAsCreated(); // 从文档中找回自己的元素并处理事件等关系
        }
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
        // this.validateDataType(partialData);

        // 找到实际不一样的这部分
        let patch = Object.entries(partialData)
            .filter(([key, value]) => this.data[key] !== value)
            .reduce((result, [key, value]) => Object.assign(result, {[key]: value}), {});

        // 如果没有变化的，提前退出
        if (isEmpty(patch)) {
            return;
        }

        this.data = merge(this.data, null, patch);

        if (this.el) {
            for (let [key, value] of Object.entries(patch)) {
                this.el[key] = value;
            }
        }

        return {newData: this.data, patch: patch};
    }

    updateScope(newScope, patch = newScope) {
        let affectedBindings = this.nodeContext.binds.filter(bind => bind.dependencies.some(key => patch.hasOwnProperty(key)));

        if (!affectedBindings.length) {
            return;
        }

        let dataPatch = affectedBindings.reduce(
            (patch, bind) => {
                let value = newScope[bind.dependencies[0]];
                return Object.assign(patch, {[bind.name]: value});
            },
            {}
        );
        this.setData(dataPatch);
    }
}
