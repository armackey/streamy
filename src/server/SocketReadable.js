var { Readable } = require('stream');
var reqtodriver = require('./ReqtoDriver');

module.exports = class SocketReadable extends Readable {
  constructor(req, socket){
    super();

    var driver = reqtodriver(req, socket);

    driver.messages.on('data', (message)=>{
      this.push(message);
    });
    socket.on('close', ()=>{
      this.push(null);
    });
  }
  _read(){ return false; }
}
