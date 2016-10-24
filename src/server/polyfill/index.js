var Router = require('router');
var Layer = require('router/lib/layer');

Router.prototype.upgrade = function(path){
  var route = this.route(path);
  route.upgrade.apply(route, Array.prototype.slice.call(arguments, 1));
  return this;
};

Router.Route.prototype.upgrade = function(){
  var callbacks = Array.prototype.slice.call(arguments, 0).reduce(function(all, item){
    return all.concat(Array.isArray(item) ? item : [ item ]);
  }, []);

  if(callbacks.length === 0){
    throw new TypeError('argument handler is required');
  }

  for(var i = 0; i < callbacks.length; i++){
    var fn = callbacks[ i ];

    if(typeof fn !== 'function'){
      throw new TypeError('argument handler must be a function');
    }

    var layer = Layer('/', {}, fn);
    layer.method = 'upgrade';

    this.methods.upgrade = true;
    this.stack.push(layer);
  }

  return this;
};
