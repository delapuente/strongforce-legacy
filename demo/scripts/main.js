this.requirejs.config({
  baseUrl: 'scripts',
  paths: {
    strongforce: '../../dist/strongforce',
    scaffolding: 'lib/scaffolding'
  }
});

var simulation;

this.define([
  'strongforce',
  'models/GameOfLife'
], function (strongforce, GameOfLife) {
  'use strict';

  var Loop = strongforce.Loop;

  var canvas = document.getElementsByTagName('canvas')[0],
      logoComputedStyle, canvasCenter,
      gameOfLife;

  window.buffer = canvas;
  window.drawer = canvas.getContext('2d');

  logoComputedStyle = window.getComputedStyle(canvas);
  canvas.width = parseInt(logoComputedStyle.width, 10);
  canvas.height = parseInt(logoComputedStyle.height, 10);
  canvasCenter = [canvas.width/2, canvas.height/2];

  gameOfLife = new GameOfLife(10, 8, canvasCenter),
  simulation = new Loop({
    rootModel: gameOfLife
  });
  simulation.start();

});
