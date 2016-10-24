var { Readable } = require('stream');

var PROCESSOR_BUFFER_LENGTH = 16384; // 4096;
var PROCESSOR_CHANNEL_COUNT = 1; // 1;

module.exports = class MediaStreamAudioReadable extends Readable {
  constructor(audiocontext, audioStream, procesor_buffer_length, processor_channel_count){
    super({ objectMode : true });
    this.ctx = audiocontext;

    procesor_buffer_length = procesor_buffer_length || PROCESSOR_BUFFER_LENGTH;
    processor_channel_count = processor_channel_count || PROCESSOR_CHANNEL_COUNT;

    var inputSource = audiocontext.createMediaStreamSource(audioStream);
    var processDestination = audiocontext.createScriptProcessor(
      procesor_buffer_length,
      processor_channel_count,
      1
    );

    processDestination.addEventListener('audioprocess', (audioProcessingEvent)=>{
      var metaBuffer = audioProcessingEvent.inputBuffer.getChannelData(0);

      var channelLength = metaBuffer.byteLength;
      var lengthBuffer = new Float32Array();
      lengthBuffer[0] = 4 + channelLength * PROCESSOR_CHANNEL_COUNT; //
      var channelLengthBuffer = new Float32Array();
      channelLengthBuffer[0] = channelLength;
      this.push(
        new Buffer(lengthBuffer.buffer),
        new Buffer(channelLengthBuffer.buffer)
      );

      for(var i = 0; i < PROCESSOR_CHANNEL_COUNT; i++){
        var buffer = audioProcessingEvent.inputBuffer.getChannelData(0);
        this.push(new Buffer(buffer.slice().buffer));
      }
    });

    inputSource.connect(processDestination);
    processDestination.connect(this.ctx.destination);
    audioStream.addEventListener('ended', ()=>{
      inputSource.disconnect(processDestination)
      processDestination.disconnect(this.ctx.destination);
      this.push(null);
    });
  }
  _read(){
    return false;
  }
}
