Module["onRuntimeInitialized"] = function(){
  if(Module.onload)
    Module.onload();
  Module.loaded = true;
}

Module["locateFile"] = function(url){
  if(url == "libaec.wasm" && typeof LIBAEC_WASM_URL != "undefined")
    return LIBAEC_WASM_URL;
  else
    return url;
}
