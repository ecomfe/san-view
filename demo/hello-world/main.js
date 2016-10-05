import {render} from 'san-view/main';
import Component from 'san-view/Component';

class TextBox extends Component {

    // <input value="{{value}}">
    static aNode = {
        type: 'element',
        tagName: 'input',
        binds: [
            {name: 'value', expression: '{{value}}', dependencies: ['value']}
        ],
        childs: []
    };
}

class App extends Component {

    // <div id="test">
    //     <span id="text"></span>
    //     <san-text-box value="{{text}}" />
    // </div>
    static aNode = {
        type: 'element',
        tagName: 'div',
        id: 'test',
        binds: [],
        childs: [
            {
                type: 'element',
                tagName: 'span',
                id: 'text',
                binds: [],
                childs: []
            },
            {
                type: 'component',
                tagName: 'san-text-box',
                binds: [
                    {name: 'value', expression: '{{text}}', dependencies: ['text']}
                ],
                childs: []
            }
        ]
    };

    initData() {
        return {
            text: 'abc'
        }
    }

    components = {
        'san-text-box': TextBox
    }
}

console.time('init');
let component = render(App, document.getElementById('page'));
console.timeEnd('init');
console.log(component);

setTimeout(()=> {
    console.time('test');
    component.setData({text: 'xyz'});
    console.timeEnd('test');
}, 1000);
