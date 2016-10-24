var Transform = require('stream');
var WebWorkify = require('webworkify');
var setImmediate = require('setimmediate');

module.exports = class WorkerTransform extends Transform {
  constructor(workerFunction){
    super();

    var handleError = (e)=>{
      this._error = e;
      this.emit('error', this._error);
      return this.destroy();
    }
    try{
      this.worker = WebWorkify(workerFunction);
    }catch(e){
      return setImmediate(()=>{
        handleError(e);
      });
    }
    var el, rl;
    var worker = this.worker;
    worker.addEventListener('message', rl = (e)=>{
      socket.removeEventListener('open', rl);
      socket.removeEventListener('error', el);
      if(e.data !== 'ready'){
        return handleError(new Error('improper start'));
      }
      this._ready = true;
      this.worker.addEventListener('terminate', ()=>{
        this.push(null);
      })
      this.emit('ready');
    });
    this.socket.addEventListener('error', el = (e)=>{
      socket.removeEventListener('open', rl);
      socket.removeEventListener('error', el);
      return handleError(e);
    })

    this.worker.addEventListener('message', (e)=>{
      this.push(e.data);
    });
  }

  _transform(chunk, encoding, callback){
    this.worker.send(chunk);
    callback();
  }

  _flush(){
    this.worker.postMessage('end');
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

};
