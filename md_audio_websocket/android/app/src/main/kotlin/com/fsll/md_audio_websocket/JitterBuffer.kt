package org.fsll.jianghu3

class JitterBuffer(private val inputSamplerate: Int, private val processBufSize: Int){
    private var playBuffer: ArrayList<ByteArray> = ArrayList<ByteArray>(0)
    private var stashBuffer: ByteArray? = null
    private val playBufLen: Int = 2
    private var stashLastFrame: ByteArray? = null
    private var isAccPlay: Boolean = false

    private fun appendBuffer(fromBuffer: ByteArray) {
        var newBuffer: ByteArray?
        if (this.stashBuffer == null) this.stashBuffer = ByteArray(0)
        newBuffer = ByteArray(0)
        newBuffer = newBuffer.plus(this.stashBuffer!!)
        newBuffer = newBuffer.plus(fromBuffer)
        this.stashBuffer = newBuffer
    }

    private fun extractBuffer(nSamples: Int): ByteArray? {
        var buf: ByteArray? = null
        if (this.stashBuffer != null && this.stashBuffer!!.size >= nSamples) {
            buf = this.stashBuffer!!.copyOfRange(0, nSamples)
            this.stashBuffer = this.stashBuffer!!.copyOfRange(nSamples, this.stashBuffer!!.size)
        }
        return buf
    }

    private fun appendToPlayBuffer() {

        if (this.getLength() > (this.inputSamplerate * 3 / 10) && !this.isAccPlay) {
            this.isAccPlay = true
        }

        if (this.getLength() < (this.inputSamplerate / 10) && this.isAccPlay) {
            this.isAccPlay = false
        }

        while (this.playBuffer.size < this.playBufLen) {
            val blockBuffer = this.extractBuffer(this.processBufSize);
            if (blockBuffer != null) {
                this.playBuffer = this.playBuffer.plus(blockBuffer) as ArrayList<ByteArray>
            } else {
                break;
            }
        }

    }

    private fun getLength(): Int {
        return if (this.stashBuffer == null) 0 else this.stashBuffer!!.size
    }

    fun push(buf: ByteArray) {

        // console.log("push len:"+buf.length);
        this.appendBuffer(buf);
        this.appendToPlayBuffer();
        // console.log("this.stashBuffer:"+this.stashBuffer.length);


    }

    fun pop(): ByteArray? {
        var buf: ByteArray? = null
        if (this.playBuffer.isNotEmpty()) {
            buf = this.playBuffer[0]
            this.playBuffer.removeAt(0)
            this.stashLastFrame = buf
        } else {
            this.appendToPlayBuffer()
            if (this.playBuffer.size > 0) {
                buf = this.playBuffer[0]
                this.playBuffer.removeAt(0)
                this.stashLastFrame = buf
            }
        }
        this.appendToPlayBuffer();


        if (this.isAccPlay) {
            this.extractBuffer(this.processBufSize);
            if (this.getLength() < (this.inputSamplerate / 10)) {
                this.isAccPlay = false
            }
        }

        if (buf == null && this.stashLastFrame != null) {
            return null
        }
        return buf

    }

    fun clear() {
        playBuffer.clear()
        stashBuffer = null
        stashLastFrame = null
    }

}