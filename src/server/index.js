require('./polyfill');

var http = require('http');
var path = require('path');
var Router = require('router');

var router = new Router();
var server = http.Server();

server.on('request', function(req, res){
  router.handle(req, res, function(err){
    console.error('request error', req.url, err);
    res.end();
  });
}).on('upgrade', function(req, socket){
  req.method = 'upgrade';
  router.handle(req, socket, function(err){
    console.error('upgrade error', req.url, err);
    socket.end();
  });
});

setImmediate(function(){
  server.listen(8080);
  console.log('http://localhost:8080');
})

var fs = require('fs');
var browserify = require('browserify');

router.get('/broadcaster', function(req, res){
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  fs.createReadStream(
    path.join(__dirname, '../broadcaster/index.html')
  ).pipe(res);
});

router.get('/broadcaster.js', function(req, res){
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript');
  var b = browserify();
  b.add(path.join(__dirname, '../broadcaster/index.js'))
  b.transform(require('brfs'), {});
  b.bundle().pipe(res);
});


router.get('/reciever', function(req, res){
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  fs.createReadStream(
    path.join(__dirname, '../reciever/index.html')
  ).pipe(res);
});

router.get('/reciever.js', function(req, res){
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript');
  var b = browserify();
  b.add(path.join(__dirname, '../reciever/index.js'))
  b.transform(require('brfs'), {});
  b.bundle().pipe(res);
});



var currentWriter = void 0;
var recievers = new Set();

var SocketReadable = require('./SocketReadable');
var SocketWritable = require('./SocketWritable');

router.upgrade('/broadcaster', function(req, socket){
  if(currentWriter) return socket.destroy();
  currentWriter = new SocketReadable(req, socket);
  currentWriter.on('data', function(data){
    Array.from(recievers.values()).forEach(function(reciever){
      reciever.write(data);
    });
  });
  currentWriter.on('end', function(){
    currentWriter = void 0;
  })
});

router.upgrade('/reciever', function(req, socket){
  var writable = new SocketWritable(req, socket);
  recievers.add(writable);
  writable.on('destroy', function(){
    recievers.delete(writable);
  });
});
