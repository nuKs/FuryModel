(function() {
  'use strict';

  function FuryFactory(model) {
    this._model = model;
    this._instances = {};
  }

  FuryFactory.prototype.create = function() {
    var self = this,
        instance = new this._model();

    instance.$once('created', function() {
      self._instances[instance._pk] = instance;
    });

    return instance;
  };
  FuryFactory.prototype.get = function(pk) {
    var self = this;

    if (typeof this._instances[pk] === 'undefined') {
      this._instances[pk] = new this._model(pk);

      this._instances[pk].$once('deleted', function() {
        delete self._instances[pk];
      });
    }

    return this._instances[pk];
  };


  FuryFactory.define = function(model, opts) {
    var FuryFactoryExtended;

    if (typeof opts._constructor !== 'undefined') {
      FuryFactoryExtended = opts._constructor;
    }
    else {
      FuryFactoryExtended = function(model) {
        FuryFactory.call(this, model);
      };
    }

    FuryFactoryExtended.prototype = Object.create(FuryFactory.prototype);
    FuryFactoryExtended.prototype.constructor = FuryFactoryExtended;

    Object
    .keys(opts)
    .filter(function(prop) {
      return prop !== 'constructor';
    })
    .forEach(function(prop) {
      FuryFactoryExtended.prototype[prop] = opts[prop];
    });

    return new FuryFactoryExtended(model);

  };

  if (typeof exports !== 'undefined') {
    exports = FuryFactory;
  }
  else {
    window.FuryFactory = FuryFactory;
  }

})();