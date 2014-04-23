describe('src/EventEmitter', function () {
  'use strict';

  var EventEmitter = strongforce.EventEmitter;

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
          event = {},
          model = new EventEmitter();

      function callback() { callCount++; }
      model.addEventListener('anytype', callback, true);

      model.dispatchEvent('anytype', event);
      model.dispatchEvent('anytype', event);

      expect(callCount).to.equal(1);
    });

  });
});
