#include <emscripten.h>
#include <stdlib.h>
#include "lib/echo_control_mobile.h"
#include "lib/echo_control_mobile.h"

EMSCRIPTEN_KEEPALIVE long createAecInstance()
{
    void *aecmInstHandler = NULL;
	if (WebRtcAecm_Create(&aecmInstHandler) == -1)
		return -1;
	else
		return ((long) aecmInstHandler);
}

EMSCRIPTEN_KEEPALIVE int freeAecInstance(long aecmHandler){
    void *aecmInst = (void *) aecmHandler;
	if (aecmInst == NULL)
		return -1;
	int ret = WebRtcAecm_Free(aecmInst);
	aecmInst = NULL;
	return ret;
}

EMSCRIPTEN_KEEPALIVE int initializeAecInstance(long aecmHandler, int sampFreq){
    void *aecmInst = (void *) aecmHandler;
	if (aecmInst == NULL)
		return -1;
	return WebRtcAecm_Init(aecmInst, sampFreq);
}


EMSCRIPTEN_KEEPALIVE int bufferFarend(long aecmHandler, short* farend, int nrOfSamples) {

    void *aecmInst = (void *) aecmHandler;
	if (aecmInst == NULL) {
        return -1;
    }

	int ret = -1;
	if (farend != NULL) {
		ret = WebRtcAecm_BufferFarend(aecmInst, farend, nrOfSamples);
	}
	return ret;
}


EMSCRIPTEN_KEEPALIVE short* aecmProcess(long aecmHandler, short* nearendNoisy, int nearenNoisyLen , short* nearendClean, short* nrOfSamples, short* msInSndCardBuf) {

	int16_t *arrNearendNoisy = nearendNoisy;
	int16_t *arrNearendClean = nearendClean;
	int16_t *arrOut = NULL;

	void *aecmInst = (void *) aecmHandler;
	if (aecmInst == NULL)
		return NULL;

	int ret = -1;

	//nearendNoisy and out must not be NULL, otherwise process can not be run, return -1 for error.
	if (nearendNoisy == NULL)
		return NULL;

	//create out array

	arrOut = malloc(nearenNoisyLen*sizeof(short));

	ret = WebRtcAecm_Process(aecmInst, arrNearendNoisy, arrNearendClean, arrOut,
			nrOfSamples, msInSndCardBuf);

	if (ret != 0) {
        return NULL;
	}
	return arrOut;
}


EMSCRIPTEN_KEEPALIVE int setConfig(long aecmHandler, short echoMode, short cngMode) {

	void * aecmInst = (void *) aecmHandler;
	if (aecmInst == NULL)
		return -1;

	//set new configuration to AECM instance.
	AecmConfig config;
	config.echoMode = echoMode;
	config.cngMode = cngMode;

	return WebRtcAecm_set_config(aecmInst, config);
}
