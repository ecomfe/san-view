import ComponentBase from './ComponentBase';
import ComponentFactory from './ComponentFactory';
import uid from './uid';

let stumpHTML = name => `<script id="${name}" type="san/stump"></script>`;

export default class ForDirective extends ComponentBase {

    // 列表的绑定关系
    listAlias;

    // 循环中每一项的变量名称
    itemAlias;

    // 循环中索引的变量名称
    indexAlias;

    itemTrack = new Map();

    initData() {
        return {
            list: [],
            scope: {}
        };
    }

    updateScope(newScope, patch = newScope) {
        let newData = {
            scope: newScope,
            list: newScope[this.listAlias]
        };
        return this.setData(newData);
    }

    setData(partialData) {
        // 先不实现效率算法，每次都干掉重来
        this.disposeChildren();

        let result = super.setData(partialData);

        for (let i = 0; i < this.data.list.length; i++) {
            let itemScope = Object.create(this.data.scope);
            itemScope[this.itemAlias] = this.data.list[i];
            itemScope[this.indexAlias] = i;

            // 当前只允许一个节点上放循环
            let component = this.factory.fromANode(this.nodeContext.childs[0]);
            this.addDownstream(component);
            component.updateScope(itemScope);
        }

        if (this.start) {
            let html = this.downstreams.map(child => child.toHTML()).join('');
            this.start.insertAdjacentHTML('afterEnd', html);
            for (let child of this.downstreams) {
                child.reviveAsCreated();
            }
        }

        return result;
    }

    toHTML() {
        let html = stumpHTML(this.startStump);
        for (let child of this.downstreams) {
            html += child.toHTML();
        }
        html += stumpHTML(this.endStump);
        return html;
    }

    createStructure() {
        this.startStump = uid();
        this.endStump = uid();
    }

    reviveAsCreated() {
        if (!this.start) {
            this.start = document.getElementById(this.startStump);
            this.end = document.getElementById(this.endStump);
        }

        super.reviveAsCreated();
    }

    disposeChildren() {
        if (!this.start) {
            return;
        }

        for (let child of this.downstreams) {
            child.dispose();
        }
        this.downstreams = [];

        while (this.start.nextSibling !== this.end) {
            this.start.nextSibling.remove();
        }
    }
}
