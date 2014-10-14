/**
 * hermes-bus <https://github.com/jahnestacado/hermes-bus>
 * Copyright (c) 2014 Ioannis Tzanellis
 * Licensed under the MIT License (MIT).
 */

var assert = require("assert");
var bus = require("./..");
var sinon = require("sinon");

describe('#################### Start integration tests for hermes-bus module \n', function() {

    describe("emit events", function() {

        var firstEventCallback = sinon.spy();
        var secondEventCallback = sinon.spy();

        bus.onEvent("firstEvent", firstEventCallback);
        bus.onEvent("secondEvent", secondEventCallback);

        describe('invocation of bus.emitFirstEvent', function() {
            var firstEventArg1 = {isDummy: true};
            var firstEventArg2 = "frrrrr";
            var firstEventArg3 = 639;

            before(function() {
                bus.emitFirstEvent(firstEventArg1, firstEventArg2, firstEventArg3);
            });

            it('should invoke firstCallback once', function() {
                assert(firstEventCallback.calledOnce);
            });

            it("should invoke firstCallback with the right argument", function() {
                assert(firstEventCallback.calledWith(firstEventArg1, firstEventArg2, firstEventArg3));
            });

            it('should not invoke secondCallback', function() {
                assert(firstEventCallback.calledOnce, false);
            });

            describe('invocation of bus.emitSecondEvent', function() {
                var secondEventArg1 = {isDummy: true};
                var secondEventArg2 = [3, 5, 6, ["4"]];

                before(function() {
                    bus.emitSecondEvent(firstEventArg1, secondEventArg2);
                });

                it('should invoke secondCallback once', function() {
                    assert(secondEventCallback.calledOnce);
                });

                it("should invoke secondCallback with the right argument", function() {
                    assert(secondEventCallback.calledWith(secondEventArg1, secondEventArg2));
                });

                it('should not invoke firstCallback again', function() {
                    assert(firstEventCallback.calledOnce);
                });

                describe('create "red busline" ', function() {
                    var thirdEventCallback = sinon.spy();
                    bus.onEvent("red", "firstEvent", thirdEventCallback);

                    describe('invocation of bus.red.emitFirstEvent', function() {
                        var thirdEventArg1 = {isDummy: true};

                        before(function() {
                            bus.red.emitFirstEvent(thirdEventArg1);
                        });

                        it('should invoke thirdCallback once', function() {
                            assert(thirdEventCallback.calledOnce);
                        });

                        it("should invoke thirdCallback with the right argument", function() {
                            assert(thirdEventCallback.calledWith(thirdEventArg1));
                        });

                        it('should not invoke firstCallback again', function() {
                            assert(firstEventCallback.calledOnce);
                        });

                        it('should not invoke secondCallback again', function() {
                            assert(secondEventCallback.calledOnce);
                        });

                        describe('disable and emit thirdEvent of "red" busline', function() {

                            before(function() {
                                bus.red.deactivateEvent("firstEvent");
                                bus.red.emitFirstEvent();
                            });

                            it('should not invoke thirdCallback again', function() {
                                assert(thirdEventCallback.calledOnce);
                            });

                            it('should not invoke firstCallback again', function() {
                                assert(firstEventCallback.calledOnce);
                            });

                            it('should not invoke secondCallback again', function() {
                                assert(secondEventCallback.calledOnce);
                            });

                            describe('re-enable and emit thirdEvent of "red" busline', function() {

                                before(function() {
                                    bus.red.activateEvent("firstEvent");
                                    bus.red.emitFirstEvent();
                                });

                                it('should invoke thirdCallback for second time', function() {
                                    assert(thirdEventCallback.calledTwice);
                                });

                                it('should not invoke firstCallback again', function() {
                                    assert(firstEventCallback.calledOnce);
                                });

                                it('should not invoke secondCallback again', function() {
                                    assert(secondEventCallback.calledOnce);
                                });

                            });

                            describe('invoke destroy on "red" busline', function() {

                                before(function() {
                                    bus.red.destroy();
                                });

                                it('should destroy "red" busline ', function() {
                                    assert.equal(bus.red, undefined);
                                });


                                describe('invoke destroy on "main" busline', function() {

                                    before(function() {
                                        bus.destroy();
                                    });

                                    it('should destroy emitFirstEvent on "main" busline ', function() {
                                        assert.equal(bus.emitFirstEvent, undefined);
                                    });

                                    it('should destroy emitSecondEvent on "main" busline', function() {
                                        assert.equal(bus.emitSecondEvent, undefined);
                                    });

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

            function addCb(a, b) {
                return a + b;
            }
            function mulCb(a, b) {
                return a * b;
            }

            function divCb(a, b) {
                return a / b;
            }


            function getDelayedAsyncFunc(cb, delay) {
                return    function asyncFunc(a, b, resolve) {
                    setTimeout(function() {
                        resolve(cb(a, b));
                    }, delay);
                }
            }

            var firstEventCallback = sinon.spy(getDelayedAsyncFunc(addCb, getRandomInt(500)));
            var secondEventCallback = sinon.spy(getDelayedAsyncFunc(mulCb, getRandomInt(500)));
            var thirdEventCallback = sinon.spy(getDelayedAsyncFunc(divCb, getRandomInt(500)));



            bus.onEvent("syncLine", "forthEvent", firstEventCallback);
            bus.onEvent("syncLine", "forthEvent", secondEventCallback);
            bus.onEvent("syncLine", "forthEvent", thirdEventCallback);

            describe('invocation of bus.syncLine.resolveForthEvent with use of .then()', function() {
                var a = 566;
                var b = 5;
                var results;
                before(function(done) {
                    bus.syncLine.resolveForthEvent(a, b)
                            .then(function(output) {
                                results = output;
                                done();
                            });
                });

                it('should invoke firstEventCallback once', function() {
                    assert(firstEventCallback.calledOnce);
                });


                it('should invoke firstEventCallback once', function() {
                    assert(secondEventCallback.calledOnce);
                });

                it('should invoke firstEventCallback once', function() {
                    assert(thirdEventCallback.calledOnce);
                });

                it("should invoke firstEventCallback with the right arguments", function() {
                    assert(firstEventCallback.calledWith(a, b));
                });

                it("should invoke secondEventCallback with the right arguments", function() {
                    assert(secondEventCallback.calledWith(a, b));
                });

                it("should invoke thirdEventCallback with the right arguments", function() {
                    assert(thirdEventCallback.calledWith(a, b));
                });

                it('first element of "results" should be equal to 571', function() {
                    assert.equal(results[0], 571);
                });

                it('second element of "results" should be equal to 2830', function() {
                    assert.equal(results[1], '2830');
                });

                it('first element of "results" should be equal to 113.2', function() {
                    assert.equal(results[2], '113.2');
                });

            });

        });

    });

    after(function() {
        console.log("\n  #################### End of integration tests for hermes-bus module");
    });

});