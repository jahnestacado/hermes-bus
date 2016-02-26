/**
* hermes-bus <https://github.com/jahnestacado/hermes-bus>
* Copyright (c) 2014 Ioannis Tzanellis
* Licensed under the MIT License (MIT).
*/
var Q = require("q");
var path = require("path");
var _ = require("underscore");
var DEFAULT_BUSLINE = "main";
var SYNC_EVENT_TAG = "__";

var eventHandlers = {};
var observerBusLines = {
    DEFAULT_BUSLINE: {
        observers: [],
        beforeHooks: [],
        afterHooks: []
    }
};

var PREFIX_KEYWORDS = ["before", "on", "after"];
var MATCHERS = PREFIX_KEYWORDS.reduce(function(matchers, keyword){
    matchers[keyword] = {
        eventMatcher : new RegExp("^"+ keyword + ".*"),
        syncEventMatcher : new RegExp("^" + SYNC_EVENT_TAG + keyword + ".*")
    };
    return matchers;
}, {});

var HermesBus = function(){
    var self = this;
    self.disable = _utilityBelt.buildStatusSwitch(DEFAULT_BUSLINE, false);
    self.enable = _utilityBelt.buildStatusSwitch(DEFAULT_BUSLINE, true);
    self.trigger = _utilityBelt.buildTriggerFunction(DEFAULT_BUSLINE);
    self.hasEvent = _utilityBelt.buildHasEventFunction(DEFAULT_BUSLINE);
};

