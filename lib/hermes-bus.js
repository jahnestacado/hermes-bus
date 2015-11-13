/**
* hermes-bus <https://github.com/jahnestacado/hermes-bus>
* Copyright (c) 2014 Ioannis Tzanellis
* Licensed under the MIT License (MIT).
*/
var Q = require("q");
var path = require("path");
var _ = require("lodash");
var DEFAULT_BUSLINE = "main";

var HermesBus = function(){
    var self = this;
    self.observerBusLines= {DEFAULT_BUSLINE: []};
    self.mainBusLineRegisteredFunctions = [];
    self.disable = _utilityBelt.buildStatusSwitch(self, DEFAULT_BUSLINE, false);
    self.enable = _utilityBelt.buildStatusSwitch(self, DEFAULT_BUSLINE, false);
};

HermesBus.prototype.createObserver = function createObserver(eventSpecs) {
    return {
        eventName: eventSpecs.eventName,
        cb: eventSpecs.cb,
        location: "Unknown",
        active: true,
        isSync: eventSpecs.isSync
    };
};

HermesBus.prototype.subscribe =  function subscribe() {
    var self = this;
    var busline = DEFAULT_BUSLINE;
    var subscribedObject;

    if(arguments.length === 2){
        busline = arguments[0];
        subscribedObject = arguments[1];
    } else if(arguments.length === 1){
        subscribedObject = arguments[0];
    } else{
        //throw warning
    }

    var events = self.createEventSpecs(subscribedObject);
    events.forEach(function(eventSpecs){
        var observer = self.createObserver(eventSpecs);
        if (self.observerBusLines[busline]) {
            self.observerBusLines[busline].push(observer);
            _utilityBelt.buildNamespace(self, busline, eventSpecs.eventName);
        } else {
            self.observerBusLines[busline] = [observer];
            _utilityBelt.buildNamespace(self, busline, eventSpecs.eventName);
        }
    });

    return {
        registerLocation: function(path) {
            observer.location = path;
        }
    };
};

HermesBus.prototype.createEventSpecs = function (subscribedObject) {
    var keys = Object.keys(subscribedObject);
    var SYNC_EVENT_TAG = "__";

    var eventListenerSpecs = keys.reduce(function (listeners, key) {
        var eventNameMatcher = new RegExp(/^on.*/);
        var syncEventNameMatcher = new RegExp("^" + SYNC_EVENT_TAG + "on.*");

        if ((eventNameMatcher.test(key) || syncEventNameMatcher.test(key)) && _.isFunction(subscribedObject[key])) {
            var event = {
                eventName: key.replace(new RegExp("^(on|" + SYNC_EVENT_TAG + "on)"), ""),
                cb: subscribedObject[key],
                isSync: syncEventNameMatcher.test(key)
            };
            listeners.push(event);
        }
        return listeners;
    }, []);

    return eventListenerSpecs;
};

HermesBus.prototype.reset = function reset() {
    var self = this;
    self.observerBusLines[DEFAULT_BUSLINE] = [];
    self.mainBusLineRegisteredFunctions.forEach(function(funcName) {
        self[funcName] = undefined;
    });
    self.mainBusLineRegisteredFunctions = [];
};

HermesBus.prototype.hardReset = function hardReset() {
    var self = this;
    var buslines = Object.getOwnPropertyNames(self.observerBusLines);
    buslines.forEach(function(busline) {
        _utilityBelt.destroyBusLine(self, busline);
    });
    self.reset();
};

HermesBus.prototype.require = function require() {
    var modulePaths = Array.prototype.slice.call(arguments);
    modulePaths.forEach(function(modulePath) {
        if (modulePath.substring(0, 2) === "." + path.sep) {
            require("." + path.sep + ".." + path.sep + ".." + path.sep + "." + modulePath);
        } else {
            require(modulePath);
        }
    });
};

var _utilityBelt = {
    buildNamespace: function buildNamespace(context, busline, eventName) {
        var triggerFunctionName = "trigger" + _utilityBelt.firstLetterToUpperCase(eventName);
        var exportedNamespace = context;

        if (busline !== DEFAULT_BUSLINE) {
            if (!exportedNamespace[busline]) {
                exportedNamespace[busline] = _utilityBelt.buildBuslineUtils(context, busline);
            }
            exportedNamespace = exportedNamespace[busline];
        } else {
            exportedNamespace.mainBusLineRegisteredFunctions.push(triggerFunctionName);
        }

        exportedNamespace[triggerFunctionName] = _utilityBelt.getEventHandler(context, busline, eventName);
    },
    buildBuslineUtils: function buildBuslineUtils(context, busline) {
        var utils = {
            enable: _utilityBelt.buildStatusSwitch(context, busline, true),
            disable: _utilityBelt.buildStatusSwitch(context, busline, false),
            destroy: _utilityBelt.buildDestroyBusline(context, busline)
        };
        return utils;
    },
    buildDestroyBusline: function buildDestroyBusline(context, busline) {
        return function() {
            _utilityBelt.destroyBusLine(context, busline);
        };
    },
    getEventHandler: function getEventHandler(context, busline, eventName) {
        return function () {
            //on-event callback arguments to array
            var args = Array.prototype.slice.call(arguments);
            var executionCycleDeffered = Q.defer();
            var finalPromise = executionCycleDeffered.promise;

            var handleExecutionOrder = function (observers) {
                var currentObserver = observers[0];
                var remainingObservers = _.without(observers, currentObserver);

                if (observers.length === 0) {
                    executionCycleDeffered.resolve();
                }else if (currentObserver.eventName === eventName && currentObserver.active === true) {
                    if (currentObserver.isSync) {
                        _utilityBelt.createPromiseEvent(currentObserver, args).then(function () {
                            handleExecutionOrder(remainingObservers);
                        });
                    } else {
                        currentObserver.cb.apply(currentObserver, args);
                        handleExecutionOrder(remainingObservers);
                    }
                } else{
                    handleExecutionOrder(remainingObservers);
                }
            };
            handleExecutionOrder(context.observerBusLines[busline]);

            return finalPromise;
        };
    },
    createPromiseEvent: function createPromiseEvent(element, args) {
        var deferred = Q.defer();

        var appliedArgs = args.slice(0);
        appliedArgs.push(deferred.resolve);
        element.cb.apply(element, appliedArgs);

        return deferred.promise;
    },
    buildStatusSwitch: function buildStatusSwitch(context, busline, enabled) {
        return function(eventName) {
            context.observerBusLines[busline].forEach(function(observer) {
                if (observer.eventName === eventName) {
                    observer.active = enabled;
                }
            });
        };
    },
    destroyBusLine: function destroyBusLine(context, busline) {
        delete context.observerBusLines[busline];
        delete context[busline];
    },
    firstLetterToUpperCase: function firstLetterToUpperCase(eventName) {
        return eventName.charAt(0).toUpperCase() + eventName.slice(1);
    }
};

module.exports = new HermesBus();
