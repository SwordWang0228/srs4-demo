// Delay Detection
class DelayDetection {
  List<int> delayArray = []; // 近100条的延迟时间记录
  List diffArray = []; // 时间差容器 10条，超过就移出第一条
  int? minDiff; // 最小的时间差

  static final DelayDetection _ins = DelayDetection();

  factory DelayDetection.ins() => _ins;

  DelayDetection();

  //dts: 应该接受到包的时间
  //localTimeStamp：当前时间
  //sts：socket发起的时间
  updateTimestamp(sts, dts, localTimeStamp) {
    int diff = sts - localTimeStamp; // 对方发起socket和我收到socket的时间差
    diffArray.add(diff);
    minDiff ??= diff;
    // 10条，超过就移出第一条
    if (diffArray.length > 10) {
      diffArray.removeAt(0);
    }

    // if (Math.abs(this.minDiff) > Math.abs(diff)) {
    //   this.minDiff = diff;
    // }

    // 获取最小时间差
    for (var i = 0; i < diffArray.length; i++) {
      if ((minDiff??0).abs() > diffArray[i].abs()) {
        minDiff = diffArray[i];
      }
    }

    if (dts != null) {

      // 接收到的时间晚了多少ms
      int delay = localTimeStamp - dts;

      // console.log("sts:" + sts +",dts:" +dts +",localTimeStamp:" +localTimeStamp +",minDiff:" +
      //                                                 this.minDiff +",delay:" +delay);
      // 迟到时间记录
      if (delayArray.length >= 100) {
        delayArray.remove(0);
        delayArray.add(delay);
      } else {
        delayArray.add(delay);
      }
    }
  }
  // 估算对方的收到信息的延迟后时间
  // 计算对方应该收到的时间，当前时间+10个包的最小延迟
  getRemoteTime(localTimestamp) {
    return localTimestamp + (minDiff ?? 0);
  }

  // 获取平均100次延迟时间 / 2
  getDelay() {
    var avgDelay = delayArray.reduce((a, b) => a + b) / delayArray.length;
    return avgDelay/2;
  }
}
