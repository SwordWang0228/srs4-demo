// Delay Detection---server
class DelayDetection {
  constructor() {
    this.delayArray = new Array();
    this.diffArray = new Array();
    this.minDiff = undefined;
  }

  //dts:destination timestamp
  updateTimestamp(sts, dts, localTimeStamp) {
    let diff = sts - localTimeStamp;
    
    if (this.diffArray.length > 1000) {
      this.diffArray.shift();
      this.diffArray.push(diff);
    }
    if (this.minDiff === undefined) {
      this.minDiff = diff;
    }


    // if (Math.abs(this.minDiff) > Math.abs(diff)) {
    //   this.minDiff = diff;
    // }

    for (var i = 0; i < this.diffArray.length; i++) {
      if (Math.abs(this.minDiff) > Math.abs(this.diffArray[i])) {
        this.minDiff = this.diffArray[i];
      }
    }

    if (dts != undefined) {


      let delay = localTimeStamp - dts;

      //console.log("即时延迟 =" +delay);

      // console.log("sts:" + sts +",dts:" +dts +",localTimeStamp:" +localTimeStamp +",minDiff:" + 
      //                                                 this.minDiff +",delay:" +delay);

      if (this.delayArray.length >= 100) {
        this.delayArray.shift();
        this.delayArray.push(delay);
      } else {
        this.delayArray.push(delay);
      }

    }
  }

  getRemoteTime(localTimestamp) {
    if(this.minDiff === undefined){
      //console.log("need sync first!");
    }
    return localTimestamp + this.minDiff;
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

    return avgDelay/2;
  }
}
module.exports = DelayDetection;
