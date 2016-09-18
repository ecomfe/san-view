import {Component} from 'san-view';

import template from 'text!./TodoCard.tpl.html';

import service from '../../service';
import {set} from 'san-update';

import marked from 'marked';
import moment from 'moment';

import 'css!./TodoCard.css';

export default class TodoCard extends Component {
    static template = template;

    // 因为是Immutable的，所以这里可以是个对象而不用是个函数返回新对象
    static initialState = {
        todo: {
            id: 0,
            title: '',
            content: '',
            dueDate: null,
            completed: false
        },
        editingTodo: null,
        removed: false
    };

    static filters = {
        date(date) {
            return moment(date).format('YYYY-MM-DD');
        },

        markdown(str) {
            return marked(str);
        }
    }

    // 标记为已完成
    async markComplete({id}) {
        // 如果有需要，进行异步操作
        await service.markTodoComplete(id);

        // 返回一个Action，Action会再拿到一次`(state, output)`的参数，这里只用到了`state`
        return state => set(state, ['todo', 'completed'], true);
    }

    // 删除
    async remove({id}, output, resolve) {
        // 可以在函数return前的任意时候调用`resolve`提供Action更新状态
        resolve(state => ({...state, loading: true}));

        try {
            await service.removeTodo(id);

            // return还是有，用来标识这个事件已经处理完成（这里可能就会涉及和事件处理有关的资源的回收等），
            // 另外未来对于Optimisitc UI来说，只有这个Action可以做
            return (state, output) => {
                // 这个事件等效于`on-item-change`再判断`item.removed`，但我们更推荐对于业务有独立的事件
                output('remove', id);

                // 简单的属性修改可以用Object Spread
                return {...state, removed: true};
            };
        }
        finally {
            resolve(state => ({...state, loading: false}));
        }
    }

    // 进入编辑状态
    edit() {
        return state => {
            let clone = Object.assign({}, state.todo);
            return {...state, editingTodo: clone};
        };
    }

    // 取消编辑
    cancelEdit() {
        return state => ({...state, editingTodo: null});
    }

    // 完成编辑
    async updateTodo(state, output, resolve) {
        resolve(state => ({...state, loading: true}));

        try {
            let savedTodo = await service.udpateTodo(state.editingTodo);
            return state => ({...state, todo: savedTodo, editingTodo: null});
        }
        finally {
            resolve(state => ({...state, loading: false}));
        }
    }
}
