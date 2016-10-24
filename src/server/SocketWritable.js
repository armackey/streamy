var { Readable } = require('stream');
var Websocket = require('websocket-driver');

module.exports = class SocketReadable extends Readable {
  constructor(req, socket){

    if (!Websocket.isWebSocket(req)){
      throw new Error('This is not a websocket');
    }

    var driver = Websocket.http(req);
    driver.io.write(body);
    socket.pipe(driver.io).pipe(socket);
    driver.start();
    this.driver = driver;
  }
  _write(chunk, encoding, callback){
    driver.binary(chunk)
    callback();
  }
  _flush(){
    this.driver.close();
  }
}
