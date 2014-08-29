
var observerBusLines = {
    main: []
};

function createObserver(context, event, cb) {
    return {
        context: context,
        event: event,
        cb: cb,
        active: true
    }
}


function getBusline(eventMsg) {
    var busline = eventMsg.split('-')[0];
    if (busline === "" || busline[0] !== '#') {
        busline = "#main";
    }
    return busline.slice(1);
}


function onEvent(context, event, cb) {
    var busline = getBusline(event);
    if (busline !== "main") {
        event = event.split('-')[1];
    }
    if (observerBusLines[busline]) {
        observerBusLines[busline].push(createObserver(context, event, cb));
        eventHandlerBuilder(this, getNamespaceInfo(busline, event));
    }
    else {
        observerBusLines[busline] = [createObserver(context, event, cb)];
        eventHandlerBuilder(this, getNamespaceInfo(busline, event));
    }
}


function getNamespaceInfo(busline, event) {
    var infoHolder = {};
    infoHolder.busline = busline;
    infoHolder.event = event;
    infoHolder.namespaceElements = []

    if (busline === "main") {
        infoHolder.namespaceElements.push(event);
    } else {
        infoHolder.namespaceElements = [busline, event];
    }

    return infoHolder;
}

function eventHandlerBuilder(moduleContext, namespaceInfos) {
    var exportsBuilder = exports;
    var namespaceElements = namespaceInfos.namespaceElements;
    
    function createNamespace(context, element) {
        if (namespaceElements.length === 0) {
            context[element] = getEventHandler(namespaceInfos.busline, namespaceInfos.event);
            exportsBuilder[element] = context[element];
        } else {
            if (!context[element]) {
                context[element] = {};
            }
            exportsBuilder = exportsBuilder[element];
            createNamespace(context[element], namespaceElements.shift());
        }
    }
    createNamespace(moduleContext, namespaceElements.shift())
}

function getEventHandler(busline, event) {
    return function(data) {
        for (var i = 0; i <= observerBusLines[busline].length - 1; i++) {
            if (observerBusLines[busline][i].event === event && observerBusLines[busline][i].active === true) {
                observerBusLines[busline][i].cb(data);
            }
        }
    }
}

function deactivate(context) {
    onContextFound(context, function(con) {
        con.active = false;
    });
}

function onContextFound(context, cb) {
    var keys = Object.keys(observerBusLines);
    keys.forEach(function(key) {
        for (var i = 0; i <= observerBusLines[key].length - 1; i++) {
            if (observerBusLines[key][i].context === context) {
                cb(observerBusLines[key][i]);
            }
        }
    });
}

function reactivate(context) {
    onContextFound(context, function(con) {
        con.active = true;
    });
}


exports.onEvent = onEvent;
exports.reactivate = reactivate;
exports.deactivate = deactivate;