/**
* hermes-bus <https://github.com/jahnestacado/hermes-bus>
* Copyright (c) 2014 Ioannis Tzanellis
* Licensed under the MIT License (MIT).
*/

var assert = require("assert");
var bus = require("./..");
var sinon = require("sinon");

describe('#################### Start integration tests for hermes-bus module \n', function() {

    describe("trigger events", function() {

        var firstEventCallback = sinon.spy();
        var secondEventCallback = sinon.spy();

        describe("when triggering 'firstEvent'", function() {
            var firstEventArg1 = {isDummy: true};
            var firstEventArg2 = "foo";
            var firstEventArg3 = 639;

            before(function(){
                bus.subscribe({
                    onFirstEvent: firstEventCallback,
                    onSecondEvent: secondEventCallback
                });
            });

            before(function() {
                bus.trigger("firstEvent", firstEventArg1, firstEventArg2, firstEventArg3);
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

            describe("when invoking bus.triggerSecondEvent", function() {
                var secondEventArg1 = {isDummy: true};
                var secondEventArg2 = [3, 5, 6, ["4"]];

                before(function() {
                    bus.triggerSecondEvent(firstEventArg1, secondEventArg2);
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
                        bus.subscribe("red",{
                            onFirstEvent:thirdEventCallback
                        });
                    });

                    describe("when triggering 'firstEvent' on the red busline", function() {
                        var thirdEventArg1 = {isDummy: true};

                        before(function() {
                            bus.red.trigger("firstEvent", thirdEventArg1);
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

                        describe("when disabling and invoking triggerFirstEvent on the red busline", function() {

                            before(function() {
                                bus.red.disable("firstEvent");
                            });

                            before(function() {
                                bus.red.triggerFirstEvent();
                            });

                            it("should not invoke firstCallback again", function() {
                                assert(firstEventCallback.calledOnce);
                            });

                            it("should not invoke thirdCallback again", function() {
                                assert(thirdEventCallback.calledOnce);
                            });

                            it("should not invoke secondCallback again", function() {
                                assert(secondEventCallback.calledOnce);
                            });

                            describe("when re-enabling and triggering 'thirdEvent' on the red busline", function() {

                                before(function() {
                                    bus.red.enable("firstEvent");
                                    bus.red.trigger("firstEvent");
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
                                    bus.subscribe("green",{
                                        onDummyEvent: dummyEventCallback
                                    });
                                    bus.subscribe("black",{
                                        onDummyEvent: dummyEventCallback
                                    });
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

                                    it("should not have triggerFirstEvent function on 'main' busline", function() {
                                        assert.equal(bus.trigger("firstEvent"), null);
                                    });

                                    it("should not have triggerSecondEvent function on 'main' busline", function() {
                                        assert.equal(bus.triggerSecondEvent, undefined);
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
                                                    bus.subscribe("green",{
                                                        onDummyEvent: dummyEventCallback
                                                    });
                                                });

                                                it("should not have invoked 'dummyEventCallback' until this point", function() {
                                                    assert.equal(dummyEventCallback.called, false);
                                                });

                                                describe("when triggering 'dummyEvent' message on 'green' busline ", function() {

                                                    before(function() {
                                                        bus.green.trigger("dummyEvent");
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

            function add1567(x) {
                return x + 1567;
            }
            function mul45(x) {
                return x * 45;
            }

            function div3(x) {
                return x / 3;
            }

            function getAsyncApplyOperationFunc(operation) {
                return    function asyncFunc(refObject, resolve) {
                    setTimeout(function() {
                        refObject.value = operation(refObject.value);
                        resolve();
                    }, getRandomInt(300));
                };
            }

            var firstEventCallback = sinon.spy(getAsyncApplyOperationFunc(add1567));
            var secondEventCallback = sinon.spy(getAsyncApplyOperationFunc(mul45));
            var thirdEventCallback = sinon.spy(getAsyncApplyOperationFunc(div3));

            describe("when registering events", function() {

                before(function() {
                    bus.subscribe("sync", {
                        __onForthEvent:firstEventCallback
                    });
                    bus.subscribe("sync", {
                        __onForthEvent:secondEventCallback
                    });
                    bus.subscribe("sync", {
                        __onForthEvent:thirdEventCallback
                    });
                });

                describe("when invoking  bus.sync.triggerForthEvent with use of .then()", function() {
                    var results = {value: 10};
                    before(function(done) {
                        bus.sync.trigger("forthEvent", results).then(function() {
                            done();
                        });
                    });

                    it("should have calculated all math operation in order", function() {
                        assert(results.value === 23655);
                    });

                    it("should invoke firstEventCallback once", function() {
                        assert(firstEventCallback.calledOnce);
                    });

                    it("should invoke secondEventCallback once", function() {
                        assert(secondEventCallback.calledOnce);
                    });

                    it("should invoke thirdEventCallback once", function() {
                        assert(thirdEventCallback.calledOnce);
                    });

                    it("should invoke firstEventCallback with the right arguments", function() {
                        assert(firstEventCallback.calledWith(results));
                    });

                    it("should invoke secondEventCallback with the right arguments", function() {
                        assert(secondEventCallback.calledWith(results));
                    });

                    it("should invoke thirdEventCallback with the right arguments", function() {
                        assert(thirdEventCallback.calledWith(results));
                    });

                });

            });

        });

        after(function() {
            console.log("\n  #################### End of integration tests for hermes-bus module.");
        });
    });
});
