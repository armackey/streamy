var { Readable } = require('stream');

var PROCESSOR_BUFFER_LENGTH = 16384; // 4096;
var PROCESSOR_CHANNEL_COUNT = 1; // 4096;


var AUDIO_CONTEXT = new AudioContext();

module.exports = class MediaStreamAudioReadable extends Readable {
  constructor(audioStream, procesor_buffer_length, processor_channel_count){
    super({ objectMode : true });

    procesor_buffer_length = procesor_buffer_length || PROCESSOR_BUFFER_LENGTH;
    processor_channel_count = processor_channel_count || PROCESSOR_CHANNEL_COUNT;

    var inputSource = AUDIO_CONTEXT.createMediaStreamSource(audioStream);
    var processDestination = createScriptProcessor(
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
      this.push(lengthBuffer.buffer, channelLengthBuffer.buffer);

      for(var i = 0; i < PROCESSOR_CHANNEL_COUNT; i++){
        var buffer = audioProcessingEvent.inputBuffer.getChannelData(0);
        this.push(buffer.slice().buffer);
      }
    });

    inputSource.connect(processDestination);
    processDestination.connect(AUDIO_CONTEXT.destination);
    audioStream.addEventListener('ended', ()=>{
      inputSource.disconnect(processDestination)
      processDestination.disconnect(AUDIO_CONTEXT.destination);
      this.push(null);
    });
  }
  _read(){
    return false;
  }
}
