var Websocket = require('websocket-driver');

module.exports = function(req, socket){
  req.method = 'GET';

  if (!Websocket.isWebSocket(req)){
    throw new Error('This is not a websocket');
  }

  var driver = Websocket.http(req);
  driver.io.write(req.body);
  socket.pipe(driver.io).pipe(socket);
  driver.start();

  return driver;
};
