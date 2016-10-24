var { Transform } = require('stream');
var ChunkDecode = require('../shared/ChunkDecode');
var ChunkEncode = require('../shared/ChunkEncode');
var ChannelSplitter = require('./ChannelSplitter');
var WavEncoder = require('./WavEncoder');

module.exports = function(self){
  var selfReadStream = new Readable({
    read : function(){
      return false
    }
  });

  self.addEventListener('message', function(e){
    if(e.data === 'end'){
      selfReadStream.push(null);
    }
    selfReadStream.push(e.data);
  });

  var selfWriteStream = new Writable({
    write : function(chunk, encoding, callback){
      self.postMessage(chunk);
      callback();
    },
    flush : function(){
      self.close();
    }
  });

  var chunker = new Chunker();
  var channelSplitter = new ChannelSplitter();
  var wavEncoder = new WavEncoder();

  selfReadStream
    .pipe(new ChunkDecode())
    .pipe(channelSplitter)
    .pipe(wavEncoder)
    .pipe(new ChunkEncode())
    .pipe(selfWriteStream);
}
