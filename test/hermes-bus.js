/**
 * hermes-bus <https://github.com/jahnestacado/hermes-bus>
 * Copyright (c) 2014 Ioannis Tzanellis
 * Licensed under the MIT License (MIT).
 */

var assert = require("assert");
var bus = require("./..");
var sinon = require("sinon");

describe('integration tests for hermes-bus module', function() {

    describe("emit events", function() {

        var firstCallback = sinon.spy();
        var secondCallback = sinon.spy();

        bus.onEvent("firstEvent", firstCallback);
        bus.onEvent("secondEvent", secondCallback);

        describe('invocation of bus.emitFirstEvent', function() {
            var dummyObject = {isDummy: true};

            before(function() {
                bus.emitFirstEvent(dummyObject);
            });

            it('should invoke firstCallback once', function() {
                assert(firstCallback.calledOnce);
            });

            it("should invoke firstCallback with the right argument", function() {
                assert(firstCallback.calledWith(dummyObject));
            });

            it('should not invoke secondCallback', function() {
                assert(firstCallback.calledOnce, false);
            });

            describe('invocation of bus.emitSecondEvent', function() {
                var dummyObject2 = {isDummy: true};

                before(function() {
                    bus.emitSecondEvent(dummyObject);
                });

                it('should invoke secondCallback once', function() {
                    assert(secondCallback.calledOnce);
                });

                it("should invoke secondCallback with the right argument", function() {
                    assert(secondCallback.calledWith(dummyObject2));
                });

                it('should not invoke firstCallback again', function() {
                    assert(firstCallback.calledOnce);
                });

                describe('create "red busline" ', function() {
                    var thirdCallback = sinon.spy();
                    bus.onEvent("red", "firstEvent", thirdCallback);

                    describe('invocation of bus.red.emitFirstEvent', function() {
                        var dummyObject3 = {isDummy: true};

                        before(function() {
                            bus.red.emitFirstEvent(dummyObject3);
                        });

                        it('should invoke thirdCallback once', function() {
                            assert(thirdCallback.calledOnce);
                        });

                        it("should invoke thirdCallback with the right argument", function() {
                            assert(thirdCallback.calledWith(dummyObject3));
                        });

                        it('should not invoke firstCallback again', function() {
                            assert(firstCallback.calledOnce);
                        });

                        it('should not invoke secondCallback again', function() {
                            assert(secondCallback.calledOnce);
                        });

                        describe('disable and emit thirdEvent of "red" busline', function() {

                            before(function() {
                                bus.red.deactivateEvent("firstEvent");
                                bus.red.emitFirstEvent();
                            });

                            it('should not invoke thirdCallback again', function() {
                                assert(thirdCallback.calledOnce);
                            });

                            it('should not invoke firstCallback again', function() {
                                assert(firstCallback.calledOnce);
                            });

                            it('should not invoke secondCallback again', function() {
                                assert(secondCallback.calledOnce);
                            });

                            describe('re-enable and emit thirdEvent of "red" busline', function() {

                                before(function() {
                                    bus.red.activateEvent("thirdEvent");
                                    bus.red.emitFirstEvent();
                                });

                                it('should invoke thirdCallback for second time', function() {
                                    assert(thirdCallback.callCount, 2);
                                });

                                it('should not invoke firstCallback again', function() {
                                    assert(firstCallback.calledOnce);
                                });

                                it('should not invoke secondCallback again', function() {
                                    assert(secondCallback.calledOnce);
                                });

                            });

                        });

                    });
                });

            });

        });

        describe('resolve events', function() {
            function getRandomInt(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            function cbAdd(a, b) {
                return a + b;
            }
            function cbMul(a, b) {
                return a * b;
            }

            function cbDiv(a, b) {
                return a / b;
            }


            function getDelayedAsyncFunc(cb, delay) {
                return    function asyncFunc(arg, resolve) {
                    setTimeout(function() {
                        resolve(cb(arg.a, arg.b));
                    }, delay);
                }
            }

            bus.onEvent("syncLine", "forthEvent", getDelayedAsyncFunc(cbAdd, getRandomInt(500)));
            bus.onEvent("syncLine", "forthEvent", getDelayedAsyncFunc(cbMul, getRandomInt(500)));
            bus.onEvent("syncLine", "forthEvent", getDelayedAsyncFunc(cbDiv, getRandomInt(500)));

            describe('invocation of bus.syncLine.resolveForthEvent with use of .then()', function() {
                var dummyObject4 = {a: 566, b: 5};
                var results;
                before(function(done) {
                    bus.syncLine.resolveForthEvent(dummyObject4)
                            .then(function(output) {
                                results = output;
                                done();
                            });
                });

                it('first element of "results" should be equal to 571', function() {
                    assert(results[0], '571');
                });

                it('second element of "results" should be equal to 2830', function() {
                    assert(results[1], '2830');
                });

                it('first element of "results" should be equal to 113.2', function() {
                    assert(results[2], '113.2');
                });

            });

        });

    });

});