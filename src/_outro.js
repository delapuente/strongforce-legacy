/**
 * @author Salvador de la Puente http://unoyunodiez.com/ @salvadelapuente
 */

  if (typeof exports !== 'undefined') {
      if (typeof module !== 'undefined' && module.exports) {
          exports = module.exports = strongforce;
      }
      exports.strongforce = strongforce;
  } else if (typeof define !== 'undefined' && define.amd) {
      define(strongforce);
  } else {
      root.strongforce = strongforce;
  }
}).call(this);
