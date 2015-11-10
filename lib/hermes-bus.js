/**
* hermes-bus <https://github.com/jahnestacado/hermes-bus>
* Copyright (c) 2014 Ioannis Tzanellis
* Licensed under the MIT License (MIT).
*/
var Q = require("q");
var path = require("path");
var _ = require("lodash");
var DEFAULT_BUSLINE = "main";

var eventHandlers = {};
var observerBusLines = {DEFAULT_BUSLINE: []};

var HermesBus = function(){
    var self = this;
    self.disable = _utilityBelt.buildStatusSwitch(self, DEFAULT_BUSLINE, false);
    self.enable = _utilityBelt.buildStatusSwitch(self, DEFAULT_BUSLINE, false);
    self.trigger = _utilityBelt.buildTriggerFunction(DEFAULT_BUSLINE);
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
    var buslineName = DEFAULT_BUSLINE;
    var subscribedObject;

    if(arguments.length === 2){
        buslineName = arguments[0];
        subscribedObject = arguments[1];
    } else if(arguments.length === 1){
        subscribedObject = arguments[0];
    } else{
        //throw warning
    }

    var events = self.createEventSpecs(subscribedObject);
    events.forEach(function(eventSpecs){
        var observer = self.createObserver(eventSpecs);
        observerBusLines[buslineName] ? observerBusLines[buslineName].push(observer): observerBusLines[buslineName] = [observer];
        _utilityBelt.buildNamespace(self, buslineName, eventSpecs.eventName);
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
                eventName: _utilityBelt.firstLetterToLowerCase(key.replace(new RegExp("^(on|" + SYNC_EVENT_TAG + "on)"), "")),
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
    observerBusLines[DEFAULT_BUSLINE] = [];
    Object.keys(eventHandlers[DEFAULT_BUSLINE]).forEach(function(eventName) {
        delete eventHandlers[DEFAULT_BUSLINE][eventName];
        var registeredFunctionName = _utilityBelt.eventToFunctionName(eventName);
        delete self[registeredFunctionName];
    });
};

HermesBus.prototype.hardReset = function hardReset() {
    var self = this;
    var buslines = Object.keys(observerBusLines);
    self.reset();
    buslines.forEach(function(busline) {
        _utilityBelt.destroyBusLine(self, busline);
    });
};

HermesBus.prototype.require = function require() {
    var modulePaths = Array.prototype.slice.call(arguments);
    modulePaths.forEach(function(modulePath) {
        if (modulePath.substring(0, 2) === "." + path.sep) {
            require(path.resolve(__dirname + "../../../." + modulePath));
        } else {
            require(modulePath);
        }
    });
};

var _utilityBelt = {
    buildNamespace: function buildNamespace(context, busline, eventName) {
        var self = this;
        var exportedNamespace = context;

        if (busline !== DEFAULT_BUSLINE) {
            if (!exportedNamespace[busline]) {
                exportedNamespace[busline] = _utilityBelt.buildBuslineUtils(context, busline);
            }
            exportedNamespace = exportedNamespace[busline];
        }

        self.registerEventHandler(exportedNamespace, busline, eventName);
    },
    buildBuslineUtils: function buildBuslineUtils(context, busline) {
        var utils = {
            trigger: _utilityBelt.buildTriggerFunction(busline),
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
    buildTriggerFunction: function buildTriggerFunction(busline) {
        return function() {
            var args = Array.prototype.slice.call(arguments);
            var promise = null;
            // Assign first argument to eventName variable and remove it from the args array
            var eventName = args.shift();
            if(eventHandlers[busline][eventName]){
                promise = eventHandlers[busline][eventName].apply(this, args);
            } else{
                console.log("Event " + eventName + " does not exist or it's not registered yet on the bus.");
            }

            return promise;
        };
    },
    registerEventHandler: function createTrigger(context, busline, eventName){
        if(!eventHandlers[busline]){
            eventHandlers[busline] = {};
        }

        if(!eventHandlers[busline][eventName]){
            var triggerFunctionName = _utilityBelt.eventToFunctionName(eventName);
            var triggerEventFunction = _utilityBelt.getEventHandler(context, busline, eventName);
            eventHandlers[busline][eventName] = triggerEventFunction;
            context[triggerFunctionName] = triggerEventFunction;
        }
    },
    eventToFunctionName: function eventToFunctionName(eventName){
        return "trigger" + _utilityBelt.firstLetterToUpperCase(eventName);
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
            handleExecutionOrder(observerBusLines[busline]);

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
            observerBusLines[busline].forEach(function(observer) {
                if (observer.eventName === eventName) {
                    observer.active = enabled;
                }
            });
        };
    },
    destroyBusLine: function destroyBusLine(context, busline) {
        delete observerBusLines[busline];
        delete eventHandlers[busline];
        delete context[busline];
    },
    firstLetterToUpperCase: function firstLetterToUpperCase(eventName) {
        return eventName.charAt(0).toUpperCase() + eventName.slice(1);
    },
    firstLetterToLowerCase: function firstLetterToLowerCase(eventName) {
        return eventName.charAt(0).toLowerCase() + eventName.slice(1);
    }
};

module.exports = new HermesBus();
