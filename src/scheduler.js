let scheduling = false;
let updates = new Set();

let runSchedule = () => {
    scheduling = false;

    for (let component of updates) {
        component.pushRender();
    }
};

export let scheduleRender = component => {
    updates.add(component);

    if (scheduling) {
        return;
    }

    setImmediate(runSchedule);
};
