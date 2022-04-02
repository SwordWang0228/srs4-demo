//AudioControllerApi

(function (global) {
  var defaultConfig = {
    codec: {
      sampleRate: 24000,
      channels: 1,
      app: 2048,
      frameDuration: 20,
      bufferSize: 4096,
    },
  };

  var audioContext = new (window.AudioContext || window.webkitAudioContext)();

  //必须要有这句，避免出现The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
  document.querySelector("button").addEventListener("click", function () {
    audioContext.resume().then(() => {
      console.log("Playback resumed successfully");
    });
  });

  var AudioControllerApi = (global.AudioControllerApi = {
    Player: function (config, socket, delayDet) {
      this.config = config || {};
      this.config.codec = this.config.codec || defaultConfig.codec;
      this.config.server = this.config.server || defaultConfig.server;
      console.log("player samplerate:" + audioContext.sampleRate);
      this.sampler = new Resampler(
        this.config.codec.sampleRate,
        audioContext.sampleRate,
        1,
        this.config.codec.bufferSize
      );
      this.samplerFast = new Resampler(
        this.config.codec.sampleRate,
        Math.floor(audioContext.sampleRate * 0.8),
        1,
        this.config.codec.bufferSize
      );
      this.samplerSlow = new Resampler(
        this.config.codec.sampleRate,
        Math.floor(audioContext.sampleRate * 1.2),
        1,
        this.config.codec.bufferSize
      );
      this.parentSocket = socket;
      this.decoder = new OpusDecoder(
        this.config.codec.sampleRate,
        this.config.codec.channels
      );
      this.silence = new Float32Array(this.config.codec.bufferSize);
      this.delayDet = delayDet;

      this.jitterBuffer = new JitterBuffer(2,48000,48000,1024,null);
    },
    Streamer: function (config, socket, delayDet) {
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      let supported = navigator.mediaDevices.getSupportedConstraints();
      console.log(supported);

      this.config = config || {};
      this.config.codec = this.config.codec || defaultConfig.codec;
      this.sampler = new Resampler(
        audioContext.sampleRate,
        this.config.codec.sampleRate,
        1,
        this.config.codec.bufferSize
      );
      this.parentSocket = socket;
      this.encoder = new OpusEncoder(
        this.config.codec.sampleRate,
        this.config.codec.channels,
        this.config.codec.app,
        this.config.codec.frameDuration
      );
      var _this = this;
      this.delayDet = delayDet;

      this._makeStream = function (onError) {
        navigator.getUserMedia(
          {
            audio: {
              latency: true,
              noiseSuppression: true,
              autoGainControl: true,
              echoCancellation: true,
            },
            video: false,
          },
          function (stream) {
            _this.stream = stream;
            _this.audioInput = audioContext.createMediaStreamSource(stream);
            // ganiNode https://developer.mozilla.org/en-US/docs/Web/API/GainNode
            _this.gainNode = audioContext.createGain();
            // 滤波器
            _this.biquadFilter = audioContext.createBiquadFilter();
            _this.gainNode = audioContext.createGain();
            // 可以用AudioWorkletProcessor代替，https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode
            _this.recorder = audioContext.createScriptProcessor(
              _this.config.codec.bufferSize,
              1,
              1
            );

            //encode
            _this.recorder.onaudioprocess = function (e) {
              var resampled = _this.sampler.resampler(
                e.inputBuffer.getChannelData(0)
              );
              // 32 位转 16 位
              // -1~1 f32
              // const size = resampled.length;
              // const resampled16 = new Int16Array(size);
              // for (let j = 0; j < size; j++) {
              //   let s = Math.max(-1, Math.min(1, resampled[j]));
              //   if (s < 0) {
              //     s = s * 0x8000;
              //   } else {
              //     s = s * 0x7fff;
              //   }
              //   resampled16[j] = s;
              // }
              // var packets = _this.encoder.encode(resampled16);
              // var size = resampled.length;

              // var pcm = new Int16Array(size);
              // var sum = 0;
              // for (var j = 0; j < size; j++) {
              //   //floatTo16BitPCM
              //   var s = Math.max(-1, Math.min(1, resampled[j]));
              //   s = s < 0 ? s * 0x8000 : s * 0x7fff;
              //   pcm[j] = s;
              // }

              var packets = _this.encoder.encode_float(resampled);
              for (var i = 0; i < packets.length; i++) {
                let audioMsg = {
                  sts:getTimestamp(),
                  dts: delayDet.getRemoteTime(getTimestamp()),
                  sn: snCount,
                  data: packets[i],
                };
                snCount++;
                //console.log(audioMsg);
                socket.emit("audio", audioMsg);
              }
            };

            _this.audioInput.connect(_this.gainNode);
            _this.gainNode.connect(_this.recorder);
            _this.recorder.connect(_this.biquadFilter);
            _this.biquadFilter.connect(audioContext.destination);

            _this.biquadFilter.type = "lowpass";
            _this.biquadFilter.frequency.setValueAtTime(
              4000,
              audioContext.currentTime
            );
          },
          onError || _this.onError
        );
      };
    },
  });

  AudioControllerApi.Streamer.prototype.start = function (onError) {
    var _this = this;
    this._makeStream(onError);
  };

  AudioControllerApi.Streamer.prototype.mute = function () {
    this.gainNode.gain.value = 0;
    console.log("Mic muted");
  };

  AudioControllerApi.Streamer.prototype.unMute = function () {
    this.gainNode.gain.value = 1;
    console.log("Mic unmuted");
  };

  AudioControllerApi.Streamer.prototype.onError = function (e) {
    var error = new Error(e.name);
    error.name = "NavigatorUserMediaError";
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
    if (this.biquadFilter) {
      this.biquadFilter.disconnect();
      this.biquadFilter = null;
    }
    if (this.recorder) {
      this.recorder.disconnect();
      this.recorder = null;
    }
    this.stream.getTracks()[0].stop();

    if (!this.parentSocket) {
      this.socket.close();
    }
  };

  AudioControllerApi.Player.prototype.getStashBufLen = function () {
    return this.jitterBuffer;
  }

  AudioControllerApi.Player.prototype.start = function () {
    var _this = this;
    
    this.scriptNode = audioContext.createScriptProcessor(
      this.config.codec.bufferSize,
      1,
      1
    );
    this.scriptNode.onaudioprocess = function (e) {

      let buf =  _this.jitterBuffer.pop();
      if(buf != null) {
        e.outputBuffer.getChannelData(0).set(buf);
      } else {
        e.outputBuffer.getChannelData(0).set(_this.silence);
      }
    };
    this.gainNode = audioContext.createGain();
    this.scriptNode.connect(this.gainNode);
    this.gainNode.connect(audioContext.destination);

    this.parentSocket.on("audio", function (msg) {
      delayDet.updateTimestamp(msg.sts,msg.dts, getTimestamp());
      _this.jitterBuffer.push(_this.sampler.resampler(_this.decoder.decode_float(msg.data)));
    
    });
  };

  AudioControllerApi.Player.prototype.getVolume = function () {
    return this.gainNode ? this.gainNode.gain.value : "Stream not started yet";
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
