var { Readable } = require('stream');

module.exports = class SocketReadable extends Readable {
  constructor(uri){
    super();
    this.socket = new WebSocket(uri);
    var socket = this.socket;
    this.on('end', ()=>{
      this.socket && this.socket.close();
      this.socket = false;
    })
    var el, rl;
    this.socket.addEventListener('open', rl = ()=>{
      socket.removeEventListener('open', rl);
      socket.removeEventListener('error', el);
      this._ready = true;
      socket.on('message', (e) =>{
        this.push(e.data);
      });

      socket.addEventListener('close', ()=>{
        this.push(null)
      });
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
  _read(){ return false; }

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
