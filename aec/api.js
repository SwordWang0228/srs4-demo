function createAecInstance()
{
   return Module._createAecInstance();
}
function freeAecInstance(aecmHandler)
{
   return Module._freeAecInstance(aecmHandler);
}

function initializeAecInstance(aecmHandler,sampFreq){

   return Module._initializeAecInstance(aecmHandler,sampFreq);
}

function bufferFarend(aecmHandler, farend, nrOfSamples) {

   return Module._bufferFarend(aecmHandler, farend, nrOfSamples);
}


function aecmProcess(aecmHandler, nearendNoisy, nearenNoisyLen , nearendClean, nrOfSamples, msInSndCardBuf) {
   return Module._aecmProcess(aecmHandler, nearendNoisy, nearenNoisyLen , nearendClean, nrOfSamples, msInSndCardBuf);
}


function setConfig(aecmHandler, echoMode, cngMode) {
   return Module._setConfig(aecmHandler, echoMode, cngMode);
}

function malloc(size) {
   return Module._malloc(size);
}

libaes = Module;