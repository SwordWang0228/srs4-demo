emcc api.c -Ilib -Llib -laec --pre-js preapi.js \
  --post-js api.js -s EXPORTED_FUNCTIONS='["_free"]' $@ -o libaec.js