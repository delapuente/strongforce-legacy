define([
  './consts',
  './Loop',
  './Render',
  './Simulator',
  './Model',
  './EventEmitter'
], function (consts, Loop, Render, Simulator, Model, EventEmitter) {
  'use strict';

  return {
    consts: consts,
    Loop: Loop,
    Render: Render,
    Simulator: Simulator,
    Model: Model,
    EventEmitter: EventEmitter
  };
});
