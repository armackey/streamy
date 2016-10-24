var { Transform } = require('stream');

module.exports = class WavEncoder extends Transform {
  constructor(sampleRate, numChannels, maxSamples){
    super({
      readableObjectMode : true,
      writableObjectMode : true
    });

    this.sampleRate = sampleRate || 44100;
    this.numChannels = numChannels || 1;

  }
  _transform(buffers, encoder, callback){
    buffers = buffers.map(function(buffer){
      return new Float32Array(buffer.buffer);
    });

    var dataViews = [];

    var len = buffers[ 0 ].length,
        nCh = this.numChannels,
        view = new DataView(new ArrayBuffer(len * nCh * 2)),
        offset = 0;
    for(var i = 0; i < len; ++i){
      for(var ch = 0; ch < nCh; ++ch){
        var x = buffers[ ch ][ i ] * 0x7fff;
        view.setInt16(offset, x < 0 ? Math.max(x, -0x8000) : Math.min(x, 0x7fff), true);
        offset += 2;
      }
    }
    dataViews.push(view.buffer);

    var dataSize = this.numChannels * len * 2,
        view = new DataView(new ArrayBuffer(44));
    setString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    setString(view, 8, 'WAVE');
    setString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, this.numChannels, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * 4, true);
    view.setUint16(32, this.numChannels * 2, true);
    view.setUint16(34, 16, true);
    setString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    dataViews.unshift(view.buffer);
    this.push(dataViews);

    callback();
  }
}
