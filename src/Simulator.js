define([
  './consts'
], function(consts) {
  'use strict';

  var NOOP = consts.NOOP;

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
});
