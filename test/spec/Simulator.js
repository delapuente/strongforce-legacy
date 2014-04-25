define([], function() {
  'use strict';

  var context = newContext();

  describe('src/Simulator', function() {

    var Simulator, consts;

    beforeEach(function (done) {
      context([
        'src/Simulator',
        'src/consts'
      ], function (SimulatorModule, constsModule) {
        Simulator = SimulatorModule;
        consts = constsModule;
        done();
      });
    });

    describe('Simulator instances', function() {

      it('have an apply() method delegating on `simulator()` or ' +
         '`postSimulator()` according to the IS_POSTCALL flag.', function() {
        var simulator = new Simulator(),
            model = {},
            argsForPrecall = [consts.IS_PRECALL, 2, 3],
            argsForPostcall = [consts.IS_POSTCALL, 2, 3];

        sinon.spy(simulator, 'apply');
        sinon.spy(simulator, 'simulate');
        sinon.spy(simulator, 'postSimulate');

        simulator.apply(model, argsForPrecall);
        simulator.apply(model, argsForPostcall);

        expect(simulator.simulate.calledWith(model, 2, 3)).to.be.true;
        expect(simulator.postSimulate.calledWith(model, 2, 3)).to.be.true;
      });

    });
  });

});
