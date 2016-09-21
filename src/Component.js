import {scheduleRender} from './scheduler';
import {defaults, merge} from 'san-update';

// 需要知道一个节点的类型，这里返回component、for、text、element等字符串
let getNodeType = node => {

};

export default class Component {
    // 模板字符串
    static template = '';

    // 模板解析后的抽象节点
    static aNode = null;

    // 类型声明，只在develop模式下有用
    static dataTypes = null;

    // 初始值
    initData() {
        return {};
    }

    constructor(initialData) {
        let data = defaults(initialData, this.initData());
        // 校验数据格式，只在develop模式下会有
        this.validateDataType(data);

        // 最后一次用于渲染的数据，做渲染时的脏检查用
        this.lastRenderData = null;
        // 最新的数据
        this.data = data;
    }

    setData(partialData) {
        this.validateDataType(partialData);

        // 找到实际不一样的这部分
        let changes = Object.entries(partialData)
            .filter(([key, value]) => this.data[key] !== value)
            .reduce((result, [key, value]) => (result[key] = value, result));

        // 如果没有变化的，提前退出
        if (isEmpty(changes)) {
            return;
        }

        // 保存一下上一次渲染用的数据
        if (!this.lastRenderData) {
            this.lastRenderData = this.data;
        }

        this.data = merge(this.data, changes);

        // 推送到子组件
        this.pushDataChange(changes);

        return {newData, changes};
    }

    // 内部使用的setData
    changeData(partialData) {
        let result = this.setData(partialData);
        this.notifyDataChange(result.changes);
        return result;
    }

    notifyDataChange() {
        this.onChange && this.onChange(changes);
        this.fire('change', {changes});
    }

    pushDataChange(changes) {
        // 期望每一个bind的信息
        // {
        //     target: 可能是component、for、text、element等
        //     property: 目标的属性名
        //     type: 绑定类型，oneWay或者dual，如果把constant也放进来的话得要再改下代码
        //     expression: 当时声明的字符串
        //     dependencies: 依赖的属性的数组，如['name', 'age']
        //     compute: 一个data => value的函数，给当前的data能算出值
        // }

        let updates = this.bindInfo.reduce(
            (updates, {target, property, dependencies, compute}) => {
                // 没修改到依赖的属性，提前退出
                if (!dependencies.some(dep => changes.hasOwnProperty(dep))) {
                    return updates;
                }

                let components = updates.components;
                if (!components.has(target)) {
                    components.set(target, {});
                }

                let nodeType = getNodeType(target);
                if (nodeType === 'component') {
                    let componentData = components.get(target);
                    componentData[property] = compute(this.data);
                }
                else {
                    // 如果不是Component，则说明这一块有重绘的需求，标记一下
                    updates.requireRender = true;
                }

                return updates;
            },
            {components: new Map(), requireRender: false}
        );

        for (let [component, patch] of updates.comopnents) {
            component.setData(patch);
        }

        if (updates.requireRender) {
            scheduleRender(this);
        }
    }

    // 把实际的界面更新刷一下
    pushRender() {
        let changes = Object.entries(this.data).filter(([key, value]) => this.lastRenderData[key] !== value);
        let bindings = this.bindInfo
            .filter(({target}) => getNodeType(target) !== 'component')
            .filter(({dependencies}) => dependencies.some(dep => changes.hasOwnProperty(dep)));

        for (let {target, property, compute} of bindings) {
            let nodeType = getNodeType(target);
            let value = compute(this.data);

            switch (nodeType) {
                case 'element':
                    target.element[property] = value;
                    break;
                case 'text':
                    target.node.nodeValue = value;
                    break;
                case 'for':
                    // for怎么处理的？
                    break;
            }
        }

        this.lastRenderData = null;
    }

    // 核心方法，完全不知道怎么实现
    render() {
        // 保证模板编译就一次
        if (!this.constructor.aNode) {
            this.constructor.aNode = this.parseTemplate(this.constructor.template);
        }

        this.aNode = this.constructor.aNode;
        this.afterCompileTemplate();

        this.beforeRender(); // 生命周期
        // ... 真正的渲染，这里应该就会建立绑定关系、父子关系等
        this.afterRender(); // 生命周期

        this.initializePropertyBindings();
        this.initializeEventBindings();
    }

    initializePropertyBindings() {
        // 只用处理双绑，单绑是在setData的数据流推送里处理的，不依赖任何事件
        let dualBindings = this.bindInfo.filter(({type}) => type === 'dual');
        for (let {target, property, dependencies: [sourceProperty]} of dualBindings) {
            target.on(
                'change',
                ({changes}) => {
                    if (!changes.hasOwnProperty(property)) {
                        return;
                    }

                    let patch = {[sourceProperty]: changes[property]};
                    this.changeData(patch); // 双向绑定等于一个事件处理，所以和事件一样是会发事件的
                }
            );
        }
    }

    initializeEventBindings() {
        for (let {eventName, methodName, compiledEventHandler} of this.eventBindInfo) {
            let handler = async () => {
                let devContext = {
                    // ...这里放一堆要发给dev tool的上下文信息
                };

                let done = false;

                let output = (name, arg) => {
                    let callbackName = 'on' + pascalize(name);
                    this[callbackName] && this[callbackName](arg);
                    this.fire(name, arg);
                    this.reportOutputToDevTool(devContext, name, arg);
                };

                let resolve = action => {
                    if (done) {
                        console.warn('...');
                        return;
                    }

                    let patch = action(this.data);
                    let {newData} = this.changeData(patch); // 会发事件的，因为是内部修改数据
                    this.reportDataTransferToDevTool(devContext, newData);
                };

                let finalPatch = await compiledEventHandler.call(this, this.data, output, resolve);
                let newData = this.changeData(finalPatch);
                this.reportDataTransferToDevTool(devContext, newData);
                done = true;
            }
        }
    }

    reportOutputToDevTool(context, name, arg) {
        console.log(/* ... */);
    }

    reportDataTransferToDevTool(context, newData) {
        console.log(/* ... */);
    }
}
