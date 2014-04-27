this.define([
  'scaffolding',
  'strongforce',
  'models/Hexagon',
  'models/HexCell'
], function(S, strongforce) {
  'use strict';

  var Model = strongforce.Model,
      selectDirection;

  selectDirection = {
    N: function(cellId) {
      return [
        cellId[0] - 2,
        cellId[1]
      ];
    },
    NE: function(cellId) {
      return [
        cellId[0] - 1,
        cellId[1] + (1 - cellId[0] % 2)
      ];
    },
    SE: function(cellId) {
      return [
        cellId[0] + 1,
        cellId[1] + (1 - cellId[0] % 2)
      ];
    },
    S: function(cellId) {
      return [
        cellId[0] + 2,
        cellId[1]
      ];
    },
    SW: function(cellId) {
      return [
        cellId[0] + 1,
        cellId[1] - cellId[0] % 2
      ];
    },
    NW: function(cellId) {
      return [
        cellId[0] - 1,
        cellId[1] - cellId[0] % 2
      ];
    }
  };

  function Neighborhood(board, cellId) {
    this._board = board;
    this._cellId = cellId;
  }
  S.theClass(Neighborhood).inheritsFrom(Model);

  Neighborhood.prototype.getAliveNeighbours = function () {
    return this._getNeighborhood().filter(function (cell) {
      return cell && cell.alive;
    }).length;
  };

  Neighborhood.prototype._getNeighborhood = function () {
    return [
      this._getNeighbour('N'),
      this._getNeighbour('NE'),
      this._getNeighbour('SE'),
      this._getNeighbour('S'),
      this._getNeighbour('SW'),
      this._getNeighbour('NW')
    ];
  };

  Neighborhood.prototype._getNeighbour = function (direction) {
    var cellId = this._cellId,
        rows = this._board.length,
        cols = this._board[0].length;

    direction = direction.toUpperCase();
    var neighbourId = selectDirection[direction](cellId),
        r = neighbourId[0], c = neighbourId[1],
        isOutOfBounds = r < 0 || r >= rows || c < 0 || c >= cols;

    return isOutOfBounds ? null : this._board[r][c];
  };

  return Neighborhood;
});
