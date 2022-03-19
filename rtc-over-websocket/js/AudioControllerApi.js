//AudioControllerApi

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
    Player: function (config, socket, delayDet) {
      this.config = config || {};
      this.config.codec = this.config.codec || defaultConfig.codec;
      this.config.server = this.config.server || defaultConfig.server;
      console.log("player samplerate:" + audioContext.sampleRate);
      this.sampler = new Resampler(this.config.codec.sampleRate, audioContext.sampleRate, 1, this.config.codec.bufferSize);
      this.samplerFast = new Resampler(this.config.codec.sampleRate, Math.floor(audioContext.sampleRate * 0.8), 1, this.config.codec.bufferSize);
      this.samplerSlow = new Resampler(this.config.codec.sampleRate, Math.floor(audioContext.sampleRate * 1.2), 1, this.config.codec.bufferSize);
      this.parentSocket = socket;
      this.decoder = new OpusDecoder(this.config.codec.sampleRate, this.config.codec.channels);
      this.silence = new Float32Array(this.config.codec.bufferSize);
      this.delayDet = delayDet;
    },
    Streamer: function (config, socket, delayDet) {
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
      this.delayDet = delayDet;

      this._makeStream = function (onError) {
        navigator.getUserMedia({
          audio: true
        }, function (stream) {

          _this.stream = stream;
          _this.audioInput = audioContext.createMediaStreamSource(stream);
          // ganiNode https://developer.mozilla.org/en-US/docs/Web/API/GainNode
          _this.gainNode = audioContext.createGain();
          // 可以用AudioWorkletProcessor代替，https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode
          _this.recorder = audioContext.createScriptProcessor(_this.config.codec.bufferSize, 1, 1);

          //encode
          _this.recorder.onaudioprocess = function (e) {
            var resampled = _this.sampler.resampler(e.inputBuffer.getChannelData(0));
            var packets = _this.encoder.encode_float(resampled);
            for (var i = 0; i < packets.length; i++) {
              let audioMsg = { timestamp: delayDet.getRemoteTime(getTimestamp()), sn: snCount, data: packets[i] }
              snCount++;
              socket.emit('audio', audioMsg);
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
        //console.log("delay:" +avgDelay);
        var len;

        if (avgDelay < 15) {
          len = (audioContext.sampleRate / 20) * 3;
        } else if (avgDelay < 25) {
          len = (audioContext.sampleRate / 10) * 3;
        } else {
          len = (audioContext.sampleRate / 2);
        }
        //console.log("len:" + len);

        if (this.buffer.length >= Math.floor(len)) {
          newAudio = _this.samplerFast.resampler(newAudio);
        } else {
          newAudio = _this.sampler.resampler(newAudio);
        }
        //newAudio = _this.sampler.resampler(newAudio);
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
      if (_this.audioQueue.length() >= _this.config.codec.bufferSize) {
        e.outputBuffer.getChannelData(0).set(_this.audioQueue.read(_this.config.codec.bufferSize));
      } else {
        e.outputBuffer.getChannelData(0).set(_this.silence);
      }
    };
    this.gainNode = audioContext.createGain();
    this.scriptNode.connect(this.gainNode);
    this.gainNode.connect(audioContext.destination);

    this.parentSocket.on('audio', function (msg) {
      delayDet.updateTimestamp(msg.timestamp, getTimestamp());
      _this.audioQueue.write(_this.decoder.decode_float(msg.data));
    });

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

    //close socket ?

  };
})(window);