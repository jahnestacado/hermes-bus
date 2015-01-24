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

        describe("when invoking bus.emitFirstEvent", function() {
            var firstEventArg1 = {isDummy: true};
            var firstEventArg2 = "frrrrr";
            var firstEventArg3 = 639;

            before(function() {
                bus.emitFirstEvent(firstEventArg1, firstEventArg2, firstEventArg3);
            });

            it("should invoke firstCallback once", function() {
                assert(firstEventCallback.calledOnce);
            });

            it("should invoke firstCallback with the right argument", function() {
                assert(firstEventCallback.calledWith(firstEventArg1, firstEventArg2, firstEventArg3));
            });

            it("should not invoke secondCallback", function() {
                assert(firstEventCallback.calledOnce, false);
            });

            describe("when invoking bus.emitSecondEvent", function() {
                var secondEventArg1 = {isDummy: true};
                var secondEventArg2 = [3, 5, 6, ["4"]];

                before(function() {
                    bus.emitSecondEvent(firstEventArg1, secondEventArg2);
                });

                it("should invoke secondCallback once", function() {
                    assert(secondEventCallback.calledOnce);
                });

                it("should invoke secondCallback with the right argument", function() {
                    assert(secondEventCallback.calledWith(secondEventArg1, secondEventArg2));
                });

                it("should not invoke firstCallback again", function() {
                    assert(firstEventCallback.calledOnce);
                });

                describe("creating 'red busline' ", function() {
                    var thirdEventCallback = sinon.spy();

                    before(function() {
                        bus.onEvent("red", "firstEvent", thirdEventCallback);
                    });

                    describe("when invoking bus.red.emitFirstEvent", function() {
                        var thirdEventArg1 = {isDummy: true};

                        before(function() {
                            bus.red.emitFirstEvent(thirdEventArg1);
                        });

                        it("should invoke thirdCallback once", function() {
                            assert(thirdEventCallback.calledOnce);
                        });

                        it("should invoke thirdCallback with the right argument", function() {
                            assert(thirdEventCallback.calledWith(thirdEventArg1));
                        });

                        it("should not invoke firstCallback again", function() {
                            assert(firstEventCallback.calledOnce);
                        });

                        it("should not invoke secondCallback again", function() {
                            assert(secondEventCallback.calledOnce);
                        });

                        describe("when disabling and emitting thirdEvent of 'red' busline", function() {

                            before(function() {
                                bus.red.deactivateEvent("firstEvent");
                                bus.red.emitFirstEvent();
                            });

                            it("should not invoke thirdCallback again", function() {
                                assert(thirdEventCallback.calledOnce);
                            });

                            it("should not invoke firstCallback again", function() {
                                assert(firstEventCallback.calledOnce);
                            });

                            it("should not invoke secondCallback again", function() {
                                assert(secondEventCallback.calledOnce);
                            });

                            describe("when re-enabling and emitting thirdEvent of 'red' busline", function() {

                                before(function() {
                                    bus.red.activateEvent("firstEvent");
                                    bus.red.emitFirstEvent();
                                });

                                it("should invoke thirdCallback for second time", function() {
                                    assert(thirdEventCallback.calledTwice);
                                });

                                it("should not invoke firstCallback again", function() {
                                    assert(firstEventCallback.calledOnce);
                                });

                                it("should not invoke secondCallback again", function() {
                                    assert(secondEventCallback.calledOnce);
                                });

                            });

                            describe("when creating 'green' and 'black' and 'white' buslines", function() {

                                var dummyEventCallback = sinon.spy();

                                before(function() {
                                    bus.onEvent("green", "dummyEvent", dummyEventCallback);
                                    bus.onEvent("black", "dummyEvent", dummyEventCallback);
                                });

                                it("should have 'green' busline", function() {
                                    assert(bus.green);
                                });

                                it("should have 'black' busline", function() {
                                    assert(bus.black);
                                });

                                describe("when invoking reset on 'main' busline", function() {

                                    before(function() {
                                        bus.reset();
                                    });

                                    it("should not have emitFirstEvent function on 'main' busline", function() {
                                        assert.equal(bus.emitFirstEvent, undefined);
                                    });

                                    it("should not have emitSecondEvent function on 'main' busline", function() {
                                        assert.equal(bus.emitSecondEvent, undefined);
                                    });

                                    it("should maintain 'red' busline", function() {
                                        assert(bus.red);
                                    });

                                    it("should maintain 'green' busline", function() {
                                        assert(bus.green);
                                    });

                                    describe("when invoking destroy on 'red' busline", function() {

                                        before(function() {
                                            bus.red.destroy();
                                        });

                                        it("should destroy 'red' busline", function() {
                                            assert.equal(bus.red, undefined);
                                        });

                                        describe("when invoking hardReset on 'main' busline", function() {

                                            before(function() {
                                                bus.hardReset();
                                            });

                                            it("should destroy 'green' busline", function() {
                                                assert.equal(bus.green, undefined);
                                            });

                                            it("should destroy 'white' busline", function() {
                                                assert.equal(bus.green, undefined);
                                            });

                                            describe("when creating again 'dummyEvent' message on 'green' busline ", function() {

                                                before(function() {
                                                    bus.onEvent("green", "dummyEvent", dummyEventCallback);
                                                });

                                                it("should not have invoked 'dummyEventCallback' until this point", function() {
                                                    assert.equal(dummyEventCallback.called, false);
                                                });

                                                describe("when emitting 'dummyEvent' message on 'green' busline ", function() {

                                                    before(function() {
                                                        bus.green.emitDummyEvent();
                                                    });

                                                    it("should invoke 'dummyEventCallback' only once", function() {
                                                        assert(dummyEventCallback.calledOnce);
                                                    });

                                                });

                                            });

                                        });
                                    
                                    });
                                
                                });

                            });

                        });

                    });
               
                });

            });

        });

        describe("when resolving events", function() {
            
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

            describe("when registering events", function() {

                before(function() {
                    bus.onEvent("syncLine", "forthEvent", firstEventCallback);
                    bus.onEvent("syncLine", "forthEvent", secondEventCallback);
                    bus.onEvent("syncLine", "forthEvent", thirdEventCallback);
                });

                describe("when invoking  bus.syncLine.resolveForthEvent with use of .then()", function() {
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

                    it("should invoke firstEventCallback once", function() {
                        assert(firstEventCallback.calledOnce);
                    });


                    it("should invoke firstEventCallback once", function() {
                        assert(secondEventCallback.calledOnce);
                    });

                    it("should invoke firstEventCallback once", function() {
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

                    it("first element of 'results' should be equal to 571", function() {
                        assert.equal(results[0], 571);
                    });

                    it("second element of 'results' should be equal to 2830", function() {
                        assert.equal(results[1], 2830);
                    });

                    it("first element of 'results' should be equal to 113.2", function() {
                        assert.equal(results[2], 113.2);
                    });

                });

            });

        });

        after(function() {
            console.log("\n  #################### End of integration tests for hermes-bus module");
        });
    });
});