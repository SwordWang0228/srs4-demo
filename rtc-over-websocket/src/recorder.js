class Recorder {
  // 配置
  config = {};

  constructor(
    config,
    source,
    resampler,
    compressor,
    lowPassFilter,
    transfer,
    hook
  ) {}

  // 源 Source

  // 采样器 Resampler

  // 加解码器 Compressor

  // 滤波器 LowPassFilter

  // 数据传输接口 Transfer

  // Hook
}

class Source {
  // 数据源输入，由 recorder 注入
  inputCallback = () => {};
  // 数据源输出，由 player 注入
  outputCallback = () => {};
  // 由子类实现
  start() {}
  // 由子类实现
  stop() {}
}

/**
 * web 浏览器
 */
class BrowserSource {
  // 数据源输入，由 recorder 注入
  inputCallback = () => {};
  // 数据源输出，由 player 注入
  outputCallback = () => {};

  stream = null;
  audioContext = null;

  prepare() {
    if (!navigator.getUserMedia) {
      navigator.getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    }
    if (!navigator.getUserMedia) {
      return alert("Error: getUserMedia not supported!");
    }
    // 音频 contex
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
  }

  // 由子类实现
  start() {
    this.prepare();

    const _this = this;
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
        const audioInput = audioContext.createMediaStreamSource(stream);
        // ganiNode https://developer.mozilla.org/en-US/docs/Web/API/GainNode
        const gainNode = audioContext.createGain();
        // 滤波器
        const biquadFilter = audioContext.createBiquadFilter();
        biquadFilter.type = "lowpass";
        biquadFilter.frequency.setValueAtTime(4000, audioContext.currentTime);
        // 可以用AudioWorkletProcessor代替，https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode
        const recorder = audioContext.createScriptProcessor(
          _this.config.codec.bufferSize,
          1,
          1
        );

        // 增加自带编解码 compressor
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
        compressor.knee.setValueAtTime(40, audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, audioContext.currentTime);
        compressor.attack.setValueAtTime(0, audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, audioContext.currentTime);

        // 收到音频数据
        recorder.onaudioprocess = function (e) {
          var resampled = sampler.resampler(e.inputBuffer.getChannelData(0));
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
          // var packets = encoder.encode(resampled16);
          var size = resampled.length;

          var pcm = new Int16Array(size);
          var sum = 0;
          for (var j = 0; j < size; j++) {
            //floatTo16BitPCM
            var s = Math.max(-1, Math.min(1, resampled[j]));
            s = s < 0 ? s * 0x8000 : s * 0x7fff;
            pcm[j] = s;
          }

          // var packets2 = encoder.encode(pcm);
          _this.encoderWasm.input(pcm);
          var output = _this.encoderWasm.output();
          while (output) {
            let audioMsg = {
              sts: getTimestamp(),
              dts: delayDet.getRemoteTime(getTimestamp()),
              sn: snCount,
              data: output,
            };
            snCount++;
            // console.log(audioMsg);
            socket.emit("audio", audioMsg);
            output = _this.encoderWasm.output();
          }
          // for (var i = 0; i < packets.length; i++) {
          //   let audioMsg = {
          //     sts:getTimestamp(),
          //     dts: delayDet.getRemoteTime(getTimestamp()),
          //     sn: snCount,
          //     data: packets[i],
          //   };
          //   snCount++;
          //   console.log(audioMsg);
          //   socket.emit("audio", audioMsg);
          // }
        };

        audioInput.connect(gainNode);
        gainNode.connect(recorder);
        recorder.connect(compressor);
        compressor.connect(biquadFilter);
        biquadFilter.connect(audioContext.destination);
      },
      onError || _this.onError
    );
  }
  // 由子类实现
  stop() {}
}
