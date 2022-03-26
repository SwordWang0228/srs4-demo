import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'sound_stream/sound_stream.dart';

Future<void> main() async {
  runApp(const MyApp());
}
const int CHANNEL_OUT_MONO = 4;
// class ResampleParam {
//   int? inputsamples;
//   int? outputsamples;
//   int channels = CHANNEL_OUT_MONO;
//   int sum = 0;
//   double? dis;
//   List<double> databuffer = List.filled(3*CHANNEL_OUT_MONO, 0.0).toList();
// }
class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key}) : super(key: key);

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  final int tSampleRate = 44000;
  final RecorderStream _recorder = RecorderStream();
  final PlayerStream _player = PlayerStream();
  bool _isRecording = false;
  bool _isPlaying = false;

  StreamSubscription? _recorderStatus;
  StreamSubscription? _playerStatus;
  StreamSubscription? _audioStream;
  // ResampleParam resampleParam = ResampleParam();

  IO.Socket? socket;

  int snCount = 1;


  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    initRecorder();
  }

  @override
  void dispose() {
    socket?.dispose();
    _recorderStatus?.cancel();
    _playerStatus?.cancel();
    _audioStream?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("audio_websocket_demo"),
      ),
      body: Center(child: Container()),
      floatingActionButton: SizedBox(
        height: 100,
        width: MediaQuery.of(context).size.width,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            FloatingActionButton(
              backgroundColor: (socket?.connected ?? false) ? Colors.green : Colors.blue,
              onPressed: () {
                if (socket?.connected ?? false) {
                  stopSocket();
                } else {
                  initSocket();
                }
                setState(() {});
              },
              tooltip: 'socket',
              child: Icon((socket?.connected ?? false) ? Icons.link : Icons.link_off),
            ),
            const VerticalDivider(
              width: 20,
              color: Colors.transparent,
            ),
            FloatingActionButton(
              backgroundColor: !_isRecording ? Colors.blue : Colors.red,
              onPressed: () {
                if (!_isRecording) {
                  startRecord();
                } else {
                  stopRecord();
                }
                setState(() {});
              },
              tooltip: 'record',
              child: Icon(!_isRecording ? Icons.record_voice_over : Icons.stop_rounded),
            ),
          ],
        ),
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }

  Future<void> stopRecord() async {
    await _recorder.stop();
    await _player.start();
    setState(() {
      _isRecording = false;
    });

  }
  // app: 2048
  // bufferSize: 1024
  // channels: 1
  // frameDuration: 20
  // sampleRate: 8000
  Future<void> startRecord() async {
    await _player.stop();
    await _recorder.start();
    setState(() {
      _isRecording = true;
    });
  }
  // static float CubicInterpolate(float y0, float y1, float y2, float y3, float x) {
  //   float a, b, c, d;
  //   a = y0 / -6.0 + y1 / 2.0 - y2 / 2.0 + y3 / 6.0;
  //   b = y0 - 5.0 * y1 / 2.0 + 2.0 * y2 - y3 / 2.0;
  //   c = -11.0 * y0 / 6.0 + 3.0 * y1 - 3.0 * y2 / 2.0 + y3 / 3.0;
  //   d = y0;
  //   float xx = x * x;
  //   float xxx = xx * x;
  //   return (a * xxx + b * xx + c * x + d);
  // }

  // resampleInit(ResampleParam param,int inSampleRate,int outSampleRate,int channels) {
  //   double blockms = 70;
  //   param.sum = 0;
  //   param.channels = channels;
  //   param.dis = inSampleRate/outSampleRate;
  //   for ( int i= 0; i < 3*CHANNEL_OUT_MONO; i++)
  //   {
  //     param.databuffer[i] = 0;
  //   }
  //   param.inputsamples = inSampleRate * (blockms/1000).floor();
  //   param.outputsamples = outSampleRate * (blockms/1000).floor();
  // }

  // resampleProcess(ResampleParam param, Float32List pData, ) {
  //   List<double> buffero = List.filled(13440, 0.0).toList();
  //   int ch = param.channels;
  //   int idx;
  //   List buffer = List.filled(4, 0);
  //   List<double> databuf = param.databuffer;
  //   for ( int i = 0 ; i < param.outputsamples!; i++) {
  //     for ( int k = 0; k < ch; k++) {
  //       for ( int j = 0; j <= 3; j++) {
  //         idx = param.sum + j;
  //         if ( idx < 3 ) {
  //           buffer[j] = databuf[idx*ch+k];
  //         } else {
  //           buffer[j] = pData[(idx-3)*ch+k];
  //         }
  //       }
  //     }
  //   }
  //   return Int16List.view(pData.buffer);
  // }
  Future<void> initRecorder() async {
    // resampleInit(resampleParam, 44100, 8000, CHANNEL_OUT_MONO);
    int prevTime = DateTime.now().millisecondsSinceEpoch;
    // await _recorder.audioStream.transform().cast<Uint8List>();
    _audioStream = _recorder.audioStream.listen((data) {
      // Float32List pData = data.buffer.asFloat32List();
      // Int16List newData = resampleProcess(resampleParam, pData);
      int nowTime = DateTime.now().millisecondsSinceEpoch;

      print("audioStream ${data}");
      print('>>>>> audio ${nowTime - prevTime}ms send ${data.length} >>>>>>');
      prevTime = nowTime;

      Map audioMsg = {
        "sts": nowTime,
        "dts": nowTime,
        "sn": snCount,
        "data": data,
      };
      snCount++;
      if(socket != null) {
        socket!.emit('audio', audioMsg);
      }
    });

    _recorderStatus = _recorder.status.listen((status) {
      print("_recorderStatus $status");
      if (mounted) {
        setState(() {
          _isRecording = status == SoundStreamStatus.Playing;
        });
      }
    });

    _playerStatus = _player.status.listen((status) {
      print("_playerStatus $status");
      if (mounted) {
        setState(() {
          _isPlaying = status == SoundStreamStatus.Playing;
        });
      }
    });

    await Future.wait([
      _recorder.initialize(sampleRate: 44000),
      _player.initialize(),
    ]);
  }

  void initSocket() {
    socket = IO.io('ws://192.168.2.48:3000/',
        IO.OptionBuilder().enableForceNew().enableAutoConnect().setTransports(['websocket']).setTimeout(5000).build());
    print('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> connect ${socket!.id} >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    socket!.onConnect((_) {
      Map syncReqest = {'sts': DateTime.now().millisecondsSinceEpoch};
      print('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> connect onConnect ${syncReqest['timestamp']} >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      socket!.emit('SyncReqest', syncReqest);
      setState(() { });
    });
    socket!.onDisconnect((_) => print('disconnect'));

    socket!.on('SyncReqest', (msg) {
      print('>>>>> SyncReqest ${msg['timestamp']} >>>>>>');
      Map syncRespone = {'sts': DateTime.now().millisecondsSinceEpoch};
      socket!.emit('SyncResponse', syncRespone);
    });

    socket!.on('SyncResponse', (msg) {
      print('>>>>> SyncResponse ${msg['timestamp']} >>>>>>');
    });

    int prevTime = DateTime.now().millisecondsSinceEpoch;
    socket!.on('audio', (msg) {
      int nowTime = DateTime.now().millisecondsSinceEpoch;
      // print('>>>>> audio ${nowTime - prevTime}ms send ${msg['data'].length} >>>>>>');
      prevTime = nowTime;
      // print('>>>>> audio ${msg} >>>>>>');
      // print('>>>>> audio ${msg['data'].length} >>>>>>');
      // print('>>>>> audio ${msg['data']} >>>>>>');
    });

  }

  void stopSocket() {
    socket?.dispose();
  }
}
