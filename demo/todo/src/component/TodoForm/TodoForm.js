import {Component} from 'san-view';

import template from 'text!./TodoForm.tpl.html';

import Calendar from 'san-view-calendar';

import 'css!./TodoCard.css';

export default class TodoForm extends Component {
    static template = template;

    static components = {
        calendar: Calendar
    };

    // 因为是Immutable的，所以这里可以是个对象而不用是个函数返回新对象
    static initialState = {
        todo: {
            id: 0,
            title: '',
            content: '',
            dueDate: null,
            completed: false
        }
    };

    submit(state, output) {
        output('submit');
    }

    cancel(state, output) {
        output('cancel');
    }
}
