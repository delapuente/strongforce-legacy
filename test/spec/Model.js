describe('src/Model', function () {
  'use strict';

  var Model = strongforce.Model;
  var EventEmitter = strongforce.EventEmitter;

  var SimulateFunctor, RenderFunctor;

  beforeEach(function () {
    SimulateFunctor = sinon.spy();
    SimulateFunctor.prototype.apply = sinon.spy();
    RenderFunctor = sinon.spy();
    RenderFunctor.prototype.apply = sinon.spy();
  });

  describe('Model class', function () {

    it('has `setupFacet` method which does nothing in case of facet hooks ' +
       'are functions', function () {

      var originalSimulate = sinon.spy();
      var originalRender = sinon.spy();

      var model = Object.create(Model.prototype, {
        simulate: { value: originalSimulate },
        render: { value: originalRender }
      });

      Model.setupFacets(model, []);

      expect(model.simulate).to.equal(originalSimulate);
      expect(model.render).to.equal(originalRender);
    });

    it('has `setupFacet` method which replace functors class references by ' +
       'functor instances', function () {

      var model = Object.create(Model.prototype, {
        simulate: { value: SimulateFunctor, writable: true },
        render: { value: RenderFunctor, writable: true }
      });

      Model.setupFacets(model, []);

      expect(model.simulate).to.be.an.instanceOf(SimulateFunctor);
      expect(model.render).to.be.an.instanceOf(RenderFunctor);
    });

  });

  describe('Model instances', function () {
    it('when created, creates its render and simulator passing ' +
       'the model and the model constructor\'s parameters.', function() {
      var MyModel, model, simulate, render, args;

      MyModel = function () { Model.apply(this, arguments); };
      MyModel.prototype = Object.create(Model.prototype);

      simulate = MyModel.prototype.simulate = SimulateFunctor;
      render = MyModel.prototype.render = RenderFunctor;

      model = new MyModel(1, 2, 3);
      args = [model, 1, 2, 3];

      expect(simulate.calledOnce).to.be.true;
      expect(simulate.calledWithExactly(model, 1, 2, 3)).to.be.true;

      expect(render.calledOnce).to.be.true;
      expect(render.calledWithExactly(model, 1, 2, 3)).to.be.true;
    });

    it('have a `traverse()` method to implement a simple visitor.', function() {
      var model = new Model(),
          submodel = { traverse: sinon.spy() },
          methodArgs = [1, 2, 3],
          submodels = [submodel, submodel],
          IS_PRECALL = strongforce.IS_PRECALL,
          IS_POSTCALL = strongforce.IS_POSTCALL;

      model.test = sinon.spy();
      model.getTestSubmodels = sinon.stub().returns(submodels);

      model.traverse('test', 'getTestSubmodels', methodArgs);

      // call the model method with precall flag and methodArgs
      expect(model.test.calledTwice).to.be.true;
      expect(model.test.getCall(0).args)
        .to.deep.equal([IS_PRECALL].concat(methodArgs));

      // retrieve the submodels
      expect(model.getTestSubmodels.calledOnce).to.be.true;

      // call traverse for each submodel with the same parameters
      expect(submodel.traverse.callCount).to.equal(submodels.length);
      expect(
        submodel.traverse
          .alwaysCalledWith('test', 'getTestSubmodels', methodArgs)
      ).to.be.true;

      // call the model method with postcall flag and methodArgs
      expect(model.test.getCall(1).args)
        .to.deep.equal([IS_POSTCALL].concat(methodArgs));
    });

    it('mix EventEmitter.', function() {
      var model = new Model();

      for (var name in EventEmitter.prototype) {
        if (EventEmitter.prototype.hasOwnProperty(name)) {
          expect(model[name]).to.equal(EventEmitter.prototype[name]);
        }
      }
    });
  });
});
