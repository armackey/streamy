var { Transform } = require('stream');

module.exports = class Chunker extends Transform {
  constructor(numChannels){
    this.numChannels = numChannels;
    super({
      readableObjectMode : true,
      writableObjectMode : true
    });

    this.chunkBuffer = new Uint8Array(0);
  }
  _transform(chunk, encoding, callback){
    var numChannels = this.numChannels;
    var runChunker = (activeBuffer)=>{
      if(activeBuffer.byteLength < 4){
        this.chunkBuffer = activeBuffer;
        return;
      }
      var channelLength = new DataView(activeBuffer.buffer).readFloat32(0);
      if((activeBuffer.byteLength - 4)/channelLength < numChannels){
        this.chunkBuffer = activeBuffer;
        return
      }
      var toPush = [];
      for(var i = 0; i < numChannels; i++){
        toPush.push(activeBuffer.slice(4 + i * channelLength, channelLength));
      }
      this.push(toPush);
    };
      runChunker(activeBuffer.slice(4 + channelLength + numChannels));
    var concatBuffer = new Uint8Array(lastBuffer.byteLength + chunk.byteLength);
    concatBuffer.set(0, lastBuffer);
    concatBuffer.set(lastBuffer.byteLength, chunk);
    runChunker(concatBuffer);
    callback()
  }
};
