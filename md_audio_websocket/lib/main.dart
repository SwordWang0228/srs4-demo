import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:md_audio_websocket/DelayDetection.dart';
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

  IO.Socket? socket;

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
      body: Center(child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          FloatingActionButton(
            backgroundColor: (socket?.connected ?? false) ? Colors.green : Colors.blue,
            onPressed: () {
              if (_isPlaying) {
                _player.stop();
              } else {
                _play();
              }
              setState(() {});
            },
            tooltip: 'socket',
            child: Icon(_isPlaying ? Icons.pause : Icons.play_arrow),
          ),
          const Divider(
            height: 40,
            color: Colors.transparent,
          ),
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
          const Divider(
            height: 40,
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
      )),
    );
  }

  Future<void> stopRecord() async {
    await _recorder.stop();
    setState(() {
      _isRecording = false;
    });

  }

  Future<void> startRecord() async {
    await _recorder.start();
    setState(() {
      _isRecording = true;
    });
  }

  Future<void> initRecorder() async {
    int prevTime = DateTime.now().millisecondsSinceEpoch;
    _audioStream = _recorder.audioStream.listen((data) {
      int nowTime = DateTime.now().millisecondsSinceEpoch;

      print("audioStream ${data}");
      prevTime = nowTime;

      Map audioMsg = {
        "sts": nowTime,
        "dts": DelayDetection.ins().getRemoteTime(nowTime),
        "data": data,
        "samplerate": "48000"
      };
      if(socket != null) {
        print('>>>>> emit audio ${nowTime - prevTime}ms send ${data.length} >>>>>>');
        socket!.emit('audio', audioMsg);
      }
    });

    _recorderStatus = _recorder.status.listen((status) {
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
      _recorder.initialize(),
      _player.initialize(),
      // _player.start()
    ]);
  }

  void _play() async {
    await _player.start();
  }

  void initSocket() {
    socket = IO.io('ws://192.168.2.48:3000/',
        IO.OptionBuilder().enableForceNew().enableAutoConnect().setTransports(['websocket']).setTimeout(5000).build());
    socket!.onConnect((_) {
      Map syncReqest = {'sts': DateTime.now().millisecondsSinceEpoch};
      socket!.emit('login', { "userName": "flutterClient" });
      socket!.emit('SyncReqest', syncReqest);
      setState(() { });
    });
    socket!.onDisconnect((_) => print('disconnect'));
    //
    // socket!.on('SyncReqest', (msg) {
    //   print('>>>>> SyncReqest ${msg} >>>>>>');
    //   int nowTime = DateTime.now().millisecondsSinceEpoch;
    //   DelayDetection.ins().updateTimestamp(msg['sts'], null, nowTime);
    //   Map syncRespone = {'sts': nowTime};
    //   socket!.emit('SyncResponse', syncRespone);
    // });

    socket!.on('error', (msg) {
      print('>>>>> error $msg >>>>>>');
    });

    socket!.on('SyncResponse', (msg) {
      DelayDetection.ins().updateTimestamp(msg['sts'], null, DateTime.now().millisecondsSinceEpoch);
      print('>>>>> SyncResponse ${msg} >>>>>>');
    });

    int prevTime = DateTime.now().millisecondsSinceEpoch;
    socket!.on('audio', (msg) async {
      int nowTime = DateTime.now().millisecondsSinceEpoch;
      DelayDetection.ins().updateTimestamp(msg['sts'], msg['dts'], nowTime);
      // print('>>>>> on audio ${nowTime - prevTime}ms send ${msg['data'].length} >>>>>>');
      prevTime = nowTime;
      // 需要计算下speed, 根据delay时间去计算
      _player.writeChunk(msg['data'] as Uint8List, speed: 1.0);
      // print('>>>>> audio ${msg['samplerate']} >>>>>>');
      // print('>>>>> audio ${msg['data']} >>>>>>');
    });

  }

  void stopSocket() {
    socket?.dispose();
  }
}
