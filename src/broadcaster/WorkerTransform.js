var { Transform } = require('stream');
var WebWorkify = require('webworkify');
var setImmediate = require('setimmediate');

module.exports = class WorkerTransform extends Transform {
  constructor(workerFunction){
    super();

    var handleError = (e)=>{
      this._error = e;
      this.emit('error', this._error);
      return this.push(null);
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
      worker.removeEventListener('open', rl);
      worker.removeEventListener('error', el);
      if(e.data !== 'ready'){
        return handleError(new Error('improper start'));
      }
      this._ready = true;
      this.emit('ready');
    });
    this.worker.addEventListener('error', el = (e)=>{
      worker.removeEventListener('open', rl);
      worker.removeEventListener('error', el);
      return handleError(e);
    });
    this.on('ready', ()=>{
      this.worker.addEventListener('message', (e)=>{
        this.push(new Buffer(e.data));
      });
      this.worker.addEventListener('terminate', ()=>{
        this.push(null);
      })
    })
  }

  _transform(chunk, encoding, callback){
    this.worker.postMessage(chunk.buffer);
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
