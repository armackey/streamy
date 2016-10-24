var { Transform } = require('stream');

module.exports = class ChunkEncoder extends Transform {
  constructor(){
    super({
      readableObjectMode : true
    });
  }
  _transform(chunk, encoding, callback){
    var lengthBuffer = new Float32Array(1);
    lengthBuffer[0] = chunk.byteLength;
    this.push(new Buffer(lengthBuffer.buffer), chunk);
    callback();
  }
}
