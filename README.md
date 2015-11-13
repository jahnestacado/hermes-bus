[![NPM version](http://img.shields.io/npm/v/hermes-bus.svg)](https://www.npmjs.org/package/hermes-bus)
[![Build Status](https://travis-ci.org/jahnestacado/hermes-bus.svg?branch=master)](https://travis-ci.org/jahnestacado/hermes-bus)
[![downloads per month](http://img.shields.io/npm/dm/hermes-bus.svg)](https://www.npmjs.org/package/hermes-bus)
[![Coverage Status](https://img.shields.io/coveralls/jahnestacado/hermes-bus.svg)](https://coveralls.io/r/jahnestacado/hermes-bus?branch=master)

# hermes-bus
-----------

The power of Gods messenger in plain javascript.

## Install
 Install with [npm](npmjs.org):
```bash
    $ npm install hermes-bus
```
## Use
```javascript
    var bus = require("hermes-bus");
```
### Overview
The hermes-bus has a main "busline". On that "busline" we can register/trigger events and even create new "buslines" which in turn can be used to register/trigger other events.

![Overview](https://github.com/jahnestacado/hermes-bus/blob/master/images/herme-bus-overview.png?raw=true)

##### Events on the main "busline"
---
```javascript
    //Register event "start" on the main "busline"
    bus.subscribe({
      onStart: function(arg0..argN){
       ...
      }
    });
```
All the functions in the subscribed object which have a name with the 'on' prefix are automatically attached on the bus. No need to publish them. 
In order to trigger a subscribed function we need to call bus.trigger + "eventName"(arg0..argN) or bus.trigger("start", arg0..argN).  
For example, e can trigger the "start" event on the main "busline" by calling:
```javascript
    //"start" event is already registered on the main "busline"
    bus.triggerStart("foo", "bar");
```
or
```javascript
    //"start" event is already registered on the main "busline"
    bus.trigger("start", "foo", "bar");
```

_Note that the event name is camelCased if we use the generated function and always starts with a lower case letter when we use the trigger-string approach!_

##### Events on custom "buslines"
---
Hermes-bus gives the flexibility of creating your own "buslines". This allows us to create different namespaces which will make your code more readable and also increase the performance of the bus.

Lets say that we want to create a busline that will handle database utilities.

```javascript
    //Registers event "save" on the db "busline"
    bus.subscribe("db", {
      onSave: function(entry){
       ...
     } 
    });
```

The above code creates the "db busline" and attaches the "save" event on it.

```javascript
    bus.db.triggerSave(entry);
```
This event is not accessible from the main "busline" so if you register another "save" event on the main or another custom "busline" it will be a completely different event.

By using the bus.triggerEvent you don't have any control on when the callbacks that are attached on the event will return. Everything is asynchronous.

##### Example
```javascript
    //Module1.js
    bus.subscribe{
      onAsync: function(msg){
       setTimeout(function(){
         console.log(msg, "Module1.js");
       }, 1000);
      }
    });
```
```javascript
      //Module2.js
  bus.subscribe{
      onAsync: function(msg){
       setTimeout(function(){
         console.log(msg, "Module2.js");
       }, 2000);
      }
  });
```
In the example above we attach two asynchronous callback functions on the "async" event.

If we execute below code:
```javascript
    //Module3.js
    var msg = "trigger event 'async' in ";
    bus.triggerAsync(msg);
    console.log("all callbacks finished");
```
it will print :  
```bash
  $ all callbacks finished   
  $ trigger event 'async' in Module1.js  
  $ trigger event 'async' in Module2.js  
 ```

If you want to guarantee that all asynchronous callbacks attached to an event has been executed and then execute some code that depends on the state that the triggered event created you need to "resolve" that event.  

In order to define which events are going to be handled as asynchronous we need to give the "__on" prefix in a subscribed function.

When triggering an event, all functions that are subscribed using the '__on' prefix automatically are invoked with an additional argument. This arguments is always the last one and is used to define when the asynchronous event is executed. We need to invoke that callback inside the "onDone" function of our asynchronous code in order to let hermes-bus know that this event was resolved.

##### Example
```javascript
    //Module1.js
    bus.subscribe({
     __onSync: function(msg, resolve){
        setTimeout(function(){
         console.log(msg, "Module1.js");
         resolve();
       }, 1000);
     }
    });
```

```javascript
    
      //Module2.js
  bus.subscribe({
     __onSync: function(msg, resolve){
        setTimeout(function(){
         console.log(msg, "Module2.js");
         resolve();
       }, 2000);
     }
    });
```

```javascript
    //Module3.js
    var msg = "resolve event 'sync' in ";
    bus.triggerSync(msg).then(function(){
      console.log("all callbacks finished");
    });
```
it will print :  
```bash
   $ resolve event 'sync' in Module1.js    
   $ resolve event 'sync' in Module2.js  
   $ all callbacks finished  
  ```
  
We can subscribe asynchronous and synchronous events on under the same event name. All the subscribed functions that have the "__on" prefix will be executed first and then, and only then, the .then() function will be executed. Only requirement is to call these events with the same number of arguments and make sure that the "resolve()" function is invoked inside the "onDone" asynchronous callbacks.
  
## API
---
* `bus.subscribe(busline, registeredObject)`: Registers events on a busline.  
 `busline`: (**optional**) Defines the busline on which the event will be registered. (By default uses main "busline").  
 `registeredObjectt`: Object that holds the listener functions   

* `bus.disable(event)`: Disables a registered event on a busline.  
 `event`: The event to disable.  
 `scope`: All "buslines".  

* `bus.enable(event)`: Enables a registered event on a busline.  
`event`: The event to enable.  
`scope`: All "buslines".  
  
* `bus[busline].destroy()`: Destroys custom busline.  
`scope`: Custom "buslines" only.

* `bus.reset()`: Resets main "busline". This doesn't affect registered custom "buslines".  
`scope`: Main "busline".

* `bus.hardReset()`: Resets main "busline" and destroys all registered custom "buslines".  
`scope`: Main "busline".

* `bus.require(module0,..,moduleN)`: Loads modules and registers their hermes-bus events in the specified order.  
`module0,..,moduleN`: Module absolute paths or relative to the root directory of the project.  
`scope`: Main "busline".  
  
## Test
 Run the tests
```bash
    $ npm test 
```

## License
Copyright (c) 2014 Ioannis Tzanellis<br>
[Released under the MIT license](https://github.com/jahnestacado/hermes-bus/blob/master/LICENSE) 
