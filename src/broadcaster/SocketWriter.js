var { Writable } = require('stream');

module.exports = class socketWriter extends Writable {
  constructor(uri){
    this.socket = new Websocket(uri);
    var socket = this.socket;
    this.on('destroy', ()=>{
      this.socket && this.socket.close();
    })
    var el, rl;
    this.socket.addEventListener('open', rl = ()=>{
      socket.removeEventListener('open', rl);
      socket.removeEventListener('error', el);
      this._ready = true;
      this.emit('ready');
    });
    this.socket.addEventListener('error', el = (e)=>{
      socket.removeEventListener('open', rl);
      socket.removeEventListener('error', el);
      this._error = e;
      this.emit('error', e);
      this.destroy();
    });
  }
  _flush(cb) {

  }
  _write(chunk, encoding, callback){
    this.socket.send(chunk);
    callback();
  }
  promiseReady(){
    return new Promise((res, rej)=>{
      if(this._ready) return res(this);
      if(this._error) return rej(this._error);
      var el, rl;
      this.once('ready', rl = ()=>{
        this.removeListener('error', el);
        res(this);
      });
      this.once('error', el = (error)=>{
        this.removeListener('ready', rl);
        res(error);
      });
    });
  }
}
