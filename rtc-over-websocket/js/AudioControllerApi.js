//    AudioControllerApi

(function (global) {
  var defaultConfig = {
    codec: {
      sampleRate: 24000,
      channels: 1,
      app: 2048,
      frameDuration: 20,
      bufferSize: 4096
    },
  };

  var audioContext = new (window.AudioContext || window.webkitAudioContext)();

  //必须要有这句，避免出现The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
  document.querySelector('button').addEventListener('click', function () {
    audioContext.resume().then(() => {
      console.log('Playback resumed successfully');
    });
  });

  var AudioControllerApi = global.AudioControllerApi = {
    Player: function (config, socket) {
      this.config = config || {};
      this.config.codec = this.config.codec || defaultConfig.codec;
      this.config.server = this.config.server || defaultConfig.server;
      console.log("player samplerate:"+audioContext.sampleRate);
      this.sampler = new Resampler(this.config.codec.sampleRate, audioContext.sampleRate, 1, this.config.codec.bufferSize);
      this.parentSocket = socket;

      this.decoder = new OpusDecoder(this.config.codec.sampleRate, this.config.codec.channels);
      this.silence = new Float32Array(this.config.codec.bufferSize);
    },
    Streamer: function (config, socket) {
      navigator.getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);

      this.config = config || {};
      this.config.codec = this.config.codec || defaultConfig.codec;
      this.sampler = new Resampler(audioContext.sampleRate, this.config.codec.sampleRate, 1, this.config.codec.bufferSize);
      this.parentSocket = socket;
      this.encoder = new OpusEncoder(this.config.codec.sampleRate, this.config.codec.channels, this.config.codec.app, this.config.codec.frameDuration);
      var _this = this;

      this._makeStream = function (onError) {
        navigator.getUserMedia({
          audio: true
        }, function (stream) {
          // console.log('kkkkk')
          _this.stream = stream;
          _this.audioInput = audioContext.createMediaStreamSource(stream);
          _this.gainNode = audioContext.createGain();
          _this.recorder = audioContext.createScriptProcessor(_this.config.codec.bufferSize, 1, 1);

          //编码
          _this.recorder.onaudioprocess = function (e) {
            //console.log('onaudioprocess')
            var resampled = _this.sampler.resampler(e.inputBuffer.getChannelData(0));
            //console.log('resampled', resampled)
            var packets = _this.encoder.encode_float(resampled);
            //console.log(packets); 
            for (var i = 0; i < packets.length; i++) {
              let audioMsg = { timestamp: audioContext.currentTime, sn: snCount, data: packets[i] }
              snCount++;
              socket.emit('audio', audioMsg);
              //audioContext.currentTime
            }
          };

          _this.audioInput.connect(_this.gainNode);
          _this.gainNode.connect(_this.recorder);
          _this.recorder.connect(audioContext.destination);
        }, onError || _this.onError);
      }
    }
  };

  AudioControllerApi.Streamer.prototype.start = function (onError) {
    var _this = this;
    this._makeStream(onError);

 
    // this.socket.onclose = function (event) {
    //   if (_onclose) {
    //     _onclose(event);
    //   }
    //   if (_this.audioInput) {
    //     _this.audioInput.disconnect();
    //     _this.audioInput = null;
    //   }
    //   if (_this.gainNode) {
    //     _this.gainNode.disconnect();
    //     _this.gainNode = null;
    //   }
    //   if (_this.recorder) {
    //     _this.recorder.disconnect();
    //     _this.recorder = null;
    //   }
    //   _this.stream.getTracks()[0].stop();
    //   console.log('Disconnected from server', event.reason);
    // };
  };

  AudioControllerApi.Streamer.prototype.mute = function () {
    this.gainNode.gain.value = 0;
    console.log('Mic muted');
  };

  AudioControllerApi.Streamer.prototype.unMute = function () {
    this.gainNode.gain.value = 1;
    console.log('Mic unmuted');
  };

  AudioControllerApi.Streamer.prototype.onError = function (e) {
    var error = new Error(e.name);
    error.name = 'NavigatorUserMediaError';
    throw error;
  };

  AudioControllerApi.Streamer.prototype.stop = function () {
    if (this.audioInput) {
      this.audioInput.disconnect();
      this.audioInput = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.recorder) {
      this.recorder.disconnect();
      this.recorder = null;
    }
    this.stream.getTracks()[0].stop()

    if (!this.parentSocket) {
      this.socket.close();
    }
  };

  AudioControllerApi.Player.prototype.start = function () {
    var _this = this;

    this.audioQueue = {
      buffer: new Float32Array(0),

      write: function (newAudio) {
        var currentQLength = this.buffer.length;
        newAudio = _this.sampler.resampler(newAudio);
        var newBuffer = new Float32Array(currentQLength + newAudio.length);
        newBuffer.set(this.buffer, 0);
        newBuffer.set(newAudio, currentQLength);
        this.buffer = newBuffer;
      },

      read: function (nSamples) {
        var samplesToPlay = this.buffer.subarray(0, nSamples);
        this.buffer = this.buffer.subarray(nSamples, this.buffer.length);
        return samplesToPlay;
      },

      length: function () {
        return this.buffer.length;
      }
    };

    this.scriptNode = audioContext.createScriptProcessor(this.config.codec.bufferSize, 1, 1);
    this.scriptNode.onaudioprocess = function (e) {
      if (_this.audioQueue.length()) {
        e.outputBuffer.getChannelData(0).set(_this.audioQueue.read(_this.config.codec.bufferSize));
      } else {
        e.outputBuffer.getChannelData(0).set(_this.silence);
      }
    };
    this.gainNode = audioContext.createGain();
    this.scriptNode.connect(this.gainNode);
    this.gainNode.connect(audioContext.destination);

    // if (!this.parentSocket) {
    //   this.socket = new WebSocket(this.config.server);
    // } else {
    //   this.socket = this.parentSocket;
    // }
    //this.socket.onopen = function () {
    //    console.log('Connected to server ' + _this.config.server.host + ' as listener');
    //};

    this.parentSocket.on('audio', function (msg) {
      var b = msg;
      console.log(msg);

      //play and analysis
      _this.audioQueue.write(_this.decoder.decode_float(msg.data));

    });

    // var _onmessage = this.parentOnmessage = this.socket.onmessage;
    // this.socket.onmessage = function (message) {
    //   if (_onmessage) {
    //     _onmessage(message);
    //   }
    //   if (message.data instanceof Blob) {
    //     var reader = new FileReader();
    //     //解码
    //     reader.onload = function () {
    //       _this.audioQueue.write(_this.decoder.decode_float(reader.result));
    //     };
    //     reader.readAsArrayBuffer(message.data);
    //   }
    // };
    //this.socket.onclose = function () {
    //    console.log('Connection to server closed');
    //};
    //this.socket.onerror = function (err) {
    //    console.log('Getting audio data error:', err);
    //};
  };

  AudioControllerApi.Player.prototype.getVolume = function () {
    return this.gainNode ? this.gainNode.gain.value : 'Stream not started yet';
  };

  AudioControllerApi.Player.prototype.setVolume = function (value) {
    if (this.gainNode) this.gainNode.gain.value = value;
  };

  AudioControllerApi.Player.prototype.stop = function () {
    this.audioQueue = null;
    this.scriptNode.disconnect();
    this.scriptNode = null;
    this.gainNode.disconnect();
    this.gainNode = null;

    if (!this.parentSocket) {
      this.socket.close();
    } else {
      this.socket.onmessage = this.parentOnmessage;
    }

  };
})(window);