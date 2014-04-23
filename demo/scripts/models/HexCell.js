this.define([
  'scaffolding',
  'strongforce',
  'models/Hexagon',
  'renders/HexCellRender',
  'simulators/HexCellSimulator'
], function(S, strongforce, Hexagon, HexCellRender, HexCellSimulator) {
  'use strict';

  function HexCell(cellId, size, position, alive) {
    this.cellId = cellId;
    this.alive = alive || false;

    Hexagon.call(this, size, position);
  }
  S.theClass(HexCell).inheritsFrom(Hexagon);

  HexCell.prototype.render = HexCellRender;
  HexCell.prototype.simulate = HexCellSimulator;

  return HexCell;
});
