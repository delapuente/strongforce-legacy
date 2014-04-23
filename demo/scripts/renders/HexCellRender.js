this.define([
  'strongforce',
  'renders/HexagonRender',
  'scaffolding'
], function(strongforce, HexagonRender, S) {
  'use strict';

  function HexCellRender() { HexagonRender.apply(this, arguments); }
  S.theClass(HexCellRender).inheritsFrom(HexagonRender);

  HexCellRender.prototype.render = function(model) {
    model.fillColor = model.alive ? 'black' : 'white';
    model.fillColor = model.debug ? model.debug : model.fillColor;
    HexagonRender.prototype.render.call(this, model);
  };

  return HexCellRender;
});
