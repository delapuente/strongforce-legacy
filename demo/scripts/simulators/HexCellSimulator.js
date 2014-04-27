this.define([
  'strongforce',
  'scaffolding'
], function(strongforce, S) {
  'use strict';

  var Simulator = strongforce.Simulator;

  var TICK_TIME = 1000;
  var RULE = {
    survive: [3,5],
    born: [2]
  };

  function HexCellSimulator() {
    this._waitForTick = TICK_TIME;
  }
  S.theClass(HexCellSimulator).inheritsFrom(Simulator);

  HexCellSimulator.prototype.simulate = function (model, t, dt, update) {
    this._waitForTick -= dt;
    if (this._waitForTick > 0) { return; }

    this._waitForTick += TICK_TIME;
    this._nextGeneration(model, update);
  };

  HexCellSimulator.prototype._nextGeneration = function (model, update) {
    var aliveCount = model.neighborhood.getAliveNeighbours();
    if (model.alive && !this._survive(aliveCount)) {
      update(function() {
        model.alive = false;
      });
    }

    else if (!model.alive && this._born(aliveCount)) {
      update(function() {
        model.alive = true;
      });
    }
  };

  HexCellSimulator.prototype._survive = function (aliveCount) {
    return RULE.survive.indexOf(aliveCount) > -1;
  };

  HexCellSimulator.prototype._born = function (aliveCount) {
    return RULE.born.indexOf(aliveCount) > -1;
  };

  return HexCellSimulator;
});
