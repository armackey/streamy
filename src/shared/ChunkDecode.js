var { Transform } = require('stream');

module.exports = class ChunkDecoder extends Transform {
  constructor(){
    super({
      writableObjectMode : true
    });

    this.chunkBuffer = new Uint8Array(0);
  }
  _transform(chunk, encoding, callback){
    var runChunker = (activeBuffer)=>{
      if(activeBuffer.byteLength < 4){
        this.chunkBuffer = activeBuffer;
        return;
      }
      var length = new DataView(activeBuffer.buffer).readFloat32(0);
      if(activeBuffer.byteLength - 4 < length){
        this.chunkBuffer = activeBuffer;
        return
      }
      this.push(new Buffer(activeBuffer.slice(4, length).buffer));
      runChunker(activeBuffer.slice(4 + length));
    };
    var lastBuffer = this.chunkBuffer;
    var concatBuffer = new Uint8Array(lastBuffer.byteLength + chunk.byteLength);
    concatBuffer.set(0, lastBuffer);
    concatBuffer.set(lastBuffer.byteLength, chunk);
    runChunker(concatBuffer);
    callback()
  }
};
