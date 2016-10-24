var { Readable } = require('stream');
var reqtodriver = require('./ReqtoDriver');

module.exports = class SocketReadable extends Readable {
  constructor(req, socket){
    super();

    this.driver = reqtodriver(req, socket);
  }
  _write(chunk, encoding, callback){
    driver.binary(chunk);
    callback();
  }
  _flush(){
    this.driver.close();
  }
}
