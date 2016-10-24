var getUserMedia = require('getusermedia');
var url = require('url');
var MediaStreamAudioReadable = require('./MediaStreamAudioReadable');
var WorkerTransform = require('./WorkerTransform');
var SocketWriter = require('./SocketWriter');
var ChunkEncode = require('../shared/ChunkEncode');

var AUDIO_CONTEXT;

var application = {
  start : function(){
    if(!AUDIO_CONTEXT){
      AUDIO_CONTEXT = new AudioContext();
    }
    return Promise.all([
      new Promise(function(res, rej){
        getUserMedia({ video : false, audio : true }, function(err, stream){
          if(err) return rej(err);
          res(stream);
        });
      }).then(function(stream){
        return new MediaStreamAudioReadable(AUDIO_CONTEXT, stream);
      }),
      (function(){
        var fn = require('../encoder');
        var worker = new WorkerTransform(fn);
        return worker.promiseReady();
      })(),
      (function(){
        var uri = url.parse(window.location.toString());
        uri.protocol = uri.protocol === 'https' ? 'wss' : 'ws';
        uri = url.format(uri);
        var socket = new SocketWriter(uri);
        return socket.promiseReady();
      })(),
    ]).then(function(results){
      // [ socket, audioStream ]
      var [ audioStreamReadable, workerTransform, socketWriter ] = results;

      audioStreamReadable.pipe(new ChunkEncode()).pipe(workerTransform).pipe(socketWriter);

      return results;
    });
  },

  stop : function(results){
    if(!results){
      return Promise.resolve();
    }
    var [ audioStreamReadable, workerTransform, socketWriter ] = results;
    audioStreamReadable.destroy();
    return Promise.resolve();
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
    application.stop(currentObjects).then(function(){
      status.innerHTML = 'StartingNew';
      return application.start();
    }).then(function(newObjects){
      currentObjects = newObjects;
      isStarting = false;
      status.innerHTML = 'Broadcasting';
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
