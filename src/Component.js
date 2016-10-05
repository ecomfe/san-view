// import {scheduleRender} from './scheduler';
import {defaults, merge} from 'san-update';
import ComponentFactory from './ComponentFactory';

// // 需要知道一个节点的类型，这里返回component、for、text、element等字符串
// let getNodeType = node => {

// };

let isEmpty = o => Object.keys(o) === 0;


export default class Component {
    // // 模板字符串
    // static template = '';

    // 模板解析后的抽象节点
    static aNode = null;

    // // 类型声明，只在develop模式下有用
    // static dataTypes = null;

    components = {};

    children = [];

    downstreams = [];

    aNode;

    // 最后一次用于渲染的数据，做渲染时的脏检查用
    previousRenderData;

    data;

    // 初始值
    initData() {
        return {};
    }

    constructor(initialData) {
        this.factory = new ComponentFactory(this);

        let data = defaults(initialData, null, this.initData());
        // // 校验数据格式，只在develop模式下会有
        // this.validateDataType(data);

        // 最新的数据
        this.data = data;

        // 保证模板编译就一次
        if (this.constructor.aNode) {
            this.aNode = this.constructor.aNode;
        }
        else {
            this.constructor.aNode = this.parseTemplate(this.constructor.template);
        }
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

        // 保存一下上一次渲染用的数据
        // if (!this.previousRenderData) {
        //     this.previousRenderData = this.data;
        // }

        this.data = merge(this.data, null, patch);

        // 推送到子组件
        this.pushScopeChange(patch);

        return {newData: this.data, patch: patch};
    }

    // // 内部使用的setData
    // changeData(partialData) {
    //     let result = this.setData(partialData);
    //     this.notifyDataChange(result.changes);
    //     return result;
    // }

    // notifyDataChange() {
    //     this.onChange && this.onChange(changes);
    //     this.fire('change', {changes});
    // }

    pushScopeChange(patch) {
        this.root.updateScope(this.data, patch);

        for (let component of this.downstreams) {
            component.updateScope(this.data, patch);
        }
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

    // // 把实际的界面更新刷一下
    // pushRender() {
    //     let changes = Object.entries(this.data).filter(([key, value]) => this.previousRenderData[key] !== value);
    //     let bindings = this.bindInfo
    //         .filter(({target}) => getNodeType(target) !== 'component')
    //         .filter(({dependencies}) => dependencies.some(dep => changes.hasOwnProperty(dep)));

    //     for (let {target, property, compute} of bindings) {
    //         let nodeType = getNodeType(target);
    //         let value = compute(this.data);

    //         switch (nodeType) {
    //             case 'element':
    //                 target.element[property] = value;
    //                 break;
    //             case 'text':
    //                 target.node.nodeValue = value;
    //                 break;
    //             case 'for':
    //                 // for怎么处理的？
    //                 break;
    //         }
    //     }

    //     this.previousRenderData = null;
    // }

    // // 核心方法，完全不知道怎么实现
    // render() {

    //     this.aNode = this.constructor.aNode;
    //     this.afterCompileTemplate();

    //     this.beforeRender(); // 生命周期
    //     // ... 真正的渲染，这里应该就会建立绑定关系、父子关系等
    //     this.afterRender(); // 生命周期

    //     this.initializePropertyBindings();
    //     this.initializeEventBindings();
    // }

    resolveContainer() {
        return this.el || this.parent.resolveContainer();
    }

    toHTML() {
        this.createStructure();

        if (this.root) {
            return this.root.toHTML();
        }

        throw new Error('This is not a HTMLElementComponent but do not have a root');
    }

    reviveAsCreated() {
        // this.bindEvents();

        if (this.root) {
            this.root.reviveAsCreated();
        }

        for (let child of this.children) {
            child.reviveAsCreated(); // 从文档中找回自己的元素并处理事件等关系
        }

        // this.callHook('created');
    }

    attach(container) {
        let html = this.toHTML();

        container.insertAdjacentHTML('beforeEnd', html);

        this.reviveAsCreated();
        this.pushScopeChange();

        // this.callHook('attached');
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

    /**
     * 添加一个数据上的下游组件
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
     * @param {Component} child 下游组件
     */
    addDownstream(child) {
        this.downstreams.push(child);
    }

    // initializePropertyBindings() {
    //     // 只用处理双绑，单绑是在setData的数据流推送里处理的，不依赖任何事件
    //     let dualBindings = this.bindInfo.filter(({type}) => type === 'dual');
    //     for (let {target, property, dependencies: [sourceProperty]} of dualBindings) {
    //         target.on(
    //             'change',
    //             ({changes}) => {
    //                 if (!changes.hasOwnProperty(property)) {
    //                     return;
    //                 }

    //                 let patch = {[sourceProperty]: changes[property]};
    //                 this.changeData(patch); // 双向绑定等于一个事件处理，所以和事件一样是会发事件的
    //             }
    //         );
    //     }
    // }

    // initializeEventBindings() {
    //     for (let {eventName, methodName, compiledEventHandler} of this.eventBindInfo) {
    //         let handler = async () => {
    //             let devContext = {
    //                 // ...这里放一堆要发给dev tool的上下文信息
    //             };

    //             let done = false;

    //             let output = (name, arg) => {
    //                 let callbackName = 'on' + pascalize(name);
    //                 this[callbackName] && this[callbackName](arg);
    //                 this.fire(name, arg);
    //                 this.reportOutputToDevTool(devContext, name, arg);
    //             };

    //             let resolve = action => {
    //                 if (done) {
    //                     console.warn('...');
    //                     return;
    //                 }

    //                 let patch = action(this.data);
    //                 let {newData} = this.changeData(patch); // 会发事件的，因为是内部修改数据
    //                 this.reportDataTransferToDevTool(devContext, newData);
    //             };

    //             let finalPatch = await compiledEventHandler.call(this, this.data, output, resolve);
    //             let newData = this.changeData(finalPatch);
    //             this.reportDataTransferToDevTool(devContext, newData);
    //             done = true;
    //         }
    //     }
    // }

    // reportOutputToDevTool(context, name, arg) {
    //     console.log(/* ... */);
    // }

    // reportDataTransferToDevTool(context, newData) {
    //     console.log(/* ... */);
    // }
}



