libaes.onload = function(){
    console.log("libaes.onload");
    var handle = createAecInstance();
    console.log("handle="+handle);
    var ret1 = initializeAecInstance(handle,16000);
    console.log(ret1);
    var ret2 = setConfig(handle,4,1);
    console.log(ret2);


    var samples = new Int16Array(160);
    for(var k = 0; k < 160; k++)
      samples[k] = Math.random()*30000;


      var ret3 = bufferFarend(handle,samples,160);
      console.log(ret3);
    //aecmProcess(handle);


}