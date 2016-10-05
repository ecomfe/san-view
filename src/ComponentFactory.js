import HTMLElementComponent from './HTMLElementComponent';

export default class ComponentFactory {
    constructor(owner) {
        this.owner = owner;
    }

    fromANode(node) {
        let component = node.type === 'element'
            ? this.createHTMLElementComponent(node)
            : this.fromTagName(node.tagName);
        component.nodeContext = node;
        component.owner = this.owner;

        let childComponents = node.childs.map(node => this.fromANode(node));
        childComponents.forEach(child => component.addChild(child)) // parent关系
        childComponents.forEach(child => this.owner.addDownstream(child)); // owner关系

        return component;
    }

    createHTMLElementComponent(node) {
        let component = new HTMLElementComponent();

        return component;
    }

    fromTagName(tagName) {
        let ComponentType = this.owner.components[tagName];
        return new ComponentType();
    }
}
