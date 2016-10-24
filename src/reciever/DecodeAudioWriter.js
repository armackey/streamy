var { Writable } = require('stream');

module.exports = class DecodeAudioWriter extends Writable {
  constructor(ctx){
    super({ objectMode : true });
    this.queue = false;
    this.outputNode = ctx.createGain();
  }
  _write(chunk, encoding, callback){
    ctx.decodeAudioData(chunk, (buffer)=>{
      var channels = this.channels;
      if(this.queue){
        return this.queue.push(buffer);
      }

      this.queue = [];
      this.playBufferSource(buffer);
    });
    callback();
  }
  _flush(callback){
    if(this.queue === false) return callback();
    this.waitingEnd = callback;
  }
  nextSample(){
    if(this.queue.length === 0){
      this.queue = false;
      if(this.waitingEnd){
        this.waitingEnd();
        this.waitingEnd = false;
      }
      return;
    }
    var source = queue.shift();

    this.playBufferSource(id, source);
  }
  playBufferSource(buffer){
    var source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.onended = this.nextSample.bind(this);
    source.connect(this.outputNode);
    source.start();
  }
  getAudioNode(){
    return this.gain;
  }
}
