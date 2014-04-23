this.define([
  'scaffolding',
  'strongforce'
], function(S, strongforce) {
  'use strict';

  var Model = strongforce.Model,
      Render = strongforce.Render;

  function Hexagon(size, position) {
    this.fillColor = 'transparent';
    this.lineColor = 'black';
    this.size = size || 150;
    this.position = position || [0, 0];
    this.rotation = 0;

    Model.apply(this, arguments);
  }
  S.theClass(Hexagon).inheritsFrom(Model);

  Hexagon.prototype.render = Render;

  return Hexagon;
});
