define([
], function () {
  'use strict';

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

  var requestAnimationFrame = window.requestAnimationFrame;

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
});
