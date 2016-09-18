import {Component} from 'san-view';
import template from 'text!./TodoList.tpl.html';

import {splice} from 'san-update';

import TodoCard from '../TodoCard/TodoCard';
import TodoForm from '../TodoForm/TodoForm';
import 'css!./TodoList.css';

export default class TodoList extends Component {
    static template = template;

    static components = {
        'todo-card': TodoCard,
        'todo-form': TodoForm
    };

    static initialState = {
        todos: []
    };

    // 这里参数相当冗余T_T
    removeTodo(state, output, resolve, index) {
        return state => splice(state, 'todos', [index, 1]);
    }
}
