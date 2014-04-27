this.define([
  'scaffolding',
  'strongforce',
  'models/Neighborhood',
  'models/Hexagon',
  'models/HexCell'
], function(S, strongforce, Neighborhood, Hexagon, HexCell) {
  'use strict';

  var Model = strongforce.Model,
      FOSSIL_CELL;

  // Ad-hoc completely dead (no render / no behaviour) cell
  FOSSIL_CELL = new HexCell([-1, -1], 0, [0, 0], false);
  FOSSIL_CELL.render = undefined;
  FOSSIL_CELL.simulate = undefined;

  var sample =
           '0' +
          '0 0' +
         '0 0 0' +
        '0 0 0 0' +
       '0 0 0 0 0' +
      '0 0 0 0 0 0' +
     '0 0 0 0 0 0 0' +
    '0 0 0 0 0 0 0 0' +
   '0 0 0 0 0 0 0 0 0' +
  '0 0 0 0 0 0 0 0 0 0' +
  ' 0 0 0 0 0 0 0 0 0 ' +
  '0 0 0 0 0 0 0 0 0 0' +
  ' 0 0 0 0 1 0 0 0 0 ' +
  '0 0 0 0 1 1 0 0 0 0' +
  ' 0 0 0 1 0 1 0 0 0 ' +
  '0 0 0 1 0 0 1 0 0 0' +
  ' 0 0 0 0 1 0 0 0 0 ' +
  '0 0 0 1 1 1 1 0 0 0' +
  ' 0 0 0 0 0 0 0 0 0 ' +
  '0 0 0 1 1 1 1 0 0 0' +
  ' 0 0 0 0 1 0 0 0 0 ' +
  '0 0 0 1 0 0 1 0 0 0' +
  ' 0 0 0 1 0 1 0 0 0 ' +
  '0 0 0 0 1 1 0 0 0 0' +
  ' 0 0 0 0 1 0 0 0 0 ' +
  '0 0 0 0 0 0 0 0 0 0' +
  ' 0 0 0 0 0 0 0 0 0 ' +
  '0 0 0 0 0 0 0 0 0 0' +
   '0 0 0 0 0 0 0 0 0' +
    '0 0 0 0 0 0 0 0' +
     '0 0 0 0 0 0 0' +
      '0 0 0 0 0 0' +
       '0 0 0 0 0' +
        '0 0 0 0' +
         '0 0 0' +
          '0 0' +
           '0';

  function GameOfLife(side, cellRadius, center) {
    var self = this;

    var BOARD_SIZE = 150,
        START_OF_THE_FILL_AREA = Math.sqrt(3) * cellRadius * (side - 1),
        board = [], cols, rows;

    self._background = null;
    self._cells = [];

    setupFrame();
    setupBoard();
    setupInitialConfiguration(sample);

    Model.call(self);

    function setupFrame() {
      var board = new Hexagon(BOARD_SIZE, center);
      board.fillColor = 'white';
      board.rotation = Math.PI / 2;
      self._background = board;
    }

    function setupBoard() {
      var cell, neighborhood, cellId,
          isRowOdd, evenRowStartingX, oddRowStartingX,
          x, y, stepX, stepY;

      cols = side;
      rows = ((side * 2 - 1) * 2) - 1;

      stepX = 3 * cellRadius;
      stepY = Math.sqrt(3) / 2 * cellRadius;
      oddRowStartingX = center[0] - (3 / 2 * cellRadius * (side - 1));
      evenRowStartingX = center[0] - (3 / 2 * cellRadius * (side - 2));

      y = center[1] - START_OF_THE_FILL_AREA;
      for (var r = 0; r < rows; r++) {
        board[r] = [];
        isRowOdd = (r % 2 === 1);
        x = isRowOdd ? oddRowStartingX : evenRowStartingX;
        for (var c = 0; c < cols; c++) {
          cellId = [r, c];
          neighborhood = new Neighborhood(board, cellId);
          cell = isOutOfTheHexagon(r, c) ?
                 FOSSIL_CELL :
                 new HexCell(cellId, 0.9 * cellRadius, [x, y]);
          cell.neighborhood = neighborhood;
          board[r][c] = cell;
          self._cells.push(cell);
          x += stepX;
        }
        y += stepY;
      }
    }

    // Consider a hexagon as:
    // A top triangle:     /\
    // A central zone:     ||
    // A bottom triangle:  \/
    function isOutOfTheHexagon(r, c) {
      var topBoundary, bottomBoundary,
          leftBoundary, rightBoundary,
          isRowEven = (r % 2 === 0),
          middle = (side / 2) - 1;

      return isNotInCentralZone(r, c) &&
             isNotInTopTriangle(r, c) &&
             isNotInBottomTriangle(r, c);

      function isNotInCentralZone(r, c) {
        topBoundary = side - 1;
        bottomBoundary = rows - side;

        if (r < topBoundary || r > bottomBoundary ||
            isRowEven && c === side - 1) {
          return true;
        }
      }

      function isNotInTopTriangle(r, c) {
        var index; // index in the odd/even serie

        if (r >= topBoundary) {
          return true;
        }

        index = isRowEven ? r / 2 : (r - 1) / 2;
        if (isRowEven) {
          leftBoundary = middle - index;
          rightBoundary = middle + index;
        }
        else {
          leftBoundary = middle - index;
          rightBoundary = (middle + index) + 1;
        }

        return c < leftBoundary || c > rightBoundary;
      }

      function isNotInBottomTriangle(r, c) {
        var equivalentRowForTopTriangle;

        if (r <= bottomBoundary || r === side * 4) {
          return true;
        }

        equivalentRowForTopTriangle = side - (r - bottomBoundary) - 1;
        return isNotInTopTriangle(equivalentRowForTopTriangle, c);
      }
    }

    function setupInitialConfiguration(sample) {
      sample = sample.replace(/ /g, '').split('');
      var cell, isAlive;
      for (var r = 0, rc = board.length; r < rc; r++) {
        for (var c = 0, cc = board[r].length; c < cc; c++) {
          cell = board[r][c];
          if (cell !== FOSSIL_CELL) {
            isAlive = sample ? sample.shift() !== '0' : (Math.random() < 0.5);
            cell.alive = isAlive;
          }
        }
      }
    }
  }
  S.theClass(GameOfLife).inheritsFrom(Model);

  GameOfLife.prototype.getSubmodels = function getSubmodels() {
    return [this._background].concat(this._cells);
  };

  return GameOfLife;
});
