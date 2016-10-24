var { Transform } = require('stream');

module.exports = class DeChunker extends Transform {
  constructor(){
    super({
      readableObjectMode : true
    });
  }
  _transform(chunk, encoding, callback){
    var lengthBuffer = new Float32Array();
    lengthBuffer[0] = chunk.byteLength;
    this.push(lengthBuffer.buffer, chunk);
    callback();
  }
}
