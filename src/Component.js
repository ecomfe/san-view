// import {scheduleRender} from './scheduler';
import ComponentBase from './ComponentBase';
import ComponentFactory from './ComponentFactory';
import uid from './uid';

// // 需要知道一个节点的类型，这里返回component、for、text、element等字符串
// let getNodeType = node => {

// };

let isEmpty = o => Object.keys(o) === 0;


export default class Component extends ComponentBase {

    // // 模板字符串
    // static template = '';

    // 模板解析后的抽象节点
    static aNode = null;

    // // 类型声明，只在develop模式下有用
    // static dataTypes = null;

    components = {};

    root = null;

    aNode;

    constructor(initialData) {
        super(initialData);

        this.factory = new ComponentFactory(this);

        // 保证模板编译就一次
        if (this.constructor.aNode) {
            this.aNode = this.constructor.aNode;
        }
        else {
            this.constructor.aNode = this.parseTemplate(this.constructor.template);
        }
    }

    pushScopeChange(patch) {
        this.root.updateScope(this.data, patch);

        super.pushScopeChange(patch);
    }

    toHTML() {
        this.createStructure();

        if (this.root) {
            return this.root.toHTML();
        }

        throw new Error('This is not a HTMLElementComponent but do not have a root');
    }

    /**
     * 创建组件树结构，但没有任何渲染
     *
     * 这个方法结束后，以当前组件为根的组件树已经构建完成，其中包括了以`children`为线索的结构树和以`downstreams`为线索的数据流树，
     * 但所有的组件都没有进行实际渲染，其中表示真实`HTMLElement`的组件都不会创建对应的元素
     *
     * 这个方法之后可以使用`toHTML()`生成HTML字符串，或使用`attach`方法直接添加到容器中
     */
    createStructure() {
        this.root = this.factory.fromANode(this.aNode);
        this.root.createStructure();

        this.downstreams.forEach(child => child.createStructure());

        // this.callHook('created');
    }

    reviveAsCreated() {
        if (this.root) {
            this.root.reviveAsCreated();
        }

        super.reviveAsCreated();
    }

    dispose() {
        this.root.dipose();
        super.dispose();

        this.root = null;
    }
}



