// Delay Detection
class DelayDetection {
  List<int> delayArray = [];
  List diffArray = [];
  int? minDiff;

  static final DelayDetection _ins = DelayDetection();

  factory DelayDetection.ins() => _ins;

  DelayDetection();

  //dts:destination timestamp
  updateTimestamp(sts, dts, localTimeStamp) {
    int diff = sts - localTimeStamp;
    diffArray.add(diff);
    minDiff ??= diff;
    if (diffArray.length > 10) {
      diffArray.removeAt(0);
    }

    // if (Math.abs(this.minDiff) > Math.abs(diff)) {
    //   this.minDiff = diff;
    // }

    for (var i = 0; i < diffArray.length; i++) {
      if ((minDiff??0).abs() > diffArray[i].abs()) {
        minDiff = diffArray[i];
      }
    }

    if (dts != null) {

      int delay = localTimeStamp - dts;

      // console.log("sts:" + sts +",dts:" +dts +",localTimeStamp:" +localTimeStamp +",minDiff:" +
      //                                                 this.minDiff +",delay:" +delay);

      if (delayArray.length >= 100) {
        delayArray.remove(0);
        delayArray.add(delay);
      } else {
        delayArray.add(delay);
      }
    }
  }

  getRemoteTime(localTimestamp) {
    if(minDiff == null){
    }
    return localTimestamp + (minDiff ?? 0);
  }

  getDelay() {
    int sum = 0;
    for (var i = 0; i < delayArray.length; i++) {
      sum = (sum + delayArray[i]);
    }
    var avgDelay = 0;
    if (delayArray.isNotEmpty) {
      var avgDelay = (sum / delayArray.length).floor();
    }

    return avgDelay/2;
  }
}
