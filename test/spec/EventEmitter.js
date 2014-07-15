define([], function () {
  'use strict';

  var context = newContext();

  describe('src/EventEmitter', function () {

    var EventEmitter;

    beforeEach(function (done) {
      context(['src/EventEmitter'], function (EventEmitterModule) {
        EventEmitter = EventEmitterModule;
        done();
      });
    });

    describe('EventEmitter instances', function () {

      it('allow to add callbacks without repetitions.', function() {
        var model = new EventEmitter();
        function callback() {}

        model.addEventListener('anytype', callback);
        model.addEventListener('anytype', callback);

        /* jshint sub:true */
        expect(model._listeners).to.have.ownProperty('anytype');
        expect(model._listeners['anytype'].length).to.equal(1);
        expect(model._listeners['anytype'][0][0]).to.equal(callback);
      });

      it('allow to remove a callback.', function() {
        var model = new EventEmitter();
        function callback() {}

        model.addEventListener('anytype', callback);
        model.removeEventListener('anytype', callback);

        /* jshint sub:true */
        expect(model._listeners).to.have.ownProperty('anytype');
        expect(model._listeners['anytype'].length).to.equal(0);
      });

      it('allow to dispatch an event of a given type.', function() {
        var model = new EventEmitter(),
            event = { details: {} },
            receivedEvent = null;

        function callback(evt) { receivedEvent = evt; }
        model.addEventListener('anytype', callback);

        model.dispatchEvent('anytype', event);

        expect(receivedEvent).to.equal(event);
        expect(receivedEvent.type).to.equal('anytype');
        expect(receivedEvent.target).to.equal(model);
        expect(receivedEvent.details).to.equal(event.details);
      });

      it('allow to add callbacks for listening only once.', function() {
        var callCount = 0,
            model = new EventEmitter();

        function callback() { callCount++; }
        model.addEventListener('anytype', callback, true);

        model.dispatchEvent('anytype', {});
        model.dispatchEvent('anytype', {});

        expect(callCount).to.equal(1);
      });

      it('allow to listen for an event of any type', function () {
        var events = [],
            model = new EventEmitter();

        function callback(evt) { events.push(evt); }
        model.addEventListener('*', callback);

        model.dispatchEvent('anytype', {});
        model.dispatchEvent('anotherType', {});

        expect(events.length).to.equal(2);
        expect(events[0].type).to.equal('anytype');
        expect(events[1].type).to.equal('anotherType');
      });

      it('allow to listen for an event of any type once', function () {
        var events = [],
            model = new EventEmitter();

        function callback(evt) { events.push(evt); }
        model.addEventListener('*', callback, true);

        model.dispatchEvent('anytype', {});
        model.dispatchEvent('anotherType', {});

        expect(events.length).to.equal(1);
        expect(events[0].type).to.equal('anytype');
      });

      it('allow to proxy the events from other EventEmitter instance',
        function() {
          var modelTarget, modelCurrentTarget,
              proxyTarget, proxyCurrentTarget,
              event = {},
              model = new EventEmitter(),
              proxy = new EventEmitter();

          function callbackForModel(evt) {
            modelTarget = evt.target;
            modelCurrentTarget = evt.currentTarget;
          }

          function callbackForProxy(evt) {
            proxyTarget = evt.target;
            proxyCurrentTarget = evt.currentTarget;
          }

          proxy.proxyEventsFrom(model);
          model.addEventListener('*', callbackForModel);
          proxy.addEventListener('*', callbackForProxy);

          model.dispatchEvent('anytype', event);

          expect(modelTarget).to.equal(model);
          expect(modelTarget).to.equal(modelCurrentTarget);

          expect(proxyTarget).to.equal(modelTarget);
          expect(proxyCurrentTarget).to.equal(proxy);
        }
      );

    });
  });
});
