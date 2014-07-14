



var observerBusLines = {
    default: []
};

function createObserver(context, event, cb) {
    return {
        context: context,
        event: event,
        cb: cb,
        active: true
    }
};


function emit(event, data) {
    var busline = getBusline(event);
    for (var i = 0; i <= observerBusLines[busline].length - 1; i++) {
        if (observerBusLines[busline][i].event === event && observerBusLines[busline][i].active === true) {
            observerBusLines[busline][i].cb(data);
        }
    }
}

function onEvent(context, event, cb) {
    var busline = getBusline(event);
    if (observerBusLines[busline]) {
        observerBusLines[busline].push(createObserver(context, event, cb));
    }
    else {
        observerBusLines[busline] = [createObserver(context, event, cb)]
    }
}


function getBusline(eventMsg) {
    var busline = eventMsg.split('-')[0];
    if (busline === "") {
        return "default"
    }
    return busline;
}


function deactivate(context) {
    onContextFound(context, false);
}

function reactivate(context) {
    onContextFound(context, true);
}

function onContextFound(context, flag) {
    var keys = Object.keys(observerBusLines);
    keys.forEach(function(key) {
        for (var i = 0; i <= observerBusLines[key].length - 1; i++) {
            if (observerBusLines[key][i].context === context) {
                observerBusLines[key][i].active = flag;
            }
        }
    });
}


exports.emit = emit;
exports.onEvent = onEvent;
exports.reactivate = reactivate;
exports.deactivate = deactivate;