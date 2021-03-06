'use strict';

describe("resource", function() {
  var $resource, CreditCard, callback, $httpBackend;

  beforeEach(module('ngResource'));
  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $resource = $injector.get('$resource');
    CreditCard = $resource('/CreditCard/:id:verb', {id:'@id.key'}, {
      charge:{
        method:'post',
        params:{verb:'!charge'}
      },
      patch: {
        method: 'PATCH'
      },
      conditionalPut: {
        method: 'PUT',
        headers: {
          'If-None-Match': '*'
        }
      }

    });
    callback = jasmine.createSpy();
  }));


  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
  });


  it("should build resource", function() {
    expect(typeof CreditCard).toBe('function');
    expect(typeof CreditCard.get).toBe('function');
    expect(typeof CreditCard.save).toBe('function');
    expect(typeof CreditCard.remove).toBe('function');
    expect(typeof CreditCard['delete']).toBe('function');
    expect(typeof CreditCard.query).toBe('function');
  });


  it('should default to empty parameters', function() {
    $httpBackend.expect('GET', 'URL').respond({});
    $resource('URL').query();
  });


  it('should ignore slashes of undefinend parameters', function() {
    var R = $resource('/Path/:a/:b/:c');

    $httpBackend.when('GET', '/Path').respond('{}');
    $httpBackend.when('GET', '/Path/0').respond('{}');
    $httpBackend.when('GET', '/Path/false').respond('{}');
    $httpBackend.when('GET', '/Path').respond('{}');
    $httpBackend.when('GET', '/Path/').respond('{}');
    $httpBackend.when('GET', '/Path/1').respond('{}');
    $httpBackend.when('GET', '/Path/2/3').respond('{}');
    $httpBackend.when('GET', '/Path/4/5').respond('{}');
    $httpBackend.when('GET', '/Path/6/7/8').respond('{}');

    R.get({});
    R.get({a:0});
    R.get({a:false});
    R.get({a:null});
    R.get({a:undefined});
    R.get({a:''});
    R.get({a:1});
    R.get({a:2, b:3});
    R.get({a:4, c:5});
    R.get({a:6, b:7, c:8});
  });

  it('should not ignore leading slashes of undefinend parameters that have non-slash trailing sequence', function() {
    var R = $resource('/Path/:a.foo/:b.bar/:c.baz');

    $httpBackend.when('GET', '/Path/.foo/.bar/.baz').respond('{}');
    $httpBackend.when('GET', '/Path/0.foo/.bar/.baz').respond('{}');
    $httpBackend.when('GET', '/Path/false.foo/.bar/.baz').respond('{}');
    $httpBackend.when('GET', '/Path/.foo/.bar/.baz').respond('{}');
    $httpBackend.when('GET', '/Path/.foo/.bar/.baz').respond('{}');
    $httpBackend.when('GET', '/Path/1.foo/.bar/.baz').respond('{}');
    $httpBackend.when('GET', '/Path/2.foo/3.bar/.baz').respond('{}');
    $httpBackend.when('GET', '/Path/4.foo/.bar/5.baz').respond('{}');
    $httpBackend.when('GET', '/Path/6.foo/7.bar/8.baz').respond('{}');

    R.get({});
    R.get({a:0});
    R.get({a:false});
    R.get({a:null});
    R.get({a:undefined});
    R.get({a:''});
    R.get({a:1});
    R.get({a:2, b:3});
    R.get({a:4, c:5});
    R.get({a:6, b:7, c:8});
  });


  it('should support escaping colons in url template', function() {
    var R = $resource('http://localhost\\:8080/Path/:a/\\:stillPath/:b');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo/:stillPath/bar').respond();
    R.get({a: 'foo', b: 'bar'});
  });


  it('should correctly encode url params', function() {
    var R = $resource('/Path/:a');

    $httpBackend.expect('GET', '/Path/foo%231').respond('{}');
    $httpBackend.expect('GET', '/Path/doh!@foo?bar=baz%231').respond('{}');

    R.get({a: 'foo#1'});
    R.get({a: 'doh!@foo', bar: 'baz#1'});
  });


  it('should not encode @ in url params', function() {
   //encodeURIComponent is too agressive and doesn't follow http://www.ietf.org/rfc/rfc3986.txt
   //with regards to the character set (pchar) allowed in path segments
   //so we need this test to make sure that we don't over-encode the params and break stuff like
   //buzz api which uses @self

   var R = $resource('/Path/:a');
   $httpBackend.expect('GET', '/Path/doh@fo%20o?!do%26h=g%3Da+h&:bar=$baz@1').respond('{}');
   R.get({a: 'doh@fo o', ':bar': '$baz@1', '!do&h': 'g=a h'});
  });


  it('should encode array params', function() {
    var R = $resource('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh&foo?bar=baz1&bar=baz2').respond('{}');
    R.get({a: 'doh&foo', bar: ['baz1', 'baz2']});
  });

  it('should allow relative paths in resource url', function () {
    var R = $resource(':relativePath');
    $httpBackend.expect('GET', 'data.json').respond('{}');
    R.get({ relativePath: 'data.json' });
  });

  it('should handle + in url params', function () {
    var R = $resource('/api/myapp/:myresource?from=:from&to=:to&histlen=:histlen');
    $httpBackend.expect('GET', '/api/myapp/pear+apple?from=2012-04-01&to=2012-04-29&histlen=3').respond('{}');
    R.get({ myresource: 'pear+apple', from : '2012-04-01', to : '2012-04-29', histlen : 3  });
  });


  it('should encode & in url params', function() {
    var R = $resource('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh&foo?bar=baz%261').respond('{}');
    R.get({a: 'doh&foo', bar: 'baz&1'});
  });


  it('should build resource with default param', function() {
    $httpBackend.expect('GET', '/Order/123/Line/456.visa?minimum=0.05').respond({id: 'abc'});
    var LineItem = $resource('/Order/:orderId/Line/:id:verb',
                                  {orderId: '123', id: '@id.key', verb:'.visa', minimum: 0.05});
    var item = LineItem.get({id: 456});
    $httpBackend.flush();
    expect(item).toEqualData({id:'abc'});
  });


  it('should not pass default params between actions', function() {
    var R = $resource('/Path', {}, {get: {method: 'GET', params: {objId: '1'}}, perform: {method: 'GET'}});

    $httpBackend.expect('GET', '/Path?objId=1').respond('{}');
    $httpBackend.expect('GET', '/Path').respond('{}');

    R.get({});
    R.perform({});
  });


  it("should build resource with action default param overriding default param", function() {
    $httpBackend.expect('GET', '/Customer/123').respond({id: 'abc'});
    var TypeItem = $resource('/:type/:typeId', {type: 'Order'},
                                  {get: {method: 'GET', params: {type: 'Customer'}}});
    var item = TypeItem.get({typeId: 123});

    $httpBackend.flush();
    expect(item).toEqualData({id: 'abc'});
  });


  it('should build resource with action default param reading the value from instance', function() {
    $httpBackend.expect('POST', '/Customer/123').respond();
    var R = $resource('/Customer/:id', {}, {post: {method: 'POST', params: {id: '@id'}}});

    var inst = new R({id:123});
    expect(inst.id).toBe(123);

    inst.$post();
  });


  it('should handle multiple params with same name', function() {
    var R = $resource('/:id/:id');

    $httpBackend.when('GET').respond('{}');
    $httpBackend.expect('GET', '/1/1');

    R.get({id:1});
  });


  it("should create resource", function() {
    $httpBackend.expect('POST', '/CreditCard', '{"name":"misko"}').respond({id: 123, name: 'misko'});

    var cc = CreditCard.save({name: 'misko'}, callback);
    expect(cc).toEqualData({name: 'misko'});
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(cc).toEqualData({id: 123, name: 'misko'});
    expect(callback).toHaveBeenCalledOnce();
    expect(callback.mostRecentCall.args[0]).toEqual(cc);
    expect(callback.mostRecentCall.args[1]()).toEqual({});
  });


  it("should read resource", function() {
    $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
    var cc = CreditCard.get({id: 123}, callback);

    expect(cc instanceof CreditCard).toBeTruthy();
    expect(cc).toEqualData({});
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(cc).toEqualData({id: 123, number: '9876'});
    expect(callback.mostRecentCall.args[0]).toEqual(cc);
    expect(callback.mostRecentCall.args[1]()).toEqual({});
  });


  it('should send correct headers', function() {
    $httpBackend.expectPUT('/CreditCard/123', undefined, function(headers) {
       return headers['If-None-Match'] == "*";
    }).respond({id:123});

    CreditCard.conditionalPut({id: {key:123}});
  });


  it("should read partial resource", function() {
    $httpBackend.expect('GET', '/CreditCard').respond([{id:{key:123}}]);
    var ccs = CreditCard.query();

    $httpBackend.flush();
    expect(ccs.length).toEqual(1);

    var cc = ccs[0];
    expect(cc instanceof CreditCard).toBe(true);
    expect(cc.number).toBeUndefined();

    $httpBackend.expect('GET', '/CreditCard/123').respond({id: {key: 123}, number: '9876'});
    cc.$get(callback);
    $httpBackend.flush();
    expect(callback.mostRecentCall.args[0]).toEqual(cc);
    expect(callback.mostRecentCall.args[1]()).toEqual({});
    expect(cc.number).toEqual('9876');
  });


  it("should update resource", function() {
    $httpBackend.expect('POST', '/CreditCard/123', '{"id":{"key":123},"name":"misko"}').
                 respond({id: {key: 123}, name: 'rama'});

    var cc = CreditCard.save({id: {key: 123}, name: 'misko'}, callback);
    expect(cc).toEqualData({id:{key:123}, name:'misko'});
    expect(callback).not.toHaveBeenCalled();
    $httpBackend.flush();
  });


  it("should query resource", function() {
    $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);

    var ccs = CreditCard.query({key: 'value'}, callback);
    expect(ccs).toEqualData([]);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(ccs).toEqualData([{id:1}, {id:2}]);
    expect(callback.mostRecentCall.args[0]).toEqual(ccs);
    expect(callback.mostRecentCall.args[1]()).toEqual({});
  });


  it("should have all arguments optional", function() {
    $httpBackend.expect('GET', '/CreditCard').respond([{id:1}]);

    var log = '';
    var ccs = CreditCard.query(function() { log += 'cb;'; });

    $httpBackend.flush();
    expect(ccs).toEqualData([{id:1}]);
    expect(log).toEqual('cb;');
  });


  it('should delete resource and call callback', function() {
    $httpBackend.expect('DELETE', '/CreditCard/123').respond({});
    CreditCard.remove({id:123}, callback);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(callback.mostRecentCall.args[0]).toEqualData({});
    expect(callback.mostRecentCall.args[1]()).toEqual({});

    callback.reset();
    $httpBackend.expect('DELETE', '/CreditCard/333').respond(204, null);
    CreditCard.remove({id:333}, callback);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(callback.mostRecentCall.args[0]).toEqualData({});
    expect(callback.mostRecentCall.args[1]()).toEqual({});
  });


  it('should post charge verb', function() {
    $httpBackend.expect('POST', '/CreditCard/123!charge?amount=10', '{"auth":"abc"}').respond({success: 'ok'});
    CreditCard.charge({id:123, amount:10}, {auth:'abc'}, callback);
  });


  it('should post charge verb on instance', function() {
    $httpBackend.expect('POST', '/CreditCard/123!charge?amount=10',
        '{"id":{"key":123},"name":"misko"}').respond({success: 'ok'});

    var card = new CreditCard({id:{key:123}, name:'misko'});
    card.$charge({amount:10}, callback);
  });


  it("should patch a resource", function() {
    $httpBackend.expectPATCH('/CreditCard/123', '{"name":"igor"}').
                     respond({id: 123, name: 'rama'});

    var card = CreditCard.patch({id: 123}, {name: 'igor'}, callback);

    expect(card).toEqualData({name: 'igor'});
    expect(callback).not.toHaveBeenCalled();
    $httpBackend.flush();
    expect(callback).toHaveBeenCalled();
    expect(card).toEqualData({id: 123, name: 'rama'});
  });


  it('should create on save', function() {
    $httpBackend.expect('POST', '/CreditCard', '{"name":"misko"}').respond({id: 123}, {header1: 'a'});

    var cc = new CreditCard();
    expect(cc.$get).toBeDefined();
    expect(cc.$query).toBeDefined();
    expect(cc.$remove).toBeDefined();
    expect(cc.$save).toBeDefined();

    cc.name = 'misko';
    cc.$save(callback);
    expect(cc).toEqualData({name:'misko'});

    $httpBackend.flush();
    expect(cc).toEqualData({id:123});
    expect(callback.mostRecentCall.args[0]).toEqual(cc);
    expect(callback.mostRecentCall.args[1]()).toEqual({header1: 'a'});
  });


  it('should not mutate the resource object if response contains no body', function() {
    var data = {id:{key:123}, number:'9876'};
    $httpBackend.expect('GET', '/CreditCard/123').respond(data);

    var cc = CreditCard.get({id:123});
    $httpBackend.flush();
    expect(cc instanceof CreditCard).toBe(true);

    $httpBackend.expect('POST', '/CreditCard/123', angular.toJson(data)).respond('');
    var idBefore = cc.id;

    cc.$save();
    $httpBackend.flush();
    expect(idBefore).toEqual(cc.id);
  });


  it('should bind default parameters', function() {
    $httpBackend.expect('GET', '/CreditCard/123.visa?minimum=0.05').respond({id: 123});
    var Visa = CreditCard.bind({verb:'.visa', minimum:0.05});
    var visa = Visa.get({id:123});
    $httpBackend.flush();
    expect(visa).toEqualData({id:123});
  });


  it('should support dynamic default parameters (global)', function() {
    var currentGroup = 'students',
        Person = $resource('/Person/:group/:id', { group: function() { return currentGroup; }});


    $httpBackend.expect('GET', '/Person/students/fedor').respond({id: 'fedor', email: 'f@f.com'});

    var fedor = Person.get({id: 'fedor'});
    $httpBackend.flush();

    expect(fedor).toEqualData({id: 'fedor', email: 'f@f.com'});
  });


  it('should support dynamic default parameters (action specific)', function() {
    var currentGroup = 'students',
        Person = $resource('/Person/:group/:id', {}, {
          fetch: {method: 'GET', params: {group: function() { return currentGroup; }}}
        });

    $httpBackend.expect('GET', '/Person/students/fedor').respond({id: 'fedor', email: 'f@f.com'});

    var fedor = Person.fetch({id: 'fedor'});
    $httpBackend.flush();

    expect(fedor).toEqualData({id: 'fedor', email: 'f@f.com'});
  });


  it('should exercise full stack', function() {
    var Person = $resource('/Person/:id');

    $httpBackend.expect('GET', '/Person/123').respond('\n{\n"name":\n"misko"\n}\n');
    var person = Person.get({id:123});
    $httpBackend.flush();
    expect(person.name).toEqual('misko');
  });


  describe('promise api', function() {

    var $rootScope;


    beforeEach(inject(function(_$rootScope_) {
      $rootScope = _$rootScope_;
    }));


    describe('single resource', function() {

      it('should add promise $then method to the result object', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        cc.$then(callback);
        expect(callback).not.toHaveBeenCalled();

        $httpBackend.flush();

        var response = callback.mostRecentCall.args[0];

        expect(response).toEqualData({
          data: {id: 123, number: '9876'},
          status: 200,
          config: {method: 'GET', data: undefined, url: '/CreditCard/123'},
          resource: {id: 123, number: '9876', $resolved: true}
        });
        expect(typeof response.resource.$save).toBe('function');
      });


      it('should keep $then around after promise resolution', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        cc.$then(callback);
        $httpBackend.flush();

        var response = callback.mostRecentCall.args[0];

        callback.reset();

        cc.$then(callback);
        $rootScope.$apply(); //flush async queue

        expect(callback).toHaveBeenCalledOnceWith(response);
      });


      it('should allow promise chaining via $then method', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        cc.$then(function(response) { return 'new value'; }).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledOnceWith('new value');
      });


      it('should allow error callback registration via $then method', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond(404, 'resource not found');
        var cc = CreditCard.get({id: 123});

        cc.$then(null, callback);
        $httpBackend.flush();

        var response = callback.mostRecentCall.args[0];

        expect(response).toEqualData({
          data : 'resource not found',
          status : 404,
          config : { method : 'GET', data : undefined, url : '/CreditCard/123' }
        });
      });


      it('should add $resolved boolean field to the result object', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
        var cc = CreditCard.get({id: 123});

        expect(cc.$resolved).toBe(false);

        cc.$then(callback);
        expect(cc.$resolved).toBe(false);

        $httpBackend.flush();

        expect(cc.$resolved).toBe(true);
      });


      it('should set $resolved field to true when an error occurs', function() {
        $httpBackend.expect('GET', '/CreditCard/123').respond(404, 'resource not found');
        var cc = CreditCard.get({id: 123});

        cc.$then(null, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnce();
        expect(cc.$resolved).toBe(true);
      });
    });


    describe('resource collection', function() {

      it('should add promise $then method to the result object', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'});

        ccs.$then(callback);
        expect(callback).not.toHaveBeenCalled();

        $httpBackend.flush();

        var response = callback.mostRecentCall.args[0];

        expect(response).toEqualData({
          data: [{id: 1}, {id :2}],
          status: 200,
          config: {method: 'GET', data: undefined, url: '/CreditCard', params: {key: 'value'}},
          resource: [ { id : 1 }, { id : 2 } ]
        });
        expect(typeof response.resource[0].$save).toBe('function');
        expect(typeof response.resource[1].$save).toBe('function');
      });


      it('should keep $then around after promise resolution', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'});

        ccs.$then(callback);
        $httpBackend.flush();

        var response = callback.mostRecentCall.args[0];

        callback.reset();

        ccs.$then(callback);
        $rootScope.$apply(); //flush async queue

        expect(callback).toHaveBeenCalledOnceWith(response);
      });


      it('should allow promise chaining via $then method', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'});

        ccs.$then(function(response) { return 'new value'; }).then(callback);
        $httpBackend.flush();

        expect(callback).toHaveBeenCalledOnceWith('new value');
      });


      it('should allow error callback registration via $then method', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond(404, 'resource not found');
        var ccs = CreditCard.query({key: 'value'});

        ccs.$then(null, callback);
        $httpBackend.flush();

        var response = callback.mostRecentCall.args[0];

        expect(response).toEqualData({
          data : 'resource not found',
          status : 404,
          config : { method : 'GET', data : undefined, url : '/CreditCard', params: {key: 'value'}}
        });
      });


      it('should add $resolved boolean field to the result object', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);
        var ccs = CreditCard.query({key: 'value'}, callback);

        expect(ccs.$resolved).toBe(false);

        ccs.$then(callback);
        expect(ccs.$resolved).toBe(false);

        $httpBackend.flush();

        expect(ccs.$resolved).toBe(true);
      });


      it('should set $resolved field to true when an error occurs', function() {
        $httpBackend.expect('GET', '/CreditCard?key=value').respond(404, 'resource not found');
        var ccs = CreditCard.query({key: 'value'});

        ccs.$then(null, callback);
        $httpBackend.flush();
        expect(callback).toHaveBeenCalledOnce();
        expect(ccs.$resolved).toBe(true);
      });
    });
  });


  describe('failure mode', function() {
    var ERROR_CODE = 500,
        ERROR_RESPONSE = 'Server Error',
        errorCB;

    beforeEach(function() {
      errorCB = jasmine.createSpy('error').andCallFake(function(response) {
        expect(response.data).toBe(ERROR_RESPONSE);
        expect(response.status).toBe(ERROR_CODE);
      });
    });


    it('should call the error callback if provided on non 2xx response', function() {
      $httpBackend.expect('GET', '/CreditCard/123').respond(ERROR_CODE, ERROR_RESPONSE);

      CreditCard.get({id:123}, callback, errorCB);
      $httpBackend.flush();
      expect(errorCB).toHaveBeenCalledOnce();
      expect(callback).not.toHaveBeenCalled();
    });


    it('should call the error callback if provided on non 2xx response', function() {
      $httpBackend.expect('GET', '/CreditCard').respond(ERROR_CODE, ERROR_RESPONSE);

      CreditCard.get(callback, errorCB);
      $httpBackend.flush();
      expect(errorCB).toHaveBeenCalledOnce();
      expect(callback).not.toHaveBeenCalled();
    });
  });


  it('should transform request/response', function() {
    var Person = $resource('/Person/:id', {}, {
      save: {
          method: 'POST',
          params: {id: '@id'},
          transformRequest: function(data) {
            return angular.toJson({ __id: data.id });
          },
          transformResponse: function(data) {
            return { id: data.__id };
          }
      }
    });

    $httpBackend.expect('POST', '/Person/123', { __id: 123 }).respond({ __id: 456 });
    var person = new Person({id:123});
    person.$save();
    $httpBackend.flush();
    expect(person.id).toEqual(456);
  });
});
