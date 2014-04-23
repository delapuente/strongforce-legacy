/**
 * @author Salvador de la Puente http://unoyunodiez.com/ @salvadelapuente
 */

(function(){
  'use strict';

  var root = this;

/**
 * @author Salvador de la Puente http://unoyunodiez.com/ @salvadelapuente
 */

/**
 * @module strongforce
 */
var strongforce = strongforce || {};

strongforce.NOOP = function () {};

strongforce.IS_PRECALL = false;
strongforce.IS_POSTCALL = true;

strongforce.Loop = (function () {
  'use strict';

  var root = this;

  /**
   * Options to customize the loop.
   *
   * @class LoopOptions
   */
  var defaultLoopOptions = {

    /**
     * The target model of the loop.
     *
     * @property rootModel
     * @type {Model}
     * @default undefined
     */
    rootModel: undefined,

    /**
     * Max time in milliseconds to be simulated on each frame to avoid making
     * the simulation stage to take more time than that being simulated
     *
     * The parameter is important to avoid _spiral of death_, an effect produced
     * due to the accumulation of a _time debt_ from frame to frame what leads
     * to longer and longer freezes of the loop.
     *
     * @property maxSimulationTime
     * @type {Number}
     * @default 300 milliseconds
     */
    maxSimulationTime: 300,

    /**
     * Time in milliseconds to be simulated in each tick. As a decoupled loop,
     * ticks per frame can vary from frame to frame.
     *
     * If set to 0, the simulation is coupled to the frame rate.
     *
     * @property simulationDelta
     * @type {Number}
     * @default 10 milliseconds
     */
    simulationDelta: 10
  };

  /* TODO: Add a default implementation for fallback. */
  var requestAnimationFrame = root.requestAnimationFrame;

  /**
   * The loop is the main piece of strongforce. It coordinates simulation and
   * rendering stages on the model. A loop takes a root model to traverse in
   * each stage.
   *
   * Despite it is able to simulate the model at a constant rate, the loop is
   * driven by `window.requestAnimationFrame()` to schedule next loop step so
   * rendering is coined to this rate. Foreso, this is the **frame rate**
   * as well.
   *
   * @class Loop
   * @constructor
   * @param customOptions {LoopOptions} Hash to customize the loop. The
   * {{#crossLink "LoopOptions/rootModel:property"}}{{/crossLink}} key
   * is mandatory.
   */
  function Loop(customOptions) {

    checkOptions(customOptions);

    var isRunning = false,
        options = getCustomizedOptions(customOptions),
        rootModel = options.rootModel;

    var t, newTime, avgFrameTime = 0, currentTime,
        pauseTime, accumulator, startTime,
        simulationQueue = [];

    /**
     * The model target of loop.
     *
     * @property rootModel
     * @type {Model}
     * @readOnly
     */
    Object.defineProperty(this, 'rootModel', { value: rootModel });

    /**
     * Start the loop from the beginning, setting the current simulation time to
     * 0.
     *
     * @method start
     */
    function start() {
      if (!isRunning) {
        reset(0);
        resume();
      }
    }

    /**
     * Pause and force the current simulation time to 0 or other moment if
     * indicated.
     *
     * @method reset
     * @param [newOffset=0] {Number} Time in milliseconds for the current
     * simulation time.
     */
    function reset(newOffset) {
      pause();
      t = newOffset || 0;
      currentTime = undefined;
      accumulator = 0;
    }

    /**
     * Freezes the loop.
     *
     * @method pause
     */
    function pause() {
      pauseTime = Date.now();
      isRunning = false;
    }

    /**
     * Continue with the loop.
     *
     * @method resume
     */
    function resume() {
      if (!isRunning) {
        requestAnimationFrame(loopStep);
        isRunning = true;
      }
    }

    /**
     * Performs one, **and only one** loop step.
     *
     * @method step
     * @param [timeToSimulate] {Number} Time to be simulated in this step.
     * It defaults in
     * {{#crossLink "LoopOptions/simulationDelta:property"}}{{/crossLink}}.
     */
    function step(timeToSimulate) {
      timeToSimulate = timeToSimulate || options.simulationDelta;
      if (!isRunning) {
        loopStep(undefined, timeToSimulate);
      }
    }

    /**
     * The loop step is based on the article **Fix your timestep!**
     * (http://gafferongames.com/game-physics/fix-your-timestep/) by
     * _Glenn Fiedler_.
     *
     * The loop step is the core of strongforce. It is in charge of orchestrate
     * the simulation and rendering stages. From frame to frame, the time frame
     * is recorded and simulated in chunks of constant rate given by the
     * {{#crossLink "LoopOptions/simulationDelta:property"}}{{/crossLink}}
     * option.
     *
     * In strongforce, a {{#crossLink "Model"}}{{/crossLink}} instance has
     * _facets_. A facet is a object in charge of provide a specific
     * functionality for the model. This object can be a function or a
     * function-like object implementing `Function.prototype.apply()` signature.
     *
     * During simulation and rendering stages, the
     * {{#crossLink "Loop/rootModel:property"}}{{/crossLink}} is visited in a
     * recursive way by
     * calling {{#crossLink "Model/simulate:method"}}{{/crossLink}} or
     * {{#crossLink "Model/render:method"}}{{/crossLink}} methods on each model
     * in pre-order, i.e. first the model itself, then its submodels.
     *
     * Actually, each facet is called twice, one before visiting the children
     * and another one after visiting them all. These calls are named pre-call
     * and post-call and are distinguished by passing a `isPostCall` flag to
     * the facet.
     *
     * @method loopStep
     * @param requestAnimationTime {DOMHighResTimeStamp} [Not used].
     * @param forcedTimeToSimulate {Number} Milliseconds to simulate.
     * @private
     */
    function loopStep(requestAnimationTime, forcedTimeToSimulate) {
      var frameTime;

      if (!isRunning) { return; }

      requestAnimationFrame(loopStep);

      // Take the time now
      newTime = Date.now();
      (currentTime === undefined) && (currentTime = newTime);

      // Calculates frame time
      frameTime = newTime - currentTime;
      currentTime = newTime;

      // Calculating FPS according to:
      // http://stackoverflow.com/questions/4787431/check-fps-in-\
      // js#answer-5111475
      avgFrameTime += (frameTime - avgFrameTime) / 20;

      // The simulation time can not be more than a specified max in order
      // to avoid simulation times longer than the time being simulated.
      var timeToSimulate = Math.min(
        forcedTimeToSimulate !== undefined ? forcedTimeToSimulate : frameTime,
        options.maxSimulationTime
      );

      // Simulate in higher precission chunks unless the feature is
      // disabled (simulationDelta set to 0). Keeping the accumulator updated
      // we can maintain a regular rate of simulation.
      accumulator += timeToSimulate;
      var dt = options.simulationDelta || accumulator;
      while (accumulator >= dt) {
        /*
        TODO: Consider to make something similar for rendering:
          Provide an `emit()` function as `scheduleUpdate()`, then apply some
          sorting, and finally run these rendering tasks.
        */
        simulate(rootModel, t, dt, scheduleUpdate);
        runSimulation();
        t += dt;
        accumulator -= dt;
      }

      // The interpolation value is a measure of where we are between two
      // simulation ticks. It can be interesting to interpolate animations
      // or other render aspects.
      var interpolationValue = accumulator / dt;

      render(rootModel, interpolationValue);

      startTime = Date.now();
    }

    function render(model, interpolationValue) {
      model.traverse('render', 'getRenderSubmodels', [interpolationValue]);
    }

    function simulate(model, t, dt, scheduleUpdate) {
      model.traverse(
        'simulate', 'getSimulateSubmodels',
        [t, dt, scheduleUpdate]
      );
    }

    function scheduleUpdate(f) {
      simulationQueue.push(f);
    }

    function runSimulation() {
      while (simulationQueue.length) {
        simulationQueue.shift()();
      }
    }

    return {
      start: start,
      reset: reset,
      pause: pause,
      resume: resume,
      step: step,
      /**
       * Average frame time.
       *
       * @property frameTime
       * @readOnly
       */
      get frameTime() {
        return avgFrameTime;
      }
    };
  }

  function checkOptions(customOptions) {
    if (customOptions.rootModel === undefined) {
      throw new Error('The `rootModel` key is mandatory!');
    }
  }

  function getCustomizedOptions(customOptions) {
    var result = {};
    for (var key in defaultLoopOptions) {
      if (defaultLoopOptions.hasOwnProperty(key)) {
        result[key] = customOptions[key] || defaultLoopOptions[key];
      }
    }
    return result;
  }

  return Loop;
}.call(this));


strongforce.EventEmitter = (function () {
  'use strict';

  /**
   * Provide methods for dispatching events and add or remove listeners to
   * specified types of events.
   *
   * @class EventEmitter
   * @constructor
   */
  function EventEmitter() {
    /**
     * Keeps the list of listeners by event type.
     *
     * @property _listeners
     * @type {Object}
     * @private
     * @final
     */
    Object.defineProperty(this, '_listeners', { value: {} });
  }

  /**
   * Emit an event from the instance.
   *
   * @method dispatchEvent
   * @param type {String} The type of the event.
   * @param [event=Object] {Object} Hash of event's properties.
   */
  EventEmitter.prototype.dispatchEvent = function(type, event) {
    event = event || {};
    event.type = type;
    event.target = this;
    event.timestamp = Date.now();
    this._runListeners(type, event);
  };

  /**
   * Synchronously run the listeners for an event type removing _only once_
   * listeners.
   *
   * @method _runListeners
   * @param type {String} The type of the event for which the listeners
   * will be executed.
   * @param event {Object} Hash of event's properties.
   * @private
   */
  EventEmitter.prototype._runListeners = function(type, event) {
    var listeners = this._listeners[type] || [],
        newListeners = [];

    listeners.forEach(function onCallback(pair) {
      var callback = pair[0];
      var once = pair[1];
      callback(event);
      if (!once) { newListeners.push(pair); }
    });
    this._listeners[type] = newListeners;
  };

  /**
   * Add a listener for an event type to be executed synchronously every time
   * the model emits an event of the provided type. You can optionally indicate
   * the listener should run only once.
   *
   * @method addEventListener
   * @param type {String} The type of the event for which the listener
   * will be attached.
   * @param callback {Function} The listener is a function that will receive a
   * {{#crossLink "StrongforceModelEvent"}}{{/crossLink}} parameter.
   * @param [once=false] {Boolean} If set to `true`, the listener will be
   * executed only once and automatically removed after the execution.
   */
  EventEmitter.prototype.addEventListener = function(type, callback, once) {
    var listeners = this._listeners,
        typeListeners = listeners[type] = (listeners[type] || []);

    if (!typeListeners.some(alreadyListening)) {
      typeListeners.push([callback, once]);
    }

    function alreadyListening(pair) {
      return pair[0] === callback;
    }
  };

  /**
   * Remove one listener for the specified event type.
   *
   * @method removeEventListener
   * @param type {String} The type of the event for which the listener
   * will be removed.
   * @param callback {Function} The listener to remove.
   */
  EventEmitter.prototype.removeEventListener = function(type, callback) {
    var listeners = this._listeners,
        typeListeners = listeners[type] = listeners[type] || [],
        position = -1;

    for (var l = 0, pair; (pair = typeListeners[l]) && position < 0; l++) {
      if (pair[0] === callback) { position = l; }
    }

    if (position !== -1) {
      listeners[type].splice(position, 1);
    }
  };

  /**
   * Remove all listeners for an event type.
   *
   * @method removeEventListener
   * @param type {String} The type of the event for which the listener
   * will be removed.
   */
  EventEmitter.prototype.removeAllEventListener = function (type) {
    this._listeners[type] = [];
  };

  return EventEmitter;

  /**
   * The type of data received by a listener attached by using
   * {{#crossLink "EventEmitter/addEventListener:method"}}{{/crossLink}}.
   *
   * @class StrongforceModelEvent
   */

  /**
   * The model dispatching the event.
   *
   * @property target
   * @type {Model}
   */

  /**
   * The type of the event.
   *
   * @property type
   * @type {String}
   */

  /**
   * The moment at which the event has been dispatched.
   *
   * @property timestamp
   * @type {Number}
   */

}.call(this));

strongforce.Render = (function() {
  'use strict';

  var NOOP = strongforce.NOOP,
      IS_PRECALL = strongforce.IS_PRECALL,
      IS_POSTCALL = strongforce.IS_POSTCALL;

  /**
   * The render is the facet of a model in charge of realize the model. Usually
   * by drawing it.
   *
   * This class provides a functor skeleton to ease the implementation of
   * complex renders. The developer can extend this class and override
   * {{#crossLink "Render/render:method"}}{{/crossLink}}
   * or {{#crossLink "Render/postRender:method"}}{{/crossLink}} methods to
   * provide the behaviors for the pre and post calls of the render stage.
   *
   *     function GameOfLifeCell() {
   *       Render.apply(this, arguments);
   *       // Your code...
   *     }
   *     GameOfLifeCell.prototype = Object.create(Render.prototype);
   *     GameOfLifeCell.prototype.constructor = GameOfLifeCell;
   *
   * @class Render
   * @constructor
   */
  function Render() { }

  /**
   * Delegate on {{#crossLink "Render/render:method"}}{{/crossLink}}
   * or {{#crossLink "Render/postRender:method"}}{{/crossLink}}
   * depending on the first component of `args` parameter which determine
   * if this invocation is the pre-call or the post-call.
   * The method passes all the arguments to the delegated methods except
   * `isPostCall` flag which is replaced by the model being simulated.
   *
   * The function follows the signature of `Function.prototype.apply()`.
   *
   * @method apply
   * @private
   * @param model {Model} Model being simulated.
   * @param [args=Array] {Array} Arguments for the functor. For renders,
   * these arguments are `isPostCall` flag and the simulation interpolation
   * value.
   */
  Render.prototype.apply = function(model, args) {
    var isPostCall = args[0],
        newArgs = [model].concat(args.slice(1));
    this[isPostCall ? 'postRender' : 'render'].apply(this, newArgs);
  };

  /**
   * Performs the pre-call for the model's rendering.
   *
   * @method render
   * @param model {Model} Model being simulated.
   * @param interpolationValue {Number} A measure of how much time remains to
   * simulate in the interval `[0, 1)`. The value can be used as an
   * interpolation value for rendering smooth animations.
   */
  Render.prototype.render = NOOP;

  /**
   * Performs the post-call for the model's rendering.
   *
   * @method postRender
   * @param model {Model} Model being simulated.
   * @param interpolationValue {Number} A measure of how much time remains to
   * simulate in the interval `[0, 1)`. The value can be used as an
   * interpolation value for rendering smooth animations.
   */
  Render.prototype.postRender = NOOP;

  /**
   * Helper method to trigger the render pre-call of a model.
   *
   * @method delegateToPostRender
   * @param model {Model} Model in which delegate.
   */
  Render.prototype.delegateToRender = function (model) {
    var args = [IS_PRECALL].concat(Array.prototype.slice.call(arguments, 1));
    model.render.apply(model, args);
  };

  /**
   * Helper method to trigger the render post-call of a model.
   *
   * @method delegateToRender
   * @param model {Model} Model in which delegate.
   */
  Render.prototype.delegateToPostRender = function (model) {
    /* TODO: Consider make a factory for delegations */
    var args = [IS_POSTCALL].concat(Array.prototype.slice.call(arguments, 1));
    model.postRender.apply(model, args);
  };

  return Render;
}.call(this));


strongforce.Simulator = (function() {
  'use strict';

  var NOOP = strongforce.NOOP;

  /**
   * The simulator is the facet of a model in charge of business logic.
   *
   * This class provides a functor skeleton to ease the implementation of
   * complex simulators. The developer can extend this class and override
   * {{#crossLink "Simulator/simulate:method"}}{{/crossLink}}
   * or {{#crossLink "Simulator/postSimulate:method"}}{{/crossLink}}
   * methods to provide the behaviors for the pre and post calls of the
   * simulation stage.
   *
   *     function GameOfLife() {
   *       Simulator.apply(this, arguments);
   *       // Your code...
   *     }
   *     GameOfLife.prototype = Object.create(Simulator.prototype);
   *     GameOfLife.prototype.constructor = GameOfLife;
   *
   * @class Simulator
   * @constructor
   */
  function Simulator() { }

  /**
   * Delegate on {{#crossLink "Simulator/simulate:method"}}{{/crossLink}}
   * or {{#crossLink "Simulator/postSimulate:method"}}{{/crossLink}}
   * depending on the first component of `args` parameter which determine
   * if this invocation is the pre-call or the post-call.
   * The method passes all the arguments to the delegated methods except
   * `isPostCall` flag which is replaced by the model being simulated.
   *
   * The function follows the signature of `Function.prototype.apply()`.
   *
   * @method apply
   * @private
   * @param model {Model} Model being simulated.
   * @param [args=Array] {Array} Arguments for the functor. For simulators,
   * these arguments are `isPostCall` flag, time since the start of the
   * simulation, time to be simulated and the `update()` function to schedule
   * model updates.
   */
  Simulator.prototype.apply = function(model, args) {
    args = args || [];
    var isPostCall = args[0],
        newArgs = [model].concat(args.slice(1));
    this[isPostCall ? 'postSimulate' : 'simulate'].apply(this, newArgs);
  };

  /**
   * Performs the pre-call for the model's simulation. You can use the last
   * parameter, the `update()` callback, to delay model updates after the
   * completion of simulation stage (i.e, **after pre and post calls**):
   *
   *     GameOfLife.prototype.simulate = function (model, t, dt, update) {
   *       // Read the model...
   *       var aliveNeightbours = this.getAliveNeightbours(model);
   *       update(function () {
   *         // Update the model...
   *         if (model.isAlive && aliveNeightbours < 3) {
   *           model.isAlive = false;
   *         }
   *       });
   *     };
   *
   * @method simulate
   * @param model {Model} Model being simulated.
   * @param t {Number} Time in milliseconds passed since the start of the
   * simulation.
   * @param dt {Number} Amount of time in milliseconds to simulate.
   * @param update {Function} A callback to schedule a function to be run once
   * the simulation stage has ended.
   */
  Simulator.prototype.simulate = NOOP;

  /**
   * Performs the post-call for the model's simulation. You can use the last
   * parameter, the `update()` callback, to delay model updates after the
   * completion of simulation stage.
   * See {{#crossLink "Simulator/simulate:method"}}{{/crossLink}} for an usage
   * example.
   *
   * @method postSimulate
   * @param model {Model} Model being simulated.
   * @param t {Number} Time in milliseconds passed since the start of the
   * simulation.
   * @param dt {Number} Amount of time in milliseconds to simulate.
   * @param update {Function} A callback to schedule a function to be run once
   * the simulation stage has ended.
   */
  Simulator.prototype.postSimulate = NOOP;

  return Simulator;
}.call(this));


strongforce.Model = (function (Render, Simulator, EventEmitter) {
  'use strict';

  var NEXT_ID = 1,
      IS_PRECALL = strongforce.IS_PRECALL,
      IS_POSTCALL = strongforce.IS_POSTCALL,
      NOOP = strongforce.NOOP;

  /**
   * The model is the target of the strongforce {{#crossLink "Loop"}}
   * {{/crossLink}}. It follows a composite pattern to allow aggregation and
   * represents what is simulated and rendered through _facets_.
   *
   * A facet is a function or a functor (i.e **a function-like object**) which
   * reveals a specific behaviour depending on the stage being executed by the
   * strongforce's loop.
   *
   * The developer can extend this class, hook the proper facets and provide
   * {{#crossLink "Model/getSubmodels:method"}}{{/crossLink}} method to return
   * other submodels.
   *
   *     // [Inheritance]
   *     function GameOfLifeBoard(width, height) {
   *       // Your code...
   *       this.width = width;
   *       this.height = height;
   *       this.cells = [];
   *       for (var i = 0; i < width; i++) {
   *         for (var j = 0; j < height; j++) {
   *           this.cells.push(new Cell(i, j));
   *         }
   *       }
   *       Model.apply(this, arguments); // it's very important to keep this
   *                                     // call at the end of the model.
   *     }
   *     GameOfLifeBoard.prototype = Object.create(Model.prototype);
   *     GameOfLifeBoard.prototype.constructor = GameOfLifeBoard;
   *
   *     // [Hook the facets]
   *     GameOfLifeBoard.prototype.simulate = GameOfLifeBoardSimulator;
   *     GameOfLifeBoard.prototype.render = GameOfLifeBoardRender;
   *
   *     // [Specify submodels]
   *     GameOfLifeBoard.prototype.getSubmodels = function () {
   *       return this.cells;
   *     };
   *
   * @class Model
   * @uses EventEmitter
   * @constructor
   */
  function Model() {
    EventEmitter.apply(this);

    /**
     * A unique integer number to identify the model instance.
     *
     * @property id
     * @final
     * @type {Number}
     */
    Object.defineProperty(this, 'id', { value: NEXT_ID++ });

    // Setup facets must be the last thing to do!
    Model.setupFacets(this, [].slice.call(arguments, 0));
  }
  var EventEmitterPrototype = EventEmitter.prototype;
  for (var property in EventEmitterPrototype) {
    if (EventEmitterPrototype.hasOwnProperty(property)) {
      Model.prototype[property] = EventEmitterPrototype[property];
    }
  }

  /**
   * Detect if the facet hooks
   * ({{#crossLink "Model/facets:property"}}{{/crossLink}}) of a model
   * are pointing to classes extending helper functors
   * {{#crossLink "Simulator"}}{{/crossLink}} and
   * {{#crossLink "Render"}}{{/crossLink}}.
   * If so, replace them by fresh instances from those classes.
   *
   * @method setupFacets
   * @param model {Model} The model to hook up.
   * @param args {Array} An array of arguments to be passed along the model
   * itself to the functor constructor when instantiating it.
   * @static
   * @private
   */
  Model.setupFacets = function (model, args) {
    var isAFacetConstructor, facetPrototype, newFacet, facets;

    facets = Model.facets;

    for (var i = 0, facet; (facet = facets[i]); i++) {
      facetPrototype = model[facet].prototype;
      isAFacetConstructor = facetPrototype &&
                            facetPrototype.apply !== undefined &&
                            model[facet].apply !== undefined;

      if (isAFacetConstructor) {
        newFacet = Object.create(facetPrototype);
        model[facet].apply(newFacet, [model].concat(args));
        model[facet] = newFacet;
      }
    }
  };

  /**
   * List of facets. Currently they are
   * {{#crossLink "Model/simulate:method"}}{{/crossLink}} and
   * {{#crossLink "Model/render:method"}}{{/crossLink}}.
   *
   * @property facets
   * @type {Array}
   * @static
   * @private
   */
  Model.facets = ['simulate', 'render'];

  /**
   * Passes through the model in pre-order calling a specified method. The
   * current model is visited twice. The first time the method is called, it
   * is said to be the **pre-call**. The second call only happens after visiting
   * all the children models and it is said to be the **post-call**.
   *
   * @method traverse
   * @param methodName {String} The name of the method to call through the
   * model.
   * @param submodelsGetterName {String} The name of the method to call in order
   * to get the submodels.
   * @param methodArgs {Array} List of parameters to pass to the method after
   * the `isPostCall` flag.
   */
  Model.prototype.traverse =
  function(methodName, submodelsGetterName, methodArgs) {

    var submodels,
        submodelsMethod,
        method = this[methodName],
        isMethodApplicable = method && typeof method.apply === 'function';

    methodArgs = [null].concat(methodArgs);

    // pre-call
    if (isMethodApplicable) {
      methodArgs[0] = IS_PRECALL;
      method.apply(this, methodArgs);
    }

    // get submodules
    /*
    TODO: Consider applying getSubmodels() to the facet instead of model
    and passing the model as first parameter as already done with the main
    facet method.
    */
    submodels = [];
    submodelsMethod = this[submodelsGetterName];
    if (submodelsMethod && typeof submodelsMethod.apply === 'function') {
      submodels = submodelsMethod.apply(this) || [];
    }

    // traverse submodules
    var args = arguments;
    submodels.forEach(function (submodel) {
      submodel.traverse.apply(submodel, args);
    });

    // post-call
    if (isMethodApplicable) {
      methodArgs[0] = IS_POSTCALL;
      method.apply(this, methodArgs);
    }
  };

  /**
   * Facet to perform the simulation step of the model. Instead of simply
   * called, the facet is revealed by calling `apply()` over the model so it can
   * be implemented either by a simple JavaScript function or a complex functor.
   *
   * If set to a class extending the {{#crossLink "Simulator"}}{{/crossLink}}
   * class, when a new model is created, a new instance of the simulator class
   * is assigned to the instance's property.
   *
   * @method simulate
   * @param isPostCall {Boolean} Flag indicating if it is the post-call or not.
   * @param t {Number} Time in milliseconds passed since the start of the
   * simulation.
   * @param dt {Number} Amount of time in milliseconds to simulate.
   * @param update {Function} A callback to schedule a function to be run once
   * the simulation stage has ended.
   */
  Model.prototype.simulate = NOOP;

  /**
   * Return the (dynamic) list of submodels for the simulation stage. If it is
   * not overriden, it delegates in the
   * {{#crossLink "Model/getSubmodels:method"}}{{/crossLink}} method.
   *
   * @method getSimulateSubmodels
   * @return {Iterable} An object implementing `Array.prototype.forEach()`
   * signature.
   */
  Model.prototype.getSimulateSubmodels = function() {
    return this.getSubmodels();
  };

  /**
   * Facet to perform the render step of the model. Instead of simply
   * called, the facet is revealed by calling `apply()` over the model so it can
   * be implemented either by a simple JavaScript function or a complex functor.
   *
   * If set to a class extending the {{#crossLink "Render"}}{{/crossLink}}
   * class, when a new model is created, a new instance of the simulator class
   * is assigned to the instance's property.
   *
   * @method render
   * @param isPostCall {Boolean} Flag indicating if it is the post-call or not.
   * @param interpolationValue {Number} A measure of how much time remains to
   * simulate in the interval `[0, 1)`. The value can be used as an
   * interpolation value for rendering smooth animations.
   */
  Model.prototype.render = NOOP;

  /**
   * Return the (dynamic) list of submodels for the render stage. If it is
   * not overriden, it delegates in the
   * {{#crossLink "Model/getSubmodels:method"}}{{/crossLink}} method.
   *
   * @method getRenderSubmodels
   * @return {Iterable} An object implementing `Array.prototype.forEach()`
   * signature.
   */
  Model.prototype.getRenderSubmodels = function() {
    return this.getSubmodels();
  };

  /**
   * Return the (dynamic) list of submodels composing the current model.
   *
   * @method getSubmodels
   * @return {Iterable} An object implementing `Array.prototype.forEach()`
   * signature.
   */
  Model.prototype.getSubmodels = function() {
    return [];
  };

  return Model;
}.call(
  this,
  strongforce.Render,
  strongforce.Simulator,
  strongforce.EventEmitter
));

/**
 * @author Salvador de la Puente http://unoyunodiez.com/ @salvadelapuente
 */

  if (typeof exports !== 'undefined') {
      if (typeof module !== 'undefined' && module.exports) {
          exports = module.exports = strongforce;
      }
      exports.strongforce = strongforce;
  } else if (typeof define !== 'undefined' && define.amd) {
      define(strongforce);
  } else {
      root.strongforce = strongforce;
  }
}).call(this);
