/**
* hermes-bus <https://github.com/jahnestacado/hermes-bus>
* Copyright (c) 2014 Ioannis Tzanellis
* Licensed under the MIT License (MIT).
*/

var assert = require("assert");
var bus = require("./..");
var sinon = require("sinon");
var _ = require("underscore");

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

            it("should have 'firstEvent' attached", function() {
                assert(bus.hasEvent("firstEvent"));
            });

            it("should have 'secondEvent' attached", function() {
                assert(bus.hasEvent("secondEvent"));
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

                        it("should have 'firstEvent' attached on the red busline", function() {
                            assert(bus.red.hasEvent("firstEvent"));
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
                                bus.red.trigger("firstEvent");
                            });

                            it("should still have 'firstEvent' attached on the red busline", function() {
                                assert(bus.red.hasEvent("firstEvent"));
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

                                it("should have 'dummyEvent' attached on the green busline", function() {
                                    assert(bus.green.hasEvent("dummyEvent"));
                                });

                                it("should have 'black' busline", function() {
                                    assert(bus.black);
                                });

                                it("should have 'dummyEvent' attached on the black busline", function() {
                                    assert(bus.black.hasEvent("dummyEvent"));
                                });

                                describe("when invoking reset on 'main' busline", function() {
                                    before(function() {
                                        bus.reset();
                                    });

                                    it("should not have 'dummyEvent' attached on the green busline", function() {
                                        assert(bus.green.hasEvent("dummyEvent"), false);
                                    });

                                    it("should not have 'dummyEvent' attached on the black busline", function() {
                                        assert(bus.black.hasEvent("dummyEvent"), false);
                                    });

                                    it("should not have triggerFirstEvent function on 'main' busline", function() {
                                        assert.equal(bus.triggerFirstEvent, undefined);
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
                    bus.subscribe({
                        __onForthEvent: firstEventCallback
                    });
                    bus.subscribe({
                        __onForthEvent: secondEventCallback
                    });
                    bus.subscribe({
                        __onForthEvent: thirdEventCallback
                    });
                });

                describe("when invoking  bus.triggerForthEvent while event is disabled", function() {
                    var results = {value: 10};
                    before(function() {
                        bus.disable("forthEvent");
                    });

                    before(function() {
                        bus.triggerForthEvent(results);
                    });

                    it("should not invoke firstEventCallback", function() {
                        assert(firstEventCallback.notCalled);
                    });

                    it("should not invoke secondEventCallback", function() {
                        assert(secondEventCallback.notCalled);
                    });

                    it("should not invoke thirdEventCallback", function() {
                        assert(thirdEventCallback.notCalled);
                    });

                    before(function() {
                        bus.enable("forthEvent");
                    });
                });

                describe("when invoking  bus.triggerForthEvent with use of .then()", function() {
                    var results = {value: 10};
                    before(function(done) {
                        bus.trigger("forthEvent", results).then(function() {
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

                describe("when testing the before/after hooks", function() {
                    var result = {text:""};

                    var createAppender = function(keyword){
                        return function(text, symbol){result.text += keyword + symbol;};
                    };

                    var firstBeforeCallback = sinon.spy(createAppender("before1"));
                    var secondBeforeCallback = sinon.spy(createAppender("before2"));

                    var firstEventCallback = sinon.spy(createAppender("on1"));
                    var secondEventCallback = sinon.spy(createAppender("on2"));

                    var firstAfterCallback = sinon.spy(createAppender("after1"));
                    var secondAfterCallback = sinon.spy(createAppender("after2"));

                    before(function() {
                        bus.subscribe({
                            beforeHookTest: firstBeforeCallback,
                            onHookTest: firstEventCallback,
                            afterHookTest: firstAfterCallback
                        });
                        bus.subscribe({
                            beforeHookTest: secondBeforeCallback,
                            onHookTest: secondEventCallback,
                            afterHookTest: secondAfterCallback
                        });
                    });

                    before(function() {
                        bus.trigger("hookTest", result, "-");
                    });

                    it("should append all substrings in order and create the expected string", function(){
                        assert(result.text === "before1-before2-on1-on2-after1-after2-");
                    });
                });
            });
        });

        describe("when testing the unsubscribe function", function(){
            var subscribedObjectA = {
                beforeFoo: sinon.stub(),
                onFoo: sinon.stub(),
                afterFoo: sinon.stub()
            };
            var subscribedObjectB = {
                beforeFoo: sinon.stub(),
                onFoo: sinon.stub(),
                afterFoo: sinon.stub()
            };
            before(function(){
                bus.subscribe("red", subscribedObjectA);
                bus.subscribe("red", subscribedObjectB);
            });

            describe("when triggering the foo event", function(){
                before(function(){
                    bus.red.triggerFoo();
                });

                after(function(){
                    bus.hardReset();
                });

                it("should trigger the subscribedObjectA.beforeFoo listener stub once", function(){
                    sinon.assert.calledOnce(subscribedObjectA.beforeFoo);
                });

                it("should trigger the subscribedObjectA.onFoo listener stub once", function(){
                    sinon.assert.calledOnce(subscribedObjectA.onFoo);
                });

                it("should trigger the subscribedObjectA.afterFoo listener stub once", function(){
                    sinon.assert.calledOnce(subscribedObjectA.afterFoo);
                });

                it("should trigger the subscribedObjectB.beforeFoo listener stub once", function(){
                    sinon.assert.calledOnce(subscribedObjectB.beforeFoo);
                });

                it("should trigger the subscribedObjectB.onFoo listener stub once", function(){
                    sinon.assert.calledOnce(subscribedObjectB.onFoo);
                });

                it("should trigger the subscribedObjectB.afterFoo listener stub once", function(){
                    sinon.assert.calledOnce(subscribedObjectB.afterFoo);
                });

                describe("when unsubscribing 'subscribedObjectA' and triggering foo event again", function(){
                    before(function(){
                        bus.unsubscribe("red", subscribedObjectA);
                    });
                    before(function(){
                        bus.red.triggerFoo();
                    });

                    it("should not trigger the subscribedObjectA.beforeFoo listener stub again", function(){
                        sinon.assert.calledOnce(subscribedObjectA.beforeFoo);
                    });

                    it("should not trigger the subscribedObjectA.onFoo listener stub again", function(){
                        sinon.assert.calledOnce(subscribedObjectA.onFoo);
                    });

                    it("should not trigger the subscribedObjectA.afterFoo listener stub again", function(){
                        sinon.assert.calledOnce(subscribedObjectA.afterFoo);
                    });

                    it("should trigger the subscribedObjectB.beforeFoo listener stub twice", function(){
                        sinon.assert.calledTwice(subscribedObjectB.beforeFoo);
                    });

                    it("should trigger the subscribedObjectB.onFoo listener stub twice", function(){
                        sinon.assert.calledTwice(subscribedObjectB.onFoo);
                    });

                    it("should trigger the subscribedObjectB.afterFoo listener stub twice", function(){
                        sinon.assert.calledTwice(subscribedObjectB.afterFoo);
                    });
                });
            });
        });

        describe("when testing the non-overridable properties", function(){
            var nonOverridableProps = _.union(["$main_busline$"], Object.keys(Object.getPrototypeOf(bus)), Object.keys(bus));
            nonOverridableProps.forEach(function(propertyName){
                it("should throw the expected error", function(){
                    assert.throws(function(){
                        bus.subscribe(propertyName, {})
                    }, function(error){
                        if(error.message === "Not permitted busline name: " + propertyName +
                        ". Cannot override API functions: [ "+ nonOverridableProps +"]."){
                            return true;
                        }
                    });
                });
            });
        });

        after(function() {
            console.log("\n  #################### End of integration tests for hermes-bus module.");
        });
    });
});
