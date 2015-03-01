describe("FuryModel", function() {

  function spyOnExist(object, fn) {
    if (typeof object[fn] === 'function') {
      return spyOn(object, fn).and.callThrough();
    }
    else {
      console.log('fn :(', fn);
      return null;
    }
  }

  function _error(err) {
    throw err;
  }

  function createFakeInstance() {
    var pk, // @optional first argument
        opts; // @optional last argument

    if (arguments[0] instanceof Object) {
      opts = arguments[0];
    }
    else {
      pk = arguments[0];
      opts = arguments[1];
    }

    var FakeModel = FuryModel.define(opts);

    spyOnExist(FakeModel.prototype, '_load');
    spyOnExist(FakeModel.prototype, '_init');
    spyOnExist(FakeModel.prototype, '_create');
    spyOnExist(FakeModel.prototype, '_update');
    spyOnExist(FakeModel.prototype, '_delete');
    spyOnExist(FakeModel.prototype, '_process');
    spyOnExist(FakeModel.prototype, '_unprocess');

    spyOnExist(FakeModel.prototype, '$load');
    spyOnExist(FakeModel.prototype, '$raw');

    return new FakeModel(pk);
  }

  describe("constructor", function() {
    it("should define the primarykey", function() {
      var instance1 = createFakeInstance(413, {
        _load: function() { return when.resolve({}); }
      });
      expect(instance1._pk).toBe(413);

      var instance2 = createFakeInstance();
      expect(instance2._pk).toBe(null);
    });
    it("should init the object only when it has no pk", function() {
      var instance1 = createFakeInstance();
      expect(instance1._init).toHaveBeenCalled();

      var instance2 = createFakeInstance(613, {
        _load: function() { return when.resolve({}); }
      });
      expect(instance2._init).not.toHaveBeenCalled();
    });
    it("should load the object when the pk is defined", function() {
      var instance = createFakeInstance(54215, {
        _load: function() { return when.resolve({}); }
      });

      // load is automaticaly called
      expect(instance.$load).toHaveBeenCalled();
      expect(instance._load).toHaveBeenCalled();
    });
  });

  describe("#$load", function() {
    it("should load the object remotely", function(done) {
      var sampleData = {
        prop1: 'hehe',
        prop2: 41
      };

      var instance = createFakeInstance(1361, {
        _load: function() {
          return when.promise(function(resolve, reject) {
            resolve(sampleData);
          });
        }
      });

      // we can use $load() to set a callback
      instance.$load().then(function() {
        expect(instance.$load.calls.count()).toBe(2);
        expect(instance._load.calls.count()).toBe(1); // the data are only loaded once indeed

        expect(instance._process).toHaveBeenCalledWith(sampleData);
        expect(instance._remoteData).toEqual(instance._process(sampleData));

        expect(instance.prop1).toEqual(sampleData.prop1);
        expect(instance.prop2).toEqual(sampleData.prop2);

        done();
      });
    });
    it("sould update $isLoaded and $isLoading", function(done) {
      var instance = createFakeInstance(1361, {
        _load: function() {
          return when.resolve({});
        }
      });

      // #$load is automaticaly called by constructor
      expect(instance.$isLoaded()).toBe(false);
      expect(instance.$isLoading()).toBe(true);

      // we can use #$load to set a callback
      instance.$load().then(function() {
        expect(instance.$isLoaded()).toBe(true);
        expect(instance.$isLoading()).toBe(false);
        done();
      });
    });
    it("should not reverse the user changes", function(done) {
      var sampleLoaded = {
        changed: 41
      };
      var sampleUpdated = {
        changed: 31
      };

      var instance = createFakeInstance(5315, {
        _load: function() {
          return when.promise(function(resolve, reject) {
            resolve(sampleLoaded);
          });
        }
      });

      instance.changed = sampleUpdated.changed;
      expect(instance.changed).toBe(sampleUpdated.changed);

      instance.$load().then(function() {
        // change are kept after loading
        expect(instance.changed).toBe(sampleUpdated.changed);
        expect(instance.changed).not.toBe(sampleLoaded.changed);
        done();
      });
    });
    xit("should #_process the loaded datas", function() {

    });
  });


  describe("#$raw", function() {
    it("should return a clean version of the instance", function() {
      var instance = createFakeInstance();
      expect(instance.$raw).not.toHaveBeenCalled();
      expect(instance._unprocess).not.toHaveBeenCalled();

      // Empty data

      var enableUnprocess = true,
          data0 = instance.$raw(enableUnprocess);

      expect(instance.$raw).toHaveBeenCalled();
      expect(instance._unprocess).toHaveBeenCalledWith({});

      // Modified data

      var data1sample = {
        prop1: 'hehe',
        prop2: 35
      };

      instance.prop1 = data1sample.prop1;
      instance.prop2 = data1sample.prop2;

      var data1 = instance.$raw();

      expect(instance.$raw.calls.count()).toBe(2);
      expect(instance._unprocess.calls.count()).toBe(2);
      expect(instance._unprocess.calls.mostRecent().object).toBe(instance);
      expect(instance._unprocess.calls.mostRecent().args).toEqual([data1sample]);
    });

    xit("should returns #_unprocess results", function() {

    });
  });

  describe("#$reset", function() {
    xit("should reverse the user defined values to the remote values", function() {

    });

    xit("should allow to define which field to reset", function() {

    });
  });

  describe("#$save", function() {
    it("should create an object remotely", function(done) {
      // $save creates the remote model when no id is defined
      var instance = createFakeInstance({
        _create: function(data) {
          return when.resolve([5315, data]);
        }
      });

      expect(instance._pk).toBe(null);
      expect(instance.$isLoaded()).toBe(true);
      expect(instance._init).toHaveBeenCalled();

      // we define some arguments
      var _dataExample = {
        prop1: 'hehe',
        prop2: 37
      };

      instance.prop1 = _dataExample.prop1;
      instance.prop2 = _dataExample.prop2;

      // we save the object remotely
      instance.$save().then(function() {
        expect(instance._pk).toBe(5315);

        expect(instance._remoteData).toEqual(_dataExample);

        expect(instance._create.calls.count()).toBe(1);
        expect(instance._create.calls.mostRecent().object).toBe(instance);
        expect(instance._create.calls.mostRecent().args).toEqual([_dataExample]);

        done();
      });
    });
    it("should update the instance remotely", function(done) {
      var sampleId = 'super id';
      var sampleLoaded = {
        unchanged: 'hehe',
        changed: 41
      };
      var sampleUpdated = {
        changed: 361316
      };

      // $save updates remote model when the id is defined
      var instance = createFakeInstance(sampleId, {
        _load: function() {
          return when.resolve(sampleLoaded);
        },
        _update: function(data) {
          return when.resolve(data);
        }
      });

      expect(instance.unchanged).toBe(undefined);
      expect(instance.changed).toBe(undefined);

      instance.changed = sampleUpdated.changed;

      instance.$save().then(function() {
        expect(instance._update).toHaveBeenCalledWith(sampleUpdated);

        expect(instance._remoteData.changed).toEqual(sampleUpdated.changed);
        expect(instance._remoteData.changed).not.toEqual(sampleLoaded.changed);
        done();
      });

    });

    xit("should #_unprocess the instance values", function() {

    });
  });

  describe("#$delete", function() {
    it("should delete the object remotely", function(done) {
      var instance = createFakeInstance(41, {
        _load: function() {
          return when.resolve({});
        }
      });

      var mock = sinon.mock(instance);

      expect(instance._pk).toBe(41);

      mock.expects('_delete')
      .returns(when.resolve())
      .once();

      var onDeleted = instance
      .$delete()
      .then(function() {
        expect(instance._remoteData).toBe(null);
        expect(instance._pk).toBe(null);
        mock.verify();
        done();
      });
    });
    xit("should stop the object's loading", function() {

    });
  });

  xdescribe("FuryModel.$pre:save", function() {

  });

  describe("#$pre:save", function() {
    var s;
    var psh1;
    var psh2;
    var instance;

    function createInstance(id) {
      // @note we copy each datas to allow us to tests the args, but it's not
      // required
      psh2 = sinon.spy(function f_psh2(data) {
        return when.resolve({
          hehe: data.hehe + ' :/'
        });
      });
      psh1 = sinon.spy(function f_psh1(data) {
        return when.promise(function(resolve, reject) {
          setTimeout(function() {
            data = {
              hehe: data.hehe,
              nice: 'nice'
            };
            resolve(data);
          }, 50);
        });
      });
      s = sinon.spy(function f_s(data) {
        if (this._pk === null) {
          return when.resolve(['random id', data]);
        }
        else {
          return when.resolve(data);
        }
      });

      instance = createFakeInstance(id, {
        _load: function() {
          return when.resolve({});
        },
        _update: s,
        _create: s
      });

      instance.hehe = 'hehehe !';
    }

    it("should execute hooks on update", function(done) {
      createInstance(143);

      instance.$pre('save', psh1);
      instance.$pre('save', psh2);

      instance
      .$save()
      .then(function() {
        expect(psh2.calledOnce).toBe(true);
        expect(psh1.calledOnce).toBe(true);
        expect(s.calledOnce).toBe(true);

        expect(psh2.calledBefore(psh1)).toBe(true);
        expect(psh1.calledBefore(s)).toBe(true);
      })
      .done(done, _error);
    });

    it("should execute hooks on create", function(done) {
      createInstance();

      instance.$pre('save', psh1);
      instance.$pre('save', psh2);

      instance
      .$save()
      .then(function() {
        expect(psh2.calledOnce).toBe(true);
        expect(psh1.calledOnce).toBe(true);
        expect(s.calledOnce).toBe(true);

        expect(psh2.calledBefore(psh1)).toBe(true);
        expect(psh1.calledBefore(s)).toBe(true);
      })
      .done(done, _error);
    });

    it("may change the data", function(done) {
      createInstance(143);

      instance.$pre('save', psh1);
      instance.$pre('save', psh2);

      instance
      .$save()
      .then(function() {
        expect(psh2.args[0]).toEqual([{
          hehe: 'hehehe !'
        }]);

        expect(psh1.args[0]).toEqual([{
          hehe: 'hehehe ! :/'
        }]);

        expect(s.args[0]).toEqual([{
          hehe: 'hehehe ! :/',
          nice: 'nice'
        }]);
      })
      .done(done, _error);
    });

    xit("should execute hooks before the FuryModel.$pre:save ones", function() {

    });
  });

});
