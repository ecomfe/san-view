import {Component} from 'san-view';
import template from 'text!./App.tpl.html';

import service from '../../service';

import {chain} from 'san-update';

import TodoList from '../TodoList/TodoList';
import TodoForm from '../TodoForm/TodoForm';
import sticky from '../../transformers/sticky';

import 'css!./App.css';

export default class App extends Component {
    static template = template;

    static components = {
        'todo-list': TodoList,
        'todo-form': TodoForm
    };

    static transformers = {
        // 如果组件上写`be-sticky`则相当于使用sticky()(组件)作为真实的类型
        sticky: sticky
    };

    static initialState = {
        todos: [],
        create: false,
        cancelCreate: false,
        newTodo: {},
        loading: false
    };

    // 用这个阶段来拉取数据
    async afterMount() {
        let todos = await service.fetchTodos();
        // 生命周期的函数并不是无状态的，只能用`this`
        this.setState({todos});
    }

    createTodo() {
        return state => ({...state, createNew: true});
    }

    async addTodo(state, output, resolve) {
        resolve(state => ({...state, loading: true}));

        try {
            let newTodo = await service.addNewTodo(state.newTodo);

            return state => chain(state).set('createNew', false).set('newTodo', {}).push('todos', newTodo).value();
        }
        finally {
            resolve(state => ({...state, loading: false}));
        }
    }

    cancelCreate() {
        return state => ({...state, createNew: false});
    }
}
