
strongforce.Model = (function (Render, Simulator, EventEmitter) {
  'use strict';

  var NEXT_ID = 1,
      IS_PRECALL = strongforce.IS_PRECALL,
      IS_POSTCALL = strongforce.IS_POSTCALL,
      NOOP = strongforce.NOOP;

  function setupFacets(model, args) {
    var isAFacetConstructor, baseClass, facetPrototype, newFacet, facets;

    facets = {
      'simulate': Simulator,
      'render': Render
    };

    for (var facet in facets) {
      if (facets.hasOwnProperty(facet)) {
        baseClass = facets[facet];
        facetPrototype = model[facet].prototype;
        isAFacetConstructor = facetPrototype instanceof baseClass;
        if (isAFacetConstructor) {
          newFacet = Object.create(facetPrototype);
          model[facet].apply(newFacet, [model].concat(args));
          model[facet] = newFacet;
        }
      }
    }
  }

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

    // Facets must be the last thing to do
    setupFacets(this, [].slice.call(arguments, 0));
  }
  var EventEmitterPrototype = EventEmitter.prototype;
  for (var property in EventEmitterPrototype) {
    if (EventEmitterPrototype.hasOwnProperty(property)) {
      Model.prototype[property] = EventEmitterPrototype[property];
    }
  }

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
