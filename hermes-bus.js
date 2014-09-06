
var observerBusLines = {
    main: []
};

function createObserver(event, cb) {
    return {
        event: event,
        cb: cb,
        location: "Unknown",
        active: true
    }
}

function getBusline(eventMsg) {
    var busline = eventMsg.split('-')[0];
    if (busline !== "" && busline[0] === '#') {
        return busline.slice(1);
    }
    return  busline = "main";
}

function onEvent(busline, event, cb) {
    if (typeof (busline) !== typeof (event)) {
        cb = event;
        event = busline;
        busline = 'main';
    }
    var observer = createObserver(event, cb);
    if (observerBusLines[busline]) {
        observerBusLines[busline].push(observer);
        buildNamespace(busline, event);
    } else {
        observerBusLines[busline] = [observer];
        buildNamespace(busline, event);
    }

    return {
        registerLocation: function(path) {
            observer.location = path;
        }
    }
}

function getEventHandler(busline, event) {
    return function(data) {
        observerBusLines[busline].forEach(function(element) {
            if (element.event === event && element.active === true) {
                element.cb(data);
            }
        });
    }
}

function buildNamespace(busline, event) {
    var exportedNamespace = exports;
    if (busline !== 'main') {
        if (!exportedNamespace[busline]) {
            exportedNamespace[busline] = {};
            exportedNamespace[busline].getStateReport = buildReporter(busline);
            exportedNamespace[busline].activateEvent = buildStatusSwitch(busline, true);
            exportedNamespace[busline].deactivateEvent = buildStatusSwitch(busline, false);
        }
        exportedNamespace = exportedNamespace[busline];
    } else {
        exportedNamespace.activateEvent = buildStatusSwitch(busline, true);
        exportedNamespace.deactivateEvent = buildStatusSwitch(busline, false);
    }

    var functionName = "emit" + event.charAt(0).toUpperCase() + event.slice(1);
    exportedNamespace[functionName] = getEventHandler(busline, event);
}

function buildStatusSwitch(busline, enabled) {
    return function(event) {
        observerBusLines[busline].forEach(function(observer) {
            if (observer.event === event) {
                observer.active = enabled;
            }
        });
    }
}

function buildReporter(busline) {
    return function() {
        var report = charAppender('*', busline.length + 14) + '\n' + "*" + "  Busline: " + busline + "  *" + '\n' + charAppender('*', busline.length + 14) + '\n\n';
        var counter = 0;
        observerBusLines[busline].forEach(function(observer) {
            report += "#" + ++counter + charAppender('-', 5) + '\n' +
                    "Location: " + observer.location + '\n' +
                    "Event: " + observer.event + '\n' +
                    "Active: " + observer.active + '\n' +
                    "Callback: " + observer.cb + '\n\n';
        });
        return report;
    }
}

function charAppender(char, times) {
    var string = char;
    for (var i = 1; i <= times; i++) {
        string += char;
    }
    return string;
}

exports.onEvent = onEvent;
exports.getStateReport = buildReporter("main");