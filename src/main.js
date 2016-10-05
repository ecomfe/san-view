export let render = (ComponentType, container) => {
    let component = new ComponentType();
    component.attach(container);
    return component;
};