HermesBus.prototype.createObserver = function createObserver(eventSpecs) {
    return {
        eventName: eventSpecs.eventName,
        cb: eventSpecs.cb,
        location: "Unknown",
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

    if(!observerBusLines[buslineName]){
        _utilityBelt.initBusline(buslineName);
    }

    var events = self.createEventSpecs(subscribedObject);
    events.forEach(function(eventSpecs){
        var observer = self.createObserver(eventSpecs);
        if(eventSpecs.isBeforeHook){
            observerBusLines[buslineName].beforeHooks.push(observer);
        } else if(eventSpecs.isAfterHook){
            observerBusLines[buslineName].afterHooks.push(observer);
        }else{
            observerBusLines[buslineName].observers.push(observer);
            _utilityBelt.buildNamespace(self, buslineName, eventSpecs.eventName);
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
    var eventListenerSpecs = keys.reduce(function (listeners, key) {
        if( _.isFunction(subscribedObject[key])){
            var event = null;

            PREFIX_KEYWORDS.some(function(keyword){
                var foundMatch = false;
                if (MATCHERS[keyword].eventMatcher.test(key) || MATCHERS[keyword].syncEventMatcher.test(key)) {
                    event = {
                        eventName: _utilityBelt.firstLetterToLowerCase(key.replace(new RegExp("^("+ keyword+"|" + SYNC_EVENT_TAG + keyword + ")"), "")),
                        cb: subscribedObject[key],
                        isSync: MATCHERS[keyword].syncEventMatcher.test(key),
                        isBeforeHook: keyword === "before",
                        isAfterHook: keyword === "after"
                    };
                    foundMatch = true;
                }
                return foundMatch;
            });

            if(event){
                listeners.push(event);
            }
        }

        return listeners;
    }, []);

    return eventListenerSpecs;
};

HermesBus.prototype.reset = function reset() {
    var self = this;
    observerBusLines[DEFAULT_BUSLINE] = _utilityBelt.initBusline(DEFAULT_BUSLINE);
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

HermesBus.prototype.require = function hermesBusRequire(paths) {
    var modulePaths = _.isArray(paths) ? paths : [paths];
    var cwd = process.cwd();
    modulePaths.forEach(function(modulePath) {
        require(path.join(cwd, modulePath));
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
            enable: _utilityBelt.buildStatusSwitch(busline, true),
            disable: _utilityBelt.buildStatusSwitch(busline, false),
            destroy: _utilityBelt.buildDestroyBusline(context, busline),
            hasEvent : _utilityBelt.buildHasEventFunction(busline)
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
            var promise = {
                then: function(){}
            };
            // Assign first argument to eventName variable and remove it from the args array
            var eventName = args.shift();
            if(eventHandlers[busline][eventName]){
                promise = eventHandlers[busline][eventName].cb.apply(this, args);
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

            var executeBeforeHooks = _utilityBelt.getEventHandler(busline, eventName, "before");
            var executeEvent = _utilityBelt.getEventHandler(busline, eventName);
            var executeAfterHooks = _utilityBelt.getEventHandler(busline, eventName, "after");

            var triggerEventFunction = function(){
                var defer = Q.defer();
                var promise = defer.promise;
                if(eventHandlers[busline][eventName].isActive){
                    //on-event callback arguments to array
                    var args = Array.prototype.slice.call(arguments);
                    executeBeforeHooks(args).then(function(){
                        executeEvent(args).then(function(){
                            defer.resolve();
                            executeAfterHooks(args);
                        });
                    });
                } else{
                    defer.resolve();
                }
                return promise;
            };

            eventHandlers[busline][eventName] = {
                cb: triggerEventFunction,
                isActive : true
            };
            context[triggerFunctionName] = triggerEventFunction;
        }
    },
    eventToFunctionName: function eventToFunctionName(eventName){
        return "trigger" + _utilityBelt.firstLetterToUpperCase(eventName);
    },
    getEventHandler: function getEventHandler(busline, eventName, hookType) {
        return function (args) {
            var promises = [];
            var executionCycleDeffered = Q.defer();
            promises.push(executionCycleDeffered);

            var registeredEvents;
            if(hookType){
                registeredEvents = observerBusLines[busline][hookType + "Hooks"];
            } else{
                registeredEvents = observerBusLines[busline].observers;
            }

            var handleExecutionOrder = function (observers) {
                var currentObserver = observers[0];
                var remainingObservers = _.without(observers, currentObserver);

                if (observers.length === 0) {
                    executionCycleDeffered.resolve();
                }else if (currentObserver.eventName === eventName) {
                    if (currentObserver.isSync) {
                        promises.push(_utilityBelt.createPromiseEvent(currentObserver, args));
                    } else {
                        currentObserver.cb.apply(currentObserver, args);
                    }
                    handleExecutionOrder(remainingObservers);
                } else{
                    handleExecutionOrder(remainingObservers);
                }
            };
            handleExecutionOrder(registeredEvents);

            return Q.all(promises);
        };
    },
    createPromiseEvent: function createPromiseEvent(element, args) {
        var deferred = Q.defer();

        var appliedArgs = args.slice(0);
        appliedArgs.push(deferred.resolve);
        element.cb.apply(element, appliedArgs);

        return deferred.promise;
    },
    buildStatusSwitch: function buildStatusSwitch(busline, isActive) {
        return function(eventName) {
            eventHandlers[busline][eventName].isActive = isActive;
        };
    },
    buildHasEventFunction: function(buslineName){
        return function(eventName){
            return (eventHandlers[buslineName] && eventHandlers[buslineName][eventName]) ? true : false;
        };
    },
    destroyBusLine: function destroyBusLine(context, busline) {
        delete observerBusLines[busline];
        delete eventHandlers[busline];
        delete context[busline];
    },
    initBusline: function initBusline(buslineName){
        observerBusLines[buslineName] = {
            observers: [],
            beforeHooks: [],
            afterHooks: []
        };
    },
    firstLetterToUpperCase: function firstLetterToUpperCase(eventName) {
        return eventName.charAt(0).toUpperCase() + eventName.slice(1);
    },
    firstLetterToLowerCase: function firstLetterToLowerCase(eventName) {
        return eventName.charAt(0).toLowerCase() + eventName.slice(1);
    }
};

module.exports = new HermesBus();
