define([
], function () {
  'use strict';

  /**
   * Provide methods for dispatching events and add or remove listeners to
   * specified types of events.
   *
   * @class EventEmitter
   * @constructor
   */
  function EventEmitter() {
    var self = this;

    /**
     * Keeps the list of listeners by event type.
     *
     * @property _listeners
     * @type {Object}
     * @private
     * @final
     */
    Object.defineProperty(this, '_listeners', { value: {} });

    /**
     * Bound version of
     * {{#crossLink "EventEmitter/_bubbleEvent:method"}}{{/crossLink}}
     * method. This bound version allow the
     * porxy to be naturally unique as calls to
     * {{#crossLink "EventEmitter/addEventListener:method"}}{{/crossLink}}
     * with same arguments are ignored.
     *
     * @method _boundBubbleEvent
     * @param evt {StrongforceModelEvent} the event to be dispatched.
     * @private
     * @final
     */
    Object.defineProperty(this, '_boundBubbleEvent', {
      value: function (evt) {
        self._bubbleEvent(evt);
      }
    });
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
    Object.defineProperty(event, 'type', { value: type });
    Object.defineProperty(event, 'target', { value: this });
    Object.defineProperty(event, 'currentTarget', { value: this });
    Object.defineProperty(event, 'timestamp', { value: Date.now() });
    this._runListeners(type, event);
    this._runListeners('*', event);
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
   * Makes the current instance to dispatch an event each time the other
   * emitter, passed as parameter, dispatches an event. All properties from
   * the original event are kepts unaltered except the `currentTarget`
   * property which is updated to point the current instance.
   *
   * @method proxyEventsFrom
   * @param anotherEmitter {EventEmitter} the emitter to be proxied.
   */
  EventEmitter.prototype.proxyEventsFrom = function (anotherEmitter) {
    if (!anotherEmitter ||
        typeof anotherEmitter.addEventListener !== 'function') {
      return;
    }

    anotherEmitter.addEventListener('*', this._boundBubbleEvent);
  };

  /**
   * Dispatch a new event based on another received from an EventEmitter
   * instance being proxied by this instance. The `currentTarget` property is
   * updated to the current instance.
   *
   * This implementation is not directly used as it needs to be bound to
   * the current instance. This is done in the constructor.
   *
   * @method _bubbleEvent
   * @param evt {StrongforceModelEvent} the event to be dispatched.
   * @private
   */
  EventEmitter.prototype._bubbleEvent = function (evt) {
    var newEvt = Object.create(evt);
    Object.defineProperty(newEvt, 'currentTarget', { value: this });
    this._runListeners(newEvt.type, newEvt);
    this._runListeners('*', newEvt);
  };

  /**
   * Add a listener for an event type to be executed synchronously every time
   * the model emits an event of the provided type. You can optionally indicate
   * the listener should run only once.
   *
   * You can listen for any kind of event specifying `*` as type.
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
   * @method removeAllEventListener
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

});
