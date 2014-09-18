/**
 * hermes-bus <https://github.com/jahnestacado/hermes-bus>
 * Copyright (c) 2014 Ioannis Tzanellis
 * Licensed under the MIT License (MIT).
 */
var Q = require('q');

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
                element.cb(data, function() {
                    console.log("WARN - Resolve callback  ['onEvent' 2nd argument] is undefined on emitted events. Try bus.resolve"+firstLetterToUpperCase(element.event));
                });
            }
        });
    }
}

function getPromiseEventHandler(busline, event) {
    return function(data) {
        var promises = [];
        observerBusLines[busline].forEach(function(element) {
            if (element.event === event && element.active === true) {
                promises.push(createPromiseEvent(element.cb, data));
            }
        });
        return Q.all(promises);
    }
}

function createPromiseEvent(cb, arg) {
    var deferred = Q.defer();
    cb(arg, deferred.resolve);
    return deferred.promise;
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

    var emitionFunctionName = "emit" + firstLetterToUpperCase(event);
    var resolveFunctionName = "resolve" + firstLetterToUpperCase(event);
    exportedNamespace[resolveFunctionName] = getPromiseEventHandler(busline, event);
    exportedNamespace[emitionFunctionName] = getEventHandler(busline, event);
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

function firstLetterToUpperCase(event){
    return event.charAt(0).toUpperCase() + event.slice(1);
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

function subscribeEventsFrom() {
    var modulePaths = arguments;
    for (var i = 0; i <= modulePaths.length - 1; i++) {
        var modulePath = modulePaths[i];
        if (modulePath.substring(0, 2) === './') {
            require('./../.' + modulePath);
        } else {
            require(modulePath);
        }
    }
}

exports.onEvent = onEvent;
exports.getStateReport = buildReporter("main");
exports.subscribeEventsFrom = subscribeEventsFrom;