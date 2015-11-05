/**
 * hermes-bus <https://github.com/jahnestacado/hermes-bus>
 * Copyright (c) 2014 Ioannis Tzanellis
 * Licensed under the MIT License (MIT).
 */
var Q = require("q");
var path = require("path");
var _ = require("lodash");

var HermesBus = {
    observerBusLines: {main: []},
    mainBusLineRegisteredFunctions: [],
    createObserver: function createObserver(eventName, cb) {
        return {
            event: eventName,
            cb: cb,
            location: "Unknown",
            active: true
        };
    },
    activate: function activate() {
        return _utilityBelt.buildStatusSwitch(this, 'main', true);
    },
    deactivate: function deactivate() {
        return _utilityBelt.buildStatusSwitch(this, 'main', false);
    },
    subscribe: function on() {
        var self = this;
        var busline = 'main';
		var subscribedObject;

		if(arguments.length === 2){
			busline = arguments[0];
			subscribedObject = arguments[1];
		} else if(arguments.length === 1){
			subscribedObject = arguments[0];
		} else{
			//throw warning
		}

		var events = self.createEvents(subscribedObject);
		events.forEach(function(eventSpecs){
			var event = eventSpecs.event;
			var cb = eventSpecs.cb;
			var observer = self.createObserver(event, cb);
			if (self.observerBusLines[busline]) {
				self.observerBusLines[busline].push(observer);
				_utilityBelt.buildNamespace(self, busline, event);
			} else {
				self.observerBusLines[busline] = [observer];
				_utilityBelt.buildNamespace(self, busline, event);
			}
		});

//        return {
//            registerLocation: function(path) {
//                observer.location = path;
//            }
//        };
    },
	createEvents: function (subscribedObject) {
		var keys = Object.keys(subscribedObject);
		var eventListenerSpecs = keys.filter(function (key) {
			return _.startsWith(key, "on") && _.isFunction(subscribedObject[key]);
		}).map(function (eventListenerKey) {
			return {
				event: eventListenerKey.replace(/on/, ""),
				cb: subscribedObject[eventListenerKey]
			}
		});
		return eventListenerSpecs;
	},
    reset: function reset() {
        var self = this;
        self.observerBusLines['main'] = [];
        self.mainBusLineRegisteredFunctions.forEach(function(funcName) {
            self[funcName] = undefined;
        });
        self.mainBusLineRegisteredFunctions = [];
    },
    hardReset: function hardReset() {
        var self = this;
        var buslines = Object.getOwnPropertyNames(this.observerBusLines);
        buslines.forEach(function(busline) {
            _utilityBelt.destroyBusLine(self, busline);
        });
        self.reset();
    },
    require: function hermesBusRequire() {
        var modulePaths = Array.prototype.slice.call(arguments);
        modulePaths.forEach(function(modulePath) {
            if (modulePath.substring(0, 2) === "." + path.sep) {
                require("." + path.sep + ".." + path.sep + ".." + path.sep + "." + modulePath);
            } else {
                require(modulePath);
            }
        });
    }
};

var _utilityBelt = {
    buildNamespace: function buildNamespace(context, busline, event) {
        var triggerFunctionName = "trigger" + _utilityBelt.firstLetterToUpperCase(event);
        var resolveFunctionName = "resolve" + _utilityBelt.firstLetterToUpperCase(event);

        var exportedNamespace = context;
        if (busline !== 'main') {
            if (!exportedNamespace[busline]) {
                exportedNamespace[busline] = _utilityBelt.buildBuslineUtils(context, busline);
            }
            exportedNamespace = exportedNamespace[busline];
        } else {
            exportedNamespace.mainBusLineRegisteredFunctions.push(triggerFunctionName, resolveFunctionName);
        }

        exportedNamespace[resolveFunctionName] = _utilityBelt.getPromiseEventHandler(context, busline, event);
        exportedNamespace[triggerFunctionName] = _utilityBelt.getEventHandler(context, busline, event);
    },
    buildBuslineUtils: function buildBuslineUtils(context, busline) {
        var utils = {
            activate: _utilityBelt.buildStatusSwitch(context, busline, true),
            deactivate: _utilityBelt.buildStatusSwitch(context, busline, false),
            destroy: _utilityBelt.buildDestroyBusline(context, busline)
        };
        return utils;
    },
    buildDestroyBusline: function buildDestroyBusline(context, busline) {
        return function() {
            _utilityBelt.destroyBusLine(context, busline);
        }
    },
    getEventHandler: function getEventHandler(context, busline, event) {
        return function() {
            //on-event-callback-arguments to array
            var args = Array.prototype.slice.call(arguments);
            args.push(function() {
                console.log("WARN - 'resolve' callback is undefined on triggered event '" + event + "'. Try bus.resolve" + _utilityBelt.firstLetterToUpperCase(event) + "(...)");
            });

			context.observerBusLines[busline].forEach(function(element) {
                if (element.event === event && element.active === true) {
                    element.cb.apply(element, args);
                }
            });
        }
    },
    getPromiseEventHandler: function getPromiseEventHandler(context, busline, event) {
        return function() {
            //on-event callback arguments to array
            var args = Array.prototype.slice.call(arguments);
            var promises = [];

            context.observerBusLines[busline].forEach(function(observer) {
                if (observer.event === event && observer.active === true) {
                    promises.push(_utilityBelt.createPromiseEvent(observer, args));
                }
            });
            return Q.all(promises);
        }
    },
    createPromiseEvent: function createPromiseEvent(element, args) {
        var deferred = Q.defer();

        var appliedArgs = args.slice(0);
        appliedArgs.push(deferred.resolve)
        element.cb.apply(element, appliedArgs);

        return deferred.promise;
    },
    buildStatusSwitch: function buildStatusSwitch(context, busline, enabled) {
        return function(event) {
            context.observerBusLines[busline].forEach(function(observer) {
                if (observer.event === event) {
                    observer.active = enabled;
                }
            });
        }
    },
    destroyBusLine: function destroyBusLine(context, busline) {
        delete context.observerBusLines[busline];
        delete context[busline];
    },
    firstLetterToUpperCase: function firstLetterToUpperCase(event) {
        return event.charAt(0).toUpperCase() + event.slice(1);
    }
};

module.exports = HermesBus;