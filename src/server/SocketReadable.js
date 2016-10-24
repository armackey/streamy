var { Readable } = require('stream');
var Websocket = require('websocket-driver');

module.exports = class SocketReadable extends Readable {
  constructor(req, socket){
    super();
    req.method = 'GET';

    if (!Websocket.isWebSocket(req)){
      throw new Error('This is not a websocket');
    }

    var driver = Websocket.http(req);
    driver.io.write(req.body);
    socket.pipe(driver.io).pipe(socket);
    driver.messages.on('data', (message)=>{
      this.push(message);
    });
    driver.start();

    socket.on('close', ()=>{
      this.push(null)
    });
  }
  _read(){ return false; }
}
