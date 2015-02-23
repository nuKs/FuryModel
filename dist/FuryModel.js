(function() {
  'use strict';

  function FuryModel(pk) {
    this._remoteData = null;
    this._eventQueue = {
      'loaded': [],
      'created': [],
      'deleted': []
    };
    this._filteredProperties = [
      '_pk',
      '_remoteData',
      '_eventQueue',
      '_filteredProperties',
      '_init',
      '_load',
      '_create',
      '_update',
      '_delete',
      '_process',
      '_unprocess',
      '$exists',
      '$load',
      '$reset',
      '$save',
      '$delete',
      '$raw',
      '$once'
    ];

    if (typeof pk === 'undefined') {
      this._pk = null;
    }
    else {
      this._pk = pk;
    }

    if (this._pk === null) {
      this._init();
    }
    else {
      this.$load();
    }
  }
  FuryModel.prototype._init = function() {
    // may inherit
    // responsability: define default values
  };
  FuryModel.prototype._load = function() {
    // to inherit
    // should return a promise with raw data resolved
  };
  FuryModel.prototype._create = function(data) {
    // to inherit
    // should return a promise with the primary key and created raw data as resolved values
  };
  FuryModel.prototype._update = function(data) {
    // to inherit
    // should return a promise
  };
  FuryModel.prototype._delete = function() {
    // to inherit
    // should return a promise
  };
  FuryModel.prototype._process = function(data) {
    // may inherit
    // convert some raw values to something else
    // return processed datas

    return data;
  };
  FuryModel.prototype._unprocess = function(object) {
    // may inherit
    // should return a raw object

    return object;
  };

  FuryModel.prototype.$exists = function() {
    return this._pk !== null;
  };

  FuryModel.prototype.$load = function() {
    var self = this;
    if (this._remoteData !== null) {
      return when.resolve(this);
    }
    else {
      return this.
      _load()
      .then(function(raw) {
        self._remoteData = raw;

        _setProperties(self, self._process(raw));
        return _callEventsOnce(self._eventQueue, 'loaded', self);
      });
    }
  };

  FuryModel.prototype.$reset = function() {
    Object.keys(this)
    .filter(function(prop) {
      return this._filteredProperties.indexOf(prop) === -1;
    }, this)
    .forEach(function(prop) {
      if (typeof this._remoteObject[prop] === 'undefined') {
        delete this[prop];
      }
      else {
        this[prop] = this._remoteObject[prop]; // @todo deep copy
      }
    }, this);
  };

  FuryModel.prototype.$save = function(data) {
    var self = this;
    if (!this.$exists()) {
      return this
        ._create(data || this.$raw())
        .then(function(pk, raw) {
          self._pk = pk;
          self._remoteData = raw;

          _setProperties(self, self._process(raw));

          return _callEventsOnce(self._eventQueue, 'created', self)
          .then(_callEventsOnce.bind(undefined, self._eventQueue, 'loaded', self));
        });
    }
    else {
      return this
        ._update(data || this.$raw())
        .then(function() {
          self._remoteData = self.$raw(true); // @todo optimize
          return when.resolve(self);
        });
    }
  };
  FuryModel.prototype.$delete = function() {
    var self = this;
    return this
      ._delete()
      .then(function() {
        self._remoteData = null;
        return _callEventsOnce(self._eventQueue, 'deleted');
      });
  };
  FuryModel.prototype.$raw = function(enableUnprocess) {
    var rawObject;

    if (typeof enableUnprocess === 'undefined') {
      enableUnprocess = true;
    }

    if (enableUnprocess) {
      rawObject = this._unprocess(this);
    }
    else {
      rawObject = {};
    }

    Object
    .keys(this)
    .filter(function(key) {
      return this._filteredProperties.indexOf(key) === -1 && !rawObject.hasOwnProperty(key);
    }, this)
    .forEach(function (key) {
      if (this[key] instanceof Array) {
        rawObject[key] = this[key].slice();
      }
      else {
        rawObject[key] = this[key];
      }
    }, this);

    return rawObject;
  };
  FuryModel.prototype.$once = function(eventName, fn) {
    if (!this._eventQueue[eventName]) {
      throw new Error(eventName + ' is not a valid event');
    }

    this._eventQueue[eventName].push(fn);
  };

  function _callEventsOnce(eventQueue, eventName, param) {
    var queue = eventQueue[eventName];

    var result = when
    .sequence(queue, param)
    .then(function() {
      return when.resolve(param);
    });

    eventQueue[eventName] = [];

    return result;
  }

  function _setProperties(object, properties) {
    Object.keys(properties).forEach(function(prop) {
      object[prop] = properties[prop];
    });
  }

  FuryModel.define = function(opts) {
    var definableProperties = [
      '_constructor',
      '_init',
      '_load',
      '_create',
      '_update',
      '_delete',
      '_process',
      '_unprocess'
    ];

    var FuryModelExtended;

    if (typeof opts._constructor !== 'undefined') {
      FuryModelExtended = opts._constructor;
    }
    else {
      FuryModelExtended = function(pk) {
        FuryModel.call(this, pk);
      };
    }

    FuryModelExtended.prototype = Object.create(FuryModel.prototype);
    FuryModelExtended.prototype.constructor = FuryModelExtended;

    Object
    .keys(opts)
    .filter(function(prop) {
      if (definableProperties.indexOf(prop) === -1) {
        throw new Error('property ' + prop + ' is not definable');
      }
      if (typeof opts[prop] !== 'function') {
        throw new Error('property ' + prop + ' should be a function');
      }

      return prop !== 'constructor';
    })
    .forEach(function(prop) {
      FuryModelExtended.prototype[prop] = opts[prop];
    });

    return FuryModelExtended;
  };

  if (typeof exports !== 'undefined') {
    exports = FuryModel;
  }
  else {
    window.FuryModel = FuryModel;
  }

})();
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
//# sourceMappingURL=FuryModel.js.map