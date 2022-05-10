package com.fsll.md_audio_websocket

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.media.*
import android.media.AudioRecord.OnRecordPositionUpdateListener
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.AutomaticGainControl
import android.media.audiofx.NoiseSuppressor
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.annotation.NonNull
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.theeasiestway.opus.Constants
import com.theeasiestway.opus.Opus
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result
import io.flutter.plugin.common.PluginRegistry
import io.flutter.plugin.common.PluginRegistry.Registrar
import org.fsll.jianghu3.JitterBuffer
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.ShortBuffer
import java.util.*


const val methodChannelName = "com.fsll.md_audio_websocket.sound_stream:methods"

enum class SoundStreamErrors {
    FailedToRecord,
    FailedToPlay,
    FailedToStop,
    FailedToWriteBuffer,
    Unknown,
}

enum class SoundStreamStatus {
    Unset,
    Initialized,
    Playing,
    Stopped,
}

/** SoundStreamPlugin */
public class SoundStreamPlugin : FlutterPlugin,
    MethodCallHandler,
    PluginRegistry.RequestPermissionsResultListener,
    ActivityAware {
    private val logTag = "SoundStreamPlugin"
    private val audioRecordPermissionCode = 14887

    private lateinit var methodChannel: MethodChannel
    private var currentActivity: Activity? = null
    private var pluginContext: Context? = null
    private var permissionToRecordAudio: Boolean = false
    private var activeResult: Result? = null
    private var debugLogging: Boolean = false

    //========= Recorder's vars
    private val mRecordFormat = AudioFormat.ENCODING_PCM_16BIT
    private var mRecordSampleRate = 48000 // 16Khz
    private var mRecorderBufferSize = 4096
    private var minBufferSize = 1024
    private var prevTimestamp = Date().time
    private var mOutChannels: Int = AudioFormat.CHANNEL_OUT_MONO
    private var mInChannels: Int = AudioFormat.CHANNEL_IN_DEFAULT
    private var audioDataQueue: ShortArray? = null
    private var mRecorder: AudioRecord? = null
    private var mListener: OnRecordPositionUpdateListener? = null
    private val codec = Opus()
    private var noiseSuppressor: NoiseSuppressor? = null
    private var automaticGainControl: AutomaticGainControl? = null
    private var acousticEchoCanceler: AcousticEchoCanceler? = null
    lateinit var mainHandler: Handler

    //========= Player's vars
    private var mAudioTrack: AudioTrack? = null
    private var jitterBuffer: JitterBuffer? = null
    private var mPlayerSampleRate = 48000 // 16Khz
    private var mPlayerBufferSize = 10240
    private var mPlayerFormat: AudioFormat = AudioFormat.Builder()
        .setEncoding(mRecordFormat)
        .setChannelMask(mOutChannels)
        .setSampleRate(mPlayerSampleRate)
        .build()

    /** ======== Basic Plugin initialization ======== **/

    override fun onAttachedToEngine(@NonNull flutterPluginBinding: FlutterPlugin.FlutterPluginBinding) {
        onAttachedToEngine(flutterPluginBinding.applicationContext, flutterPluginBinding.binaryMessenger)
    }

    // This static function is optional and equivalent to onAttachedToEngine. It supports the old
    // pre-Flutter-1.12 Android projects. You are encouraged to continue supporting
    // plugin registration via this function while apps migrate to use the new Android APIs
    // post-flutter-1.12 via https://flutter.dev/go/android-project-migration.
    //
    // It is encouraged to share logic between onAttachedToEngine and registerWith to keep
    // them functionally equivalent. Only one of onAttachedToEngine or registerWith will be called
    // depending on the user's project. onAttachedToEngine or registerWith must both be defined
    // in the same class.
    companion object {
        @JvmStatic
        fun registerWith(registrar: Registrar) {
            val plugin = SoundStreamPlugin()
            plugin.currentActivity = registrar.activity()
            registrar.addRequestPermissionsResultListener(plugin)
            plugin.onAttachedToEngine(registrar.context(), registrar.messenger())
        }
    }

    override fun onMethodCall(@NonNull call: MethodCall, @NonNull result: Result) {
        try {
            when (call.method) {
                "hasPermission" -> hasPermission(result)
                "initializeRecorder" -> initializeRecorder(call, result)
                "startRecording" -> startRecording(result)
                "stopRecording" -> stopRecording(result)
                "initializePlayer" -> initializePlayer(call, result)
                "startPlayer" -> startPlayer(result)
                "stopPlayer" -> stopPlayer(result)
                "writeChunk" -> writeChunk(call, result)
                else -> result.notImplemented()
            }
        } catch (e: Exception) {
            Log.e(logTag, "Unexpected exception", e)
            result.error(
                SoundStreamErrors.Unknown.name,
                "Unexpected exception", e.localizedMessage
            )
        }
    }

    private fun onAttachedToEngine(applicationContext: Context, messenger: BinaryMessenger) {
        pluginContext = applicationContext
        methodChannel = MethodChannel(messenger, methodChannelName)
        methodChannel.setMethodCallHandler(this)
    }

    override fun onDetachedFromEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
        methodChannel.setMethodCallHandler(null)
        mListener?.onMarkerReached(null)
        mListener?.onPeriodicNotification(null)
        mListener = null
        mRecorder?.stop()
        mRecorder?.release()
        mAudioTrack?.release()
        mAudioTrack?.stop()
        mRecorder = null
        mAudioTrack = null
        codec.decoderRelease()
        codec.encoderRelease()
        noiseSuppressor?.release()
        automaticGainControl?.release()
        acousticEchoCanceler?.release()
        mainHandler.removeCallbacks(playWithJitterBuffer)
    }

    override fun onDetachedFromActivity() {
        // currentActivity
    }

    override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
        currentActivity = binding.activity
        binding.addRequestPermissionsResultListener(this)
    }

    override fun onAttachedToActivity(binding: ActivityPluginBinding) {
        currentActivity = binding.activity
        binding.addRequestPermissionsResultListener(this)
    }

    override fun onDetachedFromActivityForConfigChanges() {
        // currentActivity = null
    }

    /** ======== Plugin methods ======== **/
    private fun hasRecordPermission(): Boolean {
        if (permissionToRecordAudio) return true
        val localContext = pluginContext
        permissionToRecordAudio = localContext != null && ContextCompat.checkSelfPermission(
            localContext,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
        return permissionToRecordAudio
    }

    private fun hasPermission(result: Result) {
        result.success(hasRecordPermission())
    }

    private fun requestRecordPermission() {
        val localActivity = currentActivity
        if (!hasRecordPermission() && localActivity != null) {
            debugLog("requesting RECORD_AUDIO permission")
            ActivityCompat.requestPermissions(
                localActivity,
                arrayOf(Manifest.permission.RECORD_AUDIO), audioRecordPermissionCode
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>?,
        grantResults: IntArray?
    ): Boolean {
        when (requestCode) {
            audioRecordPermissionCode -> {
                if (grantResults != null) {
                    permissionToRecordAudio = grantResults.isNotEmpty() &&
                            grantResults[0] == PackageManager.PERMISSION_GRANTED
                }
                completeInitializeRecorder()
                return true
            }
        }
        return false
    }

    private fun sendEventMethod(name: String, data: Any) {
        val eventData: HashMap<String, Any> = HashMap()
        eventData["name"] = name
        eventData["data"] = data
        methodChannel.invokeMethod("platformEvent", eventData)
    }

    private fun debugLog(msg: String) {
        if (debugLogging) {
            Log.d(logTag, msg)
        }
    }

    // 初始化播放器
    private fun initializePlayer(@NonNull call: MethodCall, @NonNull result: Result) {
        // mPlayerSampleRate = call.argument<Int>("sampleRate") ?: mPlayerSampleRate
        mainHandler = Handler(Looper.getMainLooper())
        debugLogging = call.argument<Boolean>("showLogs") ?: false
        mPlayerFormat = AudioFormat.Builder()
            .setEncoding(mRecordFormat)
            .setChannelMask(mOutChannels)
            .setSampleRate(mPlayerSampleRate)
            .build()

        mPlayerBufferSize = AudioTrack.getMinBufferSize(mPlayerSampleRate, mOutChannels, mRecordFormat)

        if (mAudioTrack?.state == AudioTrack.STATE_INITIALIZED) {
            mAudioTrack?.release()
        }

        val audioAttributes = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
            .build()
        mAudioTrack = AudioTrack(audioAttributes, mPlayerFormat, mPlayerBufferSize, AudioTrack.MODE_STREAM, AudioManager.AUDIO_SESSION_ID_GENERATE)

        result.success(true)
        sendPlayerStatus(SoundStreamStatus.Initialized)
    }

    // 接受buffer播放流
    private fun writeChunk(@NonNull call: MethodCall, @NonNull result: Result) {
        val data = call.argument<ByteArray>("data")
        if (data != null) {
            try {
                if(jitterBuffer == null) {
                    jitterBuffer = JitterBuffer(mPlayerSampleRate, mPlayerBufferSize)
                }
                val decoded: ByteArray? = codec.decode(data, Constants.FrameSize._960())
                if (decoded != null) {
                    println("保存buffer $decoded")
                    jitterBuffer!!.push(decoded)
                }
                result.success(true)
            } catch (e: Exception) {
                result.error(SoundStreamErrors.FailedToWriteBuffer.name, "写入失败 Failed to write Player buffer", e.message)
            }
        } else {
            result.error(SoundStreamErrors.FailedToWriteBuffer.name, "Failed to write Player buffer", "'data' is null")
        }
    }

    // 插入播放流buffer
    private fun pushPlayerChunk() {
        try {
            if (jitterBuffer == null) {
                return
            }
            val getArray: ByteArray? = jitterBuffer!!.pop()
            val buffer: ByteBuffer? = getArray?.let { ByteBuffer.wrap(it) }
            if (buffer != null) {
                val shortBuffer = ShortBuffer.allocate(getArray.size / 2)
                shortBuffer.put(buffer.order(ByteOrder.LITTLE_ENDIAN).asShortBuffer())
                val shortChunk = shortBuffer.array()
                mAudioTrack?.write(shortChunk, 0, shortChunk.size)
            }
        } catch (e: Exception) {
            println("播放失败 $e")
        }
    }

    // 没20毫秒运行一次，读取录音buffer，循环模式入口方法
    private val playWithJitterBuffer = object : Runnable {
        override fun run() {
            pushPlayerChunk()
            mainHandler.postDelayed(this, 20)
        }
    }

    private fun startPlayer(result: Result) {
        try {
            if (mAudioTrack?.state == AudioTrack.PLAYSTATE_PLAYING) {
                result.success(true)
                return
            }

            mAudioTrack!!.play()
            mainHandler.post(playWithJitterBuffer)
            sendPlayerStatus(SoundStreamStatus.Playing)
            result.success(true)
        } catch (e: Exception) {
            result.error(SoundStreamErrors.FailedToPlay.name, "Failed to start Player", e.localizedMessage)
        }
    }

    private fun stopPlayer(result: Result) {
        try {
            if (mAudioTrack?.state == AudioTrack.STATE_INITIALIZED) {
                mAudioTrack?.stop()
            }
            mainHandler.removeCallbacks(playWithJitterBuffer)
            jitterBuffer?.clear();
            jitterBuffer = null
            sendPlayerStatus(SoundStreamStatus.Stopped)
            result.success(true)
        } catch (e: Exception) {
            result.error(SoundStreamErrors.FailedToStop.name, "Failed to stop Player", e.localizedMessage)
        }
    }

    private fun sendPlayerStatus(status: SoundStreamStatus) {
        sendEventMethod("playerStatus", status.name)
    }

    private fun startRecording(result: Result) {
        try {
            if (mRecorder!!.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                result.success(true)
                return
            }
            initRecorder()
            mRecorder!!.startRecording()
            sendRecorderStatus(SoundStreamStatus.Playing)
            result.success(true)
        } catch (e: IllegalStateException) {
            debugLog("record() failed")
            result.error(SoundStreamErrors.FailedToRecord.name, "Failed to start recording", e.localizedMessage)
        }
    }

    private fun stopRecording(result: Result) {
        if(mRecorder == null) {
            return
        }
        try {
            if (mRecorder!!.recordingState == AudioRecord.RECORDSTATE_STOPPED) {
                result.success(true)
                return
            }
            mRecorder!!.stop()
            // 循环模式下，停止录音的时候要清楚循环
            //  mainHandler.removeCallbacks(getShortArrayMethod)
            sendRecorderStatus(SoundStreamStatus.Stopped)
            result.success(true)
        } catch (e: IllegalStateException) {
            debugLog("record() failed")
            result.error(SoundStreamErrors.FailedToRecord.name, "Failed to start recording", e.localizedMessage)
        }
    }

    private fun sendRecorderStatus(status: SoundStreamStatus) {
        sendEventMethod("recorderStatus", status.name)
    }


    private fun initializeRecorder(@NonNull call: MethodCall, @NonNull result: Result) {
        //  mRecordSampleRate = call.argument<Int>("sampleRate") ?: mRecordSampleRate
        //  循环的方式，打开这个

        debugLogging = call.argument<Boolean>("showLogs") ?: false
        minBufferSize = AudioRecord.getMinBufferSize(mRecordSampleRate, mInChannels, mRecordFormat)
        mRecorderBufferSize = minBufferSize * 2
        activeResult = result

        initializeCodec()

        val localContext = pluginContext
        if (null == localContext) {
            completeInitializeRecorder()
            return
        }
        permissionToRecordAudio = ContextCompat.checkSelfPermission(
            localContext,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
        if (!permissionToRecordAudio) {
            requestRecordPermission()
        } else {
            debugLog("has permission, completing")
            completeInitializeRecorder()
        }
        debugLog("leaving initializeIfPermitted")
    }


    private fun completeInitializeRecorder() {
        debugLog("completeInitialize")
        val initResult: HashMap<String, Any> = HashMap()

        if (permissionToRecordAudio) {
            mRecorder?.release()
            initRecorder()
            initResult["isMeteringEnabled"] = true
            sendRecorderStatus(SoundStreamStatus.Initialized)
        }

        initResult["success"] = permissionToRecordAudio
        debugLog("sending result")
        activeResult?.success(initResult)
        debugLog("leaving complete")
        activeResult = null
    }

    // 在Recorder初始化之前开启 MODE_IN_COMMUNICATION 模式，配合前面两种测试方法： chooseAudioMode(AudioManager.MODE_IN_COMMUNICATION,true)
    private fun chooseAudioMode(enableAec: Boolean) {
        val audioManager = pluginContext!!.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        audioManager.mode = if (enableAec) AudioManager.MODE_IN_COMMUNICATION else AudioManager.MODE_NORMAL
        // 打开免提
        audioManager.isSpeakerphoneOn = enableAec
    }

    @SuppressLint("MissingPermission")
    private fun initRecorder() {
        if (mRecorder?.state == AudioRecord.STATE_INITIALIZED) {
            return
        }
        if (!permissionToRecordAudio) {
            return
        }
        // 初始化之前要提前打开降噪
        chooseAudioMode(true)
        mRecorder = AudioRecord(MediaRecorder.AudioSource.VOICE_COMMUNICATION, mRecordSampleRate, mInChannels, mRecordFormat, mRecorderBufferSize)
        // 回声消除
        if (NoiseSuppressor.isAvailable()) {
            noiseSuppressor = NoiseSuppressor.create(mRecorder!!.audioSessionId)
            noiseSuppressor?.enabled = true
        } else {
            println("NoiseSuppressor.isAvailable() ${NoiseSuppressor.isAvailable()}")
        }
        // 自动增益控制
        if (AutomaticGainControl.isAvailable()) {
            automaticGainControl = AutomaticGainControl.create(mRecorder!!.audioSessionId)
            automaticGainControl?.enabled = true
        } else {
            println("AutomaticGainControl.isAvailable() ${AutomaticGainControl.isAvailable()}")
        }
        // 回声消除
        if (AcousticEchoCanceler.isAvailable()) {
            acousticEchoCanceler = AcousticEchoCanceler.create(mRecorder!!.audioSessionId)
            acousticEchoCanceler?.enabled = true
        } else {
            println("AcousticEchoCanceler.isAvailable() ${AcousticEchoCanceler.isAvailable()}")
        }
        if (mRecorder != null) {
            // 监听的方式
            mListener = createRecordListener()
            /** for non-blocking read we simply go for 20ms */
            mRecorder?.positionNotificationPeriod = mRecordSampleRate * 2 / 100 // 8000 => 160
            mRecorder?.setRecordPositionUpdateListener(mListener)
            // 循环的方式
            // mainHandler.post(getShortArrayMethod)
        }
    }

    // 初始化编码
    private fun initializeCodec() {
        codec.encoderInit(Constants.SampleRate._48000(), Constants.Channels.mono(), Constants.Application.voip())
        codec.decoderInit(Constants.SampleRate._48000(), Constants.Channels.mono())
        codec.encoderSetComplexity(Constants.Complexity.instance(10))                // set the complexity
        codec.encoderSetBitrate(Constants.Bitrate.auto())
    }

    // 没20毫秒运行一次，读取录音buffer，循环模式入口方法
    private val getShortArrayMethod = object : Runnable {
        @RequiresApi(Build.VERSION_CODES.M)
        override fun run() {
            onPeriodicNotificationMethod(mRecorder!!)
            // mainHandler.postDelayed(this, 20)
        }
    }

    // 没20毫秒运行一次，读取录音buffer
    @RequiresApi(Build.VERSION_CODES.M)
    fun onPeriodicNotificationMethod(recorder: AudioRecord) {
        var nowTime = Date().time
        // 8000采样率，每20ms 160采集点，获取的数据不超过320，实际是244
        // codec 编码是每20ms的数据进行编码
        prevTimestamp = nowTime
        val data = ShortArray(minBufferSize * 2)
        val shortOut = recorder.read(data, 0, minBufferSize * 2, AudioRecord.READ_NON_BLOCKING)
        // this condistion to prevent app crash from happening in Android Devices
        // See issues: https://github.com/CasperPas/flutter-sound-stream/issues/25
        if (shortOut <= 0) {
            return
        }
        val readData: ShortArray = data.copyOfRange(0, shortOut)
        // 插入队列
        audioDataQueue = if (audioDataQueue == null) {
            readData
        } else {
            audioDataQueue!!.plus(readData)
        }
        // 取出队列160个并发送到flutter
        // 把采集的数据进行队列处理，每超过160就进行一次推流，不够等凑齐，超过就while循环推送
        while (audioDataQueue != null && audioDataQueue!!.size >= 960) {
            val willSend: ShortArray = audioDataQueue!!.sliceArray(0..959)
            // 编码并发送
            val encoded: ShortArray? = codec.encode(willSend, Constants.FrameSize._960())
            val byteBuffer = ByteBuffer.allocate(encoded!!.size * 2)
            byteBuffer.order(ByteOrder.LITTLE_ENDIAN).asShortBuffer().put(encoded)
            sendEventMethod("dataPeriod", byteBuffer.array())

            audioDataQueue = if (audioDataQueue!!.size > 960) {
                audioDataQueue!!.copyOfRange(960, audioDataQueue!!.size - 1)
            } else {
                null
            }
        }
    }

    private fun createRecordListener(): OnRecordPositionUpdateListener? {
        return object : OnRecordPositionUpdateListener {
            override fun onMarkerReached(recorder: AudioRecord) {
                // recorder.read(audioData!!, 0, minBufferSize, AudioRecord.READ_NON_BLOCKING)
            }

            @RequiresApi(Build.VERSION_CODES.M)
            override fun onPeriodicNotification(recorder: AudioRecord) {
                onPeriodicNotificationMethod(recorder)
            }
        }
    }
}
