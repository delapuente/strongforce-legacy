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
    this.waitForTick = TICK_TIME;
  }
  S.theClass(HexCellSimulator).inheritsFrom(Simulator);

  HexCellSimulator.prototype.simulate = function (model, t, dt, update) {
    this.waitForTick -= dt;
    if (this.waitForTick > 0) { return; }

    this.waitForTick += TICK_TIME;
    this.nexGeneration(model, update);
  };

  HexCellSimulator.prototype.nexGeneration = function (model, update) {
    var aliveCount = model.getAliveNeightboursCount();
    if (model.alive && !this.survive(aliveCount)) {
      update(function() {
        model.alive = false;
      });
    }

    else if (!model.alive && this.born(aliveCount)) {
      update(function() {
        model.alive = true;
      });
    }
  };

  HexCellSimulator.prototype.survive = function (aliveCount) {
    return RULE.survive.indexOf(aliveCount) > -1;
  };

  HexCellSimulator.prototype.born = function (aliveCount) {
    return RULE.born.indexOf(aliveCount) > -1;
  };

  return HexCellSimulator;
});
