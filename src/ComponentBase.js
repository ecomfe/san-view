// import {scheduleRender} from './scheduler';
import {defaults, merge} from 'san-update';

let isEmpty = o => Object.keys(o) === 0;

let isBindingAffected = (bind, patch) => bind.dependencies.some(key => patch.hasOwnProperty(key))

export default class ComponentBase {

    children = [];

    downstreams = [];

    // 最后一次用于渲染的数据，做渲染时的脏检查用
    previousRenderData;

    data;

    // 初始值
    initData() {
        return {};
    }

    constructor(initialData) {
        let data = defaults(initialData, null, this.initData());
        // // 校验数据格式，只在develop模式下会有
        // this.validateDataType(data);

        // 最新的数据
        this.data = data;
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

        let previousData = this.data;
        let newData = merge(this.data, null, patch);

        this.data = newData;

        // 推送到子组件
        this.pushScopeChange(patch);

        return {previousData, newData, patch};
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
        for (let component of this.downstreams) {
            component.updateScope(this.data, patch);
        }
    }

    updateScope(newScope, patch = newScope) {
        let affectedBindings = this.nodeContext.binds.filter(bind => isBindingAffected(bind, patch));

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

    toHTML() {
        throw new Error('Not implemented');
    }

    reviveAsCreated() {
        // this.bindEvents();

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

    dispose() {
        for (let child of this.downstreams) {
            child.dispose();
        }

        this.children = null;
        this.downstreams = null;
    }

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



