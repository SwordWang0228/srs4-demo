class Player {
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

  start() {}

  stop() {}
}

class BrowserSource {
  // 数据源输入，由 recorder 注入
  inputCallback = () => {};
  // 数据源输出，由 player 注入
  outputCallback = () => {};

  start() {}

  stop() {}
}
