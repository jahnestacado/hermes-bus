[![NPM version](http://img.shields.io/npm/v/hermes-bus.svg)](https://www.npmjs.org/package/hermes-bus)
[![Build Status](https://travis-ci.org/jahnestacado/hermes-bus.svg?branch=master)](https://travis-ci.org/jahnestacado/hermes-bus)
[![downloads per month](http://img.shields.io/npm/dm/hermes-bus.svg)](https://www.npmjs.org/package/hermes-bus)
[![Coverage Status](https://img.shields.io/coveralls/jahnestacado/hermes-bus.svg)](https://coveralls.io/r/jahnestacado/hermes-bus?branch=master)

#hermes-bus
-----------

A joy-to-use Node.js light-weight message bus!

##Install
 Install with [npm](npmjs.org):
```bash
    $ npm install hermes-bus
```
##Use
```javascript
    var bus = require("hermes-bus");
```
###Overview
The hermes-bus has a main "busline". On that "busline" we can register/trigger events and even create new "buslines" which in turn can be used to register/trigger other events.

![ScreenShot](https://github.com/jahnestacado/hermes-bus/blob/master/images/herme-bus-overview.png
)

#####Events on the main "busline"
---
```javascript
    //Register event "start" on the main "busline"
    bus.on("start", function(data0,...,dataN){
      ...
    });
```
In order to trigger a registered event we need to call bus.trigger + "Event"().  
We can trigger the "start" event on the main "busline" by calling:
```javascript
    //"start" event is already registered on the main "busline"
    bus.triggerStart(data0,...,dataN);
```
The above code will invoke the callback function of the "start" event with the passed arguments (e.g data0,...,dataN).  

_Note that the event-name is camelCased!_

#####Events on custom "buslines"
---
Hermes-bus gives the flexibility of creating your own "buslines". This allows us to create different namespaces which will make your code more readable and also increase the performance of the bus.

Lets say that we want to create a busline that will handle database utilities.

```javascript
    //Registers event "save" on the db "busline"
    bus.on("db", "save", function(entry){
      ...
    });
```

The above code creates the "db busline" and attaches the "save" event on it.

```javascript
    bus.db.triggerSave(entry);
```
This event is not accessible from the main "busline" so if you register another "save" event on the main or another custom "busline" it will be a completely different event.

By using the bus.triggerEvent you don't have any control on when the callbacks that are attached on the event will return. Everything is asynchronous.

#####Example
```javascript
    //Module1.js
    bus.on("async", function(msg){
     setTimeout(function(){
       console.log(msg, Module1.js);
     }, 1000);
    });
```
```javascript
      //Module2.js
    bus.on("async", function(msg){
      setTimeout(function(){
       console.log(msg, Module2.js);
     }, 2000);
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

If you want to guarantee that all callbacks attached to an event has been executed and then execute some code that depends on the state that the triggered event created you need to "resolve" that event.  

So instead of bus.triggerSync you need to call bus.resolveSync.  

Moreover, when registering the events callback, you need to declare "resolve" as its last argument. By using bus.resolveSync hermes-bus automaticaly invoked all event callbacks with an additional argument. The "resolve" callback. You need to invoke that callback inside the "onDone" function of your asynchronous code.

#####Example
```javascript
    //Module1.js
    bus.on("sync", function(msg, resolve){
     setTimeout(function(){
       console.log(msg, Module1.js);
       resolve();
     }, 1000);
    });
```

```javascript
    
      //Module2.js
    bus.on("sync", function(msg, resolve){
      setTimeout(function(){
       console.log(msg, Module2.js);
       resolve();
     }, 2000);
    });
```

```javascript
    //Module3.js
    var msg = "resolve event 'sync' in ";
    bus.resolveSync(msg).then(function(){
      console.log("all callbacks finished");
    });
```
it will print :  
```bash
   $ resolve event 'sync' in Module1.js    
   $ resolve event 'sync' in Module2.js  
   $ all callbacks finished  
  ```
  
We can register events that can be "triggered" and "resolved" using the same code. Only requirement is to invoke these events with the same number of arguments and always call the "resolve()" callback inside the events.
  
##API
---
* `bus.on(busline, event, callback)`: Registers an event on a busline.  
 `busline`: (**optional**) Defines the busline on which the event will be registered. (By default uses main "busline").  
 `event`: The registered event on the busline.   
 `callback(arguments, resolve)`: The callback function that is attached to registered event.  
 * `arguments`: Arguments that are passed from the _"triggerEvent"_ and/or _"resolveEvent"_ hermes-bus functions. An event should be always triggered/resolved with the same number of arguments.    
   `resolve`: (**optional**) Function that is available as the last argument of the callback and should be used for hermes-bus _"resolved"_ events. Call that function inside your "onDone" callback of your asynchronous code.
If you both _"trigger"_ and _"resolve"_ the same event the _resolve_ function should be always invoked.   
* * `scope`: Main "busline".    <br/>                 

* `bus.deactivate(event)`: Deactivates a registered event on a busline.  
 `event`: The event to deactivate.  
 `scope`: All "buslines".  

* `bus.activate(event)`: Activates an a registered event on a busline.  
`event`: The event to deactivate.  
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
  
##Test
 Run the tests
```bash
    $ npm test 
```

##License
Copyright (c) 2014 Ioannis Tzanellis<br>
[Released under the MIT license](https://github.com/jahnestacado/hermes-bus/blob/master/LICENSE) 
