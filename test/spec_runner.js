var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
mocha.setup('bdd');

requirejs([
  'spec/EventEmitter',
  'spec/Model',
  'spec/Render',
  'spec/Simulator'
], function () {
  mocha.run();
});
