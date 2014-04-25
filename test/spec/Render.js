define([], function() {
  'use strict';

  var context = newContext();

  describe('src/Render', function() {

    var Render, IS_PRECALL, IS_POSTCALL;

    beforeEach(function (done) {
      context([
        'src/Render',
        'src/consts'
      ], function (RenderModule, constsModule) {
        Render = RenderModule;
        IS_PRECALL = constsModule.IS_PRECALL;
        IS_POSTCALL = constsModule.IS_POSTCALL;
        done();
      });
    });

    describe('Render instances', function() {

      it('have an `apply()` method delegating on `render()` or ' +
         '`postRender()` according to the IS_POSTCALL flag.', function() {
        var render = new Render(),
            model = {},
            argsForPrecall = [IS_PRECALL, 2, 3],
            argsForPostcall = [IS_POSTCALL, 2, 3];

        sinon.spy(render, 'apply');
        sinon.spy(render, 'render');
        sinon.spy(render, 'postRender');

        render.apply(model, argsForPrecall);
        render.apply(model, argsForPostcall);

        expect(render.render.calledWith(model, 2, 3)).to.be.true;
        expect(render.postRender.calledWith(model, 2, 3)).to.be.true;
      });

      it('have a `delegateToRender()` method for isssuing the render ' +
         'pre-call of a model.', function() {
        var render = new Render(),
            model = { render: sinon.spy() },
            arg = {};

        sinon.spy(model.render, 'apply');

        render.delegateToRender(model, arg);

        expect(
          model.render.apply.calledWith(model, [IS_PRECALL, arg])
        ).to.be.true;
      });

      it('have a `delegateToPostRender()` method for isssuing the render ' +
         'post-call of a model.', function() {
        var render = new Render(),
            model = { render: sinon.spy() },
            arg = {};

        sinon.spy(model.render, 'apply');

        render.delegateToPostRender(model, arg);

        expect(
          model.render.apply.calledWith(model, [IS_POSTCALL, arg])
        ).to.be.true;
      });

    });
  });

});
