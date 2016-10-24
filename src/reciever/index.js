var url = require('url');
var SocketReader = require('./SocketReadable');
var DecodeAudioWriter = require('./DecodeAudioWriter');
var ChunkDecode = require('../shared/ChunkDecode');

var AUDIO_CONTEXT;

var application = {
  start : function(){
    if(!AUDIO_CONTEXT){
      AUDIO_CONTEXT = new AudioContext();
    }
    return Promise.all([
      (function(){
        var uri = url.parse(window.location.toString());
        uri.protocol = uri.protocol === 'https' ? 'wss' : 'ws';
        uri = url.format(uri);
        var socket = new SocketReader(uri);
        return socket.promiseReady();
      })(),
      function(){
        return new DecodeAudioWriter(AUDIO_CONTEXT);
      },
    ]).then(function(results){
      var [ socketReader, audioDecoder ] = results;
      socketReader.pipe(new ChunkDecode()).pipe(audioDecoder);
      audioDecoder.getAudioNode().connect(AUDIO_CONTEXT.destination);
      return results;
    });
  },
  stop : function(results){
    if(!results) return Promise.resolve();
    var [ socketReader, audioDecoder ] = results;
    return Promise.resolve().then(function(){
      socketReader.destroy();
      audioDecoder.getAudioNode().disconnect(AUDIO_CONTEXT.destination);
    });
  }
}
window.addEventListener('load', function(){
  var currentObjects;
  var isStarting = false;
  var status = document.querySelector('.status');
  status.innerHTML = 'Stopped';
  var start = document.querySelector('.start-stream');
  start.onclick = function(){
    if(isStarting) return;
    isStarting = true;
    status.innerHTML = 'StoppingOld';
    return application.stop(currentObjects).then(function(){
      status.innerHTML = 'StartingNew';
      return application.start();
    }).then(function(newObjects){
      currentObjects = newObjects;
      isStarting = false;
      status.innerHTML = 'Listening';
    });
  }
  var stop = document.querySelector('.stop-stream');
  stop.onclick = function(){
    status.innerHTML = 'Stopping';
    application.stop(currentObjects).then(function(){
      status.innerHTML = 'Stopped';
      currentObjects = false;
    });
  }
});
