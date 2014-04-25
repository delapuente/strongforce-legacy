define([
  './consts'
], function(consts) {
  'use strict';

  var NOOP = consts.NOOP,
      IS_PRECALL = consts.IS_PRECALL,
      IS_POSTCALL = consts.IS_POSTCALL;

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
   * @param model {Model} The model for which this functor is being
   * instantiated.
   * @param [modelParameters]* {Any} The same parameters passed to the model
   * constructor.
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
   * Helper method to trigger the render pre-call of a model. It is usually
   * used from the {{#crossLink "Render/render:method"}}{{/crossLink}}
   * method.
   *
   * @method delegateToRender
   * @param model {Model} Model in which delegate.
   * @param [args]* {Any} The parameters passed to the render pre-call of the
   * model. It is convinient to simply bypass the same arguments received in the
   * {{#crossLink "Render/render:method"}}{{/crossLink}} method.
   */
  Render.prototype.delegateToRender = function (model) {
    var args = [IS_PRECALL].concat(Array.prototype.slice.call(arguments, 1));
    model.render.apply(model, args);
  };

  /**
   * Helper method to trigger the render post-call of a model. It is usually
   * used from the {{#crossLink "Render/postRender:method"}}{{/crossLink}}
   * method.
   *
   * @method delegateToPostRender
   * @param model {Model} Model in which delegate.
   * @param [args]* {Any} The parameters passed to the render post-call of the
   * model. It is convinient to simply bypass the same arguments received in the
   * {{#crossLink "Render/postRender:method"}}{{/crossLink}} method.
   */
  Render.prototype.delegateToPostRender = function (model) {
    /* TODO: Consider make a factory for delegations */
    var args = [IS_POSTCALL].concat(Array.prototype.slice.call(arguments, 1));
    model.render.apply(model, args);
  };

  return Render;
});
