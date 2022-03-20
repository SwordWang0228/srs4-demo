// Delay Detection
class DelayDetection {
  constructor() {
    this.delayArray = new Array();
    this.minDiff = undefined;
  }

  //dts:destination timestamp
  updateTimestamp(dts, localTimeStamp) {
    let diff = dts - localTimeStamp;
    if (this.minDiff === undefined) {
      this.minDiff = diff;
    } else if (Math.abs(this.minDiff) > Math.abs(diff)) {
      this.minDiff = diff;
    }

    let delay = localTimeStamp - dts;

    console.log(
      "dts:" +
        dts +
        ",localTimeStamp:" +
        localTimeStamp +
        ",minDiff:" +
        this.minDiff +
        ",delay:" +
        delay
    );

    if (this.delayArray.length >= 100) {
      this.delayArray.shift();
      this.delayArray.push(delay);
    } else {
      this.delayArray.push(delay);
    }
  }

  getRemoteTime(localTimestamp) {
    return localTimestamp - this.minDiff;
  }

  getDelay() {
    var sum = 0;
    for (var i = 0; i < this.delayArray.length; i++) {
      sum = sum + this.delayArray[i];
    }
    var avgDelay = 0;
    if (this.delayArray.length > 0) {
      var avgDelay = Math.floor(sum / this.delayArray.length);
    }

    return avgDelay;
  }
}
