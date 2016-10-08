import HTMLElementComponent from './HTMLElementComponent';
import ForDirective from './ForDirective';

export default class ComponentFactory {
    constructor(owner) {
        this.owner = owner;
    }

    fromANode(node) {
        let component = createComponentFromNode(node);
        component.nodeContext = node;
        component.owner = this.owner;

        let childComponents = node.childs.map(node => this.fromANode(node));
        childComponents.forEach(child => component.addChild(child)) // parent关系
        childComponents.forEach(child => this.owner.addDownstream(child)); // owner关系

        return component;
    }

    createComponentFromNode(node) {
        switch (node.type) {
            case 'element':
                return new HTMLElementComponent();
            case 'for':
                return new ForDirective();
            default:
                let ComponentType = this.owner.components[tagName];
                return new ComponentType();
        }
    }
}
